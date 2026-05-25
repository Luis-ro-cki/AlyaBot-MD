import fetch from 'node-fetch';

const TIKTOK_API_KEY = 'TU_API_KEY_AQUI'; // ← Pon tu API key aquí

export default {
  command: ['tiktoksearch', 'ttsearch', 'tts'],
  category: 'search',
  run: async (sock, m, args) => {
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botSettings = await getSettings(botId);
    const banner = botSettings.icon;

    if (!args || !args.length) {
      return sock.reply(
        m.chat,
        `✿ Ingresa un término de búsqueda o un link de TikTok.`,
        m,
      );
    }

    const query = args.join(' ');
    const url = `https://yosoyyo-api-ofc.onrender.com/api/tiktoksearch?q=${encodeURIComponent(query)}&apiKey=${TIKTOK_API_KEY}`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json || !json.result || !json.result.length) {
        return sock.reply(m.chat, `✿ No se encontraron resultados para "${query}".`, m);
      }

      let message = ``;
      json.result.forEach((result, index) => {
        const raw = result.raw || {};
        message += `➩ *Título ›* ${result.title}

𖹭  ׄ  ְ ✿ Autor › ${result.authorName} (@${result.authorHandle})
𖹭  ׄ  ְ ✤ Reproducciones › ${raw.play_count ?? 'N/A'}
𖹭  ׄ  ְ ✰ Comentarios › ${raw.comment_count ?? 'N/A'}
𖹭  ׄ  ְ ❖ Compartidos › ${raw.share_count ?? 'N/A'}
𖹭  ׄ  ְ ꕥ Me gusta › ${raw.digg_count ?? 'N/A'}
𖹭  ׄ  ְ ☄︎ Descargas › ${raw.download_count ?? 'N/A'}
𖹭  ׄ  ְ ⚡︎ Duración › ${result.duration}s
𖹭  ׄ  ְ ❑ URL › ${result.videoUrl}

${index < json.result.length - 1 ? '╾۪〬─ ┄۫╌ ׄ┄┈۪ ─〬 ׅ┄╌ ۫┈ ─ׄ─۪〬 ┈ ┄۫╌ ┈┄۪ ─ׄ〬╼' : ''}
`;
      });

      await sock.sendContextInfoIndex(m.chat, message, {}, m, true, {});
    } catch (e) {
      await m.reply(msgglobal);
    }
  },
};
    
