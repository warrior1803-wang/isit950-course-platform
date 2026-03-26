const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listPosts(req, res) {
  try {
    const { courseId } = req.params;
    const posts = await prisma.post.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        author: { select: { id: true, name: true } },
        replies: { include: { author: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createPost(req, res) {
  try {
    const { courseId } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }

    const post = await prisma.post.create({
      data: { courseId: parseInt(courseId), title, body, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createReply(req, res) {
  try {
    const { postId } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    const reply = await prisma.reply.create({
      data: { postId: parseInt(postId), body, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deletePost(req, res) {
  try {
    const { id } = req.params;
    await prisma.post.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listPosts, createPost, createReply, deletePost };
