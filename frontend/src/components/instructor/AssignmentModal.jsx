import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const inputClass =
  'w-full h-[42px] px-[14px] rounded-[10px] border border-border bg-input-bg text-text-dark text-[13px] font-serif outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 focus:bg-white transition-colors duration-150';

const textareaClass =
  'w-full px-[14px] pt-2.5 rounded-[10px] border border-border bg-input-bg text-text-dark text-[13px] font-serif outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 focus:bg-white transition-colors duration-150 resize-none';

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-text-muted uppercase tracking-[0.07em]">
        {label}
      </label>
      {children}
      {error && <span className="text-[11px] text-[#d85a30] mt-0.5">{error}</span>}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function createQuestion(index = 0) {
  return {
    id: `q-${Date.now()}-${index}`,
    type: 'MCQ',
    text: '',
    points: 1,
    options: ['', '', '', ''],
    correctOption: 0,
    correctAnswer: '',
  };
}

function normalizeQuestion(question, index) {
  const type = String(question?.type || 'MCQ').toUpperCase();
  return {
    id: question?.id || `q-${Date.now()}-${index}`,
    type: ['MCQ', 'FILLIN', 'UNIQUE'].includes(type) ? type : 'MCQ',
    text: question?.text || '',
    points: Number(question?.points) || 1,
    options: Array.isArray(question?.options) && question.options.length >= 2
      ? question.options
      : ['', '', '', ''],
    correctOption: Number.isInteger(question?.correctOption) ? question.correctOption : 0,
    correctAnswer: question?.correctAnswer || '',
  };
}

function buildQuestionPayload(question) {
  const base = {
    id: String(question.id),
    type: question.type,
    text: question.text.trim(),
    points: Number(question.points) || 1,
  };
  if (question.type === 'MCQ') {
    return {
      ...base,
      options: question.options.map(option => option.trim()),
      correctOption: Number(question.correctOption) || 0,
    };
  }
  return {
    ...base,
    correctAnswer: question.correctAnswer.trim(),
  };
}

