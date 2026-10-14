import { prisma } from '../lib/prisma.js';

export async function requireSuperadmin(req, res, next) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { role: true },
  });
  if (user?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acceso reservado para superadministración' });
  }
  req.userRole = user.role;
  next();
}
