'use client';

import React from 'react';
import './style.scss';

const Loader = ({ fullPage = false, inline = false, text, size = 'md' }) => {
    return (
        <div
            className={`pawpoint-loader ${fullPage ? 'full-page' : ''} ${inline || (!fullPage && !inline) ? 'inline' : ''} size-${size}`}
        >
            <div className="loader-ring-container">
                <svg className="loader-ring-svg" viewBox="0 0 120 120">
                    <circle className="ring-bg" cx="60" cy="60" r="50" />
                    <circle className="ring-active" cx="60" cy="60" r="50" />
                </svg>
                <div className="paw-container">
                    <svg
                        viewBox="0 0 100 100"
                        className="paw-svg"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            className="paw-pad"
                            d="M50 85 C58 85, 68 80, 70 70 C72 60, 68 52, 50 52 C32 52, 28 60, 30 70 C32 80, 42 85, 50 85 Z"
                        />
                        <circle className="paw-toe toe-1" cx="25" cy="42" r="9" />
                        <circle className="paw-toe toe-2" cx="41" cy="30" r="10" />
                        <circle className="paw-toe toe-3" cx="59" cy="30" r="10" />
                        <circle className="paw-toe toe-4" cx="75" cy="42" r="9" />
                    </svg>
                </div>
            </div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
};

export default Loader;
