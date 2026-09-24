/**
 * PTE Speaking Module - Core Engine
 * Audio Recording, Speech Recognition, Timer, and Scoring
 */

window.PTE = window.PTE || {};

// ── Audio Recorder ─────────────────────────────────────────────

PTE.AudioRecorder = {
  mediaRecorder: null,
  audioChunks: [],
  audioBlob: null,
  audioUrl: null,
  mimeType: 'audio/webm',
  stream: null,
  audioContext: null,
  analyser: null,
  dataArray: null,
  isRecording: false,
  animationId: null,

  _micConstraints() {
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    };
  },

  _pickMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  },

  _blobType() {
    if (this.mediaRecorder && this.mediaRecorder.mimeType) return this.mediaRecorder.mimeType;
    return this.mimeType || 'audio/webm';
  },

  async init() {
    try {
      if (this.stream && this.isStreamActive()) {
        return true;
      }
      this.cleanup();
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(this._micConstraints());
      } catch (constraintErr) {
        console.warn('[Recorder] Constrained mic failed, retrying basic audio:', constraintErr);
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      return false;
    }
  },

  start() {
    if (!this.stream) {
      console.warn('[Recorder] No stream available');
      return false;
    }

    // Check stream is alive
    if (!this.stream.getTracks().some(t => t.readyState === 'live')) {
      console.warn('[Recorder] Stream tracks are ended, need re-init');
      return false;
    }

    // Resume AudioContext if suspended (mobile browser policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try { this.audioContext.resume(); } catch(e) {}
    }

    this.audioChunks = [];
    this.audioBlob = null;
    if (this.audioUrl) {
      try { URL.revokeObjectURL(this.audioUrl); } catch (e) {}
    }
    this.audioUrl = null;

    const mimeType = this._pickMimeType();
    this.mimeType = mimeType || 'audio/webm';

    try {
      const options = { audioBitsPerSecond: 128000 };
      if (mimeType) options.mimeType = mimeType;
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch(e) {
      try {
        this.mediaRecorder = new MediaRecorder(this.stream);
      } catch (e2) {
        console.error('[Recorder] Failed to create MediaRecorder:', e2);
        return false;
      }
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => {
      this.audioBlob = new Blob(this.audioChunks, { type: this._blobType() });
      this.audioUrl = URL.createObjectURL(this.audioBlob);
    };

    try {
      this.mediaRecorder.start(250);
      this.isRecording = true;
      return true;
    } catch(e) {
      console.error('[Recorder] Failed to start recording:', e);
      this.isRecording = false;
      return false;
    }
  },

  stop() {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          this.audioBlob = new Blob(this.audioChunks, { type: this._blobType() });
          if (this.audioUrl) {
            try { URL.revokeObjectURL(this.audioUrl); } catch (e) {}
          }
          this.audioUrl = this.audioBlob.size > 0 ? URL.createObjectURL(this.audioBlob) : null;
          this.isRecording = false;
          resolve(this.audioUrl);
        };
        this.mediaRecorder.onstop = finish;
        try {
          if (typeof this.mediaRecorder.requestData === 'function' && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.requestData();
          }
        } catch (e) {}
        this.mediaRecorder.stop();
        setTimeout(finish, 1500);
      } else {
        this.isRecording = false;
        resolve(this.audioUrl);
      }
    });
  },

  getFrequencyData() {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return null;
  },

  getTimeDomainData() {
    if (this.analyser) {
      const timeData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteTimeDomainData(timeData);
      return timeData;
    }
    return null;
  },

  /**
   * Soft reset: clears recording state but KEEPS the mic stream alive.
   * Use this between questions (Try Again / Next Question).
   */
  reset() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch(e) {}
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioBlob = null;
    if (this.audioUrl) {
      try { URL.revokeObjectURL(this.audioUrl); } catch(e) {}
    }
    this.audioUrl = null;
    this.isRecording = false;
  },

  /**
   * Full cleanup: stops mic stream and closes AudioContext.
   * Only use when navigating AWAY from practice entirely.
   */
  cleanup() {
    this.reset();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch(e) {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
  },

  /**
   * Check if the mic stream is still alive and usable.
   */
  isStreamActive() {
    return this.stream && this.stream.getTracks().some(t => t.readyState === 'live');
  }
};

// ── Speech Recognition ─────────────────────────────────────────
// Mobile Chrome fix: always create a fresh recognition instance on start().
// Mobile Chrome cannot reliably restart a stopped recognition — it silently
// fails. The `continuous` mode also stops randomly on mobile and the onend
// auto-restart often doesn't work. Solution: create fresh instance every
// time, and use aggressive auto-restart with delay.

PTE.SpeechRecognizer = {
  recognition: null,
  transcript: '',
  interimTranscript: '',
  confidence: 0,
  confidenceScores: [],
  isListening: false,
  onResult: null,
  onEnd: null,
  wordTimestamps: [],
  silenceCount: 0,
  _restartCount: 0,
  _isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),

  /**
   * Create a fresh SpeechRecognition instance with all event handlers.
   * Called both on init and on every start() for mobile reliability.
   */
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Speech] SpeechRecognition not supported in this browser');
      return false;
    }

    // Always create a brand new instance (mobile requires this)
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        let best = result[0];
        for (let a = 1; a < result.length; a++) {
          if ((result[a].confidence || 0) > (best.confidence || 0)) best = result[a];
        }
        if (result.isFinal) {
          final += best.transcript;
          this.confidenceScores.push(best.confidence || 0);
        } else {
          interim += best.transcript;
        }
      }
      if (final) {
        const piece = final.trim();
        if (piece) {
          this.transcript = this.transcript ? `${this.transcript.trim()} ${piece}` : piece;
          this.wordTimestamps.push({ time: Date.now(), words: piece.split(/\s+/).length });
        }
      }
      this.interimTranscript = interim;
      if (this.onResult) {
        this.onResult(this.transcript, this.interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[Speech] Recognition error:', event.error);
      // On mobile, 'no-speech' and 'network' errors are common
      // Don't give up — let onend handler try to restart
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // Permission denied — stop trying
        console.error('[Speech] Microphone permission denied for speech recognition');
        this.isListening = false;
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        this._restartCount++;
        // Safety: don't restart infinitely (max 50 restarts per session)
        if (this._restartCount > 50) {
          console.warn('[Speech] Too many restarts, stopping');
          this.isListening = false;
          return;
        }
        // On mobile, create a fresh instance before restarting
        // and add a small delay to let the browser clean up
        const delay = this._isMobile ? 300 : 100;
        setTimeout(() => {
          if (!this.isListening) return;
          try {
            if (this._isMobile) {
              // Mobile: must create fresh instance — old one can't be restarted
              this._createFreshInstance();
            }
            this.recognition.start();
          } catch(e) {
            console.warn('[Speech] Restart failed:', e.message);
            // Last resort: create new instance and try once more
            setTimeout(() => {
              if (!this.isListening) return;
              try {
                this._createFreshInstance();
                this.recognition.start();
              } catch(e2) {
                console.error('[Speech] Final restart failed:', e2.message);
              }
            }, 500);
          }
        }, delay);
      } else {
        // Promote any remaining interim results before firing onEnd
        if (this.interimTranscript) {
          this.transcript += this.interimTranscript;
          this.interimTranscript = '';
        }
        if (this.onEnd) {
          this.onEnd(this.transcript, this.getAverageConfidence());
        }
      }
    };

    return true;
  },

  /**
   * Create a fresh recognition instance, preserving event handlers.
   * Essential for mobile Chrome which can't restart stopped instances.
   */
  _createFreshInstance() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const oldOnResult = this.recognition ? this.recognition.onresult : null;
    const oldOnError = this.recognition ? this.recognition.onerror : null;
    const oldOnEnd = this.recognition ? this.recognition.onend : null;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    if (oldOnResult) this.recognition.onresult = oldOnResult;
    if (oldOnError) this.recognition.onerror = oldOnError;
    if (oldOnEnd) this.recognition.onend = oldOnEnd;
  },

  start() {
    this.transcript = '';
    this.interimTranscript = '';
    this.confidence = 0;
    this.confidenceScores = [];
    this.wordTimestamps = [];
    this.silenceCount = 0;
    this._restartCount = 0;
    this.isListening = true;

    // On mobile, ALWAYS create a fresh instance for reliable start
    // Desktop can usually reuse the same instance
    if (this._isMobile || !this.recognition) {
      this.init();
      this.isListening = true;
    }

    try {
      this.recognition.start();
      console.log('[Speech] Started', this._isMobile ? '(mobile - fresh instance)' : '(desktop)');
      return true;
    } catch (e) {
      console.warn('[Speech] Start failed, creating fresh instance...', e.message);
      try {
        this.init();
        this.isListening = true;
        this.recognition.start();
        console.log('[Speech] Started after re-init');
        return true;
      } catch (e2) {
        console.error('[Speech] Failed to start recognition:', e2);
        this.isListening = false;
        return false;
      }
    }
  },

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) { /* ignore */ }
    }
    // Promote any remaining interim results to final transcript so they aren't lost
    if (this.interimTranscript) {
      console.log('[Speech] Promoting interim to final:', this.interimTranscript);
      this.transcript += this.interimTranscript;
      if (this.wordTimestamps.length === 0 || this.interimTranscript.trim()) {
        this.wordTimestamps.push({ time: Date.now(), words: this.interimTranscript.trim().split(/\s+/).length });
      }
      // Interim results lack confidence scores; use a moderate default
      // so pronunciation isn't unfairly zeroed when only interim text exists
      if (this.confidenceScores.length === 0) {
        this.confidenceScores.push(0.7);
      }
      this.interimTranscript = '';
    }
    console.log('[Speech] Stopped | Transcript length:', this.transcript.length, '| Restarts:', this._restartCount);
    return {
      transcript: this.transcript.trim(),
      confidence: this.getAverageConfidence(),
      wordTimestamps: this.wordTimestamps
    };
  },

  getAverageConfidence() {
    if (this.confidenceScores.length === 0) return 0;
    return this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length;
  }
};

