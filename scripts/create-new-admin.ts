import { hashPassword } from '../server/_core/auth';
import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function createNewAdmin() {
  const db = await getDb();
  
  if (!db) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  
  const email = 'admin@theblkhse.com';
  const password = 'danger42!';
  const name = 'Admin User';
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  
  if (existingUser.length > 0) {
    console.log('User already exists, updating password...');
    const hashedPassword = await hashPassword(password);
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));
    console.log('✅ Password updated for:', email);
  } else {
    console.log('Creating new admin user...');
    const hashedPassword = await hashPassword(password);
    
    await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      loginMethod: 'local',
      openId: null,
    });
    
    console.log('✅ Admin user created successfully!');
  }
  
  console.log('\nLogin credentials:');
  console.log('Email:', email);
  console.log('Password:', password);
  
  process.exit(0);
}

createNewAdmin().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
