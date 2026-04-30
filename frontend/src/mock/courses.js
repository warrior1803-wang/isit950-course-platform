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
    schedule: 'Thu 10:00 – 12:00',
    location: 'Building 40, Room 205',
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
    schedule: 'Tue 14:00 – 16:00',
    location: 'Building 11, Lab 3',
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
    schedule: 'Mon 09:00 – 11:00',
    location: 'Building 6, Room 112',
    semester: { startDate: '2025-07-28', endDate: '2025-11-30' }, // completed
    enrolledCount: 52,
  },
  {
    id: 4,
    code: 'CSIT998',
    name: 'Professional Capstone Project',
    description:
      'In this subject, students will work in a group on a professional project. Project tasks include eliciting and justifying project requirements, researching, designing and evaluating a solution, and communicating results of the project. During this process, students will need to demonstrate an understanding of the professional practice and ethical considerations.',
    instructor: { id: 4, name: 'Dr. Jane Smith' },
    coverImageUrl: null,
    schedule: 'Wed 13:00 – 16:00',
    location: 'Building 2, Collaboration Studio',
    semester: { startDate: '2026-02-24', endDate: '2026-06-20' },
    enrolledCount: 52,
  },
  {
    id: 5,
    code: 'ISIT919',
    name: 'Knowledge Engineering',
    description:
      'The subject describes issues in using IT to support knowledge sharing and reuse. Challenges in representing and sharing knowledge in the context of knowledge systems are studied. Additional challenges in heterogeneous health IT environments are also examined. The subject presents systemic approaches for knowledge engineering via a contemporary Web and modern information modelling approach, analyse and apply in healthcare environment.',
    instructor: { id: 5, name: 'Dr. John Doe' },
    coverImageUrl: null,
    schedule: 'Fri 10:00 – 12:00',
    location: 'Building 28, Seminar Room 4',
    semester: { startDate: '2026-02-24', endDate: '2026-06-20' },
    enrolledCount: 52,
  }
];

/** Simulates GET /api/courses/:id  →  { course } */
export function getMockCourse(id) {
  return MOCK_COURSES.find(c => c.id === Number(id)) ?? null;
}
