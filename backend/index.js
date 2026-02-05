import express from 'express';
import path from 'path';

const app = express();

// Needed for Canvas POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Canvas route
const canvasRoute = require('./routes/canvas');
app.use('/canvas', canvasRoute);

// Serve React build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
