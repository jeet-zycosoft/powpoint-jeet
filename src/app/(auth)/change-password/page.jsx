'use client';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import './style.scss';

import img1 from '@/../public/images/demo2.webp';
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

const ChangePasswordPageInner = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const intl = useIntl();

    const email = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successResponse, setSuccessResponse] = useState(null);
    const [countdown, setCountdown] = useState(5);

    const countdownIntervalRef = useRef(null);

    useEffect(() => {
        // Clean up countdown interval when component unmounts
        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, []);

    // Start 5-second countdown on success
    const startCountdown = () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    router.push('/login');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleNewPasswordChange = (e) => {
        if (errorMsg) setErrorMsg('');
        setNewPassword(e.target.value);
    };

    const handleConfirmPasswordChange = (e) => {
        if (errorMsg) setErrorMsg('');
        setConfirmPassword(e.target.value);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (isLoading) return;

        // Validations
        if (!newPassword) {
            setErrorMsg(
                intl.formatMessage({
                    id: 'auth.passwordRequired',
                    defaultMessage: 'Password is required.',
                }),
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg(
                intl.formatMessage({
                    id: 'auth.passwordMismatch',
                    defaultMessage: 'Passwords do not match.',
                }),
            );
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        authService
            .recoverPassword({
                email: email.trim(),
                token: token.trim(),
                password: newPassword,
                conf_password: confirmPassword,
            })
            .then((res) => {
                setIsLoading(false);
                setSuccessResponse(
                    res || {
                        message: intl.formatMessage({ id: 'auth.passwordChangedDefault' }),
                    },
                );
                startCountdown();
            })
            .catch((err) => {
                setIsLoading(false);
                console.error('Change password error:', err);
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

    // If query params are missing, show link invalid state
    const isLinkInvalid = !email.trim() || !token.trim();

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="login-image">
                    <Image
                        src={img1}
                        alt={intl.formatMessage({ id: 'auth.changePasswordImageAlt' })}
                        width={500}
                        height={500}
                        priority
                    />
                </div>
                <div className="login-content">
                    {isLinkInvalid ? (
                        <div className="error-card">
                            <div className="error-icon-wrapper">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <h2>{intl.formatMessage({ id: 'auth.invalidResetLinkTitle' })}</h2>
                            <p>
                                {intl.formatMessage({
                                    id: 'auth.tokenMissing',
                                    defaultMessage:
                                        'Invalid or expired password reset link. Please request a new one.',
                                })}
                            </p>
                            <button
                                type="button"
                                className="login-redirect-btn"
                                onClick={() => router.push('/forgot-password')}
                            >
                                {intl.formatMessage({ id: 'auth.requestNewLink' })}
                            </button>
                        </div>
                    ) : successResponse ? (
                        <div className="success-card">
                            <div className="success-icon-wrapper">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h2>
                                {intl.formatMessage({
                                    id: 'auth.successTitle',
                                    defaultMessage: 'Password Changed Successfully',
                                })}
                            </h2>
                            <p>
                                {successResponse?.message ||
                                    successResponse?.data?.message ||
                                    intl.formatMessage({
                                        id: 'auth.successDesc',
                                        defaultMessage:
                                            'Your password has been successfully reset. You will be redirected to the login page shortly.',
                                    })}
                            </p>
                            <div className="countdown-indicator">
                                {intl.formatMessage(
                                    { id: 'auth.redirectingCountdown' },
                                    { seconds: countdown },
                                )}
                            </div>
                            <button
                                type="button"
                                className="login-redirect-btn"
                                onClick={() => {
                                    if (countdownIntervalRef.current)
                                        clearInterval(countdownIntervalRef.current);
                                    router.push('/login');
                                }}
                            >
                                {intl.formatMessage({
                                    id: 'auth.back',
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
                                {intl.formatMessage({
                                    id: 'auth.back',
                                    defaultMessage: 'Back to Login',
                                })}
                            </button>

                            <h1>
                                {intl.formatMessage({
                                    id: 'auth.changePasswordTitle',
                                    defaultMessage: 'Change Password',
                                })}
                            </h1>
                            <p>
                                {intl.formatMessage({
                                    id: 'auth.changePasswordDesc',
                                    defaultMessage: 'Please enter your new password below.',
                                })}
                            </p>

                            <form onSubmit={submitForm}>
                                <div className="form-group">
                                    <label htmlFor="new-password">
                                        {intl.formatMessage({
                                            id: 'auth.newPasswordLabel',
                                            defaultMessage: 'New Password',
                                        })}
                                    </label>
                                    <div className="password-input-container">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            name="newPassword"
                                            id="new-password"
                                            placeholder={intl.formatMessage({
                                                id: 'auth.newPasswordPlaceholder',
                                                defaultMessage: 'Enter new password',
                                            })}
                                            value={newPassword}
                                            onChange={handleNewPasswordChange}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="password-toggle-btn"
                                            tabIndex="-1"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                {showNewPassword ? (
                                                    <>
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                        <line x1="2" x2="22" y1="2" y2="22" />
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirm-password">
                                        {intl.formatMessage({
                                            id: 'auth.confirmPasswordLabel',
                                            defaultMessage: 'Confirm Password',
                                        })}
                                    </label>
                                    <div className="password-input-container">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            id="confirm-password"
                                            placeholder={intl.formatMessage({
                                                id: 'auth.confirmPasswordPlaceholder',
                                                defaultMessage: 'Confirm new password',
                                            })}
                                            value={confirmPassword}
                                            onChange={handleConfirmPasswordChange}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(!showConfirmPassword)
                                            }
                                            className="password-toggle-btn"
                                            tabIndex="-1"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                {showConfirmPassword ? (
                                                    <>
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                        <line x1="2" x2="22" y1="2" y2="22" />
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                    {errorMsg && <div className="error-message">{errorMsg}</div>}
                                </div>

                                <button type="submit" className="continue-btn" disabled={isLoading}>
                                    {isLoading ? (
                                        <span className="spinner" />
                                    ) : (
                                        intl.formatMessage({
                                            id: 'auth.continue',
                                            defaultMessage: 'Reset Password',
                                        })
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

export default function ChangePasswordPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <Suspense
                fallback={
                    <div className="login-container">
                        <div
                            className="login-form"
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '400px',
                            }}
                        >
                            <span
                                className="spinner"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '3px solid rgba(0, 0, 0, 0.15)',
                                    borderTopColor: '#f7b267',
                                }}
                            />
                        </div>
                    </div>
                }
            >
                <ChangePasswordPageInner />
            </Suspense>
        </LocalIntlProvider>
    );
}
