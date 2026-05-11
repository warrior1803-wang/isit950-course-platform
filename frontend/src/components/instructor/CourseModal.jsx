import { useState } from 'react';
import PropTypes from 'prop-types';

function FieldWrapper({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-text-muted uppercase tracking-[0.07em]">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[11px] text-[#d85a30] mt-0.5">{error}</span>
      )}
    </div>
  );
}

FieldWrapper.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const inputClass =
  'w-full h-[42px] px-[14px] rounded-[10px] border border-border bg-input-bg text-text-dark text-[13px] font-serif outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 focus:bg-white transition-colors duration-150';

const textareaClass =
  'w-full px-[14px] pt-2.5 rounded-[10px] border border-border bg-input-bg text-text-dark text-[13px] font-serif outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 focus:bg-white transition-colors duration-150 resize-none';

function ButtonSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

export default function CourseModal({ mode, initialData, onClose, onSubmit }) {
  const [fields, setFields] = useState({
    title: initialData?.title || '',
    code: initialData?.code || '',
    session: initialData?.session || '',
    description: initialData?.description || '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  function set(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function validate() {
    const errs = {};
    if (!fields.title.trim()) errs.title = 'This field is required';
    if (!fields.code.trim()) {
      errs.code = 'This field is required';
    } else if (fields.code.trim().length > 10) {
      errs.code = 'Max 10 characters';
    }
    if (!fields.session.trim()) errs.session = 'This field is required';
    if (!fields.description.trim()) errs.description = 'This field is required';
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await onSubmit(fields);
    } finally {
      setIsLoading(false);
    }
  }

  const isCreate = mode === 'create';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-[#1c1028]/45 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      {/* Modal box */}
      <div
        className="bg-light rounded-2xl w-full max-w-[480px] shadow-[0_24px_80px_rgba(28,16,20,0.22)] overflow-hidden font-serif"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <span className="text-[17px] text-text-dark">
            {isCreate ? 'Create new course' : 'Edit course'}
          </span>
          <button
            className="w-8 h-8 border-none bg-transparent cursor-pointer flex items-center justify-center text-text-muted rounded-md hover:bg-accent/10 transition-colors duration-150"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-symbols-rounded text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-[18px] pb-6 flex flex-col gap-[14px]">
          {/* Course name */}
          <FieldWrapper label="Course name" error={errors.title}>
            <input
              className={inputClass}
              placeholder="e.g. Advanced Software Engineering"
              value={fields.title}
              onChange={e => set('title', e.target.value)}
            />
          </FieldWrapper>

          {/* Code + Session — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="Course code" error={errors.code}>
              <input
                className={inputClass}
                placeholder="e.g. ISIT999"
                value={fields.code}
                onChange={e => set('code', e.target.value)}
                maxLength={15}
              />
            </FieldWrapper>
            <FieldWrapper label="Session" error={errors.session}>
              <input
                className={inputClass}
                placeholder="e.g. Autumn 2026"
                value={fields.session}
                onChange={e => set('session', e.target.value)}
              />
            </FieldWrapper>
          </div>

          {/* Description */}
          <FieldWrapper label="Description" error={errors.description}>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Brief course overview…"
              value={fields.description}
              onChange={e => set('description', e.target.value)}
            />
          </FieldWrapper>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-2.5">
          <button
            className="border border-border rounded-[10px] h-10 px-4 text-[13px] text-text-muted bg-transparent hover:bg-accent/10 font-serif cursor-pointer transition-colors duration-150"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="bg-btn text-light rounded-[10px] h-10 px-4 text-[13px] flex items-center gap-1.5 font-serif cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity duration-150"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ButtonSpinner />
            ) : (
              <>
                <span className="material-symbols-rounded text-base">
                  {isCreate ? 'add' : 'check_circle'}
                </span>
                {isCreate ? 'Create course' : 'Save changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

CourseModal.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialData: PropTypes.shape({
    title: PropTypes.string,
    code: PropTypes.string,
    session: PropTypes.string,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
