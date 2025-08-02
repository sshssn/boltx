// Simple script to disable maintenance mode
// Run this with: node scripts/disable-maintenance.js

const fetch = require('node-fetch');

async function disableMaintenance() {
  try {
    // First, try to disable maintenance mode by setting it to false
    const response = await fetch(
      'http://localhost:3000/api/admin/maintenance',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenanceMode: false,
          message: '',
          duration: '',
        }),
      },
    );

    if (response.ok) {
      console.log('✅ Maintenance mode disabled successfully!');
    } else {
      console.log('❌ Failed to disable maintenance mode via API');
      console.log('Status:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

disableMaintenance();
