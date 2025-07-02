import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/ConfirmationModal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  variant?: 'danger' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  icon = '⚠',
  variant = 'danger',
}) => {
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-content ${variant}`}>
        <div className={`modal-header ${variant}`}>
          <div className={`modal-icon-container ${variant}`}>
            <span className="modal-icon">{icon}</span>
          </div>
          <h3 className={`modal-title ${variant}`}>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button cancel" onClick={onClose}>
            {cancelText || t('cancel') || 'Cancel'}
          </button>
          <button className={`modal-button confirm ${variant}`} onClick={onConfirm}>
            {confirmText || t('confirm') || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 