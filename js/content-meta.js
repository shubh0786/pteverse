/**
 * Content tagging, prediction freshness, and recorded-audio path helpers.
 */
window.PTE = window.PTE || {};

PTE.ContentMeta = {
  DEFAULT_PUBLISHED: '2026-09-01',
  STALE_DAYS: 90,

  TOPICS: ['education', 'environment', 'health', 'technology', 'society', 'science', 'business', 'culture'],

  topicFromText(text) {
    const t = (text || '').toLowerCase();
    if (/climate|carbon|ocean|forest|reef|pollution|species/.test(t)) return 'environment';
    if (/health|medical|disease|nutrition|mental|immune/.test(t)) return 'health';
    if (/internet|digital|ai |artificial|computer|data|software/.test(t)) return 'technology';
    if (/universit|student|educat|literacy|school/.test(t)) return 'education';
    if (/trade|econom|market|income|employment/.test(t)) return 'business';
    if (/research|scientist|biology|physics|evolution/.test(t)) return 'science';
    if (/art|music|cultur|renaissance|language/.test(t)) return 'culture';
    return 'society';
  },

  difficultyFromText(text) {
    const words = String(text || '').split(/\s+/).filter(Boolean).length;
    if (words < 18) return 'easy';
    if (words < 55) return 'medium';
    return 'hard';
  },

  isStale(publishedAt) {
    const ts = Date.parse(publishedAt || this.DEFAULT_PUBLISHED);
    if (!Number.isFinite(ts)) return false;
    return (Date.now() - ts) / 86400000 > this.STALE_DAYS;
  },

  stamp(question, extras) {
    if (!question || typeof question !== 'object') return question;
    const text = question.text || question.audioText || question.prompt || '';
    if (!question.publishedAt) question.publishedAt = (extras && extras.publishedAt) || this.DEFAULT_PUBLISHED;
    if (!question.topic) question.topic = this.topicFromText(text);
    if (!question.difficulty) question.difficulty = this.difficultyFromText(text);
    if (!question.examMonth) question.examMonth = String(question.publishedAt).slice(0, 7);
    question.stale = this.isStale(question.publishedAt);
    return question;
  },

  stampBank(bank) {
    if (!bank) return;
    Object.keys(bank).forEach((typeId) => {
      const items = bank[typeId];
      if (!Array.isArray(items)) return;
      items.forEach((q) => this.stamp(q));
    });
  },

  recordedUrl(typeId, id) {
    if (!typeId || !id) return '';
    return `audio/${typeId}/${id}.mp3`;
  },

  applyRecordedAudio(bank, typeIds) {
    if (!bank) return;
    (typeIds || []).forEach((typeId) => {
      const items = bank[typeId] || [];
      items.forEach((q, idx) => {
        if (q.audioUrl) return;
        if (idx >= 8) return;
        q.audioUrl = this.recordedUrl(typeId, q.id);
      });
    });
  }
};