export default function AssignmentModal({ mode, initialData, isLoadingDetail, onClose, onSubmit }) {
  const [fields, setFields] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: '',
    type: 'FILE',
    fileSizeLimitMb: '50',
    questions: [createQuestion(0)],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    const nextType = String(initialData.type || 'FILE').toUpperCase() === 'AUTO' ? 'AUTO' : 'FILE';
    setFields({
      title: initialData.title || '',
      description: initialData.description || '',
      dueDate: toDateTimeLocal(initialData.dueDate),
      maxScore: initialData.maxScore ?? '',
      type: nextType,
      fileSizeLimitMb: '50',
      questions: Array.isArray(initialData.questions) && initialData.questions.length > 0
        ? initialData.questions.map(normalizeQuestion)
        : [createQuestion(0)],
    });
  }, [initialData]);

  function setField(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function setType(type) {
    setFields(prev => ({
      ...prev,
      type,
      questions: prev.questions.length > 0 ? prev.questions : [createQuestion(0)],
    }));
  }

  function updateQuestion(index, patch) {
    setFields(prev => ({
      ...prev,
      questions: prev.questions.map((question, i) => (
        i === index ? { ...question, ...patch } : question
      )),
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    setFields(prev => ({
      ...prev,
      questions: prev.questions.map((question, i) => {
        if (i !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, j) => (j === optionIndex ? value : option)),
        };
      }),
    }));
  }

  function addQuestion() {
    setFields(prev => ({
      ...prev,
      questions: [...prev.questions, createQuestion(prev.questions.length)],
    }));
  }

  function removeQuestion(index) {
    setFields(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function addOption(questionIndex) {
    setFields(prev => ({
      ...prev,
      questions: prev.questions.map((question, i) => {
        if (i !== questionIndex || question.options.length >= 6) return question;
        return { ...question, options: [...question.options, ''] };
      }),
    }));
  }

  function removeOption(questionIndex, optionIndex) {
    setFields(prev => ({
      ...prev,
      questions: prev.questions.map((question, i) => {
        if (i !== questionIndex || question.options.length <= 2) return question;
        const nextOptions = question.options.filter((_, j) => j !== optionIndex);
        const nextCorrect = Math.min(question.correctOption, nextOptions.length - 1);
        return { ...question, options: nextOptions, correctOption: nextCorrect };
      }),
    }));
  }

  function validate() {
    const nextErrors = {};
    if (!fields.title.trim()) nextErrors.title = 'This field is required';
    if (!fields.description.trim()) nextErrors.description = 'This field is required';
    if (!fields.dueDate || !toIsoDate(fields.dueDate)) nextErrors.dueDate = 'Choose a valid due date';
    if (!fields.maxScore || Number(fields.maxScore) < 1) nextErrors.maxScore = 'Enter at least 1 mark';
    if (fields.type === 'FILE' && (!fields.fileSizeLimitMb || Number(fields.fileSizeLimitMb) < 1)) {
      nextErrors.fileSizeLimitMb = 'Enter at least 1 MB';
    }
    if (fields.type === 'AUTO') {
      if (fields.questions.length === 0) {
        nextErrors.questions = 'Add at least one question';
      }
      fields.questions.forEach((question, index) => {
        if (!question.text.trim()) nextErrors[`q-${index}-text`] = 'Required';
        if (!question.points || Number(question.points) < 1) nextErrors[`q-${index}-points`] = 'Min 1';
        if (question.type === 'MCQ') {
          if (question.options.some(option => !option.trim())) {
            nextErrors[`q-${index}-options`] = 'All options need text';
          }
        } else if (!question.correctAnswer.trim()) {
          nextErrors[`q-${index}-answer`] = 'Required';
        }
      });
    }
    return nextErrors;
  }

  async function handleSubmit() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = {
        title: fields.title.trim(),
        description: fields.description.trim(),
        dueDate: toIsoDate(fields.dueDate),
        maxScore: Number(fields.maxScore),
        type: fields.type,
      };
      if (fields.type === 'AUTO') {
        payload.questions = fields.questions.map(buildQuestionPayload);
      }
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCreate = mode === 'create';
  const disabled = isSubmitting || isLoadingDetail;

  return (
    <div
      className="fixed inset-0 bg-[#1c1028]/45 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-light rounded-2xl w-full max-w-[580px] max-h-[90vh] overflow-y-auto shadow-[0_24px_80px_rgba(28,16,20,0.22)] font-serif"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <span className="text-[17px] text-text-dark">
            {isCreate ? 'Create new assignment' : 'Edit assignment'}
          </span>
          <button
            className="w-8 h-8 border-none bg-transparent cursor-pointer flex items-center justify-center text-text-muted rounded-md hover:bg-accent/10 transition-colors duration-150"
            onClick={onClose}
            disabled={disabled}
            aria-label="Close"
          >
            <span className="material-symbols-rounded text-base">close</span>
          </button>
        </div>

        <div className="px-6 pt-[18px] pb-6 flex flex-col gap-[14px]">
          {isLoadingDetail ? (
            <div className="bg-input-bg rounded-xl border border-border p-5 text-sm text-text-muted">
              Loading assignment...
            </div>
          ) : (
            <>
              <Field label="Title" error={errors.title}>
                <input
                  className={inputClass}
                  placeholder="e.g. Week 9 Quiz - Scrum and Agile"
                  value={fields.title}
                  onChange={e => setField('title', e.target.value)}
                  disabled={disabled}
                />
              </Field>

              <Field label="Description" error={errors.description}>
                <textarea
                  className={textareaClass}
                  rows={3}
                  placeholder="Instructions for students..."
                  value={fields.description}
                  onChange={e => setField('description', e.target.value)}
                  disabled={disabled}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Due date" error={errors.dueDate}>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={fields.dueDate}
                    onChange={e => setField('dueDate', e.target.value)}
                    disabled={disabled}
                  />
                </Field>
                <Field label="Max score" error={errors.maxScore}>
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    placeholder="e.g. 20"
                    value={fields.maxScore}
                    onChange={e => setField('maxScore', e.target.value)}
                    disabled={disabled}
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-text-muted uppercase tracking-[0.07em]">
                  Assignment type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'FILE', icon: 'upload_file', label: 'File Upload' },
                    { value: 'AUTO', icon: 'auto_fix_high', label: 'Auto-Mark' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-[10px] border h-[58px] text-[12px] flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                        fields.type === option.value
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-input-bg text-text-muted hover:border-accent'
                      }`}
                      onClick={() => setType(option.value)}
                      disabled={disabled}
                    >
                      <span className="material-symbols-rounded text-base">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {fields.type === 'FILE' ? (
                <Field label="File size limit" error={errors.fileSizeLimitMb}>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={fields.fileSizeLimitMb}
                      onChange={e => setField('fileSizeLimitMb', e.target.value)}
                      disabled={disabled}
                    />
                    <span className="text-xs text-text-muted">MB</span>
                  </div>
                </Field>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-text-muted uppercase tracking-[0.07em]">
                      Questions
                    </label>
                    <span className="text-[10px] text-[#534ab7] bg-[#534ab7]/10 border border-[#534ab7]/20 rounded-full px-2 py-1">
                      {fields.questions.length} {fields.questions.length === 1 ? 'question' : 'questions'}
                    </span>
                  </div>
                  {errors.questions && (
                    <span className="text-[11px] text-[#d85a30]">{errors.questions}</span>
                  )}
                  {fields.questions.map((question, index) => (
                    <div key={question.id} className="question-editor">
                      <div className="qe-header">
                        <span className="qe-num">Q{index + 1}</span>
                        <select
                          className="qe-type-select"
                          value={question.type}
                          onChange={e => updateQuestion(index, {
                            type: e.target.value,
                            correctAnswer: '',
                            correctOption: 0,
                          })}
                          disabled={disabled}
                        >
                          <option value="MCQ">Multiple choice</option>
                          <option value="FILLIN">Fill in blank</option>
                          <option value="UNIQUE">Unique answer</option>
                        </select>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            className="qe-option-input w-16"
                            value={question.points}
                            onChange={e => updateQuestion(index, { points: e.target.value })}
                            disabled={disabled}
                            aria-label={`Question ${index + 1} points`}
                          />
                          <span className="qe-num">pts</span>
                          <button
                            type="button"
                            className="qe-remove"
                            onClick={() => removeQuestion(index)}
                            disabled={disabled || fields.questions.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="qe-body">
                        {errors[`q-${index}-points`] && (
                          <span className="text-[11px] text-[#d85a30] block mb-2">
                            Points: {errors[`q-${index}-points`]}
                          </span>
                        )}
                        <div>
                          <div className="qe-field-label">Question text</div>
                          <textarea
                            className="qe-text-input"
                            rows={2}
                            placeholder="Enter question..."
                            value={question.text}
                            onChange={e => updateQuestion(index, { text: e.target.value })}
                            disabled={disabled}
                          />
                          {errors[`q-${index}-text`] && (
                            <span className="text-[11px] text-[#d85a30] mt-0.5">
                              {errors[`q-${index}-text`]}
                            </span>
                          )}
                        </div>
                        {question.type === 'MCQ' ? (
                          <div>
                            <div className="qe-field-label">Options</div>
                            <div className="qe-options">
                            {question.options.map((option, optionIndex) => (
                              <div key={`${question.id}-${optionIndex}`} className="qe-option-row">
                                <input
                                  type="radio"
                                  className="qe-option-radio"
                                  checked={question.correctOption === optionIndex}
                                  onChange={() => updateQuestion(index, { correctOption: optionIndex })}
                                  disabled={disabled}
                                  aria-label={`Mark option ${optionIndex + 1} correct`}
                                />
                                <input
                                  className="qe-option-input"
                                  placeholder={`Option ${optionIndex + 1}`}
                                  value={option}
                                  onChange={e => updateOption(index, optionIndex, e.target.value)}
                                  disabled={disabled}
                                />
                                <button
                                  type="button"
                                  className="qe-remove"
                                  onClick={() => removeOption(index, optionIndex)}
                                  disabled={disabled || question.options.length <= 2}
                                  aria-label={`Remove option ${optionIndex + 1}`}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            </div>
                            {errors[`q-${index}-options`] && (
                              <span className="text-[11px] text-[#d85a30]">
                                {errors[`q-${index}-options`]}
                              </span>
                            )}
                            {question.options.length < 6 && (
                              <button
                                type="button"
                                className="qe-remove"
                                onClick={() => addOption(index)}
                                disabled={disabled}
                              >
                                + Add option
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="qe-field-label">Correct answer</div>
                              <input
                                className="qe-text-input"
                                placeholder={question.type === 'FILLIN'
                                  ? 'Exact text students must enter'
                                  : 'Unique correct answer'}
                                value={question.correctAnswer}
                                onChange={e => updateQuestion(index, { correctAnswer: e.target.value })}
                                disabled={disabled}
                              />
                            {errors[`q-${index}-answer`] && (
                              <span className="text-[11px] text-[#d85a30] mt-0.5">
                                {errors[`q-${index}-answer`]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-question-btn"
                    onClick={addQuestion}
                    disabled={disabled}
                  >
                    <span className="material-symbols-rounded text-base">add_circle</span>
                    Add question
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end gap-2.5">
          <button
            className="border border-border rounded-[10px] h-10 px-4 text-[13px] text-text-muted bg-transparent hover:bg-accent/10 font-serif cursor-pointer transition-colors duration-150 disabled:opacity-50"
            onClick={onClose}
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            className="bg-btn text-light rounded-[10px] h-10 px-4 text-[13px] flex items-center gap-1.5 font-serif cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity duration-150"
            onClick={handleSubmit}
            disabled={disabled}
          >
            {isSubmitting ? (
              <span className="material-symbols-rounded text-base animate-spin">
                progress_activity
              </span>
            ) : (
              <>
                <span className="material-symbols-rounded text-base">
                  {isCreate ? 'add' : 'check_circle'}
                </span>
                {isCreate ? 'Create assignment' : 'Save changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

AssignmentModal.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    dueDate: PropTypes.string,
    maxScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    questions: PropTypes.arrayOf(PropTypes.shape({})),
  }),
  isLoadingDetail: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

AssignmentModal.defaultProps = {
  initialData: null,
  isLoadingDetail: false,
};
