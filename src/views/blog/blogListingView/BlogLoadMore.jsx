'use client';

import { useState } from 'react';
import BlogCard from '@/components/blogCard';
import { FiFrown } from 'react-icons/fi';
import { useIntl } from 'react-intl';

const BlogLoadMore = ({ blogs = [], initialCount = 6, step = 3 }) => {
    const intl = useIntl();
    const [visibleCount, setVisibleCount] = useState(initialCount);

    if (!blogs || blogs.length === 0) {
        return (
            <div className="no-blogs-found py-5 text-center">
                <div className="empty-icon-wrapper mb-3">
                    <FiFrown size={48} className="empty-icon" />
                </div>
                <h3>{intl.formatMessage({ id: 'blog.noArticlesFound' })}</h3>
                <p className="text-muted">{intl.formatMessage({ id: 'blog.noArticlesDesc' })}</p>
            </div>
        );
    }

    const displayedBlogs = blogs.slice(0, visibleCount);
    const hasMore = visibleCount < blogs.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + step);
    };

    return (
        <div className="blog-load-more-section">
            <div className="row g-4">
                {displayedBlogs.map((blog) => (
                    <div key={blog.id || blog.slug} className="col-md-6">
                        <BlogCard blog={blog} />
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="mt-5 text-center">
                    <button
                        className="btn-primary load-more-btn"
                        onClick={handleLoadMore}
                        type="button"
                    >
                        {intl.formatMessage({ id: 'blog.loadMore' })}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BlogLoadMore;
