import React from "react";
import { IconAlert, IconXCircle, IconCheckCircle } from "./Icons.jsx";

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-icon">
          <IconAlert size={32} color="var(--accent-color)" />
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={onCancel}>
            <IconXCircle size={16} /> Batal
          </button>
          <button className="btn-modal-confirm" onClick={onConfirm}>
            <IconCheckCircle size={16} /> Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
