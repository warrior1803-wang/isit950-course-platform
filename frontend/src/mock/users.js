/**
 * Mock user store — Sprint 2 static data.
 * Shape matches POST /api/auth/login and POST /api/auth/register responses.
 */
export const MOCK_USERS = [
  {
    id: 1,
    name: 'Bingyan Wang',
    email: 'bwang@uowmail.edu.au',
    password: 'password1',
    role: 'student',
    studentNumber: 'u1234567',
    department: null,
  },
  {
    id: 2,
    name: 'Chris Lee',
    email: 'clee@uowmail.edu.au',
    password: 'password1',
    role: 'student',
    studentNumber: 'u7654321',
    department: null,
  },
  {
    id: 3,
    name: 'Dr. Mitchell',
    email: 'mitchell@uowmail.edu.au',
    password: 'password1',
    role: 'instructor',
    studentNumber: null,
    department: 'School of Computing and IT',
  },
];
