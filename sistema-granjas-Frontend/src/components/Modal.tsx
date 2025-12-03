import React from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, width = "max-w-md" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white p-6 rounded-lg w-full ${width}`}>
                <div className="flex justify-end mb-2">
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
