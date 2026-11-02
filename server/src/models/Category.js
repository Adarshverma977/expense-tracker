const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: function () {
        return !this.isDefault;
      },
    },

    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [30, "Category name cannot exceed 30 characters"],
    },

    normalizedName: {
      type: String,
      required: true,
      select: false,
    },

    type: {
      type: String,
      enum: {
        values: ["income", "expense"],
        message: "Category type must be income or expense",
      },
      required: [true, "Category type is required"],
    },

    icon: {
      type: String,
      default: "tag",
      trim: true,
      maxlength: [50, "Icon identifier is too long"],
    },

    color: {
      type: String,
      default: "#64748B",
      match: [/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Normalize category names before validation.
categorySchema.pre("validate", function () {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }

  if (this.isDefault && this.user != null) {
    this.invalidate(
      "user",
      "Default categories cannot belong to a specific user",
    );
  }
});

// Unique custom category per user and transaction type.
categorySchema.index(
  { user: 1, type: 1, normalizedName: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $type: "objectId" },
    },
  },
);

// Unique default category per transaction type.
categorySchema.index(
  { type: 1, normalizedName: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDefault: true,
    },
  },
);

// Efficient category lookup for a user.
categorySchema.index({
  user: 1,
  type: 1,
  isActive: 1,
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
