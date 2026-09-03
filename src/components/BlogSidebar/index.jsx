'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiMail, FiCheck } from 'react-icons/fi';
import { useIntl } from 'react-intl';
import { publicService } from '@/services/publicService';
import './style.scss';

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
};

const BlogSidebar = ({ currentBlogId }) => {
    const intl = useIntl();
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentPosts = async () => {
            try {
                setLoading(true);
                const res = await publicService.recentBlog(currentBlogId || 1);
                if (res?.data && Array.isArray(res.data)) {
                    setRecentPosts(res.data.slice(0, 4));
                } else if (res?.status && Array.isArray(res?.data?.data)) {
                    setRecentPosts(res.data.data.slice(0, 4));
                }
            } catch (err) {
                console.error('Error fetching recent blogs for sidebar:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentPosts();
    }, [currentBlogId]);

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (newsletterEmail.trim()) {
            setIsSubscribed(true);
            setNewsletterEmail('');
            setTimeout(() => setIsSubscribed(false), 4000);
        }
    };

    return (
        <aside className="blog-sidebar">
            {/* Recent Posts Widget */}
            <div className="sidebar-widget widget-recent-posts">
                <h4 className="widget-title">
                    {intl.formatMessage({ id: 'blogSidebar.recentPosts' })}
                </h4>
                <div className="recent-posts-list">
                    {loading ? (
                        <p className="text-muted small">
                            {intl.formatMessage({ id: 'common.loading' })}
                        </p>
                    ) : recentPosts.length > 0 ? (
                        recentPosts.map((post) => {
                            const postImg =
                                post.image_url ||
                                (post.image?.startsWith('/')
                                    ? post.image
                                    : `/images/blog/${post.image || 'blog1.png'}`);
                            const displayDate = formatDate(
                                post.published_at || post.created_at || post.date,
                            );

                            return (
                                <div key={post.id} className="recent-post-item">
                                    <Link href={`/blog/${post.slug}`} className="recent-post-thumb">
                                        <Image
                                            src={postImg}
                                            width={70}
                                            height={70}
                                            alt={post.title || intl.formatMessage({ id: 'common.blogPost' })}
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
                                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
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
                    <h4>Pet Care Newsletter</h4>
                    <p>Get expert pet tips, nutrition guides, and sitter news sent to your inbox.</p>
                    {isSubscribed ? (
                        <div className="newsletter-success">
                            <FiCheck className="check-icon" /> Subscribed successfully!
                        </div>
                    ) : (
                        <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
                            <input
                                type="email"
                                required
                                placeholder="Your email address"
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                className="newsletter-input"
                            />
                            <button type="submit" className="newsletter-btn">
                                Subscribe Now
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default BlogSidebar;
