const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { upload } = require('../middleware/upload');
const assetController = require('../controllers/assetController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileUploader = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  }
});

router.use(authenticate);

router.route('/')
  .post(assetController.createAsset)
  .get(assetController.listAssets);

router.route('/stats')
  .get(assetController.getAssetStats);

router.route('/template/csv')
  .get(assetController.downloadCSVTemplate);

router.route('/preview/csv')
  .post(upload.single('file'), assetController.importPreview);

router.route('/import/csv')
  .post(upload.single('file'), assetController.importAssetsFromCSV);

router.use(authorize(['ASSET_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'DEPT_HEAD']));

router.route('/:id')
  .get(assetController.getAsset)
  .put(assetController.updateAsset)
  .delete(assetController.deleteAsset);

router.route('/:id/codes')
  .post(assetController.generateCodes);

router.route('/:id/attachments')
  .post(upload.single('file'), assetController.uploadAttachment)
  .get(assetController.listAttachments);

router.route('/:id/attachments/:attachmentId')
  .delete(assetController.deleteAttachment);

router.route('/:id/history')
  .get(assetController.getAssetHistory);

router.route('/:id/audit-logs')
  .get(assetController.getAuditLogs);

module.exports = router;