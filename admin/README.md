# Super Admin Panel

This is the super admin panel for managing markets, including:
- Market creation, editing, and deletion
- Setting opening and closing numbers
- Declaring win numbers
- Managing market opening and closing times

## Setup

1. Make sure the backend server is running on `http://localhost:3010`

2. Create an admin user (run from backend directory):
   ```bash
   npm run create-admin [username] [password]
   ```
   Example:
   ```bash
   npm run create-admin admin mypassword123
   ```

3. Start the admin panel:
   ```bash
   npm run dev
   ```

4. Login with your admin credentials at `http://localhost:5173` (or the port shown)

## Features

- **Login**: Secure admin authentication
- **Dashboard**: View all markets with their current status
- **Create Market**: Add new markets with custom opening/closing times
- **Edit Market**: Update market name and times
- **Delete Market**: Remove markets
- **Set Numbers**: 
  - Set opening number (3 digits)
  - Set closing number (3 digits)
  - Declare win number (any format)

## API Base URL

The admin panel connects to `http://localhost:3010/api/v1` by default. Update `API_BASE_URL` in the component files if your backend runs on a different port.
