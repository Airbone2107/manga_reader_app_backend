const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const mangadexRoutes = require('./routes/mangadexRoutes');
const fs = require('fs');
const path = require('path');

// Kiểm tra các biến môi trường bắt buộc
const requiredEnvVars = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'DB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not defined in environment variables`);
    process.exit(1);
  }
}

// Khởi tạo thư mục logs nếu chưa tồn tại
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware để log tất cả các request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'NhatDex_UserDB'
})
.then(() => console.log('Đã kết nối với MongoDB - Database: NhatDex_UserDB'))
.catch((error) => console.log('Lỗi kết nối MongoDB:', error));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/mangadex', mangadexRoutes);

// Route mặc định - Thêm một số route quan trọng
app.get('/', (req, res) => {
  res.send('Manga Reader Backend đang chạy!');
});

// Route test kết nối
app.get('/ping', (req, res) => {
  res.json({ status: 'success', message: 'Pong! Server đang hoạt động', timestamp: new Date() });
});

// Route kiểm tra trạng thái
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: require('./package.json').version,
    uptime: process.uptime(),
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route test mangadex đơn giản
app.get('/api/test-mangadex', async (req, res) => {
  try {
    res.json({ message: 'Route test MangaDex hoạt động', routes: [
      '/api/mangadex/manga',
      '/api/mangadex/manga/:id',
      '/api/mangadex/manga/:id/feed',
      '/api/mangadex/manga/tag',
      '/api/mangadex/cover'
    ]});
  } catch (error) {
    res.status(500).json({ error: 'Không thể kết nối đến test route' });
  }
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ERROR: ${err.stack}`;
  
  console.error(logMessage);
  
  // Ghi log vào file
  fs.appendFile(
    path.join(logDir, 'error.log'), 
    logMessage + '\n', 
    (err) => {
      if (err) console.error('Không thể ghi log vào file:', err);
    }
  );
  
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: err.message,
    timestamp
  });
});

// Middleware cho route không tồn tại
app.use((req, res) => {
  const message = `Route không tồn tại: ${req.originalUrl}`;
  console.log(message);
  res.status(404).json({ message });
});

// Lắng nghe cổng
app.listen(port, '0.0.0.0', () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});
