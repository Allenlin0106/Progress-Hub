import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { projectAccess } from '../middleware/projectAccess.js';

export const workPackagesByProjectRouter = Router({ mergeParams: true });
export const workPackagesRouter = Router();

const STATUSES = ['NEW', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH'];

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

const updateSchema = createSchema.partial();

const moveSchema = z.object({
  status: z.enum(STATUSES),
  position: z.number().int().min(0),
});

const workPackageInclude = {
  assignee: { select: { id: true, name: true, email: true } },
};

async function ensureWorkPackageAccess(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid work package id' });
    return null;
  }
  const wp = await prisma.workPackage.findUnique({ where: { id } });
  if (!wp) {
    res.status(404).json({ error: 'Work package not found' });
    return null;
  }
  const membership = await prisma.member.findUnique({
    where: { projectId_userId: { projectId: wp.projectId, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ error: 'Not a member of this project' });
    return null;
  }
  return wp;
}

async function ensureAssigneeIsMember(projectId, assigneeId) {
  if (assigneeId == null) return true;
  const member = await prisma.member.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
  });
  return !!member;
}

workPackagesByProjectRouter.get('/', projectAccess('projectId'), async (req, res, next) => {
  try {
    const where = { projectId: req.project.id };
    if (req.query.status && STATUSES.includes(String(req.query.status))) {
      where.status = req.query.status;
    }
    const items = await prisma.workPackage.findMany({
      where,
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { id: 'asc' }],
      include: workPackageInclude,
    });
    res.json({ workPackages: items });
  } catch (err) {
    next(err);
  }
});

workPackagesByProjectRouter.post('/', projectAccess('projectId'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (!(await ensureAssigneeIsMember(req.project.id, data.assigneeId ?? null))) {
      return res.status(400).json({ error: 'Assignee must be a project member' });
    }
    const status = data.status ?? 'NEW';
    const last = await prisma.workPackage.findFirst({
      where: { projectId: req.project.id, status },
      orderBy: { position: 'desc' },
    });
    const wp = await prisma.workPackage.create({
      data: {
        projectId: req.project.id,
        title: data.title,
        description: data.description ?? null,
        status,
        priority: data.priority ?? 'NORMAL',
        assigneeId: data.assigneeId ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        position: last ? last.position + 1 : 0,
      },
      include: workPackageInclude,
    });
    res.status(201).json({ workPackage: wp });
  } catch (err) {
    next(err);
  }
});

workPackagesRouter.put('/:id', async (req, res, next) => {
  try {
    const current = await ensureWorkPackageAccess(req, res);
    if (!current) return;
    const data = updateSchema.parse(req.body);
    if (data.assigneeId !== undefined) {
      if (!(await ensureAssigneeIsMember(current.projectId, data.assigneeId))) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }
    const wp = await prisma.workPackage.update({
      where: { id: current.id },
      data: {
        title: data.title ?? undefined,
        description: data.description ?? undefined,
        status: data.status ?? undefined,
        priority: data.priority ?? undefined,
        assigneeId: data.assigneeId === undefined ? undefined : data.assigneeId,
        dueDate:
          data.dueDate === undefined
            ? undefined
            : data.dueDate === null
              ? null
              : new Date(data.dueDate),
      },
      include: workPackageInclude,
    });
    res.json({ workPackage: wp });
  } catch (err) {
    next(err);
  }
});

workPackagesRouter.patch('/:id/move', async (req, res, next) => {
  try {
    const current = await ensureWorkPackageAccess(req, res);
    if (!current) return;
    const { status, position } = moveSchema.parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      const siblings = await tx.workPackage.findMany({
        where: { projectId: current.projectId, status, id: { not: current.id } },
        orderBy: { position: 'asc' },
      });
      const clamped = Math.min(position, siblings.length);
      const reordered = [...siblings];
      reordered.splice(clamped, 0, { id: current.id });
      for (let i = 0; i < reordered.length; i += 1) {
        const item = reordered[i];
        if (item.id === current.id) {
          await tx.workPackage.update({
            where: { id: current.id },
            data: { status, position: i },
          });
        } else if (item.position !== i) {
          await tx.workPackage.update({
            where: { id: item.id },
            data: { position: i },
          });
        }
      }
      return tx.workPackage.findUnique({ where: { id: current.id }, include: workPackageInclude });
    });

    res.json({ workPackage: updated });
  } catch (err) {
    next(err);
  }
});

workPackagesRouter.delete('/:id', async (req, res, next) => {
  try {
    const current = await ensureWorkPackageAccess(req, res);
    if (!current) return;
    await prisma.workPackage.delete({ where: { id: current.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
