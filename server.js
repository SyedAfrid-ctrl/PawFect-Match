require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const adoptionsRoutes = require('./routes/adoptions');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500', // your frontend origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));

// Routes
app.use('/routes/auth', authRoutes);
app.use('/routes/pets', petRoutes);
app.use('/api/adoptions', adoptionsRoutes);

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

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
