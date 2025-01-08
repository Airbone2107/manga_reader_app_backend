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
  tokens: [String], // Mảng chứa các token hợp lệ
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Thêm phương thức để quản lý token
userSchema.methods.addToken = function(token) {
  if (!this.tokens) {
    this.tokens = [];
  }
  this.tokens.push(token);
  return this.save();
};

userSchema.methods.removeToken = function(token) {
  this.tokens = this.tokens.filter(t => t !== token);
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 