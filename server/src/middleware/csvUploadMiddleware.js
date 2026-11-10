const multer = require("multer");
const path = require("path");

const AppError = require("../utils/AppError");

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension !== ".csv") {
    return callback(new AppError("Only CSV files are allowed.", 400), false);
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    return callback(new AppError("Invalid CSV file type.", 400), false);
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 5,
    parts: 6,
  },
});

const uploadCSV = upload.single("file");

module.exports = uploadCSV;
