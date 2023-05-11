const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");

const tempDir = path.join(process.cwd(), "tmp");
const storeImage = path.join(process.cwd(), "public", "avatars");

const multerConfig = multer.diskStorage({
  destination: (res, file, cb) => {
    cb(null, tempDir);
  },
  filename: (res, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: multerConfig });

module.exports = {
  upload,
  tempDir,
  storeImage,
};
