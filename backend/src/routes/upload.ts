import { Router, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Readable } from 'stream';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

const uploadToCloudinary = (buffer: Buffer, options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// POST /api/upload/image
router.post('/image', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'techni-social/images',
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1200, height: 1200, crop: 'limit' },
      ],
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// POST /api/upload/video
router.post('/video', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'techni-social/videos',
      resource_type: 'video',
      eager: [
        { format: 'jpg', transformation: [{ width: 400, crop: 'scale' }] },
      ],
      eager_async: true,
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      thumbnail: result.eager?.[0]?.secure_url || result.secure_url.replace('/upload/', '/upload/f_jpg,w_400/'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// POST /api/upload/avatar
router.post('/avatar', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'techni-social/avatars',
      public_id: `avatar_${req.user!._id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: 'Avatar upload failed' });
  }
});

export default router;
