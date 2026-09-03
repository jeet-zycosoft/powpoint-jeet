'use client';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiArrowRight } from 'react-icons/fi';
import { useIntl } from 'react-intl';
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

const BlogCard = ({ blog }) => {
    const intl = useIntl();
    if (!blog) return null;

    const blogUrl = blog.slug ? `/blog/${blog.slug}` : '/blog';
    const imagePath =
        blog.image_url ||
        (blog.image?.startsWith('/') ? blog.image : `/images/blog/${blog.image || 'blog1.png'}`);
    const displayDate = formatDate(blog.published_at || blog.created_at || blog.date);

    return (
        <div className="blog-card">
            <div className="blog-card__image-wrapper">
                <Link href={blogUrl} className="blog-card__img-link">
                    <Image
                        src={imagePath}
                        width={400}
                        height={250}
                        alt={blog.title || intl.formatMessage({ id: 'common.blogPost' })}
                        className="blog-card__img"
                        unoptimized={!!blog.image_url}
                    />
                </Link>
            </div>

            <div className="blog-content">
                <div className="blog-card__meta">
                    {displayDate && (
                        <span className="blog-card__meta-item">
                            <FiCalendar className="icon" /> {displayDate}
                        </span>
                    )}
                </div>

                <h3 className="blog-card__title">
                    <Link href={blogUrl}>{blog.title}</Link>
                </h3>

                {blog.excerpt && <p className="blog-card__excerpt">{blog.excerpt}</p>}

                <div className="blog-card__footer">
                    <Link href={blogUrl} className="blog-card__read-more">
                        {intl.formatMessage({ id: 'common.readArticle' })}{' '}
                        <FiArrowRight className="arrow-icon" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BlogCard;
