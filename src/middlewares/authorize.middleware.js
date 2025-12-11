/**
 * authorize.middleware.js
 * - Usage: authorize('admin') OR authorize('organizer', 'admin')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { role } = req.user;
      if (!allowedRoles.length) return next(); // no restriction

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
