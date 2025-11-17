import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function createAdmin() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const email = 'admin@theblkhse.com';
  const password = 'danger42!';
  const name = 'Admin User';
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Check if user exists
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  
  if (existing.length > 0) {
    console.log('User exists, updating password...');
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    console.log('✅ Password updated!');
  } else {
    console.log('Creating new admin user...');
    await connection.execute(
      'INSERT INTO users (email, password, name, role, loginMethod, openId) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, 'admin', 'local', `local-${Date.now()}`]
    );
    console.log('✅ Admin user created!');
  }
  
  console.log('\nLogin credentials:');
  console.log('Email:', email);
  console.log('Password:', password);
  
  await connection.end();
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
