import { useState, useEffect } from 'react';
import CourseManageCard from '../../components/instructor/CourseManageCard';
import CourseModal from '../../components/instructor/CourseModal';
import UploadMaterialModal from '../../components/instructor/UploadMaterialModal';

const API_BASE = 'http://localhost:8080';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', course: {...} }
  const [uploadModal, setUploadModal] = useState(null); // null | { courseId }
  const [materials, setMaterials] = useState({});

  async function fetchCourses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/courses`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load courses');
      setCourses(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCourses(); }, []);

  async function handleCourseSubmit(fields) {
    const isEdit = modal.mode === 'edit';
    const url = isEdit
      ? `${API_BASE}/api/courses/${modal.course.id}`
      : `${API_BASE}/api/courses`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify({
        name: fields.title,
        code: fields.code,
        description: fields.description,
        schedule: fields.session,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save course');
    await fetchCourses();
    setModal(null);
  }

  function handleUploadSuccess(courseId, newMaterial) {
    setMaterials(prev => ({
      ...prev,
      [courseId]: [...(prev[courseId] || []), newMaterial],
    }));
  }

  async function handleDeleteMaterial(courseId, materialId) {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    const res = await fetch(`${API_BASE}/api/courses/${courseId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      alert('Failed to delete material.');
      return;
    }
    setMaterials(prev => ({
      ...prev,
      [courseId]: prev[courseId].filter(m => m.id !== materialId),
    }));
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

      {/* Error state */}
      {error && (
        <div className="text-sm text-[#d85a30] bg-[#d85a30]/8 border border-[#d85a30]/20 rounded-xl p-4 mb-4">
          Failed to load courses: {error}.{' '}
          <button onClick={fetchCourses} className="underline">Retry</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <>
          <div className="bg-input-bg rounded-2xl border border-border p-5 mb-4 animate-pulse h-[100px]" />
          <div className="bg-input-bg rounded-2xl border border-border p-5 mb-4 animate-pulse h-[100px]" />
          <div className="bg-input-bg rounded-2xl border border-border p-5 mb-4 animate-pulse h-[100px]" />
        </>
      )}

      {/* Course cards */}
      {!loading && courses.map(course => (
        <CourseManageCard
          key={course.id}
          course={{
            id: course.id,
            title: course.name,
            code: course.code,
            meta: [course.schedule, course.location].filter(Boolean).join(' · '),
            session: course.schedule,
            description: course.description,
            studentCount: course.enrolmentCount ?? 0,
            materialCount: course.materialsCount ?? 0,
            assignmentCount: null,
            pendingCount: null,
            thumbnailUrl: course.thumbnailUrl || null,
          }}
          materials={materials[course.id] || []}
          onUpload={() => setUploadModal({ courseId: course.id })}
          onDeleteMaterial={materialId => handleDeleteMaterial(course.id, materialId)}
          onEdit={() => setModal({
            mode: 'edit',
            course: {
              id: course.id,
              title: course.name,
              code: course.code,
              session: course.schedule,
              description: course.description,
            },
          })}
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
