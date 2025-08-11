# Postman Collection Setup Guide

This guide will help you set up and use the comprehensive Postman collection for the Rideshare Platform API.

## 📁 Files Included

1. **`Rideshare_Platform_API.postman_collection.json`** - Main API collection
2. **`Rideshare_Platform_API.postman_environment.json`** - Environment variables
3. **`POSTMAN_SETUP.md`** - This setup guide

## 🚀 Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Drag and drop both JSON files or use **Upload Files**:
   - `Rideshare_Platform_API.postman_collection.json`
   - `Rideshare_Platform_API.postman_environment.json`
4. Select the **"Rideshare Platform - Development"** environment

### 2. Configure Environment Variables

Update the environment variables in Postman:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `baseUrl` | API server URL | `http://localhost:3002` |
| `apiVersion` | API version | `v1` |
| `auth_token` | JWT authentication token | (auto-filled after login) |
| `user_id` | Current user ID | (auto-filled after login) |
| `driver_id` | Driver user ID | (for testing driver features) |
| `ride_id` | Current ride ID | (auto-filled during ride flow) |
| `card_id` | Payment card ID | (auto-filled after adding card) |
| `category_id` | Vehicle category ID | (get from categories endpoint) |

### 3. Authentication Flow

1. **Register/Login User**:
   ```
   POST /api/v1/auth/signup-or-signin
   ```
   - Creates account or logs in existing user
   - Returns JWT token and user details

2. **Verify Phone (if required)**:
   ```
   POST /api/v1/otps/verify
   ```
   - Verifies OTP sent to phone number

3. **Auto-set Auth Token**:
   Add this script to the **Tests** tab of login requests:
   ```javascript
   if (pm.response.code === 200) {
       const responseJson = pm.response.json();
       if (responseJson.data && responseJson.data.session_token) {
           pm.environment.set("auth_token", responseJson.data.session_token);
           pm.environment.set("user_id", responseJson.data._id);
       }
   }
   ```

## 📋 API Collection Structure

### 🔐 Authentication
- User registration/login
- Social authentication (Google, Apple)
- Phone OTP verification
- Session logout

### 👤 User Management
- Profile creation/updates
- Document uploads (profile picture, driver license)
- Account management
- Student verification

### 🚗 Vehicle Management (Drivers)
- Add vehicle with documents
- Update vehicle details
- Insurance and inspection uploads

### 🚗 Ride Management
- **Core Flow**:
  1. Select destination → Manage stops → Get fare → Confirm ride
  2. Real-time tracking via WebSocket
  3. OTP verification → Payment processing
- **Scheduled Rides**: Future ride bookings
- **Split Fare Rides**: Cost-sharing with other passengers

### 💳 Payments
- Add/remove payment cards
- Stripe integration
- Wallet management (add funds, instant transfers)
- Transaction history

### ⭐ Social Features
- Rating and reviews system
- Favourite drivers
- In-app chat (REST endpoints)
- Ride reporting and safety

### 🔔 Notifications
- Push notification management
- Read/unread tracking
- Notification history

### 🎫 Promotions & Categories
- Vehicle categories (Economy, Premium, etc.)
- Promotional codes validation
- Student discounts

### 👨‍💼 Admin Panel
- Admin authentication
- User management
- Ride monitoring
- Analytics and reporting

## 🔄 Common Workflows

### Complete Passenger Journey

1. **Setup Account**:
   ```
   POST /auth/signup-or-signin → POST /otps/verify → POST /profiles
   ```

2. **Add Payment Method**:
   ```
   POST /cards
   ```

3. **Request Ride**:
   ```
   POST /rides/select-destination
   → POST /rides/manage-stops (optional)
   → POST /rides/ride-details-and-fare
   → POST /rides/confirm
   ```

4. **During Ride** (WebSocket events):
   ```
   join-room → request-a-ride → accept-a-ride → start-a-ride → end-a-ride
   ```

5. **Post-Ride**:
   ```
   POST /rides/verify-otp → POST /rides/pay-now/{{ride_id}} → POST /ratings
   ```

### Driver Setup Flow

1. **Register as Driver**:
   ```
   POST /auth/signup-or-signin (role: "driver")
   ```

2. **Complete Profile**:
   ```
   POST /profiles (with driver_license upload)
   ```

3. **Add Vehicle**:
   ```
   POST /vehicles (with insurance/inspection docs)
   ```

4. **Setup Payments**:
   ```
   GET /stripe/setup
   ```

5. **Go Online**:
   ```
   GET /toggles/driver-availability
   ```

### Split Fare Ride Flow

1. **Create Split Fare Ride**:
   ```
   POST /rides/confirm (ride_type: "split-fare")
   ```

2. **Send Invitations**:
   ```
   POST /rides/shared/send-invite
   ```

3. **Invitees Accept**:
   ```
   POST /rides/shared/invites/accept
   ```

4. **Proceed with Ride** when all passengers confirmed

## 💡 Pro Tips

### Auto-fill Variables
Add this script to successful responses to auto-fill environment variables:

```javascript
// For login responses
if (pm.response.code === 200) {
    const data = pm.response.json().data;
    if (data.session_token) {
        pm.environment.set("auth_token", data.session_token);
        pm.environment.set("user_id", data._id);
    }
}

// For ride creation
if (pm.response.code === 201) {
    const data = pm.response.json().data;
    if (data._id) {
        pm.environment.set("ride_id", data._id);
    }
}

// For card addition
if (pm.response.code === 201) {
    const data = pm.response.json().data;
    if (data.stripe_card_id) {
        pm.environment.set("card_id", data.stripe_card_id);
    }
}
```

### Testing Multiple Environments

Create additional environments for:
- **Production**: `https://your-production-domain.com`
- **Staging**: `https://staging.your-domain.com`
- **Local with SSL**: `https://localhost:3002`

### WebSocket Testing

For real-time features, use:
1. **Postman WebSocket** feature (if available)
2. **Socket.io client** in browser console
3. **Separate WebSocket testing tools**

Common WebSocket events:
```javascript
// Join user room
socket.emit('join-room', { user_id: 'your_user_id' });

// Request ride
socket.emit('request-a-ride', {
    pickup_location: { /* coordinates */ },
    dropoff_location: { /* coordinates */ }
});

// Listen for responses
socket.on('response', (data) => console.log(data));
socket.on('new-ride-request', (data) => console.log('New ride:', data));
```

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check `auth_token` is set in environment
   - Verify token hasn't expired
   - Re-login to refresh token

2. **403 Forbidden**:
   - Check user role permissions
   - Driver-only endpoints require `role: "driver"`
   - Admin endpoints need admin authentication

3. **File Upload Issues**:
   - Use `form-data` for multipart requests
   - Check file size limits (10MB max)
   - Verify file types are supported

4. **Environment Variables Not Working**:
   - Ensure correct environment is selected
   - Check variable names match exactly
   - Use `{{variable_name}}` syntax

### Request Headers

Standard headers included:
```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

For file uploads:
```
Content-Type: multipart/form-data (auto-set by Postman)
```

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all required environment variables are set
3. Ensure API server is running on correct port
4. Test with basic health check endpoint first

---

**Happy Testing! 🚀**

*This collection covers all 80+ endpoints of the Rideshare Platform API with realistic examples and proper authentication flow.*