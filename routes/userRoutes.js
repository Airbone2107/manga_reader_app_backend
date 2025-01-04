const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware xác thực JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Không tìm thấy token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Sửa route đăng nhập Google
router.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body; // Nhận Google token từ frontend
    
    // Xác thực Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name: displayName, picture: photoURL } = payload;
    
    // Tìm hoặc tạo user
    let user = await User.findOne({ googleId });
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
    }
    
    // Tạo JWT token
    const userToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Lưu token vào database
    await user.addToken(userToken);
    
    res.json({ user, token: userToken });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Thêm manga vào danh sách theo dõi
router.get('/following/:userId', authenticateToken, async (req, res) => {
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
router.delete('/following/:userId', authenticateToken, async (req, res) => {
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
router.get('/reading/:userId', authenticateToken, async (req, res) => {
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

// Thêm route đăng xuất
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await req.user.removeToken(token);
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 