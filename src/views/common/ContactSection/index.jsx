'use client';

import { publicService } from '@/services/publicService';
import { selectUser } from '@/store/features/user/userSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './style.scss';

const initialState = {
    name: '',
    email: '',
    message: '',
    isRobot: false,
};

const getUserName = (user) => {
    if (!user) return '';
    if (user.name) return user.name;
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.join(' ');
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'TOGGLE_ROBOT':
            return { ...state, isRobot: !state.isRobot };
        case 'SET_INITIAL_USER':
            return {
                ...state,
                name: state.name || action.name || '',
                email: state.email || action.email || '',
            };
        case 'RESET_FORM':
            return {
                ...initialState,
                name: action.name || '',
                email: action.email || '',
            };
        default:
            return state;
    }
}

const ContactSection = () => {
    const intl = useIntl();
    const router = useRouter();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { userInfo } = useSelector(selectUser);

    useEffect(() => {
        if (userInfo) {
            const name = getUserName(userInfo);
            const email = userInfo.email || '';
            dispatch({ type: 'SET_INITIAL_USER', name, email });
        }
    }, [userInfo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        dispatch({ type: 'SET_FIELD', field: name, value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedName = state.name?.trim();
        const trimmedEmail = state.email?.trim();
        const trimmedMessage = state.message?.trim();

        if (!trimmedName) {
            toast.warning(intl.formatMessage({ id: 'contact.validation.nameRequired' }));
            return;
        }

        if (!trimmedEmail) {
            toast.warning(intl.formatMessage({ id: 'contact.validation.emailRequired' }));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            toast.warning(intl.formatMessage({ id: 'contact.validation.emailInvalid' }));
            return;
        }

        if (!trimmedMessage) {
            toast.warning(intl.formatMessage({ id: 'contact.validation.messageRequired' }));
            return;
        }

        if (!state.isRobot) {
            toast.warning(intl.formatMessage({ id: 'contact.validation.robotRequired' }));
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                name: trimmedName,
                email: trimmedEmail,
                message: trimmedMessage,
            };

            // API responds 201 with { message } and may omit a boolean `status` field.
            // Axios already rejects non-2xx, so a resolved call means success.
            const response = await publicService.contactUs(payload);

            dispatch({
                type: 'RESET_FORM',
                name: getUserName(userInfo),
                email: userInfo?.email || '',
            });

            if (response?.message) {
                toast.success(response.message);
            }

            router.push('/thank-you');
        } catch (error) {
            console.error('Error sending contact message:', error);
            const errorMsg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                intl.formatMessage({ id: 'contact.errorFallback' });
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="contact-section">
            <div className="container">
                <h1 className="contact-title">{intl.formatMessage({ id: 'contact.title' })}</h1>
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">{intl.formatMessage({ id: 'contact.nameLabel' })}</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={state.name}
                            onChange={handleChange}
                            placeholder={intl.formatMessage({ id: 'contact.namePlaceholder' })}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">
                            {intl.formatMessage({ id: 'contact.emailLabel' })}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={state.email}
                            onChange={handleChange}
                            placeholder={intl.formatMessage({ id: 'contact.emailPlaceholder' })}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">
                            {intl.formatMessage({ id: 'contact.messageLabel' })}
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={state.message}
                            onChange={handleChange}
                            placeholder={intl.formatMessage({ id: 'contact.messagePlaceholder' })}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group recaptcha-container">
                        <div className="recaptcha-mock">
                            <div className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="robot"
                                    checked={state.isRobot}
                                    onChange={() => dispatch({ type: 'TOGGLE_ROBOT' })}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="robot">
                                    {intl.formatMessage({ id: 'contact.robotLabel' })}
                                </label>
                            </div>
                            <div className="recaptcha-logo">
                                <img
                                    src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                                    alt={intl.formatMessage({ id: 'contact.recaptchaAlt' })}
                                />
                                <span>reCAPTCHA</span>
                                <div className="terms">Privacy - Terms</div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="send-button" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                <span>{intl.formatMessage({ id: 'contact.sending' })}</span>
                            </>
                        ) : (
                            intl.formatMessage({ id: 'contact.send' })
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default ContactSection;
