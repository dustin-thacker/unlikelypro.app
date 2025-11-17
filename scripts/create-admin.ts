import { createUser } from '../server/_core/auth';
import 'dotenv/config';

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const admin = await createUser(
      'admin@cocopops.app',
      'admin123',  // Change this password after first login!
      'Admin User',
      'admin'
    );

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
