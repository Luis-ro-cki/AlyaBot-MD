import ytsearch from 'yt-search'
import { getBuffer } from '../../core/message.ts'

const isYouTubeUrl = (text = '') => {
  return /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\S+/i.test(text)
}

const getYouTubeUrl = (text = '') => {
  const match = text.match(/(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\S+/i)
  if (!match) return null
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`
}

const formatSize = (bytes = 0) => {
  if (!bytes) return 'Desconocido'
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(2)} MB`
}

const formatDuration = (seconds = 0) => {
  if (!seconds) return 'Desconocido'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

export default {
  command: ['play', 'mp3', 'ytmp3', 'ytaudio', 'playaudio'],
  category: 'downloader',
  run: async (sock, m, args) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》Por favor, menciona el nombre o URL del video que deseas descargar')
      }

      const text = args.join(' ')
      let video = null
      let videoUrl = null

      if (isYouTubeUrl(text)) {
        videoUrl = getYouTubeUrl(text)

        const searchResult = await ytsearch(videoUrl).catch(() => null)
        if (searchResult?.videos?.length) {
          video = searchResult.videos[0]
        }
      } else {
        const searchResult = await ytsearch(text)

        if (!searchResult.videos || !searchResult.videos.length) {
          return m.reply('《✧》 No se encontró información del video.')
        }

        video = searchResult.videos[0]
        videoUrl = video.url
      }

      if (!videoUrl) {
        return m.reply('《✧》 No se pudo obtener el enlace del video.')
      }

      const apiUrl = `https://api.nexray.eu.cc/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`

      const res = await fetch(apiUrl, {
        headers: {
          accept: 'application/json'
        }
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.status || !json?.result?.url) {
        return m.reply('《✧》 No se pudo descargar el *audio*, intenta más tarde.')
      }

      const data = json.result

      const title = data.title || video?.title || 'Audio de YouTube'
      const canal = video?.author?.name || video?.author || 'Desconocido'
      const duration = data.duration ? formatDuration(data.duration) : video?.timestamp || 'Desconocido'
      const vistas = video?.views ? video.views.toLocaleString() : 'Desconocido'
      const thumbnail = data.thumbnail || video?.image
      const fileName = data.filename || `${title}.mp3`

      const caption = `➥ Descargando › ${title}

> ✿⃘࣪◌ ֪ Canal › ${canal}
> ✿⃘࣪◌ ֪ Duración › ${duration}
> ✿⃘࣪◌ ֪ Calidad › ${data.quality || '320'}kbps
> ✿⃘࣪◌ ֪ Tamaño › ${formatSize(data.size)}
> ✿⃘࣪◌ ֪ Vistas › ${vistas}
> ✿⃘࣪◌ ֪ Enlace › ${videoUrl}

𐙚 ❀ ｡ ↻ El archivo se está enviando, espera un momento... ˙𐙚`

      if (thumbnail) {
        const thumbBuffer = await getBuffer(thumbnail).catch(() => null)

        if (thumbBuffer) {
          await sock.sendMessage(m.chat, { image: thumbBuffer, caption }, { quoted: m })
        } else {
          await m.reply(caption)
        }
      } else {
        await m.reply(caption)
      }

      try {
        await sock.sendMessage(
          m.chat,
          {
            audio: { url: data.url },
            mimetype: 'audio/mpeg',
            fileName
          },
          { quoted: m }
        )
      } catch {
        const audioBuffer = await getBuffer(data.url)

        await sock.sendMessage(
          m.chat,
          {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName
          },
          { quoted: m }
        )
      }
    } catch (e) {
      console.error(e)
      await m.reply(msgglobal)
    }
  }
}