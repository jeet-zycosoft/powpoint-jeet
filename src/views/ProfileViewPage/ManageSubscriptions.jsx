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

/** Free / non-recurring plans should not use "auto-renewal" copy. */
const isNonRecurringSubscription = (sub) => {
    if (!sub) return false;
    if (sub.is_free === true || sub.plan?.is_free === true) return true;
    if (sub.gateway === 'free' || sub.payment_gateway === 'free') return true;
    if (sub.is_recurring === false || sub.plan?.is_recurring === false) return true;
    return false;
};

const getSubscriptionId = (sub) =>
    sub?.subscription_id ?? sub?.id ?? sub?.subscription?.id ?? null;

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
            const nonRecurring = isNonRecurringSubscription(sub);

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
            const locationLabel =
                sub.location?.city || t('profile.subscriptions.fallbackLocation');
            const modalPrefix = nonRecurring
                ? 'profile.subscriptions.modal.cancelSubscription'
                : 'profile.subscriptions.modal.cancelRenewal';

            showModal({
                type: 'warning',
                title: t(`${modalPrefix}.title`),
                message: t(`${modalPrefix}.message`, {
                    location: locationLabel,
                    date: expiryDateFormatted,
                }),
                buttons: [
                    {
                        text: t(`${modalPrefix}.keep`),
                        variant: 'outline-secondary',
                    },
                    {
                        text: t(`${modalPrefix}.cancel`),
                        variant: 'danger',
                        onClick: async () => {
                            const subscriptionId = getSubscriptionId(sub);
                            if (!subscriptionId) {
                                toast.error(
                                    t(
                                        nonRecurring
                                            ? 'profile.subscriptions.toasts.cancelSubscription.cancelError'
                                            : 'profile.subscriptions.toasts.cancelError',
                                    ),
                                );
                                return;
                            }

                            try {
                                const res = await ownerService.cancelSubscription({
                                    params: { subscription_id: subscriptionId },
                                });

                                if (res?.status) {
                                    toast.success(
                                        t(
                                            nonRecurring
                                                ? 'profile.subscriptions.toasts.cancelSubscription.cancelSuccess'
                                                : 'profile.subscriptions.toasts.cancelSuccess',
                                        ),
                                    );
                                    fetchSubscriptions();
                                } else {
                                    toast.error(
                                        res?.message ||
                                            t(
                                                nonRecurring
                                                    ? 'profile.subscriptions.toasts.cancelSubscription.cancelFailed'
                                                    : 'profile.subscriptions.toasts.cancelFailed',
                                            ),
                                    );
                                }
                            } catch (err) {
                                console.error('Failed to cancel subscription:', err);
                                toast.error(
                                    err?.response?.data?.message ||
                                        t(
                                            nonRecurring
                                                ? 'profile.subscriptions.toasts.cancelSubscription.cancelError'
                                                : 'profile.subscriptions.toasts.cancelError',
                                        ),
                                );
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
                        const nonRecurring = isNonRecurringSubscription(sub);
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
                            <div
                                className="subscription-item"
                                key={getSubscriptionId(sub) || locationLabel}
                            >
                                <input
                                    type="checkbox"
                                    id={`sub-${getSubscriptionId(sub)}`}
                                    checked={isChecked}
                                    onChange={() => handleSubscriptionToggle(sub)}
                                />
                                <label htmlFor={`sub-${getSubscriptionId(sub)}`}>
                                    <strong>
                                        {locationLabel} (
                                        {sub.sitter_quota?.display ||
                                            `${sub.sitter_quota?.used_new_sitters || 0}/${sub.sitter_quota?.allowed_new_sitters || 5}`}
                                        )
                                        {nonRecurring
                                            ? ` · ${t('profile.subscriptions.freeBadge')}`
                                            : ''}
                                    </strong>
                                    <span>
                                        {isChecked
                                            ? t(
                                                  nonRecurring
                                                      ? 'profile.subscriptions.status.activeUntil'
                                                      : 'profile.subscriptions.status.activeRenew',
                                                  { date: dateFormatted },
                                              )
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
