'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './style.scss';

import img1 from '@/../public/images/demo2.webp';
import successIcon from '@/../public/images/verify.png';
import { authService } from '@/services/authService';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import { useIntl } from 'react-intl';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const ForgotPasswordPageInner = () => {
    const router = useRouter();
    const intl = useIntl();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successResponse, setSuccessResponse] = useState(null);

    const handleInputChange = (e) => {
        if (errorMsg) setErrorMsg('');
        setEmail(e.target.value);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (isLoading) return;

        // Simple validation
        if (!email.trim()) {
            setErrorMsg(
                intl.formatMessage({
                    id: 'auth.emailRequired',
                    defaultMessage: 'Email is required.',
                }),
            );
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setErrorMsg(
                intl.formatMessage({
                    id: 'auth.emailInvalid',
                    defaultMessage: 'Please enter a valid email address.',
                }),
            );
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        authService
            .forgotPassword({ email: email.trim() })
            .then((res) => {
                setIsLoading(false);
                setSuccessResponse(
                    res || { message: intl.formatMessage({ id: 'auth.resetLinkSent' }) },
                );
            })
            .catch((err) => {
                setIsLoading(false);
                console.error('Forgot password error:', err);
                const errMsg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    intl.formatMessage({
                        id: 'auth.resetError',
                        defaultMessage: 'Something went wrong. Please try again.',
                    });
                setErrorMsg(errMsg);
            });
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="login-image">
                    <Image
                        src={img1}
                        alt={intl.formatMessage({ id: 'auth.forgotPasswordImageAlt' })}
                        width={500}
                        height={500}
                    />
                </div>
                <div className="login-content">
                    {successResponse ? (
                        <div className="success-card">
                            <div className="success-icon-wrapper">
                                <Image
                                    src={successIcon}
                                    alt={intl.formatMessage({ id: 'auth.successIconAlt' })}
                                    width={500}
                                    height={500}
                                />
                            </div>
                            <h2>{intl.formatMessage({ id: 'auth.successTitle' })}</h2>
                            <p>
                                {successResponse?.message ||
                                    successResponse?.data?.message ||
                                    intl.formatMessage({ id: 'auth.successDesc' })}
                            </p>
                            <button
                                type="button"
                                className="login-redirect-btn"
                                onClick={() => router.push('/login')}
                            >
                                {intl.formatMessage({
                                    id: 'auth.login',
                                    defaultMessage: 'Go to Login',
                                })}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => router.push('/login')}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                {intl.formatMessage({ id: 'auth.back' })}
                            </button>

                            <h1>{intl.formatMessage({ id: 'auth.forgotPasswordTitle' })}</h1>
                            <p>{intl.formatMessage({ id: 'auth.forgotPasswordDesc' })}</p>

                            <form onSubmit={submitForm}>
                                <div className="form-group">
                                    <label htmlFor="email">
                                        {intl.formatMessage({ id: 'auth.emailLabel' })}
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        placeholder={intl.formatMessage({
                                            id: 'auth.emailPlaceholder',
                                        })}
                                        value={email}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                    />
                                    {errorMsg && <div className="error-message">{errorMsg}</div>}
                                </div>
                                <button type="submit" className="continue-btn" disabled={isLoading}>
                                    {isLoading ? (
                                        <span className="spinner" />
                                    ) : (
                                        intl.formatMessage({ id: 'auth.continue' })
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function ForgotPasswordPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <ForgotPasswordPageInner />
        </LocalIntlProvider>
    );
}
