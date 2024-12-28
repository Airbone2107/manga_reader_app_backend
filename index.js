const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Đã kết nối với MongoDB'))
.catch((error) => console.log('Lỗi kết nối MongoDB:', error));

// Routes
app.use('/api/users', userRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.send('Manga Reader Backend đang chạy!');
});

// Lắng nghe cổng
app.listen(port, () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});
