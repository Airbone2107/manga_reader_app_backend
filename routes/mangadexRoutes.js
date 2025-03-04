const express = require('express');
const router = express.Router();
const axios = require('axios');

// Cấu hình chung cho tất cả request đến MangaDex API
const mangadexClient = axios.create({
  baseURL: 'https://api.mangadex.org',
  headers: {
    'User-Agent': 'MangaReaderWeb/1.0',
    'Content-Type': 'application/json'
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
    console.error('Lỗi trong /manga:', error.message);
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
    console.error('Lỗi trong /manga/:id:', error.message);
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
    console.error('Lỗi trong /manga/:id/feed:', error.message);
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
    console.error('Lỗi trong /cover:', error.message);
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
    console.error('Lỗi trong /at-home/server/:chapterId:', error.message);
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
    console.error('Lỗi trong /manga/tag:', error.message);
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
    console.error('Lỗi trong /manga-by-ids:', error.message);
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
    console.error('Lỗi khi proxy hình ảnh:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Lỗi khi tải hình ảnh',
      details: error.message
    });
  }
});

module.exports = router; 