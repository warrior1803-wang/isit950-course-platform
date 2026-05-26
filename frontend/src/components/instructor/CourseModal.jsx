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

const FIELD_LIMITS = {
  title: 100,
  code: 15,
  session: 20,
  location: 100,
  description: 500,
};

const LENGTH_MESSAGES = {
  title: 'Course name must be 100 characters or fewer',
  code: 'Course code must be 15 characters or fewer',
  session: 'Session must be 20 characters or fewer',
  location: 'Location must be 100 characters or fewer',
  description: 'Description must be 500 characters or fewer',
};

export default function CourseModal({ mode, initialData, onClose, onSubmit }) {
  const initialFields = {
    title: initialData?.title || '',
    code: initialData?.code || '',
    session: initialData?.session || '',
    location: initialData?.location || '',
    description: initialData?.description || '',
  };
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState(() => validate(initialFields));
  const [isLoading, setIsLoading] = useState(false);

  function setLengthError(key, value) {
    const message = LENGTH_MESSAGES[key];
    const limit = FIELD_LIMITS[key];

    setErrors(prev => {
      const hasError = value.length > limit;
      if (hasError) {
        return { ...prev, [key]: message };
      }
      if (prev[key] !== message) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function set(key, value) {
    const nextFields = { ...fields, [key]: value };
    setFields(nextFields);
    if (errors[key]) {
      setErrors(validate(nextFields));
    } else if (Object.prototype.hasOwnProperty.call(FIELD_LIMITS, key)) {
      setLengthError(key, value);
    }
  }

  function validate(nextFields = fields) {
    const errs = {};
    if (!nextFields.title.trim()) {
      errs.title = 'This field is required';
    } else if (nextFields.title.length > FIELD_LIMITS.title) {
      errs.title = LENGTH_MESSAGES.title;
    }
    if (!nextFields.code.trim()) {
      errs.code = 'This field is required';
    } else if (nextFields.code.length > FIELD_LIMITS.code) {
      errs.code = LENGTH_MESSAGES.code;
    }
    if (!nextFields.session.trim()) {
      errs.session = 'This field is required';
    } else if (nextFields.session.length > FIELD_LIMITS.session) {
      errs.session = LENGTH_MESSAGES.session;
    }
    if (!nextFields.description.trim()) {
      errs.description = 'This field is required';
    } else if (nextFields.description.length > FIELD_LIMITS.description) {
      errs.description = LENGTH_MESSAGES.description;
    }
    if (nextFields.location.length > FIELD_LIMITS.location) {
      errs.location = LENGTH_MESSAGES.location;
    }
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
  const hasLengthError = Object.entries(FIELD_LIMITS).some(
    ([key, limit]) => fields[key].length > limit,
  );

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
              maxLength={FIELD_LIMITS.title}
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
                maxLength={FIELD_LIMITS.code}
              />
            </FieldWrapper>
            <FieldWrapper label="Session" error={errors.session}>
              <input
                className={inputClass}
                placeholder="e.g. Autumn 2026"
                value={fields.session}
                onChange={e => set('session', e.target.value)}
                maxLength={FIELD_LIMITS.session}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Location" error={errors.location}>
            <input
              className={inputClass}
              placeholder="e.g. Building 11, Room 205"
              value={fields.location}
              onChange={e => set('location', e.target.value)}
              maxLength={FIELD_LIMITS.location}
            />
          </FieldWrapper>

          {/* Description */}
          <FieldWrapper label="Description" error={errors.description}>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Brief course overview…"
              value={fields.description}
              onChange={e => set('description', e.target.value)}
              maxLength={FIELD_LIMITS.description}
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
            disabled={isLoading || hasLengthError}
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
    location: PropTypes.string,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
