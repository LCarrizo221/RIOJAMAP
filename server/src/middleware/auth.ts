import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender Request de Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: 'ADMIN' | 'USER';
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.riojamap_token;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'NO_TOKEN'
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      error: 'Server configuration error',
      code: 'NO_JWT_SECRET'
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as {
      id: number;
      email: string;
      name: string;
      role: 'ADMIN' | 'USER';
    };

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const authorize = (...roles: ('ADMIN' | 'USER')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'NO_USER'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};
