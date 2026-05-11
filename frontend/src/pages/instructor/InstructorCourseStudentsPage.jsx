import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import api from '../../api/axios';
import { getApiErrorState } from '../../lib/apiState';

export default function InstructorCourseStudentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/courses/${id}/enrolments`);
        if (!isMounted) return;
        setStudents(res.data?.data ?? []);
      } catch (err) {
        if (!isMounted) return;
        setError(getApiErrorState(err));
        setStudents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            type="button"
            className="text-xs text-text-muted hover:text-accent flex items-center gap-1 mb-2"
            onClick={() => navigate('/instructor/courses')}
          >
            <span className="material-symbols-rounded text-base">arrow_back</span>
            Back to courses
          </button>
          <h1 className="text-2xl font-normal text-text-dark">Enrolled Students</h1>
          <p className="text-sm text-text-muted mt-1">
            Students enrolled in course {id}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          {error.kind === 'upgrade' ? (
            <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
              This feature requires a membership. <a href="/membership" className="underline">Upgrade</a>
            </div>
          ) : (
            <ErrorState message={error.message} />
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
        </div>
      ) : students.length === 0 ? (
        <EmptyState icon="group" title="No enrolled students found" />
      ) : (
        <div className="bg-input-bg rounded-2xl border border-border overflow-hidden">
          {students.map(student => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-4 bg-white border-b border-border last:border-b-0"
            >
              <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm">
                {(student.name || student.email || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-text-dark truncate">
                  {student.name || 'Unnamed student'}
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {student.email || 'No email'}
                  {student.membership ? ` - ${student.membership}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
