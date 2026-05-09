import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import fetch from 'node-fetch'
import exif from '../../core/exif.ts'
const { writeExif } = exif

export default {
  command: ['sticker', 's'],
  category: 'stickers',
  run: async (sock, m, args, command, text, usedPrefix) => {
    try {
      const quoted = m.quoted ? m.quoted : m
      const mime = (quoted.msg || quoted).mimetype || ''
      let user = await getUser(m.sender)
      const name = user.name
      const meta1 = user.metadatos ? String(user.metadatos).trim() : ''
      const meta2 = user.metadatos2 ? String(user.metadatos2).trim() : ''
      let texto1 = meta1 ? meta1 : `S'ᴛᴇʟʟᴀʀ 🧠 Wᴀʙᴏᴛ`
      let texto2 = meta1 ? (meta2 ? meta2 : '') : `@${name}`
      let urlArg = null
      for (let arg of args) {
        if (isUrl(arg)) {
          urlArg = arg
        }
      }
      let filteredText = args.join(' ').trim()
      let marca = filteredText.split(/[\u2022|]/).map(part => part.trim())
      let pack = marca[0] || texto1
      let author = marca.length > 1 ? marca[1] : texto2
      const sendWebpWithExif = async (webpBuffer) => {
        const media = { mimetype: 'webp', data: webpBuffer }
        const metadata = { packname: pack, author: author, categories: [''] }
        const stickerPath = await writeExif(media, metadata)
        await sock.sendMessage(m.chat, { sticker: { url: stickerPath } }, { quoted: m })
        fs.unlinkSync(stickerPath)
      }
      const processWithFFmpeg = async (inputPath, isVideo = false) => {
        const outputPath = `./core/system/tmp/sticker-${Date.now()}.webp`
        let args = ['-y', '-i', inputPath, '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000', '-an', '-c:v', 'libwebp', '-preset', 'picture', '-compression_level', '6', '-q:v', '70', '-loop', '0', outputPath]
        await new Promise((resolve, reject) => {
          const p = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })
          let err = ''
          p.stderr.on('data', (d) => err += d.toString())
          p.on('close', (code) => {
            if (code === 0) resolve()
            else reject(new Error(err))
          })
        })
        const data = fs.readFileSync(outputPath)
        fs.unlinkSync(outputPath)
        await sendWebpWithExif(data)
      }
      if (/image/.test(mime) || /webp/.test(mime)) {
        let buffer = await quoted.download()
        const ext = /png/i.test(mime) ? 'png' : /jpe?g/i.test(mime) ? 'jpg' : /gif/i.test(mime) ? 'gif' : 'img'
        const inputPath = `./core/system/tmp/in-${Date.now()}.${ext}`
        fs.writeFileSync(inputPath, buffer)
        await processWithFFmpeg(inputPath, /gif/i.test(mime))
        fs.unlinkSync(inputPath)
      } else if (/video/.test(mime)) {
        if ((quoted.msg || quoted).seconds > 20) {
          return m.reply('《✧》 El video no puede ser muy largo')
        }
        let buffer = await quoted.download()
        const inputPath = `./core/system/tmp/video-${Date.now()}.mp4`
        fs.writeFileSync(inputPath, buffer)
        await processWithFFmpeg(inputPath, true)
        fs.unlinkSync(inputPath)
      } else if (urlArg) {
        const url = urlArg
        if (!url.match(/\.(jpe?g|png|gif|webp|mp4|mov|avi|mkv|webm)(\?.*)?$/i)) {
          return sock.reply(m.chat, '《✧》 La URL debe ser de una imagen o video válido', m)
        }
        const response = await fetch(url)
        if (!response.ok) return sock.reply(m.chat, '《✧》 No pude descargar ese archivo desde la URL.', m)
        const buffer = Buffer.from(await response.arrayBuffer())
        const ext = url.match(/\.gif/i) ? 'gif' : url.match(/\.png/i) ? 'png' : url.match(/\.jpe?g/i) ? 'jpg' : url.match(/\.webp/i) ? 'webp' : 'mp4'
        const inputPath = `./core/system/tmp/url-${Date.now()}.${ext}`
        fs.writeFileSync(inputPath, buffer)
        await processWithFFmpeg(inputPath, /gif|mp4|mov|avi|mkv|webm/i.test(url))
        fs.unlinkSync(inputPath)
      } else {
        return sock.reply(m.chat, `《✧》 Por favor, responde a una imagen o video para hacer un sticker.`, m)
      }
    } catch (e) {
      return m.reply(msgglobal)
    }
  }
}

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/, 'gi'))
}