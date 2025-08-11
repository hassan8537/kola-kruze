# WebSocket Events Documentation

Complete documentation of all Socket.IO events supported by the Rideshare Platform API.

## 🔌 Connection Events

### Client Connection
```javascript
// Server automatically handles connection
socket.on('connect', () => {
    console.log('Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});
```

## 🏠 Room Management

### Join Room
Join a user-specific room for receiving targeted events.

**Event:** `join-room`
**Direction:** Client → Server

```javascript
socket.emit('join-room', {
    user_id: "user_123"
});
```

**Response:**
- Success: User joins room `user_123`
- Events will be sent to this room for user-specific notifications

---

## 🚗 Ride Management Events

### 1. Request a Ride
**Event:** `request-a-ride`
**Direction:** Client → Server

```javascript
socket.emit('request-a-ride', {
    user_id: "user_123",
    pickup_location: {
        address: "123 Campus Drive, University City, CA",
        location: {
            type: "Point",
            coordinates: [-122.4194, 37.7749]
        }
    },
    dropoff_location: {
        address: "456 Downtown Plaza, City Center, CA",
        location: {
            type: "Point",
            coordinates: [-122.4094, 37.7849]
        }
    },
    stops: [
        {
            address: "789 Mall Street, Shopping District, CA",
            location: {
                type: "Point", 
                coordinates: [-122.4144, 37.7799]
            }
        }
    ],
    fare_details: {
        amount: 25.50
    },
    vehicle_category: "standard",
    no_of_passengers: 2,
    ride_type: "instant" // or "scheduled", "split-fare"
});
```

**Server Response:**
- `response` event with ride creation status
- `new-ride-request` event sent to nearby drivers

### 2. Accept a Ride (Driver)
**Event:** `accept-a-ride`
**Direction:** Client → Server

```javascript
socket.emit('accept-a-ride', {
    ride_id: "ride_456",
    driver_id: "driver_789"
});
```

**Server Response:**
- `response` event with acceptance status
- `ride-accepted` event sent to passenger
- Updates ride status to "accepted"

### 3. Cancel a Ride
**Event:** `cancel-a-ride`
**Direction:** Client → Server

```javascript
socket.emit('cancel-a-ride', {
    ride_id: "ride_456",
    user_id: "user_123",
    reason: "Change of plans",
    cancelled_by: "passenger" // or "driver"
});
```

**Server Response:**
- `response` event with cancellation status
- `ride-cancelled` event sent to other party
- Updates ride status to "cancelled"

### 4. Driver Arrived at Pickup
**Event:** `arrived-at-pickup`
**Direction:** Client → Server (Driver only)

```javascript
socket.emit('arrived-at-pickup', {
    ride_id: "ride_456"
});
```

**Server Response:**
- `response` event confirming arrival
- `driver-arrived` event sent to passenger
- Updates ride status to "arrived"

### 5. Start a Ride
**Event:** `start-a-ride`
**Direction:** Client → Server (Driver only)

```javascript
socket.emit('start-a-ride', {
    ride_id: "ride_456"
});
```

**Server Response:**
- `response` event confirming ride start
- `ride-started` event sent to passenger
- Updates ride status to "ongoing"

### 6. End a Ride
**Event:** `end-a-ride`
**Direction:** Client → Server (Driver only)

```javascript
socket.emit('end-a-ride', {
    ride_id: "ride_456"
});
```

**Server Response:**
- `response` event confirming ride end
- `ride-ended` event sent to passenger
- Updates ride status to "completed"
- Triggers payment processing

---

## 📍 Location & ETA Events

### 1. Update Current Location
**Event:** `update-current-location`
**Direction:** Client → Server

```javascript
socket.emit('update-current-location', {
    user_id: "driver_789",
    location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749]
    },
    address: "Current Street Address",
    heading: 45, // Optional: direction in degrees
    speed: 25   // Optional: speed in mph
});
```

**Server Response:**
- `response` event confirming location update
- `location-update` event sent to related users (passengers in ongoing rides)
- Updates user's current_location in database

