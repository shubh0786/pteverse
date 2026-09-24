/**
 * PTE Speaking Module - Model Answer Scripts
 * Provides detailed model answers for every question in the bank
 * Each answer includes the script text, key tips, and is pronounceable via TTS
 */

window.PTE = window.PTE || {};

PTE.ModelAnswers = {
  /**
   * Get a model answer script for a question
   * @param {string} typeId - Question type ID
   * @param {object} question - The question object
   * @returns {object|null} { intro, text, tips }
   */
  getScript(typeId, question) {
    switch (typeId) {
      case 'read-aloud':
        return this._readAloudScript(question);
      case 'repeat-sentence':
        return this._repeatSentenceScript(question);
      case 'describe-image':
        return this._describeImageScript(question);
      case 'retell-lecture':
        return this._retellLectureScript(question);
      case 'answer-short-question':
        return this._answerShortScript(question);
      case 'summarize-group-discussion':
        return this._summarizeGroupScript(question);
      case 'respond-to-situation':
        return this._respondSituationScript(question);
      case 'swt':
        return {
          intro: 'Write one sentence that covers the main point and a key supporting detail.',
          text: question.model || question.text || '',
          tips: ['Stay in one sentence.', 'Keep 5–75 words.', 'Do not copy long chunks.']
        };
      case 'write-essay':
        return {
          intro: 'Use a four-paragraph template: intro, two body points, conclusion.',
          text: question.model || 'Introduction with a clear position. Body 1 with an example. Body 2 with a counter-point and rebuttal. Conclusion restating the position.',
          tips: ['Aim 200–300 words.', 'Leave 2 minutes to check grammar.']
        };
      case 'sst':
        return {
          intro: 'Summarize the lecture in 50–70 words.',
          text: question.model || question.audioText || question.text || '',
          tips: ['Main idea plus two supports.', 'Check the word count.']
        };
      case 'l-wfd':
        return {
          intro: 'Type every word you hear, including articles.',
          text: question.text || question.audioText || '',
          tips: ['Write immediately.', 'Check plurals and articles.']
        };
      default:
        return question && (question.model || question.answer || question.text)
          ? { intro: 'Reference answer', text: question.model || question.answer || question.text, tips: [] }
          : null;
    }
  },

  // Store current model answer text for TTS playback
  _currentModelText: '',

  _readAloudScript(q) {
    this._currentModelText = q.text;
    return {
      intro: 'For Read Aloud, the model answer IS the original text. Focus on clear pronunciation and natural intonation.',
      text: q.text,
      tips: [
        'Read at a steady pace of about 2-3 words per second',
        'Pause briefly at commas and longer at full stops',
        'Stress content words (nouns, verbs, adjectives) more than function words (the, a, of)',
        'Maintain falling intonation at the end of statements',
        'Do not go back to correct mistakes — keep moving forward'
      ]
    };
  },

  _repeatSentenceScript(q) {
    this._currentModelText = q.text;
    return {
      intro: 'The target sentence you needed to repeat:',
      text: q.text,
      tips: [
        'Focus on remembering the first 2-3 words and the last 3-4 words',
        'Understand the meaning — it helps with recall',
        'Match the intonation and stress pattern of the original',
        'Even partial repetition scores points — always attempt',
        'Speak immediately after the audio ends'
      ]
    };
  },

  _describeImageScript(q) {
    let script = '';
    const title = q.title || 'the given data';

    if (q.chartType === 'bar') {
      const sorted = [...q.data].sort((a, b) => b.value - a.value);
      const highest = sorted[0];
      const lowest = sorted[sorted.length - 1];

      script = `This bar chart illustrates ${title}. `;
      script += `Looking at the data, ${highest.label} has the highest value at approximately ${highest.value.toLocaleString()}, `;
      script += `while ${lowest.label} has the lowest value at around ${lowest.value.toLocaleString()}. `;

      if (sorted.length > 2) {
        script += `${sorted[1].label} comes in second place with a value of ${sorted[1].value.toLocaleString()}. `;
      }
      if (sorted.length > 3) {
        script += `This is followed by ${sorted[2].label} at ${sorted[2].value.toLocaleString()}. `;
      }
      script += `Overall, there is a significant difference between the highest and lowest values in this comparison.`;

    } else if (q.chartType === 'pie') {
      const sorted = [...q.data].sort((a, b) => b.value - a.value);
      script = `This pie chart shows the distribution of ${title}. `;
      script += `The largest proportion belongs to ${sorted[0].label} at ${sorted[0].value} percent. `;
      if (sorted.length > 1) script += `${sorted[1].label} accounts for ${sorted[1].value} percent, making it the second largest segment. `;
      if (sorted.length > 2) script += `${sorted[2].label} represents ${sorted[2].value} percent. `;
      const others = sorted.slice(3).map(d => `${d.label} at ${d.value} percent`).join(' and ');
      if (others) script += `The remaining categories include ${others}. `;
      script += `In summary, ${sorted[0].label} dominates the chart with the largest share.`;

    } else if (q.chartType === 'line') {
      const first = q.data[0];
      const last = q.data[q.data.length - 1];
      const maxPoint = q.data.reduce((a, b) => b.value > a.value ? b : a);
      const minPoint = q.data.reduce((a, b) => b.value < a.value ? b : a);

      script = `This line graph depicts ${title} from ${first.label} to ${last.label}. `;
      script += `The data shows an overall ${last.value > first.value ? 'upward' : 'downward'} trend. `;
      script += `Starting at ${first.value} in ${first.label}, the value ${last.value > first.value ? 'rose' : 'fell'} to ${last.value} by ${last.label}. `;
      script += `The highest point was ${maxPoint.value} recorded in ${maxPoint.label}, `;
      script += `while the lowest was ${minPoint.value} in ${minPoint.label}. `;
      script += `In conclusion, there has been a ${last.value > first.value ? 'steady increase' : 'notable decline'} over the period shown.`;
    }

    this._currentModelText = script;
    return {
      intro: 'Here is a model answer using the recommended template structure:',
      text: script,
      tips: [
        'Opens with the chart type and topic (introduction)',
        'Mentions the highest and lowest values with specific numbers',
        'Includes a comparison between data points',
        'Concludes with an overall summary statement',
        'Uses linking words: overall, while, followed by, in conclusion'
      ]
    };
  },

  _retellLectureScript(q) {
    const text = q.text || '';
    // Extract key sentences for a model retelling
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const topic = sentences[0] ? sentences[0].trim() : 'a specific topic';

    let script = `The lecturer discussed ${this._extractTopic(topic)}. `;

    // Pick 2-3 key points from the middle
    if (sentences.length >= 3) {
      script += `One of the main points was that ${this._simplify(sentences[1])}. `;
      script += `Furthermore, the speaker mentioned that ${this._simplify(sentences[2])}. `;
    }
    if (sentences.length >= 5) {
      script += `Additionally, it was noted that ${this._simplify(sentences[Math.floor(sentences.length / 2)])}. `;
    }
    // Conclusion from last sentence
    if (sentences.length >= 2) {
      script += `In conclusion, the speaker emphasized that ${this._simplify(sentences[sentences.length - 1])}`;
    }

    this._currentModelText = script;
    return {
      intro: 'A model retelling covering the key points:',
      text: script,
      tips: [
        'Opens by identifying the topic of the lecture',
        'Covers 2-3 main points from the lecture',
        'Uses discourse markers: furthermore, additionally, in conclusion',
        'Ends with a summary or concluding statement',
        'Aim to speak for the full 40 seconds'
      ]
    };
  },

  _answerShortScript(q) {
    this._currentModelText = q.answer || '';
    return {
      intro: 'The correct answer:',
      text: `<span class="text-lg font-bold text-emerald-700">${q.answer}</span>`,
      tips: [
        'Give the answer in 1-2 words only — do not explain',
        'Speak clearly and confidently',
        'Answer within 3 seconds of the audio ending',
        'If unsure, give your best guess — silence scores zero'
      ]
    };
  },

  _summarizeGroupScript(q) {
    if (!q.speakers) return null;

    let script = 'The group discussed ';
    const firstSpeaker = q.speakers[0];
    const topic = this._extractTopic(firstSpeaker.text);
    script += `${topic}. `;

    q.speakers.forEach((s, i) => {
      const prefix = i === 0 ? `${s.name} argued that ` :
                     i === 1 ? `${s.name} responded by saying that ` :
                     i === 2 ? `${s.name} suggested that ` :
                     `${s.name} added that `;
      script += prefix + this._simplify(s.text) + '. ';
    });

    script += 'Overall, while there were differing viewpoints, the speakers acknowledged the complexity of the issue and the need for a balanced approach.';

    this._currentModelText = script;
    return {
      intro: 'A model summary covering each speaker\'s main point:',
      text: script,
      tips: [
        'Identifies the topic of discussion',
        'Attributes points to each speaker',
        'Uses reporting verbs: argued, responded, suggested, added',
        'Notes agreement and disagreement',
        'Ends with an overall conclusion'
      ]
    };
  },

  _respondSituationScript(q) {
    let script = '';
    const scenario = (q.scenario || '').toLowerCase();

    // Generate contextual model response
    if (scenario.includes('neighbor') || scenario.includes('loud') || scenario.includes('music')) {
      script = "Hi, I hope you don't mind me coming over. I wanted to talk to you about something. I've noticed that the music has been quite loud late at night recently, and unfortunately it's been affecting my sleep and making it difficult for me to study. I completely understand that you enjoy your music, and I don't want to cause any problems between us. Would it be possible to perhaps lower the volume after ten pm? I would really appreciate it, and I'm sure we can find a solution that works for both of us.";
    } else if (scenario.includes('overtime') || scenario.includes('weekend') || scenario.includes('manager')) {
      script = "Thank you for considering me for the weekend work. I understand the importance of this deadline, and I want to help the team meet it. However, I have a prior family commitment this weekend that I'm unable to reschedule. I'd like to suggest some alternatives — I could come in early on Monday and stay late to catch up, or perhaps I could complete some of the work remotely in the evenings this week. I want to make sure we meet the deadline while also honouring my commitment. What would work best for you?";
    } else if (scenario.includes('exam') || scenario.includes('illness') || scenario.includes('professor')) {
      script = "Dear Professor, I'm writing to sincerely apologize for missing the exam. Unfortunately, I was unwell and unable to attend. I have a medical certificate from my doctor that I can provide as evidence. I understand the importance of this assessment, and I was wondering if it would be possible to arrange a make-up exam at your convenience. I have been keeping up with the course material and I'm prepared to take the exam as soon as possible. I would greatly appreciate your understanding and consideration.";
    } else if (scenario.includes('wrong') || scenario.includes('order') || scenario.includes('customer')) {
      script = "Hello, I'm calling about an order I recently received. My order number is on my confirmation email. Unfortunately, when I opened the package, I found that I received a different item from what I ordered. I ordered a specific product but received something else entirely. I would like to arrange either a replacement of the correct item or a full refund, whichever is more convenient. Could you please help me resolve this? I can return the incorrect item of course. Thank you for your assistance.";
    } else if (scenario.includes('credit') || scenario.includes('colleague') || scenario.includes('ideas')) {
      script = "Hi, do you have a moment? I wanted to discuss something that's been on my mind. I've noticed that in some recent meetings, some of the ideas I shared with you beforehand were presented without acknowledging my contribution. I value our working relationship and I'm sure this wasn't intentional. Going forward, I'd appreciate it if we could present our collaborative ideas together, or if you could mention when an idea originated from our discussions. I think this would strengthen our teamwork and be fair to both of us. What do you think?";
    } else {
      script = "Thank you for bringing this to my attention. I understand the situation, and I'd like to address it constructively. I believe that open communication is key to resolving any issue. I want to express my perspective while also understanding yours. Could we discuss this further and find a solution that works for everyone involved? I appreciate your willingness to work through this together, and I'm confident we can reach a positive outcome.";
    }

    this._currentModelText = script;
    return {
      intro: 'A model response appropriate for this scenario:',
      text: script,
      tips: [
        'Opens politely and acknowledges the situation',
        'Explains the issue or position clearly',
        'Shows empathy and understanding',
        'Proposes a solution or compromise',
        'Ends positively with a collaborative tone',
        'Uses appropriate formality for the relationship'
      ]
    };
  },

  // ── Helper methods ───────────────────────────────────────────

  _extractTopic(text) {
    // Extract a short topic phrase from the beginning of a text
    const cleaned = text.replace(/^(today |in this lecture |let me |i want to |i would like to )/i, '').trim();
    const firstClause = cleaned.split(/[,.]/).filter(s => s.trim().length > 5)[0] || cleaned;
    return firstClause.trim().toLowerCase().replace(/\.$/, '');
  },

  _simplify(sentence) {
    // Clean up a sentence for use in a model answer
    return sentence.trim()
      .replace(/^(today |in this lecture |let me |i want to |i would like to |however, |the |a |an )/i, '')
      .replace(/\.$/, '')
      .trim()
      .toLowerCase();
  }
};

// ── Global pronunciation functions ─────────────────────────────

/**
 * Pronounce a single word using TTS (called from click handlers)
 */
PTE.pronounceWord = function(word) {
  if (PTE.TTS && PTE.TTS.synth) {
    PTE.TTS.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    if (PTE.TTS.voice) utterance.voice = PTE.TTS.voice;
    utterance.rate = 0.85; // Slightly slow for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    PTE.TTS.synth.speak(utterance);
  }
};

/**
 * Pronounce the full expected text (for "Listen to full text" button)
 */
PTE.pronounceText = function() {
  if (PTE.App && PTE.App.currentQuestion) {
    const q = PTE.App.currentQuestion;
    const text = q.text || q.audioText || (q.speakers ? q.speakers.map(s => s.text).join('. ') : '') || '';
    if (text && PTE.TTS) {
      PTE.TTS.speak(text, 0.95);
    }
  }
};

/**
 * Pronounce the model answer script
 */
PTE.pronounceModelAnswer = function(rate) {
  const text = PTE.ModelAnswers ? PTE.ModelAnswers._currentModelText : '';
  if (text && PTE.TTS) {
    PTE.TTS.speak(text, rate || 0.95);
  }
};
