import ytsearch from 'yt-search'
import { getBuffer } from '../../core/message.ts'
import fetch from 'node-fetch'

export default {
  command: ['play', 'mp3', 'ytmp3', 'ytaudio', 'playaudio'],
  category: 'downloader',
  run: async (sock, m, args) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》Por favor, menciona el nombre o URL del video que deseas descargar')
      }

      const text = args.join(' ')
      const searchResult = await ytsearch(text)
      if (!searchResult.videos || !searchResult.videos.length) {
        return m.reply('《✧》 No se encontró información del video.')
      }

      const video = searchResult.videos[0]
      const { title, author, timestamp: duration, views, url, image } = video
      const vistas = (views || 0).toLocaleString()
      const canal = author?.name || author || 'Desconocido'
      const thumbBuffer = await getBuffer(image)

      const caption = `➥ Descargando › ${title}

> ✿⃘࣪◌ ֪ Canal › ${canal}
> ✿⃘࣪◌ ֪ Duración › ${duration || 'Desconocido'}
> ✿⃘࣪◌ ֪ Vistas › ${vistas}
> ✿⃘࣪◌ ֪ Enlace › ${url}

𐙚 ❀ ｡ ↻ El archivo se está enviando, espera un momento... ˙𐙚`

      await sock.sendMessage(m.chat, { image: thumbBuffer, caption }, { quoted: m })

      const dlEndpoint = `${api.url}/dl/youtubeplayv2?query=${encodeURIComponent(text)}&type=mp3&quality=auto&key=${api.key}`
      const resDl = await fetch(dlEndpoint).then(r => r.json())
      if (!resDl?.status || !resDl.data?.dl) {
        return m.reply('《✧》 No se pudo descargar el *audio*, intenta más tarde.')
      }

      const audioBuffer = await getBuffer(resDl.data.dl)
      const mensaje = {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: resDl.data.fileName || `${title}.mp3`
      }

      await sock.sendMessage(m.chat, mensaje, { quoted: m })
    } catch (e) {
      await m.reply(msgglobal)
    }
  }
}