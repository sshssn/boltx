const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { hash } = require('bcrypt-ts');
require('dotenv').config({ path: '.env.local' });

async function setupAdmin() {
  try {
    // Create database connection using the same method as the project
    const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
    const db = drizzle(connection);

    const adminEmail = 'sshssn@yahoo.com';
    const adminPassword = 'Sarmad@9800_';

    // Hash the password
    const hashedPassword = await hash(adminPassword, 10);

    // Check if admin user already exists
    const existingUser = await connection`
      SELECT id, email, role FROM "User" WHERE email = ${adminEmail}
    `;

    if (existingUser.length > 0) {
      // Update existing user to admin - also update the password
      await connection`
        UPDATE "User" 
        SET role = 'admin', plan = 'admin', user_type = 'admin', password = ${hashedPassword}
        WHERE email = ${adminEmail}
      `;
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      await connection`
        INSERT INTO "User" (email, password, role, plan, user_type, username)
        VALUES (${adminEmail}, ${hashedPassword}, 'admin', 'admin', 'admin', 'admin')
      `;
      console.log('✅ Admin user created successfully');
    }

    console.log('Admin credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Role: admin');

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    process.exit(1);
  }
}

setupAdmin();
