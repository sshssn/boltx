-- Set up admin user
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'sshssn@yahoo.com';

-- Verify the update
SELECT id, email, role, plan FROM "User" WHERE email = 'sshssn@yahoo.com'; 