// ── Server transcription (Netlify /api/transcribe; no-op on GitHub Pages) ─

PTE.Transcribe = {
  apiUrl() {
    try {
      const override = localStorage.getItem('pte_transcribe_url');
      if (override) return override;
    } catch (e) { /* ignore */ }
    return '/api/transcribe';
  },

  wordCount(text) {
    return (text || '').trim().split(/\s+/).filter(Boolean).length;
  },

  pickBetter(live, server) {
    const a = (live || '').trim();
    const b = (server || '').trim();
    if (!b) return { transcript: a, source: 'live' };
    if (!a) return { transcript: b, source: 'server' };
    if (this.wordCount(b) >= Math.max(1, this.wordCount(a) - 1)) {
      return { transcript: b, source: 'server' };
    }
    return { transcript: a, source: 'live' };
  },

  fileName(mimeType) {
    const t = mimeType || '';
    if (t.includes('mp4')) return 'attempt.m4a';
    if (t.includes('ogg')) return 'attempt.ogg';
    if (t.includes('mpeg') || t.includes('mp3')) return 'attempt.mp3';
    return 'attempt.webm';
  },

  async fromBlob(blob, { liveTranscript = '', questionType = '', timeoutMs = 20000 } = {}) {
    const live = (liveTranscript || '').trim();
    if (!blob || blob.size < 256) {
      return { transcript: live, source: 'live', skipped: 'empty-audio' };
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const form = new FormData();
      form.append('audio', blob, this.fileName(blob.type));
      form.append('liveTranscript', live);
      form.append('type', questionType || '');
      const res = await fetch(this.apiUrl(), { method: 'POST', body: form, signal: ctrl.signal });
      if (!res.ok) {
        return { transcript: live, source: 'live', skipped: `http-${res.status}` };
      }
      const data = await res.json();
      const picked = this.pickBetter(live, data.transcript);
      return {
        transcript: picked.transcript,
        source: picked.source,
        liveTranscript: live,
        serverTranscript: data.transcript || '',
        blobKey: data.blobKey || null
      };
    } catch (e) {
      const skipped = e && e.name === 'AbortError' ? 'timeout' : 'network';
      return { transcript: live, source: 'live', skipped };
    } finally {
      clearTimeout(timer);
    }
  }
};

// ── Text-to-Speech (for audio prompts) ─────────────────────────

