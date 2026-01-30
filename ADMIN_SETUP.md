# Super Admin Panel Setup Guide

## Overview
A complete super admin panel has been created to manage all market operations including:
- Market creation, editing, and deletion
- Setting opening and closing times
- Declaring opening numbers (3 digits)
- Declaring closing numbers (3 digits)
- Setting win numbers (any format)

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Initial Admin User
```bash
npm run create-admin [username] [password]
```

Example:
```bash
npm run create-admin admin mySecurePassword123
```

**Important**: Change the default password after first login!

### 3. Start Backend Server
```bash
npm start
```

The server will run on `http://localhost:3010` (or PORT from .env)

## Frontend Admin Panel Setup

### 1. Install Dependencies
```bash
cd admin
npm install
```

### 2. Start Admin Panel
```bash
npm run dev
```

The admin panel will be available at `http://localhost:5173` (or the port shown)

### 3. Login
Use the credentials you created in step 2 of backend setup.

## Features

### Market Management
- **Create Market**: Add new markets with custom names and opening/closing times
- **Edit Market**: Update market name and times
- **Delete Market**: Remove markets permanently
- **View Status**: See real-time market status (upcoming/open/closed)

### Number Management
- **Set Opening Number**: Declare the 3-digit opening number
- **Set Closing Number**: Declare the 3-digit closing number
- **Set Win Number**: Declare the winning number (any format, e.g., "123" or "123-65-456")

## API Endpoints

### Public Endpoints
- `GET /api/v1/markets/get-markets` - Get all markets
- `GET /api/v1/markets/get-market/:id` - Get single market

### Protected Admin Endpoints (require authentication)
- `POST /api/v1/markets/create-market` - Create new market
- `PATCH /api/v1/markets/update-market/:id` - Update market
- `PATCH /api/v1/markets/set-opening-number/:id` - Set opening number
- `PATCH /api/v1/markets/set-closing-number/:id` - Set closing number
- `PATCH /api/v1/markets/set-win-number/:id` - Set win number
- `DELETE /api/v1/markets/delete-market/:id` - Delete market

### Admin Authentication
- `POST /api/v1/admin/login` - Admin login
- `POST /api/v1/admin/create` - Create new admin (for setup)

## Database Models

### Admin Model
- `username` (String, unique, required)
- `password` (String, hashed with bcrypt, required)
- `role` (String, default: 'super_admin')

### Market Model
- `marketName` (String, unique, required)
- `startingTime` (String, required) - Format: "HH:MM" (24-hour)
- `closingTime` (String, required) - Format: "HH:MM" (24-hour)
- `openingNumber` (String, 3 digits, optional)
- `closingNumber` (String, 3 digits, optional)
- `result` (String, computed automatically)
- `winNumber` (String, optional) - Any format

## Security Notes

⚠️ **Current Implementation**: Uses Basic Auth with username/password stored in sessionStorage.

🔒 **For Production**: 
- Implement JWT tokens instead of Basic Auth
- Use secure HTTP-only cookies
- Add rate limiting
- Implement proper session management
- Add CSRF protection

## Time Format

Markets use 24-hour time format (HH:MM) for opening and closing times. The admin panel uses HTML5 time input which automatically handles this format.

## Troubleshooting

1. **Cannot login**: Make sure you've created an admin user using `npm run create-admin`
2. **API errors**: Ensure backend server is running on port 3010
3. **CORS errors**: Backend has CORS enabled, but check if frontend URL matches
4. **Market status not updating**: Refresh the page to see latest status
