import { clearAuthTokenCache } from '@/services/authTokenCache';

// Keep in sync with authFlow.js VERIFY_* keys (avoid importing authFlow — circular risk).
const AUTH_LOCAL_KEYS = ['token', 'refresh_token', 'reduxState'];
const AUTH_SESSION_KEYS = ['verify_email', 'verify_token', 'verify_pending_login'];
const CHAT_KEY_PREFIXES = ['pawpoint.chat.myPersonId.'];
const CHAT_EXACT_KEYS = ['pawpoint.chat.lastRead'];

/**
 * Wipe all client-side auth / user session data.
 * Safe to call from logout, token expiry, and before a fresh login/register.
 * Does NOT clear language preference or public catalogs.
 */
export function clearClientSession() {
    clearAuthTokenCache();

    if (typeof window === 'undefined') return;

    try {
        AUTH_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
        CHAT_EXACT_KEYS.forEach((key) => localStorage.removeItem(key));

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (CHAT_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
        // ignore quota / private mode
    }

    try {
        AUTH_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
    } catch {
        // ignore
    }
}
