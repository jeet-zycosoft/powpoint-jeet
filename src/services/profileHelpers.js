const dropKeys = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return obj;
    const cleaned = { ...obj };
    keys.forEach((k) => delete cleaned[k]);
    return cleaned;
};

const META_KEYS = ['status', 'message', 'errors', 'meta', 'links', 'timestamp'];

export function unwrapOwnProfile(response) {
    if (!response) return null;

    let profile = response.data?.profile || response.data?.user || response.data || response;

    if (Array.isArray(profile)) {
        profile = profile[0];
    }

    return dropKeys(profile, META_KEYS);
}

export function unwrapOwnService(response) {
    if (!response) return null;

    let service =
        response.data?.service || response.data?.service_details || response.data || response;

    if (Array.isArray(service)) {
        service = service[0];
    }

    return dropKeys(service, META_KEYS);
}
