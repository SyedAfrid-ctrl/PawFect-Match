const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  age: { type: String, required: true },
  gender: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  location: { type: String },
});

module.exports = mongoose.model('Pet', petSchema);
