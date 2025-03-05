const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Khởi tạo thư mục logs cho MangaDex nếu chưa tồn tại
const mangadexLogDir = path.join(__dirname, '../logs/mangadex');
if (!fs.existsSync(mangadexLogDir)) {
  fs.mkdirSync(mangadexLogDir, { recursive: true });
}

// Hàm ghi log lỗi
const logMangadexError = (endpoint, error, request = null) => {
  const timestamp = new Date().toISOString();
  const logFile = path.join(mangadexLogDir, 'mangadex_errors.log');
  
  let logMessage = `[${timestamp}] ERROR ${endpoint}: ${error.message}\n`;
  
  // Thêm thông tin chi tiết về lỗi response nếu có
  if (error.response) {
    logMessage += `Status: ${error.response.status}\n`;
    logMessage += `Headers: ${JSON.stringify(error.response.headers)}\n`;
    logMessage += `Data: ${JSON.stringify(error.response.data)}\n`;
  }
  
  // Thêm thông tin request nếu có
  if (request) {
    logMessage += `Request: ${JSON.stringify(request)}\n`;
  }
  
  logMessage += '-'.repeat(80) + '\n';
  
  console.error(logMessage);
  
  // Ghi log vào file
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error('Không thể ghi log lỗi MangaDex:', err);
  });
};

// Hàm ghi log request
const logMangadexRequest = (endpoint, params = {}) => {
  const timestamp = new Date().toISOString();
  const logFile = path.join(mangadexLogDir, 'mangadex_requests.log');
  
  const logMessage = `[${timestamp}] REQUEST ${endpoint} - Params: ${JSON.stringify(params)}\n`;
  
  // Ghi log vào file 
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error('Không thể ghi log request MangaDex:', err);
  });
};

// Cấu hình chung cho tất cả request đến MangaDex API với interceptors để ghi log
const mangadexClient = axios.create({
  baseURL: 'https://api.mangadex.org',
  headers: {
    'User-Agent': 'MangaReaderWeb/1.0',
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 giây timeout
});

// Interceptor cho request
mangadexClient.interceptors.request.use(
  (config) => {
    const endpoint = config.url;
    logMangadexRequest(endpoint, config.params);
    return config;
  },
  (error) => {
    logMangadexError('REQUEST_ERROR', error);
    return Promise.reject(error);
  }
);

// Kiểm tra trạng thái API MangaDex
router.get('/status', async (req, res) => {
  try {
    const startTime = Date.now();
    const response = await mangadexClient.get('/ping');
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'online',
      pingResponse: response.data,
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    logMangadexError('/status', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể kết nối đến MangaDex API',
      error: error.message
    });
  }
});

// Lấy danh sách manga
router.get('/manga', async (req, res) => {
  try {
    const response = await mangadexClient.get('/manga', {
      params: req.query // Chuyển tiếp tất cả query params
    });
    res.json(response.data);
  } catch (error) {
    logMangadexError('/manga', error, req.query);
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải manga',
      details: error.response?.data || error.message
    });
  }
});

// Lấy chi tiết manga
router.get('/manga/:id', async (req, res) => {
  try {
    const response = await mangadexClient.get(`/manga/${req.params.id}`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    logMangadexError(`/manga/${req.params.id}`, error, {
      params: req.params,
      query: req.query
    });
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải chi tiết manga',
      details: error.response?.data || error.message
    });
  }
});

// Lấy danh sách chapters của manga
router.get('/manga/:id/feed', async (req, res) => {
  try {
    const response = await mangadexClient.get(`/manga/${req.params.id}/feed`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    logMangadexError(`/manga/${req.params.id}/feed`, error, {
      params: req.params,
      query: req.query
    });
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải danh sách chương',
      details: error.response?.data || error.message
    });
  }
});

// Lấy thông tin ảnh bìa
router.get('/cover', async (req, res) => {
  try {
    const response = await mangadexClient.get('/cover', {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    logMangadexError('/cover', error, req.query);
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải ảnh bìa',
      details: error.response?.data || error.message
    });
  }
});

// Lấy thông tin server và pages cho một chapter
router.get('/at-home/server/:chapterId', async (req, res) => {
  try {
    const response = await mangadexClient.get(`/at-home/server/${req.params.chapterId}`);
    res.json(response.data);
  } catch (error) {
    logMangadexError(`/at-home/server/${req.params.chapterId}`, error, {
      params: req.params
    });
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải các trang chương',
      details: error.response?.data || error.message
    });
  }
});

// Lấy danh sách tags
router.get('/manga/tag', async (req, res) => {
  try {
    const response = await mangadexClient.get('/manga/tag');
    res.json(response.data);
  } catch (error) {
    logMangadexError('/manga/tag', error);
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải danh sách tags',
      details: error.response?.data || error.message
    });
  }
});

// Lấy manga theo danh sách ID
router.get('/manga-by-ids', async (req, res) => {
  try {
    const ids = req.query.ids || [];
    if (!ids.length) {
      return res.json({ data: [] });
    }
    
    const response = await mangadexClient.get('/manga', {
      params: { ids: ids }
    });
    res.json(response.data);
  } catch (error) {
    logMangadexError('/manga-by-ids', error, req.query);
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải manga theo IDs',
      details: error.response?.data || error.message
    });
  }
});

// Proxy cho hình ảnh
router.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'URL hình ảnh không được cung cấp' });
  }
  
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'MangaReaderWeb/1.0'
      }
    });
    
    // Chuyển tiếp headers về content-type
    res.set('Content-Type', response.headers['content-type']);
    
    // Pipe stream hình ảnh về client
    response.data.pipe(res);
  } catch (error) {
    logMangadexError('/proxy-image', error, { imageUrl });
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải hình ảnh',
      details: error.message
    });
  }
});

module.exports = router; 