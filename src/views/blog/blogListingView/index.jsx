'use client';

import BlogSidebar from '@/components/BlogSidebar';
import { BlogListingSkeleton } from '@/components/BlogSkeleton';
import { publicService } from '@/services/publicService';
import { useBlogLocale } from '@/hooks/useBlogLocale';
import { pickLocale, blogPostPath } from '@/utils/blogLocale';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import { FormattedMessage, useIntl } from 'react-intl';
import BlogLoadMore from './BlogLoadMore';
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

const BlogListingView = ({ locale: localeProp } = {}) => {
    const intl = useIntl();
    const locale = useBlogLocale(localeProp);

    const {
        data: blogs = [],
        isLoading,
        isFetching,
        isPending,
    } = useQuery({
        queryKey: ['blogs', 'list', locale],
        queryFn: async () => {
            const res = await publicService.blogs({ locale, per_page: 50, page: 1 });
            return res.data || [];
        },
    });

    const showSkeleton = isLoading || isPending || (isFetching && blogs.length === 0);

    const featuredBlog = blogs.length > 0 ? blogs[0] : null;
    const remainingBlogs = blogs.length > 1 ? blogs.slice(1) : blogs;
    const featuredTitle = featuredBlog ? pickLocale(featuredBlog.title, locale) : '';
    const featuredExcerpt = featuredBlog ? pickLocale(featuredBlog.excerpt, locale) : '';
    const featuredImage =
        featuredBlog?.image_url ||
        (featuredBlog?.image?.startsWith('/')
            ? featuredBlog.image
            : `/images/blog/${featuredBlog?.image || 'blog1.png'}`);

    return (
        <div className="blog-listing-view">
            <section className="blog-hero-section">
                <div className="container">
                    <div className="hero-content text-center">
                        <span className="hero-subheading">
                            {intl.formatMessage({
                                id: 'blog.heroSubheading',
                                defaultMessage: 'Knowledge & Care',
                            })}
                        </span>
                        <h1 className="hero-title">
                            <FormattedMessage
                                id="blog.heroTitle"
                                defaultMessage="PawPoint <span>Pet Care</span> Blog & Advice"
                                values={{ span: (chunks) => <span>{chunks}</span> }}
                            />
                        </h1>
                        <p className="hero-desc">
                            {intl.formatMessage({
                                id: 'blog.heroDesc',
                                defaultMessage:
                                    'Discover expert pet care guides, dog training tips, feline wellness advice, and heartwarming stories from our community of pet sitters and owners.',
                            })}
                        </p>
                    </div>
                </div>
            </section>

            <div className="container py-5">
                {showSkeleton ? (
                    <BlogListingSkeleton />
                ) : (
                    <>
                        {featuredBlog && (
                            <div className="featured-blog-banner mb-5">
                                <div className="row align-items-stretch g-0">
                                    <div className="col-lg-6">
                                        <div className="featured-img-wrapper">
                                            <Image
                                                src={featuredImage}
                                                alt={featuredTitle}
                                                fill
                                                sizes="(max-width: 991px) 100vw, 647px"
                                                className="featured-img"
                                                unoptimized={!!featuredBlog.image_url}
                                                priority
                                            />
                                            <span className="featured-badge">
                                                {intl.formatMessage({ id: 'blog.featuredArticle' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="featured-content">
                                            <div className="featured-meta">
                                                <span className="meta-date">
                                                    <FiCalendar className="icon" />{' '}
                                                    {formatDate(
                                                        featuredBlog.published_at ||
                                                            featuredBlog.created_at,
                                                        locale,
                                                    )}
                                                </span>
                                            </div>
                                            <h2 className="featured-title">
                                                <Link href={blogPostPath(locale, featuredBlog.slug)}>
                                                    {featuredTitle}
                                                </Link>
                                            </h2>
                                            <p className="featured-excerpt">{featuredExcerpt}</p>
                                            <div className="featured-footer">
                                                <Link
                                                    href={blogPostPath(locale, featuredBlog.slug)}
                                                    className="read-btn"
                                                >
                                                    {intl.formatMessage({ id: 'blog.readFullPost' })}{' '}
                                                    <FiArrowRight />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h4 className="fw-bold mb-0">
                                {intl.formatMessage({ id: 'blog.latestArticles' })}
                            </h4>
                            <div className="results-count text-muted">
                                {intl.formatMessage({ id: 'blog.showing' })}{' '}
                                <strong>{blogs.length}</strong>{' '}
                                {intl.formatMessage({
                                    id: blogs.length === 1 ? 'blog.article' : 'blog.articles',
                                })}
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-lg-8">
                                <BlogLoadMore blogs={remainingBlogs} initialCount={6} step={3} />
                            </div>
                            <div className="col-lg-4">
                                <BlogSidebar currentBlogId={featuredBlog?.id} locale={locale} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BlogListingView;
