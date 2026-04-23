import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { membersRouter } from './routes/members.js';
import { workPackagesByProjectRouter, workPackagesRouter } from './routes/workPackages.js';
import { authRequired } from './middleware/auth.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: false,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);

app.use('/api/projects', authRequired, projectsRouter);
app.use('/api/projects/:projectId/members', authRequired, membersRouter);
app.use('/api/projects/:projectId/work-packages', authRequired, workPackagesByProjectRouter);
app.use('/api/work-packages', authRequired, workPackagesRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint failed', meta: err.meta });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Progress-Hub API listening on :${port}`);
});
