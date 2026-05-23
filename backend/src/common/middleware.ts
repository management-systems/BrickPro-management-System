import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from './prisma';

export interface AuthRequest extends Request {
  user?: { id: string; clientId: string; role: string; name: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = { id: decoded.id, clientId: decoded.clientId, role: decoded.role, name: decoded.name || '' };

    // Check client status on every request
    prisma.client.findUnique({ where: { id: decoded.clientId }, select: { active: true, trialEndsAt: true, subscriptionStatus: true } })
      .then(client => {
        if (!client) return res.status(403).json({ error: 'Account not found. Contact admin.', code: 'DISABLED' });
        if (!client.active) return res.status(403).json({ error: 'Service disabled. Contact admin at admin@managementsystems.in', code: 'DISABLED' });
        if (client.trialEndsAt && new Date() > client.trialEndsAt && client.subscriptionStatus !== 'ACTIVE') {
          return res.status(403).json({ error: 'Trial expired. Contact admin at admin@managementsystems.in to activate.', code: 'EXPIRED' });
        }
        next();
      })
      .catch(() => next());
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Alias for authenticate to maintain compatibility
export const authenticateToken = authenticate;

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Log user activity — call this in routes after important actions
export async function logActivity(req: AuthRequest, action: string, module: string, target?: string, targetId?: string, details?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        clientId: req.user?.clientId,
        userId: req.user?.id,
        userName: undefined,
        action,
        module,
        target,
        targetId,
        details,
        ip: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
      },
    });
  } catch {}
}
