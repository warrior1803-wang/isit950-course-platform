const express = require('express');
const {
  listAssignments,
  createAssignment,
  submitAssignment,
  gradeSubmission,
  listSubmissions,
  upload,
} = require('../controllers/assignmentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/:courseId', authenticate, listAssignments);
router.post('/:courseId', authenticate, authorizeRoles('instructor'), createAssignment);
router.get('/:id/submissions', authenticate, authorizeRoles('instructor'), listSubmissions);
router.post('/:id/submit', authenticate, authorizeRoles('student'), upload.single('file'), submitAssignment);
router.patch('/submissions/:submissionId/grade', authenticate, authorizeRoles('instructor'), gradeSubmission);

module.exports = router;
