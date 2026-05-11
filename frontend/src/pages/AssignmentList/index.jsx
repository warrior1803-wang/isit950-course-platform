import { useCallback, useEffect, useState } from 'react';
import ErrorState from '../../components/shared/ErrorState.jsx';
import { assignmentApi, courseApi } from '../../api';
import { classifyAssignments } from './assignmentUtils.js';
import AssignmentList from './AssignmentList.jsx';
import { getApiErrorState } from '../../lib/apiState.js';

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
  const [error, setError] = useState(null);

  const loadAssignments = useCallback(async (isCancelled = () => false) => {
      setError(null);

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

        if (isCancelled()) return;

        const allAssignments = assignmentResults.flatMap((result, index) => {
          if (result.status !== 'fulfilled') return [];
          const items = result.value.data?.data ?? [];
          return items.map(item => normalizeAssignment(courses[index], item));
        });

        setSections(classifyAssignments(allAssignments));

        const hasFailures = assignmentResults.some(result => result.status === 'rejected');
        if (hasFailures && allAssignments.length === 0) {
          setError({ kind: 'retryable', message: 'Something went wrong — please try again' });
        }
      } catch (err) {
        if (isCancelled()) return;
        setError(getApiErrorState(err));
        setSections(classifyAssignments([]));
      }
    }, []);

  useEffect(() => {
    let cancelled = false;
    loadAssignments(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadAssignments]);

  if (!sections) {
    return (
      <div className="max-w-[780px]">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ddd0d4] border-t-[#b693a9]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[780px]">
        <div className="text-[22px] text-[#2e2028] mb-1">Assignments</div>
        {error.kind === 'upgrade' ? (
          <div className="text-[13px] text-[#8b6914] bg-[#fef9c3] border border-[#fde047] rounded-xl px-4 py-3">
            This feature requires a membership. <a href="/membership" className="underline">Upgrade</a>
          </div>
        ) : (
          <ErrorState
            message={error.message}
            onRetry={error.kind === 'retryable' ? () => loadAssignments() : null}
          />
        )}
      </div>
    );
  }

  return <AssignmentList sections={sections} />;
}
