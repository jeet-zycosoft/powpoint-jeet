'use client';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import './style.scss';

const InstructionsSection = () => {
    const intl = useIntl();
    const { userInfo } = useSelector((state) => state.user);

    return (
        <section className="instructions-section">
            <div className="container">
                <h1 className="section-heading">
                    {intl.formatMessage({ id: 'instructions.title' })}
                </h1>
                <div className="instructions-grid">
                    <div className="instruction-card">
                        <span className="label">
                            {intl.formatMessage({ id: 'instructions.emailAddress' })}
                        </span>
                        <span className="value email-value">{userInfo?.email}</span>
                    </div>

                    <div className="instruction-card">
                        <span className="label">
                            {intl.formatMessage({ id: 'instructions.phoneNumber' })}
                        </span>
                        <div className="value-row">
                            <button className="action-link">
                                {intl.formatMessage({ id: 'instructions.addPhoneNumber' })}
                            </button>
                            <button className="edit-icon">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                        stroke="#afaeac"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="instruction-card row-layout">
                        <span className="label">
                            {intl.formatMessage({ id: 'instructions.app' })}
                        </span>
                        <button className="action-link">
                            {intl.formatMessage({ id: 'instructions.install' })}
                        </button>
                    </div>

                    <div className="instruction-card row-layout">
                        <span className="label">
                            {intl.formatMessage({ id: 'instructions.pushNotifications' })}
                        </span>
                        <button className="action-link">
                            {intl.formatMessage({ id: 'instructions.turnOn' })}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InstructionsSection;