PTE.TTS = {
  synth: window.speechSynthesis || null,
  speaking: false,
  voice: null,
  _unlocked: false,
  _resumeInterval: null,
  _isChrome: /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent),
  _isEdge: /Edg/.test(navigator.userAgent),

  init() {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('[TTS] speechSynthesis not available');
        resolve(false);
        return;
      }

      const loadVoices = () => {
        const voices = this.synth.getVoices();
        if (voices.length === 0) return;

        // ── Voice Selection Priority (best natural-sounding first) ──
        // 1. Microsoft Online (Neural) voices — best quality on Windows/Edge
        // 2. Google voices — good quality on Chrome
        // 3. Microsoft local voices (Zira, David, Mark) — decent offline
        // 4. Apple voices (Samantha, Daniel) — good on macOS/iOS
        // 5. Any remote English voice
        // 6. Any English voice at all

        const enVoices = voices.filter(v => v.lang.startsWith('en'));

        this.voice =
          // Neural / Online voices (best quality — natural, no breaks)
          enVoices.find(v => v.name.includes('Online') && v.name.includes('Natural')) ||
          enVoices.find(v => v.name.includes('Online')) ||
          enVoices.find(v => v.name.includes('Neural')) ||
          // Google voices (good on Chrome)
          enVoices.find(v => v.name.includes('Google UK English Female')) ||
          enVoices.find(v => v.name.includes('Google UK English Male')) ||
          enVoices.find(v => v.name.includes('Google US English')) ||
          enVoices.find(v => v.name.includes('Google')) ||
          // Apple voices
          enVoices.find(v => v.name.includes('Samantha')) ||
          enVoices.find(v => v.name.includes('Daniel')) ||
          enVoices.find(v => v.name.includes('Karen')) ||
          // Microsoft desktop voices
          enVoices.find(v => v.name.includes('Zira')) ||
          enVoices.find(v => v.name.includes('David')) ||
          enVoices.find(v => v.name.includes('Mark')) ||
          // Any remote (non-local) English voice
          enVoices.find(v => !v.localService) ||
          // Any English voice
          enVoices[0] ||
          voices[0] || null;

        console.log('[TTS] Voice selected:', this.voice ? `${this.voice.name} (${this.voice.lang}, local=${this.voice.localService})` : 'none', '| Total voices:', voices.length);
        resolve(true);
      };

      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        loadVoices();
      } else {
        this.synth.onvoiceschanged = loadVoices;
        // Fallback for mobile (voices load slowly on iOS/Android)
        setTimeout(loadVoices, 2500);
      }
    });
  },

  /**
   * Unlock TTS on mobile. Must be called inside a user gesture (click/tap).
   * Plays a silent utterance to satisfy iOS/Android audio restrictions.
   */
  unlock() {
    if (this._unlocked || !this.synth) return;
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      u.rate = 1;
      this.synth.speak(u);
      this._unlocked = true;
      console.log('[TTS] Unlocked for mobile');
    } catch (e) {
      console.warn('[TTS] Unlock failed:', e);
    }
  },

  /**
   * Re-init voices if none were found initially.
   */
  _ensureVoice() {
    if (this.voice) return;
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.lang.startsWith('en') && !v.localService) ||
                 voices.find(v => v.lang.startsWith('en')) ||
                 voices[0] || null;
  },

  /**
   * Split long text into sentence chunks for natural playback.
   * This avoids Chrome's 15-second cutoff entirely by keeping each
   * utterance short enough that Chrome never pauses it.
   * Sentences are split at natural boundaries (. ! ? ; — and long commas).
   */
  _splitIntoChunks(text) {
    // Split on sentence-ending punctuation, keeping the punctuation attached
    const raw = text.match(/[^.!?;]+[.!?;]+[\s]*/g);
    if (!raw) return [text]; // No sentence boundaries found — return whole text

    // Merge very short chunks together for more natural flow
    const chunks = [];
    let current = '';
    for (const sentence of raw) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      
      if (current.length + trimmed.length < 200) {
        // Merge small sentences for smoother delivery
        current += (current ? ' ' : '') + trimmed;
      } else {
        if (current) chunks.push(current);
        current = trimmed;
      }
    }
    if (current) chunks.push(current);

    // If there's remaining text after the last punctuation, append it
    const joined = raw.join('');
    const remainder = text.slice(joined.length).trim();
    if (remainder) {
      if (chunks.length > 0 && chunks[chunks.length - 1].length + remainder.length < 200) {
        chunks[chunks.length - 1] += ' ' + remainder;
      } else {
        chunks.push(remainder);
      }
    }

    return chunks.length > 0 ? chunks : [text];
  },

  /**
   * Speak a single chunk (internal). No splitting — plays one utterance.
   */
  _speakChunk(text, rate) {
    return new Promise((resolve) => {
      if (!text || text.trim().length === 0) { resolve(); return; }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = this.voice ? this.voice.lang : 'en-US';

      const wordCount = text.trim().split(/\s+/).length;
      // Generous timeout per chunk: ~2 words/sec + buffer
      const estimatedMs = Math.max(6000, (wordCount / 2) * 1000 * (1 / rate) + 4000);
      let resolved = false;

      const doResolve = (reason) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimer);
        if (stuckInterval) clearInterval(stuckInterval);
        resolve();
      };

      const safetyTimer = setTimeout(() => {
        console.warn('[TTS] Chunk timeout after', estimatedMs, 'ms');
        try { this.synth.cancel(); } catch(e) {}
        doResolve('chunk-timeout');
      }, estimatedMs);

      // Stuck detection: synth stopped but onend never fired
      let stuckInterval = null;
      const stuckDelay = setTimeout(() => {
        stuckInterval = setInterval(() => {
          if (!this.synth.speaking && !this.synth.pending && !resolved) {
            doResolve('stuck');
          }
        }, 500);
      }, 1500);

      utterance.onend = () => {
        clearTimeout(stuckDelay);
        doResolve('onend');
      };
      utterance.onerror = (e) => {
        clearTimeout(stuckDelay);
        console.warn('[TTS] Chunk error:', e.error || e);
        doResolve('onerror');
      };

      this.synth.speak(utterance);
    });
  },

  /**
   * Main speak method — splits long text into sentence chunks and plays
   * them sequentially with tiny natural gaps for smooth, unbroken speech.
   *
   * This approach:
   * 1. Avoids Chrome's 15s pause bug (each chunk is short enough)
   * 2. No more pause()/resume() hack that causes voice breaking
   * 3. Natural sentence-boundary pauses sound more human
   * 4. Each chunk completes fully before the next starts
   */
  async speak(text, rate = 0.95) {
    if (!this.synth) {
      console.warn('[TTS] speechSynthesis not available, skipping');
      return;
    }
    if (!text || text.trim().length === 0) return;

    // Re-check voices (mobile may load them late)
    this._ensureVoice();

    // Cancel any ongoing speech
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
      // Small delay after cancel to let browser clean up
      await new Promise(r => setTimeout(r, 100));
    }

    this.speaking = true;
    this._cancelled = false;

    const wordCount = text.trim().split(/\s+/).length;

    // For short text (< ~80 words / ~30 seconds), play as single utterance
    // Chrome's 15s bug only hits longer texts, so short ones are fine as-is
    if (wordCount <= 80) {
      // For short text on Chrome, use the resume hack as safety net
      if (this._isChrome) this._startResumeHack();
      await this._speakChunk(text, rate);
      this._stopResumeHack();
    } else {
      // For long text, split into sentence chunks — no resume hack needed!
      // Each chunk is short enough that Chrome never triggers the 15s pause.
      const chunks = this._splitIntoChunks(text);
      console.log('[TTS] Split into', chunks.length, 'chunks for', wordCount, 'words');

      for (let i = 0; i < chunks.length; i++) {
        if (this._cancelled) break;
        await this._speakChunk(chunks[i], rate);
        // Tiny pause between sentences for natural rhythm (50ms — imperceptible but prevents overlap)
        if (i < chunks.length - 1 && !this._cancelled) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
    }

    this.speaking = false;
    this._stopResumeHack();
    console.log('[TTS] Complete |', wordCount, 'words');
  },

  /**
   * Chrome resume hack — ONLY used for short texts played as single utterance.
   * For long texts, sentence chunking eliminates the need for this entirely.
   *
   * Uses resume() only (not pause+resume) to minimize audio glitching.
   * Only triggers if Chrome has actually paused (synth.paused === true).
   */
  _startResumeHack() {
    this._stopResumeHack();
    if (!this._isChrome) return; // Only needed on Chrome

    this._resumeInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && this.synth.paused) {
        // Chrome has paused the speech — resume it
        console.log('[TTS] Chrome auto-paused detected, resuming...');
        this.synth.resume();
      }
    }, 3000);
  },

  _stopResumeHack() {
    if (this._resumeInterval) {
      clearInterval(this._resumeInterval);
      this._resumeInterval = null;
    }
  },

  stop() {
    this._cancelled = true;
    if (this.synth) {
      if (this.synth.speaking || this.synth.pending) this.synth.cancel();
    }
    this.speaking = false;
    this._stopResumeHack();
  },

  /**
   * Play a pre-recorded audio file (e.g. real exam-style recording) instead of TTS.
   * Falls back gracefully if the file is missing or fails to load.
   * Returns a Promise that resolves when playback finishes (or rejects on error).
   */
  playFile(url) {
    return new Promise((resolve, reject) => {
      if (!url) { reject(new Error('No audio URL')); return; }
      const audio = new Audio(url);
      audio.preload = 'auto';
      this._activeAudio = audio;
      audio.onended = () => { if (this._activeAudio === audio) this._activeAudio = null; resolve(); };
      audio.onerror = () => { if (this._activeAudio === audio) this._activeAudio = null; reject(new Error('Audio playback failed')); };
      audio.play().catch(reject);
    });
  },

  /**
   * Play a question's audio: use a recorded file when `audioUrl` is present,
   * otherwise synthesize via TTS. Returns a Promise.
   */
  async playQuestionAudio(question, rate = 0.95) {
    const url = question && question.audioUrl;
    if (url) {
      try { await this.playFile(url); return; }
      catch (e) { console.warn('[TTS] Recorded audio unavailable, falling back to TTS:', e); }
    }
    const text = question && (question.audioText || question.text || '');
    if (text) await this.speak(text, rate);
  },

  stopAll() {
    this.stop();
    if (this._activeAudio) {
      try { this._activeAudio.pause(); } catch (e) {}
      this._activeAudio = null;
    }
  }
};

PTE.Audio = {
  context: null,

  ensureContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!this.context) this.context = new Ctx();
    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
    return this.context;
  },

  unlock() {
    return this.ensureContext();
  },

  beep({ frequency = 880, duration = 0.14, volume = 0.055, sweep = 0, type = 'sine' } = {}) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (sweep !== 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(80, frequency + sweep), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }
};

