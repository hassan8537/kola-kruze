#!/usr/bin/env node

/**
 * Rideshare Platform - Node.js Socket.IO Test Client
 * 
 * A comprehensive command-line test client for WebSocket events
 * Usage: node socket-test-client.js [server_url] [user_id]
 */

const io = require('socket.io-client');
const readline = require('readline');
const colors = require('colors');

// Default configuration
const DEFAULT_SERVER = 'http://localhost:3002';
const DEFAULT_USER_ID = 'test_user_' + Math.random().toString(36).substr(2, 9);

class RideshareSocketClient {
    constructor(serverUrl = DEFAULT_SERVER, userId = DEFAULT_USER_ID) {
        this.serverUrl = serverUrl;
        this.userId = userId;
        this.socket = null;
        this.currentRideId = null;
        this.isConnected = false;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Graceful shutdown
        process.on('SIGINT', () => {
            this.log('Shutting down...', 'info');
            this.disconnect();
            process.exit(0);
        });
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        
        switch(type) {
            case 'error':
                console.log(`${prefix} ❌ ${message}`.red);
                break;
            case 'success':
                console.log(`${prefix} ✅ ${message}`.green);
                break;
            case 'warning':
                console.log(`${prefix} ⚠️  ${message}`.yellow);
                break;
            case 'incoming':
                console.log(`${prefix} 📨 ${message}`.cyan);
                break;
            case 'outgoing':
                console.log(`${prefix} 📤 ${message}`.magenta);
                break;
            default:
                console.log(`${prefix} ℹ️  ${message}`.white);
        }
    }

