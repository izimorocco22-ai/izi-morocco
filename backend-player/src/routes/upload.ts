import express from 'express'
import { uploadSingleImage } from '../utils/fileuplode'
import auth from '../middlewares/auth/auth'

const router = express.Router()

router.use(auth('P', 'A'))

router.post('/', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'No files were uploaded.' })
    }

    const file = req.files.file as any
    const result = await uploadSingleImage(file.tempFilePath, 'game_answers')

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
})

export default router
