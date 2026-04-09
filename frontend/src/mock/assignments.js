/**
 * Mock data — GET /api/courses/:id/assignments  →  { assignments }
 *
 * All status variants covered (relative to today: 2026-04-05):
 *   Upcoming  — openDate > today
 *   Due soon  — openDate ≤ today ≤ dueDate, !submitted
 *   Overdue   — dueDate < today, !submitted
 *   Submitted — submitted, score === null
 *   Graded    — submitted, score !== null
 *
 * submissionStatus shape (included in each assignment for the student view):
 *   null                                → not submitted
 *   { id, fileUrl, submittedAt, score, feedback } → submitted
 */

const ASSIGNMENTS = {
  1: [
    {
      id: 11,
      courseId: 1,
      title: 'Research Proposal',
      description:
        'Write a 1500-word research proposal on a topic of your choice. Include a clear research question, justification, methodology outline, and reference list (min. 8 scholarly sources).',
      openDate: '2026-02-24T00:00:00Z',
      dueDate: '2026-03-10T23:59:00Z', // past → Graded
      maxScore: 20,
      submissionStatus: {
        id: 501,
        fileUrl: '#',
        submittedAt: '2026-03-09T18:44:00Z',
        score: 17,
        feedback:
          'Excellent research question and well-structured argument. Reference list is comprehensive. Minor improvements needed in the methodology section — be more specific about sampling strategy.',
      },
    },
    {
      id: 12,
      courseId: 1,
      title: 'Literature Review',
      description:
        'Conduct a systematic literature review (2500 words) on your chosen research topic. Analyse and synthesise at least 15 peer-reviewed sources published after 2018.',
      openDate: '2026-03-01T00:00:00Z',
      dueDate: '2026-03-31T23:59:00Z', // past → Submitted (not yet graded)
      maxScore: 30,
      submissionStatus: {
        id: 502,
        fileUrl: '#',
        submittedAt: '2026-03-30T22:11:00Z',
        score: null,
        feedback: null,
      },
    },
    {
      id: 13,
      courseId: 1,
      title: 'Data Collection Report',
      description:
        'Submit a 1000-word report describing your data collection methodology, instruments used, and preliminary findings.',
      openDate: '2026-03-20T00:00:00Z',
      dueDate: '2026-04-12T23:59:00Z', // due soon — not submitted
      maxScore: 20,
      submissionStatus: null,
    },
    {
      id: 14,
      courseId: 1,
      title: 'Final Research Paper',
      description:
        'Submit your complete research paper (5000–6000 words) including all sections: abstract, introduction, literature review, methodology, findings, discussion, and conclusion.',
      openDate: '2026-04-10T00:00:00Z', // upcoming
      dueDate: '2026-05-30T23:59:00Z',
      maxScore: 30,
      submissionStatus: null,
    },
    {
      id: 15,
      courseId: 1,
      title: 'Peer Review Task',
      description:
        'Review and provide structured feedback on two of your peers\' literature reviews using the provided rubric.',
      openDate: '2026-02-28T00:00:00Z',
      dueDate: '2026-03-20T23:59:00Z', // past — overdue, not submitted
      maxScore: 10,
      submissionStatus: null,
    },
  ],

  2: [
    {
      id: 21,
      courseId: 2,
      title: 'Cloud Architecture Design',
      description:
        'Design a scalable cloud architecture for a given case study using AWS or GCP. Provide a written report (1000 words) and a system diagram.',
      openDate: '2026-02-24T00:00:00Z',
      dueDate: '2026-03-20T23:59:00Z', // Graded
      maxScore: 25,
      submissionStatus: {
        id: 601,
        fileUrl: '#',
        submittedAt: '2026-03-19T20:05:00Z',
        score: 22,
        feedback:
          'Strong architecture choice with good justification. The auto-scaling configuration is well thought out. Consider adding a CDN layer for static assets.',
      },
    },
    {
      id: 22,
      courseId: 2,
      title: 'Docker and Kubernetes Lab',
      description:
        'Complete the containerisation lab: Dockerise a provided Node.js app, push to a container registry, and deploy on Kubernetes. Submit a lab report with screenshots.',
      openDate: '2026-03-15T00:00:00Z',
      dueDate: '2026-04-08T23:59:00Z', // due soon — not submitted
      maxScore: 25,
      submissionStatus: null,
    },
    {
      id: 23,
      courseId: 2,
      title: 'CI/CD Pipeline Implementation',
      description:
        'Implement a full CI/CD pipeline using GitHub Actions for the sample project repository. Include automated tests, build, and deployment to a cloud environment.',
      openDate: '2026-04-07T00:00:00Z', // upcoming
      dueDate: '2026-05-02T23:59:00Z',
      maxScore: 30,
      submissionStatus: null,
    },
  ],

  3: [
    {
      id: 31,
      courseId: 3,
      title: 'Python Basics Quiz',
      description: 'Online quiz covering variables, data types, and control flow.',
      openDate: '2025-08-04T00:00:00Z',
      dueDate: '2025-08-11T23:59:00Z',
      maxScore: 10,
      submissionStatus: {
        id: 701,
        fileUrl: '#',
        submittedAt: '2025-08-10T14:22:00Z',
        score: 9,
        feedback: 'Great work! Just one error in the while-loop question.',
      },
    },
    {
      id: 32,
      courseId: 3,
      title: 'Functions and Modules Assignment',
      description: 'Write a Python program using functions and modules to solve the given problem set.',
      openDate: '2025-09-01T00:00:00Z',
      dueDate: '2025-09-20T23:59:00Z',
      maxScore: 20,
      submissionStatus: {
        id: 702,
        fileUrl: '#',
        submittedAt: '2025-09-18T21:00:00Z',
        score: 18,
        feedback: 'Well-organised code with clear function names. Add docstrings next time.',
      },
    },
  ],
};

/** Simulates GET /api/courses/:id/assignments  →  { assignments } */
export function getMockAssignments(courseId) {
  return ASSIGNMENTS[Number(courseId)] ?? [];
}

/** Simulates GET /api/courses/:id/assignments/:asgId */
export function getMockAssignment(courseId, assignmentId) {
  const list = getMockAssignments(courseId);
  return list.find(a => a.id === Number(assignmentId)) ?? null;
}
