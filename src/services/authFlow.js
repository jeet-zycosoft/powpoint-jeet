import { ownerService } from '@/services/ownerService';
import { evaluateProfileCompletion } from '@/services/profileCompletion';
import { sitterService } from '@/services/sitterService';
import {
    replaceUserInfo,
    setUser,
    updateServiceDetails,
} from '@/store/features/user/userSlice';

export const VERIFY_EMAIL_KEY = 'verify_email';
export const VERIFY_TOKEN_KEY = 'verify_token';
export const VERIFY_PENDING_LOGIN_KEY = 'verify_pending_login';

export function getAuthData(response) {
    return response?.data ?? response ?? {};
}

export function isEmailVerificationRequired(response) {
    const payload = getAuthData(response);
    if (response?.status === false) return false;
    return payload?.requires_email_verification === true;
}

export function saveAuthTokens(payload) {
    const token = payload?.access_token || payload?.token;
    if (typeof window === 'undefined' || !token) return null;

    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
    if (payload.refresh_token) {
        localStorage.setItem('refresh_token', payload.refresh_token);
    }
    if (payload.user) {
        localStorage.setItem('user', JSON.stringify(payload.user));
    }
    return token;
}

export function isAuthRejected(response) {
    return response?.status === false;
}

export function isGoogleUserMissing(error, response) {
    const data = error?.response?.data || response || {};
    const statusCode = error?.response?.status;
    const message = String(data?.message || data?.error || '').toLowerCase();
    return (
        statusCode === 404 ||
        message.includes('not found') ||
        message.includes('not registered') ||
        message.includes('no account') ||
        message.includes('does not exist') ||
        message.includes('unknown user')
    );
}

export function storeEmailVerificationSession(response) {
    if (typeof window === 'undefined') return;

    const payload = getAuthData(response);
    const email = payload?.email || payload?.user?.email;
    if (email) {
        sessionStorage.setItem(VERIFY_EMAIL_KEY, email);
    }
    if (payload?.verification_token) {
        sessionStorage.setItem(VERIFY_TOKEN_KEY, payload.verification_token);
    }
}

export function storePendingLogin(credentials) {
    if (typeof window === 'undefined' || !credentials?.email) return;
    sessionStorage.setItem(
        VERIFY_PENDING_LOGIN_KEY,
        JSON.stringify({
            email: credentials.email,
            password: credentials.password || '',
            login_type: credentials.login_type || 'email',
            user_type: credentials.user_type || '',
        }),
    );
}

export function consumePendingLogin() {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(VERIFY_PENDING_LOGIN_KEY);
    sessionStorage.removeItem(VERIFY_PENDING_LOGIN_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function clearEmailVerificationSession() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(VERIFY_EMAIL_KEY);
    sessionStorage.removeItem(VERIFY_TOKEN_KEY);
    sessionStorage.removeItem(VERIFY_PENDING_LOGIN_KEY);
}

export function getStoredVerifyEmail() {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(VERIFY_EMAIL_KEY) || '';
}

export function redirectToEmailVerification(response, router, pendingLogin) {
    storeEmailVerificationSession(response);
    if (pendingLogin) {
        storePendingLogin({
            ...pendingLogin,
            email: pendingLogin.email || getAuthData(response)?.email,
        });
    }
    router.push('/verify-email');
}

export function getPostAuthPath({ userType, profileData, serviceDetails } = {}) {
    const result = evaluateProfileCompletion({
        userType,
        userInfo: profileData,
        serviceDetails,
    });
    if (result.isComplete) {
        return result.listingPath;
    }
    return result.setupPath;
}

/**
 * Save tokens, load profile, then go to base-form the first time
 * (no profile data) or listing on later logins.
 */
export async function completeAuthenticatedSession({ response, dispatch, router }) {
    const resData = response?.data || response;
    saveAuthTokens(resData);
    dispatch(setUser(resData));

    const userType = resData?.user?.user_type;
    const isSitter = userType === 'S';
    const isOwner = userType === 'O';

    const fetchProfilePromise = isSitter
        ? sitterService.fetchProfile()
        : ownerService.fetchProfile();
    const fetchServicePromise = isOwner
        ? ownerService.fetchService()
        : sitterService.fetchService();

    try {
        const [profileRes, serviceRes] = await Promise.allSettled([
            fetchProfilePromise,
            fetchServicePromise,
        ]);

        let profileData = resData?.user || {};
        let serviceData = {};
        if (profileRes.status === 'fulfilled') {
            profileData =
                profileRes.value?.data || profileRes.value?.user || profileRes.value || {};
            dispatch(replaceUserInfo(profileData));
        } else {
            console.error('Error fetching profile after login:', profileRes.reason);
        }

        if (serviceRes.status === 'fulfilled') {
            serviceData = serviceRes.value?.data || serviceRes.value || {};
            dispatch(updateServiceDetails(serviceData));
        } else {
            console.error('Error fetching service details after login:', serviceRes.reason);
        }

        router.push(
            getPostAuthPath({ userType, profileData, serviceDetails: serviceData }),
        );
    } catch (err) {
        console.error('Unexpected error during login data fetch:', err);
        router.push(getPostAuthPath({ userType, profileData: resData?.user }));
    }
}

/**
 * Shared post-login / post-register gate.
 * Returns 'verification' | 'authenticated' | 'none'.
 */
export function handleAuthSuccess(response, router) {
    if (isEmailVerificationRequired(response)) {
        redirectToEmailVerification(response, router);
        return 'verification';
    }

    const payload = getAuthData(response);
    if (payload?.access_token || payload?.token) {
        saveAuthTokens(payload);
        return 'authenticated';
    }

    return 'none';
}

export function isAlreadyRegisteredError(error) {
    const responseData = error?.response?.data;
    return error?.response?.status === 409 && responseData?.status === false;
}

export function isUnverifiedEmailError(error) {
    const status = error?.response?.status;
    const message = String(
        error?.response?.data?.message || error?.response?.data?.error || '',
    ).toLowerCase();
    return status === 403 && message.includes('verif');
}
