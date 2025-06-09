const mongoose = require('mongoose');

const ShelterSchema = new mongoose.Schema({
    ownerName: { type: String, required: true },
    shelterName: { type: String, required: true },
    shelterWebsite: { type: String },
    contactDetails: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shelter', ShelterSchema);
