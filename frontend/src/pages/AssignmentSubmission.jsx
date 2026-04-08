// Sprint 2: mock data — swap for real axios calls in Sprint 3.
// TODO Sprint 3: restore → assignmentApi.list(courseId) and assignmentApi.submit(id, formData)
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { getMockAssignment } from '../mock/assignments';

export default function AssignmentSubmission() {
  const { id: courseId, asgId: assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    // Sprint 2: resolve from mock data
    const t = setTimeout(() => {
      setAssignment(getMockAssignment(courseId, assignmentId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [courseId, assignmentId]);

  async function onSubmit() {
    // Sprint 2: mock submit — no real upload
    // TODO Sprint 3: const formData = new FormData(); formData.append('file', data.file[0]);
    //               await assignmentApi.submit(assignmentId, formData);
    await new Promise(r => setTimeout(r, 400)); // simulate upload
    setSubmitted(true);
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
                  accept=".pdf,.docx"
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
