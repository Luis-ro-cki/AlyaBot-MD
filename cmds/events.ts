import chalk from 'chalk'
import moment from 'moment-timezone'
import { prepareWAMessageMedia } from '@whiskeysockets/baileys';

export default async (sock, m) => {
  sock.ev.on('group-participants.update', async (anu) => {
    try {
      const metadata = await sock.groupMetadata(anu.id) || {}
      const chat = await getChat(anu.id)

      const botId = sock?.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : ''
      const primaryBotId = chat?.primaryBot || ''

      const botSettings = await getSettings(botId)
      const isSelf = botSettings?.self ?? 0
      if (isSelf) return

      const now = new Date()
      const colombianTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
      const tiempo = colombianTime.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/,/g, '')
      const tiempo2 = moment.tz('America/Bogota').format('hh:mm A')

      const memberCount = metadata.participants?.length || 0

      for (const p of anu.participants) {
        const phone = p.phoneNumber ? p.phoneNumber.split('@')[0] : ''
        const name = await getUser(phone + "@s.whatsapp.net").name
        const avatar = await sock.profilePictureUrl(p.phoneNumber, 'image').catch(_ => "https://apiryn.vercel.app/files/587860bb.jpg")

        const contextBase = {
          mentionedJid: [p.phoneNumber].filter(Boolean),
          isForwarded: false
        }

        if (anu.action === 'add' && chat?.welcome && (!primaryBotId || primaryBotId === botId)) {
          let caption
          if (chat.welcomeMessage && chat.welcomeMessage.trim() !== '') {
            caption = chat.welcomeMessage
              .replace(/@user/g, `@${phone}`)
              .replace(/@group/g, metadata.subject || '')
              .replace(/@desc/g, metadata.desc || 'Sin descripción')
              .replace(/@members/g, memberCount)
              .replace(/@time/g, `${tiempo} ${tiempo2}`)
          } else {
            caption = `ത        ׂ𖹭     ׅ    ꒰͡     𝖭 ⋃ Σ 𝖵 𝖮     
𑄹𑄹  »   𝙐 𝙎 𝙀 𝙍!!*    ✬✫

⪩⪩   ֹ  \`𝖡𝗂𝖾ɳ𝗏𝖾𝗇𝗂𝖽@ 𝖺\`
                 \`${metadata.subject || ''}\`  ꒱꒱ㅤㅤㅤ

*ֹ  ᦕ   ׄ                      _@${phone}_*

         ׅ     ⑅ ׄ     .˙ Disfruta tu estadía!ֹ

な⃟   ۟  ─ _Ahora somos *${memberCount}* miembros!_

> Puedes usar \`/help\` para ver la lista de comandos.
> ✐ 𝐋𝐢𝐧𝐤 » ${botSettings.link}`
          }

          await sock.sendMessage(anu.id, { 
            text: caption.trim(), 
            linkPreview: botSettings.link && avatar ? (
              await prepareWAMessageMedia(
                { image: { url: avatar } },
                { upload: sock.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
              ).then(({ imageMessage }) => ({
                'canonical-url': botSettings.link,
                'matched-text': botSettings.link,
                title: "˚₊·—̳͟͞͞♡ 𝐖 𝐄 𝐋 𝐂 𝐎 𝐌 𝐄 ₍ᐢ..ᐢ₎♡",
                description: `${botSettings.namebot2}, Built With 💛 By Stellar`,
                jpegThumbnail: imageMessage?.jpegThumbnail ? Buffer.from(imageMessage.jpegThumbnail) : undefined,
                highQualityThumbnail: imageMessage || undefined
              }))
            ) : undefined, 
            contextInfo: contextBase
          }, { quoted: m })
        }

        if ((anu.action === 'remove' || anu.action === 'leave') && chat?.goodbye && (!primaryBotId || primaryBotId === botId)) {
          let caption
          if (chat.byeMessage && chat.byeMessage.trim() !== '') {
            caption = chat.byeMessage
              .replace(/@user/g, `@${phone}`)
              .replace(/@group/g, metadata.subject || '')
              .replace(/@desc/g, metadata.desc || 'Sin descripción')
              .replace(/@members/g, memberCount)
              .replace(/@time/g, `${tiempo} ${tiempo2}`)
          } else {
            caption = `ത        ׂ𖹭     ׅ    ꒰͡     A ᗞＩO S     
𑄹𑄹  »   𝙐 𝙎 𝙀 𝙍!!*    ✬✫

⪩⪩   ֹ  \`𝙷𝚊𝚜𝚝𝚊 𝚕𝚞𝚎𝚐𝚘 𝚍𝚎\`
                 \`${metadata.subject || ''}\`  ꒱꒱ㅤㅤㅤ

*ֹ  ᦕ   ׄ                      _@${phone}_*

         ׅ     ⑅ ׄ     .˙ Espero vuelvas Pronto!ֹ

な⃟   ۟  ─ _Ahora somos *${memberCount}* miembros!_

> Puedes usar \`/help\` para ver la lista de comandos.
> ✐ 𝐋𝐢𝐧𝐤 » ${botSettings.link}`
          }

          await sock.sendMessage(anu.id, { 
            text: caption.trim(), 
            linkPreview: botSettings.link && avatar ? (
              await prepareWAMessageMedia(
                { image: { url: avatar } },
                { upload: sock.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
              ).then(({ imageMessage }) => ({
                'canonical-url': botSettings.link,
                'matched-text': botSettings.link,
                title: "˚₊·—̳͟͞͞♡ 𝐁 𝐘 𝐄 ₍ᐢ..ᐢ₎♡",
                description: `${botSettings.namebot2}, Built With 💛 By Stellar`,
                jpegThumbnail: imageMessage?.jpegThumbnail ? Buffer.from(imageMessage.jpegThumbnail) : undefined,
                highQualityThumbnail: imageMessage || undefined
              }))
            ) : undefined, 
            contextInfo: contextBase
          }, { quoted: m })
        }

        if (anu.action === 'promote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
          const usuario = anu.author || ''
          await sock.sendMessage(anu.id, {
            text: `「✎」 *@${phone}* ha sido promovido a Administrador por *@${usuario.split('@')[0]}.*`,
            mentions: [p.phoneNumber, usuario]
          }, { quoted: m })
        }

        if (anu.action === 'demote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
          const usuario = anu.author || ''
          await sock.sendMessage(anu.id, {
            text: `「✎」 *@${phone}* ha sido degradado de Administrador por *@${usuario.split('@')[0]}.*`,
            mentions: [p.phoneNumber, usuario]
          }, { quoted: m })
        }
      }
    } catch (err) {
      console.log(chalk.gray(`[ EVENT ] → ${err}`))
    }
  })
}