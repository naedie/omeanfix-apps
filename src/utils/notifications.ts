/**
 * Local Web Notification API & Audio Chime Utility
 * Enables Web Notification API (browser push) & synthesized sound chime
 */

export interface OrderNotificationPayload {
  id: string;
  orderId?: string;
  orderCode: string;
  title: string;
  message: string;
  statusType: 'baru' | 'proses' | 'jadwal' | 'pembayaran' | 'selesai' | 'batal' | 'info';
  timestamp: string;
  isRead?: boolean;
}

/**
 * Synthesizes a native-like 2-tone chime using Web Audio API
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Tone 1: High crisp bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Warm harmonious echo
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22); // D6
    gain2.gain.setValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (err) {
    // Audio context may be restricted before user gesture
    console.debug('Audio notification not playable yet:', err);
  }
}

/**
 * Requests browser permission for local push notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.debug('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Sends a native local Web Notification if permitted
 */
export function sendLocalPushNotification(title: string, options?: NotificationOptions) {
  // Always trigger sound & vibration
  playNotificationSound();
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([150, 75, 150]);
    } catch (_) {}
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: 'https://cdn-icons-png.flaticon.com/128/4151/4151151.png',
          badge: 'https://cdn-icons-png.flaticon.com/128/4151/4151151.png',
          ...options
        });
      } catch (err) {
        console.debug('Web Notification API call failed:', err);
      }
    }
  }
}
