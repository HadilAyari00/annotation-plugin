import React, { useState, useEffect } from "react";

function Modal({ onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default Modal;
