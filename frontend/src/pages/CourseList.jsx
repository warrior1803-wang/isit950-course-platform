// Sprint 2: mock data — swap the import block for real axios calls in Sprint 3.
// TODO Sprint 3: replace mock import with → import { courseApi } from '../api';
//                and restore:  courseApi.list().then(res => setCourses(res.data.courses))
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MOCK_COURSES } from '../mock/courses';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Sprint 2: simulate async load with mock data
    const t = setTimeout(() => {
      setCourses(MOCK_COURSES);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (loading) return <div>Loading courses...</div>;

  return (
    <div>
      <header>
        <h1>Course Collaboration Platform</h1>
        <span>Welcome, {user?.name} ({user?.role})</span>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <main>
        <h2>All Courses</h2>
        {courses.length === 0 ? (
          <p>No courses available.</p>
        ) : (
          <ul>
            {courses.map((course) => (
              <li key={course.id}>
                <Link to={`/courses/${course.id}`}>
                  <strong>{course.code}</strong> — {course.name}
                </Link>
                <span> | Instructor: {course.instructor?.name}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
