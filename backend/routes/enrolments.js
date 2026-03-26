const express = require('express');
const { enrol, unenrol, getMyEnrolments } = require('../controllers/enrolmentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, getMyEnrolments);
router.post('/', authenticate, authorizeRoles('student'), enrol);
router.delete('/:courseId', authenticate, authorizeRoles('student'), unenrol);

module.exports = router;
