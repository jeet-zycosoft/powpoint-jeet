'use client';
import { authService } from '@/services/authService';
import {
    completeAuthenticatedSession,
    handleAuthSuccess,
    isAlreadyRegisteredError,
    isAuthRejected,
    isEmailVerificationRequired,
    redirectToEmailVerification,
} from '@/services/authFlow';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useReducer, useState, Suspense } from 'react';
import { FaBriefcase, FaPaw } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import '../login/login.scss';

import img1 from '@/../public/images/registration-img.png';
import googleIcon from '@/../public/icons/google.png';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import AuthLogo from '@/components/AuthLogo';
import GoogleLoginButton from '@/components/GoogleLoginButton';
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

const SignupPageInner = () => {
    const intl = useIntl();
    const dispatchRedux = useDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword1, setShowPassword1] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [googleSignupMode, setGoogleSignupMode] = useState(false);
    const [apiErrors, setApiErrors] = useState({});

    const getFieldError = (fieldName) => {
        const error = apiErrors[fieldName];
        if (!error) return null;
        if (Array.isArray(error)) {
            return error[0];
        }
        return error;
    };
    // useReducer ========================================
    const initialFormState = {
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        user_type: '',
    };

    function formReducer(state, action) {
        switch (action.type) {
            case 'CHANGE_INPUT':
                return { ...state, [action.field]: action.value };
            case 'RESET_FORM':
                return action.initialState;
            default:
                return state;
        }
    }

    const [formData, dispatch] = useReducer(formReducer, initialFormState);

    useEffect(() => {
        if (searchParams?.get('from') === 'google') {
            setGoogleSignupMode(true);
            setStep(2);
        }
    }, [searchParams]);

    const startGoogleSignup = () => {
        setApiErrors({});
        setGoogleSignupMode(true);
        setStep(2);
    };

    const handleGoogleRegister = async (googleResponse) => {
        const idToken = googleResponse?.credential;
        const userType = formData.user_type;
        if (!idToken || (userType !== 'O' && userType !== 'S')) {
            toast.error(intl.formatMessage({ id: 'auth.googleAuthFailed' }));
            return;
        }

        setLoading(true);
        try {
            const data = await authService.register({
                login_type: 'google',
                id_token: idToken,
                user_type: userType,
            });

            if (isAuthRejected(data)) {
                toast.error(data?.message || intl.formatMessage({ id: 'auth.registrationFailed' }));
                return;
            }

            if (isEmailVerificationRequired(data)) {
                toast.success(
                    data?.message || intl.formatMessage({ id: 'auth.registrationSuccessVerify' }),
                );
                redirectToEmailVerification(data, router, {
                    login_type: 'google',
                    user_type: userType,
                });
                return;
            }

            await completeAuthenticatedSession({
                response: data,
                dispatch: dispatchRedux,
                router,
            });
            toast.success(data?.message || intl.formatMessage({ id: 'auth.registrationSuccess' }));
        } catch (error) {
            console.error('Google registration error:', error);
            if (isAlreadyRegisteredError(error)) {
                const msg =
                    error.response?.data?.message ||
                    intl.formatMessage({ id: 'auth.emailAlreadyRegistered' });
                toast.error(msg);
                router.push('/login');
                return;
            }
            toast.error(
                error.response?.data?.message ||
                    intl.formatMessage({ id: 'auth.registrationFailed' }),
            );
        } finally {
            setLoading(false);
        }
    };

    function handleInputChange(e) {
        const { name, value } = e.target;
        dispatch({
            type: 'CHANGE_INPUT',
            field: name,
            value: value,
        });
        if (name === 'password' || name === 'confirm_password') {
            if (apiErrors.password || apiErrors.confirm_password) {
                setApiErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    delete next.confirm_password;
                    return next;
                });
            }
        } else if (apiErrors[name]) {
            setApiErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }

    function handleContinueStep1(e) {
        e.preventDefault();
        const errors = {};

        if (!formData.first_name.trim()) {
            errors.first_name = intl.formatMessage({ id: 'auth.firstNameRequired' });
        }
        if (!formData.last_name.trim()) {
            errors.last_name = intl.formatMessage({ id: 'auth.lastNameRequired' });
        }
        if (!formData.email.trim()) {
            errors.email = intl.formatMessage({ id: 'auth.emailRequired' });
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = intl.formatMessage({ id: 'auth.emailInvalid' });
            }
        }
        if (formData.login_type !== 'google') {
            if (!formData.password) {
                errors.password = intl.formatMessage({ id: 'auth.passwordRequired' });
            }
            if (formData.password !== formData.confirm_password) {
                errors.confirm_password = intl.formatMessage({ id: 'auth.passwordMismatch' });
            }
        }

        if (Object.keys(errors).length > 0) {
            setApiErrors(errors);
            return;
        }

        setApiErrors({});
        setGoogleSignupMode(false);
        setStep(2);
    }

    const handleSelectRole = (role) => {
        dispatch({
            type: 'CHANGE_INPUT',
            field: 'user_type',
            value: role,
        });

        if (googleSignupMode) {
            return;
        }

        setLoading(true);

        const finalData = {
            ...formData,
            user_type: role,
            login_type: 'email',
        };

        authService
            .register(finalData)
            .then((data) => {
                if (isEmailVerificationRequired(data)) {
                    toast.success(
                        data?.message ||
                            intl.formatMessage({ id: 'auth.registrationSuccessVerify' }),
                    );
                    redirectToEmailVerification(data, router, {
                        email: finalData.email,
                        password: formData.password,
                        login_type: 'email',
                        user_type: role,
                    });
                    return;
                }

                const outcome = handleAuthSuccess(data, router);
                const userData = data?.data || data;
                const token = userData?.access_token || userData?.token;

                if (outcome === 'authenticated' && token) {
                    completeAuthenticatedSession({
                        response: data,
                        dispatch: dispatchRedux,
                        router,
                    });
                    toast.success(intl.formatMessage({ id: 'auth.registrationSuccess' }));
                    return;
                }

                toast.success(
                    data?.message || intl.formatMessage({ id: 'auth.registrationSuccessVerify' }),
                );
                redirectToEmailVerification(
                    {
                        data: {
                            email: finalData.email,
                            requires_email_verification: true,
                        },
                    },
                    router,
                    {
                        email: finalData.email,
                        password: formData.password,
                        login_type: 'email',
                        user_type: role,
                    },
                );
            })
            .catch((error) => {
                console.error('Registration error:', error);
                const responseData = error.response?.data;

                if (isAlreadyRegisteredError(error)) {
                    const msg =
                        responseData?.message ||
                        intl.formatMessage({ id: 'auth.emailAlreadyRegistered' });
                    setApiErrors({ email: msg });
                    toast.error(msg);
                    setStep(1);
                    return;
                }

                if (responseData && responseData.errors) {
                    setApiErrors(responseData.errors);
                    const step1Fields = [
                        'first_name',
                        'last_name',
                        'email',
                        'password',
                        'confirm_password',
                    ];
                    const hasStep1Errors = Object.keys(responseData.errors).some((field) =>
                        step1Fields.includes(field),
                    );
                    if (hasStep1Errors) {
                        setStep(1);
                    }
                } else if (responseData?.message) {
                    toast.error(responseData.message);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const togglePasswordVisibility1 = () => {
        setShowPassword1(!showPassword1);
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="login-image">
                    <Image
                        src={img1}
                        alt={intl.formatMessage({ id: 'auth.signupImageAlt' })}
                        width={500}
                        height={500}
                    />
                </div>
                {step === 1 ? (
                    <div className="login-content signup">
                        <AuthLogo />
                        <h1>{intl.formatMessage({ id: 'auth.createAccount' })}</h1>
                        <p>{intl.formatMessage({ id: 'auth.signupDesc' })}</p>

                        <form onSubmit={handleContinueStep1}>
                            <div className="row">
                                <div className="col-6">
                                    <div className="form-group">
                                        <label htmlFor="first-name">
                                            {intl.formatMessage({ id: 'auth.firstName' })}
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            id="first-name"
                                            placeholder="Jhon"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                        />
                                        {getFieldError('first_name') && (
                                            <div className="error-message">
                                                {getFieldError('first_name')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="form-group">
                                        <label htmlFor="last-name">
                                            {intl.formatMessage({ id: 'auth.lastName' })}
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            id="last-name"
                                            placeholder="Danialea"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                        />
                                        {getFieldError('last_name') && (
                                            <div className="error-message">
                                                {getFieldError('last_name')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">
                                    {intl.formatMessage({ id: 'auth.emailLabel' })}
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="jhon@gmail.com"
                                    value={formData.email}
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
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="********"
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

                            <div className="form-group">
                                <label htmlFor="confirm_password">
                                    {intl.formatMessage({ id: 'auth.confpasswordLabel' })}
                                </label>
                                <div className="password-input-container">
                                    <input
                                        type={showPassword1 ? 'text' : 'password'}
                                        name="confirm_password"
                                        id="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleInputChange}
                                        placeholder="********"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility1}
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
                                            {showPassword1 ? (
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
                                {getFieldError('confirm_password') && (
                                    <div className="error-message">
                                        {getFieldError('confirm_password')}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="continue-btn">
                                {intl.formatMessage({ id: 'auth.continue' })}
                            </button>

                            <p className="register-link">
                                {intl.formatMessage({ id: 'auth.alreadyHaveAccount' })}{' '}
                                <a href="/login">{intl.formatMessage({ id: 'auth.login' })}</a>
                            </p>
                            <div className="or-divider">
                                {intl.formatMessage({ id: 'auth.or' })}
                            </div>
                            <button
                                type="button"
                                className="google-btn"
                                onClick={startGoogleSignup}
                            >
                                <Image
                                    src={googleIcon}
                                    alt={intl.formatMessage({ id: 'auth.googleLogoAlt' })}
                                    width={20}
                                    height={20}
                                />
                                {intl.formatMessage({ id: 'auth.google' })}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="login-content signup">
                        <AuthLogo />
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => {
                                setGoogleSignupMode(false);
                                setStep(1);
                            }}
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
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            {intl.formatMessage({ id: 'auth.back' })}
                        </button>

                        <h1 style={{ fontSize: '24px' }}>
                            {intl.formatMessage({ id: 'auth.selectRoleTitle' })}
                        </h1>
                        <p>
                            {intl.formatMessage({
                                id: googleSignupMode
                                    ? 'auth.googleChooseRoleDesc'
                                    : 'auth.selectRoleDesc',
                            })}
                        </p>

                        <div className="role-cards-container">
                            <div
                                className={`role-card ${formData.user_type === 'O' ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                                onClick={() => !loading && handleSelectRole('O')}
                            >
                                <div className="role-icon-wrapper">
                                    <FaPaw />
                                </div>
                                <h3>{intl.formatMessage({ id: 'auth.owner' })}</h3>
                                <p>{intl.formatMessage({ id: 'auth.ownerDesc' })}</p>
                            </div>
                            <div
                                className={`role-card ${formData.user_type === 'S' ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                                onClick={() => !loading && handleSelectRole('S')}
                            >
                                <div className="role-icon-wrapper">
                                    <FaBriefcase />
                                </div>
                                <h3>{intl.formatMessage({ id: 'auth.sitter' })}</h3>
                                <p>{intl.formatMessage({ id: 'auth.sitterDesc' })}</p>
                            </div>
                        </div>
                        {googleSignupMode && formData.user_type && (
                            <GoogleLoginButton
                                disabled={loading}
                                onSuccess={handleGoogleRegister}
                                onError={() => {
                                    toast.error(
                                        intl.formatMessage({ id: 'auth.googleAuthFailed' }),
                                    );
                                }}
                            />
                        )}
                        {loading && (
                            <div className="mt-3 text-center">
                                <div className="spinner-border text-warning" role="status">
                                    <span className="visually-hidden">
                                        {intl.formatMessage({ id: 'auth.loading' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function SignupPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <Suspense fallback={null}>
                <SignupPageInner />
            </Suspense>
        </LocalIntlProvider>
    );
}
