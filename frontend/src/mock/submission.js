/**
 * Mock data — GET /api/submissions  →  { submissions }
 *             GET /api/submissions/:id  →  { submission }
 *
 * Shape:
 *   {
 *     id,
 *     assignment: {
 *       id,
 *       courseId,
 *       title,
 *       description,
 *       dueDate,
 *       maxScore,
 *       submissionMode
 *     },
 *     student: {
 *       id,
 *       name,
 *       role,
 *       studentNumber
 *     },
 *     filename,
 *     fileType,
 *     fileSizeBytes,
 *     submittedAt,
 *     score,
 *     feedback,
 *     status,
 *     markedAt,
 *     markedBy
 *   }
 */

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const MOCK_SUBMISSIONS = [
  {
    id: 501,
    assignment: {
      id: 11,
      courseId: 1,
      title: 'Research Proposal',
      description:
        'Write a 1500-word research proposal on a topic of your choice. Include a clear research question, justification, methodology outline, and reference list (min. 8 scholarly sources).',
      dueDate: '2026-03-10T23:59:00Z',
      maxScore: 20,
      submissionMode: 'Individual submission',
    },
    student: {
      id: 1,
      name: 'Bingyan Wang',
      role: 'student',
      studentNumber: 'u1234567',
    },
    filename: 'research_proposal_bingyan_wang.pdf',
    fileType: 'PDF',
    fileSizeBytes: 2149580,
    submittedAt: '2026-03-09T18:44:00Z',
    score: 17,
    feedback:
      'Excellent research question and well-structured argument. Reference list is comprehensive. Minor improvements needed in the methodology section — be more specific about sampling strategy.',
    status: 'graded',
    markedAt: '2026-03-14T09:20:00Z',
    markedBy: 'Dr. Mitchell',
  },
  {
    id: 502,
    assignment: {
      id: 12,
      courseId: 1,
      title: 'Literature Review',
      description:
        'Conduct a systematic literature review (2500 words) on your chosen research topic. Analyse and synthesise at least 15 peer-reviewed sources published after 2018.',
      dueDate: '2026-04-12T23:59:00Z',
      maxScore: 30,
      submissionMode: 'Individual submission',
    },
    student: {
      id: 1,
      name: 'Bingyan Wang',
      role: 'student',
      studentNumber: 'u1234567',
    },
    filename: 'literature_review_bingyan_wang.pdf',
    fileType: 'PDF',
    fileSizeBytes: 2861056,
    submittedAt: '2026-03-30T22:11:00Z',
    score: null,
    feedback: null,
    status: 'submitted',
    markedAt: null,
    markedBy: null,
  },
  {
    id: 601,
    assignment: {
      id: 21,
      courseId: 2,
      title: 'Cloud Architecture Design',
      description:
        'Design a scalable cloud architecture for a given case study using AWS or GCP. Provide a written report (1000 words) and a system diagram.',
      dueDate: '2026-03-20T23:59:00Z',
      maxScore: 25,
      submissionMode: 'Group submission',
    },
    student: {
      id: 2,
      name: 'Chris Lee',
      role: 'student',
      studentNumber: 'u7654321',
    },
    filename: 'cloud_architecture_team_delta.pdf',
    fileType: 'PDF',
    fileSizeBytes: 3417088,
    submittedAt: '2026-03-19T20:05:00Z',
    score: 22,
    feedback:
      'Strong architecture choice with good justification. The auto-scaling configuration is well thought out. Consider adding a CDN layer for static assets.',
    status: 'graded',
    markedAt: '2026-03-25T11:10:00Z',
    markedBy: 'Dr. Mitchell',
  },
  {
    id: 701,
    assignment: {
      id: 31,
      courseId: 3,
      title: 'Python Basics Quiz',
      description: 'Online quiz covering variables, data types, and control flow.',
      dueDate: '2025-08-11T23:59:00Z',
      maxScore: 10,
      submissionMode: 'Individual submission',
    },
    student: {
      id: 1,
      name: 'Bingyan Wang',
      role: 'student',
      studentNumber: 'u1234567',
    },
    filename: 'python_basics_quiz_answers.pdf',
    fileType: 'PDF',
    fileSizeBytes: 524288,
    submittedAt: '2025-08-10T14:22:00Z',
    score: 9,
    feedback: 'Great work! Just one error in the while-loop question.',
    status: 'graded',
    markedAt: '2025-08-13T10:00:00Z',
    markedBy: 'Dr. Mitchell',
  },
  {
    id: 702,
    assignment: {
      id: 32,
      courseId: 3,
      title: 'Functions and Modules Assignment',
      description: 'Write a Python program using functions and modules to solve the given problem set.',
      dueDate: '2025-09-20T23:59:00Z',
      maxScore: 20,
      submissionMode: 'Individual submission',
    },
    student: {
      id: 2,
      name: 'Chris Lee',
      role: 'student',
      studentNumber: 'u7654321',
    },
    filename: 'functions_modules_assignment.py',
    fileType: 'PY',
    fileSizeBytes: 8192,
    submittedAt: '2025-09-18T21:00:00Z',
    score: 18,
    feedback: 'Well-organised code with clear function names. Add docstrings next time.',
    status: 'graded',
    markedAt: '2025-09-24T15:40:00Z',
    markedBy: 'Dr. Mitchell',
  },
];

/** Simulates GET /api/submissions */
export function getMockSubmissions() {
  return deepClone(MOCK_SUBMISSIONS);
}

/** Simulates GET /api/submissions/:id */
export function getMockSubmission(id) {
  const submission = MOCK_SUBMISSIONS.find(item => item.id === Number(id));
  return submission ? deepClone(submission) : null;
}

/** Simulates GET /api/students/:id/submissions */
export function getMockSubmissionsByStudent(studentId) {
  return deepClone(MOCK_SUBMISSIONS.filter(item => item.student.id === Number(studentId)));
}

/** Simulates GET /api/courses/:courseId/assignments/:assignmentId/submission */
export function getMockSubmissionByAssignment(courseId, assignmentId) {
  const submission = MOCK_SUBMISSIONS.find(
    item =>
      item.assignment.courseId === Number(courseId) &&
      item.assignment.id === Number(assignmentId),
  );
  return submission ? deepClone(submission) : null;
}
