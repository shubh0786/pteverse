/**
 * PTE Speaking Module - Mock Exam Controller
 * Simulates a real PTE Academic Speaking test with:
 * - Sequential question flow matching real exam order
 * - Auto-advancing timers (no manual skip)
 * - No feedback during test (exam conditions)
 * - Comprehensive score report at the end
 */

window.PTE = window.PTE || {};

PTE.Exam = {
  // ── Test Configurations ──────────────────────────────────────

  CONFIGS: {
    full: {
      id: 'full',
      name: 'Full Mock Test',
      description: 'Complete PTE Speaking section — all question types in exam order',
      duration: '~25 min',
      icon: '🎯',
      color: '#6366f1',
      sections: [
        { type: 'read-aloud', count: 3, label: 'Read Aloud' },
        { type: 'repeat-sentence', count: 4, label: 'Repeat Sentence' },
        { type: 'describe-image', count: 2, label: 'Describe Image' },
        { type: 'retell-lecture', count: 2, label: 'Re-tell Lecture' },
        { type: 'answer-short-question', count: 4, label: 'Answer Short Question' },
        { type: 'summarize-group-discussion', count: 1, label: 'Summarize Group Discussion' },
        { type: 'respond-to-situation', count: 1, label: 'Respond to a Situation' }
      ]
    },
    quick: {
      id: 'quick',
      name: 'Quick Mock Test',
      description: 'Shorter test covering all question types — great for daily practice',
      duration: '~10 min',
      icon: '⚡',
      color: '#f59e0b',
      sections: [
        { type: 'read-aloud', count: 1, label: 'Read Aloud' },
        { type: 'repeat-sentence', count: 2, label: 'Repeat Sentence' },
        { type: 'describe-image', count: 1, label: 'Describe Image' },
        { type: 'retell-lecture', count: 1, label: 'Re-tell Lecture' },
        { type: 'answer-short-question', count: 2, label: 'Answer Short Question' },
        { type: 'summarize-group-discussion', count: 1, label: 'Summarize Group Discussion' },
        { type: 'respond-to-situation', count: 1, label: 'Respond to a Situation' }
      ]
    },
    focus: {
      id: 'focus',
      name: 'Focus Test',
      description: 'Intensive test on Read Aloud + Repeat Sentence — highest impact tasks',
      duration: '~8 min',
      icon: '🔥',
      color: '#ef4444',
      sections: [
        { type: 'read-aloud', count: 4, label: 'Read Aloud' },
        { type: 'repeat-sentence', count: 6, label: 'Repeat Sentence' }
      ]
    },
    'prediction-speaking': {
      id: 'prediction-speaking',
      name: 'Prediction Speaking Test',
      description: 'Focused prediction-style practice: 6 Describe Image, 3 Re-tell Lecture, 3 Summarize Group Discussion, and 3 Respond to a Situation.',
      duration: '~18 min',
      icon: '🧪',
      color: '#06b6d4',
      sections: [
        { type: 'describe-image', count: 6, label: 'Describe Image — 6 questions' },
        { type: 'retell-lecture', count: 3, label: 'Re-tell Lecture — 3 questions' },
        { type: 'summarize-group-discussion', count: 3, label: 'Summarize Group Discussion — 3 questions' },
        { type: 'respond-to-situation', count: 3, label: 'Respond to a Situation — 3 questions' }
      ],
      templateCheck: true,
      adaptive: true
    },
    'full-pte': {
      id: 'full-pte',
      name: 'Full PTE Academic',
      description: 'All 4 modules — Speaking & Writing, Reading, and Listening (22 question types)',
      duration: '~75 min',
      icon: '🏆',
      color: '#8b5cf6',
      sections: [
        // Part 1 — Speaking
        { type: 'read-aloud', module: 'speaking', count: 2, label: 'Read Aloud' },
        { type: 'repeat-sentence', module: 'speaking', count: 3, label: 'Repeat Sentence' },
        { type: 'describe-image', module: 'speaking', count: 1, label: 'Describe Image' },
        { type: 'retell-lecture', module: 'speaking', count: 1, label: 'Re-tell Lecture' },
        { type: 'answer-short-question', module: 'speaking', count: 2, label: 'Answer Short Question' },
        { type: 'summarize-group-discussion', module: 'speaking', count: 1, label: 'Summarize Group Discussion' },
        { type: 'respond-to-situation', module: 'speaking', count: 1, label: 'Respond to a Situation' },
        // Part 1 — Writing
        { type: 'swt', module: 'writing', count: 1, label: 'Summarize Written Text' },
        { type: 'write-essay', module: 'writing', count: 1, label: 'Write Essay' },
        // Part 2 — Reading
        { type: 'rw-fib', module: 'reading', count: 2, label: 'Reading & Writing: Fill in the Blanks' },
        { type: 'r-mcma', module: 'reading', count: 1, label: 'Multiple Choice (Multiple)' },
        { type: 'reorder', module: 'reading', count: 1, label: 'Re-order Paragraphs' },
        { type: 'r-fib', module: 'reading', count: 1, label: 'Reading: Fill in the Blanks' },
        { type: 'r-mcsa', module: 'reading', count: 1, label: 'Multiple Choice (Single)' },
        // Part 3 — Listening
        { type: 'sst', module: 'listening', count: 1, label: 'Summarize Spoken Text' },
        { type: 'l-mcma', module: 'listening', count: 1, label: 'Multiple Choice (Multiple)' },
        { type: 'l-fib', module: 'listening', count: 1, label: 'Fill in the Blanks' },
        { type: 'l-hcs', module: 'listening', count: 1, label: 'Highlight Correct Summary' },
        { type: 'l-mcsa', module: 'listening', count: 1, label: 'Multiple Choice (Single)' },
        { type: 'l-smw', module: 'listening', count: 1, label: 'Select Missing Word' },
        { type: 'l-hiw', module: 'listening', count: 1, label: 'Highlight Incorrect Words' },
        { type: 'l-wfd', module: 'listening', count: 2, label: 'Write from Dictation' }
      ]
    }
  },

  // ── State ────────────────────────────────────────────────────

  active: false,
  config: null,
  questions: [],          // Flat array of {type, typeConfig, question, index}
  currentIndex: 0,
  results: [],            // Array of {type, question, scores, transcript, overallScore, duration}
  testStartTime: 0,
  questionStartTime: 0,
  micStream: null,

  detectTemplateUse(transcript, type, question) {
    if (!['retell-lecture', 'summarize-group-discussion', 'respond-to-situation'].includes(type)) return null;
    const text = String(transcript || '').toLowerCase();
    const words = text.match(/[a-z']+/g) || [];
    const uniqueWords = new Set(words).size;
    const vocabularyDiversity = words.length ? uniqueWords / words.length : 0;
    const markers = {
      'retell-lecture': ['the lecture is about', 'firstly', 'moreover', 'in conclusion', 'the speaker mentioned'],
      'summarize-group-discussion': ['the group discussed', 'speaker a', 'speaker b', 'overall,', 'in conclusion'],
      'respond-to-situation': ['thank you for', 'i wanted to discuss', 'i understand', 'i would like to suggest', 'would that be acceptable']
    }[type];
    const hits = markers.filter((marker) => text.includes(marker));
    const source = type === 'summarize-group-discussion'
      ? (question && question.speakers ? question.speakers.map((speaker) => speaker.text).join(' ') : '')
      : type === 'respond-to-situation'
        ? `${question && question.scenario ? question.scenario : ''} ${question && question.audioText ? question.audioText : ''}`
        : (question && (question.audioText || question.text) ? (question.audioText || question.text) : '');
    const sourceWords = (source.toLowerCase().match(/[a-z']+/g) || [])
      .filter((word) => word.length > 4 && !['about', 'there', 'which', 'their', 'would', 'could'].includes(word));
    const sourceTerms = [...new Set([...(question && question.keywords || []), ...sourceWords])].slice(0, 24);
    const coveredTerms = sourceTerms.filter((term) => text.includes(String(term).toLowerCase()));
    const taskCoverage = sourceTerms.length ? coveredTerms.length / sourceTerms.length : 0;
    const genericPenalty = vocabularyDiversity < 0.42 && words.length >= 25 ? 1 : 0;
    const signal = Math.min(1, hits.length / 3) * 0.55 + genericPenalty * 0.2 + (1 - taskCoverage) * 0.25;
    const level = signal >= 0.62 ? 'high' : signal >= 0.38 ? 'medium' : 'low';
    const likely = level !== 'low';
    const confidence = Math.round(Math.min(0.95, 0.45 + Math.abs(signal - 0.5) * 0.9) * 100);
    return {
      likely, level, confidence, hits, coveredTerms, taskCoverage: Math.round(taskCoverage * 100),
      vocabularyDiversity: Math.round(vocabularyDiversity * 100),
      note: likely
        ? 'Template-like phrasing may be limiting your task-specific response. Retry with your own structure and wording.'
        : 'No strong memorized-template signal detected. Keep using task-specific ideas and natural phrasing.'
    };
  },

  analyzeTaskFulfilment(transcript, type, question) {
    const text = String(transcript || '').toLowerCase();
    const source = type === 'summarize-group-discussion'
      ? (question && question.speakers ? question.speakers.map((speaker) => speaker.text).join(' ') : '')
      : type === 'respond-to-situation'
        ? `${question && question.scenario ? question.scenario : ''} ${question && question.audioText ? question.audioText : ''}`
        : (question && (question.audioText || question.text) ? (question.audioText || question.text) : '');
    const terms = [...new Set([...(question && question.keywords || []), ...(source.match(/[a-z']+/gi) || [])
      .filter((word) => word.length > 5)
      .filter((word) => !['about', 'therefore', 'because', 'should', 'would', 'could', 'speaker'].includes(word.toLowerCase()))])].slice(0, 20);
    const matched = terms.filter((term) => text.includes(String(term).toLowerCase()));
    const missing = terms.filter((term) => !text.includes(String(term).toLowerCase())).slice(0, 8);
    const coverage = terms.length ? Math.round((matched.length / terms.length) * 100) : 0;
    const words = text.match(/[a-z']+/g) || [];
    const length = words.length;
    const level = coverage >= 60 && length >= 35 ? 'high' : coverage >= 30 && length >= 15 ? 'medium' : 'low';
    return { level, coverage, matched: matched.slice(0, 8), missing, wordCount: length };
  },

  analyzeFluency(transcript, timestamps, duration) {
    const words = String(transcript || '').toLowerCase().match(/[a-z']+/g) || [];
    const wpm = duration > 0 ? Math.round((words.length / duration) * 60) : 0;
    let longPauses = 0;
    let hesitations = 0;
    for (let i = 1; i < (timestamps || []).length; i++) {
      const gap = timestamps[i].time - timestamps[i - 1].time;
      if (gap > 3000) longPauses++;
      else if (gap > 1500) hesitations++;
    }
    const repeatedWords = [];
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1] && !repeatedWords.includes(words[i])) repeatedWords.push(words[i]);
    }
    const level = wpm >= 100 && wpm <= 180 && longPauses === 0 && hesitations <= 1
      ? 'strong'
      : wpm >= 70 && longPauses <= 2
        ? 'developing'
        : 'needs practice';
    return { level, wpm, longPauses, hesitations, repeatedWords: repeatedWords.slice(0, 6) };
  },

  questionDifficulty(question) {
    const value = String(question && question.difficulty || '').toLowerCase();
    if (value === 'easy' || value === 'medium' || value === 'hard') return value;
    const text = String(question && (question.text || question.audioText || question.prompt || '')).trim();
    const words = text ? text.split(/\s+/).length : 0;
    return words >= 70 ? 'hard' : words >= 30 ? 'medium' : 'easy';
  },

  adaptiveQuestionOrder(bank, type) {
    const history = PTE.Store ? PTE.Store.getSessionsByType(type) : [];
    const latestByQuestion = new Map();
    history.forEach((session) => {
      if (session.questionId && !latestByQuestion.has(session.questionId)) latestByQuestion.set(session.questionId, session.overallScore || 0);
    });
    return [...bank].sort((a, b) => {
      const aScore = latestByQuestion.get(a.id);
      const bScore = latestByQuestion.get(b.id);
      const aPriority = aScore === undefined ? 2 : aScore < 65 ? 3 : 1;
      const bPriority = bScore === undefined ? 2 : bScore < 65 ? 3 : 1;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return Math.random() - 0.5;
    });
  },

  // ── Initialization ───────────────────────────────────────────

  /**
   * Build the question list for a test config
   */
  buildQuestionList(configId) {
    const config = this.CONFIGS[configId];
    if (!config) return [];

    const BANKS = {
      speaking: (t) => PTE.Questions[t] || [],
      writing: (t) => (PTE.WritingQuestions ? PTE.WritingQuestions[t] || [] : []),
      reading: (t) => (PTE.ReadingQuestions ? PTE.ReadingQuestions[t] || [] : []),
      listening: (t) => (PTE.ListeningQuestions ? PTE.ListeningQuestions[t] || [] : [])
    };
    const TYPE_MAPS = {
      speaking: PTE.QUESTION_TYPES,
      writing: PTE.WRITING_TYPES,
      reading: PTE.READING_TYPES,
      listening: PTE.LISTENING_TYPES
    };

    const questions = [];
    const usedIds = new Set();

    for (const section of config.sections) {
      const module = section.module || 'speaking';
      const bank = (BANKS[module] || BANKS.speaking)(section.type);
      const typeMap = TYPE_MAPS[module] || TYPE_MAPS.speaking;
      const typeConfig = Object.values(typeMap).find(t => t.id === section.type);

      // Prefer unseen or previously weak items, then randomize within that priority.
      const shuffled = config.adaptive ? this.adaptiveQuestionOrder(bank, section.type) : [...bank].sort(() => Math.random() - 0.5);
      let picked = 0;

      for (const q of shuffled) {
        if (picked >= section.count) break;
        if (usedIds.has(q.id)) continue;
        usedIds.add(q.id);
        questions.push({
          type: section.type,
          module,
          typeConfig: typeConfig,
          question: q,
          difficulty: this.questionDifficulty(q),
          sectionLabel: section.label,
          index: questions.length
        });
        picked++;
      }
    }

    return questions;
  },

  /**
   * Start the mock test
   */
  async start(configId) {
    this.config = this.CONFIGS[configId];
    if (!this.config) return;

    this.questions = this.buildQuestionList(configId);
    if (this.questions.length === 0) return;

    this.currentIndex = 0;
    this.results = [];
    this.active = true;
    this.testStartTime = Date.now();

    // Get microphone access upfront (only if the test includes speaking)
    const hasSpeaking = this.config.sections.some(s => (s.module || 'speaking') === 'speaking');
    if (hasSpeaking) {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        alert('Microphone access is required for this mock test. Please allow microphone access and try again.');
        this.active = false;
        return;
      }
    } else {
      this.micStream = null;
    }

    // Render exam interface
    this.renderExamUI();

    // Show instructions briefly, then start
    await this.showCountdown();

    // Begin first question
    await this.runQuestion();
  },

  /**
   * Show 3-2-1 countdown before test starts
   */
  showCountdown() {
    return new Promise(async (resolve) => {
      const overlay = document.getElementById('exam-overlay');
      if (!overlay) { resolve(); return; }

      for (let i = 3; i >= 1; i--) {
        overlay.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full animate-fadeIn">
          <p class="text-zinc-500 text-sm mb-2">Test starting in</p>
          <div class="w-24 h-24 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-xl shadow-black/40">
            <span class="text-5xl font-semibold text-white">${i}</span>
          </div>
          <p class="text-zinc-500 text-xs mt-4">Get ready — exam conditions apply</p>
        </div>`;
        await this._sleep(1000);
      }

      overlay.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full animate-fadeIn">
        <div class="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-black/40">
          <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
        </div>
        <p class="text-emerald-400 font-semibold mt-3">Begin!</p>
      </div>`;
      await this._sleep(800);

      overlay.classList.add('hidden');
      resolve();
    });
  },

  // ── Render Exam UI ───────────────────────────────────────────

  renderExamUI() {
    const total = this.questions.length;
    const root = document.getElementById('app-root');

    root.innerHTML = `
    <div class="min-h-screen bg-[#09090b] flex flex-col">
      <!-- Exam top bar -->
      <div class="bg-[#09090b] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-extrabold text-xs">C</span>
          </div>
          <div>
            <span class="font-semibold text-sm">${this.config.name}</span>
            <span class="text-zinc-500 text-xs ml-2" id="exam-section-label">--</span>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-zinc-500">Question</span>
            <span class="font-bold" id="exam-q-counter">1 / ${total}</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="font-bold tabular-nums" id="exam-elapsed">00:00</span>
          </div>
          <button onclick="PTE.Exam.confirmEnd()" class="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1 rounded border border-red-400/30 hover:border-red-300/50 transition-colors">
            End Test
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="h-1.5 bg-[var(--surface-3)]">
        <div id="exam-progress-bar" class="h-full bg-indigo-500 transition-all duration-500" style="width:0%"></div>
      </div>

      <!-- Main exam area -->
      <div class="flex-1 flex flex-col">
        <!-- Question type indicator -->
        <div class="bg-[var(--surface-1)] border-b border-[var(--border)] px-6 py-3" id="exam-type-bar">
          <div class="max-w-3xl mx-auto flex items-center gap-3">
            <span class="text-2xl" id="exam-type-icon">📖</span>
            <div>
              <h2 class="font-semibold text-zinc-100 text-lg" id="exam-type-name">Read Aloud</h2>
              <p class="text-xs text-zinc-500" id="exam-type-desc">Read the text aloud</p>
            </div>
            <div class="ml-auto" id="exam-timer-area">
              ${PTE.UI.timer('exam-timer')}
            </div>
          </div>
        </div>

        <!-- Question content -->
        <div class="flex-1 px-4 py-6">
          <div class="max-w-3xl mx-auto" id="exam-content">
            <!-- Question rendered here -->
          </div>
        </div>

        <!-- Bottom status bar -->
        <div class="bg-[var(--surface-1)] border-t border-[var(--border)] px-6 py-3">
          <div class="max-w-3xl mx-auto flex items-center justify-between">
            <div id="exam-status" class="flex items-center gap-2 text-sm text-zinc-500">
              <span>Waiting to begin...</span>
            </div>
            <div id="exam-waveform-mini" class="hidden">
              <canvas id="exam-waveform" class="h-10 rounded-lg bg-white/[0.02]" style="width:200px"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Overlay for countdown / transitions -->
      <div id="exam-overlay" class="fixed inset-0 bg-[#09090b]/95 backdrop-blur-sm z-40 flex items-center justify-center">
      </div>
    </div>`;

    // Start elapsed timer
    this._startElapsedTimer();
  },

  // ── Run a Single Question ────────────────────────────────────

  async runQuestion() {
    if (this.currentIndex >= this.questions.length) {
      this.finishTest();
      return;
    }

    const item = this.questions[this.currentIndex];
    this.questionStartTime = Date.now();
    this._updateHeader(item);

    const module = item.module || 'speaking';
    if (module === 'writing') return this._runWritingQuestion(item);
    if (module === 'reading') return this._runReadingQuestion(item);
    if (module === 'listening') return this._runListeningQuestion(item);
    return this._runSpeakingQuestion(item);
  },

  // Shared: store result, advance to next question
  async _completeAndAdvance(result) {
    this.results.push(result);
    this.currentIndex++;

    const status = document.getElementById('exam-status');
    if (status) status.innerHTML = '<span class="text-zinc-500">Moving to next question...</span>';

    await this._showTransition();

    // Cleanup any module state
    if (PTE.AudioRecorder) PTE.AudioRecorder.cleanup();
    if (PTE.ToneAnalyzer) PTE.ToneAnalyzer.cleanup();
    if (PTE.WritingEngine) PTE.WritingEngine.cleanup();
    if (PTE.ListeningEngine) PTE.ListeningEngine.cleanup();
    [PTE.WritingEngine, PTE.ReadingEngine, PTE.ListeningEngine].forEach(e => {
      if (e) { e.examMode = false; e.onExamSubmit = null; }
    });

    await this.runQuestion();
  },

  // ── Speaking ─────────────────────────────────────────────────

  async _runSpeakingQuestion(item) {
    const { type, typeConfig, question } = item;

    // Reset audio
    await this._initRecorder();

    // Build question content
    const content = document.getElementById('exam-content');
    content.innerHTML = this._renderQuestionContent(type, typeConfig, question);

    const status = document.getElementById('exam-status');

    // ── Phase 1: Audio playback (for listen-type questions) ──
    if (typeConfig.hasAudio) {
      status.innerHTML = '<span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span><span class="text-[var(--accent-light)] font-medium">Playing audio — listen carefully</span>';
      await this._playAudio(question);
      await this._sleep(300);
    }

    // ── Phase 2: Preparation ──
    if (typeConfig.prepTime > 0) {
      status.innerHTML = '<span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span><span class="text-amber-400 font-medium">Preparation time</span>';
      await this._runTimer(typeConfig.prepTime, 'Preparation');
    }

    // ── Phase 3: Recording ──
    status.innerHTML = '<span class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span><span class="text-red-400 font-medium">Recording — speak now</span>';
    document.getElementById('exam-waveform-mini').classList.remove('hidden');

    // Start recording + speech recognition + tone
    PTE.AudioRecorder.start();
    PTE.SpeechRecognizer.onResult = () => {};
    PTE.SpeechRecognizer.start();
    if (this.micStream && PTE.ToneAnalyzer) {
      PTE.ToneAnalyzer.init(this.micStream);
      PTE.ToneAnalyzer.start();
    }

    // Waveform animation
    const drawWave = () => {
      if (!PTE.AudioRecorder.isRecording) return;
      const data = PTE.AudioRecorder.getFrequencyData();
      if (data) PTE.UI.drawWaveform('exam-waveform', data, '#ef4444');
      requestAnimationFrame(drawWave);
    };
    drawWave();

    await this._runTimer(typeConfig.recordTime, 'Recording');

    // Stop everything
    let toneResults = null;
    if (PTE.ToneAnalyzer && PTE.ToneAnalyzer.isAnalyzing) {
      toneResults = PTE.ToneAnalyzer.stop();
    }
    await PTE.AudioRecorder.stop();
    const speechResult = PTE.SpeechRecognizer.stop();
    document.getElementById('exam-waveform-mini').classList.add('hidden');

    // ── Evaluate silently ──
    const recordDuration = (Date.now() - this.questionStartTime) / 1000;
    const transcript = PTE.SpeechRecognizer.transcript.trim();
    const confidence = PTE.SpeechRecognizer.getAverageConfidence();
    const wordTimestamps = PTE.SpeechRecognizer.wordTimestamps;
    const expectedText = question.text || (question.speakers ? question.speakers.map(s => s.text).join(' ') : '') || question.audioText || '';

    let scores = {};
    if (typeConfig.scoring.includes('vocabulary')) {
      scores.vocabulary = PTE.Scoring.vocabularyScore(transcript, question.keywords);
    } else {
      if (typeConfig.scoring.includes('content') || typeConfig.scoring.includes('appropriacy')) {
        scores.contentResult = PTE.Scoring.contentScore(transcript, expectedText, question.keywords, type, question);
        scores.content = scores.contentResult.max > 0
          ? PTE.Scoring.bandTo90(scores.contentResult.raw, scores.contentResult.max)
          : 0;
        if (typeConfig.scoring.includes('appropriacy')) {
          scores.contentResult.traitName = 'Appropriacy';
        }
      }
      if (typeConfig.scoring.includes('pronunciation')) scores.pronunciation = PTE.Scoring.pronunciationScore(confidence, transcript, expectedText);
      if (typeConfig.scoring.includes('fluency')) scores.fluency = PTE.Scoring.fluencyScore(wordTimestamps, recordDuration, transcript, typeConfig.recordTime);
    }

    const overallScore = PTE.Scoring.calculateOverall(scores, type);
    const taskFulfilment = this.config.templateCheck ? this.analyzeTaskFulfilment(transcript, type, question) : null;
    const templateUse = this.config.templateCheck ? this.detectTemplateUse(transcript, type, question) : null;
    const fluencyAnalysis = this.config.templateCheck ? this.analyzeFluency(transcript, wordTimestamps, recordDuration) : null;

    await this._completeAndAdvance({
      module: 'speaking',
      type, typeConfig, question, scores, overallScore, transcript, toneResults,
      duration: recordDuration, audioUrl: PTE.AudioRecorder.audioUrl, templateUse, taskFulfilment, fluencyAnalysis,
      difficulty: this.questionDifficulty(question)
    });
  },

  // ── Writing ──────────────────────────────────────────────────

  async _runWritingQuestion(item) {
    const { type, typeConfig, question } = item;
    const content = document.getElementById('exam-content');
    content.innerHTML = '';

    const status = document.getElementById('exam-status');
    if (status) status.innerHTML = '<span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span><span class="text-[var(--accent-light)] font-medium">Writing — submit when finished</span>';

    const startedAt = this.questionStartTime;
    PTE.WritingEngine.examMode = true;
    PTE.WritingEngine.onExamSubmit = (data) => {
      const duration = (Date.now() - startedAt) / 1000;
      this._completeAndAdvance({
        module: 'writing',
        type, typeConfig, question,
        scores: data.scores,
        overallScore: data.scores.overall,
        transcript: (data.text || '').slice(0, 200),
        duration
      });
    };

    PTE.WritingEngine.start(type, question, 'exam-content');
  },

  // ── Reading ──────────────────────────────────────────────────

  async _runReadingQuestion(item) {
    const { type, typeConfig, question } = item;
    const content = document.getElementById('exam-content');
    content.innerHTML = '';

    const status = document.getElementById('exam-status');
    if (status) status.innerHTML = '<span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span><span class="text-[var(--accent-light)] font-medium">Reading — choose your answer, then submit</span>';

    const startedAt = this.questionStartTime;
    PTE.ReadingEngine.examMode = true;
    PTE.ReadingEngine.onExamSubmit = (data) => {
      const duration = (Date.now() - startedAt) / 1000;
      this._completeAndAdvance({
        module: 'reading',
        type, typeConfig, question,
        scores: { overall: data.overall },
        overallScore: data.overall,
        transcript: data.summary,
        duration
      });
    };

    PTE.ReadingEngine.render(type, question, 'exam-content');
    this._relabelSubmitButton('Submit & Next');
  },

  // ── Listening ────────────────────────────────────────────────

  async _runListeningQuestion(item) {
    const { type, typeConfig, question } = item;
    const content = document.getElementById('exam-content');
    content.innerHTML = '';

    const status = document.getElementById('exam-status');
    if (status) status.innerHTML = '<span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span><span class="text-[var(--accent-light)] font-medium">Listening — play the audio, then submit</span>';

    const startedAt = this.questionStartTime;
    PTE.ListeningEngine.examMode = true;
    PTE.ListeningEngine.onExamSubmit = (data) => {
      const duration = (Date.now() - startedAt) / 1000;
      this._completeAndAdvance({
        module: 'listening',
        type, typeConfig, question,
        scores: { overall: data.overall },
        overallScore: data.overall,
        transcript: data.summary,
        duration
      });
    };

    PTE.ListeningEngine.render(type, question, 'exam-content');
    this._relabelSubmitButton('Submit & Next');
  },

  _relabelSubmitButton(label) {
    const btn = document.querySelector('#exam-content .btn-primary');
    if (btn) btn.textContent = label;
  },

  async _showTransition() {
    const overlay = document.getElementById('exam-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');

    if (this.currentIndex < this.questions.length) {
      const next = this.questions[this.currentIndex];
      overlay.innerHTML = `
      <div class="text-center animate-fadeIn">
        <p class="text-zinc-500 text-sm mb-1">Next Question</p>
        <div class="flex items-center gap-2 justify-center mb-2">
          <span class="text-3xl">${next.typeConfig.icon}</span>
          <h3 class="text-xl font-semibold text-zinc-200">${next.typeConfig.name}</h3>
        </div>
        <p class="text-xs text-zinc-500">Question ${this.currentIndex + 1} of ${this.questions.length}</p>
      </div>`;
      await this._sleep(1500);
    }

    overlay.classList.add('hidden');
  },

  // ── Timer ────────────────────────────────────────────────────

  _runTimer(seconds, label) {
    return new Promise((resolve) => {
      PTE.Timer.start(seconds,
        (remaining, total) => {
          PTE.UI.updateTimer('exam-timer', remaining, total, label);
        },
        () => resolve()
      );
    });
  },

  _elapsedInterval: null,

  _startElapsedTimer() {
    const el = document.getElementById('exam-elapsed');
    this._elapsedInterval = setInterval(() => {
      if (!el) return;
      const elapsed = Math.floor((Date.now() - this.testStartTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
  },

  // ── Audio Playback ───────────────────────────────────────────

  async _playAudio(q) {
    // Prefer a recorded file when available; fall back to TTS.
    if (q.audioUrl && PTE.TTS && PTE.TTS.playFile) {
      try { await PTE.TTS.playFile(q.audioUrl); return; }
      catch (e) { console.warn('[Exam] Recorded audio unavailable, falling back to TTS:', e); }
    }
    if (q.speakers) {
      for (const speaker of q.speakers) {
        await PTE.TTS.speak(speaker.text, 0.9);
        await this._sleep(400);
      }
    } else {
      const text = q.text || q.audioText || '';
      if (text) await PTE.TTS.speak(text, 0.9);
    }
  },

  // ── Recorder Init ────────────────────────────────────────────

  async _initRecorder() {
    PTE.AudioRecorder.cleanup();
    if (this.micStream) {
      PTE.AudioRecorder.stream = this.micStream;
      PTE.AudioRecorder.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = PTE.AudioRecorder.audioContext.createMediaStreamSource(this.micStream);
      PTE.AudioRecorder.analyser = PTE.AudioRecorder.audioContext.createAnalyser();
      PTE.AudioRecorder.analyser.fftSize = 256;
      PTE.AudioRecorder.analyser.smoothingTimeConstant = 0.8;
      source.connect(PTE.AudioRecorder.analyser);
      PTE.AudioRecorder.dataArray = new Uint8Array(PTE.AudioRecorder.analyser.frequencyBinCount);
    }
    // Reset speech recognizer
    PTE.SpeechRecognizer.transcript = '';
    PTE.SpeechRecognizer.interimTranscript = '';
    PTE.SpeechRecognizer.confidenceScores = [];
    PTE.SpeechRecognizer.wordTimestamps = [];
  },

  // ── Render Question Content ──────────────────────────────────

  _renderQuestionContent(type, typeConfig, q) {
    let html = '<div class="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] shadow-sm p-6 md:p-8">';

    // Source badge
    if (q.source) {
      html += `<div class="mb-3"><span class="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-surface)] text-[var(--accent-light)]">Source: ${q.source}</span></div>`;
    }

    // Read Aloud text
    if (type === 'read-aloud' && q.text) {
      html += `
      <label class="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Read the following text aloud:</label>
      <div class="bg-white/[0.02] rounded-xl p-5 text-zinc-200 leading-relaxed text-lg border border-[var(--border)]">${q.text}</div>`;
    }

    // Scenario
    if (q.scenario) {
      html += `
      <label class="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Scenario:</label>
      <div class="bg-blue-500/5 border border-blue-500/10 rounded-xl p-5 text-blue-300 leading-relaxed">${q.scenario}</div>`;
    }

    // Chart
    if (typeConfig.hasImage && q.chartType) {
      html += `
      <label class="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 block">Describe the image below:</label>
      <div class="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">${PTE.Charts.generate(q)}</div>`;
    }

    // Speakers (SGD) - shown but not highlighted until audio plays
    if (q.speakers) {
      html += `
      <label class="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Group Discussion:</label>
      <div class="space-y-2 bg-white/[0.02] rounded-xl p-4 border border-[var(--border)]">
        ${q.speakers.map(s => `
          <div class="flex items-start gap-2">
            <span class="w-7 h-7 rounded-full bg-[var(--accent-surface)] flex items-center justify-center text-xs font-bold text-[var(--accent-light)] flex-shrink-0 mt-0.5">${s.name.charAt(s.name.length - 1)}</span>
            <div>
              <p class="text-xs font-semibold text-zinc-500">${s.name}</p>
              <p class="text-sm text-zinc-400">${s.text}</p>
            </div>
          </div>
        `).join('')}
      </div>`;
    }

    // Audio-based: show listening indicator
    if (typeConfig.hasAudio && !q.speakers && type !== 'read-aloud') {
      html += `
      <div class="flex items-center gap-3 bg-[var(--accent-surface)] border border-[rgba(109,92,255,0.12)] rounded-xl p-4 mt-4">
        <div class="w-10 h-10 bg-[var(--accent-surface)] rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-[var(--accent-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
        </div>
        <div>
          <p class="font-medium text-[var(--accent)] text-sm">Listen carefully</p>
          <p class="text-xs text-[var(--accent-light)]">Audio will play automatically</p>
        </div>
      </div>`;
    }

    html += '</div>';
    return html;
  },

  // ── Header Update ────────────────────────────────────────────

  _updateHeader(item) {
    const el = (id) => document.getElementById(id);
    const total = this.questions.length;

    if (el('exam-q-counter')) el('exam-q-counter').textContent = `${item.index + 1} / ${total}`;
    if (el('exam-section-label')) el('exam-section-label').textContent = item.sectionLabel;
    if (el('exam-type-icon')) el('exam-type-icon').textContent = item.typeConfig.icon;
    if (el('exam-type-name')) el('exam-type-name').textContent = item.typeConfig.name;
    if (el('exam-type-desc')) el('exam-type-desc').textContent = item.typeConfig.description;
    if (el('exam-progress-bar')) el('exam-progress-bar').style.width = `${((item.index) / total) * 100}%`;
  },

  // ── Finish Test ──────────────────────────────────────────────

  finishTest() {
    this.active = false;
    if (this._elapsedInterval) clearInterval(this._elapsedInterval);
    PTE.Timer.stop();
    if (PTE.TTS && PTE.TTS.stopAll) PTE.TTS.stopAll(); else PTE.TTS.stop();
    PTE.AudioRecorder.cleanup();
    if (PTE.ToneAnalyzer) PTE.ToneAnalyzer.cleanup();
    if (PTE.WritingEngine) PTE.WritingEngine.cleanup();
    if (PTE.ListeningEngine) PTE.ListeningEngine.cleanup();
    [PTE.WritingEngine, PTE.ReadingEngine, PTE.ListeningEngine].forEach(e => {
      if (e) { e.examMode = false; e.onExamSubmit = null; }
    });
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }

    const totalTime = Math.round((Date.now() - this.testStartTime) / 1000);
    this._renderResults(totalTime);
  },

  confirmEnd() {
    if (confirm('Are you sure you want to end the test? Your progress will be scored based on completed questions.')) {
      this.finishTest();
    }
  },

  // ── Results Report ───────────────────────────────────────────

  _renderResults(totalTime) {
    const root = document.getElementById('app-root');
    const results = this.results;

    if (results.length === 0) {
      root.innerHTML = PTE.UI.navbar('mock-test');
      root.innerHTML += '<div class="py-20 text-center"><p class="text-zinc-500">No questions were completed.</p><a href="#/mock-test" class="text-[var(--accent-light)] font-medium mt-4 inline-block">Back to Mock Tests</a></div>';
      return;
    }

    // Calculate scores
    const allScores = results.map(r => r.overallScore);
    const overallAvg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const mins = Math.floor(totalTime / 60);
    const secs = totalTime % 60;

    // Per-module scores (Speaking, Writing, Reading, Listening)
    const MODULES = [
      { id: 'speaking', name: 'Speaking', icon: '🎤', color: '#6366f1' },
      { id: 'writing', name: 'Writing', icon: '✍️', color: '#0ea5e9' },
      { id: 'reading', name: 'Reading', icon: '📖', color: '#f59e0b' },
      { id: 'listening', name: 'Listening', icon: '🎧', color: '#8b5cf6' }
    ];
    const moduleAvgs = {};
    MODULES.forEach(m => {
      const rs = results.filter(r => (r.module || 'speaking') === m.id);
      moduleAvgs[m.id] = rs.length > 0 ? Math.round(rs.reduce((a, r) => a + r.overallScore, 0) / rs.length) : null;
    });
    const presentModules = MODULES.filter(m => moduleAvgs[m.id] !== null);
    const moduleOverall = presentModules.length > 0
      ? Math.round(presentModules.reduce((a, m) => a + moduleAvgs[m.id], 0) / presentModules.length)
      : overallAvg;

    // PTE score mapping (10-90 scale) — prefer module-weighted overall
    const pteScore = moduleOverall;
    const band = PTE.Scoring.getBand(pteScore);
    let cefr = '';
    if (pteScore >= 76) cefr = 'C2';
    else if (pteScore >= 59) cefr = 'C1';
    else if (pteScore >= 50) cefr = 'B2';
    else if (pteScore >= 36) cefr = 'B1';
    else if (pteScore >= 30) cefr = 'A2';
    else cefr = 'A1';

    // Score by enabling skills
    const contentScores = results.filter(r => r.scores.content !== undefined).map(r => r.scores.content);
    const pronScores = results.filter(r => r.scores.pronunciation !== undefined).map(r => r.scores.pronunciation);
    const fluScores = results.filter(r => r.scores.fluency !== undefined).map(r => r.scores.fluency);
    const vocScores = results.filter(r => r.scores.vocabulary !== undefined).map(r => r.scores.vocabulary);

    const avg = arr => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    const avgContent = avg(contentScores);
    const avgPron = avg(pronScores);
    const avgFlu = avg(fluScores);
    const avgVoc = avg(vocScores);

    // By question type
    const byType = {};
    results.forEach(r => {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r.overallScore);
    });

    // Save to progress
    PTE.Store.addSession({
      type: 'mock-test',
      questionId: this.config.id,
      overallScore: pteScore,
      scores: { content: avgContent, pronunciation: avgPron, fluency: avgFlu },
      transcript: `Mock test: ${results.length} questions`,
      duration: totalTime
    });
    results.forEach((result) => {
      if (!result.question || !result.question.id || !result.type) return;
      PTE.Store.addSession({
        type: result.type,
        questionId: result.question.id,
        overallScore: result.overallScore,
        scores: result.scores,
        transcript: result.transcript || '',
        duration: result.duration || 0,
        source: 'mock-test',
        difficulty: result.difficulty || this.questionDifficulty(result.question)
      });
    });

    if (PTE.Store.saveExamRun) {
      PTE.Store.saveExamRun({
        id: 'exam_' + Date.now(),
        configId: this.config.id,
        name: this.config.name,
        overall: pteScore,
        cefr,
        modules: moduleAvgs,
        enabling: { content: avgContent, pronunciation: avgPron, fluency: avgFlu, vocabulary: avgVoc },
        items: results.map((r) => ({
          type: r.type,
          questionId: r.question && r.question.id ? r.question.id : '',
          module: r.module || 'speaking',
          overallScore: r.overallScore,
          transcript: r.transcript || '',
          audioUrl: r.audioUrl || '',
          templateUse: r.templateUse || null,
          taskFulfilment: r.taskFulfilment || null,
          fluencyAnalysis: r.fluencyAnalysis || null,
          difficulty: r.difficulty || this.questionDifficulty(r.question)
        })),
        duration: totalTime,
        timestamp: Date.now()
      });
    }

    // Build result rows
    let resultRows = '';
    results.forEach((r, i) => {
      const b = PTE.Scoring.getBand(r.overallScore);
      resultRows += `
      <div class="flex items-center gap-3 py-3 ${i < results.length - 1 ? 'border-b border-[var(--border)]' : ''}">
        <span class="w-6 h-6 bg-[var(--surface-3)] rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">${i + 1}</span>
        <span class="text-lg">${r.typeConfig.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-zinc-200 truncate">${r.typeConfig.name}</p>
          <p class="text-xs text-zinc-500 truncate">${r.transcript ? r.transcript.slice(0, 60) + (r.transcript.length > 60 ? '...' : '') : 'No speech detected'}</p>
          ${r.templateUse ? `<p class="text-[10px] ${r.templateUse.likely ? 'text-amber-400' : 'text-emerald-400'}">${r.templateUse.likely ? `Template signal: ${r.templateUse.level} (${r.templateUse.confidence}% confidence)` : `No strong template signal (${r.templateUse.confidence}% confidence)`}</p>` : ''}
          ${r.question && r.question.id ? `<a href="#/retry/${r.type}/${encodeURIComponent(r.question.id)}" class="text-[10px] text-cyan-400 hover:text-cyan-300">Retry this question</a>` : ''}
        </div>
        <div class="text-right">
          <span class="text-sm font-bold" style="color:${b.color}">${r.overallScore}/90</span>
        </div>
      </div>`;
    });

    const templateResults = results.filter((result) => result.templateUse);
    const templateCard = templateResults.length ? `
      <div class="card rounded-xl p-5 mb-6 border-cyan-500/10">
        <h3 class="text-sm font-semibold text-zinc-200 mb-1">Natural response check</h3>
        <p class="text-xs text-zinc-500 mb-4">Coaching estimate based on repeated phrasing, vocabulary variety, and task-specific coverage. This is not official Pearson scoring.</p>
        <div class="space-y-3">
          ${templateResults.map((result) => `
            <div class="flex items-start gap-3 text-xs">
              <span class="text-lg">${result.typeConfig.icon}</span>
              <div class="flex-1">
                <p class="text-zinc-300">${result.typeConfig.shortName}: ${result.templateUse.likely ? `Template signal ${result.templateUse.level}` : 'No strong template signal'}</p>
                <p class="text-zinc-500">${result.templateUse.note}</p>
                <p class="text-[10px] text-zinc-600 mt-1">Task-specific coverage: ${result.templateUse.taskCoverage}% · Vocabulary diversity: ${result.templateUse.vocabularyDiversity}% · Confidence: ${result.templateUse.confidence}%</p>
              </div>
            </div>`).join('')}
        </div>
      </div>` : '';
    const fulfilmentResults = results.filter((result) => result.taskFulfilment);
    const fulfilmentCard = fulfilmentResults.length ? `
      <div class="card rounded-xl p-5 mb-6 border-indigo-500/10">
        <h3 class="text-sm font-semibold text-zinc-200 mb-1">Task fulfilment</h3>
        <p class="text-xs text-zinc-500 mb-4">This measures response coverage separately from template signals.</p>
        <div class="space-y-3">
          ${fulfilmentResults.map((result) => `
            <div class="flex items-start gap-3 text-xs">
              <span class="text-lg">${result.typeConfig.icon}</span>
              <div class="flex-1">
                <p class="text-zinc-300">${result.typeConfig.shortName}: ${result.taskFulfilment.level} coverage (${result.taskFulfilment.coverage}%) · ${result.taskFulfilment.wordCount} words</p>
                <p class="text-emerald-400">Covered: ${result.taskFulfilment.matched.length ? result.taskFulfilment.matched.join(', ') : 'No key terms detected'}</p>
                <p class="text-amber-400">Review: ${result.taskFulfilment.missing.length ? result.taskFulfilment.missing.join(', ') : 'No major tracked terms missing'}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>` : '';
    const fluencyResults = results.filter((result) => result.fluencyAnalysis);
    const fluencyCard = fluencyResults.length ? `
      <div class="card rounded-xl p-5 mb-6 border-emerald-500/10">
        <h3 class="text-sm font-semibold text-zinc-200 mb-1">Fluency coaching</h3>
        <p class="text-xs text-zinc-500 mb-4">Delivery signals are estimates from browser speech recognition timestamps.</p>
        <div class="space-y-3">
          ${fluencyResults.map((result) => `
            <div class="flex items-start gap-3 text-xs">
              <span class="text-lg">${result.typeConfig.icon}</span>
              <div class="flex-1">
                <p class="text-zinc-300">${result.typeConfig.shortName}: ${result.fluencyAnalysis.level} · ${result.fluencyAnalysis.wpm} words/min</p>
                <p class="text-zinc-500">Long pauses: ${result.fluencyAnalysis.longPauses} · Hesitations: ${result.fluencyAnalysis.hesitations} · Repeated words: ${result.fluencyAnalysis.repeatedWords.length ? result.fluencyAnalysis.repeatedWords.join(', ') : 'none detected'}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>` : '';
    const difficultyGroups = {};
    results.forEach((result) => {
      const difficulty = result.difficulty || this.questionDifficulty(result.question);
      if (!difficultyGroups[difficulty]) difficultyGroups[difficulty] = [];
      difficultyGroups[difficulty].push(result.overallScore);
    });
    const difficultyCard = Object.keys(difficultyGroups).length ? `
      <div class="card rounded-xl p-5 mb-6 border-amber-500/10">
        <h3 class="text-sm font-semibold text-zinc-200 mb-1">Performance by difficulty</h3>
        <p class="text-xs text-zinc-500 mb-4">Difficulty is tagged from the question bank or estimated from prompt complexity.</p>
        <div class="grid grid-cols-3 gap-2">
          ${['easy', 'medium', 'hard'].filter((level) => difficultyGroups[level]).map((level) => {
            const scores = difficultyGroups[level];
            const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
            return `<div class="rounded-lg bg-white/[0.03] p-3 text-center"><p class="text-[10px] uppercase text-zinc-500">${level}</p><p class="text-lg font-semibold text-zinc-200">${score}/90</p><p class="text-[10px] text-zinc-600">${scores.length} question${scores.length === 1 ? '' : 's'}</p></div>`;
          }).join('')}
        </div>
      </div>` : '';

    // Type breakdown
    const ALL_TYPE_MAPS = [PTE.QUESTION_TYPES, PTE.WRITING_TYPES, PTE.READING_TYPES, PTE.LISTENING_TYPES];
    const findTypeConfig = (id) => {
      for (const map of ALL_TYPE_MAPS) { const t = Object.values(map).find(x => x.id === id); if (t) return t; }
      return null;
    };
    let typeRows = '';
    Object.entries(byType).forEach(([typeId, scores]) => {
      const tc = findTypeConfig(typeId);
      if (!tc) return;
      const typeAvg = avg(scores);
      const pct = (typeAvg / 90) * 100;
      typeRows += `
      <div class="flex items-center gap-3">
        <span class="text-lg">${tc.icon}</span>
        <div class="flex-1">
          <div class="flex justify-between mb-1">
            <span class="text-xs font-medium text-zinc-400">${tc.name} (${scores.length})</span>
            <span class="text-xs font-bold" style="color:${tc.color}">${typeAvg}/90</span>
          </div>
          <div class="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <div class="h-full rounded-full" style="width:${pct}%;background:${tc.color}"></div>
          </div>
        </div>
      </div>`;
    });

    // Module scores card (only if more than one module was attempted)
    let moduleCard = '';
    if (presentModules.length > 1) {
      const rows = presentModules.map(m => {
        const s = moduleAvgs[m.id];
        const pct = (s / 90) * 100;
        return `
        <div class="flex items-center gap-3">
          <span class="text-lg">${m.icon}</span>
          <div class="flex-1">
            <div class="flex justify-between mb-1">
              <span class="text-xs font-medium text-zinc-400">${m.name}</span>
              <span class="text-xs font-bold" style="color:${m.color}">${s}/90</span>
            </div>
            <div class="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width:${pct}%;background:${m.color}"></div>
            </div>
          </div>
        </div>`;
      }).join('');
      moduleCard = `
        <div class="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] shadow-sm p-6 mb-6">
          <h3 class="font-semibold text-zinc-200 mb-4">Communicative skills</h3>
          <p class="text-[11px] text-zinc-500 mb-4">Speaking, Writing, Reading, and Listening averages from this run. Enabling skills are estimates, not official Pearson scores.</p>
          <div class="space-y-4">${rows}</div>
        </div>`;
    }

    root.innerHTML = `
    ${PTE.UI.navbar('mock-test')}
    <main class="min-h-screen bg-[#09090b] py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <!-- Hero Score Card -->
        <div class="bg-gradient-to-br from-[#6d5cff] via-purple-600 to-[#a78bfa] rounded-xl p-8 text-center text-white shadow-xl shadow-black/40 mb-8 animate-fadeIn">
          <p class="text-white/60 text-sm mb-1">${this.config.name} — Complete</p>
          <div class="relative inline-flex items-center justify-center my-4">
            <svg class="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="white" stroke-width="8" 
                stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="${326.73 * (1 - pteScore / 90)}"
                class="score-circle-animate"/>
            </svg>
            <div class="absolute flex flex-col items-center">
              <span class="text-5xl font-extrabold">${pteScore}</span>
              <span class="text-white/50 text-xs">/90</span>
            </div>
          </div>
          <div class="flex items-center justify-center gap-3 mb-4">
            <span class="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold text-sm">${band.emoji} ${band.label}</span>
            <span class="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold text-sm">CEFR: ${cefr}</span>
          </div>
          <div class="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
            <div>
              <p class="text-2xl font-bold">${results.length}</p>
              <p class="text-xs text-white/50">Questions</p>
            </div>
            <div>
              <p class="text-2xl font-bold">${mins}:${secs.toString().padStart(2, '0')}</p>
              <p class="text-xs text-white/50">Duration</p>
            </div>
            <div>
              <p class="text-2xl font-bold">${Math.max(...allScores)}</p>
              <p class="text-xs text-white/50">Best Score</p>
            </div>
          </div>
        </div>

        ${avgContent !== null || avgPron !== null || avgFlu !== null || avgVoc !== null ? `
        <!-- Enabling Skills -->
        <div class="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] shadow-sm p-6 mb-6">
          <h3 class="font-semibold text-zinc-200 mb-4">Enabling Skills Breakdown</h3>
          <div class="space-y-4">
            ${avgContent !== null ? PTE.UI.scoreBar('Content', avgContent) : ''}
            ${avgPron !== null ? PTE.UI.scoreBar('Pronunciation', avgPron) : ''}
            ${avgFlu !== null ? PTE.UI.scoreBar('Fluency', avgFlu) : ''}
            ${avgVoc !== null ? PTE.UI.scoreBar('Vocabulary', avgVoc) : ''}
          </div>
        </div>
        ` : ''}

        ${moduleCard}

        ${templateCard}

        ${fulfilmentCard}

        ${fluencyCard}

        ${difficultyCard}

        <!-- By Question Type -->
        <div class="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] shadow-sm p-6 mb-6">
          <h3 class="font-semibold text-zinc-200 mb-4">Score by Question Type</h3>
          <div class="space-y-4">${typeRows}</div>
        </div>

        <!-- Question-by-Question -->
        <div class="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-[var(--border)]">
            <h3 class="font-semibold text-zinc-200">Question-by-Question Results</h3>
          </div>
          <div class="px-6 py-2">${resultRows}</div>
        </div>

        <!-- Actions -->
        <div class="flex justify-center gap-4 mb-12">
          <a href="#/mock-test" class="inline-flex items-center gap-2 bg-[var(--surface-2)] text-zinc-300 font-semibold px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-3)] transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Take Another Test
          </a>
          <a href="#/progress" class="inline-flex items-center gap-2 bg-[var(--accent)] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[var(--accent)]/90 transition-all shadow-xl shadow-black/40">
            View All Progress
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
        </div>
      </div>
    </main>`;
  },

  // ── Utility ──────────────────────────────────────────────────

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
