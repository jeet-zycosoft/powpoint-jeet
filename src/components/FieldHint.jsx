'use client';

import { useModal } from '@/app/ModalProvider';
import { FaInfoCircle } from 'react-icons/fa';
import { useIntl } from 'react-intl';
import './FieldHint.scss';

/**
 * Section heading with optional red required star and info (i) icon.
 * Clicking the icon opens a modal listing all profile requirements.
 */
const FieldHint = ({
    title,
    required = false,
    as = 'h2',
    className = '',
    infoTitle,
    infoItems = [],
    children,
}) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const { showModal } = useModal();
    const Tag = as;

    const openInfo = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const message =
            infoItems.length > 0 ? (
                <ul className="field-hint-requirements">
                    {infoItems.map((item) => (
                        <li key={item.key || item.label}>
                            <span
                                className={
                                    item.mandatory
                                        ? 'field-hint-requirements__star'
                                        : 'field-hint-requirements__dot'
                                }
                            >
                                {item.mandatory ? '*' : '•'}
                            </span>
                            {item.label}
                        </li>
                    ))}
                </ul>
            ) : (
                t('fieldHint.defaultMessage')
            );

        showModal({
            type: 'info',
            title: infoTitle ?? t('fieldHint.completeProfile'),
            message,
            buttons: [{ text: t('common.gotIt'), variant: 'primary' }],
        });
    };

    return (
        <div className={`field-hint-heading ${className}`.trim()}>
            <Tag className="field-hint-heading__title">
                {title}
                {required && (
                    <span className="field-hint-heading__required" aria-label={t('common.required')}>
                        *
                    </span>
                )}
                {infoItems.length > 0 && (
                    <button
                        type="button"
                        className="field-hint-heading__info"
                        onClick={openInfo}
                        aria-label={t('fieldHint.completeProfile')}
                        title={t('fieldHint.completeProfile')}
                    >
                        <FaInfoCircle />
                    </button>
                )}
            </Tag>
            {children}
        </div>
    );
};

export default FieldHint;
