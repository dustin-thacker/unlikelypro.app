import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jwtVerify } from 'jose';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'cocopops-dev-secret-key-change-in-production-2024';
const COOKIE_NAME = 'manus-session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookie
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!DATABASE_URL) {
      console.error('DATABASE_URL not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get user from database
    const connection = await mysql.createConnection(DATABASE_URL);
    const [rows] = await connection.execute(
      'SELECT id, email, name, role, loginMethod, client, createdAt, updatedAt, lastSignedIn FROM users WHERE id = ?',
      [payload.userId]
    );
    await connection.end();

    const users = rows as any[];
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json({ user: users[0] });
  } catch (error) {
    console.error('[Auth] Me error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
