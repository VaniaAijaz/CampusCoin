const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    type: {
      type: String,
      enum: ["info", "tip", "warning", "update"],
      default: "info",
    },
    isActive: { type: Boolean, default: true },
    created_by_admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Pre-save hook to keep createdBy and created_by_admin_id in sync
announcementSchema.pre("save", function (next) {
  if (this.created_by_admin_id && !this.createdBy) {
    this.createdBy = this.created_by_admin_id;
  } else if (this.createdBy && !this.created_by_admin_id) {
    this.created_by_admin_id = this.createdBy;
  }
  if (!this.created_at) {
    this.created_at = this.createdAt || new Date();
  }
  next();
});

module.exports = mongoose.model("Announcement", announcementSchema);
