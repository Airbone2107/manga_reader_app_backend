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

  if (!accessToken) {
    return res.status(400).json({ message: 'Không có token xác thực' });
  }

  try {
    // Xác thực accessToken và lấy thông tin người dùng từ Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify Google token');
    }

    const userData = await response.json();
    const { email, id, name, picture } = userData;

    // Tìm hoặc tạo user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        googleId: id,
        email,
        displayName: name,
        photoURL: picture,
      });
      await user.save();
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    // Lưu token vào cơ sở dữ liệu
    await user.addToken(token);

    res.json({ token });
  } catch (error) {
    console.error('Lỗi xác thực Google:', error);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

// Thêm manga vào danh sách theo dõi
router.post('/follow', authenticateToken, async (req, res) => {
  try {
    const { mangaId } = req.body; // Sử dụng req.body thay vì req.query
    const user = await User.findById(req.user.userId); // Lấy user từ token (req.user.id)

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
router.post('/unfollow', authenticateToken, async (req, res) => {
  try {
    const { mangaId } = req.body; // Sử dụng req.body thay vì req.query
    const user = await User.findById(req.user.userId);// Lấy user từ token (req.user.id)

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
router.post('/reading-progress', authenticateToken, async (req, res) => {
  try {
    const { mangaId, lastChapter } = req.body;
    const user = await User.findById(req.user.userId);
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
        lastChapter: lastChapter.toString(),
        lastReadAt: new Date()
      };
    } else {
      user.readingManga.push({
        mangaId,
        lastChapter: lastChapter.toString(),
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

// Route lấy thông tin người dùng từ token
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route đăng xuất
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
});

// API kiểm tra xem người dùng có theo dõi manga không
router.get('/user/following/:mangaId', authenticateToken, async (req, res) => {
  const { mangaId } = req.params;

  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra xem mangaId có trong danh sách manga đang theo dõi của người dùng không
    const isFollowing = user.followingManga.includes(mangaId);

    // Trả về true hoặc false
    res.json(isFollowing); // Trả về true nếu đang theo dõi, false nếu không theo dõi
  } catch (error) {
    console.error('Error checking following status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 