const express = require('express');
const { getMe, listUsers, getUserById, promoteUser } = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { validateBody } = require('../middlewares/validate.middleware');
const { promoteUserSchema } = require('../validators/user.validator');
const router = express.Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 */
router.get('/me', authenticate, getMe);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: list of users
 */
router.get('/', authenticate, authorize('admin'), listUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by id (admin or self)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: user object
 */
router.get('/:id', authenticate, getUserById);

/**
 * @openapi
 * /users/{id}/promote:
 *   post:
 *     summary: Promote user to a different role (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to promote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [attendee, organizer, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: User not found
 */
router.post(
  '/:id/promote',
  authenticate,
  authorize('admin'),
  validateBody(promoteUserSchema),
  promoteUser
);

module.exports = router;
