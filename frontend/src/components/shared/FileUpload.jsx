import { useRef, useState } from 'react';

const ALLOWED_EXTENSIONS = ['pdf', 'docx'];

const FILE_ICON = {
  pdf:  { icon: 'picture_as_pdf', color: '#d85a30' },
  docx: { icon: 'description',    color: '#185fa5' },
  doc:  { icon: 'description',    color: '#185fa5' },
};

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drag-and-drop / click-to-upload component.
 *
 * Props:
 *   value      File | null          — controlled selected file
 *   onChange   (file: File|null) => void
 *   error      string | undefined   — external validation error to display
 *   maxSizeMB  number               — max file size in MB (default 50)
 *   accept     string               — MIME accept string (default '.pdf,.docx')
 */
export default function FileUpload({
  value,
  onChange,
  error,
  maxSizeMB = 50,
  accept = '.pdf,.docx',
}) {
  const inputRef   = useRef(null);
  const [dragover, setDragover] = useState(false);
  const [sizeError, setSizeError] = useState('');

  function processFile(file) {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setSizeError('Only PDF or DOCX files are allowed.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setSizeError(`File must be smaller than ${maxSizeMB} MB.`);
      return;
    }

    setSizeError('');
    onChange(file);
  }

  function handleInputChange(e) {
    processFile(e.target.files[0] ?? null);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragover(true);
  }

  function handleDragLeave() {
    setDragover(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    processFile(e.dataTransfer.files[0] ?? null);
  }

  function handleRemove() {
    onChange(null);
    setSizeError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const combinedError = sizeError || error;
  const ext = value ? value.name.split('.').pop().toLowerCase() : null;
  const iconInfo = ext ? (FILE_ICON[ext] ?? FILE_ICON.docx) : null;

  return (
    <div>
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {!value ? (
        /* ── Drop zone ── */
        <div
          className={`ccp-upload-zone${dragover ? ' dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="material-symbols-rounded ccp-upload-zone-icon">upload_file</span>
          <div className="ccp-upload-zone-title">Drag and drop your file here</div>
          <div className="ccp-upload-zone-sub">
            or <span onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>browse to upload</span>
            {' '}· PDF, DOCX up to {maxSizeMB} MB
          </div>
        </div>
      ) : (
        /* ── Selected file ── */
        <div className="ccp-file-list">
          <div className="ccp-file-item">
            <div className="ccp-file-item-icon" style={{ color: iconInfo?.color }}>
              <span className="material-symbols-rounded">{iconInfo?.icon}</span>
            </div>
            <div className="ccp-file-item-info">
              <div className="ccp-file-item-name">{value.name}</div>
              <div className="ccp-file-item-size">{formatSize(value.size)} · Ready to submit</div>
            </div>
            <button
              type="button"
              className="ccp-file-item-remove"
              onClick={handleRemove}
              aria-label="Remove file"
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>
      )}

      {combinedError && (
        <span className="auth-field-error">{combinedError}</span>
      )}
    </div>
  );
}
