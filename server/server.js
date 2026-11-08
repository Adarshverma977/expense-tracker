const mongoose = require("mongoose");

const app = require("./src/app");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");

const {
  startRecurringTransactionCron,
  stopRecurringTransactionCron,
} = require("./src/services/recurringTransactionCron");

let server;
let isShuttingDown = false;

const startServer = async () => {
  try {
    // Connect to MongoDB before starting application services.
    await connectDB();

    // Start Express server.
    server = app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });

    // Start scheduler only after database connection succeeds.
    startRecurringTransactionCron();

    // Handle unexpected server errors.
    server.on("error", (error) => {
      console.error("Server error:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Application startup failed:", error.message);
    process.exit(1);
  }
};

// Gracefully stop application services.
const shutdown = async (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  // Stop new scheduled executions.
  stopRecurringTransactionCron();

  try {
    // Stop accepting new HTTP connections and drain active requests.
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    // Close MongoDB connection after server shutdown.
    await mongoose.connection.close();

    console.log("Application shutdown completed.");
    process.exit(0);
  } catch (error) {
    console.error("Graceful shutdown failed:", error.message);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
