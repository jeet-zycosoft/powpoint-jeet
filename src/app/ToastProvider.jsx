'use client';

import { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider({ children }) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const originalError = toast.error;
            const originalSuccess = toast.success;
            const originalWarn = toast.warn;
            const originalWarning = toast.warning;
            const originalInfo = toast.info;

            const checkAndHandleRawMessage = (content, type, originalFunc, options) => {
                if (content === null || content === undefined) {
                    return originalFunc(content, options);
                }
                const msg =
                    typeof content === 'string' ? content : content?.message || String(content);

                // Identify raw API response messages, network/server errors, and system stack traces
                const isRawAPIOrNetworkMsg =
                    /network error/i.test(msg) ||
                    /request failed/i.test(msg) ||
                    /status code \d+/i.test(msg) ||
                    /unexpected error/i.test(msg) ||
                    /internal server error/i.test(msg) ||
                    /unhandled exception/i.test(msg) ||
                    /failed to fetch/i.test(msg) ||
                    /sql/i.test(msg) ||
                    /database/i.test(msg) ||
                    /connection refused/i.test(msg) ||
                    /bad gateway/i.test(msg) ||
                    /service unavailable/i.test(msg) ||
                    /gateway timeout/i.test(msg) ||
                    /^error: /i.test(msg);

                if (isRawAPIOrNetworkMsg) {
                    console.error('Raw API/Network message blocked from toast:', content);
                    return; // Don't show toast popup
                }

                return originalFunc(content, options);
            };

            const withAutoClose = (options) => ({
                ...options,
                autoClose: 3000,
            });

            toast.error = (content, options) => {
                return checkAndHandleRawMessage(content, 'error', originalError, withAutoClose(options));
            };

            toast.success = (content, options) => {
                return checkAndHandleRawMessage(content, 'success', originalSuccess, withAutoClose(options));
            };

            toast.warn = (content, options) => {
                return checkAndHandleRawMessage(content, 'warn', originalWarn, withAutoClose(options));
            };

            toast.warning = (content, options) => {
                return checkAndHandleRawMessage(content, 'warning', originalWarning, withAutoClose(options));
            };

            toast.info = (content, options) => {
                return checkAndHandleRawMessage(content, 'info', originalInfo, withAutoClose(options));
            };
        }
    }, []);

    return (
        <>
            {children}
            <ToastContainer
                hideProgressBar
                autoClose={3000}
                pauseOnHover={false}
                pauseOnFocusLoss={false}
                closeOnClick
            />
        </>
    );
}
