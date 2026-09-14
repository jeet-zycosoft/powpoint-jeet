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
import BlogSeoHead from '@/components/BlogSeoHead';
import { BlogDetailSkeleton } from '@/components/BlogSkeleton';
import { publicService } from '@/services/publicService';
import { useBlogLocale } from '@/hooks/useBlogLocale';
import { pickLocale, blogListPath } from '@/utils/blogLocale';
import { buildBlogSeo } from '@/utils/blogSeo';
import './style.scss';

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

const BlogSingleView = ({ slug: initialSlug, blog: initialBlog, locale: localeProp }) => {
    const intl = useIntl();
    const locale = useBlogLocale(localeProp);
    const slug = initialSlug || initialBlog?.slug;
    const [copiedLink, setCopiedLink] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    const {
        data: blog = initialBlog || null,
        isLoading,
        isFetching,
        isPending,
    } = useQuery({
        queryKey: ['blogs', 'detail', slug, locale],
        queryFn: async () => {
            if (!slug) return null;
            const res = await publicService.blogDetail({ slug, locale });
            return res?.data || null;
        },
        enabled: Boolean(slug),
    });

    const { data: relatedBlogs = [] } = useQuery({
        queryKey: ['blogs', 'related', blog?.id, locale],
        queryFn: async () => {
            if (!blog?.id) return [];
            const res = await publicService.recentBlog({ id: blog.id, locale });
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

    const showSkeleton = isLoading || isPending || (isFetching && !blog);

    const handleCopyLink = async () => {
        if (typeof window === 'undefined') return;

        const url = window.location.href;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 3000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    if (showSkeleton) {
        return <BlogDetailSkeleton />;
    }

    if (!blog) {
        return (
            <div className="blog-not-found py-5 text-center">
                <div className="container py-5">
                    <h2>{intl.formatMessage({ id: 'blog.notFoundTitle' })}</h2>
                    <p className="text-muted">
                        {intl.formatMessage({ id: 'blog.notFoundDesc' })}
                    </p>
                    <Link href={blogListPath(locale)} className="btn-primary d-inline-block mt-3">
                        {intl.formatMessage({ id: 'blog.backToListing' })}
                    </Link>
                </div>
            </div>
        );
    }

    const seo = buildBlogSeo(blog, locale);
    const title = seo?.title || pickLocale(blog.title, locale);
    const excerpt = seo?.excerpt || pickLocale(blog.excerpt, locale);
    const content = seo?.content || pickLocale(blog.content, locale);
    const imagePath =
        seo?.imageUrl ||
        blog.image_url ||
        (blog.image?.startsWith('/') ? blog.image : `/images/blog/${blog.image || 'blog1.png'}`);
    const displayDate = formatDate(blog.published_at || blog.created_at || blog.date, locale);
    const faqItems = seo?.faqItems || [];

    return (
        <div className="blog-single-view">
            <BlogSeoHead blog={blog} locale={locale} />

            {/* Header / Breadcrumb */}
            <div className="blog-single-header">
                <div className="container">
                    {/* Breadcrumbs */}
                    <nav className="blog-breadcrumbs">
                        <Link href="/">{intl.formatMessage({ id: 'blog.breadcrumbHome' })}</Link>
                        <FiChevronRight className="separator" />
                        <Link href={blogListPath(locale)}>
                            {intl.formatMessage({ id: 'blog.breadcrumbBlog' })}
                        </Link>
                        <FiChevronRight className="separator" />
                        <span className="current">{title}</span>
                    </nav>

                    <div className="header-article-meta">
                        <h1 className="single-article-title">{title}</h1>

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
                                    alt={title || intl.formatMessage({ id: 'blog.imageAlt' })}
                                    className="featured-cover-img"
                                    unoptimized={!!(seo?.imageUrl || blog.image_url)}
                                    priority
                                />
                            </div>

                            {/* Rich Article Body */}
                            {content ? (
                                <div
                                    className="article-body-content"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            ) : (
                                <div className="article-body-content">
                                    <p>{excerpt}</p>
                                </div>
                            )}

                            {/* FAQ from schema.faq_items */}
                            {faqItems.length > 0 && (
                                <div className="article-faq-section mt-4">
                                    <h2 className="h4 mb-3">
                                        {intl.formatMessage({
                                            id: 'blog.faqTitle',
                                            defaultMessage: 'Frequently Asked Questions',
                                        })}
                                    </h2>
                                    <div className="blog-faq-list">
                                        {faqItems.map((item, index) => {
                                            const isOpen = openFaqIndex === index;
                                            return (
                                                <div
                                                    key={`faq-${index}`}
                                                    className={`blog-faq-item${isOpen ? ' open' : ''}`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="blog-faq-question"
                                                        aria-expanded={isOpen}
                                                        onClick={() =>
                                                            setOpenFaqIndex(isOpen ? null : index)
                                                        }
                                                    >
                                                        <span>{item.question}</span>
                                                        <span className="blog-faq-chevron" aria-hidden>
                                                            {isOpen ? '−' : '+'}
                                                        </span>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="blog-faq-answer">
                                                            <p>{item.answer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
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
                                                )}&text=${encodeURIComponent(title)}`,
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
                        <BlogSidebar currentBlogId={blog.id} locale={locale} />
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
