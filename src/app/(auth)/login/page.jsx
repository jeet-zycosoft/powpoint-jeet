'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useReducer, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import './login.scss';

import { authService } from '@/services/authService';
import {
    completeAuthenticatedSession,
    isAuthRejected,
    isEmailVerificationRequired,
    isGoogleUserMissing,
    isUnverifiedEmailError,
    redirectToEmailVerification,
} from '@/services/authFlow';

import img1 from '@/../public/images/demo2.webp';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import AuthLogo from '@/components/AuthLogo';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { toast } from 'react-toastify';
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

const LoginPageInner = () => {
    const router = useRouter();
    const intl = useIntl();
    const dispatchRedux = useDispatch();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [apiErrors, setApiErrors] = useState({});

    const getFieldError = (fieldName) => {
        const error = apiErrors[fieldName];
        if (!error) return null;
        if (Array.isArray(error)) {
            return error[0];
        }
        return error;
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleAuthSuccess = async (response) => {
        if (isEmailVerificationRequired(response)) {
            if (response?.message) {
                toast.success(response.message);
            }
            redirectToEmailVerification(response, router);
            return 'verification';
        }

        const payload = response?.data || response;
        if (!payload?.access_token && !payload?.token) {
            return 'none';
        }

        await completeAuthenticatedSession({
            response,
            dispatch: dispatchRedux,
            router,
        });
        return 'authenticated';
    };

    const handleGoogleSuccess = async (googleResponse) => {
        const idToken = googleResponse?.credential;
        if (!idToken) {
            toast.error(intl.formatMessage({ id: 'auth.googleAuthFailed' }));
            return;
        }

        setIsGoogleLoading(true);
        setApiErrors({});
        try {
            const data = await authService.login({
                login_type: 'google',
                id_token: idToken,
            });

            if (isAuthRejected(data) || isGoogleUserMissing(null, data)) {
                const errMsg =
                    data?.message || intl.formatMessage({ id: 'auth.googleAccountNotFound' });
                toast.error(errMsg);
                if (isGoogleUserMissing(null, data)) {
                    router.push('/signup?from=google');
                }
                return;
            }

            const outcome = await handleAuthSuccess(data);
            if (outcome === 'authenticated') {
                toast.success(intl.formatMessage({ id: 'auth.loggedInSuccess' }));
            } else if (outcome === 'none') {
                toast.error(
                    data?.message || intl.formatMessage({ id: 'auth.unexpectedError' }),
                );
            }
        } catch (error) {
            console.error('Google login error:', error);
            const responseData = error.response?.data;
            const errMsg =
                responseData?.message ||
                responseData?.error ||
                intl.formatMessage({ id: 'auth.googleAccountNotFound' });
            toast.error(errMsg);
            if (isGoogleUserMissing(error, responseData)) {
                router.push('/signup?from=google');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };
    // ========================================
    const initialFormState = {
        email: '',
        password: '',
    };

    function formReducer(state, action) {
        switch (action.type) {
            case 'CHANGE_INPUT':
                return { ...state, [action.field]: action.value };
            case 'RESET_FORM':
                return action.initialState; // Or a predefined empty state
            default:
                return state;
        }
    }

    const [state, dispatch] = useReducer(formReducer, initialFormState);

    function handleInputChange(e) {
        const { name, value } = e.target;
        dispatch({
            type: 'CHANGE_INPUT',
            field: name,
            value: value,
        });
        if (apiErrors[name]) {
            setApiErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }

    const timerRef = useRef(null);

    function submitForm(e) {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setApiErrors({});

        const errors = {};
        if (!state.email.trim()) {
            errors.email = intl.formatMessage({ id: 'auth.emailRequired' });
        }
        if (!state.password) {
            errors.password = intl.formatMessage({ id: 'auth.passwordRequired' });
        }
        if (Object.keys(errors).length > 0) {
            setApiErrors(errors);
            setIsLoading(false);
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            authService
                .login({
                    email: state.email,
                    password: state.password,
                    login_type: 'email',
                })
                .then(async (data) => {
                    if (isEmailVerificationRequired(data)) {
                        if (data?.message) {
                            toast.success(data.message);
                        }
                        redirectToEmailVerification(data, router, {
                            email: state.email,
                            password: state.password,
                            login_type: 'email',
                        });
                        return;
                    }
                    await handleAuthSuccess(data);
                })
                .catch((err) => {
                    console.error('error:', err);

                    if (isUnverifiedEmailError(err)) {
                        redirectToEmailVerification(
                            { data: { email: state.email, requires_email_verification: true } },
                            router,
                            {
                                email: state.email,
                                password: state.password,
                                login_type: 'email',
                            },
                        );
                        authService
                            .requestEmailVerificationOtp({ email: state.email })
                            .catch(() => {});
                        return;
                    }

                    const responseData = err.response?.data;
                    const errMsg =
                        responseData?.message ||
                        responseData?.error ||
                        intl.formatMessage({ id: 'auth.unexpectedError' });
                    if (err.response?.status === 401) {
                        if (
                            errMsg.toLowerCase().includes('user') ||
                            errMsg.toLowerCase().includes('email')
                        ) {
                            setApiErrors({ email: errMsg });
                        } else {
                            setApiErrors({ password: errMsg });
                        }
                    } else {
                        setApiErrors({ password: errMsg });
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }, 200);
    }

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="login-image">
                    <Image
                        src={img1}
                        alt={intl.formatMessage({ id: 'auth.loginImageAlt' })}
                        width={500}
                        height={500}
                        loading="eager"
                    />
                </div>
                <div className="login-content">
                    <AuthLogo />
                    <h1>{intl.formatMessage({ id: 'auth.login' })}</h1>
                    <p>{intl.formatMessage({ id: 'auth.loginDesc' })}</p>
                    <form onSubmit={submitForm}>
                        <div className="form-group">
                            <label htmlFor="email">
                                {intl.formatMessage({ id: 'auth.emailLabel' })}
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                // defaultValue="owner@zycosoft.com"
                                placeholder={intl.formatMessage({ id: 'auth.emailPlaceholder' })}
                                onChange={handleInputChange}
                            />
                            {getFieldError('email') && (
                                <div className="error-message">{getFieldError('email')}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">
                                {intl.formatMessage({ id: 'auth.passwordLabel' })}
                            </label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    id="password"
                                    // defaultValue="password"
                                    onChange={handleInputChange}
                                    placeholder="******"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="password-toggle-btn"
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
                                        {showPassword ? (
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
                            {getFieldError('password') && (
                                <div className="error-message">{getFieldError('password')}</div>
                            )}
                        </div>
                        <a href="/forgot-password" className="forgot-password">
                            {intl.formatMessage({ id: 'auth.forgotPassword' })}
                        </a>
                        <button
                            type="submit"
                            className="continue-btn"
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isLoading ? (
                                <span className="spinner"></span>
                            ) : (
                                intl.formatMessage({ id: 'auth.continue' })
                            )}
                        </button>
                        <p className="register-link">
                            {intl.formatMessage({ id: 'auth.noAccount' })}{' '}
                            <a href="/signup">{intl.formatMessage({ id: 'auth.register' })}</a>
                        </p>
                        <div className="or-divider">{intl.formatMessage({ id: 'auth.or' })}</div>
                        <GoogleLoginButton
                            disabled={isLoading || isGoogleLoading}
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                toast.error(intl.formatMessage({ id: 'auth.googleAuthFailed' }));
                            }}
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default function LoginPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <LoginPageInner />
        </LocalIntlProvider>
    );
}
