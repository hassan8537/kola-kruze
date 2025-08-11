# Ridesharing Platform Backend

A comprehensive ride-sharing platform backend designed specifically for campus communities, supporting both students and regular passengers with real-time ride matching, split-fare functionality, and advanced scheduling capabilities.

## 🚗 Features

### Core Ride Sharing

- **Real-time Ride Matching**: Instant driver-passenger pairing within configurable radius
- **Multi-Stop Rides**: Support for multiple pickup and drop-off locations
- **Ride Scheduling**: Advanced scheduling system with automated driver notifications
- **Split Fare Rides**: Social ride-sharing with cost splitting among multiple passengers
- **Live Tracking**: Real-time GPS tracking with ETA calculations
- **In-App Chat**: Real-time messaging between drivers and passengers

### User Management

- **Multi-Role Support**: Passengers, drivers, and admin roles
- **Student Verification**: Special student pricing and verification system
- **Profile Management**: Complete user profiles with preferences and emergency contacts
- **Preference Settings**: Gender and driver type preferences for enhanced safety

### Payment & Financial

- **Stripe Integration**: Secure payment processing with card management
- **Wallet System**: In-app wallet with transaction history
- **Automated Payouts**: Direct transfers to driver accounts
- **Promo Codes**: Discount system with admin-managed promotional codes
- **Referral System**: Points-based referral program with rewards

### Safety & Security

- **OTP Verification**: Secure ride verification system
- **Emergency Contacts**: Quick access to emergency contacts
- **Ride Reporting**: Comprehensive reporting system for incidents
- **Rating System**: Mutual rating system for drivers and passengers
- **Account Status Management**: Automated account verification and status tracking

### Admin Dashboard

- **User Management**: Complete user account management
- **Ride Monitoring**: Real-time ride tracking and management
- **Financial Reports**: Revenue tracking and payout management
- **Category Management**: Vehicle category and pricing management
- **Analytics**: Comprehensive reporting and analytics

## 🛠️ Technology Stack

- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.IO for WebSocket connections
- **Authentication**: JWT-based authentication with bcrypt
- **Payment Processing**: Stripe API integration
- **Email Services**: Nodemailer for transactional emails
- **Cloud Storage**: Firebase Admin SDK
- **File Uploads**: Multer middleware
- **Validation**: Express-validator
- **Security**: CORS, cookie-parser
- **Logging**: Morgan middleware
- **Task Scheduling**: Node-cron for background jobs

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Stripe account for payment processing
- Firebase project for file storage
- SSL certificates (for production)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ridesharing-platform-backend.git
   cd ridesharing-platform-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=3002
   NODE_ENV=development
   API_VERSION=v1

   # Database
   MONGODB_URI=mongodb://localhost:27017/rideshare

   # JWT Secret
   JWT_SECRET=your-super-secure-jwt-secret

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY=your-firebase-private-key
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-email-password

   # Ride Configuration
   MAX_DISTANCE_IN_MILES=5

   # SSL Certificates (Production)
   SSL_KEY_PATH=/path/to/private/key
   SSL_CERT_PATH=/path/to/certificate
   SSL_CA_PATH=/path/to/ca/certificate
   ```

4. **Database Setup**

   - Install and start MongoDB
   - The application will automatically create collections and seed admin user

5. **Start the application**

   ```bash
   # Development mode with auto-reload
   npm start

   # Production mode
   NODE_ENV=production npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/v1/auth/signup-or-signin       # User registration/login
POST /api/v1/auth/social-signup-or-signin # Social authentication
GET  /api/v1/auth/logout                 # User logout
POST /api/v1/otps/verify                 # OTP verification
GET  /api/v1/otps/resend/:user_id        # Resend OTP
```

### Ride Management

```
POST /api/v1/rides                  # Request a ride
GET /api/v1/rides                   # Get user rides
GET /api/v1/rides/:id               # Get specific ride
PATCH /api/v1/rides/:id             # Update ride status
DELETE /api/v1/rides/:id            # Cancel ride
```

### User Profile

```
GET /api/v1/profile                 # Get user profile
PATCH /api/v1/profile               # Update profile
POST /api/v1/profile/avatar         # Upload profile picture
```

### Payment Management

```
GET /api/v1/cards                   # Get saved cards
POST /api/v1/cards                  # Add payment method
DELETE /api/v1/cards/:id            # Remove payment method
GET /api/v1/wallet                  # Get wallet balance
POST /api/v1/wallet/topup           # Add funds to wallet
```

### WebSocket Events

```javascript
// Client to Server
socket.emit("join-room", { user_id });
socket.emit("request-a-ride", rideData);
socket.emit("accept-a-ride", { ride_id });
socket.emit("update-current-location", locationData);
socket.emit("chat-message", messageData);

