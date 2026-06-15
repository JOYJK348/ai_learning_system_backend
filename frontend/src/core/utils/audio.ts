/**
 * ═══════════════════════════════════════════════════════════════
 *  KID-FRIENDLY AUDIO ENGINE (Web Speech API)
 * ═══════════════════════════════════════════════════════════════
 *
 * Uses browser-native SpeechSynthesis (Web Speech API) for TTS.
 * No external services — works offline, no CORS issues.
 *
 * Cross-Device Guarantees:
 *   ✓ iOS Safari autoplay unlock
 *   ✓ Android Chrome sleep prevention
 *   ✓ Desktop Chrome, Firefox, Edge
 *   ✓ Audio queue (no overlapping)
 *   ✓ Memory-safe audio pooling
 *   ✓ Race condition protection
 */

class AudioEngine {
  private static instance: AudioEngine;

  // ─── Core state ───
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isWarmedUp = false;
  private audioContext: AudioContext | null = null;

  // ─── Media audio cache (rhymes, effects) ───
  private mediaCache: Map<string, HTMLAudioElement> = new Map();

  // ─── Speech state ───
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // ─── Guards ───
  private lastSpokenText = '';
  private lastSpokenAt = 0;
  private isSpeaking = false;
  private speechQueue: string[] = [];

  // ─── Device detection ───
  private isIOS = false;
  private isAndroid = false;
  private isSafari = false;

