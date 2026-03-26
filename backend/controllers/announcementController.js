const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAnnouncements(req, res) {
  try {
    const { courseId } = req.params;
    const announcements = await prisma.announcement.findMany({
      where: { courseId: parseInt(courseId) },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ announcements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createAnnouncement(req, res) {
  try {
    const { courseId } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        courseId: parseInt(courseId),
        title,
        body,
        authorId: req.user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json({ announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listAnnouncements, createAnnouncement, deleteAnnouncement };
