import { updateUserInfo } from '@/store/features/user/userSlice';
import {
    buildReplaceLocationPayload,
    getReplaceLocationErrorMessage,
    replaceOwnerLocationWithSitter,
} from './chatHelpers';

/**
 * Shared replace-location handler for chat modals.
 * On success: updates Redux and navigates to premium checkout.
 */
export const handleReplaceLocationAction = async ({
    sitterLocation,
    setReplacingLocation,
    dispatch,
    router,
    onClose,
}) => {
    const payload = buildReplaceLocationPayload(sitterLocation);
    if (!payload) {
        return {
            ok: false,
            message: 'Sitter location coordinates are missing. Cannot replace location.',
        };
    }

    try {
        setReplacingLocation?.(true);
        const { payload: savedPayload } = await replaceOwnerLocationWithSitter(sitterLocation);
        dispatch(updateUserInfo(savedPayload));
        onClose?.();
        router.push('/premium-activation?reason=location');
        return {
            ok: true,
            message: `Location updated to ${savedPayload.city || 'sitter area'}`,
        };
    } catch (err) {
        if (err.code === 'INCOMPLETE_LOCATION') {
            return { ok: false, message: err.message };
        }
        return { ok: false, message: getReplaceLocationErrorMessage(err) };
    } finally {
        setReplacingLocation?.(false);
    }
};
