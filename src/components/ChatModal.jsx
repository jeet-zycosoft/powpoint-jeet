'use client';

import { useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaLock, FaMapMarkerAlt } from 'react-icons/fa';
import { TbX } from 'react-icons/tb';
import { useIntl } from 'react-intl';
import './ChatModal.scss';

const ChatModal = ({
    isOpen,
    onClose,
    uiAction,
    message,
    onAccept,
    onDecline,
    onAction,
    loadingAction = false,
    _sitterName = 'the sitter',
    sitterLocation = null,
    ownerLocation = null,
    sitterQuota = null,
}) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const [replacingLocation, setReplacingLocation] = useState(false);

    // Determine content based on uiAction
    let title = t('chatModal.processTitle');
    let icon = <FaExclamationTriangle size={48} className="text-warning mb-3" />;
    let buttons = null;
    let displayMessage = message;

    switch (uiAction) {
        case 'SHOW_ACCEPT_CONVERSATION_POPUP':
            title = t('chatModal.acceptTitle');
            icon = <FaCheckCircle size={48} className="icon-success mb-3" />;

            // Build quota message if available
            let quotaMessage = '';
            if (sitterQuota) {
                const display =
                    sitterQuota.display ||
                    `${sitterQuota.used_new_sitters || 0} / ${sitterQuota.allowed_new_sitters || 5}`;
                const nextDisplay =
                    sitterQuota.next_display ||
                    `${(sitterQuota.used_new_sitters || 0) + 1} / ${sitterQuota.allowed_new_sitters || 5}`;
                quotaMessage = t('chatModal.acceptQuota', { display, nextDisplay });
            } else {
                quotaMessage = t('chatModal.acceptCredit');
            }

            buttons = (
                <div className="d-flex flex-column align-items-center mt-4">
                    <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                        {quotaMessage}
                    </p>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-secondary"
                            onClick={onDecline}
                            disabled={loadingAction}
                            className="btn-custom-secondary px-4 py-2"
                        >
                            {t('chatModal.decline')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onAccept}
                            disabled={loadingAction}
                            className="d-flex align-items-center btn-brand-primary gap-2 px-4 py-2"
                        >
                            {loadingAction && <Spinner animation="border" size="sm" />}
                            {t('chatModal.acceptConnection')}
                        </Button>
                    </div>
                </div>
            );
            break;

        case 'SHOW_PURCHASE_POPUP':
            title = t('chatModal.purchaseTitle');
            icon = <FaLock size={48} className="icon-lock mb-3" />;
            buttons = (
                <div className="d-flex justify-content-center mt-4">
                    <Button
                        variant="primary"
                        onClick={() => onAction('purchase')}
                        className="btn-brand-primary px-4 py-2"
                    >
                        {t('chatModal.getPremium')}
                    </Button>
                </div>
            );
            break;

        case 'SHOW_RENEWAL_POPUP':
            title = t('chatModal.renewTitle');
            icon = <FaLock size={48} className="icon-lock mb-3" />;
            displayMessage = message || t('chatModal.renewMessage');
            buttons = (
                <div className="d-flex justify-content-center mt-4">
                    <Button
                        variant="primary"
                        onClick={() => onAction('purchase', { reason: 'renew' })}
                        className="btn-brand-primary px-4 py-2"
                    >
                        {t('chatModal.renewButton')}
                    </Button>
                </div>
            );
            break;

        case 'SHOW_LOCATION_SUBSCRIPTION_POPUP':
            title = t('chatModal.locationTitle');
            icon = <FaMapMarkerAlt size={48} className="icon-location mb-3" />;

            {
                const sitterCity = sitterLocation?.city || t('chatModal.anotherArea');
                const ownerCity = ownerLocation?.city || t('chatModal.yourArea');
                displayMessage = t('chatModal.locationMessage', { sitterCity, ownerCity });
            }

            buttons = (
                <div className="d-flex flex-column flex-sm-row justify-content-center mt-4 gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={onClose}
                        disabled={replacingLocation}
                        className="btn-custom-secondary px-4 py-2"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() =>
                            onAction('replaceLocation', {
                                sitterLocation,
                                setReplacingLocation,
                            })
                        }
                        disabled={replacingLocation}
                        className="d-flex align-items-center btn-brand-primary gap-2 px-4 py-2"
                    >
                        {replacingLocation && <Spinner animation="border" size="sm" />}
                        {t('chatModal.replaceLocation')}
                    </Button>
                </div>
            );
            break;

        case 'SHOW_UPGRADE_POPUP':
            title = t('chatModal.upgradeTitle');
            icon = <FaExclamationTriangle size={48} className="icon-warning mb-3" />;
            displayMessage = message || t('chatModal.upgradeMessage');
            buttons = (
                <div className="d-flex justify-content-center mt-4">
                    <Button
                        variant="primary"
                        onClick={() => onAction('purchase', { reason: 'upgrade' })}
                        className="btn-brand-primary px-4 py-2"
                    >
                        {t('chatModal.buyPackage')}
                    </Button>
                </div>
            );
            break;

        default:
            title = t('chatModal.verifyTitle');
            icon = <FaExclamationTriangle size={48} className="icon-warning mb-3" />;
            buttons = null;
            break;
    }

    return (
        <Modal
            show={isOpen}
            onHide={onClose}
            centered
            className="pawpoint-chat-modal"
            backdrop="static"
            keyboard={false}
        >
            <div className="modal-content-wrapper">
                <button className="modal-close-btn" onClick={onClose} aria-label={t('common.closeModal')}>
                    <TbX size={20} />
                </button>
                <Modal.Body className="p-4 pt-5 text-center">
                    {icon}
                    <h3 className="modal-title mb-3">{title}</h3>
                    <p className="modal-message mb-4">{displayMessage}</p>
                    {buttons}
                </Modal.Body>
            </div>
        </Modal>
    );
};

export default ChatModal;
