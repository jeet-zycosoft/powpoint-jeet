/**
 * Shared chat helpers
 */

import { ownerService } from './ownerService';

/**
 * Parse can-chat response consistently across all entry points
 * @param {Object} response - The response from chatService.canChat
 * @returns {Object} Parsed can-chat data
 */
const pickFlag = (...values) => {
    for (const value of values) {
        if (typeof value === 'boolean') return value;
    }
    return false;
};

export const parseCanChat = (response) => {
    const data = response?.data || response;
    const nested = data?.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : {};
    const convo =
        data?.conversation && typeof data.conversation === 'object' ? data.conversation : {};

    const uiAction = data?.ui_action || nested?.ui_action || '';
    const isInitiator = pickFlag(data?.is_initiator, nested?.is_initiator, convo?.is_initiator);
    const isAcceptor = pickFlag(data?.is_acceptor, nested?.is_acceptor, convo?.is_acceptor);
    const canAccept = pickFlag(data?.can_accept, nested?.can_accept, convo?.can_accept);
    const canDecline = pickFlag(data?.can_decline, nested?.can_decline, convo?.can_decline);
    const canSend = pickFlag(data?.can_send, nested?.can_send, convo?.can_send);
    const canRead = pickFlag(data?.can_read, nested?.can_read, convo?.can_read);

    // Extract quota for Accept popup
    const sitterQuota = data?.sitter_quota || nested?.sitter_quota || null;

    return {
        uiAction,
        message: data?.message || nested?.message || 'Chat process verification required.',
        canSend,
        canRead,
        canAccept,
        canDecline,
        isInitiator,
        isAcceptor,
        sitterQuota,
        requiresAcceptance: pickFlag(
            data?.requires_acceptance,
            nested?.requires_acceptance,
            convo?.requires_acceptance,
        ),
        reason: data?.reason || nested?.reason || '',
        result: data?.result || nested?.result || '',
    };
};

const unwrapDataObject = (response) => {
    if (!response || typeof response !== 'object') return {};
    const data = response.data && typeof response.data === 'object' && !Array.isArray(response.data)
        ? response.data
        : response;
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return data.data;
    }
    return data;
};

export const unwrapChatStart = (response) => {
    const data = unwrapDataObject(response);
    const convo = data.conversation && typeof data.conversation === 'object' ? data.conversation : {};
    const roomId = data.room_id || data.roomId || convo.room_id || convo.roomId || null;
    const myChatPersonId =
        data.my_chat_person_id || data.myChatPersonId || data.chat_person_id || null;
    const otherChatPersonId =
        data.other_chat_person_id || data.otherChatPersonId || null;

    return {
        roomId: roomId ? String(roomId) : null,
        myChatPersonId: myChatPersonId ? String(myChatPersonId) : null,
        otherChatPersonId: otherChatPersonId ? String(otherChatPersonId) : null,
        otherUser: unwrapProfileDetail(data.other_user || data.sitter || data.owner),
        raw: data,
    };
};

export const normalizeChatMessage = (msg) => {
    if (!msg || typeof msg !== 'object') return null;

    const senderId =
        msg.senderId || msg.sender_id || msg.personId || msg.person_id || msg.userId || null;
    const roomId = msg.roomId || msg.room_id || null;
    const text = msg.message || msg.body || msg.text || '';
    const createdAt = msg.createdAt || msg.created_at || msg.created || new Date().toISOString();
    const id = msg.id || msg.messageId || msg._id || null;
    const fallbackId = `${roomId || 'msg'}-${senderId || 'user'}-${createdAt}-${String(text).slice(0, 24)}`;
    const messageId = id != null ? String(id) : fallbackId;

    return {
        ...msg,
        id: messageId,
        messageId,
        roomId: roomId ? String(roomId) : roomId,
        senderId: senderId != null ? String(senderId) : senderId,
        personId: senderId != null ? String(senderId) : msg.personId,
        message: text,
        body: text,
        createdAt,
        created_at: createdAt,
    };
};

export const normalizeHistoryMessages = (response) => {
    const list =
        response?.result?.messages ||
        response?.data?.messages ||
        response?.data?.data ||
        response?.data ||
        response;
    const messagesList = Array.isArray(list) ? list : [];
    // io-chat / Laravel history is newest first — reverse for chronological UI
    return [...messagesList].reverse().map(normalizeChatMessage).filter(Boolean);
};

