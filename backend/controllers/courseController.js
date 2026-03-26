const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listCourses(req, res) {
  try {
    const courses = await prisma.course.findMany({
      include: { instructor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getCourse(req, res) {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        instructor: { select: { id: true, name: true } },
        enrolments: { include: { student: { select: { id: true, name: true } } } },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createCourse(req, res) {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const course = await prisma.course.create({
      data: { name, code, description, instructorId: req.user.id },
    });

    res.status(201).json({ course });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Course code already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const course = await prisma.course.findUnique({ where: { id: parseInt(id) } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.course.update({
      where: { id: parseInt(id) },
      data: { name, description },
    });

    res.json({ course: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteCourse(req, res) {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({ where: { id: parseInt(id) } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.course.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse };
