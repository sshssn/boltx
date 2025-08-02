# Admin Dashboard Setup

This document explains how to set up and use the admin dashboard for boltX.

## Features

The admin dashboard provides the following features:

### Overview
- Total users count
- Active support tickets
- Pro users statistics
- Messages usage today
- Recent activity feed

### User Management
- View all registered users
- Search users by email or username
- Update user roles (client/admin)
- View user plans and usage statistics

### Support Tickets
- View all support tickets from users
- Filter tickets by status (open, in progress, resolved, closed)
- Search tickets by subject or description
- Reply to tickets as admin
- Update ticket status
- View ticket history and replies

### Analytics
- User growth charts (placeholder)
- Message usage analytics (placeholder)

### Settings
- System configuration options (placeholder)

## Database Schema

The following new tables have been added:

### User Table Updates
- `role` field: 'admin' or 'client' (default: 'client')

### New Tables
- `Ticket`: Stores support tickets
- `TicketReply`: Stores ticket replies
- `AdminMetadata`: Stores admin configuration

## Setup Instructions

### 1. Run Database Migrations

The database migrations have already been generated and applied. The new tables and fields are now available.

### 2. Set Up Admin User

To make an existing user an admin, run:

```bash
node scripts/setup-admin.js user@example.com
```

Replace `user@example.com` with the email of the user you want to make an admin.

### 3. Access Admin Dashboard

Once a user has admin role, they can access the admin dashboard at:

```
/admin
```

## API Endpoints

### Admin Stats
- `GET /api/admin/stats` - Get dashboard statistics

### User Management
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/[id]` - Update user role

### Ticket Management
- `GET /api/admin/tickets` - Get all tickets with replies
- `PATCH /api/admin/tickets/[id]` - Update ticket status
- `POST /api/admin/tickets/[id]/reply` - Add admin reply to ticket

### User Ticket Creation
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets` - Get user's tickets

## User Interface

### Client Account Dashboard Updates

The client account dashboard now includes a "Contact" tab with:

1. **Create Support Ticket Form**
   - Ticket type selection (bug, feature, support)
   - Priority selection (low, medium, high, urgent)
   - Subject and description fields
   - Submit button

2. **My Support Tickets**
   - View all tickets submitted by the user
   - See ticket status, type, and priority
   - View ticket creation date

### Admin Dashboard

The admin dashboard includes:

1. **Overview Tab**
   - Statistics cards
   - Recent activity feed

2. **Users Tab**
   - User table with search and filtering
   - Role management dropdown
   - User details and statistics

3. **Support Tickets Tab**
   - Ticket list with search and filtering
   - Status management
   - Reply functionality
   - Ticket details and history

4. **Analytics Tab**
   - Charts and metrics (placeholder)

5. **Settings Tab**
   - System configuration (placeholder)

## Security

- Only users with `role: 'admin'` can access the admin dashboard
- All admin API endpoints check for admin role
- Regular users can only create and view their own tickets
- Admin users can view and manage all tickets

## Usage

### For Users
1. Go to Account Dashboard
2. Click on "Contact" tab
3. Fill out the support ticket form
4. Submit the ticket
5. View ticket status in "My Support Tickets" section

### For Admins
1. Access `/admin` dashboard
2. View overview statistics
3. Manage users in the Users tab
4. Handle support tickets in the Support Tickets tab
5. Reply to tickets and update their status

## Future Enhancements

- Email notifications for new tickets
- Ticket assignment to specific admins
- Advanced analytics and reporting
- Bulk user management
- System maintenance mode
- Rate limiting configuration 