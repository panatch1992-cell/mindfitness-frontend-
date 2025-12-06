# MindFitness Database Setup

## Overview
This guide explains how to set up the MySQL database connection for MindFitness APIs.

## Prerequisites
- Hostinger MySQL Database
- Database name: `u786472860_mindfitness_pa`

## Setup Steps

### 1. Run Migration Script
Import the `migration.sql` file into your Hostinger MySQL database:

```bash
# Using phpMyAdmin (recommended for Hostinger):
1. Log in to Hostinger hPanel
2. Go to MySQL Databases
3. Click phpMyAdmin
4. Select database: u786472860_mindfitness_pa
5. Click "Import" tab
6. Choose migration.sql file
7. Click "Go"
```

### 2. Set Environment Variables (Vercel)

Go to your Vercel project settings and add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DB_HOST` | `mysql.hostinger.com` | Hostinger MySQL host (check your hPanel) |
| `DB_NAME` | `u786472860_mindfitness_pa` | Database name |
| `DB_USER` | `u786472860_mindfitness_pa` | Database username (usually same as DB name) |
| `DB_PASSWORD` | `your_password` | Your database password |
| `DB_PORT` | `3306` | MySQL port (default) |
| `DB_SSL` | `false` | Enable SSL (optional) |

**Vercel Setup:**
1. Go to your Vercel project
2. Navigate to Settings > Environment Variables
3. Add each variable above
4. Redeploy your project

### 3. Local Development (.env.local)

Create a `.env.local` file in your project root:

```env
DB_HOST=mysql.hostinger.com
DB_NAME=u786472860_mindfitness_pa
DB_USER=u786472860_mindfitness_pa
DB_PASSWORD=your_password
DB_PORT=3306
```

**Note:** Never commit `.env.local` to git!

## Database Tables

### Vent Wall
- `vent_posts` - User posts
- `vent_likes` - Post likes
- `vent_replies` - Post replies

### Private Chat
- `private_chat_rooms` - Chat sessions
- `private_chat_messages` - Chat messages
- `chat_reports` - User reports

### Psychologist Booking
- `psychologists` - Therapist profiles
- `psy_appointments` - Booking records

## Testing Connection

After setup, test the connection by visiting:
```
/api/booking?action=list_therapists
```

If successful, you should see a list of therapists from the database.

## Troubleshooting

### Connection Refused
- Check if Hostinger MySQL allows external connections
- Verify the hostname in hPanel > MySQL Databases

### Access Denied
- Verify username and password
- Check if user has proper permissions

### SSL Required
- Set `DB_SSL=true` in environment variables

## Security Notes

1. **Never expose credentials** in client-side code
2. **Use environment variables** for all sensitive data
3. **Enable prepared statements** (already implemented in db.js)
4. **Regular backups** through Hostinger hPanel
