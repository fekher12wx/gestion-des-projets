import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const ensureUploadDir = (uploadPath: string) => {
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const poiFileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const uploadPath = path.join('uploads', 'poi-files', poiFileId);
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename: timestamp_originalname
        const uniqueName = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

// File filter to validate file types
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed file types
    const allowedTypes = /pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, GIF, TXT'));
    }
};

// Create multer upload instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// Error handler for multer errors
export const handleUploadError = (err: any, _req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds 10MB limit' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

