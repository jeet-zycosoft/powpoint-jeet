'use client';
import { authService } from '@/services/authService';
import {
    clearEmailVerificationSession,
    completeAuthenticatedSession,
    consumePendingLogin,
    getAuthData,
    getPostAuthPath,
    getStoredVerifyEmail,
    saveAuthTokens,
    VERIFY_TOKEN_KEY,
} from '@/services/authFlow';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import './style.scss';

import img1 from '@/../public/images/demo2.webp';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import Loader from '@/components/Loader';
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

const VerifyEmailPageInner = () => {
    const intl = useIntl();
    const router = useRouter();
    const dispatchRedux = useDispatch();
    const searchParams = useSearchParams();
    const [errorMsg, setErrorMsg] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isTokenVerifying, setIsTokenVerifying] = useState(false);
    const [isEnteringApp, setIsEnteringApp] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [nextPath, setNextPath] = useState('/customer/base-form');
    const tokenVerifyAttempted = useRef(false);

    const queryToken = searchParams.get('token');
    const queryCode = searchParams.get('code') || '';
    const queryEmail = searchParams.get('email') || '';

    const initialEmail =
        queryEmail || (typeof window !== 'undefined' ? getStoredVerifyEmail() : '');

    const initialFormState = {
        email: initialEmail,
        code: queryCode,
        isSubmitting: false,
    };

    function formReducer(state, action) {
        switch (action.type) {
            case 'CHANGE_INPUT':
                return { ...state, [action.field]: action.value };
            case 'SET_EMAIL':
                return { ...state, email: action.email };
            case 'SUBMIT_START':
                return { ...state, isSubmitting: true };
            case 'SUBMIT_SUCCESS':
                return { ...state, isSubmitting: false };
            case 'SUBMIT_FAILURE':
                return { ...state, isSubmitting: false };
            default:
                return state;
        }
    }

    const [formState, dispatch] = useReducer(formReducer, initialFormState);

    useEffect(() => {
        if (formState.email) return;
        const storedEmail = getStoredVerifyEmail();
        if (storedEmail) {
            dispatch({ type: 'SET_EMAIL', email: storedEmail });
        }
    }, [formState.email]);

    const enterAppAfterVerify = async (verifyResponse) => {
        const pending = consumePendingLogin();
        const verifyPayload = getAuthData(verifyResponse);
        const email = formState.email || getStoredVerifyEmail() || pending?.email;
        const userType = pending?.user_type || verifyPayload?.user?.user_type;
        const profilePath = getPostAuthPath({ userType, profileData: verifyPayload?.user });
        setNextPath(profilePath);

        setIsEnteringApp(true);
        try {
            let authResponse = null;
            if (verifyPayload?.access_token || verifyPayload?.token) {
                saveAuthTokens(verifyPayload);
                authResponse = verifyResponse;
            } else if (email && pending?.password) {
                authResponse = await authService.login({
                    email,
                    password: pending.password,
                    login_type: pending.login_type || 'email',
                });
            }

            if (authResponse) {
                clearEmailVerificationSession();
                await completeAuthenticatedSession({
                    response: authResponse,
                    dispatch: dispatchRedux,
                    router,
                });
                return;
            }

            clearEmailVerificationSession();
            if (!pending?.password) {
                setNextPath('/login');
            }
            setIsSuccess(true);
        } catch (err) {
            console.error('Could not open profile after verification:', err);
            clearEmailVerificationSession();
            toast.error(intl.formatMessage({ id: 'auth.verifiedLoginRequired' }));
            setNextPath('/login');
            setIsSuccess(true);
        } finally {
            setIsEnteringApp(false);
        }
    };

    useEffect(() => {
        if (isSuccess && nextPath !== '/login') {
            const timer = setTimeout(() => {
                router.push(nextPath);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, nextPath, router]);

    useEffect(() => {
        if (!queryToken || tokenVerifyAttempted.current) return;
        tokenVerifyAttempted.current = true;
        setIsTokenVerifying(true);
        setErrorMsg('');

        authService
            .verifyEmailToken({ token: queryToken })
            .then((data) => enterAppAfterVerify(data))
            .catch((err) => {
                const msg =
                    err.response?.data?.errors?.[0] ||
                    err.response?.data?.message ||
                    intl.formatMessage({ id: 'auth.invalidVerificationLink' });
                setErrorMsg(msg);
            })
            .finally(() => {
                setIsTokenVerifying(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryToken]);

    function handleInputChange(e) {
        setErrorMsg('');
        dispatch({
            type: 'CHANGE_INPUT',
            field: e.target.name,
            value: e.target.value,
        });
    }

    const timerRef = useRef(null);

    function submitForm(e) {
        e.preventDefault();
        setErrorMsg('');

        const email = formState.email || getStoredVerifyEmail();
        if (!email) {
            setErrorMsg(intl.formatMessage({ id: 'auth.emailNotFound' }));
            return;
        }
        if (!formState.code || formState.code.length < 6) {
            setErrorMsg(intl.formatMessage({ id: 'auth.codeLength' }));
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            dispatch({ type: 'SUBMIT_START' });
            authService
                .verifyEmailOtp({
                    email,
                    code: formState.code,
                })
                .then((data) => {
                    dispatch({ type: 'SUBMIT_SUCCESS' });
                    return enterAppAfterVerify(data);
                })
                .catch((err) => {
                    dispatch({ type: 'SUBMIT_FAILURE' });
                    const msg =
                        err.response?.data?.errors?.[0] ||
                        err.response?.data?.message ||
                        intl.formatMessage({ id: 'auth.invalidVerification' });
                    setErrorMsg(msg);
                });
        }, 200);
    }

    function handleResendOtp() {
        const email = formState.email || getStoredVerifyEmail();
        if (!email) {
            setErrorMsg(intl.formatMessage({ id: 'auth.emailNotFound' }));
            return;
        }

        setIsResending(true);
        setErrorMsg('');
        authService
            .requestEmailVerificationOtp({ email })
            .then((data) => {
                const token = data?.data?.verification_token;
                if (typeof window !== 'undefined' && token) {
                    sessionStorage.setItem(VERIFY_TOKEN_KEY, token);
                }
                toast.success(
                    data?.message || intl.formatMessage({ id: 'auth.resendSuccess' }),
                );
            })
            .catch((err) => {
                const msg =
                    err.response?.data?.message ||
                    intl.formatMessage({ id: 'auth.resendFailed' });
                setErrorMsg(msg);
            })
            .finally(() => {
                setIsResending(false);
            });
    }

    if (isEnteringApp) {
        return (
            <div className="login-container">
                <div className="login-form success-container">
                    <div className="success-view">
                        <Loader text={intl.formatMessage({ id: 'auth.openingProfile' })} />
                    </div>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        const isLoginFallback = nextPath === '/login';
        return (
            <div className="login-container">
                <div className="login-form success-container">
                    <div className="success-view">
                        <div className="success-icon">
                            <Image
                                src={'/images/verify.png'}
                                alt={intl.formatMessage({ id: 'auth.successImageAlt' })}
                                width={80}
                                height={80}
                            />
                        </div>
                        <h2 className="success-title">
                            {intl.formatMessage({ id: 'auth.successTitle' })}{' '}
                            <span className="highlight">
                                {intl.formatMessage({ id: 'auth.successTitleHighlight' })}
                            </span>
                        </h2>
                        <p className="success-message">
                            {isLoginFallback
                                ? intl.formatMessage({ id: 'auth.successDescLogin' })
                                : intl.formatMessage({ id: 'auth.successDesc' })}
                        </p>
                        <button
                            className="login-direct-btn"
                            onClick={() => router.push(nextPath)}
                        >
                            {isLoginFallback
                                ? intl.formatMessage({ id: 'auth.loginBtn' })
                                : intl.formatMessage({ id: 'auth.profileBtn' })}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isTokenVerifying) {
        return (
            <div className="login-container">
                <div className="login-form success-container">
                    <div className="success-view">
                        <Loader text={intl.formatMessage({ id: 'auth.verifyingLink' })} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="login-image">
                    <Image
                        src={img1}
                        alt={intl.formatMessage({ id: 'auth.verifyEmailImageAlt' })}
                        width={500}
                        height={500}
                    />
                </div>
                <div className="login-content">
                    <h1>{intl.formatMessage({ id: 'auth.verifyEmail' })}</h1>
                    <p>
                        {intl.formatMessage({ id: 'auth.verifyEmailDesc' })}
                        {formState.email ? ` ${formState.email}` : ''}
                    </p>
                    <form onSubmit={submitForm}>
                        <div className="form-group">
                            <label htmlFor="code">
                                {intl.formatMessage({ id: 'auth.otpLabel' })}
                            </label>
                            <div className="password-input-container">
                                <input
                                    type="text"
                                    name="code"
                                    id="code"
                                    maxLength={6}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={formState.code}
                                    onChange={handleInputChange}
                                    placeholder={intl.formatMessage({ id: 'auth.otpPlaceholder' })}
                                />
                            </div>
                            {errorMsg && <span className="error-message">{errorMsg}</span>}
                        </div>
                        <button
                            type="button"
                            className="resend-otp"
                            onClick={handleResendOtp}
                            disabled={isResending || formState.isSubmitting}
                        >
                            {isResending
                                ? intl.formatMessage({ id: 'auth.resendingOtp' })
                                : intl.formatMessage({ id: 'auth.resendOtp' })}
                        </button>
                        <button
                            type="submit"
                            className="continue-btn"
                            disabled={formState.isSubmitting}
                        >
                            {formState.isSubmitting
                                ? intl.formatMessage({ id: 'auth.verifying' })
                                : intl.formatMessage({ id: 'auth.continue' })}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const VerifyEmailFallback = () => {
    const intl = useIntl();
    return <Loader fullPage text={intl.formatMessage({ id: 'auth.loadingFallback' })} />;
};

export default function VerifyEmailPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <Suspense fallback={<VerifyEmailFallback />}>
                <VerifyEmailPageInner />
            </Suspense>
        </LocalIntlProvider>
    );
}
