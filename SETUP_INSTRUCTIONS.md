# Management Portal Setup Instructions

## Overview
A complete management portal has been added to your Clean Your Square website with the following features:

1. **Portal Login** - Administrator login page
2. **Clients Management** - View, search, and edit clients with clickable contact info (phone/email)
3. **Employees Management** - View, search, and edit employees with clickable contact info
4. **Transactions Management** - View and edit past transactions with full details (client, employee, time, address)
5. **Booking Form** - Auto-saves website booking submissions to the portal
6. **Dashboard** - Real-time statistics from the backend

## Installation Steps

### 1. Install Frontend Dependencies
Navigate to the `client` directory and install required packages:

```bash
cd client
npm install react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material
```

### 2. Backend Setup
The backend is already configured with:
- Booking routes and controller (`backend/routes/bookings.js`, `backend/controllers/bookingController.js`)
- Transaction routes and controller (`backend/routes/transactions.js`, `backend/controllers/transactionController.js`)
- Updated models to support public bookings (createdBy is now optional)

### 3. Environment Variables
Make sure your `.env` file in the `backend` directory includes:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Backend server port (default: 5000)

### 4. Start the Application

**Backend:**
```bash
cd backend
node server.js
```

**Frontend:**
```bash
cd client
npm run dev
```

## Features Implemented

### Website Booking Form
- Added to `index.html` - modal form that submits to `/api/bookings`
- Auto-creates client if email doesn't exist
- Saves booking with status "pending"
- Form validation and error handling

### Management Portal Pages

#### Login (`/login`)
- Email/password authentication
- JWT token storage
- Protected routes redirect to login if not authenticated

#### Dashboard (`/dashboard`)
- Real-time statistics:
  - Total Clients
  - Upcoming Bookings
  - Monthly Revenue
  - Completed Jobs

#### Clients Page (`/clients`)
- List all clients with search and status filter
- Clickable phone numbers (tel: links)
- Clickable email addresses (mailto: links)
- Edit dialog for updating client information
- Status badges (Lead, Active, Inactive, Do Not Contact)

#### Employees Page (`/employees`)
- List all employees with search and role filter
- Clickable phone numbers and email addresses
- Edit dialog for updating employee information
- Active/Inactive status indicators

#### Transactions Page (`/transactions`)
- List all transactions with status filter
- Shows:
  - Transaction ID
  - Client name and email
  - Amount and payment method
  - Date and time
  - Service address
  - Employee/Contractor names
  - Transaction status
- Edit dialog for updating transaction details

## API Endpoints

### Public Endpoints
- `POST /api/bookings` - Create booking from website form (no auth required)

### Protected Endpoints (require JWT token)
- `GET /api/clients` - Get all clients
- `PUT /api/clients/:id` - Update client
- `GET /api/employees` - Get all employees
- `PUT /api/employees/:id` - Update employee
- `GET /api/bookings` - Get all bookings
- `PUT /api/bookings/:id` - Update booking
- `GET /api/transactions` - Get all transactions
- `PUT /api/transactions/:id` - Update transaction
- `GET /api/transactions/statistics` - Get transaction statistics

## Notes

1. **First Admin User**: You'll need to create the first admin user manually in the database or through a registration endpoint.

2. **CORS**: The backend is configured with CORS enabled. If you deploy, make sure to configure CORS properly for your domain.

3. **API Base URL**: The frontend API service uses `http://localhost:5000/api` by default. For production, set the `VITE_API_URL` environment variable.

4. **Booking Form URL**: The booking form in `index.html` currently points to `http://localhost:5000/api/bookings`. Update this for production.

## Next Steps

1. Install the frontend dependencies
2. Create an admin user account
3. Test the login functionality
4. Test the booking form submission
5. Customize the UI as needed
6. Deploy to production

