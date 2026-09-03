import { logout } from '@/store/features/user/userSlice';
import { isFooterCityPath } from '@/data/footerLocations';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
    clearAuthTokenCache,
    getAuthTokenCache,
    setAuthTokenCache,
} from '@/services/authTokenCache';
import { clearClientSession } from '@/services/sessionCleanup';

let store;

export const injectStore = (_store) => {
    store = _store;
};

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;

    const now = Date.now() / 1000;
    const storageToken = localStorage.getItem('token');

    // Always prefer localStorage. If it was cleared (logout) or rotated (new login),
    // drop the in-memory cache so we never keep serving the previous user's JWT.
    if (!storageToken) {
        clearAuthTokenCache();
    } else {
        const cached = getAuthTokenCache();
        if (cached.token && cached.token === storageToken && cached.exp > now + 5) {
            return cached.token;
        }
    }

    const readAndCache = (token) => {
        if (!token) return null;
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp && decoded.exp < now) {
                clearLocalAuth();
                return null;
            }
            setAuthTokenCache(token, decoded.exp || now + 60);
            return token;
        } catch (error) {
            console.error('Error decoding token in interceptor:', error);
            clearLocalAuth();
            return null;
        }
    };

    if (storageToken) return readAndCache(storageToken);

    const serializedState = localStorage.getItem('reduxState');
    if (!serializedState) return null;
    try {
        const parsed = JSON.parse(serializedState);
        return readAndCache(parsed?.user?.token);
    } catch (e) {
        console.error('Error parsing reduxState from localStorage:', e);
        return null;
    }
};

const isPublicPath = (pathname = '') => {
    return (
        pathname === '/' ||
        pathname.startsWith('/sitter/listing') ||
        pathname.startsWith('/customer/listing') ||
        isFooterCityPath(pathname) ||
        pathname.startsWith('/blog') ||
        pathname.startsWith('/contact') ||
        pathname === '/sitter' ||
        pathname.startsWith('/worker-details') ||
        pathname.startsWith('/faq') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/verify-email') ||
        pathname.startsWith('/forgot-password')
    );
};

const clearLocalAuth = () => {
    clearClientSession();
    if (store) {
        store.dispatch(logout());
    }
};

const handleTokenExpiry = () => {
    if (typeof window === 'undefined') return;
    clearLocalAuth();
    if (!isPublicPath(window.location.pathname)) {
        window.location.href = '/login';
    }
};

// Create an Axios instance
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '', // Set your base API URL here
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        if (!config.headers) {
            config.headers = {};
        }
        if (config.skipAuth) {
            delete config.headers.Authorization;
            return config;
        }
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Handle request error
        return Promise.reject(error);
    },
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Process successful response
        return response;
    },
    (error) => {
        // Handle global response errors
        const message =
            error.response?.data?.message || error.message || 'An unexpected error occurred';
        console.log('API Error message', message);

        // Redirect to login and clear store on 401 Unauthorized, except if the request itself was a login attempt
        const isLoginRequest =
            error.config?.url &&
            (error.config.url === 'login' || error.config.url.endsWith('/login'));
        const isAuthFlowRequest =
            isLoginRequest ||
            (error.config?.url &&
                (error.config.url === 'register' ||
                    error.config.url.endsWith('/register') ||
                    error.config.url.includes('verify-email') ||
                    error.config.url.includes('request-email-verification')));
        if (error.response?.status === 401 && !isAuthFlowRequest && !error.config?.skipAuth) {
            handleTokenExpiry();
        }
        return Promise.reject(error);
    },
);

export default apiClient;
