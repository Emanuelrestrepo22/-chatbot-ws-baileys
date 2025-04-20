// Archivo: app.js
const express = require('express')
const fs = require('fs')
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')

// --- Validación para evitar crash si el archivo JSON está vacío o corrupto
const checkJSONCorruption = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        if (!data || data.trim() === '') {
            console.warn(`⚠️ El archivo ${filePath} está vacío. Se eliminará para evitar errores.`)
            fs.unlinkSync(filePath)
        } else {
            JSON.parse(data) // Intenta parsear el JSON, si falla se pasa al catch
        }
    } catch (err) {
        console.warn(`⚠️ El archivo ${filePath} está corrupto. Se eliminará.`)
        fs.unlinkSync(filePath)
    }
}

// --- Flujos del chatbot ---
const flowHablarConEmanuel = addKeyword(['1', 'emanuel', 'persona', 'humano'])
    .addAnswer([
        '🧔🏻 ¡Hola! Gracias por tu mensaje 😊',
        'Estoy ocupado, pero te respondo personalmente en breve.',
        'Dejá tu mensaje y te contacto.',
        '¡Gracias por elegir *Resmor Transportes*!'
    ])

const flowResmor = addKeyword(['2', 'resmor', 'info', 'servicios'])
    .addAnswer([
        '🚛 *Resmor Transportes* te ofrece:',
        '✈️ Traslados al aeropuerto',
        '🚚 Fletes y mudanzas',
        '📩 Respondé con *mudanza* o *aeropuerto*.',
        '🔙 Escribí *menu* para volver al menú.'
    ])

const flowCotizacionMudanza = addKeyword(['mudanza', 'flete'])
    .addAnswer([
        '🚚 ¿Querés cotización? Necesito estos datos:'
    ])
    .addAnswer([
        '📦 ¿Qué artículos trasladás?',
        '📍 ¿Desde dónde y hacia dónde?',
        '📆 ¿Qué día?',
        '🕒 ¿Mañana, tarde o noche?',
        '🏢 ¿Escaleras o ascensor?',
        '🔙 Escribí *menu* para volver al inicio.'
    ])

const flowTrasladoAeropuerto = addKeyword(['aeropuerto', 'eze', 'aep'])
    .addAnswer([
        '✈️ ¡Gracias por tu consulta!',
        'Necesito algunos datos:'
    ])
    .addAnswer([
        '📍 Dirección de origen/destino',
        '📆 Fecha y hora',
        '🛬 N° de vuelo si corresponde',
        '👥 Cantidad de pasajeros y valijas'
    ])

const flowVolverAlMenu = addKeyword(['menu', 'inicio', 'volver'])
    .addAnswer('🔝 Volvemos al menú principal...')
    .addAnswer([
        '1️⃣ Hablar con Emanuel',
        '2️⃣ Conocer nuestros servicios',
        '📩 Respondé con 1 o 2.'
    ])

const flowPrincipal = addKeyword(['hola', 'buenas', 'ole'])
    .addAnswer('🙌 ¡Hola! Soy el asistente virtual de Resmor Transportes.')
    .addAnswer('Puedo ayudarte con lo siguiente:')
    .addAnswer([
        '1️⃣ Hablar con Emanuel',
        '2️⃣ Conocer nuestros servicios',
        '📩 Respondé con 1 o 2.'
    ], { capture: true }, async (ctx, { fallBack, gotoFlow }) => {
        const msg = ctx.body.trim()
        if (msg === '1') return gotoFlow(flowHablarConEmanuel)
        if (msg === '2') return gotoFlow(flowResmor)
        return fallBack('❌ Opción inválida. Escribí 1 o 2.')
    })

// --- Main bot y servidor Express ---
const main = async () => {
    const sessionPath = './auth_session.json'
    checkJSONCorruption(sessionPath)

    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([
        flowPrincipal,
        flowHablarConEmanuel,
        flowResmor,
        flowCotizacionMudanza,
        flowTrasladoAeropuerto,
        flowVolverAlMenu
    ])

    const adapterProvider = await createProvider(BaileysProvider, {
        name: 'auth_session' // carpeta que contiene la sesión activa
    })

    await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    // Servidor Express para visualizar el QR
    const app = express()
    const PORT = process.env.PORT || 3000
    const qrPath = './auth_session.qr.png'

    app.get('/', (req, res) => {
        if (fs.existsSync(qrPath)) {
            res.writeHead(200, { 'Content-Type': 'image/png' })
            fs.createReadStream(qrPath).pipe(res)
        } else {
            res.status(404).send('⚠️ El QR no está disponible aún.')
        }
    })

    app.listen(PORT, () => {
        console.log(`🌐 Servidor QR activo en puerto ${PORT}`)
    })
}

main()
