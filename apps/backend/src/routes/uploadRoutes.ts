import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';
import { bucket } from '../config/firebase';

const router = Router();

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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit per image
    fileFilter,
});

export const uploadToGcs = async (file: Express.Multer.File, folder: string): Promise<string> => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `uploads/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const blob = bucket.file(uniqueName);

    await blob.save(file.buffer, {
        metadata: {
            contentType: file.mimetype,
        },
    });

    // Note: We are no longer calling blob.makePublic() here to avoid Uniform Bucket-Level Access errors.
    // The bucket 'vanij-32b55-uploads' must be made public via Google Cloud Console IAM (allUsers -> Storage Object Viewer).

    return `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
};

/**
 * POST /api/upload/product-image
 * Upload a single product image (authenticated users only)
 */
router.post(
    '/product-image',
    authenticate,
    (req: AuthenticatedRequest, res: Response, next) => {
        upload.single('image')(req as any, res as any, (err) => {
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
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const imageUrl = await uploadToGcs(req.file, 'products');
            logger.info(`[upload] Product image uploaded to GCS by user ${userId}`);
            res.status(201).json({ imageUrl });
        } catch (err: any) {
            logger.error(`[upload] Failed to upload product image to GCS: ${err.message}`, { error: err });
            res.status(500).json({ error: 'Failed to upload image' });
        }
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
        upload.single('image')(req as any, res as any, (err) => {
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
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const imageUrl = await uploadToGcs(req.file, 'logos');
            logger.info(`[upload] Logo uploaded to GCS by user ${req.user.id}`);
            res.status(201).json({ imageUrl });
        } catch (err: any) {
            logger.error(`[upload] Failed to upload logo to GCS: ${err.message}`, { error: err });
            res.status(500).json({ error: 'Failed to upload image' });
        }
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
        upload.single('image')(req as any, res as any, (err) => {
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
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const imageUrl = await uploadToGcs(req.file, 'main-photos');
            logger.info(`[upload] Main photo uploaded to GCS by user ${req.user.id}`);
            res.status(201).json({ imageUrl });
        } catch (err: any) {
            logger.error(`[upload] Failed to upload main photo to GCS: ${err.message}`, { error: err });
            res.status(500).json({ error: 'Failed to upload image' });
        }
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
        upload.array('images', 6)(req as any, res as any, (err) => {
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
    async (req: AuthenticatedRequest, res: Response) => {
        const files = (req as any).files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No image files provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const uploadPromises = files.map(file => uploadToGcs(file, 'gallery'));
            const imageUrls = await Promise.all(uploadPromises);
            logger.info(`[upload] ${files.length} gallery image(s) uploaded to GCS by user ${req.user.id}`);
            res.status(201).json({ imageUrls });
        } catch (err: any) {
            logger.error(`[upload] Failed to upload gallery images to GCS: ${err.message}`, { error: err });
            res.status(500).json({ error: 'Failed to upload images' });
        }
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
        upload.single('image')(req as any, res as any, (err) => {
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
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const imageUrl = await uploadToGcs(req.file, 'qr-codes');
            logger.info(`[upload] QR code uploaded to GCS by user ${req.user.id}`);
            res.status(201).json({ imageUrl });
        } catch (err: any) {
            logger.error(`[upload] Failed to upload QR code to GCS: ${err.message}`, { error: err });
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }
);

export default router;
