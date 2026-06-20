import multer from 'multer';

// Worksheet photo upload. In-memory so the route can persist via the storage
// facade (R2 when configured, else disk) — see services/storage/objectStore.js.
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Tag with status 400 so the global errorHandler's `if (err.status)` branch
    // returns a clean 400 instead of falling through to a generic 500.
    const e = new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed');
    e.status = 400;
    cb(e, false);
  }
};

const uploadWorksheet = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

export default uploadWorksheet;
