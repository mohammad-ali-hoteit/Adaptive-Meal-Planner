import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px', border: '1px solid var(--color-border)' }}>
        <div style={{ marginBottom: '24px', color: 'var(--color-red)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>warning</span>
        </div>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text)', fontSize: '20px' }}>{title}</h3>
        <p style={{ margin: '0 0 32px 0', color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-outline" 
            style={{ flex: 1, padding: '12px', fontSize: '16px', fontWeight: 'bold' }} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1, padding: '12px', fontSize: '16px', fontWeight: 'bold', background: 'var(--color-red)', borderColor: 'var(--color-red)', color: 'white' }} 
            onClick={() => { onConfirm(); onClose(); }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
