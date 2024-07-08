const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const Port = 4001; // Change to your desired port

// Configure CORS options for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'], // Allowed methods
    credentials: true, // Allow cookies
  }
});

// Enable CORS for Express server
app.use(cors({ origin: '*' })); // Allow all origins

// Your Express routes and other middleware here
app.get('/', (req, res) => {
  res.send('Welcome to the server');
});

// User management map for Socket.IO
const users = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining the chat
  socket.on('join', (username) => {
    users.set(socket.id, username);
    const notification = `${username} has joined the chat.`;
    io.emit('notification', notification);
  });

  // Handle incoming messages
  socket.on('msg', (data) => {
    const { user, text } = data;
    const message = {
      user,
      text,
      timestamp: new Date().toISOString()
    };
    io.emit('msg', message);
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      const notification = `${username} has left the chat.`;
      io.emit('notification', notification);
      users.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });

  // Handle user rejoining the chat
  socket.on('rejoin', (username) => {
    console.log(`${username} is rejoining...`);
    const existingUser = Array.from(users).find(([id, name]) => name === username);
    if (existingUser) {
      const [id, name] = existingUser;
      users.delete(id);
      users.set(socket.id, name);
      const notification = `${username} has rejoined the chat.`;
      io.emit('notification', notification);
    } else {
      console.log(`User ${username} not found in active users.`);
    }
  });
});

// Start the server
server.listen(Port, () => {
  console.log(`Server running on port ${Port}`);
});
