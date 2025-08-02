const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function setupTestData() {
  try {
    const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
    const db = drizzle(connection);

    // Get admin user ID
    const adminUser = await connection`
      SELECT id FROM "User" WHERE role = 'admin' LIMIT 1
    `;

    if (adminUser.length === 0) {
      console.log('❌ No admin user found. Please run setup-admin.js first.');
      return;
    }

    const adminId = adminUser[0].id;

    // Create some test users
    const testUsers = [
      { email: 'test1@example.com', username: 'testuser1', plan: 'free' },
      { email: 'test2@example.com', username: 'testuser2', plan: 'pro' },
      { email: 'test3@example.com', username: 'testuser3', plan: 'free' },
    ];

    for (const user of testUsers) {
      try {
        await connection`
          INSERT INTO "User" (email, username, plan, role, user_type)
          VALUES (${user.email}, ${user.username}, ${user.plan}, 'client', ${user.plan})
        `;
      } catch (error) {
        // User might already exist, continue
        console.log(`User ${user.email} might already exist, skipping...`);
      }
    }

    // Get test user IDs
    const testUserIds = await connection`
      SELECT id FROM "User" WHERE email LIKE 'test%@example.com'
    `;

    // Create test tickets
    const testTickets = [
      {
        userId: testUserIds[0]?.id || adminId,
        type: 'bug',
        subject: 'Login button not working',
        description:
          'The login button on the homepage is not responding when clicked.',
        status: 'open',
        priority: 'high',
      },
      {
        userId: testUserIds[1]?.id || adminId,
        type: 'feature',
        subject: 'Add dark mode toggle',
        description:
          'Would be great to have a dark mode toggle in the settings.',
        status: 'in_progress',
        priority: 'medium',
      },
      {
        userId: testUserIds[2]?.id || adminId,
        type: 'support',
        subject: 'Payment issue',
        description:
          'Having trouble with the payment process for upgrading to Pro.',
        status: 'resolved',
        priority: 'urgent',
      },
    ];

    for (const ticket of testTickets) {
      const result = await connection`
        INSERT INTO "Ticket" ("userId", type, subject, description, status, priority)
        VALUES (${ticket.userId}, ${ticket.type}, ${ticket.subject}, ${ticket.description}, ${ticket.status}, ${ticket.priority})
        RETURNING id
      `;

      const ticketId = result[0]?.id;

      if (ticketId) {
        // Add some replies to tickets
        if (ticket.status === 'resolved') {
          await connection`
            INSERT INTO "TicketReply" ("ticketId", "userId", content, "isAdminReply")
            VALUES (${ticketId}, ${adminId}, 'This issue has been resolved. Please try the payment process again.', true)
          `;
        } else if (ticket.status === 'in_progress') {
          await connection`
            INSERT INTO "TicketReply" ("ticketId", "userId", content, "isAdminReply")
            VALUES (${ticketId}, ${adminId}, 'We are working on this feature. It should be available in the next update.', true)
          `;
        }
      }
    }

    // Add some admin metadata
    try {
      await connection`
        INSERT INTO "AdminMetadata" (key, value, description)
        VALUES 
          ('maintenance_mode', 'false', 'Whether the system is in maintenance mode'),
          ('rate_limit_requests_per_minute', '60', 'API rate limit per minute'),
          ('max_file_upload_size_mb', '10', 'Maximum file upload size in MB')
      `;
    } catch (error) {
      console.log('Admin metadata might already exist, skipping...');
    }

    console.log('✅ Test data created successfully');
    console.log('- 3 test users created');
    console.log('- 3 test tickets created');
    console.log('- Admin metadata added');

    await connection.end();
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();
