// Sprint 2: mock data — swap the import block for real axios calls in Sprint 3.
// TODO Sprint 3: replace mock imports with → import { courseApi, materialApi, announcementApi, assignmentApi } from '../api';
//                and restore Promise.all([courseApi.get(id), materialApi.list(id), ...])
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMockCourse } from '../mock/courses';
import { getMockMaterials } from '../mock/materials';
import { getMockAnnouncements } from '../mock/announcements';
import { getMockAssignments } from '../mock/assignments';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sprint 2: simulate async load with mock data
    const t = setTimeout(() => {
      setCourse(getMockCourse(id));
      setMaterials(getMockMaterials(id));
      setAnnouncements(getMockAnnouncements(id));
      setAssignments(getMockAssignments(id));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
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
                <Link to={`/courses/${id}/assignments/${a.id}/submit`}>
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
