import jwt from 'jsonwebtoken';
import { ErrorTypes } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  process.exit(1);
}

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(ErrorTypes.unauthorized('Access token required'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next(ErrorTypes.unauthorized('Invalid or expired token'));
    }
    req.user = user;
    next();
  });
};

export const requireAccessLevel = (minLevel, options = {}) => {
  const { disallowLevels = [] } = options;

  return (req, res, next) => {
    if (!req.user) {
      return next(ErrorTypes.unauthorized('Authentication required'));
    }

    if (disallowLevels.includes(req.user.access_level)) {
      return next(ErrorTypes.forbidden('Insufficient permissions'));
    }

    if (req.user.access_level > minLevel) {
      return next(ErrorTypes.forbidden('Insufficient permissions'));
    }

    next();
  };
};
