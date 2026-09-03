import { clearClientSession } from '@/services/sessionCleanup';
import { createAppSlice } from '@/store/createAppSlice';

const initialUserState = {
    userInfo: null,
    token: null,
    isAuthenticated: false,
    location: 'unknown',
    serviceDetails: null,
};

// If you are not using async thunks you can use the standalone `createSlice`.
const userSlice = createAppSlice({
    name: 'user',
    initialState: initialUserState,
    reducers: (create) => ({
        setUser: create.reducer((state, action) => {
            // Drop any previous account session before applying the new one
            clearClientSession();

            let user = action.payload.user;
            if (user) {
                if (
                    user.profile_photo &&
                    typeof user.profile_photo === 'object' &&
                    user.profile_photo.url
                ) {
                    user = { ...user, profile_photo: user.profile_photo };
                }
                if (user.gallery_photos && Array.isArray(user.gallery_photos)) {
                    user = {
                        ...user,
                        gallery_photos: user.gallery_photos,
                    };
                }
            }
            state.userInfo = user;
            state.token = action.payload.access_token;
            state.isAuthenticated = true;
            state.location = action.payload.location || 'unknown';
            // Never carry over the previous user's service details
            state.serviceDetails = action.payload.serviceDetails || null;
            if (typeof window !== 'undefined' && action.payload.access_token) {
                localStorage.setItem('token', action.payload.access_token);
                if (action.payload.refresh_token) {
                    localStorage.setItem('refresh_token', action.payload.refresh_token);
                }
            }
        }),
        logout: create.reducer((state) => {
            state.userInfo = null;
            state.token = null;
            state.isAuthenticated = false;
            state.location = 'unknown';
            state.serviceDetails = null;
            clearClientSession();
        }),
        changeLocation: create.reducer((state, action) => {
            state.location = action.payload;
        }),
        updateUserInfo: create.reducer((state, action) => {
            let payload = { ...action.payload };
            if (payload.gallery_photos && Array.isArray(payload.gallery_photos)) {
                payload.gallery_photos = payload.gallery_photos;
            }
            if (state.userInfo) {
                state.userInfo = { ...state.userInfo, ...payload };
            } else {
                state.userInfo = payload;
            }
        }),
        replaceUserInfo: create.reducer((state, action) => {
            let payload = { ...action.payload };
            if (payload.gallery_photos && Array.isArray(payload.gallery_photos)) {
                payload.gallery_photos = payload.gallery_photos;
            }
            state.userInfo = payload;
        }),
        updateServiceDetails: create.reducer((state, action) => {
            state.serviceDetails = action.payload;
        }),
    }),
    selectors: {
        selectUser: (state) => state,
    },
});

export const {
    setUser,
    logout,
    changeLocation,
    updateUserInfo,
    replaceUserInfo,
    updateServiceDetails,
} = userSlice.actions;
export const { selectUser } = userSlice.selectors;
export default userSlice;
