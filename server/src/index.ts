import express from 'express';
import cors from 'cors';
import path from 'path';
import roomsRouter from './routes/rooms';
import reservationsRouter from './routes/reservations';

const app = express();
const PORT = process.env.PORT || 3001;
const ACCESS_KEY = process.env.ACCESS_KEY || '';

app.use(cors());
app.use(express.json());

// Protect API routes with access key
app.use('/api', (req, res, next) => {
  if (!ACCESS_KEY) return next();
  const token = req.headers['x-access-key'] as string;
  if (token === ACCESS_KEY) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

// API routes
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');

const DENIED_HTML = `<!DOCTYPE html><html><head><title>Access Denied</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc">
<div style="text-align:center"><h1 style="color:#1e293b">Access Denied</h1><p style="color:#64748b">You don't have permission to view this calendar.</p></div>
</body></html>`;

function checkPageAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!ACCESS_KEY) return next();
  if (req.query.access_key === ACCESS_KEY) return next();
  res.status(401).send(DENIED_HTML);
}

app.use(express.static(clientDist, { index: false }));
app.get('*', checkPageAccess, (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
