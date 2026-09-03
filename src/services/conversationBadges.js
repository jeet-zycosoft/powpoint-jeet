const LAST_READ_KEY = 'pawpoint.chat.lastRead';
const ALERTS_EVENT = 'pawpoint:chat-alerts';

const toId = (value) => {
    if (value == null || value === '') return '';
    return String(value);
};

const readLastReadMap = () => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(LAST_READ_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const writeLastReadMap = (map) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(ALERTS_EVENT));
};

const pickNumber = (...values) => {
    for (const value of values) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
    return null;
};

const pickBool = (...values) => values.some((value) => value === true);

export const isPendingAccept = (convo = {}) => {
    const nested = convo.conversation && typeof convo.conversation === 'object' ? convo.conversation : {};
    const status = String(convo.status || nested.status || '').toLowerCase();
    const uiAction = convo.ui_action || nested.ui_action || '';
    const canAccept = pickBool(convo.can_accept, nested.can_accept);
    const isAcceptor = pickBool(convo.is_acceptor, nested.is_acceptor);
    const isInitiator = pickBool(convo.is_initiator, nested.is_initiator);

    if (canAccept || uiAction === 'SHOW_ACCEPT_CONVERSATION_POPUP') {
        return true;
    }

    if (status !== 'pending_acceptance') return false;
    if (isInitiator && !isAcceptor) return false;
    return true;
};

export const getApiUnreadCount = (convo = {}) => {
    const nested = convo.conversation && typeof convo.conversation === 'object' ? convo.conversation : {};
    return pickNumber(
        convo.unread_count,
        convo.unread,
        convo.unread_messages,
        convo.new_message_count,
        convo.unread_message_count,
        nested.unread_count,
        nested.unread,
    );
};

export const markConversationRead = (otherUserId, updatedAt) => {
    const id = toId(otherUserId);
    if (!id) return;
    const map = readLastReadMap();
    map[id] = {
        at: Date.now(),
        updatedAt: updatedAt || map[id]?.updatedAt || null,
    };
    writeLastReadMap(map);
};

export const seedConversationBaselines = (conversations = []) => {
    if (typeof window === 'undefined') return;
    const map = readLastReadMap();
    let changed = false;
    conversations.forEach((convo) => {
        const id = toId(convo?.other_user_id);
        if (!id || map[id]) return;
        const updatedAt = convo.updated_at || convo.conversation?.updated_at;
        map[id] = {
            at: Date.parse(updatedAt) || Date.now(),
            updatedAt: updatedAt || null,
        };
        changed = true;
    });
    if (changed) {
        localStorage.setItem(LAST_READ_KEY, JSON.stringify(map));
    }
};

export const getUnreadCount = (convo = {}, { activeChatId, unreadByRoom } = {}) => {
    const id = toId(convo.other_user_id);
    const roomId = toId(convo.room_id || convo.conversation?.room_id);
    if (activeChatId && id && toId(activeChatId) === id) return 0;
    if (roomId && unreadByRoom && typeof unreadByRoom === 'object') {
        return Number(unreadByRoom[roomId]) || 0;
    }
    return 0;
};

export const decorateConversation = (convo = {}, options = {}) => {
    const pendingAccept = isPendingAccept(convo);
    const unreadCount = getUnreadCount(convo, options);
    return {
        ...convo,
        pendingAccept,
        unreadCount,
    };
};

export const getConversationAlertTotals = (conversations = [], options = {}) => {
    return conversations.reduce(
        (acc, convo) => {
            const unread = Number(convo.unreadCount) || getUnreadCount(convo, options);
            const pending = convo.pendingAccept ?? isPendingAccept(convo);
            acc.unreadTotal += unread;
            if (pending) acc.pendingAcceptCount += 1;
            if (unread > 0 || pending) acc.alertCount += 1;
            return acc;
        },
        { unreadTotal: 0, pendingAcceptCount: 0, alertCount: 0 },
    );
};

export const subscribeToChatAlerts = (callback) => {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener(ALERTS_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
        window.removeEventListener(ALERTS_EVENT, handler);
        window.removeEventListener('storage', handler);
    };
};
