import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Ensure uploads directories exist
// Vercel's filesystem is read-only except /tmp, so use /tmp for serverless
const isServerless = !!process.env.VERCEL;
const UPLOADS_BASE = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
const UPLOADS_PRODUCTS = path.join(UPLOADS_BASE, 'products');
const UPLOADS_LOGOS = path.join(UPLOADS_BASE, 'logos');
const UPLOADS_MAIN_PHOTOS = path.join(UPLOADS_BASE, 'main-photos');
const UPLOADS_GALLERY = path.join(UPLOADS_BASE, 'gallery');
const UPLOADS_QR_CODES = path.join(UPLOADS_BASE, 'qr-codes');

[UPLOADS_PRODUCTS, UPLOADS_LOGOS, UPLOADS_MAIN_PHOTOS, UPLOADS_GALLERY, UPLOADS_QR_CODES].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const createStorage = (uploadDir: string) => multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, unique);
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = /jpeg|jpg|png|webp|gif|avif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, webp, gif, avif) are allowed'));
    }
};

const createUpload = (uploadDir: string) => multer({
    storage: createStorage(uploadDir),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit per image
    fileFilter,
});

const uploadProduct = createUpload(UPLOADS_PRODUCTS);
const uploadLogo = createUpload(UPLOADS_LOGOS);
const uploadMainPhoto = createUpload(UPLOADS_MAIN_PHOTOS);
const uploadGallery = createUpload(UPLOADS_GALLERY);
const uploadQrCode = createUpload(UPLOADS_QR_CODES);

/**
 * POST /api/upload/product-image
 * Upload a single product image (authenticated users only)
 */
router.post(
    '/product-image',
    authenticate,
    (req: AuthenticatedRequest, res: Response, next) => {
        uploadProduct.single('image')(req as any, res as any, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    res.status(413).json({ error: 'Image must be smaller than 5 MB' });
                    return;
                }
                res.status(400).json({ error: err.message });
                return;
            }
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next();
        });
    },
    (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

        logger.info(`[upload] Product image uploaded: ${req.file.filename} by user ${userId}`);

        res.status(201).json({ imageUrl });
    }
);

/**
 * POST /api/upload/logo
 * Upload a logo image
 */
router.post(
    '/logo',
    authenticate,
    (req: AuthenticatedRequest, res: Response, next) => {
        uploadLogo.single('image')(req as any, res as any, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    res.status(413).json({ error: 'Image must be smaller than 5 MB' });
                    return;
                }
                res.status(400).json({ error: err.message });
                return;
            }
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next();
        });
    },
    (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const imageUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;

        logger.info(`[upload] Logo uploaded: ${req.file.filename} by user ${req.user.id}`);

        res.status(201).json({ imageUrl });
    }
);

/**
 * POST /api/upload/main-photo
 * Upload a main photo
 */
router.post(
    '/main-photo',
    authenticate,
    (req: AuthenticatedRequest, res: Response, next) => {
        uploadMainPhoto.single('image')(req as any, res as any, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    res.status(413).json({ error: 'Image must be smaller than 5 MB' });
                    return;
                }
                res.status(400).json({ error: err.message });
                return;
            }
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next();
        });
    },
    (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const imageUrl = `${baseUrl}/uploads/main-photos/${req.file.filename}`;

        logger.info(`[upload] Main photo uploaded: ${req.file.filename} by user ${req.user.id}`);

        res.status(201).json({ imageUrl });
    }
);

/**
 * POST /api/upload/gallery
 * Upload gallery images (up to 6)
 */
router.post(
    '/gallery',
    authenticate,
    (req: AuthenticatedRequest, res: Response, next) => {
        uploadGallery.array('images', 6)(req as any, res as any, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    res.status(413).json({ error: 'Each image must be smaller than 5 MB' });
                    return;
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    res.status(400).json({ error: 'Maximum 6 images allowed' });
                    return;
                }
                res.status(400).json({ error: err.message });
                return;
            }
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next();
        });
    },
    (req: AuthenticatedRequest, res: Response) => {
        const files = (req as any).files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No image files provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const imageUrls = files.map(f => `${baseUrl}/uploads/gallery/${f.filename}`);

        logger.info(`[upload] ${files.length} gallery image(s) uploaded by user ${req.user.id}`);

        res.status(201).json({ imageUrls });
    }
);

/**
 * POST /api/upload/qr-code
 * Upload a QR code image
 */
router.post(
    '/qr-code',
    authenticate,
    (req: AuthenticatedRequest, res: Response, next) => {
        uploadQrCode.single('image')(req as any, res as any, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    res.status(413).json({ error: 'Image must be smaller than 5 MB' });
                    return;
                }
                res.status(400).json({ error: err.message });
                return;
            }
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next();
        });
    },
    (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const imageUrl = `${baseUrl}/uploads/qr-codes/${req.file.filename}`;

        logger.info(`[upload] QR code uploaded: ${req.file.filename} by user ${req.user.id}`);

        res.status(201).json({ imageUrl });
    }
);

export default router;
