import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/_core/auth';
import 'dotenv/config';

async function updateAdminPassword() {
  try {
    const db = await getDb();
    const hashedPassword = await hashPassword('admin123');
    
    // Update the admin user's password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, 'admin@cocopops.app'));
    
    console.log('✅ Admin password updated successfully!');
    console.log('Email: admin@cocopops.app');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
