/**
 * Mock data — GET /api/courses/:id/announcements  →  { announcements }
 * Sorted newest-first (as the API would return them).
 */

const ANNOUNCEMENTS = {
  1: [
    {
      id: 1001,
      courseId: 1,
      title: 'Assignment 2 deadline extended',
      body: 'Due to public holiday next Monday, the deadline for Assignment 2 has been extended to Friday 10 April at 11:59 PM. Please make sure your submission is uploaded before then.',
      status: 'published',
      author: { id: 3, name: 'Dr. Mitchell' },
      createdAt: '2026-04-03T14:20:00Z',
    },
    {
      id: 1002,
      courseId: 1,
      title: 'Week 7 lecture recording now available',
      body: "The recording of last Thursday's lecture on qualitative data analysis is now uploaded to the Materials section. Password to access: ISIT950W7.",
      status: 'published',
      author: { id: 3, name: 'Dr. Mitchell' },
      createdAt: '2026-03-29T09:00:00Z',
    },
    {
      id: 1003,
      courseId: 1,
      title: 'Welcome to ISIT950 — Autumn 2026',
      body: 'Welcome to Research Methods in IT! Please read the unit guide carefully and make sure you have access to the Moodle page. Our first class is Thursday 27 February at 10am in Building 40, Room 202.',
      status: 'published',
      author: { id: 3, name: 'Dr. Mitchell' },
      createdAt: '2026-02-20T08:30:00Z',
    },
  ],

  2: [
    {
      id: 2001,
      courseId: 2,
      title: 'Lab environment set-up guide',
      body: 'Please follow the set-up guide in Week 1 materials to install Docker Desktop and configure your AWS Educate account before the next lab session.',
      status: 'published',
      author: { id: 3, name: 'Dr. Mitchell' },
      createdAt: '2026-04-01T11:00:00Z',
    },
    {
      id: 2002,
      courseId: 2,
      title: 'Welcome to ISIT851',
      body: 'Welcome to Cloud Computing and DevOps! This semester we will be using a hands-on approach with real cloud environments. Please ensure you complete the pre-work before Week 2.',
      status: 'published',
      author: { id: 3, name: 'Dr. Mitchell' },
      createdAt: '2026-02-20T08:00:00Z',
    },
  ],

  3: [
    {
      id: 3001,
      courseId: 3,
      title: 'Final exam results released',
      body: 'Final exam marks have been released via Student Online Services. Please check your results and contact student admin if you have any queries.',
      status: 'published',
      author: { id: 3, name: 'Dr. Mitchell' },
      createdAt: '2025-12-10T10:00:00Z',
    },
  ],
};

/** Simulates GET /api/courses/:id/announcements  →  { announcements } */
export function getMockAnnouncements(courseId) {
  return ANNOUNCEMENTS[Number(courseId)] ?? [];
}
