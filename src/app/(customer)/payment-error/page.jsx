'use client';

import img1 from '@/../public/images/demo2.webp';
import AuthGuard from '@/components/AuthGuard';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaTimesCircle } from 'react-icons/fa';
import { useIntl } from 'react-intl';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';
import '../payment-success/style.scss';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

function PaymentErrorContent() {
    const intl = useIntl();
    const t = (key, values) => intl.formatMessage({ id: key }, values);
    const router = useRouter();

    const handleRetry = () => {
        router.push('/premium-activation');
    };

    return (
        <div className="payment-success-container">
            <div className="login-form">
                <div className="login-image">
                    <Image
                        src={img1}
                        alt={t('paymentError.altIllustration')}
                        width={500}
                        height={500}
                        priority
                    />
                </div>
                <div className="login-content">
                    <div className="status-icon error">
                        <FaTimesCircle />
                    </div>
                    <h1>{t('paymentError.title')}</h1>
                    <p>{t('paymentError.subtitle')}</p>

                    <button onClick={handleRetry} className="action-btn">
                        {t('paymentError.tryAgain')}
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="action-btn secondary-btn"
                    >
                        {t('paymentError.goHome')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentErrorPage() {
    return (
        <AuthGuard>
            <LocalIntlProvider messages={messages}>
                <PaymentErrorContent />
            </LocalIntlProvider>
        </AuthGuard>
    );
}
