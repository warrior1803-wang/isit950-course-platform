import { useEffect, useState } from 'react';
import { assignmentApi, courseApi } from '../../api';
import { classifyAssignments } from './assignmentUtils.js';
import AssignmentList from './AssignmentList.jsx';

function normalizeAssignment(course, raw) {
  const submission = raw.submissionStatus || raw.submission || null;
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || '',
    openDate: raw.openDate || raw.createdAt || raw.dueDate,
    dueDate: raw.dueDate,
    maxScore: raw.maxScore ?? raw.totalMarks ?? 0,
    course,
    submissionStatus: submission
      ? {
          id: submission.id,
          filename: submission.filename,
          submittedAt: submission.submittedAt,
          score: submission.score ?? null,
          feedback: submission.feedback ?? null,
          status: submission.status ?? null,
        }
      : null,
  };
}

export default function AssignmentListPage() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAssignments() {
      setError('');

      try {
        const courseRes = await courseApi.list();
        const courses = (courseRes.data?.data ?? []).map(course => ({
          id: course.id,
          code: course.code,
          name: course.name,
          instructor: { name: course.instructorName ?? 'Instructor' },
        }));

        const assignmentResults = await Promise.allSettled(
          courses.map(course => assignmentApi.list(course.id))
        );

        if (cancelled) return;

        const allAssignments = assignmentResults.flatMap((result, index) => {
          if (result.status !== 'fulfilled') return [];
          const items = result.value.data?.data ?? [];
          return items.map(item => normalizeAssignment(courses[index], item));
        });

        setSections(classifyAssignments(allAssignments));

        const hasFailures = assignmentResults.some(result => result.status === 'rejected');
        if (hasFailures && allAssignments.length === 0) {
          setError('Failed to load assignments.');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load assignments.');
        setSections(classifyAssignments([]));
      }
    }

    loadAssignments();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sections) {
    return (
      <div className="max-w-[780px]">
        <div className="h-7 w-40 bg-[#e8dfd8] rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[780px]">
        <div className="text-[22px] text-[#2e2028] mb-1">Assignments</div>
        <div className="text-[13px] text-[#d85a30] bg-[rgba(216,90,48,0.08)] border border-[rgba(216,90,48,0.2)] rounded-xl px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  return <AssignmentList sections={sections} />;
}
