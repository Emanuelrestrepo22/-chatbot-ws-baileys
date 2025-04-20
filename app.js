// Archivo: app.js
const express = require('express')
const fs = require('fs')
const debug = require('debug')('bot') // ✅ Logger controlado
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')

// 🧔🏻 Subflujo: Hablar con Emanuel
const flowHablarConEmanuel = addKeyword(['1', 'hablar con emanuel', 'emanuel', 'persona', 'humano'])
    .addAnswer([
        '🧔🏻 ¡Hola! Gracias por tu mensaje 😊',
        'En este momento estoy ocupado atendiendo otras consultas, pero voy a responderte personalmente en breve.',
        '📲 Dejá tu mensaje y apenas esté disponible me comunico con vos.',
        '¡Gracias por tu paciencia y por comunicarte con *Resmor Transportes*!'
    ])

// 🚛 Servicios
const flowResmor = addKeyword(['2', 'resmor', 'info', 'servicios'])
    .addAnswer([
        '🚛 *Resmor Transportes* te ofrece los siguientes servicios:',
        '✈️ Traslados ejecutivos al aeropuerto',
        '🚚 Fletes y mudanzas con cuidado profesional',
        '🗓️ Coordiná tu servicio con anticipación para mejor disponibilidad',
        '',
        '📩 Respondé con *mudanza* o *aeropuerto* según el servicio que necesitás.',
        '🔙 Escribí *menu* para volver al menú principal.'
    ])

// 📦 Cotización para mudanzas
const flowCotizacionMudanza = addKeyword(['mudanza', 'flete', 'mini mudanza', 'minimudanza', 'traslado de muebles'])
    .addAnswer([
        '🚚 ¿Querés una cotización para *mudanza, flete o mini flete*? ¡Perfecto! 💪',
        'Antes de pasarte el presupuesto necesito algunos datos 👇'
    ])
    .addAnswer([
        '📦 *¿Qué muebles o artículos necesitás trasladar?* (ej: cama, heladera, cajas, TV)',
        '📍 *¿Desde dónde y hasta dónde* es el traslado? (incluí calle y localidad)',
        '📆 *¿Qué día precisás el servicio?*',
        '🕒 *¿En qué franja horaria* preferís coordinar? (mañana, tarde o noche)',
        '🏢 *¿Los muebles deben bajarse o subirse por escaleras o ascensores?*',
        '',
        '💬 Indicame si necesitás este adicional así lo incluyo en el presupuesto final.',
        '🔙 Escribí *menu* para volver al menú principal.'
    ])

// ✈️ Traslado al aeropuerto
const flowTrasladoAeropuerto = addKeyword([
    'aeropuerto', 'aep', 'eze', 'traslado aeropuerto', 'retiro aeropuerto', 'transfer aeropuerto', 'transfer'
])
    .addAnswer([
        '✈️ ¡Gracias por tu consulta sobre traslados al aeropuerto!',
        '🧔🏻 En breve me comunicaré personalmente con vos 😊',
        'Mientras tanto, para ir adelantando y enviarte un presupuesto, necesito algunos datos 👇'
    ])
    .addAnswer([
        '📍 *¿Desde dónde o hacia dónde es el traslado?* (ej: desde Palermo a Ezeiza)',
        '📆 *¿Qué fecha necesitás el servicio?*',
        '🕒 *¿A qué hora lo necesitás?*',
        '',
        '🛬 *Si es un vuelo de llegada*, ¿podés indicarme:',
        '- Hora estimada de llegada',
        '- Número de vuelo (para seguimiento por posibles demoras)?'
    ])
    .addAnswer([
        '👥 *¿Cuántos pasajeros viajan?*',
        '🎒 *¿Cuántas valijas o maletas llevan?*',
        '',
        '💬 Respondé todo en un solo mensaje o por partes. ¡Estoy atento!',
        '🔙 Escribí *menu* para volver al menú principal.'
    ])
    .addAnswer([
        '📌 *Tarifas estimadas del servicio aeropuerto:*',
        '- Hasta 4 valijas: $50.000 ARS o 40 USD',
        '- Más de 4 valijas: $60.000 ARS o 50 USD'
    ])

// 🔄 Volver al menú
const flowVolverAlMenu = addKeyword(['menu', 'inicio', 'volver'])
    .addAnswer('🔝 Volvemos al menú principal...')
    .addAnswer([
        '1️⃣ *Hablar con Emanuel directamente*',
        '2️⃣ *Conocer nuestros servicios de transporte*',
        '\n📩 Respondé con el número de opción que deseas.'
    ])

// 🧠 Flujo principal
const flowPrincipal = addKeyword(['hola', 'buenas', 'ole', 'alo'])
    .addAnswer('🙌 ¡Hola! Soy el asistente virtual de Emanuel (Resmor Transportes).')
    .addAnswer('Actualmente estoy ocupado, pero puedo ayudarte con lo siguiente:')
    .addAnswer([
        '1️⃣ *Hablar con Emanuel directamente*',
        '2️⃣ *Conocer nuestros servicios de transporte*',
        '\n📩 Respondé con el número de opción que deseas.'
    ], { capture: true }, async (ctx, { fallBack, gotoFlow }) => {
        const mensaje = ctx.body.trim()
        if (mensaje === '1') return gotoFlow(flowHablarConEmanuel)
        if (mensaje === '2') return gotoFlow(flowResmor)
        return fallBack('❌ Opción no válida. Escribí *1* o *2* para continuar.')
    })

// 🚀 Setup del bot y servidor QR
const main = async () => {
    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([
        flowPrincipal,
        flowHablarConEmanuel,
        flowResmor,
        flowCotizacionMudanza,
        flowTrasladoAeropuerto,
        flowVolverAlMenu
    ])
    const adapterProvider = createProvider(BaileysProvider)

    const bot = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    // 🎯 Captura de eventos para debug controlado
    const sock = await adapterProvider.init()

    sock.ev.on('chats.set', (data) => {
        debug(`📥 Se cargaron ${data.chats.length} chats.`)
        debug(`📌 Ejemplo: ${data.chats[0]?.name || 'Sin nombre'}`)
    })

    sock.ev.on('messages.upsert', () => {
        debug(`✉️ Nuevo mensaje entrante.`)
    })

    // 🔗 Servidor Express para mostrar QR
    const app = express()
    const PORT = process.env.PORT || 3000

    app.get('/', (req, res) => {
        const qrPath = './bot.qr.png'
        if (fs.existsSync(qrPath)) {
            res.writeHead(200, { 'Content-Type': 'image/png' })
            fs.createReadStream(qrPath).pipe(res)
        } else {
            res.send('⚠️ El QR aún no está disponible. Por favor recargá en unos segundos.')
        }
    })

    app.listen(PORT, () => {
        debug(`🌐 Servidor QR activo en el puerto ${PORT}`)
    })
}

// 🧯 Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error("💥 Error no capturado:", err.message)
})

main()
