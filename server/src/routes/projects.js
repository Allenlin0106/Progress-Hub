import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { projectAccess, requireOwner } from '../middleware/projectAccess.js';

export const projectsRouter = Router();

const projectInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
});

projectsRouter.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: req.user.id } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { workPackages: true, members: true } },
      },
    });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/', async (req, res, next) => {
  try {
    const data = projectInput.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'OWNER' } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { workPackages: true, members: true } },
      },
    });
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id', projectAccess(), async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.project.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { workPackages: true, members: true } },
      },
    });
    res.json({ project, role: req.project.role });
  } catch (err) {
    next(err);
  }
});

projectsRouter.put('/:id', projectAccess(), requireOwner, async (req, res, next) => {
  try {
    const data = projectInput.parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.project.id },
      data: { name: data.name, description: data.description ?? null },
    });
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

projectsRouter.delete('/:id', projectAccess(), requireOwner, async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.project.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
