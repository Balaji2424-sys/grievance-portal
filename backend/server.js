const express = require('express');
const cors = require('cors');

const complaintsRouter = require('./routes/complaints');
const messagesRouter = require('./routes/messages');
const adminRouter = require('./routes/admin');
const superRouter = require('./routes/super');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('API Running');
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/complaints', complaintsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/super', superRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
