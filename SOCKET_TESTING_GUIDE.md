# Socket.IO Testing Guide

Complete guide for testing WebSocket functionality of the Rideshare Platform API using the provided test clients.

## 📁 Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `socket-test-client.html` | Browser-based GUI client | Interactive testing with visual interface |
| `socket-test-client.js` | Node.js CLI client | Command-line testing and automation |
| `package-socket-client.json` | Dependencies for Node.js client | `npm install` to set up |
| `WEBSOCKET_EVENTS.md` | Complete event documentation | Reference for all WebSocket events |

## 🚀 Quick Start

### Option 1: Browser Client (Recommended for beginners)

1. **Open the HTML client:**
   ```bash
   # Simply open in any modern browser
   open socket-test-client.html
   # or double-click the file
   ```

2. **Configure connection:**
   - Server URL: `http://localhost:3002` (default)
   - User ID: Enter a test user ID or use the generated one
   - Click **Connect**

3. **Start testing:**
   - Use the tabbed interface to test different features
   - Monitor real-time events in the log panel
   - Follow the complete ride flow with quick action buttons

### Option 2: Node.js Client (For developers)

1. **Install dependencies:**
   ```bash
   # Copy the package file
   cp package-socket-client.json package.json
   
   # Install dependencies
   npm install
   ```

2. **Run the client:**
   ```bash
   # Basic usage
   node socket-test-client.js
   
   # With custom server and user ID
   node socket-test-client.js http://localhost:3002 passenger_123
   
   # Quick test script
   npm run test
   ```

3. **Use interactive menu:**
   - Navigate using numbered commands
   - Real-time colored output with timestamps
   - Automated ID management and workflows

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Ride Request Flow

**Goal:** Test complete passenger ride request to driver acceptance flow

#### Using Browser Client:
1. **Setup Passenger:**
   - User ID: `passenger_test_001`
   - Connect to server
   - Click "Join Room"

2. **Request Ride:**
   - Go to "Ride Events" tab
   - Modify pickup/dropoff locations if needed
   - Click "Request Test Ride"
   - Monitor log for server response

3. **Simulate Driver (New Tab/Window):**
   - Open another browser tab with the same client
   - User ID: `driver_test_001`  
   - Connect and join room
   - When you see "new-ride-request" in log, click "Accept Ride"
   - Enter the ride ID from the passenger's request

#### Using Node.js Client:
1. **Terminal 1 (Passenger):**
   ```bash
   node socket-test-client.js http://localhost:3002 passenger_001
   # Choose: 1 (Request a test ride)
   ```

2. **Terminal 2 (Driver):**
   ```bash
   node socket-test-client.js http://localhost:3002 driver_001
   # Wait for "NEW RIDE REQUEST" message
   # Choose: 2 (Accept current ride)
   ```

### Scenario 2: Real-time Location Tracking

**Goal:** Test location updates during an active ride

#### Steps:
1. **Complete Scenario 1** to get an accepted ride
2. **Driver starts location updates:**
   - Browser: Go to "Location Updates" tab → "Start Auto Location"
   - CLI: Choose command 10 (Start location simulation)
3. **Passenger monitors updates:**
   - Watch for `location-update` events in real-time
   - Observe coordinate changes every 5 seconds
4. **Test ETA calculations:**
   - Driver: Click "ETA to Pickup" / Choose command 8
   - Monitor ETA updates

### Scenario 3: In-Ride Chat Communication  

**Goal:** Test real-time messaging between passenger and driver

#### Setup:
1. **Both clients connected** with ongoing ride (from Scenario 1)
2. **Configure chat settings:**
   - Browser: Go to "Chat Events" tab
   - Set Recipient User ID to the other user's ID
   - Set Chat Room/Ride ID to current ride ID

#### Test Flow:
1. **Send Messages:**
   - Type message: "I'm waiting at the entrance"
   - Click "Send Message"
   - Check other client receives `new-message` event

2. **Typing Indicators:**
   - Click "Start Typing"
   - Other client should see `user-typing` event
   - Click "Stop Typing"

### Scenario 4: Complete Ride Lifecycle

**Goal:** Test entire ride from request to completion with payment

#### Full Flow:
1. **Join Rooms** (both clients)
2. **Request Ride** (passenger)
3. **Accept Ride** (driver)
4. **Driver Navigation:**
   - Update location → "Arrived at Pickup" → "Start Ride"
   - Continue location updates during ride
5. **End Ride** (driver)
6. **Test Rewards** (passenger): Get rewards data

#### Expected Events:
```
passenger: request-a-ride → response
driver: new-ride-request received
driver: accept-a-ride → response  
passenger: ride-accepted received
driver: arrived-at-pickup → response
passenger: driver-arrived received
driver: start-a-ride → response
passenger: ride-started received  
driver: end-a-ride → response
passenger: ride-ended received
```

### Scenario 5: Error Handling

**Goal:** Test various error conditions and edge cases

#### Test Cases:

1. **Invalid Ride ID:**
   ```javascript
   // Set ride ID to invalid value: "invalid_ride_123"
   // Try to accept/start/end ride
   // Expected: Error event with INVALID_RIDE_ID
   ```

