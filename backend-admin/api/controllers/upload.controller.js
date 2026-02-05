import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { matchedData } from 'express-validator';
import fs from 'fs';
import path from 'path';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import buildErrorObject from '../utils/buildErrorObject.js';
import handleError from '../utils/handleError.js';
import buildResponse from '../utils/buildResponse.js';

dotenv.config();
// Configure S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

cloudinary.config({
  cloud_name: process.env.CDN_NAME,
  api_key: process.env.CDN_API_KEY,
  api_secret: process.env.CDN_API_SECRET
});

export const verifyAWSConnection = async () => {
  console.log('data');
  console.log('Verifying AWS connection...');
  try {
    const command = new ListBucketsCommand({});
    const response = await s3.send(command);
    console.log('AWS Connection Verified. Buckets:', response.Buckets);
  } catch (error) {
    console.error('Failed to connect to AWS:', error.message);
    process.exit(1);
  }
};

// Upload Controller
export const uploadController = async (req, res) => {
  try {
    const { images = [], videos = [], audios = [] } = req.files || {};
    const files = [...images, ...videos, ...audios];

    const bucketName = process.env.S3_BUCKET;

    if (!bucketName) {
      console.error('S3_BUCKET_NAME is not set in environment variables');
      throw buildErrorObject(
        httpStatus.INTERNAL_SERVER_ERROR,
        'S3_BUCKET_NAME is not set'
      );
    }
    if (!files.length) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    const uploadPromises = files.map(async (file) => {
      let body;
      if (file.buffer) {
        body = file.buffer;
      } else {
        body = fs.createReadStream(file.path);
      }

      const uploadParams = {
        Bucket: bucketName,
        Key: `uploads/${file.originalname}`,
        Body: body
      };

      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);

      if (file.path) {
        fs.unlinkSync(file.path);
      }

      // Return full S3 URL if possible, or just key
      // User asked for Cloudinary full URL, so let's stick to key here unless requested
      // But typically we want a URL. Let's assume S3 logic is legacy/secondary or handled elsewhere.
      return `uploads/${file.originalname}`;
    });
    const uploadedFiles = await Promise.all(uploadPromises);
    res.status(httpStatus.OK).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const cloudinaryUploadController = async (req, res) => {
  try {
    const response = {};

    const files = req.files;
    const images = req.files?.images;
    const videos = req.files?.videos;
    const audios = req.files?.audios;

    if (!files || files.length === 0) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    if (files.length > 0) {
      response.files = await uploadFiles(files);
    }

    if (images && images.length > 0) {
      response.images = await uploadFiles(images);
    }

    if (videos && videos.length > 0) {
      response.videos = await uploadFiles(videos);
    }

    if(audios && audios.length > 0){
      response.audios = await uploadFiles(audios);
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (error) {
    handleError(res, error);
  }
};

export const localUploadController = async (req, res) => {
  try {
    const { images = [], videos = [], audios = [] } = req.files || {};
    
    if (!images.length && !videos.length && !audios.length) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    const response = {};

    const processFiles = (fileList) => {
      return fileList.map((file) => {
        const targetDir = path.join('public', 'uploads');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const fileName = file.originalname; 
        const targetPath = path.join(targetDir, fileName);
  
        // If memory storage is used, file.path won't exist.
        // But localUploadController is only used if S3 and Cloudinary are disabled.
        // In that case, upload.routes.js falls back to diskStorage.
        // So file.path SHOULD exist.
        if (file.path) {
            fs.copyFileSync(file.path, targetPath);
            fs.unlinkSync(file.path);
        } else if (file.buffer) {
            fs.writeFileSync(targetPath, file.buffer);
        }
  
        return `uploads/${fileName}`;
      });
    };

    if (images.length > 0) {
      response.images = processFiles(images);
    }

    if (videos.length > 0) {
      response.videos = processFiles(videos);
    }

    if (audios.length > 0) {
      response.audios = processFiles(audios);
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (error) {
    handleError(res, error);
  }
};

const uploadFiles = async (files) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
        const options = {
            folder: 'izi_morocco',
            resource_type: 'auto'
        };

        if (file.buffer) {
            const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result.secure_url);
            });
            stream.end(file.buffer);
        } else {
            cloudinary.uploader.upload(file.path, options)
                .then((result) => {
                    fs.unlinkSync(file.path); 
                    resolve(result.secure_url);
                })
                .catch((err) => {
                    fs.unlinkSync(file.path);
                    reject(err);
                });
        }
    });
  });

  const uploadedFiles = await Promise.all(uploadPromises);
  return uploadedFiles;
};
