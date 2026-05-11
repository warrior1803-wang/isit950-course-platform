import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { AssignmentItem, SectionLabel } from './AssignmentItem.jsx';
import { formatDue, formatDueWithTime, formatSubmittedAt } from './assignmentUtils.js';

const PILL = 'text-[11px] px-2.5 py-0.5 rounded-md whitespace-nowrap border';

function AssignmentList({ sections }) {
  const navigate = useNavigate();
  const { dueSoon, inProgress, submitted, graded } = sections;
  const hasSubmittedSection = submitted.length > 0 || graded.length > 0;
  const hasAnyAssignments =
    dueSoon.length > 0 ||
    inProgress.length > 0 ||
    submitted.length > 0 ||
    graded.length > 0;

  return (
    <div className="max-w-[780px]">
      <div className="text-[22px] text-[#2e2028] mb-1">Assignments</div>
      <div className="text-[13px] text-[#9c8a8e] mb-2">All pending and upcoming assignments across your courses</div>

      {!hasAnyAssignments ? (
        <EmptyState
          icon="task"
          title="No assignments due"
          subtitle="You're all caught up"
        />
      ) : (
        <>
      {/* ── Due soon ── */}
      <SectionLabel>Due soon</SectionLabel>
      <div className="flex flex-col gap-2">
        {dueSoon.length === 0 && (
          <div className="px-4 py-3.5 rounded-xl bg-[#f5eeea] border border-dashed border-[#ddd0d4] text-[13px] text-[#b8a8ad] text-center">
            No assignments due in the next two weeks
          </div>
        )}
        {dueSoon.map(a => (
          <AssignmentItem
            key={a.id}
            iconClass="bg-[rgba(216,90,48,0.1)] text-[#d85a30]"
            iconName="assignment_late"
            title={a.title}
            meta={`${a.course.code} · ${a.course.name} · ${a.course.instructor.name}`}
            preview={a.description}
            right={<>
              <span className={`${PILL} bg-[rgba(216,90,48,0.1)] text-[#d85a30] border-[rgba(216,90,48,0.2)]`}>{formatDueWithTime(a.dueDate)}</span>
              <span className="text-[11px] text-[#9c8a8e]">{a.maxScore} marks</span>
            </>}
            onClick={() => navigate(`/courses/${a.course.id}/assignments/${a.id}/submit`)}
          />
        ))}
      </div>

      {/* ── In progress ── */}
      <SectionLabel>In progress</SectionLabel>
      <div className="flex flex-col gap-2">
        {inProgress.length === 0 && (
          <div className="px-4 py-3.5 rounded-xl bg-[#f5eeea] border border-dashed border-[#ddd0d4] text-[13px] text-[#b8a8ad] text-center">
            No assignments currently in progress
          </div>
        )}
        {inProgress.map(a => (
          <AssignmentItem
            key={a.id}
            iconClass="bg-[rgba(182,147,169,0.15)] text-[#9c8a8e]"
            iconName="assignment"
            title={a.title}
            meta={`${a.course.code} · ${a.course.name} · ${a.course.instructor.name}`}
            preview={a.description}
            right={<>
              <span className={`${PILL} bg-[rgba(182,147,169,0.12)] text-[#9c8a8e] border-[rgba(182,147,169,0.2)]`}>Due {formatDue(a.dueDate)}</span>
              <span className="text-[11px] text-[#9c8a8e]">{a.maxScore} marks</span>
            </>}
            onClick={() => navigate(`/courses/${a.course.id}/assignments/${a.id}/submit`)}
          />
        ))}
      </div>

      {/* ── Submitted ── */}
      {hasSubmittedSection && (
        <>
          <SectionLabel>Submitted</SectionLabel>
          <div className="flex flex-col gap-2">
            {submitted.map(a => (
              <AssignmentItem
                key={a.id}
                iconClass="bg-[rgba(29,158,117,0.1)] text-[#1d9e75]"
                iconName="assignment_turned_in"
                title={a.title}
                meta={`${a.course.code} · ${a.course.name} · ${a.course.instructor.name}`}
                preview={`Submitted ${formatSubmittedAt(a.submissionStatus.submittedAt)} · Awaiting grade`}
                right={<>
                  <span className={`${PILL} bg-[rgba(29,158,117,0.1)] text-[#1d9e75] border-[rgba(29,158,117,0.2)]`}>Submitted</span>
                  <span className="text-[11px] text-[#9c8a8e]">{a.maxScore} marks</span>
                </>}
                onClick={() => navigate(`/courses/${a.course.id}/assignments/${a.id}/review`)}
              />
            ))}
            {graded.map(a => (
              <AssignmentItem
                key={a.id}
                iconClass="bg-[rgba(83,74,183,0.1)] text-[#534ab7]"
                iconName="grading"
                title={a.title}
                meta={`${a.course.code} · ${a.course.name} · ${a.course.instructor.name}`}
                preview={`Submitted ${formatSubmittedAt(a.submissionStatus.submittedAt)} · Grade: ${a.submissionStatus.score} / ${a.maxScore}`}
                right={<>
                  <span className={`${PILL} bg-[rgba(83,74,183,0.1)] text-[#534ab7] border-[rgba(83,74,183,0.2)]`}>Graded</span>
                  <span className="text-[11px] text-[#534ab7] font-semibold">{a.submissionStatus.score} / {a.maxScore}</span>
                </>}
                onClick={() => navigate(`/courses/${a.course.id}/assignments/${a.id}/review`)}
              />
            ))}
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

export default AssignmentList;
