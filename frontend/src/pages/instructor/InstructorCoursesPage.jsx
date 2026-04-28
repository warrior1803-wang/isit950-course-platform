import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseManageCard from '../../components/instructor/CourseManageCard';
import AssignmentModal from '../../components/instructor/AssignmentModal';
import CourseModal from '../../components/instructor/CourseModal';
import UploadMaterialModal from '../../components/instructor/UploadMaterialModal';
import api from '../../api/axios';

function formatMaterial(material) {
  return {
    id: material.id,
    filename: material.filename,
    section: material.section || 'Unsectioned',
    url: material.url,
    size: material.size,
    uploadedAt: new Date(material.uploadedAt).toLocaleDateString('en-AU'),
  };
}

function formatAssignment(assignment, options = {}) {
  const formatted = {
    id: assignment.id,
    title: assignment.title || 'Untitled assignment',
    description: assignment.description || '',
    dueDate: assignment.dueDate || null,
    maxScore: assignment.maxScore ?? null,
    type: String(assignment.type || 'FILE').toUpperCase() === 'AUTO' ? 'AUTO' : 'FILE',
    submissionStatus: assignment.submissionStatus || null,
  };
  if (options.includeQuestionDetails) {
    if (assignment.questionCount != null) formatted.questionCount = assignment.questionCount;
    if (Array.isArray(assignment.questions)) formatted.questions = assignment.questions;
  }
  return formatted;
}

export default function InstructorCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', course: {...} }
  const [uploadModal, setUploadModal] = useState(null); // null | { courseId, section }
  const [assignmentModal, setAssignmentModal] = useState(null);
  const [materials, setMaterials] = useState({});
  const [assignments, setAssignments] = useState({});

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

  async function fetchAssignmentsForCourses(courseList) {
    if (!courseList.length) {
      setAssignments({});
      return;
    }

    const results = await Promise.all(
      courseList.map(async course => {
        try {
          const res = await api.get(`/courses/${course.id}/assignments`);
          const items = Array.isArray(res.data?.data) ? res.data.data : [];
          return [course.id, items.map(formatAssignment)];
        } catch {
          return [course.id, []];
        }
      })
    );

    setAssignments(Object.fromEntries(results));
  }

  async function fetchCourses() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/courses');
      const nextCourses = res.data?.data ?? [];
      setCourses(nextCourses);
      await Promise.all([
        fetchMaterialsForCourses(nextCourses),
        fetchAssignmentsForCourses(nextCourses),
      ]);
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

  async function handleAssignmentSubmit(fields) {
    const isEdit = assignmentModal.mode === 'edit';
    const courseId = assignmentModal.courseId;
    const res = await api.request({
      url: isEdit
        ? `/courses/${courseId}/assignments/${assignmentModal.assignmentId}`
        : `/courses/${courseId}/assignments`,
      method: isEdit ? 'put' : 'post',
      data: fields,
    });
    const saved = formatAssignment({
      ...fields,
      ...res.data,
      id: res.data?.id ?? assignmentModal.assignmentId,
    }, { includeQuestionDetails: true });
    setAssignments(prev => {
      const current = prev[courseId] || [];
      return {
        ...prev,
        [courseId]: isEdit
          ? current.map(assignment => (assignment.id === saved.id ? saved : assignment))
          : [saved, ...current],
      };
    });
    setAssignmentModal(null);
  }

  async function openEditAssignment(courseId, assignment) {
    setAssignmentModal({
      mode: 'edit',
      courseId,
      assignmentId: assignment.id,
      initialData: assignment,
      isLoadingDetail: true,
    });
    try {
      const res = await api.get(`/courses/${courseId}/assignments/${assignment.id}`);
      setAssignmentModal(current => {
        if (!current || current.assignmentId !== assignment.id) return current;
        return {
          ...current,
          initialData: res.data,
          isLoadingDetail: false,
        };
      });
    } catch {
      alert('Failed to load assignment details.');
      setAssignmentModal(null);
    }
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
          assignments={assignments[course.id] || []}
          onUpload={section => setUploadModal({ courseId: course.id, section })}
          onDeleteMaterial={materialId => handleDeleteMaterial(course.id, materialId)}
          onViewStudents={() => navigate(`/instructor/courses/${course.id}/students`)}
          onNewAssignment={() => setAssignmentModal({ mode: 'create', courseId: course.id })}
          onEditAssignment={assignment => openEditAssignment(course.id, assignment)}
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

      {/* Assignment create/edit modal */}
      {assignmentModal && (
        <AssignmentModal
          mode={assignmentModal.mode}
          initialData={assignmentModal.initialData}
          isLoadingDetail={assignmentModal.isLoadingDetail}
          onClose={() => setAssignmentModal(null)}
          onSubmit={handleAssignmentSubmit}
        />
      )}

      {/* Upload material modal */}
      {uploadModal && (
        <UploadMaterialModal
          courseId={uploadModal.courseId}
          initialSection={uploadModal.section}
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
