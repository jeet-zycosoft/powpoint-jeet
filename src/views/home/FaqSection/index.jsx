'use client';
import { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { publicService } from '@/services/publicService';
import './style.scss';

const FaqSection = () => {
    const intl = useIntl();
    const [openIndex, setOpenIndex] = useState(null);
    const [faqData, setFaqData] = useState([]);
    const [loading, setLoading] = useState(true);

    const staticFaqs = [
        {
            question: intl.formatMessage({ id: 'home.faq.q1' }),
            answer: intl.formatMessage({ id: 'home.faq.a1' }),
        },
        {
            question: intl.formatMessage({ id: 'home.faq.q2' }),
            answer: intl.formatMessage({ id: 'home.faq.a2' }),
        },
        {
            question: intl.formatMessage({ id: 'home.faq.q3' }),
            answer: intl.formatMessage({ id: 'home.faq.a3' }),
        },
        {
            question: intl.formatMessage({ id: 'home.faq.q4' }),
            answer: intl.formatMessage({ id: 'home.faq.a4' }),
        },
        {
            question: intl.formatMessage({ id: 'home.faq.q5' }),
            answer: intl.formatMessage({ id: 'home.faq.a5' }),
        },
    ];

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
                            question: item.question,
                            answer: item.answer,
                        })),
                    );
                } else {
                    setFaqData(staticFaqs);
                }
            } catch (err) {
                console.error('Failed to fetch FAQs:', err);
                setFaqData(staticFaqs);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="faq-section">
            <div className="container">
                <h2 className="section-heading">
                    <FormattedMessage
                        id="home.faq.heading"
                        values={{ span: (chunks) => <span>{chunks}</span> }}
                    />
                </h2>
                <p className="section-desc">{intl.formatMessage({ id: 'home.faq.desc' })}</p>
            </div>
            <div className="px-md-5 container">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="faq-item faq-skeleton">
                              <div className="faq-question">
                                  <div className="skeleton-line" />
                              </div>
                          </div>
                      ))
                    : faqData.map((faq, index) => (
                          <div
                              key={index}
                              className={`faq-item ${openIndex === index ? 'open' : ''}`}
                              onClick={() => toggleFaq(index)}
                          >
                              <div className="faq-question">
                                  <p>{faq.question}</p>
                                  <svg
                                      className="chevron"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                  >
                                      <path
                                          d="M6 9L12 15L18 9"
                                          stroke="#4a766e"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                      />
                                  </svg>
                              </div>
                              <div className="faq-answer">
                                  <p>{faq.answer}</p>
                              </div>
                          </div>
                      ))}
            </div>
        </div>
    );
};

export default FaqSection;
