import express from 'express'
import { uploadSingleImage } from '../utils/fileuplode'
import auth from '../middlewares/auth/auth'

const router = express.Router()

router.use(auth('P', 'A'))

router.post('/', async (req, res) => {
  try {
    console.log('[Upload] Request received:', {
      hasFiles: !!req.files,
      fileKeys: req.files ? Object.keys(req.files) : []
    });

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded.' });
    }

    const file = req.files.file as any;
    
    if (!file || !file.tempFilePath) {
      return res.status(400).json({ success: false, message: 'Invalid file data' });
    }

    console.log('[Upload] Processing file:', file.name);
    const result = await uploadSingleImage(file.tempFilePath, 'game_answers');
    console.log('[Upload] Success:', result);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

export default router
