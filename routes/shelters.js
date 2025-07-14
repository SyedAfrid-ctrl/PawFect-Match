const express = require('express');
const router = express.Router();
const Shelter = require('../models/Shelter');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/imgShelter'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Register a new shelter
router.post('/register', authenticate, upload.array('images', 10), async (req, res) => {
    let responded = false;
    // Timeout to prevent hanging requests
    setTimeout(() => {
        if (!responded) {
            console.error('Shelter registration request timed out');
            res.status(504).json({ error: 'Shelter registration request timed out' });
        }
    }, 10000); // 10 seconds
    try {
        console.log('Step 1: Received request');
        console.log('Step 2: Body:', req.body);
        console.log('Step 3: Files:', req.files);
        const { ownerName, shelterName, shelterWebsite, contactNumber, contactEmail, description } = req.body;
        const images = req.files && req.files.length > 0 ? req.files.map(file => file.path) : [];

        if (!ownerName || !shelterName || !contactNumber || !contactEmail || !description) {
            responded = true;
            return res.status(400).json({ error: 'Missing required fields', body: req.body, files: req.files });
        }

        console.log('Step 4: Creating shelter object');
        const newShelter = new Shelter({
            ownerName,
            shelterName,
            shelterWebsite,
            contactNumber,
            contactEmail,
            description,
            images
        });

        console.log('Step 5: Saving to database');
        await newShelter.save();
        responded = true;
        res.status(201).json(newShelter);
    } catch (error) {
        responded = true;
        console.error('Shelter registration error:', error);
        res.status(500).json({
            error: 'Failed to register shelter',
            details: error.message,
            stack: error.stack,
            body: req.body,
            files: req.files
        });
    }
});

// Get all shelters (accessible only to logged-in users)
router.get('/', authenticate, async (req, res) => {
    try {
        const shelters = await Shelter.find();
        res.json(shelters);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shelters' });
    }
});

module.exports = router;
