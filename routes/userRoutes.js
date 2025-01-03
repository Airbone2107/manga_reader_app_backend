const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Đăng ký/Đăng nhập user với Google
router.get('/auth/google', async (req, res) => {
  try {
    const { googleId, email, displayName, photoURL } = req.query;
    console.log('Received auth request:', { googleId, email, displayName, photoURL });
    
    let user = await User.findOne({ googleId });
    console.log('Found existing user:', user);
    
    if (!user) {
      user = new User({
        googleId,
        email,
        displayName,
        photoURL,
        followingManga: [],
        readingManga: []
      });
      await user.save();
      console.log('Created new user:', user);
    }
    
    res.json(user);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Thêm manga vào danh sách theo dõi
router.get('/following/:userId', async (req, res) => {
  try {
    const { mangaId } = req.query;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    if (!user.followingManga.includes(mangaId)) {
      user.followingManga.push(mangaId);
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Xóa manga khỏi danh sách theo dõi
router.delete('/following/:userId', async (req, res) => {
  try {
    const { mangaId } = req.query;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    user.followingManga = user.followingManga.filter(id => id !== mangaId);
    await user.save();
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cập nhật tiến độ đọc
router.get('/reading/:userId', async (req, res) => {
  try {
    const { mangaId, lastChapter } = req.query;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const readingIndex = user.readingManga.findIndex(m => m.mangaId === mangaId);
    
    if (readingIndex > -1) {
      user.readingManga[readingIndex] = {
        mangaId,
        lastChapter: parseInt(lastChapter),
        lastReadAt: new Date()
      };
    } else {
      user.readingManga.push({
        mangaId,
        lastChapter: parseInt(lastChapter),
        lastReadAt: new Date()
      });
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 