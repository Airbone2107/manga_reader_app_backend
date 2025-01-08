const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { JWT_SECRET, GOOGLE_CLIENT_ID } = process.env;

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token không tìm thấy' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ' });
    req.user = user; // Lưu thông tin user từ token
    next();
  });
};

// Sửa route đăng nhập Google
router.post('/auth/google', async (req, res) => {
  const { accessToken } = req.body;

  try {
    // Xác thực token từ Google
    const ticket = await client.verifyIdToken({
      idToken: accessToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userId = payload.sub; // Lấy Google ID làm userId

    // Tạo JWT token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ userId, token });
  } catch (error) {
    console.error('Lỗi xác thực Google:', error);
    res.status(401).json({ message: 'Xác thực Google thất bại' });
  }
});

// Thêm manga vào danh sách theo dõi
router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const { mangaId } = req.query;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    if (!mangaId) {
      return res.status(400).json({ message: 'Thiếu mangaId' });
    }

    if (!user.followingManga.includes(mangaId)) {
      user.followingManga.push(mangaId);
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Xóa manga khỏi danh sách theo dõi
router.post('/:userId/unfollow', authenticateToken, async (req, res) => {
  try {
    const { mangaId } = req.query;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (!mangaId) {
      return res.status(400).json({ message: 'Thiếu mangaId' });
    }
    
    user.followingManga = user.followingManga.filter(id => id !== mangaId);
    await user.save();
    
    res.json(user);
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Cập nhật tiến độ đọc
router.post('/:userId/reading-progress', authenticateToken, async (req, res) => {
  try {
    const { mangaId, lastChapter } = req.query;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (!mangaId || !lastChapter) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
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
    console.error('Update reading progress error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route kiểm tra token
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ message: 'Token hợp lệ', userId: req.user.userId });
});

// Route đăng xuất
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
});

module.exports = router; 