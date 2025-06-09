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
    try {
        const { ownerName, shelterName, shelterWebsite, contactDetails, description } = req.body;
        const images = req.files.map(file => file.path);

        const newShelter = new Shelter({
            ownerName,
            shelterName,
            shelterWebsite,
            contactDetails,
            description,
            images
        });

        await newShelter.save();
        res.status(201).json(newShelter);
    } catch (error) {
        res.status(500).json({ error: 'Failed to register shelter' });
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
