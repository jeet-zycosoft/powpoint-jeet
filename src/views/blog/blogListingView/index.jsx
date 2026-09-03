'use client';

import BlogSidebar from '@/components/BlogSidebar';
import Loader from '@/components/Loader';
import { publicService } from '@/services/publicService';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import { FormattedMessage, useIntl } from 'react-intl';
import BlogLoadMore from './BlogLoadMore';
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

const BlogListingView = () => {
    const intl = useIntl();

    const { data: blogs = [], isLoading: loading } = useQuery({
        queryKey: ['blogs', 'list'],
        queryFn: async () => {
            const res = await publicService.blogs();
            return res.data || [];
        },
    });

    const featuredBlog = blogs.length > 0 ? blogs[0] : null;
    const remainingBlogs = blogs.length > 1 ? blogs.slice(1) : blogs;

    return (
        <div className="blog-listing-view">
            {/* Hero Banner Section */}
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

            {/* Main Content Area */}
            <div className="container py-5">
                {loading ? (
                    <div
                        style={{
                            height: '60dvh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Loader
                            text={intl.formatMessage({
                                id: 'blog.loading',
                                defaultMessage: 'Loading articles...',
                            })}
                        />
                    </div>
                ) : (
                    <>
                        {/* Featured Blog Banner */}
                        {featuredBlog && (
                            <div className="featured-blog-banner mb-5">
                                <div className="row align-items-center g-0">
                                    <div className="col-lg-6">
                                        <div className="featured-img-wrapper">
                                            <Image
                                                src={
                                                    featuredBlog.image_url ||
                                                    (featuredBlog.image?.startsWith('/')
                                                        ? featuredBlog.image
                                                        : `/images/blog/${featuredBlog.image || 'blog1.png'}`)
                                                }
                                                width={650}
                                                height={380}
                                                alt={featuredBlog.title}
                                                className="featured-img"
                                                unoptimized={!!featuredBlog.image_url}
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
                                                    )}
                                                </span>
                                            </div>
                                            <h2 className="featured-title">
                                                <Link href={`/blog/${featuredBlog.slug}`}>
                                                    {featuredBlog.title}
                                                </Link>
                                            </h2>
                                            <p className="featured-excerpt">
                                                {featuredBlog.excerpt}
                                            </p>
                                            <div className="featured-footer">
                                                <Link
                                                    href={`/blog/${featuredBlog.slug}`}
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

                        {/* Results Count Header */}
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

                        {/* Grid Layout: Main Articles + Sidebar */}
                        <div className="row g-4">
                            <div className="col-lg-8">
                                <BlogLoadMore blogs={remainingBlogs} initialCount={6} step={3} />
                            </div>

                            {/* Sidebar */}
                            <div className="col-lg-4">
                                <BlogSidebar currentBlogId={featuredBlog?.id} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BlogListingView;
