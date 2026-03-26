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

async function listMaterials(req, res) {
  try {
    const { courseId } = req.params;
    const materials = await prisma.material.findMany({
      where: { courseId: parseInt(courseId) },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json({ materials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function uploadMaterial(req, res) {
  try {
    const { courseId } = req.params;
    const { section } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const material = await prisma.material.create({
      data: {
        courseId: parseInt(courseId),
        filename: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        section: section || null,
      },
    });

    res.status(201).json({ material });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteMaterial(req, res) {
  try {
    const { id } = req.params;
    await prisma.material.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Material deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listMaterials, uploadMaterial, deleteMaterial, upload };
