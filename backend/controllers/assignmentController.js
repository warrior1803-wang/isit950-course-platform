const { PrismaClient } = require('@prisma/client');
const path = require('path');
const multer = require('multer');

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage });

async function listAssignments(req, res) {
  try {
    const { courseId } = req.params;
    const assignments = await prisma.assignment.findMany({
      where: { courseId: parseInt(courseId) },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ assignments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createAssignment(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, dueDate, maxScore } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: parseInt(courseId),
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(maxScore) : null,
      },
    });

    res.status(201).json({ assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function submitAssignment(req, res) {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: parseInt(id) } });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId: parseInt(id), studentId: req.user.id } },
      create: {
        assignmentId: parseInt(id),
        studentId: req.user.id,
        filename: req.file.originalname,
        status: 'submitted',
      },
      update: {
        filename: req.file.originalname,
        submittedAt: new Date(),
        status: 'submitted',
      },
    });

    res.status(201).json({ submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function gradeSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    const submission = await prisma.submission.update({
      where: { id: parseInt(submissionId) },
      data: { score: score !== undefined ? parseInt(score) : undefined, feedback, status: 'graded' },
    });

    res.json({ submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function listSubmissions(req, res) {
  try {
    const { id } = req.params;
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: parseInt(id) },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
    res.json({ submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listAssignments, createAssignment, submitAssignment, gradeSubmission, listSubmissions, upload };
