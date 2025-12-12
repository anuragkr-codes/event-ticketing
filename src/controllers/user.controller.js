const { User } = require('../models/user.model');

/**
 * Return own profile (without password).
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin-only: list users (paginated)
 */
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    return res.json({
      meta: { page, limit, total },
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user by id.
 * - accessible if requester is admin OR requester is the same user.
 */
const getUserById = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    // Allow if admin or if requester id equals target id
    if (requester.role !== 'admin' && requester.id !== targetId) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    const user = await User.findById(targetId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, listUsers, getUserById };
