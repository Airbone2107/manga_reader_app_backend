const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  photoURL: {
    type: String
  },
  followingManga: [{
    type: String // Manga IDs
  }],
  readingManga: [{
    mangaId: {
      type: String,
      required: true
    },
    lastChapter: {
      type: Number,
      required: true
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 