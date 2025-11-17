import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cocopops-secret-key-change-in-production'
);

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AuthUser;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user || !user.password) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: string
): Promise<AuthUser> {
  const db = await getDb();
  const hashedPassword = await hashPassword(password);
  
  const result = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    role,
    openId: `local_${email}`, // Generate a unique openId for local auth
    loginMethod: 'local',
  });

  // MySQL doesn't support returning(), so we fetch the user
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
