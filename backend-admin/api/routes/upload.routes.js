import express from 'express';
import multer from 'multer';

import * as uploadController from '../controllers/upload.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import * as uploadValidator from '../validators/upload.validator.js';
import { checkPermission } from '../middlewares/check-permission.middleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { uploadLimiter } from '../helpers/rateLimitter.js';

const router = express.Router();

router.use(uploadLimiter)


const useCloudinary = process.env.USE_CLOUDINARY === 'true';
const useS3 = !!process.env.S3_BUCKET;

let finalUploadController;

if (useS3) {
  finalUploadController = uploadController.uploadController;
} else if (useCloudinary) {
  finalUploadController = uploadController.cloudinaryUploadController;
} else {
  finalUploadController = uploadController.localUploadController;
}

const upload = multer({
  dest: 'upload/'
});

const mediaUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 10 } ,
  { name: 'audios', maxCount: 10 }
]);

router.post(
  '/',
  mediaUpload,

  requireAuth,

  checkPermission(PERMISSIONS.UPLOADS.CREATE),
  uploadValidator.uploadvalidator,
  finalUploadController
);

export default router;
