import { getMockAssignments } from '../../mock/assignments';

const TODAY = new Date();
const SOON_THRESHOLD_DAYS = 14;

export function classifyAssignments(courses) {
  const dueSoon = [];
  const inProgress = [];
  const submitted = [];
  const graded = [];

  courses.forEach(course => {
    getMockAssignments(course.id).forEach(a => {
      const due = new Date(a.dueDate);
      const open = new Date(a.openDate);
      const item = { ...a, course };

      if (a.submissionStatus) {
        if (a.submissionStatus.score !== null) {
          graded.push(item);
        } else {
          submitted.push(item);
        }
        return;
      }

      if (due < TODAY) return; // overdue — omit for now

      const daysUntilDue = (due.getTime() - TODAY.getTime()) / 86_400_000;
      if (open.getTime() <= TODAY.getTime() && daysUntilDue <= SOON_THRESHOLD_DAYS) {
        dueSoon.push(item);
      } else {
        inProgress.push(item);
      }
    });
  });

  dueSoon.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  inProgress.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  submitted.sort((a, b) => new Date(b.submissionStatus.submittedAt).getTime() - new Date(a.submissionStatus.submittedAt).getTime());
  graded.sort((a, b) => new Date(b.submissionStatus.submittedAt).getTime() - new Date(a.submissionStatus.submittedAt).getTime());

  return { dueSoon, inProgress, submitted, graded };
}

export function formatDue(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export function formatDueWithTime(dateStr) {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const hour = d.getHours();
  const ampm = hour < 12 ? 'am' : 'pm';
  const h = hour % 12 || 12;
  return `Due ${datePart}, ${h}${ampm}`;
}

export function formatSubmittedAt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
