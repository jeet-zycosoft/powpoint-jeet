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

export function getLanguageName(item) {
    if (item == null) return '';
    if (typeof item === 'string') return item.trim();
    if (typeof item !== 'object') return String(item);

    const name =
        item.lang_long || item.long || item.name || item.label || item.language || item.lang;
    return typeof name === 'string' ? name.trim() : '';
}

export function formatLanguagesList(languages, emptyLabel = '') {
    if (!languages) return emptyLabel;
    if (typeof languages === 'string') return languages;

    if (Array.isArray(languages)) {
        return languages.map(getLanguageName).filter(Boolean).join(', ') || emptyLabel;
    }

    if (typeof languages === 'object') {
        return (
            Object.entries(languages)
                .filter(([, checked]) => Boolean(checked))
                .map(([name]) => name)
                .join(', ') || emptyLabel
        );
    }

    return emptyLabel;
}
