'use client';

import checkCircle from '@/../public/icons/verify.png';
import img1 from '@/../public/images/demo2.webp';
import AuthGuard from '@/components/AuthGuard';
import Loader from '@/components/Loader';
import { ownerService } from '@/services/ownerService';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';
import './style.scss';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

function PaymentSuccessContent() {
    const intl = useIntl();
    const t = (key, values) => intl.formatMessage({ id: key }, values);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await ownerService.activeSubscriptionsOverview();
                setOverview(res?.data || res);
            } catch (err) {
                console.error('Failed to fetch subscription overview:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    const handleContinue = () => {
        const returnTo = searchParams?.get('returnTo');
        if (returnTo) {
            router.push(returnTo);
        } else {
            router.push('/sitter/listing');
        }
    };

    if (loading) {
        return <Loader text={t('paymentSuccess.loading')} />;
    }

    return (
        <div className="payment-success-container">
            <div className="login-form">
                <div className="login-image">
                    <Image
                        src={img1}
                        alt={t('paymentSuccess.altIllustration')}
                        width={500}
                        height={500}
                        priority
                    />
                </div>
                <div className="login-content">
                    <div className="status-icon success">
                        <Image
                            src={checkCircle}
                            alt={t('paymentSuccess.altSuccess')}
                            width={70}
                            height={70}
                        />
                    </div>
                    <h1>{t('paymentSuccess.title')}</h1>
                    <p>{t('paymentSuccess.subtitle')}</p>

                    {overview && (
                        <div className="subscription-summary mt-3 mb-3">
                            <p className="text-muted mb-2">
                                <strong>{t('paymentSuccess.activePackages')}</strong>{' '}
                                {overview.active_subscription_count || 0}
                            </p>
                            <p className="text-muted mb-0">
                                <strong>{t('paymentSuccess.connections')}</strong>{' '}
                                {overview.total_used_new_sitters || 0} /{' '}
                                {overview.total_allowed_new_sitters || 0}
                            </p>
                        </div>
                    )}

                    <button onClick={handleContinue} className="action-btn">
                        {t('paymentSuccess.findSitter')}
                    </button>
                    <button
                        onClick={() => router.push('/conversations')}
                        className="action-btn secondary-btn"
                    >
                        {t('paymentSuccess.openChats')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <AuthGuard>
            <LocalIntlProvider messages={messages}>
                <PaymentSuccessContent />
            </LocalIntlProvider>
        </AuthGuard>
    );
}
