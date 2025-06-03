const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
  request_id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner_username: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  request_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);
