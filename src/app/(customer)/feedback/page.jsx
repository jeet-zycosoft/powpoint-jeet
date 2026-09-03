'use client';

import { useIntl } from 'react-intl';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';
import './feedback.scss';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const FeedbackPageInner = () => {
    const intl = useIntl();

    const submitForm = (e) => {
        e.preventDefault();
    };

    return (
        <div className="feedback-container">
            <h1 className="section-heading">
                {intl.formatMessage({ id: 'feedback.title' })}
            </h1>
            <form className="feedback-form" onSubmit={submitForm}>
                <div className="form-group">
                    <label htmlFor="name">
                        {intl.formatMessage({ id: 'feedback.name' })}
                    </label>
                    <input type="text" id="name" defaultValue="VB nclient1" />
                </div>
                <div className="form-group">
                    <label htmlFor="email">
                        {intl.formatMessage({ id: 'feedback.email' })}
                    </label>
                    <input
                        type="email"
                        id="email"
                        defaultValue="virtualbull-nclient1@yopmail.com"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="message">
                        {intl.formatMessage({ id: 'feedback.messageLabel' })}
                    </label>
                    <textarea
                        id="message"
                        placeholder={intl.formatMessage({ id: 'feedback.messagePlaceholder' })}
                    ></textarea>
                </div>
                <button type="submit" className="btn-primary">
                    {intl.formatMessage({ id: 'feedback.send' })}
                </button>
            </form>
        </div>
    );
};

export default function FeedbackPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <FeedbackPageInner />
        </LocalIntlProvider>
    );
}
