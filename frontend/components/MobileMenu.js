import { useState } from 'react';

export default function MobileMenu({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl overflow-y-auto">
        <div className="p-4">
          <button
            onClick={onClose}
            className="mb-4 text-gray-500 hover:text-gray-700"
          >
            ✕ Close
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