export const upsertLiveMessage = (prev, incoming) => {
    const next = normalizeChatMessage(incoming);
    if (!next) return prev;

    const sameId = (msg) =>
        String(msg.id) === String(next.id) || String(msg.messageId) === String(next.messageId);

    if (prev.some(sameId)) {
        return prev.map((msg) => (sameId(msg) ? { ...msg, ...next, sending: false } : msg));
    }

    const withoutOptimistic = prev.filter(
        (msg) =>
            !(
                msg.sending &&
                String(msg.body) === String(next.body) &&
                String(msg.personId || msg.senderId) === String(next.senderId)
            ),
    );
    return [...withoutOptimistic, next];
};

export const unwrapProfileDetail = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const detail = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : raw;
    const nested = detail.sitter || detail.owner || detail.user;
    if (nested && typeof nested === 'object') {
        return { ...detail, ...nested };
    }
    return detail;
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const toLocationString = (value) => {
    if (value == null || value === false) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'object') {
        return String(
            value.name ||
                value.label ||
                value.title ||
                value.state ||
                value.city ||
                value.long_name ||
                '',
        ).trim();
    }
    return String(value).trim();
};

const normalizeText = (value) => toLocationString(value).toLowerCase();

export const pickUserLocation = (user) => {
    const loc = user?.location && typeof user.location === 'object' ? user.location : {};

    return {
        address: toLocationString(user?.address || loc.address),
        city: toLocationString(user?.city || loc.city),
        state: toLocationString(user?.state || loc.state),
        country: toLocationString(user?.country || loc.country),
        latitude: user?.latitude ?? loc.latitude ?? loc.lat ?? null,
        longitude: user?.longitude ?? loc.longitude ?? loc.long ?? loc.lng ?? null,
    };
};

export const isDifferentArea = (ownerLocation, sitterLocation) => {
    if (!ownerLocation || !sitterLocation) return false;

    const ownerLat = toNumber(ownerLocation.latitude);
    const ownerLng = toNumber(ownerLocation.longitude);
    const sitterLat = toNumber(sitterLocation.latitude);
    const sitterLng = toNumber(sitterLocation.longitude);

    if (ownerLat != null && ownerLng != null && sitterLat != null && sitterLng != null) {
        const sameLat = Math.abs(ownerLat - sitterLat) < 0.0001;
        const sameLng = Math.abs(ownerLng - sitterLng) < 0.0001;
        return !(sameLat && sameLng);
    }

    const ownerCity = normalizeText(ownerLocation.city);
    const sitterCity = normalizeText(sitterLocation.city);
    if (ownerCity && sitterCity) {
        return ownerCity !== sitterCity;
    }

    return false;
};

/**
 * Build location-only payload for replace-location flow.
 * Returns null if latitude/longitude are missing or not numeric.
 */
export const buildReplaceLocationPayload = (sitterLocation) => {
    if (!sitterLocation) return null;

    const latitude = toNumber(sitterLocation.latitude);
    const longitude = toNumber(sitterLocation.longitude);

    if (latitude == null || longitude == null) {
        return null;
    }

    const city = toLocationString(sitterLocation.city);
    const address = toLocationString(sitterLocation.address) || city;
    const state = toLocationString(sitterLocation.state);
    const country = toLocationString(sitterLocation.country);

    return {
        address,
        city,
        state,
        country,
        latitude,
        longitude,
    };
};

/**
 * Map update-service 422/validation errors to user-facing copy.
 */
export const getReplaceLocationErrorMessage = (err) => {
    const errors = err?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        if (errors.latitude?.[0]) return errors.latitude[0];
        if (errors.longitude?.[0]) return errors.longitude[0];
        const firstFieldError = Object.values(errors).flat().find(Boolean);
        if (firstFieldError) return firstFieldError;
    }
    return (
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update location. Please try again.'
    );
};

/**
 * Replace owner location with sitter location via update-service (location fields only).
 */
export const replaceOwnerLocationWithSitter = async (sitterLocation) => {
    const payload = buildReplaceLocationPayload(sitterLocation);
    if (!payload) {
        const error = new Error('Sitter location coordinates are missing.');
        error.code = 'INCOMPLETE_LOCATION';
        throw error;
    }

    const res = await ownerService.updateService(payload);
    if (!res?.status) {
        const error = new Error(res?.message || 'Failed to update location.');
        error.code = 'UPDATE_FAILED';
        throw error;
    }

    return { payload, res };
};
