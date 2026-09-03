/**
 * In-memory JWT cache for apiClient.
 * Kept outside apiClient so logout/session cleanup can clear it
 * without circular imports through the Redux user slice.
 */

let cachedAuthToken = null;
let cachedAuthExp = 0;

export function getAuthTokenCache() {
    return { token: cachedAuthToken, exp: cachedAuthExp };
}

export function setAuthTokenCache(token, exp = 0) {
    cachedAuthToken = token || null;
    cachedAuthExp = exp || 0;
}

export function clearAuthTokenCache() {
    cachedAuthToken = null;
    cachedAuthExp = 0;
}
