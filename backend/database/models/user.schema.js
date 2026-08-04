const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type:String,
    required:true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  age: {
    type: Number,
    min: 0
  },
  salary: {
    type: Number,
    trim: true
  }
});

module.exports = mongoose.model("users",userSchema);