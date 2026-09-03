import { createAppSlice } from '@/store/createAppSlice';

const initialSiteSettingsState = {
    settings: {
        header_logo: '',
        footer_logo: '',
        favicon: '',
        footer_description: '',
        facebook_link: '',
        x_link: '',
        instagram_link: '',
        youtube_link: '',
        email: '',
        number: '',
        location: '',
        map_link: '',
    },
    loading: false,
    error: null,
    fetched: false,
};

const siteSettingsSlice = createAppSlice({
    name: 'siteSettings',
    initialState: initialSiteSettingsState,
    reducers: (create) => ({
        setSiteSettings: create.reducer((state, action) => {
            state.settings = { ...state.settings, ...action.payload };
            state.fetched = true;
            state.loading = false;
            state.error = null;
        }),
        setLoading: create.reducer((state, action) => {
            state.loading = action.payload;
        }),
        setError: create.reducer((state, action) => {
            state.error = action.payload;
            state.loading = false;
        }),
    }),
    selectors: {
        selectSiteSettings: (state) => state.settings,
        selectSiteSettingsState: (state) => state,
    },
});

export const { setSiteSettings, setLoading, setError } = siteSettingsSlice.actions;
export const { selectSiteSettings, selectSiteSettingsState } = siteSettingsSlice.selectors;
export default siteSettingsSlice;
