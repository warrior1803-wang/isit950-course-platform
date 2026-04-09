/**
 * Mock data — GET /api/courses  →  { courses }
 *             GET /api/courses/:id  →  { course }
 *
 * semester.endDate > today (2026-04-05)  →  "In progress"
 * semester.endDate ≤ today              →  "Completed"
 */

export const MOCK_COURSES = [
  {
    id: 1,
    code: 'ISIT950',
    name: 'Research Methods in IT',
    description:
      'Covers quantitative and qualitative research design, literature review, data collection, and academic writing for IT professionals.',
    instructor: { id: 3, name: 'Dr. Mitchell' },
    coverImageUrl: null,
    semester: { startDate: '2026-02-24', endDate: '2026-06-20' },
    enrolledCount: 28,
  },
  {
    id: 2,
    code: 'ISIT851',
    name: 'Cloud Computing and DevOps',
    description:
      'Explores cloud service models, containerisation, CI/CD pipelines, infrastructure-as-code, and monitoring in modern software delivery.',
    instructor: { id: 3, name: 'Dr. Mitchell' },
    coverImageUrl: null,
    semester: { startDate: '2026-02-24', endDate: '2026-06-20' },
    enrolledCount: 35,
  },
  {
    id: 3,
    code: 'CSIT110',
    name: 'Introduction to Programming',
    description:
      'Fundamentals of programming logic, Python syntax, control flow, functions, and basic data structures.',
    instructor: { id: 3, name: 'Dr. Mitchell' },
    coverImageUrl: null,
    semester: { startDate: '2025-07-28', endDate: '2025-11-30' }, // completed
    enrolledCount: 52,
  },
];

/** Simulates GET /api/courses/:id  →  { course } */
export function getMockCourse(id) {
  return MOCK_COURSES.find(c => c.id === Number(id)) ?? null;
}
