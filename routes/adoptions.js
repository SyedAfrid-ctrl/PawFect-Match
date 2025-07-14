const express = require('express');
const router = express.Router();


const jwt = require('jsonwebtoken');
const Pet = require('../models/Pet');
const User = require('../models/User');
const AdoptionRequest = require('../models/AdoptionRequest');
const nodemailer = require('nodemailer');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.body;
    if (!petId) return res.status(400).json({ error: 'Pet ID required' });

    // Get logged-in user info
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get pet info
    const pet = await Pet.findById(petId).populate('owner', 'username email');
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    const owner = pet.owner;
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    // Save adoption request to DB
    const adoptionRequest = new AdoptionRequest({
      user_id: user._id,
      pet_id: pet._id,
      owner_id: owner._id,
      owner_username: owner.username
    });
    await adoptionRequest.save();
    console.log('Adoption request saved:', adoptionRequest);

    // Send email notification to owner
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `PawFect Match <${process.env.EMAIL_USER}>`,
      to: owner.email,
      subject: `Adoption Request for ${pet.name}`,
      text: `Hi ${owner.username},\n\nYou have received an adoption request for ${pet.name} from ${user.username}. Please log in to your account to review the request.\n\nBest regards,\nPawFect Match Team`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Adoption email sent to:', owner.email);
    } catch (emailErr) {
      console.error('Error sending adoption email:', emailErr);
    }

    res.json({ message: 'Adoption request saved and email sent!', request: adoptionRequest });
  } catch (err) {
    console.error('Adoption request error:', err);
    res.status(500).json({ error: 'Failed to send adoption request.' });
  }
});

module.exports = router;
