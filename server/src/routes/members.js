import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { projectAccess, requireOwner } from '../middleware/projectAccess.js';

export const membersRouter = Router({ mergeParams: true });

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'MEMBER']).optional(),
});

membersRouter.get('/', projectAccess('projectId'), async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { projectId: req.project.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { id: 'asc' },
    });
    res.json({ members });
  } catch (err) {
    next(err);
  }
});

membersRouter.post('/', projectAccess('projectId'), requireOwner, async (req, res, next) => {
  try {
    const { email, role } = addMemberSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: 'No user with that email' });

    const existing = await prisma.member.findUnique({
      where: { projectId_userId: { projectId: req.project.id, userId: user.id } },
    });
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    const member = await prisma.member.create({
      data: { projectId: req.project.id, userId: user.id, role: role ?? 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

membersRouter.delete(
  '/:userId',
  projectAccess('projectId'),
  requireOwner,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.userId);
      if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid userId' });

      const project = await prisma.project.findUnique({ where: { id: req.project.id } });
      if (userId === project.ownerId) {
        return res.status(400).json({ error: 'Cannot remove project owner' });
      }

      await prisma.member.delete({
        where: { projectId_userId: { projectId: req.project.id, userId } },
      });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
