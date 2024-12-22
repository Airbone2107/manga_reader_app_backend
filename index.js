const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.log('Error connecting to MongoDB:', error));

// Định nghĩa route API
app.get('/', (req, res) => {
  res.send('Manga Reader Backend is running!');
});

// Lắng nghe cổng
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
