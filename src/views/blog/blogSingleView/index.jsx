'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiShare2, FiCopy, FiCheck, FiChevronRight } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import BlogCard from '@/components/blogCard';
import BlogSidebar from '@/components/BlogSidebar';
import Loader from '@/components/Loader';
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

const BlogSingleView = ({ slug: initialSlug, blog: initialBlog }) => {
    const intl = useIntl();
    const slug = initialSlug || initialBlog?.slug;
    const [copiedLink, setCopiedLink] = useState(false);

    const { data: blog = initialBlog || null, isLoading: loading } = useQuery({
        queryKey: ['blogs', 'detail', slug],
        queryFn: async () => {
            if (!slug) return null;
            const res = await publicService.blogDetail(slug);
            return res?.data || null;
        },
        enabled: Boolean(slug),
    });

    const { data: relatedBlogs = [] } = useQuery({
        queryKey: ['blogs', 'related', blog?.id],
        queryFn: async () => {
            if (!blog?.id) return [];
            const res = await publicService.recentBlog(blog.id);
            const list = res?.data;
            if (Array.isArray(list)) {
                return list.filter((item) => item.id !== blog.id).slice(0, 3);
            }
            if (res?.status && Array.isArray(res?.data?.data)) {
                return res.data.data.filter((item) => item.id !== blog.id).slice(0, 3);
            }
            return [];
        },
        enabled: Boolean(blog?.id),
    });

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 3000);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    height: '70dvh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Loader text={intl.formatMessage({ id: 'blog.loadingDetails' })} />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="blog-not-found py-5 text-center">
                <div className="container py-5">
                    <h2>{intl.formatMessage({ id: 'blog.notFoundTitle' })}</h2>
                    <p className="text-muted">
                        {intl.formatMessage({ id: 'blog.notFoundDesc' })}
                    </p>
                    <Link href="/blog" className="btn-primary d-inline-block mt-3">
                        {intl.formatMessage({ id: 'blog.backToListing' })}
                    </Link>
                </div>
            </div>
        );
    }

    const imagePath =
        blog.image_url ||
        (blog.image?.startsWith('/') ? blog.image : `/images/blog/${blog.image || 'blog1.png'}`);
    const displayDate = formatDate(blog.published_at || blog.created_at || blog.date);

    return (
        <div className="blog-single-view">
            {/* Header / Breadcrumb */}
            <div className="blog-single-header">
                <div className="container">
                    {/* Breadcrumbs */}
                    <nav className="blog-breadcrumbs">
                        <Link href="/">{intl.formatMessage({ id: 'blog.breadcrumbHome' })}</Link>
                        <FiChevronRight className="separator" />
                        <Link href="/blog">{intl.formatMessage({ id: 'blog.breadcrumbBlog' })}</Link>
                        <FiChevronRight className="separator" />
                        <span className="current">{blog.title}</span>
                    </nav>

                    <div className="header-article-meta">
                        <h1 className="single-article-title">{blog.title}</h1>

                        <div className="article-author-bar justify-content-start">
                            {displayDate && (
                                <div className="meta-stats ms-0">
                                    <span className="stat-item">
                                        <FiCalendar className="icon" /> {displayDate}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Article Content & Sidebar Grid */}
            <div className="container py-5">
                <div className="row g-4">
                    <div className="col-lg-8">
                        <article className="single-article-card">
                            {/* Featured Image */}
                            <div className="featured-image-container">
                                <Image
                                    src={imagePath}
                                    width={800}
                                    height={450}
                                    alt={blog.title || intl.formatMessage({ id: 'blog.imageAlt' })}
                                    className="featured-cover-img"
                                    unoptimized={!!blog.image_url}
                                    priority
                                />
                            </div>

                            {/* Rich Article Body */}
                            {blog.content ? (
                                <div
                                    className="article-body-content"
                                    dangerouslySetInnerHTML={{ __html: blog.content }}
                                />
                            ) : (
                                <div className="article-body-content">
                                    <p>{blog.excerpt}</p>
                                </div>
                            )}

                            {/* Social Share Bar */}
                            <div className="article-footer-bar justify-content-end">
                                <div className="social-share-buttons">
                                    <span className="share-label">
                                        <FiShare2 className="icon" />{' '}
                                        {intl.formatMessage({ id: 'blog.share' })}
                                    </span>
                                    <button
                                        type="button"
                                        className="share-btn fb"
                                        title={intl.formatMessage({ id: 'blog.shareFacebook' })}
                                        onClick={() =>
                                            window.open(
                                                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                                    typeof window !== 'undefined'
                                                        ? window.location.href
                                                        : '',
                                                )}`,
                                                '_blank',
                                            )
                                        }
                                    >
                                        <FaFacebookF />
                                    </button>
                                    <button
                                        type="button"
                                        className="share-btn tw"
                                        title={intl.formatMessage({ id: 'blog.shareTwitter' })}
                                        onClick={() =>
                                            window.open(
                                                `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                                    typeof window !== 'undefined'
                                                        ? window.location.href
                                                        : '',
                                                )}&text=${encodeURIComponent(blog.title)}`,
                                                '_blank',
                                            )
                                        }
                                    >
                                        <FaTwitter />
                                    </button>
                                    <button
                                        type="button"
                                        className="share-btn li"
                                        title={intl.formatMessage({ id: 'blog.shareLinkedIn' })}
                                        onClick={() =>
                                            window.open(
                                                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                                    typeof window !== 'undefined'
                                                        ? window.location.href
                                                        : '',
                                                )}`,
                                                '_blank',
                                            )
                                        }
                                    >
                                        <FaLinkedinIn />
                                    </button>
                                    <button
                                        type="button"
                                        className="share-btn copy"
                                        title={intl.formatMessage({ id: 'blog.copyLink' })}
                                        onClick={handleCopyLink}
                                    >
                                        {copiedLink ? <FiCheck /> : <FiCopy />}
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* Sidebar */}
                    <div className="col-lg-4">
                        <BlogSidebar currentBlogId={blog.id} />
                    </div>
                </div>

                {/* Related Articles Section */}
                {relatedBlogs.length > 0 && (
                    <div className="related-articles-section mt-5 pt-4">
                        <h3 className="section-title mb-4 text-center">
                            {intl.formatMessage({ id: 'blog.relatedTitle' })}
                        </h3>
                        <div className="row g-4">
                            {relatedBlogs.map((relBlog) => (
                                <div key={relBlog.id} className="col-md-4">
                                    <BlogCard blog={relBlog} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogSingleView;
