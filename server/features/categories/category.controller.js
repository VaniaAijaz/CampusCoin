const Category = require("./Category.model");

// GET /api/categories — get default + user's own categories
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {
      $or: [{ isDefault: true }, { userId: req.user._id }],
    };
    if (type) filter.type = type;
    const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: "Name and type are required." });
    }
    const exists = await Category.findOne({ name: name.trim(), type, userId: req.user._id });
    if (exists) {
      return res.status(409).json({ success: false, message: "You already have a category with that name and type." });
    }
    const category = await Category.create({
      name: name.trim(),
      type,
      icon: icon || "tag",
      color: color || "#0118A3",
      userId: req.user._id,
    });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found or you do not own it." });
    }
    const { name, icon, color } = req.body;
    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found or you do not own it." });
    }
    await category.deleteOne();
    res.json({ success: true, message: "Category deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
