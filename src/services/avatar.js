export const DEFAULT_AVATAR = '/images/default-avatar.svg';

const isUsableUrl = (value) => {
    if (typeof value !== 'string') return false;
    const img = value.trim();
    if (!img || img === 'null' || img === 'undefined') return false;
    if (img.includes('xsgames.co/randomusers') || img.includes('i.pravatar.cc')) return false;
    return true;
};

export const resolveAvatarUrl = (...sources) => {
    for (const source of sources) {
        if (!source) continue;

        let img = source;
        if (typeof source === 'object') {
            img =
                source.url ||
                source.file_url ||
                source.original_url ||
                source.full_url ||
                source.image_url ||
                source.preview ||
                '';
        }
        if (!isUsableUrl(img)) continue;

        img = String(img).trim();
        if (
            img.startsWith('data:') ||
            img.startsWith('blob:') ||
            img.startsWith('http://') ||
            img.startsWith('https://') ||
            img.startsWith('/')
        ) {
            return img;
        }
        return `/images/sitter_thumb/${img}`;
    }

    return DEFAULT_AVATAR;
};