// ── Timer ──────────────────────────────────────────────────────

PTE.Timer = {
  interval: null,
  remaining: 0,
  total: 0,
  onTick: null,
  onComplete: null,
  isPaused: false,

  start(seconds, onTick, onComplete) {
    this.stop();
    this.remaining = seconds;
    this.total = seconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.isPaused = false;

    if (this.onTick) this.onTick(this.remaining, this.total);
    if (seconds > 0 && PTE.Audio) PTE.Audio.beep({ frequency: 620, duration: 0.12, volume: 0.05, sweep: 80 });

    this.interval = setInterval(() => {
      if (!this.isPaused) {
        this.remaining--;
        if (this.onTick) this.onTick(this.remaining, this.total);
        if (this.remaining <= 3 && this.remaining > 0 && PTE.Audio) {
          PTE.Audio.beep({ frequency: 680 + (4 - this.remaining) * 90, duration: 0.1, volume: 0.05, sweep: 70 });
        }
        if (this.remaining <= 0) {
          if (PTE.Audio) PTE.Audio.beep({ frequency: 980, duration: 0.18, volume: 0.065, sweep: 180 });
          this.stop();
          if (this.onComplete) this.onComplete();
        }
      }
    }, 1000);
  },

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },

  pause() {
    this.isPaused = true;
  },

  resume() {
    this.isPaused = false;
  },

  getProgress() {
    if (this.total === 0) return 0;
    return 1 - (this.remaining / this.total);
  }
};

// ── Scoring Engine ─────────────────────────────────────────────
// Based on Official PTE Academic Test Taker Score Guide (July 2025 / Enhanced PTE)
// PDF: https://www.pearsonpte.com/ctf-assets/yqwtwibiobs4/WUcBAMkYCC9Dj5vs2HfVA/
//      941d88d07ba7c2a5007f7ce1b18eedbf/Score_Guide__Test_Taker__-_PTE_Academic_-_July_2025__web_.pdf
// Page: https://www.pearsonpte.com/pte-academic/scoring
//
// Enhanced PTE (August 2025): 65-75 items, 22 question types, ~2h15m
// Two NEW speaking tasks: Summarize Group Discussion + Respond to a Situation
//
// Trait scales per task type (official July 2025):
//   Read Aloud:      Content (word errors), Pronunciation (0-5), Oral Fluency (0-5)
//   Repeat Sentence: Content (0-3),         Pronunciation (0-5), Oral Fluency (0-5)
//   Describe Image:  Content (0-6),         Pronunciation (0-5), Oral Fluency (0-5) [5-6 items, up from 3]
//   Retell Lecture:  Content (0-6),         Pronunciation (0-5), Oral Fluency (0-5) [2-3 items, up from 1]
//   SGD (NEW):       Content (0-6),         Pronunciation (0-5), Oral Fluency (0-5) [2-3 items]
//   RTS (NEW):       Appropriacy (0-6),     Pronunciation (0-5), Oral Fluency (0-5) [2 items]
//   Answer Short Q:  Vocabulary (0-1)
//
// Content scored by AI + human reviewer for: DI, RL, RTS, SGD
// If Content/Appropriacy = 0, total score = 0 (official rule).
// Raw trait scores are converted to 0-90 PTE scale for display.