    connect() {
        this.log(`Connecting to ${this.serverUrl} as user ${this.userId}`, 'info');
        
        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling'],
            forceNew: true
        });

        // Connection events
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.log(`Connected with socket ID: ${this.socket.id}`, 'success');
            this.joinRoom();
            this.showMenu();
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.log(`Disconnected: ${reason}`, 'warning');
        });

        this.socket.on('connect_error', (error) => {
            this.log(`Connection error: ${error.message}`, 'error');
        });

        // Generic response handler
        this.socket.on('response', (data) => {
            this.log(`Response: ${JSON.stringify(data, null, 2)}`, 'incoming');
            
            // Auto-extract ride ID from responses
            if (data.data && data.data._id && data.object_type?.includes('ride')) {
                this.currentRideId = data.data._id;
                this.log(`Auto-set current ride ID: ${this.currentRideId}`, 'info');
            }
        });

        // Ride-specific events
        this.socket.on('new-ride-request', (data) => {
            this.log(`🚗 NEW RIDE REQUEST: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        this.socket.on('ride-accepted', (data) => {
            this.log(`✅ RIDE ACCEPTED: ${JSON.stringify(data, null, 2)}`, 'incoming');
            if (data.data?._id) this.currentRideId = data.data._id;
        });

        this.socket.on('ride-cancelled', (data) => {
            this.log(`❌ RIDE CANCELLED: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        this.socket.on('driver-arrived', (data) => {
            this.log(`📍 DRIVER ARRIVED: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        this.socket.on('ride-started', (data) => {
            this.log(`🚀 RIDE STARTED: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        this.socket.on('ride-ended', (data) => {
            this.log(`🏁 RIDE ENDED: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        // Location events
        this.socket.on('location-update', (data) => {
            this.log(`📍 LOCATION UPDATE: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        this.socket.on('eta-update', (data) => {
            this.log(`⏱️ ETA UPDATE: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        // Chat events
        this.socket.on('new-message', (data) => {
            this.log(`💬 NEW MESSAGE: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        this.socket.on('user-typing', (data) => {
            this.log(`✏️ USER TYPING: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        // Error handler
        this.socket.on('error', (data) => {
            this.log(`ERROR: ${JSON.stringify(data, null, 2)}`, 'error');
        });

        // Rewards/Referrals
        this.socket.on('rewards-data', (data) => {
            this.log(`🎁 REWARDS: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });

        this.socket.on('referrals-data', (data) => {
            this.log(`👥 REFERRALS: ${JSON.stringify(data, null, 2)}`, 'incoming');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.rl.close();
    }

    showMenu() {
        console.log('\n' + '='.repeat(60).blue);
        console.log('🚗 RIDESHARE PLATFORM - SOCKET.IO TEST CLIENT'.bold.cyan);
        console.log('='.repeat(60).blue);
        console.log(`📡 Connected to: ${this.serverUrl}`.green);
        console.log(`👤 User ID: ${this.userId}`.green);
        console.log(`🆔 Current Ride ID: ${this.currentRideId || 'None'}`.yellow);
        console.log('='.repeat(60).blue);
        
        console.log('\n📋 AVAILABLE COMMANDS:'.bold);
        console.log('');
        
        console.log('🚗 RIDE MANAGEMENT:'.yellow);
        console.log('  1  - Request a test ride');
        console.log('  2  - Accept current ride (as driver)');
        console.log('  3  - Cancel current ride');
        console.log('  4  - Driver arrived at pickup');
        console.log('  5  - Start ride');
        console.log('  6  - End ride');
        console.log('');
        
        console.log('📍 LOCATION & ETA:'.yellow);
        console.log('  7  - Update current location');
        console.log('  8  - Get ETA to pickup');
        console.log('  9  - Get ETA to dropoff');
        console.log('  10 - Start location simulation');
        console.log('');
        
        console.log('💬 CHAT & MESSAGING:'.yellow);
        console.log('  11 - Get chat inbox');
        console.log('  12 - Send chat message');
        console.log('  13 - Start typing indicator');
        console.log('  14 - Stop typing indicator');
        console.log('');
        
        console.log('🎁 REWARDS & REFERRALS:'.yellow);
        console.log('  15 - Get rewards data');
        console.log('  16 - Get referrals data');
        console.log('');
        
        console.log('⚙️  UTILITIES:'.yellow);
        console.log('  17 - Send custom event');
        console.log('  18 - Change user ID');
        console.log('  19 - Set ride ID');
        console.log('  20 - Show this menu');
        console.log('  q  - Quit');
        console.log('');
        
        this.promptCommand();
    }

    promptCommand() {
        this.rl.question('Enter command: '.cyan, (input) => {
            this.handleCommand(input.trim());
        });
    }

    handleCommand(command) {
        if (!this.isConnected && command !== 'q') {
            this.log('Not connected to server!', 'error');
            this.promptCommand();
            return;
        }

        switch(command) {
            case '1': this.requestTestRide(); break;
            case '2': this.acceptRide(); break;
            case '3': this.cancelRide(); break;
            case '4': this.arrivedAtPickup(); break;
            case '5': this.startRide(); break;
            case '6': this.endRide(); break;
            case '7': this.updateLocation(); break;
            case '8': this.getETAToPickup(); break;
            case '9': this.getETAToDropoff(); break;
            case '10': this.startLocationSimulation(); break;
            case '11': this.getChats(); break;
            case '12': this.sendChatMessage(); break;
            case '13': this.startTyping(); break;
            case '14': this.stopTyping(); break;
            case '15': this.getRewards(); break;
            case '16': this.getReferrals(); break;
            case '17': this.sendCustomEvent(); break;
            case '18': this.changeUserId(); break;
            case '19': this.setRideId(); break;
            case '20': this.showMenu(); return;
            case 'q': this.disconnect(); return;
            default:
                this.log('Invalid command. Type "20" to show menu.', 'warning');
        }
        
        setTimeout(() => this.promptCommand(), 100);
    }

    joinRoom() {
        const data = { user_id: this.userId };
        this.socket.emit('join-room', data);
        this.log(`Joining room: ${JSON.stringify(data)}`, 'outgoing');
    }

    requestTestRide() {
        const rideData = {
            user_id: this.userId,
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
            vehicle_category: "standard",
            no_of_passengers: 2,
            ride_type: "instant"
        };

        this.socket.emit('request-a-ride', rideData);
        this.log(`Requesting ride: ${JSON.stringify(rideData, null, 2)}`, 'outgoing');
    }

    acceptRide() {
        if (!this.currentRideId) {
            this.log('No current ride ID set!', 'error');
            return;
        }

        const data = { 
            ride_id: this.currentRideId,
            driver_id: this.userId 
        };
        
        this.socket.emit('accept-a-ride', data);
        this.log(`Accepting ride: ${JSON.stringify(data)}`, 'outgoing');
    }

    cancelRide() {
        if (!this.currentRideId) {
            this.log('No current ride ID set!', 'error');
            return;
        }

        const data = { 
            ride_id: this.currentRideId,
            user_id: this.userId 
        };
        
        this.socket.emit('cancel-a-ride', data);
        this.log(`Cancelling ride: ${JSON.stringify(data)}`, 'outgoing');
    }

    arrivedAtPickup() {
        if (!this.currentRideId) {
            this.log('No current ride ID set!', 'error');
            return;
        }

        const data = { ride_id: this.currentRideId };
        this.socket.emit('arrived-at-pickup', data);
        this.log(`Driver arrived at pickup: ${JSON.stringify(data)}`, 'outgoing');
    }

    startRide() {
        if (!this.currentRideId) {
            this.log('No current ride ID set!', 'error');
            return;
        }

        const data = { ride_id: this.currentRideId };
        this.socket.emit('start-a-ride', data);
        this.log(`Starting ride: ${JSON.stringify(data)}`, 'outgoing');
    }

    endRide() {
        if (!this.currentRideId) {
            this.log('No current ride ID set!', 'error');
            return;
        }

        const data = { ride_id: this.currentRideId };
        this.socket.emit('end-a-ride', data);
        this.log(`Ending ride: ${JSON.stringify(data)}`, 'outgoing');
    }

    updateLocation() {
        // Generate random location around San Francisco
        const baseLat = 37.7749;
        const baseLng = -122.4194;
        const randomLat = baseLat + (Math.random() - 0.5) * 0.01;
        const randomLng = baseLng + (Math.random() - 0.5) * 0.01;

        const data = {
            user_id: this.userId,
            location: {
                type: "Point",
                coordinates: [randomLng, randomLat]
            },
            address: `${randomLat.toFixed(4)}, ${randomLng.toFixed(4)}`
        };

        this.socket.emit('update-current-location', data);
        this.log(`Updating location: ${JSON.stringify(data)}`, 'outgoing');
    }

    getETAToPickup() {
        if (!this.currentRideId) {
            this.log('No current ride ID set!', 'error');
            return;
        }

        const data = { ride_id: this.currentRideId };
        this.socket.emit('eta-to-pickup', data);
        this.log(`Getting ETA to pickup: ${JSON.stringify(data)}`, 'outgoing');
    }

    getETAToDropoff() {
        if (!this.currentRideId) {
            this.log('No current ride ID set!', 'error');
            return;
        }

        const data = { ride_id: this.currentRideId };
        this.socket.emit('eta-to-dropoff', data);
        this.log(`Getting ETA to dropoff: ${JSON.stringify(data)}`, 'outgoing');
    }

    startLocationSimulation() {
        this.log('Starting location simulation (updates every 5 seconds)', 'info');
        
        this.locationInterval = setInterval(() => {
            this.updateLocation();
        }, 5000);

        // Stop after 30 seconds
        setTimeout(() => {
            if (this.locationInterval) {
                clearInterval(this.locationInterval);
                this.log('Location simulation stopped', 'info');
            }
        }, 30000);
    }

    getChats() {
        const data = { user_id: this.userId };
        this.socket.emit('get-chats', data);
        this.log(`Getting chats: ${JSON.stringify(data)}`, 'outgoing');
    }

    sendChatMessage() {
        const data = {
            sender_id: this.userId,
            recipient_id: 'test_recipient_123', // You can modify this
            ride_id: this.currentRideId,
            message: 'Hello! This is a test message from Node.js client.',
            message_type: 'text'
        };

        this.socket.emit('chat-message', data);
        this.log(`Sending chat message: ${JSON.stringify(data)}`, 'outgoing');
    }

    startTyping() {
        const data = {
            sender_id: this.userId,
            recipient_id: 'test_recipient_123',
            ride_id: this.currentRideId,
            is_typing: true
        };

        this.socket.emit('chat-typing', data);
        this.log(`Started typing: ${JSON.stringify(data)}`, 'outgoing');
    }

    stopTyping() {
        const data = {
            sender_id: this.userId,
            recipient_id: 'test_recipient_123',
            ride_id: this.currentRideId,
            is_typing: false
        };

        this.socket.emit('chat-typing', data);
        this.log(`Stopped typing: ${JSON.stringify(data)}`, 'outgoing');
    }

    getRewards() {
        const data = { user_id: this.userId };
        this.socket.emit('rewards', data);
        this.log(`Getting rewards: ${JSON.stringify(data)}`, 'outgoing');
    }

    getReferrals() {
        const data = { user_id: this.userId };
        this.socket.emit('referrals', data);
        this.log(`Getting referrals: ${JSON.stringify(data)}`, 'outgoing');
    }

    sendCustomEvent() {
        this.rl.question('Enter event name: '.cyan, (eventName) => {
            if (!eventName.trim()) {
                this.log('Event name cannot be empty', 'error');
                return;
            }

            this.rl.question('Enter JSON data (or press Enter for default): '.cyan, (jsonData) => {
                let data;
                
                if (!jsonData.trim()) {
                    data = { user_id: this.userId };
                } else {
                    try {
                        data = JSON.parse(jsonData);
                    } catch (e) {
                        this.log(`Invalid JSON: ${e.message}`, 'error');
                        return;
                    }
                }

                this.socket.emit(eventName.trim(), data);
                this.log(`Custom event "${eventName}": ${JSON.stringify(data)}`, 'outgoing');
            });
        });
    }

    changeUserId() {
        this.rl.question('Enter new user ID: '.cyan, (newUserId) => {
            if (!newUserId.trim()) {
                this.log('User ID cannot be empty', 'error');
                return;
            }

            this.userId = newUserId.trim();
            this.log(`User ID changed to: ${this.userId}`, 'success');
            
            // Rejoin room with new user ID
            this.joinRoom();
        });
    }

    setRideId() {
        this.rl.question('Enter ride ID: '.cyan, (rideId) => {
            this.currentRideId = rideId.trim() || null;
            this.log(`Ride ID set to: ${this.currentRideId || 'None'}`, 'success');
        });
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const serverUrl = args[0] || DEFAULT_SERVER;
    const userId = args[1] || DEFAULT_USER_ID;

    console.log('🚗 Rideshare Platform - Node.js Socket.IO Test Client'.bold.cyan);
    console.log('='.repeat(60));
    
    if (args.length === 0) {
        console.log('💡 Usage: node socket-test-client.js [server_url] [user_id]'.yellow);
        console.log(`📡 Using default server: ${serverUrl}`);
        console.log(`👤 Using default user ID: ${userId}`);
        console.log('');
    }

    const client = new RideshareSocketClient(serverUrl, userId);
    
    // Handle missing colors dependency gracefully
    if (typeof colors === 'undefined') {
        console.log('⚠️  Install "colors" package for better output: npm install colors');
        // Define dummy color functions
        ['red', 'green', 'yellow', 'cyan', 'magenta', 'white', 'blue', 'bold'].forEach(color => {
            String.prototype[color] = String.prototype[color] || function() { return this; };
        });
    }
    
    client.connect();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
    main();
}

module.exports = RideshareSocketClient;