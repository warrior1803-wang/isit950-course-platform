const express = require('express');
const {
  listPosts,
  createPost,
  createReply,
  deletePost,
} = require('../controllers/forumController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:courseId', authenticate, listPosts);
router.post('/:courseId', authenticate, createPost);
router.post('/posts/:postId/replies', authenticate, createReply);
router.delete('/posts/:id', authenticate, deletePost);

module.exports = router;
