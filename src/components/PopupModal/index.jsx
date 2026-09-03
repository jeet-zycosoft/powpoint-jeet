'use client';

import { Button, Modal, Spinner } from 'react-bootstrap';
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaQuestionCircle,
    FaTimesCircle,
} from 'react-icons/fa';
import { TbX } from 'react-icons/tb';
import { useIntl } from 'react-intl';
import './PopupModal.scss';

const PopupModal = ({
    isOpen,
    onClose,
    title,
    message = '',
    type = 'info', // 'success' | 'warning' | 'error' | 'info' | 'question'
    icon: customIcon = null,
    buttons = [],
    showCloseButton = true,
    backdrop = 'static',
    keyboard = false,
    centered = true,
    size = 'md',
}) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const modalTitle = title ?? t('common.notification');

    // Determine the icon to display
    const getIcon = () => {
        if (customIcon) return customIcon;

        switch (type) {
            case 'success':
                return <FaCheckCircle size={48} className="icon-success mb-3" />;
            case 'warning':
                return <FaExclamationTriangle size={48} className="icon-warning mb-3" />;
            case 'error':
                return <FaTimesCircle size={48} className="icon-danger mb-3" />;
            case 'question':
                return <FaQuestionCircle size={48} className="icon-question mb-3" />;
            case 'info':
            default:
                return <FaInfoCircle size={48} className="icon-info mb-3" />;
        }
    };

    const handleButtonClick = async (btn) => {
        if (btn.onClick) {
            try {
                await btn.onClick();
            } catch (err) {
                console.error('Error in popup modal button callback:', err);
            }
        }
        if (btn.closeOnClick !== false) {
            onClose();
        }
    };

    return (
        <Modal
            show={isOpen}
            onHide={onClose}
            centered={centered}
            size={size}
            className="pawpoint-common-popup-modal"
            backdrop={backdrop}
            keyboard={keyboard}
        >
            <div className="modal-content-wrapper">
                {showCloseButton && (
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label={t('popup.closeAria')}
                    >
                        <TbX size={20} />
                    </button>
                )}
                <Modal.Body className="p-4 pt-5 text-center">
                    {getIcon()}
                    {modalTitle && <h3 className="modal-title mb-3">{modalTitle}</h3>}
                    {message && (
                        <div className="modal-message mb-4">
                            {typeof message === 'string' ? <p>{message}</p> : message}
                        </div>
                    )}

                    {buttons && buttons.length > 0 && (
                        <div className="d-flex justify-content-center mt-4 flex-wrap gap-2">
                            {buttons.map((btn, idx) => (
                                <Button
                                    key={idx}
                                    variant={btn.variant || 'primary'}
                                    onClick={() => handleButtonClick(btn)}
                                    disabled={btn.disabled || btn.loading}
                                    className={`d-flex align-items-center gap-2 px-4 py-2 ${
                                        btn.variant === 'primary'
                                            ? 'btn-brand-primary'
                                            : btn.variant === 'outline-primary'
                                              ? 'btn-brand-outline'
                                              : btn.variant === 'outline-secondary'
                                                ? 'btn-custom-secondary'
                                                : ''
                                    } ${btn.className || ''}`}
                                >
                                    {btn.loading && <Spinner animation="border" size="sm" />}
                                    {btn.text}
                                </Button>
                            ))}
                        </div>
                    )}
                </Modal.Body>
            </div>
        </Modal>
    );
};

export default PopupModal;
