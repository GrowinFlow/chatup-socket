const { Server } = require('socket.io');
const http = require('http');

const Port = 4001; // The port your server will listen on
const server = http.createServer(); // Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: "*" // Allow all origins for CORS
  }
});

const users = new Map(); // Use a Map to store active users

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle 'join' event
  socket.on('join', (username) => {
    users.set(socket.id, username); // Map socket ID to username
    const notification = `${username} has joined the chat.`;
    io.emit('notification', notification); // Notify all clients
  });

  // Handle 'msg' event
  socket.on('msg', (data) => {
    const { user, text } = data;
    const message = {
      user,
      text,
      timestamp: new Date().toISOString() // Add a timestamp to the message
    };
    io.emit('msg', message); // Broadcast the message to all clients
  });

  // Handle 'disconnect' event
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      const notification = `${username} has left the chat.`;
      io.emit('notification', notification); // Notify all clients
      users.delete(socket.id); // Remove the user from the Map
    }
    console.log('User disconnected:', socket.id);
  });

  // Handle 'rejoin' event
  socket.on('rejoin', (username) => {
    console.log(`${username} is rejoining...`);
    const existingUser = Array.from(users).find(([id, name]) => name === username);
    if (existingUser) {
      const [id, name] = existingUser;
      users.set(socket.id, name); // Remap the new socket ID to the username
      const notification = `${username} has rejoined the chat.`;
      io.emit('notification', notification); // Notify all clients
    } else {
      console.log(`User ${username} not found in active users.`);
    }
  });
});

server.listen(Port, () => {
  console.log(`Server running on port ${Port}`);
});
