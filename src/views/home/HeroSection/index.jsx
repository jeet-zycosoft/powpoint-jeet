'use client';
import Image from 'next/image';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import SearchBar from '@/views/home/SearchBar';
import './style.scss';

const HeroSection = ({ sectionData, showSearch = false }) => {
    const intl = useIntl();

    return (
        <section className={`hero-section ${showSearch ? 'hero-section--with-search' : ''}`}>
            <div className="hero-section__media" aria-hidden>
                <Image
                    src={sectionData?.bannerImgLink || ''}
                    alt=""
                    className="hero-bg-image desktop"
                    loading="eager"
                    width={2000}
                    height={2000}
                />
                {sectionData?.bannerMobImgLink && (
                    <Image
                        src={sectionData?.bannerMobImgLink}
                        alt=""
                        className="hero-bg-image mobile"
                        loading="eager"
                        width={1000}
                        height={1000}
                    />
                )}
            </div>
            <div className="container hero-section__inner">
                <div
                    className={`hero-section__content ${showSearch ? 'col-lg-7 col-md-9' : 'col-md-6'}`}
                >
                    <h1 className="section-heading">
                        <FormattedMessage
                            id={sectionData?.headingKey || 'home.hero.heading'}
                            values={{ span: (chunks) => <span>{chunks}</span> }}
                        />
                    </h1>
                    <p className="section-desc">
                        {intl.formatMessage({ id: sectionData?.descKey || 'home.hero.desc' })}
                    </p>
                    {showSearch ? (
                        <>
                            <SearchBar variant="hero" />
                            <Link
                                href={sectionData?.buttonLink || '/sitter/listing'}
                                className="hero-section__browse-link"
                            >
                                {intl.formatMessage({
                                    id: sectionData?.buttonTextKey || 'home.hero.buttonText',
                                })}
                                <span aria-hidden="true">→</span>
                            </Link>
                        </>
                    ) : (
                        <Link href={sectionData?.buttonLink || '#'} className="btn-primary">
                            {intl.formatMessage({
                                id: sectionData?.buttonTextKey || 'home.hero.buttonText',
                            })}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
