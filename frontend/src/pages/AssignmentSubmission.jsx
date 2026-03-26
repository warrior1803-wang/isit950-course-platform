import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { assignmentApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AssignmentSubmission() {
  const { courseId, assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    assignmentApi
      .list(courseId)
      .then((res) => {
        const found = res.data.assignments.find((a) => a.id === parseInt(assignmentId));
        setAssignment(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId, assignmentId]);

  async function onSubmit(data) {
    try {
      const formData = new FormData();
      formData.append('file', data.file[0]);
      await assignmentApi.submit(assignmentId, formData);
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    }
  }

  if (loading) return <div>Loading assignment...</div>;
  if (!assignment) return <div>Assignment not found.</div>;

  return (
    <div>
      <Link to={`/courses/${courseId}`}>← Back to Course</Link>
      <h1>{assignment.title}</h1>

      {assignment.description && <p>{assignment.description}</p>}
      {assignment.dueDate && (
        <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
      )}
      {assignment.maxScore && <p>Max Score: {assignment.maxScore}</p>}

      {user?.role === 'student' && (
        <section>
          <h2>Submit Assignment</h2>
          {submitted ? (
            <p>Your submission has been received!</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="file">Upload File</label>
                <input
                  id="file"
                  type="file"
                  {...register('file', { required: 'Please select a file' })}
                />
                {errors.file && <span>{errors.file.message}</span>}
              </div>
              <button type="submit">Submit</button>
            </form>
          )}
        </section>
      )}

      {user?.role === 'instructor' && (
        <section>
          <h2>Submissions</h2>
          <p>View and grade submissions in the instructor dashboard.</p>
        </section>
      )}
    </div>
  );
}
