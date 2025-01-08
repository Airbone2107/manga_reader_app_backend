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
      type: String,
      required: true
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  tokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d' // Tự động xóa token sau 7 ngày
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Thêm method để quản lý token
userSchema.methods.addToken = async function(token) {
  this.tokens = this.tokens || [];
  this.tokens.push({ token });
  await this.save();
  return token;
};

userSchema.methods.removeToken = async function(token) {
  this.tokens = this.tokens.filter(t => t.token !== token);
  await this.save();
};

module.exports = mongoose.model('User', userSchema); 