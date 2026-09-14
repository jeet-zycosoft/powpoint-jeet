'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiMail, FiCheck } from 'react-icons/fi';
import { useIntl } from 'react-intl';
import { publicService } from '@/services/publicService';
import { normalizeLocale, pickLocale, blogPostPath } from '@/utils/blogLocale';
import './style.scss';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDate = (dateString, locale = 'en') => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
};

const BlogSidebar = ({ currentBlogId, locale: localeProp }) => {
    const intl = useIntl();
    const locale = normalizeLocale(localeProp || intl.locale);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState(''); // success | already | error
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchRecentPosts = async () => {
            try {
                setLoading(true);
                const res = await publicService.recentBlog({
                    id: currentBlogId || 1,
                    locale,
                });
                if (cancelled) return;
                if (res?.data && Array.isArray(res.data)) {
                    setRecentPosts(res.data.slice(0, 4));
                } else if (res?.status && Array.isArray(res?.data?.data)) {
                    setRecentPosts(res.data.data.slice(0, 4));
                } else {
                    setRecentPosts([]);
                }
            } catch (err) {
                console.error('Error fetching recent blogs for sidebar:', err);
                if (!cancelled) setRecentPosts([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchRecentPosts();
        return () => {
            cancelled = true;
        };
    }, [currentBlogId, locale]);

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const email = newsletterEmail.trim();
        setStatusMessage('');
        setStatusType('');

        if (!EMAIL_PATTERN.test(email)) {
            setStatusType('error');
            setStatusMessage(
                intl.formatMessage({ id: 'blogSidebar.newsletterInvalidEmail' }),
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await publicService.blogNewsletterSubscribe({
                email,
                locale,
            });
            const apiMessage = typeof res?.message === 'string' ? res.message.trim() : '';
            const already = /already subscribed/i.test(apiMessage);

            setNewsletterEmail('');
            setStatusType(already ? 'already' : 'success');
            setStatusMessage(
                already
                    ? intl.formatMessage({ id: 'blogSidebar.newsletterAlready' })
                    : intl.formatMessage({ id: 'blogSidebar.newsletterSuccess' }),
            );
        } catch (err) {
            const apiMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message;
            setStatusType('error');
            setStatusMessage(
                typeof apiMessage === 'string' && apiMessage.trim()
                    ? apiMessage
                    : intl.formatMessage({ id: 'blogSidebar.newsletterError' }),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const showSuccessState = statusType === 'success' || statusType === 'already';

    return (
        <aside className="blog-sidebar">
            {/* Recent Posts Widget */}
            <div className="sidebar-widget widget-recent-posts">
                <h4 className="widget-title">
                    {intl.formatMessage({ id: 'blogSidebar.recentPosts' })}
                </h4>
                <div className="recent-posts-list">
                    {loading ? (
                        <div className="blog-sidebar-skeleton" aria-hidden="true">
                            {[1, 2, 3, 4].map((item) => (
                                <div className="blog-sidebar-skeleton__row" key={item}>
                                    <div className="skeleton-shimmer blog-sidebar-skeleton__thumb" />
                                    <div className="blog-sidebar-skeleton__meta">
                                        <div className="skeleton-shimmer blog-sidebar-skeleton__line blog-sidebar-skeleton__line--sm" />
                                        <div className="skeleton-shimmer blog-sidebar-skeleton__line" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentPosts.length > 0 ? (
                        recentPosts.map((post) => {
                            const postTitle = pickLocale(post.title, locale);
                            const postImg =
                                post.image_url ||
                                (post.image?.startsWith('/')
                                    ? post.image
                                    : `/images/blog/${post.image || 'blog1.png'}`);
                            const displayDate = formatDate(
                                post.published_at || post.created_at || post.date,
                                locale,
                            );

                            return (
                                <div key={post.id} className="recent-post-item">
                                    <Link
                                        href={blogPostPath(locale, post.slug)}
                                        className="recent-post-thumb"
                                    >
                                        <Image
                                            src={postImg}
                                            width={70}
                                            height={70}
                                            alt={
                                                postTitle ||
                                                intl.formatMessage({ id: 'common.blogPost' })
                                            }
                                            unoptimized={!!post.image_url}
                                        />
                                    </Link>
                                    <div className="recent-post-info">
                                        {displayDate && (
                                            <span className="post-date">
                                                <FiCalendar className="icon" /> {displayDate}
                                            </span>
                                        )}
                                        <h5 className="post-title">
                                            <Link href={blogPostPath(locale, post.slug)}>
                                                {postTitle}
                                            </Link>
                                        </h5>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-muted small">
                            {intl.formatMessage({ id: 'blogSidebar.noPosts' })}
                        </p>
                    )}
                </div>
            </div>

            {/* Newsletter Box */}
            <div className="sidebar-widget widget-newsletter">
                <div className="newsletter-card">
                    <div className="icon-wrapper">
                        <FiMail className="newsletter-icon" />
                    </div>
                    <h4>{intl.formatMessage({ id: 'blogSidebar.newsletterTitle' })}</h4>
                    <p>{intl.formatMessage({ id: 'blogSidebar.newsletterDesc' })}</p>
                    {showSuccessState ? (
                        <div className="newsletter-success" role="status">
                            <FiCheck className="check-icon" /> {statusMessage}
                        </div>
                    ) : (
                        <form onSubmit={handleNewsletterSubmit} className="newsletter-form" noValidate>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder={intl.formatMessage({
                                    id: 'blogSidebar.newsletterPlaceholder',
                                })}
                                value={newsletterEmail}
                                onChange={(e) => {
                                    setNewsletterEmail(e.target.value);
                                    if (statusType === 'error') {
                                        setStatusMessage('');
                                        setStatusType('');
                                    }
                                }}
                                className="newsletter-input"
                                disabled={isSubmitting}
                                aria-invalid={statusType === 'error'}
                            />
                            <button
                                type="submit"
                                className="newsletter-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? intl.formatMessage({
                                          id: 'blogSidebar.newsletterSubmitting',
                                      })
                                    : intl.formatMessage({ id: 'blogSidebar.newsletterButton' })}
                            </button>
                            {statusType === 'error' && statusMessage ? (
                                <p className="newsletter-error" role="alert">
                                    {statusMessage}
                                </p>
                            ) : null}
                        </form>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default BlogSidebar;
