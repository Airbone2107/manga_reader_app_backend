const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Đăng ký/Đăng nhập user với Google
router.post('/auth/google', async (req, res) => {
  try {
    const { googleId, email, displayName, photoURL } = req.body;
    
    // Tìm user theo googleId
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Tạo user mới nếu chưa tồn tại
      user = new User({
        googleId,
        email,
        displayName,
        photoURL,
        followingManga: [],
        readingManga: []
      });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Thêm manga vào danh sách theo dõi
router.post('/following/:userId', async (req, res) => {
  try {
    const { mangaId } = req.body;
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

// Cập nhật trạng thái đọc manga
router.post('/reading/:userId', async (req, res) => {
  try {
    const { mangaId, lastChapter } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    const readingIndex = user.readingManga.findIndex(m => m.mangaId === mangaId);
    
    if (readingIndex > -1) {
      user.readingManga[readingIndex] = {
        mangaId,
        lastChapter,
        lastReadAt: new Date()
      };
    } else {
      user.readingManga.push({
        mangaId,
        lastChapter,
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