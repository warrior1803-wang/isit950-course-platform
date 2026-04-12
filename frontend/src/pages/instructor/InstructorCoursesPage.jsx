import { useState } from 'react';
import CourseManageCard from '../../components/instructor/CourseManageCard';
import CourseModal from '../../components/instructor/CourseModal';
import UploadMaterialModal from '../../components/instructor/UploadMaterialModal';

const mockCourses = [
  {
    id: '950',
    title: 'Systems Development Methodologies',
    code: 'ISIT950',
    meta: 'Thu 10:00–12:00 · Building 40, Room 205',
    studentCount: 48,
    materialCount: 8,
    assignmentCount: 2,
    pendingCount: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=70',
    session: 'Autumn 2026',
    description: 'This subject introduces students to modern software development methodologies including Scrum, Kanban, and hybrid approaches.',
  },
  {
    id: '801',
    title: 'Research Methods in Information Systems',
    code: 'ISIT801',
    meta: 'Mon 14:00–16:00 · Building 11, Room 103',
    studentCount: 56,
    materialCount: 12,
    assignmentCount: 3,
    pendingCount: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=70',
    session: 'Autumn 2026',
    description: 'Covers qualitative and quantitative research methods used in information systems research.',
  },
  {
    id: '421',
    title: 'Enterprise Systems Architecture',
    code: 'ISIT421',
    meta: 'Wed 10:00–12:00 · Building 40, Room 108',
    studentCount: 38,
    materialCount: 9,
    assignmentCount: 2,
    pendingCount: 4,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=70',
    session: 'Autumn 2026',
    description: 'Examines enterprise-scale software architecture patterns and system integration strategies.',
  },
];

export default function InstructorCoursesPage() {
  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', course: {...} }
  const [uploadModal, setUploadModal] = useState(null); // null | { courseId }

  const [materials, setMaterials] = useState({
    '950': [
      { id: 1, filename: 'Week 1 Lecture Slides — Intro to Scrum.pdf', section: 'Week 1 — Introduction to Scrum', uploadedAt: '27 Mar 2026' },
      { id: 2, filename: 'Reading — Agile Manifesto.docx', section: 'Week 1 — Introduction to Scrum', uploadedAt: '27 Mar 2026' },
    ],
    '801': [],
    '421': [],
  });

  async function handleCourseSubmit(fields) {
    await new Promise(r => setTimeout(r, 1200));
    console.log('Course saved:', fields);
    setModal(null); // TODO: replace with real POST /api/courses or PUT /api/courses/:id
  }

  function handleUploadSuccess(courseId, newMaterial) {
    setMaterials(prev => ({
      ...prev,
      [courseId]: [...(prev[courseId] || []), newMaterial],
    }));
  }

  function handleDeleteMaterial(courseId, materialId) {
    console.log('delete called', materialId);
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    setMaterials(prev => ({
      ...prev,
      [courseId]: prev[courseId].filter(m => m.id !== materialId),
    }));
    // TODO: call DELETE /api/courses/:courseId/materials/:materialId
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-normal text-text-dark">My Courses</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage course content, materials, and sections
          </p>
        </div>
        <button
          className="bg-btn text-light text-sm rounded-[10px] h-10 px-[18px] flex items-center gap-1.5 hover:opacity-90 transition-opacity duration-150 flex-shrink-0"
          onClick={() => setModal({ mode: 'create' })}
        >
          <span className="material-symbols-rounded text-base">add</span>
          New course
        </button>
      </div>

      {/* Course cards */}
      {mockCourses.map(course => (
        <CourseManageCard
          key={course.id}
          course={course}
          materials={materials[course.id] || []}
          onEdit={c => setModal({ mode: 'edit', course: c })}
          onUpload={() => setUploadModal({ courseId: course.id })}
          onDeleteMaterial={materialId => handleDeleteMaterial(course.id, materialId)}
        />
      ))}

      {/* Course create/edit modal */}
      {modal && (
        <CourseModal
          mode={modal.mode}
          initialData={modal.mode === 'edit' ? modal.course : null}
          onClose={() => setModal(null)}
          onSubmit={handleCourseSubmit}
        />
      )}

      {/* Upload material modal */}
      {uploadModal && (
        <UploadMaterialModal
          courseId={uploadModal.courseId}
          onClose={() => setUploadModal(null)}
          onUploadSuccess={material => {
            handleUploadSuccess(uploadModal.courseId, material);
            setUploadModal(null);
          }}
        />
      )}
    </>
  );
}
