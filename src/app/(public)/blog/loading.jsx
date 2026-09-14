import { BlogListingSkeleton } from '@/components/BlogSkeleton';
import '@/views/blog/blogListingView/style.scss';

export default function BlogLoading() {
    return (
        <main>
            <div className="blog-listing-view">
                <section className="blog-hero-section">
                    <div className="container">
                        <div className="hero-content text-center">
                            <div
                                className="skeleton-shimmer"
                                style={{
                                    width: 140,
                                    height: 28,
                                    borderRadius: 999,
                                    margin: '0 auto 16px',
                                    opacity: 0.35,
                                }}
                            />
                            <div
                                className="skeleton-shimmer"
                                style={{
                                    width: 'min(520px, 90%)',
                                    height: 40,
                                    borderRadius: 10,
                                    margin: '0 auto 16px',
                                    opacity: 0.4,
                                }}
                            />
                            <div
                                className="skeleton-shimmer"
                                style={{
                                    width: 'min(640px, 95%)',
                                    height: 18,
                                    borderRadius: 8,
                                    margin: '0 auto',
                                    opacity: 0.3,
                                }}
                            />
                        </div>
                    </div>
                </section>
                <div className="container py-5">
                    <BlogListingSkeleton />
                </div>
            </div>
        </main>
    );
}
