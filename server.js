const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json()); // Để xử lý JSON

const PORT = process.env.PORT || 5000;
const DB_URI = process.env.DB_URI;

// Kết nối đến MongoDB
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Kết nối MongoDB thành công!'))
  .catch(err => console.log('Lỗi kết nối MongoDB:', err));

// Định nghĩa route cơ bản
app.get('/', (req, res) => {
  res.send('Backend của MangaDex!');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
