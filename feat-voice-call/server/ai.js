function aiResponse(msg) {
    const badWords = ['bodoh', 'goblok', 'bangsat'];
    for (let word of badWords) {
      if (msg.toLowerCase().includes(word)) {
        return 'Harap jaga bahasa ya, ini ruang publik.';
      }
    }
    if (msg.toLowerCase().includes('apa itu ai')) {
      return 'AI adalah kecerdasan buatan yang bisa membantu manusia dalam banyak hal!';
    }
    return null;
  }
  
  module.exports = { aiResponse };
  