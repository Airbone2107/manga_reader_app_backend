const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const mangadexRoutes = require('./routes/mangadexRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

// Route mặc định
app.get('/', (req, res) => {
  res.send('Manga Reader Backend đang chạy!');
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Lắng nghe cổng
app.listen(port, () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});
