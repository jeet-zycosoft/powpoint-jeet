'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import PopupModal from '../components/PopupModal';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    const showModal = useCallback((config) => {
        setModalConfig(config);
    }, []);

    const hideModal = useCallback(() => {
        if (modalConfig?.onClose) {
            try {
                modalConfig.onClose();
            } catch (err) {
                console.error('Error in popup modal onClose callback:', err);
            }
        }
        setModalConfig(null);
    }, [modalConfig]);

    const value = {
        showModal,
        hideModal,
        isOpen: !!modalConfig,
        config: modalConfig,
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
            {modalConfig && (
                <PopupModal isOpen={!!modalConfig} onClose={hideModal} {...modalConfig} />
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
