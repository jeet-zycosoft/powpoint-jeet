'use client';

import { useModal } from '@/app/ModalProvider';
import { ownerService } from '@/services/ownerService';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateString;
    }
};

const ManageSubscriptions = ({ userType }) => {
    const intl = useIntl();
    const t = (key, values) => intl.formatMessage({ id: key }, values);
    const router = useRouter();
    const { showModal } = useModal();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await ownerService.activeSubscriptionsOverview();
            const subs = res?.data?.subscriptions || res?.subscriptions || [];
            setSubscriptions(subs);
        } catch (err) {
            console.error('Failed to fetch subscriptions overview:', err);
            setError(intl.formatMessage({ id: 'profile.subscriptions.loadError' }));
        } finally {
            setLoading(false);
        }
    }, [intl]);

    useEffect(() => {
        if (userType === 'O') {
            fetchSubscriptions();
        }
    }, [userType, fetchSubscriptions]);

    const handleSubscriptionToggle = useCallback(
        (sub) => {
            const isCurrentlyActive = sub.status === 'A' && !sub.is_expired;

            if (!isCurrentlyActive) {
                showModal({
                    type: 'info',
                    title: t('profile.subscriptions.modal.activatePremium.title'),
                    message: t('profile.subscriptions.modal.activatePremium.message'),
                    buttons: [
                        {
                            text: t('profile.subscriptions.modal.activatePremium.close'),
                            variant: 'outline-secondary',
                        },
                        {
                            text: t('profile.subscriptions.modal.activatePremium.activate'),
                            variant: 'primary',
                            onClick: () => router.push('/premium-activation'),
                        },
                    ],
                });
                return;
            }

            const expiryDateFormatted = formatDate(
                sub.period?.current_period_end || sub.period?.expiry_date,
            );

            showModal({
                type: 'warning',
                title: t('profile.subscriptions.modal.cancelRenewal.title'),
                message: t('profile.subscriptions.modal.cancelRenewal.message', {
                    location: sub.location?.city || t('profile.subscriptions.fallbackLocation'),
                    date: expiryDateFormatted,
                }),
                buttons: [
                    {
                        text: t('profile.subscriptions.modal.cancelRenewal.keep'),
                        variant: 'outline-secondary',
                    },
                    {
                        text: t('profile.subscriptions.modal.cancelRenewal.cancel'),
                        variant: 'danger',
                        onClick: async () => {
                            try {
                                const res = await ownerService.cancelSubscription({
                                    params: { subscription_id: sub.subscription_id },
                                });

                                if (res?.status) {
                                    toast.success(t('profile.subscriptions.toasts.cancelSuccess'));
                                    fetchSubscriptions();
                                } else {
                                    toast.error(t('profile.subscriptions.toasts.cancelFailed'));
                                }
                            } catch (err) {
                                console.error('Failed to cancel subscription:', err);
                                toast.error(t('profile.subscriptions.toasts.cancelError'));
                            }
                        },
                    },
                ],
            });
        },
        [showModal, router, fetchSubscriptions, t],
    );

    if (userType !== 'O') return null;

    return (
        <section className="profile-section">
            <div className="card-header">
                <h2 className="profile-section__heading">{t('profile.subscriptions.title')}</h2>
            </div>

            <div className="card-content notification-setting">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center w-100 py-4">
                        <Spinner animation="border" style={{ color: '#1d7161' }} />
                        <span className="text-muted ms-2">
                            {t('profile.subscriptions.loading')}
                        </span>
                    </div>
                ) : error ? (
                    <div className="w-100 py-3 text-center">
                        <p className="text-danger mb-2">{error}</p>
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={fetchSubscriptions}
                            style={{ borderRadius: '8px' }}
                        >
                            {t('profile.subscriptions.retry')}
                        </button>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="w-100 py-3 text-center">
                        <p className="text-muted mb-3">{t('profile.subscriptions.empty')}</p>
                        <button
                            className="btn btn-brand-primary text-white"
                            onClick={() => router.push('/premium-activation')}
                            style={{
                                backgroundColor: '#1d7161',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1.5rem',
                                fontWeight: 600,
                            }}
                        >
                            {t('profile.subscriptions.activatePremium')}
                        </button>
                    </div>
                ) : (
                    subscriptions.map((sub) => {
                        const isChecked = sub.status === 'A' && !sub.is_expired;
                        const locationLabel = [
                            sub.location?.city,
                            sub.location?.state,
                            sub.location?.country,
                        ]
                            .filter(Boolean)
                            .join(', ');

                        const dateFormatted = formatDate(
                            sub.period?.current_period_end || sub.period?.expiry_date,
                        );

                        return (
                            <div className="subscription-item" key={sub.subscription_id}>
                                <input
                                    type="checkbox"
                                    id={`sub-${sub.subscription_id}`}
                                    checked={isChecked}
                                    onChange={() => handleSubscriptionToggle(sub)}
                                />
                                <label htmlFor={`sub-${sub.subscription_id}`}>
                                    <strong>
                                        {locationLabel} (
                                        {sub.sitter_quota?.display ||
                                            `${sub.sitter_quota?.used_new_sitters || 0}/${sub.sitter_quota?.allowed_new_sitters || 5}`}
                                        )
                                    </strong>
                                    <span>
                                        {isChecked
                                            ? t('profile.subscriptions.status.activeRenew', {
                                                  date: dateFormatted,
                                              })
                                            : sub.is_expired
                                              ? t('profile.subscriptions.status.expired', {
                                                    date: dateFormatted,
                                                })
                                              : t('profile.subscriptions.status.cancelled', {
                                                    date: dateFormatted,
                                                })}
                                    </span>
                                </label>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default ManageSubscriptions;
