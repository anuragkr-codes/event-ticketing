const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User } = require('../models/user.model');
const connectDB = require('./mongoose');

const SALT_ROUNDS = 10;

/**
 * Seed initial admin user from environment variables.
 * This should be run once on initial deployment to create the first admin.
 *
 * Required environment variables:
 * - ADMIN_EMAIL: Email for the initial admin account
 * - ADMIN_PASSWORD: Password for the initial admin account
 * - ADMIN_NAME: Name for the initial admin account
 */
const seedAdmin = async () => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, MONGO_URI } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
      console.error(
        '❌ Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME'
      );
      console.log('Please set these variables and try again.');
      process.exit(1);
    }

    if (!MONGO_URI) {
      console.error('❌ Missing MONGO_URI environment variable');
      process.exit(1);
    }

    console.log('🔗 Connecting to database...');
    await connectDB(MONGO_URI);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${ADMIN_EMAIL}`);
      console.log('No changes made.');
      process.exit(0);
    }

    // Create initial admin
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Initial admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Keep these credentials secure!');
    console.log('You can now use this account to promote other users to organizer/admin roles.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  seedAdmin();
}

module.exports = seedAdmin;