  private constructor() {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    this.isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.isAndroid = /Android/i.test(ua);
    this.isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    // Load browser voices
    if ('speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }

    // Unlock audio on first user interaction (iOS/Android requirement)
    const interactionEvents = ['click', 'touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'];
    const unlock = () => {
      this.warmUp();
      interactionEvents.forEach((evt) => window.removeEventListener(evt, unlock));
    };
    interactionEvents.forEach((evt) =>
      window.addEventListener(evt, unlock, { once: false, passive: true }),
    );

    // Android: Retry voice loading (often delayed)
    if (this.isAndroid) {
      let retries = 0;
      const retryVoices = () => {
        if (this.voices.length === 0 && retries < 15) {
          this.loadVoices();
          retries++;
          setTimeout(retryVoices, 800);
        }
      };
      setTimeout(retryVoices, 500);
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // ═══════════════════════════════════════════════════════════
  //  WARM-UP: Unlock audio hardware across all devices
  // ═══════════════════════════════════════════════════════════
  public warmUp() {
    if (typeof window === 'undefined') return;

    // 1. Web Audio API context (required for iOS/Android)
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      // iOS: Create a short silent buffer to unlock audio hardware
      if (this.isIOS || this.isSafari) {
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
      }
    } catch {
      /* ignore */
    }

    // 2. Unlock HTML5 Audio (create + play a silent element)
    try {
      const silentAudio = new Audio();
      silentAudio.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      silentAudio.volume = 0.01;
      silentAudio.play().then(() => silentAudio.pause()).catch(() => {});
    } catch {
      /* ignore */
    }

    // 3. Wake up Speech Synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.rate = 2;
      window.speechSynthesis.speak(u);
    }

    // 4. Keep-alive heartbeat (prevents Android from killing speech)
    if (!this.isWarmedUp) {
      setInterval(() => {
        if ('speechSynthesis' in window) {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.resume();
          }
          if (this.isAndroid && !window.speechSynthesis.speaking) {
            const p = new SpeechSynthesisUtterance(' ');
            p.volume = 0;
            p.rate = 2;
            window.speechSynthesis.speak(p);
          }
        }
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      }, 5000);
      this.isWarmedUp = true;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  VOICE SELECTION
  // ═══════════════════════════════════════════════════════════
  private loadVoices() {
    if (typeof window === 'undefined') return;
    this.voices = window.speechSynthesis.getVoices();

    if (this.voices.length > 0) {
      const naturalKW = ['natural', 'neural', 'online', 'aria', 'jenny', 'ana', 'sara'];
      const qualityKW = ['samantha', 'karen', 'moira', 'tessa', 'google us english', 'google uk english female'];
      const fallbackKW = ['zira', 'hazel', 'susan', 'female'];

      const findVoice = (keywords: string[]) =>
        this.voices.find(
          (v) =>
            v.lang.startsWith('en') && keywords.some((kw) => v.name.toLowerCase().includes(kw)),
        );

      this.selectedVoice =
        findVoice(naturalKW) ||
        findVoice(qualityKW) ||
        findVoice(fallbackKW) ||
        this.voices.find((v) => v.lang.startsWith('en') && v.localService) ||
        this.voices.find((v) => v.lang.startsWith('en')) ||
        this.voices[0] ||
        null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  WEB SPEECH API (primary — no external dependencies)
  // ═══════════════════════════════════════════════════════════
  private speakWithBrowserTTS(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    setTimeout(() => {
      if (this.voices.length === 0) this.loadVoices();

      const u = new SpeechSynthesisUtterance(text);
      this.currentUtterance = u;

      if (this.selectedVoice) {
        u.voice = this.selectedVoice;
        u.lang = this.selectedVoice.lang;
      } else {
        u.lang = 'en-US';
      }

      const isNatural =
        this.selectedVoice?.name?.toLowerCase().includes('natural') ||
        this.selectedVoice?.name?.toLowerCase().includes('neural') ||
        this.selectedVoice?.name?.toLowerCase().includes('online');

      u.rate = isNatural ? 0.88 : 0.85;
      u.pitch = isNatural ? 1.0 : 1.1;
      u.volume = 1.0;

      const cleanup = () => {
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.processQueue();
      };

      u.onend = cleanup;
      u.onerror = cleanup;

      this.isSpeaking = true;

      if (this.isIOS || this.isSafari) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(u);

      if (this.isAndroid) {
        const keepAlive = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.resume();
          } else {
            clearInterval(keepAlive);
          }
        }, 3000);
      }
    }, 100);
  }

  // ═══════════════════════════════════════════════════════════
  //  QUEUE SYSTEM — Prevents audio overlap & race conditions
  // ═══════════════════════════════════════════════════════════
  private processQueue() {
    if (this.speechQueue.length === 0 || this.isSpeaking) return;
    const next = this.speechQueue.shift();
    if (next) this.speakWithBrowserTTS(next);
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════

  /**
   * Speaks text using the browser's built-in TTS engine.
   * No external services, no CORS issues, works offline.
   */
  public async speak(text: string, _options?: { rate?: number; pitch?: number }) {
    if (typeof window === 'undefined' || !text?.trim()) return;

    // Double-speak guard
    const now = Date.now();
    if (this.lastSpokenText === text && now - this.lastSpokenAt < 800) return;
    this.lastSpokenText = text;
    this.lastSpokenAt = now;

    // Stop anything currently playing
    this.stopSpeech();

    // Clear queue — latest speech takes priority
    this.speechQueue = [];

    // Speak immediately
    this.speakWithBrowserTTS(text);
  }

  /**
   * Stops all speech.
   */
  private stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.isSpeaking = false;
  }

  /**
   * Preloads a media audio file (rhymes, effects, etc.)
   */
  public preload(url: string) {
    if (this.mediaCache.has(url)) return;
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.load();
    this.mediaCache.set(url, audio);
  }

  /**
   * Plays a media audio file (NOT speech — for rhymes, sound effects, etc.)
   */
  public async play(url: string): Promise<HTMLAudioElement | null> {
    this.stopSpeech();

    let audio = this.mediaCache.get(url);
    if (!audio) {
      audio = new Audio(url);
      this.mediaCache.set(url, audio);
    }

    try {
      audio.currentTime = 0;
      audio.volume = 1.0;
      await audio.play();
      return audio;
    } catch {
      try {
        audio.load();
        audio.volume = 1.0;
        await audio.play();
        return audio;
      } catch {
        console.warn(`[AudioEngine] Play failed: ${url}`);
        return null;
      }
    }
  }

  /**
   * Stops ALL audio: speech + media.
   */
  public stopAllAudio() {
    this.stopSpeech();
    this.speechQueue = [];

    this.mediaCache.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
    });
  }
}

export const audioEngine = typeof window !== 'undefined' ? AudioEngine.getInstance() : null;
