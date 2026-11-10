const express = require('express');
const { createClient } = require('redis');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.on('error', (err) => console.log('❌ Error Redis:', err));

app.post('/api/save', async (req, res) => {
    const { key, value } = req.body;
    if (!key || !value) {
        return res.status(400).json({ success: false, message: 'Completa ambos campos.' });
    }
    try {
        await redisClient.set(key, value);
        res.json({ success: true, message: `✅ Guardado en Redis: "${key}"` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al guardar.' });
    }
});

app.get('/api/list', async (req, res) => {
    try {
        const keys = await redisClient.keys('*');
        const data = [];
        for (const k of keys) {
            const v = await redisClient.get(k);
            data.push({ key: k, value: v });
        }
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al listar.' });
    }
});

app.delete('/api/delete/:key', async (req, res) => {
    try {
        await redisClient.del(req.params.key);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.listen(PORT, async () => {
    await redisClient.connect();
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
    console.log('🔗 Conectado a Redis');
});