### 2. ETA to Pickup
**Event:** `eta-to-pickup`
**Direction:** Client → Server (Driver only)

```javascript
socket.emit('eta-to-pickup', {
    ride_id: "ride_456"
});
```

**Server Response:**
- `response` event with ETA calculation
- `eta-update` event sent to passenger

```javascript
// Response format
{
    object_type: "eta-to-pickup",
    data: {
        eta_minutes: 8,
        eta_text: "8 min",
        distance_miles: 2.3,
        traffic_condition: "moderate"
    }
}
```

### 3. ETA to Dropoff
**Event:** `eta-to-dropoff`
**Direction:** Client → Server (Driver only)

```javascript
socket.emit('eta-to-dropoff', {
    ride_id: "ride_456"
});
```

**Server Response:**
- Similar to ETA to pickup but for the destination

---

## 💬 Chat & Messaging Events

### 1. Get Chats
**Event:** `get-chats`
**Direction:** Client → Server

```javascript
socket.emit('get-chats', {
    user_id: "user_123",
    ride_id: "ride_456" // Optional: filter by ride
});
```

**Server Response:**
- `response` event with chat history

### 2. Send Chat Message
**Event:** `chat-message`
**Direction:** Client → Server

```javascript
socket.emit('chat-message', {
    sender_id: "user_123",
    recipient_id: "driver_789",
    ride_id: "ride_456",
    message: "I'm waiting at the main entrance",
    message_type: "text" // or "image", "location"
});
```

**Server Response:**
- `response` event confirming message sent
- `new-message` event sent to recipient

### 3. Typing Indicator
**Event:** `chat-typing`
**Direction:** Client → Server

```javascript
// Start typing
socket.emit('chat-typing', {
    sender_id: "user_123",
    recipient_id: "driver_789", 
    ride_id: "ride_456",
    is_typing: true
});

// Stop typing
socket.emit('chat-typing', {
    sender_id: "user_123",
    recipient_id: "driver_789",
    ride_id: "ride_456", 
    is_typing: false
});
```

**Server Response:**
- `user-typing` event sent to recipient

---

## 🎁 Rewards & Referrals Events

### 1. Get Total Rewards
**Event:** `rewards`
**Direction:** Client → Server

```javascript
socket.emit('rewards', {
    user_id: "user_123"
});
```

**Server Response:**
- `response` or `rewards-data` event with rewards information

```javascript
// Response format
{
    object_type: "rewards",
    data: {
        total_completed_rewards: 15,
        current_points: 150,
        available_rewards: [
            {
                id: "reward_1",
                name: "Free Ride",
                points_required: 100,
                description: "Get a free ride up to $15"
            }
        ]
    }
}
```

### 2. Get Total Referrals
**Event:** `referrals`
**Direction:** Client → Server

```javascript
socket.emit('referrals', {
    user_id: "user_123"
});
```

**Server Response:**
- `response` or `referrals-data` event with referral statistics

```javascript
// Response format
{
    object_type: "referrals",
    data: {
        total_referrals: 8,
        active_referrals: 6,
        referral_earnings: 24.00,
        referral_code: "JOHN2024"
    }
}
```

---

## 📨 Server-to-Client Events

### Generic Response
**Event:** `response`
**Direction:** Server → Client

Standard response format for all server responses:

```javascript
socket.on('response', (data) => {
    console.log(data);
    // Format:
    // {
    //     success: true/false,
    //     object_type: "event-name",
    //     message: "Description message",
    //     data: { ... }, // Event-specific data
    //     error_code: "ERROR_CODE" // Only on errors
    // }
});
```

### New Ride Request (to Drivers)
**Event:** `new-ride-request`
**Direction:** Server → Driver Clients

```javascript
socket.on('new-ride-request', (data) => {
    // Sent to drivers within radius when passenger requests ride
    console.log('New ride available:', data);
});
```

### Ride Status Updates
**Event:** Multiple ride status events
**Direction:** Server → Client

