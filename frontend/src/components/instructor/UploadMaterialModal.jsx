import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const VALID_EXTS = ['pdf', 'docx', 'zip', 'png', 'jpg', 'jpeg'];

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

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputClass =
  'w-full h-[42px] px-[14px] rounded-[10px] border border-border bg-input-bg text-text-dark text-[13px] font-serif outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 focus:bg-white transition-colors duration-150';

export default function UploadMaterialModal({ courseId, onClose, onUploadSuccess }) {
  const [section, setSection] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  function pickFile(picked) {
    if (!picked) return;
    const ext = getExt(picked.name);
    if (!VALID_EXTS.includes(ext)) {
      setFileError('Only PDF, DOCX, ZIP, PNG, JPG files are accepted');
      return;
    }
    setFileError('');
    setFile(picked);
  }

  function handleZoneClick() {
    if (!isUploading) fileInputRef.current?.click();
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!section.trim()) { setSectionError('This field is required'); return; }
    if (!file) { setFileError('Please select a file'); return; }

    setIsUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => (p < 85 ? p + 7 : p));
    }, 120);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', section);

      const res = await fetch(`/api/courses/${courseId}/materials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload failed');

      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        onUploadSuccess({
          id: json.data.id,
          filename: json.data.filename,
          section: json.data.section,
          url: json.data.url,
          size: json.data.size,
          uploadedAt: new Date(json.data.uploadedAt).toLocaleDateString('en-AU'),
        });
      }, 300);
    } catch (err) {
      clearInterval(interval);
      setIsUploading(false);
      setProgress(0);
      setFileError(err.message);
    }
  }

  const { icon: fileIcon, colorClass: fileColor } = file ? getFileIcon(file.name) : {};

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1c1028]/45 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-light rounded-2xl w-full max-w-[480px] overflow-hidden font-serif shadow-[0_24px_80px_rgba(28,16,20,0.22)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <span className="text-[17px] text-text-dark">Upload material</span>
          <button
            className="w-8 h-8 bg-transparent border-none cursor-pointer flex items-center justify-center text-text-muted rounded-md hover:bg-accent/10 transition-colors duration-150"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close"
          >
            <span className="material-symbols-rounded text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-[18px] pb-0 flex flex-col gap-[14px]">
          {/* Section field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-text-muted uppercase tracking-[0.07em]">
              Section
            </label>
            <input
              className={inputClass}
              placeholder="e.g. Week 3 — UML"
              value={section}
              onChange={e => setSection(e.target.value)}
              disabled={isUploading}
            />
            {sectionError && (
              <span className="text-[11px] text-[#d85a30] mt-0.5">{sectionError}</span>
            )}
          </div>

          {/* Upload zone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-text-muted uppercase tracking-[0.07em]">
              File
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.zip,.png,.jpg,.jpeg"
              className="hidden"
              onChange={e => { pickFile(e.target.files[0]); e.target.value = ''; }}
            />

            {file ? (
              /* File preview row */
              <>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${fileColor}`}
                  >
                    <span className="material-symbols-rounded text-base">{fileIcon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-text-dark truncate">{file.name}</p>
                    <p className="text-[11px] text-text-muted">{formatSize(file.size)}</p>
                  </div>
                  <button
                    className="w-7 h-7 rounded-md bg-transparent border-none cursor-pointer text-text-muted hover:text-[#d85a30] hover:bg-[#d85a30]/10 transition-colors duration-150 flex items-center justify-center"
                    onClick={() => { setFile(null); setFileError(''); }}
                    disabled={isUploading}
                    aria-label="Remove file"
                  >
                    <span className="material-symbols-rounded text-base">close</span>
                  </button>
                </div>

                {/* Progress bar — shown only while uploading */}
                {isUploading && (
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Drop zone */
              <div
                className={`border-2 border-dashed rounded-xl p-9 text-center cursor-pointer transition-colors duration-150 bg-input-bg
                  ${isDragging
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent hover:bg-accent/5'
                  }`}
                onClick={handleZoneClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <span
                  className="material-symbols-rounded text-text-muted block mb-2.5"
                  style={{ fontSize: 36 }}
                >
                  cloud_upload
                </span>
                <p className="text-sm text-text-dark mb-1">
                  Drag and drop your file here
                </p>
                <p className="text-xs text-text-muted">
                  or{' '}
                  <span className="text-accent cursor-pointer">browse to upload</span>
                  {' '}· PDF, DOCX, ZIP, PNG, JPG up to 50 MB
                </p>
              </div>
            )}

            {fileError && (
              <span className="text-[11px] text-[#d85a30] mt-1">{fileError}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex justify-end gap-2.5">
          <button
            className="border border-border rounded-[10px] h-10 px-4 text-[13px] text-text-muted bg-transparent hover:bg-accent/10 font-serif cursor-pointer transition-colors duration-150 disabled:opacity-50"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            className="bg-btn text-light rounded-[10px] h-10 px-4 text-[13px] flex items-center gap-1.5 font-serif cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity duration-150"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="material-symbols-rounded text-base animate-spin">
                  progress_activity
                </span>
                Uploading…
              </>
            ) : (
              <>
                <span className="material-symbols-rounded text-base">upload</span>
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

UploadMaterialModal.propTypes = {
  courseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func.isRequired,
  onUploadSuccess: PropTypes.func.isRequired,
};
