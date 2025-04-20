const express = require('express')
const fs = require('fs')
const app = express()

app.get('/', (req, res) => {
    const imagePath = './bot.qr.png'

    if (fs.existsSync(imagePath)) {
        res.writeHead(200, { 'Content-Type': 'image/png' })
        fs.createReadStream(imagePath).pipe(res)
    } else {
        res.send('QR aún no disponible. Intentá recargar en unos segundos.')
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🌐 Servidor web para QR disponible en el puerto ${PORT}`)
})
