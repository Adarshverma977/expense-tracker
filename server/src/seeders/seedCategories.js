const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");

const defaultCategories = [
  // Expense categories
  { name: "Food", type: "expense", icon: "utensils", color: "#F59E0B" },
  { name: "Transportation", type: "expense", icon: "car", color: "#3B82F6" },
  { name: "Shopping", type: "expense", icon: "shopping-bag", color: "#EC4899" },
  { name: "Bills", type: "expense", icon: "receipt", color: "#8B5CF6" },
  { name: "Entertainment", type: "expense", icon: "film", color: "#EF4444" },
  {
    name: "Healthcare",
    type: "expense",
    icon: "heart-pulse",
    color: "#14B8A6",
  },
  {
    name: "Education",
    type: "expense",
    icon: "graduation-cap",
    color: "#6366F1",
  },
  { name: "Travel", type: "expense", icon: "plane", color: "#06B6D4" },
  { name: "Other Expense", type: "expense", icon: "wallet", color: "#64748B" },

  // Income categories
  {
    name: "Salary",
    type: "income",
    icon: "briefcase-business",
    color: "#22C55E",
  },
  { name: "Freelance", type: "income", icon: "laptop", color: "#0D9488" },
  { name: "Investment", type: "income", icon: "trending-up", color: "#16A34A" },
  { name: "Gift", type: "income", icon: "gift", color: "#D946EF" },
  { name: "Other Income", type: "income", icon: "wallet", color: "#64748B" },
];

const seedCategories = async () => {
  try {
    await connectDB();

    const operations = defaultCategories.map((category) => ({
      updateOne: {
        filter: {
          type: category.type,
          normalizedName: category.name.toLowerCase(),
          isDefault: true,
        },
        update: {
          $setOnInsert: {
            ...category,
            normalizedName: category.name.toLowerCase(),
            user: null,
            isDefault: true,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await Category.bulkWrite(operations);

    console.log("Default categories seeded successfully!");
    console.log(`Inserted: ${result.upsertedCount}`);
    console.log(`Already existing: ${result.matchedCount}`);
  } catch (error) {
    console.error("Category seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedCategories();
