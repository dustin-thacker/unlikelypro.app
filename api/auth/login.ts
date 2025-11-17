import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { SignJWT } from 'jose';

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'cocopops-dev-secret-key-change-in-production-2024';
const COOKIE_NAME = 'manus-session';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!DATABASE_URL) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Connect to database
    const connection = await mysql.createConnection(DATABASE_URL);

    // Find user by email
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    await connection.end();

    const users = rows as any[];
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if user has a password (local auth)
    if (!user.password) {
      return res.status(401).json({ error: 'Invalid authentication method' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('365d')
      .sign(secret);

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${ONE_YEAR_MS / 1000}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