// Server to Client
socket.on("response", data => {
  /* Handle response */
});
socket.on("new-ride-request", data => {
  /* New ride available */
});
socket.on("ride-accepted", data => {
  /* Ride accepted by driver */
});
socket.on("location-update", data => {
  /* Driver location update */
});
```

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   ├── firebase.js      # Firebase configuration
│   ├── stripe.js        # Stripe configuration
│   └── nodemailer.js    # Email configuration
├── controllers/         # Request handlers
│   ├── admin-controllers/
│   └── user-controllers/
├── middlewares/         # Custom middleware
├── models/              # Mongoose schemas
├── routes/              # API routes
│   ├── admin-routes/
│   └── user-routes/
├── services/            # Business logic
│   ├── admin-services/
│   └── user-services/
├── utilities/           # Helper functions
│   ├── calculators/     # Distance, ETA calculations
│   ├── formatters/      # Data formatters
│   ├── generators/      # OTP, token generators
│   ├── handlers/        # Response, error handlers
│   └── validators/      # Input validators
└── schemas/             # Validation schemas
```

## 🔧 Configuration

### Database Indexes

The application automatically creates the following indexes for optimal performance:

- **Geospatial indexes** on location fields for proximity searches
- **Compound indexes** on user_id, driver_id, and ride_status
- **Text indexes** for search functionality

### File Upload Configuration

- **Maximum file size**: 10MB per file
- **Supported formats**: Images (JPEG, PNG, GIF), Documents (PDF)
- **Storage**: Firebase Cloud Storage

### Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **WebSocket connections**: 50 concurrent connections per user

## 🚀 Deployment

### Production Deployment

1. **SSL Certificate Setup**

   ```bash
   # Using Let's Encrypt
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. **Environment Variables**
   Set `NODE_ENV=production` and provide SSL certificate paths

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start app.js --name "rideshare-api"
   pm2 startup
   pm2 save
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

### Environment-Specific Deployment

```bash
# Development
npm start

# Production with PM2
NODE_ENV=production pm2 start app.js --name rideshare-backend

# Docker
docker build -t ridesharing-platform-backend .
docker run -p 3002:3002 ridesharing-platform-backend
```

## 🧪 Testing

### REST API Testing
Use the comprehensive Postman collection:
- Import `Rideshare_Platform_API.postman_collection.json`
- Import `Rideshare_Platform_API.postman_environment.json`
- Follow `POSTMAN_SETUP.md` for detailed setup

### WebSocket Testing
Test real-time features with provided Socket.IO clients:

```bash
# Browser-based testing
open socket-test-client.html

# Command-line testing
npm install socket.io-client colors
node socket-test-client.js http://localhost:3002 test_user_123
```

See `SOCKET_TESTING_GUIDE.md` for comprehensive testing scenarios.

## 📊 Monitoring & Analytics

### Health Checks

- **GET /health**: Basic health check endpoint
- **GET /health/db**: Database connectivity check
- **GET /health/stripe**: Payment system status

### Logging

- **Request logging**: All API requests logged with Morgan
- **Error logging**: Centralized error handling and logging
- **Socket events**: WebSocket connection and event logging

### Real-time Testing

- **Socket.IO Events**: Complete documentation in `WEBSOCKET_EVENTS.md`
- **Test Clients**: Browser and Node.js clients for WebSocket testing
- **Event Monitoring**: Real-time event logging and debugging tools

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: Bcrypt password hashing
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Cross-origin request security
- **Rate Limiting**: API abuse prevention
- **Data Sanitization**: XSS and injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration for code style
- Write unit tests for new features
- Update documentation for API changes
- Use meaningful commit messages

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/ridesharing-platform-backend/issues)
- **Documentation**: Check the comprehensive docs in this repository
- **WebSocket Testing**: Use provided test clients for real-time debugging
- **API Testing**: Import Postman collection for complete API coverage

### Quick Debug Steps:
1. **API Issues**: Test with Postman collection first
2. **WebSocket Issues**: Use browser or Node.js test clients
3. **Database Issues**: Check MongoDB connection and indexes
4. **Authentication Issues**: Verify JWT tokens and user roles

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Main project documentation |
| `POSTMAN_SETUP.md` | REST API testing with Postman |
| `WEBSOCKET_EVENTS.md` | Complete WebSocket events reference |
| `SOCKET_TESTING_GUIDE.md` | Real-time testing guide |
| `Rideshare_Platform_API.postman_collection.json` | Postman collection (80+ endpoints) |
| `socket-test-client.html` | Browser WebSocket test client |
| `socket-test-client.js` | Node.js WebSocket test client |

## 🔄 Version History

- **v1.0.0**: Initial release with core ride-sharing features
- **v1.1.0**: Added split-fare functionality and WebSocket events
- **v1.2.0**: Enhanced admin dashboard and real-time tracking
- **v1.3.0**: Student verification system and chat functionality
- **v1.4.0**: Referral and rewards system with comprehensive testing suite

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Core ride-sharing functionality
- [x] Real-time WebSocket events
- [x] Comprehensive testing suite
- [x] Payment integration with Stripe
- [x] Admin dashboard

### Phase 2 (Next)
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Push notifications
- [ ] Enhanced security features

### Phase 3 (Future)
- [ ] Multi-language support
- [ ] Integration with mapping services
- [ ] AI-powered ride optimization
- [ ] Carbon footprint tracking
- [ ] Group ride scheduling
