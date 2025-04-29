const express = require('express');
const multer = require('multer');
const path = require('path');
const Pet = require('../models/Pet');

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Add Pet
router.post('/', upload.single('image'), async (req, res) => {
  const { name, type, age, gender, description, location } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const pet = new Pet({ name, type, age, gender, description, location, image });
    await pet.save();
    res.status(201).json({ message: 'Pet added successfully', pet });
  } catch (err) {
    res.status(500).json({ error: 'Error adding pet' });
  }
});

// Get Pets with filtering
router.get('/', async (req, res) => {
  try {
    const { type, age, location } = req.query;
    let filter = {};
    if (type) filter.type = new RegExp(type, 'i');
    if (age) filter.age = new RegExp(age, 'i');
    if (location) filter.location = new RegExp(location, 'i');
    const pets = await Pet.find(filter);
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pets' });
  }
});

// Get single pet by ID
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    res.json(pet);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pet' });
  }
});

module.exports = router;
