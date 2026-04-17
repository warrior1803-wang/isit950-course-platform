import { useState, useEffect } from 'react';
import CourseManageCard from '../../components/instructor/CourseManageCard';
import CourseModal from '../../components/instructor/CourseModal';
import UploadMaterialModal from '../../components/instructor/UploadMaterialModal';
import api from '../../api/axios';

function formatMaterial(material) {
  return {
    id: material.id,
    filename: material.filename,
    section: material.section,
    url: material.url,
    size: material.size,
    uploadedAt: new Date(material.uploadedAt).toLocaleDateString('en-AU'),
  };
}

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', course: {...} }
  const [uploadModal, setUploadModal] = useState(null); // null | { courseId }
  const [materials, setMaterials] = useState({});

  async function fetchMaterialsForCourses(courseList) {
    if (!courseList.length) {
      setMaterials({});
      return;
    }

    const results = await Promise.all(
      courseList.map(async course => {
        try {
          const res = await api.get(`/courses/${course.id}/materials`);
          return [course.id, (res.data?.data ?? []).map(formatMaterial)];
        } catch {
          return [course.id, []];
        }
      })
    );

    setMaterials(Object.fromEntries(results));
  }

  async function fetchCourses() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/courses');
      const nextCourses = res.data?.data ?? [];
      setCourses(nextCourses);
      await fetchMaterialsForCourses(nextCourses);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCourses(); }, []);

  async function handleCourseSubmit(fields) {
    const isEdit = modal.mode === 'edit';
    const url = isEdit
      ? `/courses/${modal.course.id}`
      : '/courses';

    await api.request({
      url,
      method: isEdit ? 'put' : 'post',
      data: {
        name: fields.title,
        code: fields.code,
        description: fields.description,
        schedule: fields.session,
      },
    });
    await fetchCourses();
    setModal(null);
  }

  function handleUploadSuccess(courseId, newMaterial) {
    setMaterials(prev => ({
      ...prev,
      [courseId]: [newMaterial, ...(prev[courseId] || [])],
    }));
  }

  async function handleDeleteMaterial(courseId, materialId) {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    try {
      await api.delete(`/courses/${courseId}/materials/${materialId}`);
    } catch {
      alert('Failed to delete material.');
      return;
    }
    setMaterials(prev => ({
      ...prev,
      [courseId]: (prev[courseId] || []).filter(m => m.id !== materialId),
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
            assignmentCount: course.assignmentCount ?? 0,
            pendingCount: course.pendingCount ?? 0,
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
