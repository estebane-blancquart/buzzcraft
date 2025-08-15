import React from 'react';
import styles from './Input.module.scss';

function Input({ label, error, required, className = '', ...props }) {
  const inputClasses = [
    styles.input,
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
}

export default Input;
