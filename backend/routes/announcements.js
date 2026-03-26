const express = require('express');
const {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/:courseId', authenticate, listAnnouncements);
router.post('/:courseId', authenticate, authorizeRoles('instructor'), createAnnouncement);
router.delete('/:id', authenticate, authorizeRoles('instructor'), deleteAnnouncement);

module.exports = router;
