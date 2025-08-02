// Script to check for admin users in the database
// Run this to see if there are any admin users

const { db } = require('../lib/db');
const { usersTable } = require('../lib/db/schema');

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking for admin users...\n');
    
    // Get all users
    const allUsers = await db.select().from(usersTable);
    
    console.log(`📊 Total users: ${allUsers.length}\n`);
    
    // Filter admin users
    const adminUsers = allUsers.filter(user => user.role === 'admin');
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      console.log('\nTo create an admin user:');
      console.log('1. Log in with your regular account');
      console.log('2. Use the admin dashboard to change your role to admin');
      console.log('3. Or manually update the database');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}\n`);
      });
    }
    
    // Show all users for reference
    console.log('📋 All users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  }
}

checkAdminUsers(); 