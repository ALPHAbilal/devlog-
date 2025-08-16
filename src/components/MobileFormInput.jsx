import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export default function MobileFormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  disabled,
  required,
  autoComplete,
  inputMode,
  pattern,
  minLength,
  maxLength,
  showPasswordToggle = false,
  validateOnBlur = true,
  validationFn
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef(null);

  const hasValue = value && value.length > 0;
  const shouldFloatLabel = isFocused || hasValue;
  const inputType = showPassword ? 'text' : type;

  // Handle validation
  const handleValidation = () => {
    if (!validateOnBlur || !hasBeenTouched) return;

    if (validationFn) {
      const validationResult = validationFn(value);
      if (validationResult !== true) {
        setLocalError(validationResult);
      } else {
        setLocalError('');
      }
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    // Haptic feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
    handleValidation();
  };

  // Handle change
  const handleChange = (e) => {
    onChange(e.target.value);
    // Clear error on change
    if (localError) {
      setLocalError('');
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Keep focus on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Haptic feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const displayError = error || localError;

  return (
    <div className={`mobile-form-input ${isFocused ? 'focused' : ''} ${displayError ? 'error' : ''} ${success ? 'success' : ''} ${disabled ? 'disabled' : ''}`}>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={isFocused ? placeholder : ''}
          className="form-input"
          aria-label={label}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${id}-error` : undefined}
        />

        {/* Floating label */}
        <label 
          htmlFor={id} 
          className={`floating-label ${shouldFloatLabel ? 'float' : ''}`}
        >
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>

        {/* Field icons */}
        <div className="field-icons">
          {/* Password toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              className="icon-button"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}

          {/* Status icons */}
          {displayError && <X size={20} className="status-icon error" />}
          {success && !displayError && <Check size={20} className="status-icon success" />}
        </div>

        {/* Focus indicator line */}
        <div className="focus-line" />
      </div>

      {/* Helper text / Error message */}
      {displayError && (
        <div id={`${id}-error`} className="field-message error" role="alert">
          {displayError}
        </div>
      )}

      {/* Character counter */}
      {maxLength && (
        <div className="character-counter">
          <span className={value.length > maxLength * 0.9 ? 'warning' : ''}>
            {value.length}
          </span>
          /{maxLength}
        </div>
      )}
    </div>
  );
}