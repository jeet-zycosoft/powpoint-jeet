const PERSON_KEY_PREFIX = 'pawpoint.chat.myPersonId.';

export const readStoredPersonId = (userId) => {
    if (!userId || typeof window === 'undefined') return '';
    try {
        return localStorage.getItem(`${PERSON_KEY_PREFIX}${userId}`) || '';
    } catch {
        return '';
    }
};

export const writeStoredPersonId = (userId, personId) => {
    if (!userId || !personId || typeof window === 'undefined') return;
    try {
        localStorage.setItem(`${PERSON_KEY_PREFIX}${userId}`, String(personId));
    } catch {
        // ignore quota / private mode
    }
};