PTE.Scoring = {

  // ═══════════════════════════════════════════════════════════════
  // PRONUNCIATION (0-5) — Official PTE Scale
  // Uses speech recognition confidence as proxy for intelligibility.
  //
  // 5 Highly proficient: all vowels/consonants easily understood,
  //   appropriate stress at word and sentence level
  // 4 Advanced: understandable, minor errors in vowel/consonant/stress
  // 3 Good: mostly correct, some errors make a few words hard to understand
  // 2 Intermediate: consistent mispronunciations, ~1/3 unintelligible
  // 1 Intrusive: listeners struggle with ~2/3 of speech
  // 0 Non-English: more than half unintelligible
  // ═══════════════════════════════════════════════════════════════

  pronunciationScore(confidence, recognized, expected) {
    if (!recognized || recognized.trim().length === 0) return 0;

    const recWords = this.normalizeText(recognized).split(/\s+/).filter(w => w);
    const expWords = expected ? this.normalizeText(expected).split(/\s+/).filter(w => w) : [];

    // ── Signal 1: Sequence-aware word accuracy (LCS) ──
    // Uses Longest Common Subsequence so word ORDER matters
    // and duplicate words are handled correctly
    let seqAccuracy = 1.0;
    if (expWords.length > 0) {
      const lcsLen = this._lcsLength(expWords, recWords);
      const omissions = expWords.length - lcsLen;
      const insertions = recWords.length - lcsLen;
      const totalErrors = omissions + insertions;
      seqAccuracy = Math.max(0, 1 - (totalErrors / Math.max(expWords.length, 1)));
    }

    // ── Signal 2: Phoneme-approximate word matching ──
    // For words not in LCS, check if they are "close" pronunciations
    // (Levenshtein distance ≤ 2 = likely recognized with slight error)
    let phoneticBonus = 0;
    if (expWords.length > 0) {
      const lcsSet = this._lcsWords(expWords, recWords);
      const missedExp = expWords.filter((w, i) => !lcsSet.expIndices.has(i));
      const unusedRec = recWords.filter((w, i) => !lcsSet.recIndices.has(i));

      let closeMatches = 0;
      const usedRec = new Set();
      for (const mw of missedExp) {
        for (let ri = 0; ri < unusedRec.length; ri++) {
          if (usedRec.has(ri)) continue;
          const dist = this.levenshtein(mw, unusedRec[ri]);
          if (dist <= 2 && dist < Math.max(mw.length, unusedRec[ri].length) * 0.5) {
            closeMatches++;
            usedRec.add(ri);
            break;
          }
        }
      }
      phoneticBonus = missedExp.length > 0
        ? (closeMatches / missedExp.length) * 0.15
        : 0;
    }

    // ── Signal 3: Adjusted confidence ──
    // Web Speech API confidence reflects recognition certainty, not
    // pronunciation quality. Dampen extreme values and apply correction.
    // Low confidence in noisy environments shouldn't kill the score;
    // high confidence for short/easy phrases shouldn't inflate it.
    let adjConfidence = confidence;

    // Dampen overconfident scores on very short utterances
    if (recWords.length <= 3 && confidence > 0.9) {
      adjConfidence = 0.85;
    }
    // Boost slightly if many words matched but confidence was low
    // (common with non-native accents that are still intelligible)
    if (seqAccuracy >= 0.8 && confidence < 0.6 && confidence > 0) {
      adjConfidence = confidence + (seqAccuracy - confidence) * 0.3;
    }
    // Clamp to [0, 1]
    adjConfidence = Math.max(0, Math.min(1, adjConfidence));

    // ── Signal 4: Length penalty ──
    // If user said far fewer words than expected, pronunciation
    // may not have been attempted for many words
    let lengthPenalty = 0;
    if (expWords.length > 0) {
      const ratio = recWords.length / expWords.length;
      if (ratio < 0.3) lengthPenalty = 0.3;
      else if (ratio < 0.5) lengthPenalty = 0.15;
      else if (ratio < 0.7) lengthPenalty = 0.05;
    }

    // ── Blend all signals ──
    // seqAccuracy:  35% — strongest signal, order-aware word matching
    // adjConfidence: 30% — recognition confidence (dampened)
    // phoneticBonus: adds up to 15% for close-but-not-exact matches
    // lengthPenalty: subtracted for incomplete attempts
    const blended = Math.max(0, Math.min(1,
      (seqAccuracy * 0.35) +
      (adjConfidence * 0.30) +
      (seqAccuracy * adjConfidence * 0.20) +
      phoneticBonus -
      lengthPenalty
    ));

    // ── Map to 0-5 PTE band ──
    // Thresholds calibrated so that:
    //   - Perfect read = 5
    //   - 1-2 minor errors = 4
    //   - Several errors but mostly understood = 3
    //   - Many errors, ~1/3 unintelligible = 2
    //   - Mostly unintelligible = 1
    //   - No meaningful speech = 0
    let band = 0;
    if (blended >= 0.82) band = 5;
    else if (blended >= 0.68) band = 4;
    else if (blended >= 0.52) band = 3;
    else if (blended >= 0.35) band = 2;
    else if (blended >= 0.18) band = 1;
    else band = 0;

    return band;
  },

  // ═══════════════════════════════════════════════════════════════
  // ORAL FLUENCY (0-5) — Official PTE Scale
  //
  // 5 Highly proficient: smooth rhythm, appropriate phrasing, no
  //   hesitations/repetitions/false starts
  // 4 Advanced: acceptable rhythm, no more than 1 hesitation/repetition
  // 3 Good: uneven but continuous, multiple hesitations acceptable
  // 2 Intermediate: uneven/staccato, at least one smooth 3-word phrase
  // 1 Limited: irregular phrasing, poor rhythm
  // 0 Disfluent: slow labored, multiple pauses, hesitations, false starts
  // ═══════════════════════════════════════════════════════════════

  fluencyScore(wordTimestamps, totalTime, recognized, maxRecordTime) {
    if (!recognized || recognized.trim().length === 0) return 0;

    const wordCount = recognized.trim().split(/\s+/).length;
    if (wordCount === 0) return 0;

    // 1. Words per minute (PTE ideal: 120-160 WPM for natural speech)
    const wpm = totalTime > 0 ? (wordCount / totalTime) * 60 : 0;

    // 2. Number of recognition events as proxy for pauses/hesitations
    //    Fewer events for the same word count = smoother continuous speech
    //    Each time recognition restarts after a pause = new event
    const numEvents = wordTimestamps.length;
    const avgWordsPerEvent = numEvents > 0 ? wordCount / numEvents : wordCount;

    // 3. Time utilization: speaking for most of the available time
    //    PTE penalizes finishing too early or long silences
    const utilization = maxRecordTime > 0 ? totalTime / maxRecordTime : 0.5;

    // 4. Pause detection: gaps between recognition events
    let longPauseCount = 0;
    let hesitationCount = 0;
    if (wordTimestamps.length >= 2) {
      for (let i = 1; i < wordTimestamps.length; i++) {
        const gap = wordTimestamps[i].time - wordTimestamps[i-1].time;
        if (gap > 3000) longPauseCount++;      // >3s = long pause
        else if (gap > 1500) hesitationCount++; // 1.5-3s = hesitation
      }
    }

    // Determine band
    let band = 0;

    if (wpm >= 110 && wpm <= 170 && longPauseCount === 0 && hesitationCount === 0 && avgWordsPerEvent >= 8) {
      band = 5; // Highly proficient: smooth, no hesitations
    } else if (wpm >= 100 && wpm <= 180 && longPauseCount === 0 && hesitationCount <= 1 && avgWordsPerEvent >= 5) {
      band = 4; // Advanced: acceptable rhythm, max 1 hesitation
    } else if (wpm >= 80 && wpm <= 200 && longPauseCount <= 1 && hesitationCount <= 3 && avgWordsPerEvent >= 3) {
      band = 3; // Good: uneven but continuous
    } else if (wpm >= 50 && avgWordsPerEvent >= 2 && longPauseCount <= 2) {
      band = 2; // Intermediate: staccato, at least some smooth phrases
    } else if (wordCount >= 3) {
      band = 1; // Limited: irregular phrasing
    } else {
      band = 0; // Disfluent
    }

    // Penalize very low time utilization (stopped speaking too early)
    if (utilization < 0.3 && band > 2) band = Math.max(2, band - 1);
    if (utilization < 0.15 && band > 1) band = Math.max(1, band - 1);

    return band;
  },

  // ═══════════════════════════════════════════════════════════════
  // CONTENT SCORING — Task-specific (official scales vary per type)
  // ═══════════════════════════════════════════════════════════════

  /**
   * READ ALOUD — Content
   * Official: Each replacement, omission, or insertion = 1 error.
   * Max score depends on prompt length.
   * Returns: { raw, max, errors, accuracy }
   */
  contentScoreReadAloud(recognized, expected) {
    if (!recognized || recognized.trim().length === 0) return { raw: 0, max: 0, errors: 0, accuracy: 0 };
    if (!expected) return { raw: 0, max: 0, errors: 0, accuracy: 0 };

    const recWords = this.normalizeText(recognized).split(/\s+/);
    const expWords = this.normalizeText(expected).split(/\s+/);
    const maxScore = expWords.length;

    // Use LCS (Longest Common Subsequence) to find best word alignment
    const lcsLen = this._lcsLength(expWords, recWords);
    // Errors = missed from expected + inserted in recognized
    const omissions = expWords.length - lcsLen;
    const insertions = recWords.length - lcsLen;
    const errors = omissions + insertions;
    const raw = Math.max(0, maxScore - errors);

    return {
      raw,
      max: maxScore,
      errors,
      accuracy: maxScore > 0 ? Math.round((raw / maxScore) * 100) : 0
    };
  },

  /**
   * REPEAT SENTENCE — Content (0-3)
   * Official:
   *   3 = All words in correct sequence
   *   2 = At least 50% of words in correct sequence
   *   1 = Less than 50% of words in correct sequence
   *   0 = Almost nothing from prompt
   */
  contentScoreRepeatSentence(recognized, expected) {
    if (!recognized || recognized.trim().length === 0) return 0;
    if (!expected) return 0;

    const recWords = this.normalizeText(recognized).split(/\s+/);
    const expWords = this.normalizeText(expected).split(/\s+/);

    // Use LCS for sequence matching (official: "in the correct sequence")
    const lcsLen = this._lcsLength(expWords, recWords);
    const ratio = lcsLen / Math.max(expWords.length, 1);

    if (ratio >= 0.90) return 3;  // All/almost all words in correct sequence
    if (ratio >= 0.50) return 2;  // At least 50% in correct sequence
    if (ratio >= 0.15) return 1;  // Less than 50% but something present
    return 0;                      // Almost nothing
  },

  /**
   * DESCRIBE IMAGE — Content (0-6)
   * Official:
   *   6 = Full, accurate, nuanced interpretation; varied vocabulary; complete mental picture
   *   5 = Main features accurate, some relationships; varied vocabulary; minor details missing
   *   4 = Some accurate descriptions and basic relationships; sufficient vocabulary
   *   3 = Mainly superficial descriptions, minor inaccuracies; narrow vocabulary
   *   2 = Minimal descriptions with some inaccuracies; limited vocabulary
   *   1 = Disconnected elements/list without elaboration; highly restricted vocabulary
   *   0 = Too limited to score
   */
  contentScoreDescribeImage(recognized, keywords, data) {
    if (!recognized || recognized.trim().length === 0) return 0;

    const recLower = recognized.toLowerCase();
    const recWords = this.normalizeText(recognized).split(/\s+/);
    const wordCount = recWords.length;

    // 1. Keyword coverage (main scoring signal)
    const kwWords = keywords ? keywords.map(k => k.toLowerCase()) : [];
    let kwMatches = 0;
    for (const kw of kwWords) {
      if (recLower.includes(kw)) kwMatches++;
    }
    const kwCoverage = kwWords.length > 0 ? kwMatches / kwWords.length : 0;

    // 2. Data point mentions (numbers, labels from chart data)
    let dataPointsMentioned = 0;
    let totalDataPoints = 0;
    if (data && Array.isArray(data)) {
      totalDataPoints = data.length;
      for (const item of data) {
        if (item.label && recLower.includes(item.label.toLowerCase())) dataPointsMentioned++;
        if (item.value && recLower.includes(String(item.value))) dataPointsMentioned++;
      }
    }
    const dataCoverage = totalDataPoints > 0 ? Math.min(1, dataPointsMentioned / (totalDataPoints * 1.5)) : 0;

    // 3. Response length & structure (longer = more descriptive)
    const lengthFactor = wordCount >= 60 ? 1.0 : wordCount >= 40 ? 0.85 : wordCount >= 25 ? 0.65 : wordCount >= 10 ? 0.4 : 0.2;

    // 4. Discourse markers (shows structured response)
    const discourseMarkers = ['overall', 'in conclusion', 'moreover', 'furthermore', 'however',
      'in summary', 'looking at', 'we can see', 'the chart shows', 'the graph', 'the image',
      'this shows', 'depicts', 'illustrates', 'indicates', 'represents', 'compared to',
      'on the other hand', 'while', 'whereas', 'highest', 'lowest', 'significant',
      'increase', 'decrease', 'trend', 'proportion', 'majority', 'relationship'];
    let discourseCount = 0;
    for (const marker of discourseMarkers) {
      if (recLower.includes(marker)) discourseCount++;
    }
    const discourseFactor = Math.min(1, discourseCount / 5);

    // Composite content score
    const composite = (kwCoverage * 0.35) + (dataCoverage * 0.25) + (lengthFactor * 0.20) + (discourseFactor * 0.20);

    if (composite >= 0.80) return 6;
    if (composite >= 0.65) return 5;
    if (composite >= 0.50) return 4;
    if (composite >= 0.35) return 3;
    if (composite >= 0.20) return 2;
    if (wordCount >= 5) return 1;
    return 0;
  },

  /**
   * RETELL LECTURE — Content (0-6)
   * Official:
   *   6 = Clear, accurate, full comprehension; paraphrased in own words; well connected
   *   5 = Main ideas + some details; formulated in own words; connected with connectives
   *   4 = Some main ideas, some inaccurate; attempt at own words; not well connected
   *   3 = Some ideas, may not differentiate important vs details; narrow vocabulary
   *   2 = Mostly inaccurate/incomplete; limited vocabulary; lacks coherence
   *   1 = Isolated words/phrases; no meaningful communication
   *   0 = Too limited to score
   */
  contentScoreRetellLecture(recognized, expected, keywords) {
    if (!recognized || recognized.trim().length === 0) return 0;

    const recWords = this.normalizeText(recognized).split(/\s+/);
    const expWords = expected ? this.normalizeText(expected).split(/\s+/) : [];
    const recLower = recognized.toLowerCase();
    const wordCount = recWords.length;

    // 1. Keyword coverage
    const kwWords = keywords ? keywords.map(k => k.toLowerCase()) : [];
    let kwMatches = 0;
    for (const kw of kwWords) {
      if (recLower.includes(kw)) kwMatches++;
    }
    const kwCoverage = kwWords.length > 0 ? kwMatches / kwWords.length : 0;

    // 2. Content overlap with original lecture (paraphrasing detection)
    let overlapRatio = 0;
    if (expWords.length > 0) {
      const expSet = new Set(expWords);
      // Filter out common stop words for better signal
      const stopWords = new Set(['the','a','an','is','are','was','were','in','on','at','to','for','of','and','or','but','that','this','it','with','as','by','from','has','have','had','be','been','not','will','would','can','could','should','do','does','did','more','most','very','also','just','than','then','about']);
      const meaningfulExp = expWords.filter(w => !stopWords.has(w));
      const meaningfulRec = recWords.filter(w => !stopWords.has(w));
      const matchCount = meaningfulRec.filter(w => expSet.has(w)).length;
      overlapRatio = meaningfulExp.length > 0 ? matchCount / meaningfulExp.length : 0;
    }

    // 3. Length adequacy
    const lengthFactor = wordCount >= 50 ? 1.0 : wordCount >= 35 ? 0.8 : wordCount >= 20 ? 0.55 : wordCount >= 10 ? 0.3 : 0.15;

    // 4. Connective devices (official rubric emphasizes these)
    const connectives = ['firstly', 'secondly', 'moreover', 'furthermore', 'in addition',
      'however', 'therefore', 'consequently', 'in conclusion', 'to summarize',
      'according to', 'the speaker', 'the lecturer', 'mentioned', 'discussed',
      'explained', 'pointed out', 'highlighted', 'stated', 'noted', 'also', 'finally',
      'on the other hand', 'as a result', 'for example', 'such as', 'main point',
      'key idea', 'in other words'];
    let connectiveCount = 0;
    for (const c of connectives) {
      if (recLower.includes(c)) connectiveCount++;
    }
    const connectiveFactor = Math.min(1, connectiveCount / 4);

    const composite = (kwCoverage * 0.35) + (overlapRatio * 0.25) + (lengthFactor * 0.20) + (connectiveFactor * 0.20);

    if (composite >= 0.75) return 6;
    if (composite >= 0.60) return 5;
    if (composite >= 0.45) return 4;
    if (composite >= 0.30) return 3;
    if (composite >= 0.18) return 2;
    if (wordCount >= 5) return 1;
    return 0;
  },

  /**
   * SUMMARIZE GROUP DISCUSSION — Content (0-6)
   * Same scale as Retell Lecture but evaluates summary of multiple speakers.
   */
  contentScoreSGD(recognized, speakers, keywords) {
    if (!recognized || recognized.trim().length === 0) return 0;

    const recLower = recognized.toLowerCase();
    const recWords = this.normalizeText(recognized).split(/\s+/);
    const wordCount = recWords.length;

    // 1. Keyword coverage
    const kwWords = keywords ? keywords.map(k => k.toLowerCase()) : [];
    let kwMatches = 0;
    for (const kw of kwWords) {
      if (recLower.includes(kw)) kwMatches++;
    }
    const kwCoverage = kwWords.length > 0 ? kwMatches / kwWords.length : 0;

    // 2. Speaker coverage (mentions ideas from different speakers)
    let speakersCovered = 0;
    if (speakers && speakers.length > 0) {
      const uniqueSpeakers = [...new Set(speakers.map(s => s.name))];
      for (const speaker of uniqueSpeakers) {
        const speakerTexts = speakers.filter(s => s.name === speaker).map(s => s.text);
        const speakerWords = speakerTexts.join(' ').toLowerCase().split(/\s+/);
        const stopWords = new Set(['the','a','an','is','are','was','were','in','on','at','to','for','of','and','or','but','that','this','it','with']);
        const meaningfulWords = speakerWords.filter(w => w.length > 3 && !stopWords.has(w));
        const matchCount = meaningfulWords.filter(w => recLower.includes(w)).length;
        if (matchCount >= 3) speakersCovered++;
      }
      const speakerCoverage = speakersCovered / uniqueSpeakers.length;
      const lengthFactor = wordCount >= 50 ? 1.0 : wordCount >= 35 ? 0.8 : wordCount >= 20 ? 0.55 : 0.3;

      // Synthesis markers
      const synthesisMarkers = ['agreed', 'disagreed', 'consensus', 'different views', 'on the other hand',
        'in contrast', 'however', 'while', 'whereas', 'both', 'overall', 'all speakers',
        'the discussion', 'main points', 'concluded', 'summary', 'debate'];
      let synthCount = 0;
      for (const m of synthesisMarkers) { if (recLower.includes(m)) synthCount++; }
      const synthFactor = Math.min(1, synthCount / 3);

      const composite = (kwCoverage * 0.30) + (speakerCoverage * 0.30) + (lengthFactor * 0.20) + (synthFactor * 0.20);

      if (composite >= 0.75) return 6;
      if (composite >= 0.60) return 5;
      if (composite >= 0.45) return 4;
      if (composite >= 0.30) return 3;
      if (composite >= 0.18) return 2;
      if (wordCount >= 5) return 1;
      return 0;
    }

    // Fallback if no speakers data
    return this.contentScoreRetellLecture(recognized, speakers ? speakers.map(s => s.text).join(' ') : '', keywords);
  },

  /**
   * RESPOND TO SITUATION — Content (0-6)
   * Evaluates appropriateness and completeness of response.
   */
  contentScoreRTS(recognized, scenario, audioText, keywords) {
    if (!recognized || recognized.trim().length === 0) return 0;

    const recLower = recognized.toLowerCase();
    const recWords = this.normalizeText(recognized).split(/\s+/);
    const wordCount = recWords.length;

    // 1. Keyword coverage
    const kwWords = keywords ? keywords.map(k => k.toLowerCase()) : [];
    let kwMatches = 0;
    for (const kw of kwWords) {
      if (recLower.includes(kw)) kwMatches++;
    }
    const kwCoverage = kwWords.length > 0 ? kwMatches / kwWords.length : 0;

    // 2. Length adequacy
    const lengthFactor = wordCount >= 40 ? 1.0 : wordCount >= 25 ? 0.75 : wordCount >= 15 ? 0.5 : wordCount >= 5 ? 0.25 : 0.1;

    // 3. Appropriateness markers (polite, structured response)
    const appMarkers = ['would', 'could', 'please', 'thank', 'appreciate', 'understand',
      'suggest', 'recommend', 'like to', 'sorry', 'excuse', 'help', 'may i',
      'first', 'second', 'finally', 'in my opinion', 'i believe', 'i think',
      'however', 'therefore', 'dear', 'regards', 'sincerely'];
    let appCount = 0;
    for (const m of appMarkers) { if (recLower.includes(m)) appCount++; }
    const appFactor = Math.min(1, appCount / 4);

    const composite = (kwCoverage * 0.40) + (lengthFactor * 0.30) + (appFactor * 0.30);

    if (composite >= 0.80) return 6;
    if (composite >= 0.65) return 5;
    if (composite >= 0.50) return 4;
    if (composite >= 0.35) return 3;
    if (composite >= 0.20) return 2;
    if (wordCount >= 5) return 1;
    return 0;
  },

  /**
   * Generic content score — dispatches to task-specific scorer.
   * Used by the evaluation phase.
   */
  contentScore(recognized, expected, keywords, taskType, question) {
    if (!recognized || recognized.trim().length === 0) return { raw: 0, max: 1, band: 0 };

    switch (taskType) {
      case 'read-aloud': {
        const result = this.contentScoreReadAloud(recognized, expected);
        return { raw: result.raw, max: result.max, band: null, errors: result.errors, accuracy: result.accuracy };
      }
      case 'repeat-sentence': {
        const band = this.contentScoreRepeatSentence(recognized, expected);
        return { raw: band, max: 3, band };
      }
      case 'describe-image': {
        const band = this.contentScoreDescribeImage(recognized, keywords, question ? question.data : null);
        return { raw: band, max: 6, band };
      }
      case 'retell-lecture': {
        const band = this.contentScoreRetellLecture(recognized, expected, keywords);
        return { raw: band, max: 6, band };
      }
      case 'summarize-group-discussion': {
        const band = this.contentScoreSGD(recognized, question ? question.speakers : null, keywords);
        return { raw: band, max: 6, band };
      }
      case 'respond-to-situation': {
        const band = this.contentScoreRTS(recognized, question ? question.scenario : '', question ? question.audioText : '', keywords);
        return { raw: band, max: 6, band };
      }
      default: {
        // Fallback generic scoring
        const recWords = this.normalizeText(recognized).split(/\s+/);
        const expWords = expected ? this.normalizeText(expected).split(/\s+/) : [];
        const kwWords = keywords ? keywords.map(k => k.toLowerCase()) : [];
        let score = 0;
        if (expWords.length > 0) {
          const match = recWords.filter(w => expWords.includes(w)).length;
          score = match / Math.max(expWords.length, 1);
        }
        const band = Math.round(score * 5);
        return { raw: band, max: 5, band };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // VOCABULARY — Answer Short Question (0-1)
  // Official: 1 = appropriate word, 0 = inappropriate
  // ═══════════════════════════════════════════════════════════════

  vocabularyScore(recognized, correctAnswers) {
    if (!recognized || recognized.trim().length === 0) return 0;
    const recNorm = this.normalizeText(recognized);
    for (const answer of correctAnswers) {
      if (recNorm.includes(answer.toLowerCase())) {
        return 1; // Official: correct = 1
      }
    }
    // Partial match using Levenshtein (close pronunciation)
    const recWords = recNorm.split(/\s+/);
    for (const answer of correctAnswers) {
      for (const word of recWords) {
        if (this.levenshtein(word, answer.toLowerCase()) <= 2) {
          return 1; // Close enough to count
        }
      }
    }
    return 0;
  },

  // ═══════════════════════════════════════════════════════════════
  // OVERALL SCORE CALCULATION
  // Converts raw trait scores to 0-90 PTE scale.
  //
  // Official PTE uses: raw_total / max_total → scaled to 10-90.
  // For practice, we show both raw bands AND a converted 10-90 score.
  //
  // The maximum raw score per task (July 2025 Score Guide):
  //   Read Aloud:  Content(varies) + Pronunciation(5) + OralFluency(5)
  //   Repeat Sent.: Content(3) + Pronunciation(5) + OralFluency(5) = 13
  //   Describe Img: Content(6) + Pronunciation(5) + OralFluency(5) = 16
  //   Retell Lect.: Content(6) + Pronunciation(5) + OralFluency(5) = 16
  //   SGD:          Content(6) + Pronunciation(5) + OralFluency(5) = 16
  //   RTS:          Appropriacy(6) + Pronunciation(5) + OralFluency(5) = 16
  //   ASQ:          Vocabulary(1) = 1
  // ═══════════════════════════════════════════════════════════════

  calculateOverall(scores, type) {
    const typeConfig = Object.values(PTE.QUESTION_TYPES).find(t => t.id === type);
    if (!typeConfig) return 0;

    // Answer Short Question: binary
    if (type === 'answer-short-question') {
      return scores.vocabulary === 1 ? 90 : 0;
    }

    // Official rule: if content = 0, total = 0
    if (scores.contentResult && scores.contentResult.raw === 0) return 0;

    // Calculate raw total and max total
    let rawTotal = 0;
    let maxTotal = 0;

    if (scores.contentResult) {
      rawTotal += scores.contentResult.raw;
      maxTotal += scores.contentResult.max;
    }
    if (scores.pronunciation !== undefined) {
      rawTotal += scores.pronunciation;
      maxTotal += 5;
    }
    if (scores.fluency !== undefined) {
      rawTotal += scores.fluency;
      maxTotal += 5;
    }

    if (maxTotal === 0) return 0;

    // Scale to 10-90 (PTE scale: 10 is minimum for attempting, 90 is perfect)
    const ratio = rawTotal / maxTotal;
    const scaled = Math.round(10 + (ratio * 80));
    return Math.min(90, Math.max(10, scaled));
  },

  // ═══════════════════════════════════════════════════════════════
  // BAND-TO-90 SCALE CONVERSION (for individual trait display)
  // Converts a 0-5 or 0-6 band to approximate 0-90 PTE scale
  // ═══════════════════════════════════════════════════════════════

  bandTo90(band, maxBand) {
    if (band <= 0) return 0;
    const ratio = band / maxBand;
    return Math.round(10 + (ratio * 80));
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  },

  /**
   * Longest Common Subsequence length — for word sequence matching.
   * Used by Read Aloud (word errors) and Repeat Sentence (sequence matching).
   */
  _lcsLength(a, b) {
    const m = a.length, n = b.length;
    // Optimized: only need 2 rows
    let prev = new Array(n + 1).fill(0);
    let curr = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          curr[j] = prev[j - 1] + 1;
        } else {
          curr[j] = Math.max(prev[j], curr[j - 1]);
        }
      }
      [prev, curr] = [curr, new Array(n + 1).fill(0)];
    }
    return prev.reduce((max, v) => Math.max(max, v), 0);
  },

  /**
   * LCS with index tracking — returns which indices in a[] and b[]
   * are part of the longest common subsequence.
   * Used by pronunciation scoring to identify matched vs missed words.
   */
  _lcsWords(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    // Backtrack to find actual matched indices
    const expIndices = new Set();
    const recIndices = new Set();
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        expIndices.add(i - 1);
        recIndices.add(j - 1);
        i--; j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    return { expIndices, recIndices, length: dp[m][n] };
  },

  // ═══════════════════════════════════════════════════════════════
  // SCORE BAND DESCRIPTIONS (PTE / CEFR aligned)
  // ═══════════════════════════════════════════════════════════════

  getBand(score) {
    if (score >= 85) return { label: 'Expert (C2)', color: '#10b981', emoji: '🌟' };
    if (score >= 76) return { label: 'Proficient (C1)', color: '#6366f1', emoji: '✨' };
    if (score >= 59) return { label: 'Competent (B2)', color: '#3b82f6', emoji: '👍' };
    if (score >= 43) return { label: 'Developing (B1)', color: '#f59e0b', emoji: '📈' };
    if (score >= 30) return { label: 'Basic (A2)', color: '#f97316', emoji: '📝' };
    return { label: 'Needs Practice', color: '#ef4444', emoji: '💪' };
  },

  /**
   * Get PTE band label for a 0-5 trait score
   */
  getTraitLabel(band) {
    const labels = ['Non-English/Disfluent', 'Intrusive/Limited', 'Intermediate', 'Good', 'Advanced', 'Highly Proficient'];
    return labels[Math.min(band, 5)] || 'Unknown';
  },

  /**
   * Official PTE-style pronunciation band descriptors
   */
  getPronunciationDescriptor(band) {
    const descriptors = {
      5: 'All vowels and consonants are produced in a way that is easily understood. Appropriate use of stress at word and sentence level.',
      4: 'Pronunciation is clearly understandable with minor distortions in vowels, consonants, or stress patterns.',
      3: 'Most speech sounds are produced correctly, but errors on some consonants or stress may make a few words hard to understand.',
      2: 'Consistent mispronunciations; about one third of speech may be unintelligible. Incorrect stress on some words.',
      1: 'Many mispronunciations with a strong non-English accent. Listeners may struggle to understand most of the speech.',
      0: 'Pronunciation is characteristic of another language. More than half of speech is unintelligible.'
    };
    return descriptors[band] || '';
  },

  /**
   * Official PTE-style oral fluency band descriptors
   */
  getFluencyDescriptor(band) {
    const descriptors = {
      5: 'Smooth, natural rhythm and phrasing. No hesitations, repetitions, or false starts.',
      4: 'Acceptable rhythm with appropriate phrasing. No more than one hesitation or repetition.',
      3: 'Uneven but continuous speech. Multiple hesitations but few repetitions or false starts.',
      2: 'Staccato or uneven speech. At least one smooth three-word phrase, but noticeable pauses.',
      1: 'Irregular phrasing and poor rhythm. Multiple long pauses and hesitations.',
      0: 'Slow, labored speech with numerous pauses, hesitations, repetitions, and false starts.'
    };
    return descriptors[band] || '';
  },

  // ═══════════════════════════════════════════════════════════════
  // FEEDBACK GENERATION — Based on official PTE band descriptors
  // ═══════════════════════════════════════════════════════════════

  getFeedback(scores, type) {
    const feedback = [];

    // Content feedback
    if (scores.contentResult) {
      const cr = scores.contentResult;
      if (type === 'read-aloud') {
        if (cr.accuracy >= 95) feedback.push('Excellent reading! Almost all words read correctly.');
        else if (cr.accuracy >= 80) feedback.push(`Good reading with ${cr.errors} word error(s). Focus on reading each word accurately without skipping or replacing.`);
        else if (cr.accuracy >= 60) feedback.push(`${cr.errors} word errors detected. Practice reading more carefully — each omission, replacement, or insertion costs marks.`);
        else feedback.push(`Significant content errors (${cr.errors} errors). Practice reading the full text word by word before speaking.`);
      } else if (type === 'repeat-sentence') {
        if (cr.band === 3) feedback.push('Perfect! All words repeated in the correct sequence.');
        else if (cr.band === 2) feedback.push('Good attempt — at least 50% of words were in the correct sequence. Try to catch the beginning and end of the sentence.');
        else if (cr.band === 1) feedback.push('Some words captured but less than 50% in sequence. Focus on listening to the full sentence before speaking.');
        else feedback.push('Almost no words from the prompt were captured. Listen carefully to the entire sentence and try to repeat immediately.');
      } else if (type === 'describe-image') {
        if (cr.band >= 5) feedback.push('Excellent description! You covered the key elements, relationships, and implications thoroughly.');
        else if (cr.band >= 4) feedback.push('Good description with most elements covered. Try to also discuss relationships between data points and draw conclusions.');
        else if (cr.band >= 3) feedback.push('Adequate description but somewhat superficial. Include more specific data values and explain what the data means.');
        else if (cr.band >= 2) feedback.push('Description was minimal. Practice describing: chart type, title, highest/lowest values, trends, and a conclusion.');
        else feedback.push('Very limited description. Use a template: "This [chart type] shows [topic]. The highest/lowest is... Overall, we can see..."');
      } else {
        // Retell Lecture, SGD, RTS
        if (cr.band >= 5) feedback.push('Excellent content coverage! Main ideas captured accurately with good use of own words.');
        else if (cr.band >= 4) feedback.push('Good content but some details missing. Try to cover all main points and use connective words.');
        else if (cr.band >= 3) feedback.push('Adequate but somewhat surface-level. Paraphrase the main ideas in your own words with more detail.');
        else if (cr.band >= 2) feedback.push('Limited content captured. Focus on identifying the 2-3 most important points and speaking about each.');
        else feedback.push('Very little content from the source material. Practice note-taking during the audio to capture key points.');
      }
    }

    // Pronunciation feedback (0-5 band)
    if (scores.pronunciation !== undefined) {
      const p = scores.pronunciation;
      feedback.push(`Pronunciation: ${this.getTraitLabel(p)} (${p}/5) — ${this.getPronunciationDescriptor(p)}`);

      if (p <= 2) {
        feedback.push('Tip: Record yourself and compare with native speakers. Focus on vowel sounds, word stress, and sentence intonation.');
      } else if (p === 3) {
        feedback.push('Tip: Work on consonant clusters and stressed syllables. Practice tongue twisters and shadow native speakers.');
      }
    }

    // Fluency feedback (0-5 band)
    if (scores.fluency !== undefined) {
      const f = scores.fluency;
      feedback.push(`Oral Fluency: ${this.getTraitLabel(f)} (${f}/5) — ${this.getFluencyDescriptor(f)}`);

      if (f <= 2) {
        feedback.push('Tip: Practice reading aloud daily. Avoid long pauses — it\'s better to keep speaking even if imperfect than to stop.');
      } else if (f === 3) {
        feedback.push('Tip: Reduce fillers ("um", "uh") and avoid self-correction. Maintain a steady pace throughout your response.');
      }
    }

    // Vocabulary feedback (ASQ)
    if (scores.vocabulary !== undefined) {
      if (scores.vocabulary === 1) feedback.push('Correct answer! Well done.');
      else feedback.push('Incorrect. The answer should be a single word or short phrase. Review the correct answer.');
    }

    return feedback;
  }
};
