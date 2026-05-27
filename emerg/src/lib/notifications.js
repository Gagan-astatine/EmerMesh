
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notifications.')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

export function showNotification(title, options = {}) {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
        try {
            new Notification(title, {
                icon: '/logo192.png',
                badge: '/logo192.png',
                vibrate: [200, 100, 200],
                ...options
            })
        } catch (e) {
            console.error('Failed to show notification:', e)
        }
    }
}
