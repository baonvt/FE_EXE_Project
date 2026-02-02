import React, { useEffect } from 'react';

// Minimal Toast component used by ToastContext.
// Props:
// - message: string
// - type: 'info'|'success'|'error'|'warning'
// - duration: ms before auto-dismiss
// - onClose: callback when toast should be removed

export default function Toast({ message, type = 'info', duration = 4000, onClose }) {
  useEffect(() => {
    if (!duration || duration <= 0) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return { background: '#EDF7ED', borderColor: '#4CAF50', color: '#2E7D32' };
      case 'error':
        return { background: '#FDECEA', borderColor: '#F44336', color: '#C62828' };
      case 'warning':
        return { background: '#FFF8E1', borderColor: '#FFB300', color: '#FF8F00' };
      default:
        return { background: '#E8F0FE', borderColor: '#2196F3', color: '#1565C0' };
    }
  };

  const style = {
    padding: '10px 14px',
    marginBottom: '8px',
    border: '1px solid',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '200px',
    maxWidth: '360px',
    ...getStyle()
  };

  return (
    <div className="toast" style={style} role="status" aria-live="polite">
      <div style={{ flex: 1, paddingRight: 8 }}>{message}</div>
      <button
        onClick={() => onClose && onClose()}
        aria-label="Close"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>
  );
}
