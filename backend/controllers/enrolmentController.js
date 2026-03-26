const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enrol(req, res) {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const enrolment = await prisma.enrolment.create({
      data: { studentId: req.user.id, courseId: parseInt(courseId) },
    });

    res.status(201).json({ enrolment });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function unenrol(req, res) {
  try {
    const { courseId } = req.params;

    await prisma.enrolment.deleteMany({
      where: { studentId: req.user.id, courseId: parseInt(courseId) },
    });

    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getMyEnrolments(req, res) {
  try {
    const enrolments = await prisma.enrolment.findMany({
      where: { studentId: req.user.id },
      include: { course: { include: { instructor: { select: { id: true, name: true } } } } },
    });

    res.json({ enrolments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { enrol, unenrol, getMyEnrolments };
