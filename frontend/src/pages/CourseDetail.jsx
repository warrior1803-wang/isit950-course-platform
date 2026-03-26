import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseApi, materialApi, announcementApi, assignmentApi } from '../api';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const courseId = parseInt(id);
    Promise.all([
      courseApi.get(courseId),
      materialApi.list(courseId),
      announcementApi.list(courseId),
      assignmentApi.list(courseId),
    ])
      .then(([courseRes, matRes, annRes, asgRes]) => {
        setCourse(courseRes.data.course);
        setMaterials(matRes.data.materials);
        setAnnouncements(annRes.data.announcements);
        setAssignments(asgRes.data.assignments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading course...</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div>
      <Link to="/courses">← Back to Courses</Link>

      <h1>{course.code} — {course.name}</h1>
      <p>{course.description}</p>
      <p>Instructor: {course.instructor?.name}</p>

      <section>
        <h2>Announcements</h2>
        {announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          <ul>
            {announcements.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong> — {a.body}
                <small> by {a.author?.name}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Materials</h2>
        {materials.length === 0 ? (
          <p>No materials uploaded yet.</p>
        ) : (
          <ul>
            {materials.map((m) => (
              <li key={m.id}>
                <a href={m.url} target="_blank" rel="noreferrer">{m.filename}</a>
                {m.section && <span> — Section: {m.section}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Assignments</h2>
        {assignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          <ul>
            {assignments.map((a) => (
              <li key={a.id}>
                <Link to={`/courses/${id}/assignments/${a.id}`}>
                  {a.title}
                </Link>
                {a.dueDate && <span> — Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Forum</h2>
        <Link to={`/courses/${id}/forum`}>Go to Forum</Link>
      </section>
    </div>
  );
}
