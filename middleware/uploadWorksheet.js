import multer from 'multer';

// Worksheet photo upload. In-memory so the route can persist via the storage
// facade (R2 when configured, else disk) — see services/storage/objectStore.js.
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed'), false);
  }
};

const uploadWorksheet = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

export default uploadWorksheet;
