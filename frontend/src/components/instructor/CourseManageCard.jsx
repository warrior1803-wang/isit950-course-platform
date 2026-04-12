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

function MaterialItem({ material, onDelete }) {
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
        aria-label="Delete material"
      >
        <span className="material-symbols-rounded text-base">delete</span>
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
};

function UploadStrip({ onUpload }) {
  return (
    <div
      className="flex items-center justify-center gap-2.5 p-4 border border-dashed border-border rounded-[10px] cursor-pointer text-text-muted text-[12px] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors duration-150"
      onClick={onUpload}
    >
      <span className="material-symbols-rounded text-base">cloud_upload</span>
      Drop files here or browse to upload
    </div>
  );
}

UploadStrip.propTypes = {
  onUpload: PropTypes.func.isRequired,
};

export default function CourseManageCard({ course, materials, onEdit, onUpload, onDeleteMaterial }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
          {materials.length > 0 && materials.map(m => (
            <MaterialItem
              key={m.id}
              material={m}
              onDelete={onDeleteMaterial}
            />
          ))}
          <UploadStrip onUpload={onUpload} />
        </div>
      )}
    </div>
  );
}

CourseManageCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
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
  onEdit: PropTypes.func,
  onUpload: PropTypes.func,
  onDeleteMaterial: PropTypes.func,
};

CourseManageCard.defaultProps = {
  materials: [],
};
