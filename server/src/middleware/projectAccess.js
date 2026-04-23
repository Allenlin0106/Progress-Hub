import { prisma } from '../db.js';

export function projectAccess(paramName = 'id') {
  return async (req, res, next) => {
    const projectId = Number(req.params[paramName]);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const membership = await prisma.member.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }
    req.project = { id: projectId, role: membership.role };
    next();
  };
}

export function requireOwner(req, res, next) {
  if (req.project?.role !== 'OWNER') {
    return res.status(403).json({ error: 'Owner role required' });
  }
  next();
}
