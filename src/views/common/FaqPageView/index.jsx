'use client';

import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { publicService } from '@/services/publicService';
import './style.scss';

const FaqPageView = () => {
    const intl = useIntl();
    const [faqData, setFaqData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const response = await publicService.faqs();
                const data = response?.data || response;
                if (Array.isArray(data) && data.length > 0) {
                    const sorted = [...data].sort(
                        (a, b) => (a.order ?? 0) - (b.order ?? 0),
                    );
                    setFaqData(
                        sorted.map((item) => ({
                            id: item.id,
                            question: item.question,
                            answer: item.answer,
                        })),
                    );
                } else {
                    setFaqData([]);
                }
            } catch (err) {
                console.error('Failed to fetch FAQs:', err);
                setFaqData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="faq-page-view">
            <div className="container">
                <div className="faq-header">
                    <h1 className="faq-title">{intl.formatMessage({ id: 'faq.title' })}</h1>
                    <p className="faq-subtitle">{intl.formatMessage({ id: 'faq.subtitle' })}</p>
                </div>

                <div className="faq-list-container">
                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="faq-card faq-skeleton">
                                  <div className="skeleton-line" />
                              </div>
                          ))
                        : faqData.length > 0
                          ? faqData.map((faq, index) => (
                                <div
                                    key={faq.id ?? index}
                                    className={`faq-card ${openIndex === index ? 'open' : ''}`}
                                    onClick={() => toggleFaq(index)}
                                >
                                    <div className="faq-card-question">
                                        <h3>{faq.question}</h3>
                                        <svg
                                            className="chevron"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M6 9L12 15L18 9"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                    <div className="faq-card-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            ))
                          : (
                                <div className="no-results">
                                    <p>{intl.formatMessage({ id: 'faq.empty' })}</p>
                                </div>
                            )}
                </div>
            </div>
        </div>
    );
};

export default FaqPageView;
