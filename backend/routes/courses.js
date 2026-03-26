const express = require('express');
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listCourses);
router.get('/:id', authenticate, getCourse);
router.post('/', authenticate, authorizeRoles('instructor'), createCourse);
router.put('/:id', authenticate, authorizeRoles('instructor'), updateCourse);
router.delete('/:id', authenticate, authorizeRoles('instructor'), deleteCourse);

module.exports = router;
