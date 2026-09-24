/**
 * PTE Speaking Module - AI Feedback Engine
 * Generates detailed, actionable feedback with specific improvement strategies
 */

window.PTE = window.PTE || {};

PTE.AIFeedback = {
  /**
   * Generate comprehensive AI feedback for a practice session
   * @param {object} params
   * @param {string} params.type - Question type ID
   * @param {string} params.transcript - Recognized speech
   * @param {string} params.expected - Expected/original text
   * @param {string[]} params.keywords - Expected keywords
   * @param {object} params.scores - Content, pronunciation, fluency scores
   * @param {number} params.confidence - Speech recognition confidence
   * @param {object} params.toneResults - Tone analyzer results
   * @param {number} params.duration - Recording duration in seconds
   * @param {number} params.maxDuration - Max recording time in seconds
   * @returns {object} Detailed feedback object
   */
  generate(params) {
    const { type, transcript, expected, keywords, scores, confidence, toneResults, duration, maxDuration } = params;

    const feedback = {
      overallSummary: '',
      strengths: [],
      improvements: [],
      contentAnalysis: null,
      pronunciationAnalysis: null,
      fluencyAnalysis: null,
      toneAnalysis: null,
      wordAnalysis: null,
      pteStrategies: [],
      practiceExercises: [],
      modelAnswer: null,
      scoreExplanation: ''
    };

    // Word-by-word analysis for content types
    if (expected && transcript) {
      feedback.wordAnalysis = this._wordByWordAnalysis(transcript, expected);
      feedback.contentAnalysis = this._contentAnalysis(transcript, expected, keywords);
    }

    // Pronunciation analysis
    if (scores.pronunciation !== undefined) {
      feedback.pronunciationAnalysis = this._pronunciationAnalysis(scores.pronunciation, confidence, transcript);
    }

    // Fluency analysis
    if (scores.fluency !== undefined) {
      feedback.fluencyAnalysis = this._fluencyAnalysis(scores.fluency, transcript, duration, maxDuration);
    }

    // Tone-specific analysis
    if (toneResults && toneResults.hasPitchData) {
      feedback.toneAnalysis = toneResults.analysis;
    }

    // Generate strengths and improvements
    this._generateStrengthsAndImprovements(feedback, scores, toneResults);

    // Type-specific strategies
    feedback.pteStrategies = this._getStrategies(type, scores);

    // Practice exercises
    feedback.practiceExercises = this._getExercises(type, scores, toneResults);

    // Model answer
    feedback.modelAnswer = this._getModelAnswer(type, expected, keywords);

    // Overall summary
    feedback.overallSummary = this._generateSummary(scores, type, toneResults);

    // Score explanation
    feedback.scoreExplanation = this._explainScores(scores, type);

    return feedback;
  },

  SCORE_URL: '/api/score-attempt',

  async scoreRemote(params, localFeedback) {
    const local = localFeedback || this.generate(params) || { source: 'local' };
    local.source = local.source || 'local';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(this.SCORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: params.type,
          transcript: params.transcript,
          expected: params.expected,
          keywords: params.keywords,
          duration: params.duration,
          maxDuration: params.maxDuration,
          scores: params.scores,
          confidence: params.confidence
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return local;
      const data = await res.json();
      return {
        ...local,
        source: data.source === 'ai' ? 'ai' : 'local',
        overallSummary: data.overallSummary || local.overallSummary,
        nextDrills: data.nextDrills || local.practiceExercises || [],
        missedContentPoints: data.missedContentPoints || [],
        remoteBands: data.bands || null
      };
    } catch (e) {
      return { ...local, source: 'local', remoteError: true };
    }
  },

  _wordByWordAnalysis(transcript, expected) {
    const recWords = transcript.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w);
    const expWords = expected.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w);

    const matched = [];
    const missed = [];
    const extra = [];

    const expSet = new Set(expWords);
    const recSet = new Set(recWords);

    // Find matched and missed words
    for (const word of expWords) {
      if (recSet.has(word)) {
        if (!matched.includes(word)) matched.push(word);
      } else {
        missed.push(word);
      }
    }

    // Find extra words (not in expected)
    for (const word of recWords) {
      if (!expSet.has(word) && !extra.includes(word)) {
        extra.push(word);
      }
    }

    const accuracy = expWords.length > 0 ? (matched.length / new Set(expWords).length) * 100 : 0;

    return {
      totalExpected: new Set(expWords).size,
      totalRecognized: recWords.length,
      matched: matched.length,
      missed: [...new Set(missed)].slice(0, 15),
      extra: extra.slice(0, 10),
      accuracy: Math.round(accuracy),
      recWords,
      expWords
    };
  },

  _contentAnalysis(transcript, expected, keywords) {
    const recLower = transcript.toLowerCase();
    const keywordResults = keywords ? keywords.map(kw => ({
      keyword: kw,
      found: recLower.includes(kw.toLowerCase()),
      important: true
    })) : [];

    const found = keywordResults.filter(k => k.found).length;
    const total = keywordResults.length;
    const coverage = total > 0 ? Math.round((found / total) * 100) : 0;

    let assessment = '';
    if (coverage >= 80) {
      assessment = 'Excellent content coverage. You captured most of the key points accurately.';
    } else if (coverage >= 60) {
      assessment = 'Good content coverage, but some important keywords were missed. Focus on capturing the main ideas.';
    } else if (coverage >= 40) {
      assessment = 'Moderate content coverage. Several key points were missed. Try to focus on understanding and reproducing the core message.';
    } else {
      assessment = 'Low content coverage. Most key points were missed. Practice active listening and note-taking strategies.';
    }

    return {
      keywordResults,
      found,
      total,
      coverage,
      assessment
    };
  },

  /**
   * Pronunciation analysis — now uses 0-5 PTE band scale
   */
  _pronunciationAnalysis(score, confidence, transcript) {
    const wordCount = transcript ? transcript.split(/\s+/).length : 0;
    // score is now 0-5 (official PTE band)
    const bandLabels = ['Non-English', 'Intrusive', 'Intermediate', 'Good', 'Advanced', 'Highly Proficient'];
    let level, detail, tips;

    if (score >= 4) {
      level = bandLabels[score] || 'excellent';
      detail = `Your pronunciation scored ${score}/5 (${bandLabels[score]}). Speech sounds are clearly produced and easily understood.`;
      tips = [
        'Continue practicing to maintain this level',
        'Focus on stress patterns in multi-syllable words',
        'Record yourself and compare with native speakers'
      ];
    } else if (score === 3) {
      level = 'Good';
      detail = `Your pronunciation scored ${score}/5 (Good). Most sounds are correct, but some consonant/stress errors may make a few words hard to understand.`;
      tips = [
        'Practice problematic sounds (th, r, l, v, w) with tongue placement exercises',
        'Use shadowing technique: listen and speak simultaneously with native audio',
        'Focus on word endings — don\'t drop final consonants',
        'Record yourself and listen back to identify specific problem sounds'
      ];
    } else if (score === 2) {
      level = 'Intermediate';
      detail = `Your pronunciation scored ${score}/5 (Intermediate). Consistent mispronunciations present — about one third of speech may be hard to understand.`;
      tips = [
        'Start with minimal pair practice (ship/sheep, bit/beat, fan/van)',
        'Practice with speech-to-text apps to see which words get misrecognized',
        'Focus on vowel sounds — English has many vowel distinctions',
        'Practice word stress: PHOtograph vs phoTOGraphy vs photoGRAphic',
        'Slow down slightly to enunciate clearly'
      ];
    } else {
      level = score === 1 ? 'Intrusive' : 'Non-English';
      detail = `Your pronunciation scored ${score}/5 (${bandLabels[score] || 'Needs Work'}). Many words were not understood by the recognition system.`;
      tips = [
        'Begin with individual sound practice using IPA (International Phonetic Alphabet)',
        'Use apps like ELSA Speak for targeted pronunciation drills',
        'Practice speaking slowly and clearly, gradually increasing speed',
        'Focus on the most common English sounds first',
        'Listen to English podcasts/news daily for 30+ minutes',
        'Consider working with a pronunciation tutor'
      ];
    }

    return { level, score, maxScore: 5, detail, tips, confidence: Math.round(confidence * 100) };
  },

  /**
   * Fluency analysis — uses 0-5 PTE band scale with detailed diagnostic breakdown
   */
  _fluencyAnalysis(score, transcript, duration, maxDuration) {
    const wordCount = transcript ? transcript.split(/\s+/).length : 0;
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;
    const timeUsed = maxDuration > 0 ? Math.round((duration / maxDuration) * 100) : 0;
    const bandLabels = ['Disfluent', 'Limited', 'Intermediate', 'Good', 'Advanced', 'Highly Proficient'];

    let paceAssessment, fluencyLevel, tips;

    // Assess pace
    if (wpm >= 120 && wpm <= 160) {
      paceAssessment = `Your pace of ${wpm} words per minute is ideal for PTE (target: 120-160 WPM).`;
    } else if (wpm >= 100 && wpm < 120) {
      paceAssessment = `Your pace of ${wpm} WPM is slightly slow. Try to speak a bit faster (target: 120-160 WPM).`;
    } else if (wpm > 160 && wpm <= 190) {
      paceAssessment = `Your pace of ${wpm} WPM is slightly fast. Slow down a bit for better clarity (target: 120-160 WPM).`;
    } else if (wpm < 100) {
      paceAssessment = `Your pace of ${wpm} WPM is too slow. This affects your fluency score significantly.`;
    } else {
      paceAssessment = `Your pace of ${wpm} WPM is too fast. Slow down to ensure clarity and accuracy.`;
    }

    // Diagnostic sub-scores (0-100 each)
    const paceScore = (wpm >= 120 && wpm <= 160) ? 100 :
                      (wpm >= 100 && wpm <= 180) ? Math.max(0, 100 - Math.abs(wpm - 140) * 2) :
                      Math.max(0, 100 - Math.abs(wpm - 140) * 3);
    const timeScore = Math.min(100, timeUsed > 85 ? 100 : timeUsed > 60 ? 80 : timeUsed > 40 ? 50 : 20);
    const continuityScore = score >= 5 ? 100 : score === 4 ? 85 : score === 3 ? 65 : score === 2 ? 40 : score === 1 ? 20 : 0;
    const rhythmScore = (wpm >= 110 && wpm <= 170 && score >= 3) ? Math.min(100, 60 + score * 8) :
                        (wpm >= 80 && wpm <= 200) ? Math.min(100, 30 + score * 10) : Math.max(0, score * 15);

    const diagnostics = {
      pace: { score: paceScore, label: 'Speaking Pace', desc: paceScore >= 80 ? 'On target' : paceScore >= 50 ? 'Needs adjustment' : 'Significantly off target' },
      continuity: { score: continuityScore, label: 'Continuity', desc: continuityScore >= 80 ? 'Smooth flow' : continuityScore >= 50 ? 'Some hesitations' : 'Frequent pauses detected' },
      rhythm: { score: rhythmScore, label: 'Rhythm & Stress', desc: rhythmScore >= 80 ? 'Natural rhythm' : rhythmScore >= 50 ? 'Somewhat uneven' : 'Choppy delivery' },
      timeUse: { score: timeScore, label: 'Time Utilization', desc: timeScore >= 80 ? 'Good use of time' : timeScore >= 50 ? 'Could speak longer' : 'Finished too early' }
    };

    // Identify weakest area for targeted coaching
    const weakest = Object.entries(diagnostics).sort((a, b) => a[1].score - b[1].score)[0];
    const strongest = Object.entries(diagnostics).sort((a, b) => b[1].score - a[1].score)[0];

    // Targeted drills based on weakest area
    const targetedDrills = [];
    if (weakest[0] === 'pace' || paceScore < 60) {
      targetedDrills.push({ name: 'Pace Trainer', desc: 'Practice speaking at target WPM with visual pacer guidance', link: '#/fluency', exercise: 'pace-trainer', icon: '🎯' });
      targetedDrills.push({ name: 'Timed Reading', desc: 'Read passages aloud and hit the target pace', link: '#/fluency', exercise: 'timed-reading', icon: '📖' });
    }
    if (weakest[0] === 'continuity' || continuityScore < 60) {
      targetedDrills.push({ name: 'Fluency Streak', desc: 'Speak continuously without pausing — build your stamina', link: '#/fluency', exercise: 'fluency-streak', icon: '🔥' });
      targetedDrills.push({ name: 'Shadowing', desc: 'Listen and speak simultaneously to build continuous flow', link: '#/fluency', exercise: 'shadowing', icon: '🔊' });
    }
    if (weakest[0] === 'rhythm' || rhythmScore < 60) {
      targetedDrills.push({ name: 'Phrase Linking', desc: 'Connect words naturally for smoother rhythm', link: '#/fluency', exercise: 'phrase-linking', icon: '🔗' });
      targetedDrills.push({ name: 'Tongue Twisters', desc: 'Build articulatory speed and clarity', link: '#/fluency', exercise: 'tongue-twisters', icon: '👅' });
    }
    if (weakest[0] === 'timeUse' || timeScore < 60) {
      targetedDrills.push({ name: 'Fluency Streak', desc: 'Train yourself to speak for longer durations', link: '#/fluency', exercise: 'fluency-streak', icon: '🔥' });
      targetedDrills.push({ name: 'Timed Reading', desc: 'Practice filling the full recording time', link: '#/fluency', exercise: 'timed-reading', icon: '📖' });
    }
    // Always include at least 2 drills
    if (targetedDrills.length === 0) {
      targetedDrills.push({ name: 'Pace Trainer', desc: 'Fine-tune your speaking speed for PTE', link: '#/fluency', exercise: 'pace-trainer', icon: '🎯' });
      targetedDrills.push({ name: 'Shadowing', desc: 'Maintain your excellent rhythm with native speakers', link: '#/fluency', exercise: 'shadowing', icon: '🔊' });
    }

    // Build coaching message based on score band
    let coachingMessage = '';
    if (score >= 4) {
      fluencyLevel = bandLabels[score] || 'excellent';
      coachingMessage = `Excellent fluency! Your speech flows naturally with minimal hesitations. Your strongest area is ${strongest[1].label.toLowerCase()}. To maintain this level, keep practicing with varied content and challenge yourself with faster pace targets.`;
      tips = [
        `Oral Fluency: ${score}/5 (${bandLabels[score]}). Smooth, natural delivery.`,
        'Continue to vary your pace slightly for emphasis on key points.',
        'Challenge yourself with the Fast & Fluent pace level in the Pace Trainer.'
      ];
    } else if (score === 3) {
      fluencyLevel = 'Good';
      coachingMessage = `Good fluency with room to improve. Your ${weakest[1].label.toLowerCase()} needs the most attention — ${weakest[1].desc.toLowerCase()}. Focus on the targeted drills below to move from Band 3 to Band 4.`;
      tips = [
        `Oral Fluency: ${score}/5 (Good). Uneven but continuous — some hesitations noted.`,
        'Practice reading aloud for 10 minutes daily to build speaking stamina.',
        'Avoid "um", "uh", and long pauses — replace with brief natural pauses.',
        'Use linking words (however, moreover, therefore) to connect ideas smoothly.',
        'Try the Shadowing exercise in Fluency Lab to build natural pacing.'
      ];
    } else if (score === 2) {
      fluencyLevel = 'Intermediate';
      coachingMessage = `Your fluency is at an intermediate level. The biggest issue is ${weakest[1].label.toLowerCase()} — ${weakest[1].desc.toLowerCase()}. Daily practice with the drills below can help you reach Band 3-4 within 2-3 weeks.`;
      tips = [
        `Oral Fluency: ${score}/5 (Intermediate). Staccato/uneven speech with noticeable pauses.`,
        'Read aloud from English texts for 15-20 minutes daily.',
        'Record yourself and count hesitations — aim to reduce them each time.',
        'Practice "chunking" — speak in meaningful phrases rather than word by word.',
        'Use the Fluency Streak exercise to build continuous speaking stamina.',
        'Shadow native speakers: listen and speak along simultaneously.'
      ];
    } else {
      fluencyLevel = score === 1 ? 'Limited' : 'Disfluent';
      coachingMessage = `Your fluency needs significant work. Focus on ${weakest[1].label.toLowerCase()} first — ${weakest[1].desc.toLowerCase()}. Start with the easier drills and build up gradually. Even 10 minutes of daily practice will show improvement within a week.`;
      tips = [
        `Oral Fluency: ${score}/5 (${bandLabels[score] || 'Needs Work'}). Multiple pauses and hesitations detected.`,
        'Start with short passages (2-3 sentences) and build up gradually.',
        'Practice speed reading aloud to build comfort with continuous speech.',
        'Focus on not going back to correct mistakes — keep moving forward.',
        'Use Tongue Twisters in the Fluency Lab to improve articulatory fluency.',
        'Always use the full recording time, even if you need to repeat content.',
        'Try the Fluency Streak — aim for 15 seconds of continuous speech first.'
      ];
    }

    // Band progression guidance
    const nextBand = Math.min(5, score + 1);
    const bandGap = nextBand - score;
    let progressionTip = '';
    if (score < 5) {
      const bandRequirements = {
        1: 'Reduce long pauses to fewer than 3. Aim for at least 50 WPM.',
        2: 'Speak in phrases of 2+ words. Reduce hesitations to under 3 per response.',
        3: 'Maintain 80-200 WPM with only 1 long pause max. Speak in 3+ word chunks.',
        4: 'Hit 100-180 WPM with zero long pauses and at most 1 hesitation.',
        5: 'Achieve 110-170 WPM with zero pauses, zero hesitations, and 8+ words per continuous phrase.'
      };
      progressionTip = `To reach Band ${nextBand}: ${bandRequirements[nextBand]}`;
    }

    return {
      fluencyLevel,
      wordCount,
      wpm,
      duration: Math.round(duration),
      maxDuration,
      timeUsed,
      paceAssessment,
      tips,
      diagnostics,
      targetedDrills,
      coachingMessage,
      progressionTip,
      score,
      bandLabel: bandLabels[score] || 'Unknown'
    };
  },

  _generateStrengthsAndImprovements(feedback, scores, toneResults) {
    // Scores are now 0-5 PTE bands (pronunciation, fluency) and
    // contentResult with raw/max for content
    const contentGood = scores.contentResult && scores.contentResult.max > 0
      ? (scores.contentResult.raw / scores.contentResult.max) >= 0.6
      : (scores.content !== undefined && scores.content >= 60);
    const contentWeak = scores.contentResult && scores.contentResult.max > 0
      ? (scores.contentResult.raw / scores.contentResult.max) < 0.4
      : (scores.content !== undefined && scores.content < 50);

    // Strengths
    if (contentGood) feedback.strengths.push('Strong content coverage — you captured the key information effectively.');
    if (scores.pronunciation >= 4) feedback.strengths.push('Excellent pronunciation (4-5/5) — your speech is clear and easily understood.');
    else if (scores.pronunciation === 3) feedback.strengths.push('Good pronunciation (3/5) — most speech sounds are correct.');
    if (scores.fluency >= 4) feedback.strengths.push('Great fluency (4-5/5) — smooth, natural delivery with minimal hesitations.');
    else if (scores.fluency === 3) feedback.strengths.push('Decent fluency (3/5) — continuous speech with some hesitations.');
    if (scores.vocabulary === 1) feedback.strengths.push('Correct vocabulary — you identified the right answer.');
    if (toneResults && toneResults.hasPitchData && toneResults.intonationScore >= 60) {
      feedback.strengths.push('Natural intonation — your voice has good pitch variation and expression.');
    }

    // Improvements
    if (contentWeak) {
      feedback.improvements.push('Content accuracy needs significant work — focus on capturing more key words, data points, and main ideas.');
    }
    if (scores.pronunciation !== undefined && scores.pronunciation <= 2) {
      feedback.improvements.push(`Pronunciation (${scores.pronunciation}/5) needs improvement — consistent mispronunciations detected. Practice enunciation and common English sounds.`);
    }
    if (scores.fluency !== undefined && scores.fluency <= 2) {
      feedback.improvements.push(`Oral Fluency (${scores.fluency}/5) needs work — reduce pauses, hesitations, and false starts. Aim for continuous, smooth speech.`);
    }
    if (toneResults && toneResults.hasPitchData) {
      if (toneResults.intonationScore < 50) {
        feedback.improvements.push('Intonation is too flat — practice varying your pitch to sound more natural and engaging.');
      }
      if (toneResults.volumeConsistency < 50) {
        feedback.improvements.push('Volume consistency needs work — maintain steady volume and avoid trailing off at sentence ends.');
      }
    }
  },

  _getStrategies(type, scores) {
    const strategies = [];

    switch (type) {
      case 'read-aloud':
        strategies.push(
          { title: 'Use Preparation Time Wisely', detail: 'Silently read the entire passage once, then identify difficult words and practice their pronunciation in your head.' },
          { title: 'Chunk the Text', detail: 'Break the passage into meaningful phrases (3-5 words). Pause briefly between chunks rather than between individual words.' },
          { title: 'Mark Stress Words', detail: 'Mentally identify content words (nouns, verbs, adjectives) to stress. Function words (the, a, of) should be spoken quickly.' }
        );
        if (scores.contentResult && scores.contentResult.accuracy < 80) {
          strategies.push({ title: 'Don\'t Skip Words', detail: 'If you stumble on a word, make your best attempt and keep going. Skipping words hurts content score more than mispronouncing them.' });
        }
        break;

      case 'repeat-sentence':
        strategies.push(
          { title: 'APEUni Method 258', detail: 'Remember: first 2 words, middle 5 words, last 8 sounds. This helps capture the sentence structure even when memory is partial.' },
          { title: 'Focus on Structure', detail: 'Listen for the sentence structure (subject-verb-object) rather than individual words. Understanding the grammar helps recall.' },
          { title: 'Start Speaking Immediately', detail: 'Begin speaking as soon as the audio ends. Delay causes you to forget. Even if you only remember part, say what you can.' }
        );
        break;

      case 'describe-image':
        strategies.push(
          { title: 'Use a Template', detail: 'Start with: "This [chart type] shows/illustrates [topic]." Then: "The highest/largest is... The lowest/smallest is..." End with: "Overall/In conclusion..."' },
          { title: 'Mention Numbers', detail: 'Always include specific data points. "China had the highest value at approximately eleven thousand" is better than "China was the highest."' },
          { title: 'Cover All Elements', detail: 'Mention: title, axes labels, highest value, lowest value, any notable trends or patterns.' }
        );
        break;

      case 'retell-lecture':
        strategies.push(
          { title: 'Note-Taking Strategy', detail: 'Write 5-7 key phrases while listening. Use symbols and abbreviations. Focus on: topic, main argument, examples, conclusion.' },
          { title: 'Use the Template', detail: '"The speaker/lecturer discussed [topic]. The main point was [key idea]. They mentioned that [detail 1] and [detail 2]. In conclusion, [summary]."' },
          { title: 'Speak for Full 40 Seconds', detail: 'Even if you run out of main points, elaborate on what you remember. Silence is more damaging than repetition.' }
        );
        break;

      case 'answer-short-question':
        strategies.push(
          { title: 'Answer Immediately', detail: 'Give your answer within 1-3 seconds. Don\'t overthink or explain — just give the word or phrase.' },
          { title: 'Build General Knowledge', detail: 'Study common categories: geography (capitals, continents), science (basic facts), language (grammar terms), daily life (objects, professions).' },
          { title: 'If Unsure, Guess', detail: 'Always attempt an answer. Silence scores zero, but a guess might be right or partially credited.' }
        );
        break;

      case 'summarize-group-discussion':
        strategies.push(
          { title: 'Track Each Speaker', detail: 'Note the main point of each speaker. Use labels (A said..., B argued..., C suggested...).' },
          { title: 'Identify Agreement/Disagreement', detail: 'Note where speakers agree and disagree. This shows comprehension.' },
          { title: 'Use Academic Language', detail: 'Use formal vocabulary: "discussed", "argued", "suggested", "concluded", "agreed", "disagreed".' }
        );
        break;

      case 'respond-to-situation':
        strategies.push(
          { title: 'Read Scenario Carefully', detail: 'Identify: Who are you? Who are you talking to? What is the issue? What should you do?' },
          { title: 'Match the Tone', detail: 'Use appropriate formality. Formal for professors/managers, semi-formal for colleagues, polite but firm for complaints.' },
          { title: 'Address All Parts', detail: 'Make sure your response covers the complete situation — acknowledge the issue, explain your position, and suggest a solution.' }
        );
        break;
    }

    return strategies;
  },

  _getExercises(type, scores, toneResults) {
    const exercises = [];

    // Universal exercises
    // Pronunciation: now 0-5 band
    if (scores.pronunciation !== undefined && scores.pronunciation <= 3) {
      exercises.push({
        title: 'Tongue Twisters (5 min/day)',
        description: 'Practice: "She sells seashells by the seashore" — start slow, increase speed. This builds articulatory precision.',
        difficulty: 'easy'
      });
      exercises.push({
        title: 'Minimal Pair Practice (10 min/day)',
        description: 'Practice word pairs: ship/sheep, bat/bet, sit/set, cap/cup. Focus on hearing and producing the difference.',
        difficulty: 'medium'
      });
    }

    // Fluency: now 0-5 band
    if (scores.fluency !== undefined && scores.fluency <= 3) {
      exercises.push({
        title: 'Fluency Lab — Shadowing (10 min)',
        description: 'Listen and speak simultaneously to build natural pacing and rhythm. Go to Fluency Lab → Shadowing.',
        difficulty: 'medium',
        link: '#/fluency'
      });
      exercises.push({
        title: 'Fluency Lab — Pace Trainer (10 min)',
        description: 'Follow the visual pacer to train your speaking speed at the PTE target of 130-150 WPM.',
        difficulty: 'medium',
        link: '#/fluency'
      });
      if (scores.fluency <= 2) {
        exercises.push({
          title: 'Fluency Lab — Fluency Streak',
          description: 'Speak continuously without pausing for as long as you can. Build stamina to eliminate hesitations.',
          difficulty: 'easy',
          link: '#/fluency'
        });
        exercises.push({
          title: 'Fluency Lab — Tongue Twisters (5 min)',
          description: 'Build articulatory speed and clarity with progressive difficulty levels.',
          difficulty: 'easy',
          link: '#/fluency'
        });
      }
      exercises.push({
        title: 'Read Aloud Daily (15 min)',
        description: 'Read newspaper articles or book passages aloud. Time yourself and aim to read smoothly without stopping.',
        difficulty: 'easy'
      });
    }

    if (toneResults && toneResults.hasPitchData && toneResults.intonationScore < 60) {
      exercises.push({
        title: 'Intonation Drill (5 min)',
        description: 'Read statements with falling intonation and questions with rising intonation. Exaggerate at first, then normalize.',
        difficulty: 'easy'
      });
      exercises.push({
        title: 'Stress Pattern Practice (10 min)',
        description: 'Practice sentence stress: "I didn\'t say HE stole the money" vs "I didn\'t say he STOLE the money." Different stress = different meaning.',
        difficulty: 'medium'
      });
    }

    // Content: check using contentResult or legacy content score
    const contentWeak = scores.contentResult
      ? (scores.contentResult.max > 0 && (scores.contentResult.raw / scores.contentResult.max) < 0.5)
      : (scores.content !== undefined && scores.content < 60);
    if (contentWeak) {
      exercises.push({
        title: 'Active Listening Practice (15 min)',
        description: 'Listen to 1-minute audio clips. Immediately write down key words. Compare with transcript. Repeat daily.',
        difficulty: 'medium'
      });
      exercises.push({
        title: 'Keyword Spotting Drill',
        description: 'While reading a paragraph, identify the 5-7 most important words. Practice reproducing them from memory.',
        difficulty: 'easy'
      });
    }

    return exercises;
  },

  _getModelAnswer(type, expected, keywords) {
    if (!expected && !keywords) return null;

    switch (type) {
      case 'read-aloud':
        return {
          label: 'Target Text',
          text: expected || '',
          note: 'Your goal is to read this text exactly as written, with clear pronunciation and natural intonation.'
        };
      case 'repeat-sentence':
        return {
          label: 'Target Sentence',
          text: expected || '',
          note: 'You should repeat this sentence as closely as possible. Even a partial repeat scores points.'
        };
      case 'describe-image':
        return {
          label: 'Suggested Structure',
          text: `"This [chart type] shows [topic]. The most notable feature is [highest/main trend]. [Second observation with data]. [Third observation]. Overall, [summary/conclusion]."`,
          note: 'Aim to cover: type, topic, main trend, 2-3 specific data points, conclusion.'
        };
      case 'retell-lecture':
        return {
          label: 'Key Points to Cover',
          text: keywords ? keywords.slice(0, 10).join(', ') : '',
          note: 'Try to include these key terms in your retelling. Structure: topic → main idea → details → conclusion.'
        };
      case 'answer-short-question':
        return null; // Don't reveal answer before attempt
      default:
        return keywords ? {
          label: 'Key Terms',
          text: keywords.slice(0, 12).join(', '),
          note: 'Try to incorporate these key terms in your response.'
        } : null;
    }
  },

  _generateSummary(scores, type, toneResults) {
    const overallScore = PTE.Scoring.calculateOverall(scores, type);
    const band = PTE.Scoring.getBand(overallScore);

    let summary = `Your overall performance is at the "${band.label}" level (${overallScore}/90). `;

    // Trait-level summary
    const traitSummaries = [];
    if (scores.contentResult) {
      const cr = scores.contentResult;
      const pct = cr.max > 0 ? Math.round((cr.raw / cr.max) * 100) : 0;
      traitSummaries.push(`Content: ${cr.raw}/${cr.max} (${pct}%)`);
    }
    if (scores.pronunciation !== undefined) {
      const pLabels = ['Non-English', 'Intrusive', 'Intermediate', 'Good', 'Advanced', 'Highly Proficient'];
      traitSummaries.push(`Pronunciation: ${scores.pronunciation}/5 (${pLabels[scores.pronunciation]})`);
    }
    if (scores.fluency !== undefined) {
      const fLabels = ['Disfluent', 'Limited', 'Intermediate', 'Good', 'Advanced', 'Highly Proficient'];
      traitSummaries.push(`Oral Fluency: ${scores.fluency}/5 (${fLabels[scores.fluency]})`);
    }

    if (traitSummaries.length > 0) {
      summary += traitSummaries.join(' | ') + '. ';
    }

    if (toneResults && toneResults.hasPitchData) {
      if (toneResults.intonationScore >= 60) {
        summary += 'Your vocal delivery is expressive and engaging. ';
      } else {
        summary += 'Work on making your speech more expressive with varied pitch and intonation. ';
      }
    }

    if (overallScore >= 65) {
      summary += 'Keep up the great work and focus on maintaining consistency.';
    } else if (overallScore >= 45) {
      summary += 'You\'re making progress. Focus on the improvement areas identified below.';
    } else {
      summary += 'Regular daily practice will help you improve significantly. Follow the exercises below.';
    }

    return summary;
  },

  _explainScores(scores, type) {
    const parts = [];
    if (scores.contentResult) {
      const cr = scores.contentResult;
      parts.push(`Content (${cr.raw}/${cr.max}): Measures how completely and accurately you described the expected information. ${cr.accuracy !== undefined ? `Word accuracy: ${cr.accuracy}%.` : ''} If content = 0, your total score is 0.`);
    }
    if (scores.pronunciation !== undefined) {
      const pLabel = PTE.Scoring.getTraitLabel(scores.pronunciation);
      parts.push(`Pronunciation (${scores.pronunciation}/5 — ${pLabel}): Based on how clearly you produce speech sounds. The system evaluates vowels, consonants, word stress, and sentence-level intonation.`);
    }
    if (scores.fluency !== undefined) {
      const fLabel = PTE.Scoring.getTraitLabel(scores.fluency);
      parts.push(`Oral Fluency (${scores.fluency}/5 — ${fLabel}): Evaluates rhythm, phrasing, and continuity of speech. Smooth delivery without hesitations, repetitions, or false starts scores highest.`);
    }
    if (scores.vocabulary !== undefined) {
      parts.push(`Vocabulary (${scores.vocabulary}/1): Whether you provided the correct answer word. Binary scoring: 1 = correct, 0 = incorrect.`);
    }
    return parts.join('\n');
  }
};
