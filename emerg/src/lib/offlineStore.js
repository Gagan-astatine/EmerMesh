const STORAGE_KEY = 'emermesh_offline_queue';

export function saveOfflineMessage(message) {
    try {
        const queue = getOfflineMessages();
        queue.push({
            ...message,
            queuedAt: Date.now()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
        console.error('Failed to save message offline:', err);
    }
}

export function getOfflineMessages() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Failed to retrieve offline messages:', err);
        return [];
    }
}

export function clearOfflineMessages() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error('Failed to clear offline storage queue:', err);
    }
}
