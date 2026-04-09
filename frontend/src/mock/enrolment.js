/**
 * Mock data — GET /api/enrolments  →  { enrolments }
 *             GET /api/students/:id/enrolments  →  { enrolments }
 *
 * Shape:
 *   {
 *     id,
 *     student: User,
 *     course: Course,
 *     enrolledAt
 *   }
 */

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const MOCK_ENROLMENTS = [
  {
    id: 1001,
    student: {
      id: 1,
      name: 'Bingyan Wang',
      role: 'student',
      studentNumber: 'u1234567',
    },
    course: {
      id: 1,
      code: 'ISIT950',
      name: 'Research Methods in IT',
      instructor: { id: 3, name: 'Dr. Mitchell' },
      schedule: 'Thu 10:00 – 12:00',
      location: 'Building 40, Room 205',
    },
    enrolledAt: '2026-02-20T09:10:00Z',
  },
  {
    id: 1002,
    student: {
      id: 1,
      name: 'Bingyan Wang',
      role: 'student',
      studentNumber: 'u1234567',
    },
    course: {
      id: 3,
      code: 'CSIT110',
      name: 'Introduction to Programming',
      instructor: { id: 3, name: 'Dr. Mitchell' },
      schedule: 'Mon 09:00 – 11:00',
      location: 'Building 6, Room 112',
    },
    enrolledAt: '2025-07-25T14:00:00Z',
  },
  {
    id: 1003,
    student: {
      id: 2,
      name: 'Chris Lee',
      role: 'student',
      studentNumber: 'u7654321',
    },
    course: {
      id: 1,
      code: 'ISIT950',
      name: 'Research Methods in IT',
      instructor: { id: 3, name: 'Dr. Mitchell' },
      schedule: 'Thu 10:00 – 12:00',
      location: 'Building 40, Room 205',
    },
    enrolledAt: '2026-02-21T11:25:00Z',
  },
  {
    id: 1004,
    student: {
      id: 2,
      name: 'Chris Lee',
      role: 'student',
      studentNumber: 'u7654321',
    },
    course: {
      id: 2,
      code: 'ISIT851',
      name: 'Cloud Computing and DevOps',
      instructor: { id: 3, name: 'Dr. Mitchell' },
      schedule: 'Tue 14:00 – 16:00',
      location: 'Building 11, Lab 3',
    },
    enrolledAt: '2026-02-20T16:45:00Z',
  },
  {
    id: 1005,
    student: {
      id: 2,
      name: 'Chris Lee',
      role: 'student',
      studentNumber: 'u7654321',
    },
    course: {
      id: 3,
      code: 'CSIT110',
      name: 'Introduction to Programming',
      instructor: { id: 3, name: 'Dr. Mitchell' },
      schedule: 'Mon 09:00 – 11:00',
      location: 'Building 6, Room 112',
    },
    enrolledAt: '2025-07-26T10:20:00Z',
  },
];

/** Simulates GET /api/enrolments */
export function getMockEnrolments() {
  return deepClone(MOCK_ENROLMENTS);
}

/** Simulates GET /api/enrolments/:id */
export function getMockEnrolment(id) {
  const enrolment = MOCK_ENROLMENTS.find(item => item.id === Number(id));
  return enrolment ? deepClone(enrolment) : null;
}

/** Simulates GET /api/students/:id/enrolments */
export function getMockEnrolmentsByStudent(studentId) {
  return deepClone(MOCK_ENROLMENTS.filter(item => item.student.id === Number(studentId)));
}

/** Simulates GET /api/courses/:id/enrolments */
export function getMockEnrolmentsByCourse(courseId) {
  return deepClone(MOCK_ENROLMENTS.filter(item => item.course.id === Number(courseId)));
}
