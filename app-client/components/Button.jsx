import React from 'react';
import styles from './Button.module.scss';

function Button({ variant = 'primary', size = 'md', disabled = false, loading = false, children, className = '', ...props }) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? <span className={styles.spinner}></span> : children}
    </button>
  );
}

export default Button;
