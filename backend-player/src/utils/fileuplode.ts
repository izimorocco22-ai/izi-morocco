import { v2 as cloudinary } from 'cloudinary'
import * as fs from 'fs'
import config from '../config'

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret
})

// Type definitions
interface UploadResult {
  url: string
  public_id: string
}

interface FileWithPath {
  tempFilePath: string
}

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  [key: string]: any
}

interface CloudinaryDeleteResponse {
  result: string
  [key: string]: any
}

/**
 * Upload a single image to Cloudinary
 * @param filePath - Path to the file to upload
 * @param folderName - Cloudinary folder name (optional)
 * @returns Promise<UploadResult>
 */
export const uploadSingleImage = async (
  filePath: string,
  folderName?: string
): Promise<UploadResult> => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided.')
    }
    const options = {
      folder: folderName || process.env.CLOUD_FOLDER_NAME || 'vaishnavsetu',
      resource_type: 'auto' as const
    }
    const result: CloudinaryUploadResponse = await cloudinary.uploader.upload(
      filePath,
      options
    )
    fs.unlinkSync(filePath)
    return {
      url: result.secure_url,
      public_id: result.public_id
    }
  } catch (error: any) {
    console.error('Error uploading single image:', error.message)
    throw error
  }
}
/**
 * Upload multiple images to Cloudinary (returns array of {url, public_id})
 * @param files - Array of files with tempFilePath property
 * @param folderName - Cloudinary folder name (optional)
 * @returns Promise<UploadResult[]>
 */
export const uploadMultipleImages = async (
  files: FileWithPath[],
  folderName?: string
): Promise<UploadResult[]> => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Invalid or empty files array.')
    }
    const uploadPromises = files.map((file) => {
      const options = {
        folder: folderName || process.env.CLOUD_FOLDER_NAME || 'vaishnavsetu',
        resource_type: 'auto' as const
      }
      return cloudinary.uploader.upload(file.tempFilePath, options)
    })

    const results: CloudinaryUploadResponse[] = await Promise.all(
      uploadPromises
    )
    const uploaded: UploadResult[] = results.map((res) => ({
      url: res.secure_url,
      public_id: res.public_id
    }))
    files.forEach((file) => {
      try {
        fs.unlinkSync(file.tempFilePath)
      } catch (err) {
        console.warn(`Failed to delete temp file: ${file.tempFilePath}`, err)
      }
    })
    console.log(
      'Uploaded multiple files:',
      uploaded.map((u) => u.url)
    )
    return uploaded
  } catch (error: any) {
    console.error('Error uploading multiple images:', error.message)
    throw error
  }
}

/**
 * Delete an image from Cloudinary by public_id
 * @param publicId - The public ID of the image to delete
 * @returns Promise<CloudinaryDeleteResponse>
 */
export const deleteFromCloudinary = async (
  publicId: string
): Promise<CloudinaryDeleteResponse> => {
  try {
    if (!publicId) {
      throw new Error('public_id is required for deletion.')
    }
    const result: CloudinaryDeleteResponse = await cloudinary.uploader.destroy(
      publicId
    )
    if (result.result === 'ok') {
      console.log(`Deleted from Cloudinary: ${publicId}`)
    } else {
      console.warn(`Cloudinary deletion response:`, result)
    }
    return result
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error.message)
    throw error
  }
}

/**
 * Upload file from buffer (useful for direct file uploads)
 * @param buffer - File be (optional)uffer
 * @param folderName - Cloudinary folder nam
 * @param fileName - Original filename (optional)
 * @returns Promise<UploadResult>
 */
export const uploadFromBuffer = async (
  buffer: Buffer,
  folderName?: string,
  fileName?: string
): Promise<UploadResult> => {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer provided.')
    }

    const options = {
      folder: folderName || process.env.CLOUD_FOLDER_NAME || 'izi_morocco',
      resource_type: 'auto' as const,
      public_id: fileName ? fileName.split('.')[0] : undefined
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          options,
          (error, result: CloudinaryUploadResponse | undefined) => {
            if (error) {
              console.error('Error uploading from buffer:', error.message)
              reject(error)
            } else if (result) {
              console.log('Uploaded from buffer:', result.secure_url)
              resolve({
                url: result.secure_url,
                public_id: result.public_id
              })
            } else {
              reject(new Error('Upload failed: No result returned'))
            }
          }
        )
        .end(buffer)
    })
  } catch (error: any) {
    console.error('Error uploading from buffer:', error.message)
    throw error
  }
}

export const base64ToBuffer = (base64String: string): Buffer => {
  const base64Data = base64String.split(',')[1] // remove "data:image/png;base64,"
  return Buffer.from(base64Data, 'base64')
}