```javascript
// Ride accepted by driver
socket.on('ride-accepted', (data) => {
    console.log('Ride accepted by driver:', data);
});

// Ride cancelled by other party
socket.on('ride-cancelled', (data) => {
    console.log('Ride cancelled:', data);
});

// Driver arrived at pickup
socket.on('driver-arrived', (data) => {
    console.log('Driver has arrived:', data);
});

// Ride started
socket.on('ride-started', (data) => {
    console.log('Ride has started:', data);
});

// Ride ended
socket.on('ride-ended', (data) => {
    console.log('Ride completed:', data);
});
```

### Location Updates
**Event:** `location-update`
**Direction:** Server → Client

```javascript
socket.on('location-update', (data) => {
    // Real-time location updates from driver during ride
    console.log('Driver location update:', data);
});
```

### Chat Events
**Event:** Chat-related events
**Direction:** Server → Client

```javascript
// New message received
socket.on('new-message', (data) => {
    console.log('New message:', data);
});

// Someone is typing
socket.on('user-typing', (data) => {
    console.log('User typing:', data);
});
```

### Error Events
**Event:** `error`
**Direction:** Server → Client

```javascript
socket.on('error', (data) => {
    console.error('Socket error:', data);
    // Format:
    // {
    //     error_code: "INVALID_RIDE_ID",
    //     message: "The provided ride ID is invalid",
    //     details: { ... }
    // }
});
```

---

## 🔄 Event Flow Examples

### Complete Ride Flow

1. **Passenger requests ride:**
   ```javascript
   socket.emit('join-room', {user_id: 'passenger_123'});
   socket.emit('request-a-ride', rideData);
   ```

2. **Server notifies nearby drivers:**
   ```javascript
   // Drivers receive:
   socket.on('new-ride-request', rideData);
   ```

3. **Driver accepts ride:**
   ```javascript
   socket.emit('accept-a-ride', {ride_id: 'ride_456', driver_id: 'driver_789'});
   ```

4. **Passenger gets notification:**
   ```javascript
   socket.on('ride-accepted', rideData);
   ```

5. **Real-time location updates:**
   ```javascript
   // Driver sends location updates
   socket.emit('update-current-location', locationData);
   // Passenger receives updates
   socket.on('location-update', locationData);
   ```

6. **Driver arrives:**
   ```javascript
   socket.emit('arrived-at-pickup', {ride_id: 'ride_456'});
   ```

7. **Ride progression:**
   ```javascript
   socket.emit('start-a-ride', {ride_id: 'ride_456'});
   socket.emit('end-a-ride', {ride_id: 'ride_456'});
   ```

### Chat Flow

1. **Start conversation:**
   ```javascript
   socket.emit('get-chats', {user_id: 'user_123'});
   ```

2. **Send message:**
   ```javascript
   socket.emit('chat-message', messageData);
   ```

3. **Typing indicators:**
   ```javascript
   socket.emit('chat-typing', {is_typing: true});
   socket.emit('chat-typing', {is_typing: false});
   ```

---

## 🚫 Error Codes

Common error codes returned by the server:

- `INVALID_USER_ID`: User ID not found
- `INVALID_RIDE_ID`: Ride ID not found or invalid
- `RIDE_ALREADY_ACCEPTED`: Ride has already been accepted
- `INSUFFICIENT_PERMISSIONS`: User doesn't have permission for this action
- `DRIVER_NOT_AVAILABLE`: Driver is not available for rides
- `INVALID_LOCATION`: Location coordinates are invalid
- `RIDE_NOT_IN_PROGRESS`: Operation not allowed for current ride status
- `CONNECTION_ERROR`: WebSocket connection issue

---

## 🧪 Testing Events

Use the provided test clients to test all events:

### HTML Client
```bash
# Open in browser
open socket-test-client.html
```

### Node.js Client
```bash
# Install dependencies
npm install socket.io-client colors

# Run client
node socket-test-client.js [server_url] [user_id]

# Examples:
node socket-test-client.js http://localhost:3002 passenger_123
node socket-test-client.js https://api.rideshare.com driver_456
```

Both clients provide comprehensive testing interfaces for all WebSocket events with real-time logging and response handling.