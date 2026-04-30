import express from 'express';
import cors from 'cors';
import path from 'path';
import roomsRouter from './routes/rooms';
import reservationsRouter from './routes/reservations';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
