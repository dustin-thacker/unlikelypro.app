import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function checkUser() {
  try {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, 'admin@cocopops.app')).limit(1);
    
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Has password:', user.password ? 'YES' : 'NO');
      console.log('Password hash length:', user.password?.length || 0);
      console.log('Login method:', user.loginMethod);
    } else {
      console.log('❌ Admin user not found in database!');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
