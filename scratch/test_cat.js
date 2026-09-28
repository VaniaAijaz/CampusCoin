require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../server/features/categories/Category.model');
const User = require('../server/features/auth/User.model');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({});
  const filter = {
    $or: [{ isDefault: true }, { userId: null }, { userId: user._id }],
  };
  filter.type = 'expense';
  const cats = await Category.find(filter).sort({ isDefault: -1, name: 1 });
  console.log('CONTROLLER OUTPUT COUNT:', cats.length, cats.map(c => c.name));
  process.exit(0);
}

run();
