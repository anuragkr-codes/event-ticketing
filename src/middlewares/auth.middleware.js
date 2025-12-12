const { verifyToken } = require('../utils/jwt');
const { User } = require('../models/user.model');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'Authorization required' });

    const token = header.replace('Bearer ', '');
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
