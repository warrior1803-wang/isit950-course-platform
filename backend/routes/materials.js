const express = require('express');
const {
  listMaterials,
  uploadMaterial,
  deleteMaterial,
  upload,
} = require('../controllers/materialController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/:courseId', authenticate, listMaterials);
router.post('/:courseId', authenticate, authorizeRoles('instructor'), upload.single('file'), uploadMaterial);
router.delete('/:id', authenticate, authorizeRoles('instructor'), deleteMaterial);

module.exports = router;
