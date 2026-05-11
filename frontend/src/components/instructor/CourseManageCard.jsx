import { useState } from 'react';
import PropTypes from 'prop-types';

function getExt(filename) {
  return filename.split('.').pop().toLowerCase();
}

function getFileIcon(filename) {
  const ext = getExt(filename);
  if (ext === 'pdf')
    return { icon: 'picture_as_pdf', colorClass: 'bg-[#d85a30]/10 text-[#d85a30]' };
  if (ext === 'docx' || ext === 'doc')
    return { icon: 'description', colorClass: 'bg-[#185fa5]/10 text-[#185fa5]' };
  if (ext === 'zip')
    return { icon: 'folder_zip', colorClass: 'bg-[#534ab7]/10 text-[#534ab7]' };
  if (['png', 'jpg', 'jpeg'].includes(ext))
    return { icon: 'image', colorClass: 'bg-accent/15 text-accent' };
  return { icon: 'description', colorClass: 'bg-border text-text-muted' };
}

function formatAssignmentDate(value) {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function groupMaterialsBySection(materials) {
  return materials.reduce((groups, material) => {
    const section = material.section || 'Unsectioned';
    if (!groups[section]) groups[section] = [];
    groups[section].push(material);
    return groups;
  }, {});
}

function CourseThumbnail({ thumbnailUrl }) {
  if (thumbnailUrl) {
    return (
      <div
        className="w-[68px] h-[68px] rounded-xl flex-shrink-0 bg-cover bg-center mr-4"
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />
    );
  }
  return (
    <div className="w-[68px] h-[68px] rounded-xl flex-shrink-0 bg-accent/20 mr-4 flex items-center justify-center">
      <span className="material-symbols-rounded text-accent" style={{ fontSize: 28 }}>
        menu_book
      </span>
    </div>
  );
}

CourseThumbnail.propTypes = {
  thumbnailUrl: PropTypes.string,
};

function MaterialItem({ material, onDelete, deleting }) {
  const { icon, colorClass } = getFileIcon(material.filename);
  return (
    <div className="flex items-center gap-2.5 py-[9px] px-3 rounded-lg border border-border bg-white">
      <div
        className={`w-[30px] h-[30px] rounded-md flex items-center justify-center flex-shrink-0 ${colorClass}`}
      >
        <span className="material-symbols-rounded text-base">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-text-dark truncate">{material.filename}</p>
        <p className="text-[10px] text-text-muted">
          {material.section} · {material.uploadedAt}
        </p>
      </div>
      <button
        className="w-7 h-7 rounded-md bg-transparent border-none cursor-pointer text-text-muted hover:text-[#d85a30] hover:bg-[#d85a30]/10 transition-colors duration-150 flex items-center justify-center"
        title="Delete material"
        onClick={() => onDelete(material.id)}
        disabled={deleting}
        aria-label="Delete material"
      >
        {deleting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <span className="material-symbols-rounded text-base">delete</span>
        )}
      </button>
    </div>
  );
}

MaterialItem.propTypes = {
  material: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    filename: PropTypes.string.isRequired,
    section: PropTypes.string.isRequired,
    uploadedAt: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
};

MaterialItem.defaultProps = {
  deleting: false,
};

function SectionUploadButton({ onUpload }) {
  return (
    <button
      type="button"
      className="h-[30px] px-3 rounded-[10px] border border-border bg-transparent text-[11px] text-text-muted flex items-center gap-1.5 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-150"
      onClick={onUpload}
    >
      <span className="material-symbols-rounded text-[15px]">upload</span>
      Upload
    </button>
  );
}

SectionUploadButton.propTypes = {
  onUpload: PropTypes.func.isRequired,
};

function EmptyUploadStrip({ onUpload }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2.5 p-4 border border-dashed border-border rounded-[10px] cursor-pointer text-text-muted text-[12px] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-150"
      onClick={onUpload}
    >
      <span className="material-symbols-rounded text-base">cloud_upload</span>
      Drop files here or browse to upload
    </button>
  );
}

EmptyUploadStrip.propTypes = {
  onUpload: PropTypes.func.isRequired,
};

