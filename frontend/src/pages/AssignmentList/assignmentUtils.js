const SOON_THRESHOLD_DAYS = 14;

export function classifyAssignments(assignments) {
  const today = new Date();
  const dueSoon = [];
  const inProgress = [];
  const submitted = [];
  const graded = [];

  assignments.forEach(item => {
    const due = new Date(item.dueDate);
    const open = new Date(item.openDate || item.dueDate);

    if (item.submissionStatus) {
      if (item.submissionStatus.score !== null && item.submissionStatus.score !== undefined) {
        graded.push(item);
      } else {
        submitted.push(item);
      }
      return;
    }

    if (due < today) return;

    const daysUntilDue = (due.getTime() - today.getTime()) / 86_400_000;
    if (open.getTime() <= today.getTime() && daysUntilDue <= SOON_THRESHOLD_DAYS) {
      dueSoon.push(item);
    } else {
      inProgress.push(item);
    }
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