2. **Disconnection During Ride:**
   - Start a ride flow
   - Disconnect one client mid-way
   - Reconnect and observe state recovery

3. **Duplicate Actions:**
   - Accept same ride twice
   - Start already started ride
   - Expected: Appropriate error responses

---

## 🔧 Advanced Testing

### Load Testing Setup

1. **Multiple Clients:**
   ```bash
   # Terminal 1
   node socket-test-client.js http://localhost:3002 passenger_001
   
   # Terminal 2  
   node socket-test-client.js http://localhost:3002 passenger_002
   
   # Terminal 3
   node socket-test-client.js http://localhost:3002 driver_001
   ```

2. **Automated Testing Script:**
   ```javascript
   // Create automated-test.js
   const RideshareClient = require('./socket-test-client');
   
   async function runAutomatedTest() {
       const passenger = new RideshareClient('http://localhost:3002', 'auto_passenger');
       const driver = new RideshareClient('http://localhost:3002', 'auto_driver');
       
       // Connect both
       passenger.connect();
       driver.connect();
       
       // Wait for connections
       setTimeout(() => {
           passenger.requestTestRide();
           setTimeout(() => driver.acceptRide(), 2000);
       }, 1000);
   }
   ```

### Performance Monitoring

1. **Network Tab (Browser):**
   - Monitor WebSocket connection
   - Check message frequency and size
   - Observe connection stability

2. **Server Logs:**
   - Monitor server console for WebSocket events
   - Check for memory leaks with multiple connections
   - Observe database query performance

---

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
```
❌ Connection error: Server unreachable
```
**Solutions:**
- Verify server is running on correct port
- Check firewall settings
- Try different transport: `{transports: ['polling']}`

#### Authentication Issues  
```
❌ Error: INSUFFICIENT_PERMISSIONS
```
**Solutions:**
- Ensure user exists in database
- Check user role (passenger/driver) matches action
- Verify session token if required

#### Event Not Received
```
⚠️ Expected event not received
```
**Solutions:**
- Check if user joined correct room
- Verify recipient user ID
- Check server logs for routing issues

### Debug Mode

#### Browser Client:
- Open Developer Tools → Console
- Monitor WebSocket frames in Network tab
- Check for JavaScript errors

#### Node.js Client:
```bash
# Enable debug logging
DEBUG=socket.io-client node socket-test-client.js

# Or add debug logs in code
socket.onAny((eventName, ...args) => {
    console.log(`Event: ${eventName}`, args);
});
```

### Testing Checklist

- [ ] Server running and accessible
- [ ] Database connected
- [ ] Both clients can connect
- [ ] Room joining works
- [ ] Basic ride request/accept flow
- [ ] Location updates working
- [ ] Chat messages delivered
- [ ] Error handling functional
- [ ] Connection recovery works
- [ ] No memory leaks after extended testing

---

## 📈 Testing Best Practices

### 1. Test Isolation
- Use unique user IDs for each test session
- Clear previous ride data when needed
- Start fresh connections for each test scenario

### 2. Data Validation
- Verify event payloads match expected format
- Check response times for real-time events
- Validate location coordinates are realistic

### 3. Error Scenarios
- Test network interruptions
- Verify invalid input handling
- Check timeout behaviors

### 4. Concurrent Testing
- Test multiple simultaneous rides
- Verify ride matching accuracy
- Check chat cross-talk prevention

### 5. Production Testing
```bash
# Test against staging/production
node socket-test-client.js https://staging.rideshare.com
node socket-test-client.js https://api.rideshare.com
```

---

## 📋 Test Cases Template

### Test Case: Basic Ride Request
```
ID: TC001
Description: Passenger requests ride, driver accepts
Preconditions: 
  - Server running
  - 2 clients connected (passenger, driver)
Steps:
  1. Passenger joins room
  2. Passenger requests ride
  3. Driver receives new-ride-request
  4. Driver accepts ride
  5. Passenger receives ride-accepted
Expected Result: Ride status updated to "accepted"
```

### Test Case: Location Updates
```
ID: TC002  
Description: Real-time location tracking during ride
Preconditions:
  - Active ride (accepted status)
  - Driver client connected
Steps:
  1. Driver emits update-current-location
  2. Passenger receives location-update
  3. Verify coordinates updated
  4. Check update frequency
Expected Result: Location updates every 5 seconds max
```

---

## 🎯 Testing Goals

1. **Functionality:** All events work as documented
2. **Performance:** Events deliver within 100ms locally
3. **Reliability:** Connections remain stable during rides
4. **Security:** Invalid requests handled gracefully
5. **Scalability:** Multiple concurrent rides supported

---

## 📞 Support

If you encounter issues:

1. **Check Documentation:** `WEBSOCKET_EVENTS.md`
2. **Review Server Logs:** Check console output
3. **Test with Postman:** Verify REST API first
4. **Network Debugging:** Use browser dev tools
5. **Create Issues:** Document bugs with full reproduction steps

---

**Happy Testing! 🚀**

*These test clients provide comprehensive coverage of all WebSocket functionality in the Rideshare Platform.*