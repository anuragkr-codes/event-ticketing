const bcrypt = require('bcryptjs');
const { User } = require('../models/user.model');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // Force role to 'attendee' for public registration - admins/organizers must be promoted by existing admins
    const user = await User.create({ name, email, password: hashed, role: 'attendee' });
    const token = signToken({ userId: user._id, role: user.role });

    return res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ userId: user._id, role: user.role });
    return res.json({ user, token });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
