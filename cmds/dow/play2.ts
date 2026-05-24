import yts from 'yt-search'
import { getBuffer } from '../../core/message.ts'

const getYouTubeUrl = (text = '') => {
  const match = text.match(/(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\S+/i)
  if (!match) return null
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`
}

const getVideoId = (url = '') => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

const formatDuration = (seconds = 0) => {
  if (!seconds) return 'Desconocido'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

export default {
  command: ['play2', 'mp4', 'ytmp4', 'ytvideo', 'playvideo'],
  category: 'downloader',
  run: async (sock, m, args) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》Por favor, menciona el nombre o URL del video que deseas descargar')
      }

      const text = args.join(' ')
      const inputUrl = getYouTubeUrl(text)
      let videoInfo = null
      let videoUrl = null

      if (inputUrl) {
        const videoId = getVideoId(inputUrl)
        videoUrl = videoId ? `https://youtu.be/${videoId}` : inputUrl

        const search = await yts(videoUrl).catch(() => null)

        if (search?.videos?.length) {
          videoInfo = videoId
            ? search.videos.find(v => v.videoId === videoId) || search.videos[0]
            : search.videos[0]
        }
      } else {
        const search = await yts(text)

        if (!search.videos || !search.videos.length) {
          return m.reply('《✧》 No se encontró información del video.')
        }

        videoInfo = search.videos[0]
        videoUrl = videoInfo.url
      }

      if (!videoUrl) {
        return m.reply('《✧》 No se pudo obtener el enlace del video.')
      }

      const endpoint = `https://api.nexray.eu.cc/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}&resolusi=720`

      const response = await fetch(endpoint, {
        headers: {
          accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        }
      })

      const res = await response.json().catch(() => null)

      if (!response.ok || !res?.status || !res?.result?.url) {
        return m.reply('《✧》 No se pudo descargar el *video*, intenta más tarde.')
      }

      const data = res.result

      const title = data.title || videoInfo?.title || 'Video de YouTube'
      const thumbnail = data.thumbnail || videoInfo?.image
      const canal = videoInfo?.author?.name || 'Desconocido'
      const vistas = videoInfo?.views ? videoInfo.views.toLocaleString() : 'Desconocido'
      const duration = data.duration
        ? formatDuration(data.duration)
        : videoInfo?.timestamp || 'Desconocido'

      const caption = `➥ Descargando › ${title}

> ✿⃘࣪◌ ֪ Canal › ${canal}
> ✿⃘࣪◌ ֪ Duración › ${duration}
> ✿⃘࣪◌ ֪ Resolución › ${data.resolusi || '720'}p
> ✿⃘࣪◌ ֪ Vistas › ${vistas}
> ✿⃘࣪◌ ֪ Publicado › ${videoInfo?.ago || 'Desconocido'}
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

      await sock.sendMessage(
        m.chat,
        {
          video: { url: data.url },
          fileName: `${title}.mp4`,
          mimetype: 'video/mp4'
        },
        { quoted: m }
      )
    } catch (e) {
      console.error(e)
      await m.reply(msgglobal)
    }
  }
}