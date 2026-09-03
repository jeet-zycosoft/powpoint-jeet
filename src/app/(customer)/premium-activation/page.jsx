'use client';

import apiClient from '@/services/apiClient';
import { ownerService } from '@/services/ownerService';
import { selectUser } from '@/store/features/user/userSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import Loader from '@/components/Loader';
import { FaLock } from 'react-icons/fa';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';
import './premium.scss';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function PremiumActivationInner() {
    const intl = useIntl();
    const t = (key, values) => intl.formatMessage({ id: key }, values);
    const router = useRouter();
    const { isAuthenticated, userInfo } = useSelector(selectUser);

    const [plan, setPlan] = useState(null);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reason, setReason] = useState('purchase');

    useEffect(() => {
        let isMounted = true;

        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            const reasonParam = queryParams.get('reason');
            if (reasonParam) {
                setReason(reasonParam);
            }
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const planRes = await ownerService.fetchPlan();
                const planData = planRes?.data || planRes;

                const configRes = await apiClient.get('website/owner/payment-config');
                const configData = configRes?.data?.data || configRes?.data || configRes;

                if (isMounted) {
                    setPlan(planData);
                    setPaymentConfig(configData);
                }
            } catch (err) {
                console.error('Failed to load payment configuration or plan details:', err);
                if (isMounted) {
                    setError(t('premium.errors.loadFailed'));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCheckout = async () => {
        if (checkoutLoading) return;

        if (!isAuthenticated) {
            toast.warning(t('premium.errors.loginRequired'));
            router.push('/login');
            return;
        }

        const hasCoordinates = userInfo?.latitude && userInfo?.longitude && userInfo?.city;
        if (!hasCoordinates) {
            toast.error(t('premium.errors.completeLocation'));
            const userSlug = userInfo?.user_type === 'O' ? 'customer' : 'worker';
            router.push(`/${userSlug}/base-form2?returnTo=/premium-activation`);
            return;
        }

        try {
            setCheckoutLoading(true);

            const orderPayload = { plan_id: plan.id };
            const orderRes = await ownerService.createOrder(orderPayload);
            if (!orderRes?.status) {
                throw new Error(orderRes?.message || t('premium.errors.orderFailed'));
            }

            const orderData = orderRes?.data || orderRes;
            const gateway = orderData.gateway || paymentConfig?.payment_gateway;

            if (orderData.checkout_url) {
                window.location.href = orderData.checkout_url;
                return;
            }

            if (gateway === 'razorpay') {
                const sdkLoaded = await loadRazorpayScript();
                if (!sdkLoaded) {
                    toast.error(t('premium.errors.sdkFailed'));
                    setCheckoutLoading(false);
                    return;
                }

                const options = {
                    key: paymentConfig?.publishable_key,
                    subscription_id: orderData.subscription_id,
                    name: orderData.checkout_name || t('premium.checkout.name'),
                    description: orderData.checkout_description || t('premium.checkout.description'),
                    prefill: {
                        name:
                            `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() ||
                            userInfo?.full_name,
                        email: userInfo?.email || '',
                        contact: userInfo?.phone || '',
                    },
                    theme: {
                        color: '#4a766e',
                    },
                    handler: async (response) => {
                        try {
                            setCheckoutLoading(true);

                            const successRes = await apiClient.get(
                                'website/owner/payment-success',
                                {
                                    params: {
                                        gateway: 'razorpay',
                                        order_id: orderData.internal_order_id,
                                        razorpay_subscription_id: response.razorpay_subscription_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                    },
                                },
                            );

                            const successData = successRes?.data || successRes;
                            if (successData?.status) {
                                router.push('/payment-success');
                            } else {
                                router.push('/payment-error');
                            }
                        } catch (err) {
                            console.error('Razorpay success validation failed:', err);
                            toast.error(t('premium.errors.verificationFailed'));
                        } finally {
                            setCheckoutLoading(false);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            setCheckoutLoading(false);
                        },
                    },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                throw new Error(t('premium.errors.unsupportedGateway'));
            }
        } catch (err) {
            console.error('Checkout initialization failed:', err);

            const status = err.response?.status;
            const errMessage = err.response?.data?.message || err.message;

            if (status === 401) {
                toast.error(t('premium.errors.loginToContinue'));
                router.push('/login');
            } else if (status === 422) {
                toast.error(errMessage || t('premium.errors.completeProfileLocation'));
                const userSlug = userInfo?.user_type === 'O' ? 'customer' : 'worker';
                router.push(`/${userSlug}/base-form2?returnTo=/premium-activation`);
            } else if (status === 400) {
                toast.error(errMessage || t('premium.errors.invalidRequest'));
            } else if (status === 502 || status === 503) {
                toast.error(t('premium.errors.serviceUnavailable'));
            } else {
                toast.error(t('premium.errors.genericError'));
            }
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return <Loader text={t('premium.loading')} />;
    }

    if (error || !plan) {
        return (
            <div
                className="premium-page-wrapper d-flex justify-content-center align-items-center"
                style={{ minHeight: '60vh' }}
            >
                <div className="text-center">
                    <p className="text-danger">
                        {error || t('premium.errors.unableToLoad')}
                    </p>
                    <button
                        className="secure-payment-btn mt-3"
                        onClick={() => window.location.reload()}
                    >
                        {t('premium.retry')}
                    </button>
                </div>
            </div>
        );
    }

    const isPlanActive = plan?.is_active !== false;

    const getCurrencySymbol = (curr) => {
        switch (curr?.toUpperCase()) {
            case 'EUR':
                return '€';
            case 'USD':
                return '$';
            case 'GBP':
                return '£';
            case 'INR':
                return '₹';
            default:
                return curr || '€';
        }
    };

    const getIntervalLabel = (interval) => {
        switch (interval?.toUpperCase()) {
            case 'M':
                return t('premium.intervals.month');
            case 'Y':
                return t('premium.intervals.year');
            case 'W':
                return t('premium.intervals.week');
            case 'D':
                return t('premium.intervals.day');
            default:
                return '';
        }
    };

    const getTitleByReason = () => {
        switch (reason) {
            case 'renew':
                return t('premium.titles.renew');
            case 'location':
                return t('premium.titles.location');
            case 'upgrade':
                return t('premium.titles.upgrade');
            default:
                return t('premium.titles.purchase');
        }
    };

    const getDescriptionByReason = () => {
        switch (reason) {
            case 'renew':
                return t('premium.descriptions.renew');
            case 'location':
                return t('premium.descriptions.location');
            case 'upgrade':
                return t('premium.descriptions.upgrade');
            default:
                return t('premium.descriptions.purchase');
        }
    };

    return (
        <div className="premium-page-wrapper">
            <div className="premium-card">
                <h1 className="title">{getTitleByReason()}</h1>
                <p className="description">{getDescriptionByReason()}</p>

                <div className="price-container">
                    <span className="currency">{getCurrencySymbol(plan.currency)}</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">{getIntervalLabel(plan.interval)}</span>
                </div>

                {paymentConfig && (
                    <div className="config-info">
                        <p>
                            <strong>{t('premium.coverage')}</strong>{' '}
                            {t('premium.coverageDetail', {
                                radius: paymentConfig.chat_subscription_radius || 1000,
                            })}
                        </p>
                        <p>
                            <strong>{t('premium.connections')}</strong>{' '}
                            {t('premium.connectionsDetail', {
                                limit: paymentConfig.chat_new_sitter_limit || 5,
                            })}
                        </p>
                    </div>
                )}

                {isPlanActive ? (
                    <button
                        className="secure-payment-btn"
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                    >
                        {checkoutLoading ? (
                            <>
                                <Spinner animation="border" size="sm" />
                                {t('premium.processing')}
                            </>
                        ) : (
                            <>
                                <FaLock className="lock-icon" />
                                {plan.cta_text || t('premium.securePayment')}
                            </>
                        )}
                    </button>
                ) : (
                    <p className="text-muted text-center mt-3">{t('premium.noPlan')}</p>
                )}

                <div className="benefits-list">
                    {plan.features && plan.features.length > 0 ? (
                        plan.features.map((feature, idx) => (
                            <div className="benefit-item" key={idx}>
                                <span className="circle"></span>
                                <span className="text">{feature}</span>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="benefit-item">
                                <span className="circle"></span>
                                <span className="text">{t('premium.defaultBenefits.arrange')}</span>
                            </div>
                            <div className="benefit-item">
                                <span className="circle"></span>
                                <span className="text">{t('premium.defaultBenefits.fullAccess')}</span>
                            </div>
                            <div className="benefit-item">
                                <span className="circle"></span>
                                <span className="text">{t('premium.defaultBenefits.cancellable')}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PremiumActivationPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <PremiumActivationInner />
        </LocalIntlProvider>
    );
}
