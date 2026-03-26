import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    courseApi
      .list()
      .then((res) => setCourses(res.data.courses))
      .catch(console.error)
      .finally(() => setLoading(false));
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
