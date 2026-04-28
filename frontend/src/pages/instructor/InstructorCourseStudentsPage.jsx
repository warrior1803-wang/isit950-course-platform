import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function InstructorCourseStudentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/courses/${id}/enrolments`);
        if (!isMounted) return;
        setStudents(res.data?.data ?? []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Failed to load enrolled students.');
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
        <div className="text-sm text-[#d85a30] bg-[#d85a30]/8 border border-[#d85a30]/20 rounded-xl p-4 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-input-bg rounded-2xl border border-border p-5 animate-pulse h-[120px]" />
      ) : students.length === 0 ? (
        <div className="bg-input-bg rounded-2xl border border-border p-6 text-sm text-text-muted">
          No enrolled students found.
        </div>
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
