const FOOTER_LOCATIONS = [
    { name: 'Manchester', query: 'Manchester, United Kingdom' },
    { name: 'London', query: 'London, United Kingdom' },
    { name: 'Birmingham', query: 'Birmingham, United Kingdom' },
    { name: 'Leeds', query: 'Leeds, United Kingdom' },
    { name: 'Glasgow', query: 'Glasgow, United Kingdom' },
    { name: 'Liverpool', query: 'Liverpool, United Kingdom' },
    { name: 'Bristol', query: 'Bristol, United Kingdom' },
    { name: 'Edinburgh', query: 'Edinburgh, United Kingdom' },
    { name: 'Sheffield', query: 'Sheffield, United Kingdom' },
    { name: 'Newcastle', query: 'Newcastle, United Kingdom' },
    { name: 'Nottingham', query: 'Nottingham, United Kingdom' },
    { name: 'Leicester', query: 'Leicester, United Kingdom' },
    { name: 'Southampton', query: 'Southampton, United Kingdom' },
    { name: 'Brighton', query: 'Brighton, United Kingdom' },
    { name: 'Oxford', query: 'Oxford, United Kingdom' },
    { name: 'Cambridge', query: 'Cambridge, United Kingdom' },
    { name: 'Cardiff', query: 'Cardiff, United Kingdom' },
    { name: 'Belfast', query: 'Belfast, United Kingdom' },
    { name: 'York', query: 'York, United Kingdom' },
    { name: 'Bath', query: 'Bath, United Kingdom' },
    { name: 'Plymouth', query: 'Plymouth, United Kingdom' },
    { name: 'Coventry', query: 'Coventry, United Kingdom' },
    { name: 'Reading', query: 'Reading, United Kingdom' },
    { name: 'Milton Keynes', query: 'Milton Keynes, United Kingdom' },
];

export const toCitySlug = (name) =>
    String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const getFooterLocationBySlug = (slug) =>
    FOOTER_LOCATIONS.find((location) => toCitySlug(location.name) === toCitySlug(slug));

export const getFooterCityPath = (location) => `/${toCitySlug(location.name)}`;

export const isFooterCityPath = (pathname = '') => {
    const segment = String(pathname)
        .replace(/^\//, '')
        .split('/')[0];
    if (!segment || String(pathname).replace(/^\//, '').includes('/')) return false;
    return Boolean(getFooterLocationBySlug(segment));
};

export default FOOTER_LOCATIONS;