function AssignmentItem({ assignment, onEdit }) {
  const isAuto = assignment.type === 'AUTO';
  const meta = [
    isAuto
      ? `${assignment.questionCount ?? assignment.questions?.length ?? 'Auto'} questions`
      : 'File Upload',
    `Due ${formatAssignmentDate(assignment.dueDate)}`,
    assignment.maxScore != null ? `${assignment.maxScore} marks` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="flex items-center gap-3 px-[14px] py-3 border-b border-border last:border-b-0 bg-white">
      <span className={`material-symbols-rounded text-xl ${isAuto ? 'text-[#534ab7]' : 'text-accent'}`}>
        {isAuto ? 'auto_fix_high' : 'assignment'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-dark truncate">
          {assignment.title}
          {isAuto && (
            <span className="ml-1.5 text-[10px] text-[#534ab7] bg-[#534ab7]/10 border border-[#534ab7]/20 rounded-full px-2 py-0.5">
              Auto-Mark
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-muted truncate">{meta}</div>
      </div>
      <button
        type="button"
        className="w-7 h-7 rounded-md bg-transparent border border-border cursor-pointer text-text-muted hover:text-accent hover:bg-accent/10 transition-colors duration-150 flex items-center justify-center"
        title="Edit assignment"
        onClick={() => onEdit(assignment)}
        aria-label={`Edit ${assignment.title}`}
      >
        <span className="material-symbols-rounded text-base">edit</span>
      </button>
    </div>
  );
}

AssignmentItem.propTypes = {
  assignment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    dueDate: PropTypes.string,
    maxScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    questionCount: PropTypes.number,
    questions: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default function CourseManageCard({
  course,
  materials,
  assignments,
  onEdit,
  onViewStudents,
  onUpload,
  onDeleteMaterial,
  deletingMaterialId,
  onNewAssignment,
  onEditAssignment,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const groupedMaterials = groupMaterialsBySection(materials);
  const materialSections = Object.entries(groupedMaterials);

  return (
    <div className="bg-input-bg rounded-2xl border border-border p-5 mb-4">
      {/* Header row */}
      <div className="flex items-start justify-between">
        {/* Thumbnail */}
        <CourseThumbnail thumbnailUrl={course.thumbnailUrl} />

        {/* Centre: title, code/meta, stats */}
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-[17px] text-text-dark mb-1 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-text-muted mb-3">
            {course.code} · {course.meta}
          </p>
          <div className="flex items-center flex-wrap gap-y-1">
            <span className="flex items-center gap-1 text-xs text-text-muted mr-4">
              <span className="material-symbols-rounded text-base">group</span>
              {course.studentCount} students
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted mr-4">
              <span className="material-symbols-rounded text-base">folder_open</span>
              {course.materialCount} materials
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted mr-4">
              <span className="material-symbols-rounded text-base">assignment</span>
              {course.assignmentCount} assignments
            </span>
            {course.pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-[#d85a30]">
                <span className="material-symbols-rounded text-base">assignment_late</span>
                {course.pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            className="w-8 h-8 rounded-lg border border-border bg-transparent flex items-center justify-center cursor-pointer hover:bg-accent/10 text-text-muted"
            title="Edit course"
            onClick={() => onEdit?.(course)}
          >
            <span className="material-symbols-rounded text-base">edit</span>
          </button>
          <button
            className="w-8 h-8 rounded-lg border border-border bg-transparent flex items-center justify-center cursor-pointer hover:bg-accent/10 text-text-muted"
            title="View students"
            onClick={() => onViewStudents?.(course)}
          >
            <span className="material-symbols-rounded text-base">group</span>
          </button>
          <button
            className="w-8 h-8 rounded-lg border border-border bg-transparent flex items-center justify-center cursor-pointer hover:bg-accent/10 text-text-muted"
            title={isExpanded ? 'Collapse' : 'Expand'}
            onClick={() => setIsExpanded(prev => !prev)}
          >
            <span
              className={`material-symbols-rounded text-base transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Expanded area */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
          {materialSections.length > 0 ? (
            materialSections.map(([section, sectionMaterials], index) => (
              <div key={section} className={index > 0 ? 'pt-3 border-t border-border' : ''}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] font-medium text-text-dark">{section}</div>
                  <SectionUploadButton onUpload={() => onUpload?.(section)} />
                </div>
                <div className="flex flex-col gap-2">
                  {sectionMaterials.map(m => (
                    <MaterialItem
                      key={m.id}
                      material={m}
                      onDelete={onDeleteMaterial}
                      deleting={deletingMaterialId === m.id}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyUploadStrip onUpload={() => onUpload?.('')} />
          )}

          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[13px] font-medium text-text-dark">Assignments</div>
              <button
                type="button"
                className="h-[30px] px-3 rounded-[10px] border border-border bg-transparent text-[11px] text-text-muted flex items-center gap-1.5 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-150"
                onClick={() => onNewAssignment?.(course)}
              >
                <span className="material-symbols-rounded text-[15px]">add</span>
                New assignment
              </button>
            </div>
            {assignments.length > 0 ? (
              <div className="border border-border rounded-[10px] overflow-hidden">
                {assignments.map(assignment => (
                  <AssignmentItem
                    key={assignment.id}
                    assignment={assignment}
                    onEdit={onEditAssignment}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-[10px] px-4 py-3 text-[12px] text-text-muted bg-white">
                No assignments yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

CourseManageCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    meta: PropTypes.string.isRequired,
    studentCount: PropTypes.number.isRequired,
    materialCount: PropTypes.number.isRequired,
    assignmentCount: PropTypes.number.isRequired,
    pendingCount: PropTypes.number,
    thumbnailUrl: PropTypes.string,
  }).isRequired,
  materials: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      filename: PropTypes.string.isRequired,
      section: PropTypes.string.isRequired,
      uploadedAt: PropTypes.string.isRequired,
    })
  ),
  assignments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      dueDate: PropTypes.string,
      maxScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
    })
  ),
  onEdit: PropTypes.func,
  onViewStudents: PropTypes.func,
  onUpload: PropTypes.func,
  onDeleteMaterial: PropTypes.func,
  deletingMaterialId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNewAssignment: PropTypes.func,
  onEditAssignment: PropTypes.func,
};

CourseManageCard.defaultProps = {
  materials: [],
  assignments: [],
  deletingMaterialId: null,
};
