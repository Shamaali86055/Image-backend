const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

// Upload config
const upload = multer({ storage: multer.memoryStorage() });

// SQLite DB setup
const db = new sqlite3.Database('./images.db');
db.run(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    data BLOB
  )
`);

// Upload API
app.post('/upload', upload.single('image'), (req, res) => {
  const { originalname, mimetype, buffer } = req.file;
  db.run(`INSERT INTO images (name, type, data) VALUES (?, ?, ?)`,
    [originalname, mimetype, buffer],
    err => {
      if (err) return res.status(500).send('Error saving image');
      res.send('Image uploaded!');
    });
});

// Get all image list
app.get('/images', (req, res) => {
  db.all(`SELECT id, name FROM images`, (err, rows) => {
    if (err) return res.status(500).send('Error fetching images');
    res.json(rows);
  });
});

// Download/view image by ID
app.get('/image/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT name, type, data FROM images WHERE id = ?`, [id], (err, row) => {
    if (err || !row) return res.status(404).send('Image not found');
    res.setHeader('Content-Type', row.type);
    res.setHeader('Content-Disposition', `attachment; filename="${row.name}"`);
    res.send(row.data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
