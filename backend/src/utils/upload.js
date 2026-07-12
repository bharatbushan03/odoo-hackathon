const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

function ensureUploadDir() {
  const dir = path.join(__dirname, '..', '..', '..', UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function getMimeType(filename) {
  const extension = getFileExtension(filename);
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  if (!file.mimetype) {
    errors.push('File has no mimetype');
    return { isValid: false, errors };
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

async function processFileUpload(file) {
  const uploadDir = ensureUploadDir();
  
  try {
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const originalName = file.originalname || file.name || 'file';
    const extension = getFileExtension(originalName);
    const fileName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      stream.on('error', (err) => {
        reject(new Error(`Failed to save file: ${err.message}`));
      });
      
      file.stream.pipe(stream);
      stream.on('finish', () => {
        resolve({
          success: true,
          path: filePath,
          originalName,
          filename: fileName,
          mimetype: file.mimetype,
          size: fs.statSync(filePath).size
        });
      });
    });
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
}

async function processSingleFileUpload(req) {
  if (!req.file) {
    throw new Error('No file uploaded');
  }

  return processFileUpload(req.file);
}

async function processMultipleFilesUpload(req) {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new Error('No files uploaded');
  }

  const uploadDir = ensureUploadDir();
  const uploadedFiles = [];

  for (const file of req.files) {
    const fileId = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileId);

    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      stream.on('error', (err) => {
        reject(new Error(`Failed to save file: ${err.message}`));
      });
      
      file.stream.pipe(stream);
      stream.on('finish', async () => {
        uploadedFiles.push({
          path: filePath,
          originalName: file.originalname || file.name || 'file',
          filename: fileId,
          mimetype: file.mimetype,
          size: fs.statSync(filePath).size
        });
        resolve(uploadedFiles);
      });
    });
  }

  return uploadedFiles;
}

function deleteFile(filePath) {
  const normalizedPath = path.normalize(filePath);
  const uploadDir = ensureUploadDir();

  if (!normalizedPath.startsWith(uploadDir)) {
    throw new Error('Security violation: attempting to access files outside upload directory');
  }

  try {
    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
      return { success: true, message: 'File deleted successfully' };
    }
    return { success: false, message: 'File not found' };
  } catch (error) {
    return { success: false, message: `Failed to delete file: ${error.message}` };
  }
}

function getFileUrl(filePath) {
  const uploadDir = ensureUploadDir();
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(uploadDir)) {
    throw new Error('Security violation: path outside upload directory');
  }

  const relativePath = path.relative(uploadDir, normalizedPath);
  const fileName = relativePath.replace(/\\/g, '/');
  
  return `/uploads/${fileName}`;
}

function getFilteredExtensions(allowedTypes = null) {
  const allowedMimeTypes = allowedTypes || ALLOWED_TYPES;
  const mimeTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  };

  const extensions = new Set();
  allowedMimeTypes.forEach(type => {
    if (mimeTypes[type]) {
      mimeTypes[type].forEach(ext => extensions.add(ext));
    }
  });

  return Array.from(extensions);
}

async function compressImage(inputPath, outputPath, quality = 80) {
  const sharp = require('sharp');
  
  try {
    await sharp(inputPath)
      .jpeg({ quality })
      .toFile(outputPath);
    return {
      success: true,
      originalSize: fs.statSync(inputPath).size,
      compressedSize: fs.statSync(outputPath).size,
      compressionRatio: ((1 - fs.statSync(outputPath).size / fs.statSync(inputPath).size) * 100).toFixed(2)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  ensureUploadDir,
  getFileExtension,
  getMimeType,
  validateFile,
  processFileUpload,
  processSingleFileUpload,
  processMultipleFilesUpload,
  deleteFile,
  getFileUrl,
  getFilteredExtensions,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
  compressImage
};