 
const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(express.static('public')); // Serve static files like images or documents
const upload = multer(); // Initialize multer for file uploads

// PostgreSQL Connection
const pool = new Pool({
  connectionString: 'postgres://admin:password@localhost:5432/employee_portal'
});

// Test Route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Save Announcements
app.post('/api/announcements', async (req, res) => {
  const { date, title, description } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO announcements (date, title, description) VALUES ($1, $2, $3) RETURNING *',
      [date, title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save announcement' });
  }
});

// Fetch Announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY date DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Save Uploaded Photos
app.post('/api/photos', upload.array('photos'), (req, res) => {
  const { category, title, description } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const photoPaths = req.files.map(file => ({
    filename: file.originalname,
    buffer: file.buffer.toString('base64'), // Convert to Base64 for easy storage
  }));

  // Save to database or file system (example assumes database)
  pool.query(
    'INSERT INTO photos (category, title, description, photos) VALUES ($1, $2, $3, $4) RETURNING *',
    [category, title, description, JSON.stringify(photoPaths)],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save photos' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    }
  );
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});