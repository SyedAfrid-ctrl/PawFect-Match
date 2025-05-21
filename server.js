require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const adoptionsRoutes = require('./routes/adoptions');
const storiesRoutes = require('./routes/stories');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
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
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));


// Body parsers must come BEFORE routes that need req.body
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/adoptions', adoptionsRoutes);
app.use('/api/stories', storiesRoutes);

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

// Start Server (use http server for Socket.IO)
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
