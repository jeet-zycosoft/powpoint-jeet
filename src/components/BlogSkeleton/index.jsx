'use client';

import './style.scss';

export function BlogListingSkeleton() {
    return (
        <div className="blog-skeleton blog-skeleton--listing" aria-hidden="true">
            <div className="blog-skeleton__featured">
                <div className="skeleton-shimmer blog-skeleton__featured-image" />
                <div className="blog-skeleton__featured-content">
                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--title" />
                    <div className="skeleton-shimmer blog-skeleton__line" />
                    <div className="skeleton-shimmer blog-skeleton__line" />
                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--md" />
                    <div className="skeleton-shimmer blog-skeleton__btn" />
                </div>
            </div>

            <div className="blog-skeleton__grid-header">
                <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--heading" />
                <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="blog-skeleton__cards">
                        {[1, 2, 3, 4].map((item) => (
                            <div className="blog-skeleton__card" key={item}>
                                <div className="skeleton-shimmer blog-skeleton__card-image" />
                                <div className="blog-skeleton__card-body">
                                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
                                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--title" />
                                    <div className="skeleton-shimmer blog-skeleton__line" />
                                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="blog-skeleton__sidebar">
                        <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--heading" />
                        {[1, 2, 3, 4].map((item) => (
                            <div className="blog-skeleton__recent" key={item}>
                                <div className="skeleton-shimmer blog-skeleton__recent-thumb" />
                                <div className="blog-skeleton__recent-meta">
                                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
                                    <div className="skeleton-shimmer blog-skeleton__line" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function BlogDetailSkeleton() {
    return (
        <div className="blog-skeleton blog-skeleton--detail" aria-hidden="true">
            <div className="blog-skeleton__detail-hero">
                <div className="container">
                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--hero-title" />
                    <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
                </div>
            </div>
            <div className="container py-5">
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="skeleton-shimmer blog-skeleton__detail-cover" />
                        <div className="blog-skeleton__detail-body">
                            <div className="skeleton-shimmer blog-skeleton__line" />
                            <div className="skeleton-shimmer blog-skeleton__line" />
                            <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--md" />
                            <div className="skeleton-shimmer blog-skeleton__line" />
                            <div className="skeleton-shimmer blog-skeleton__line" />
                            <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="blog-skeleton__sidebar">
                            <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--heading" />
                            {[1, 2, 3].map((item) => (
                                <div className="blog-skeleton__recent" key={item}>
                                    <div className="skeleton-shimmer blog-skeleton__recent-thumb" />
                                    <div className="blog-skeleton__recent-meta">
                                        <div className="skeleton-shimmer blog-skeleton__line blog-skeleton__line--sm" />
                                        <div className="skeleton-shimmer blog-skeleton__line" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
