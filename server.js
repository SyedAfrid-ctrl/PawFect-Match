require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const adoptionsRoutes = require('./routes/adoptions');
const storiesRoutes = require('./routes/stories');
const chatRoutes = require('./routes/chat');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const AdoptionRequest = require('./models/AdoptionRequest');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5000;

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(req.method, req.url, req.headers['content-type'], req.headers['content-length']);
  next();
});

// Middleware
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:5501'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  // Removed deprecated options
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));


// Body parsers must come BEFORE routes that need req.body
app.use(express.json());
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/adoptions', adoptionsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/adoption-request', (req, res, next) => next()); // Ensure adoption request route is mounted

// Static file serving should come after API routes
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Add filtering for pets by type, age, and location
app.get('/api/pets', async (req, res) => {
  try {
    const { type, age, location } = req.query;
    let filter = {};
    if (type) filter.type = new RegExp(type, 'i');
    if (age) filter.age = new RegExp(age, 'i');
    if (location) filter.description = new RegExp(location, 'i'); // assuming location is in description
    const pets = await require('./models/Pet').find(filter);
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pets' });
  }
});

// Route to handle adoption requests
app.post('/api/adoption-request', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log request body

    const { user_id, pet_id, user_email, pet_name, owner_id, owner_username, logged_in_username } = req.body;

    // Create a new adoption request
    const newRequest = new AdoptionRequest({ user_id, pet_id, owner_id, owner_username });
    await newRequest.save();

    // Send notification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `PawFect Match <${process.env.EMAIL_USER}>`,
      to: user_email,
      subject: `Adoption Request for ${pet_name}`,
      text: `Hi ${owner_username},

${logged_in_username} (${user_email}) wants to adopt ${pet_name} on PawFect Match.

Join the adoption process.

On behalf of PawFect Match,
The PawFect Match team.`
    };

    console.log('Email options:', mailOptions); // Log email options

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Adoption request submitted successfully and email notification sent.' });
  } catch (error) {
    console.error('Error handling adoption request:', error);
    res.status(500).json({ error: 'Failed to submit adoption request.' });
  }
});

// Socket.IO real-time chat handlers
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for joining a chat
  socket.on('join_chat', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their chat room.`);
  });

  // Listen for sending a message
  socket.on('send_message', async (data) => {
    const { sender, receiver, content } = data;
    const message = {
      sender,
      receiver,
      content,
      timestamp: new Date()
    };

    // Save message to database
    const Chat = require('./models/Chat');
    const newMessage = new Chat(message);
    await newMessage.save();

    // Emit message to receiver
    io.to(receiver).emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start Server (use http server for Socket.IO)
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
