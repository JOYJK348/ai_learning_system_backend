export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on the server-side Node.js environment
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';
    
    // Skip if running locally to avoid spamming local terminal logs
    if (API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1')) {
      console.log('[ZHI Backend Startup] Local environment detected. Skipping self-ping loop.');
      return;
    }

    console.log(`[ZHI Backend Startup] Initializing 24/7 warm self-ping loop targeting: ${API_BASE}`);

    // Self-ping function
    const pingSelf = async () => {
      try {
        const url = `${API_BASE.replace(/\/$/, '')}/api/auth/me`;
        const res = await fetch(url, { method: 'GET' });
        console.log(`[ZHI Self-Ping] Keep-alive ping executed to ${url} -> status ${res.status}`);
      } catch (err) {
        console.error('[ZHI Self-Ping] Keep-alive ping failed:', err instanceof Error ? err.message : err);
      }
    };

    // Run first ping after 1 minute of starting
    setTimeout(() => {
      pingSelf();
    }, 60000);

    // Ping every 10 minutes to stay awake (Railway idle timeout is 30 mins)
    setInterval(() => {
      pingSelf();
    }, 10 * 60 * 1000);
  }
}
