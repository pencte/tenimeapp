const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

app.use(cors());

// Gunakan Proxy yang paling stabil saat ini
const fetchD = async (url) => {
    try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const { data } = await axios.get(proxyUrl, { 
            timeout: 10000,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        return cheerio.load(data);
    } catch (e) {
        return null;
    }
};

const BASE = 'https://otakudesu.best/';

app.get('/api/ping', (req, res) => res.json({ s: 'ok' }));

app.get('/api/terbaru', async (req, res) => {
    const $ = await fetchD(BASE);
    if (!$) return res.json([{title: "Server Sibuk", thumb: "", id: ""}]);
    const r = [];
    $('.venz ul li').each((i, el) => {
        const link = $(el).find('a').attr('href');
        if (link) {
            r.push({
                title: $(el).find('h2').text().trim(),
                thumb: $(el).find('img').attr('src'),
                id: link.split('/').filter(Boolean).pop()
            });
        }
    });
    res.json(r);
});

app.get('/api/detail/:id', async (req, res) => {
    const $ = await fetchD(`${BASE}anime/${req.params.id}/`);
    if (!$) return res.json({ e: 1 });
    const eps = [];
    $('.episodelist ul li').each((i, el) => {
        const a = $(el).find('a');
        if (a.attr('href')) {
            eps.push({ 
                title: a.text().trim(), 
                id: a.attr('href').split('/').filter(Boolean).pop()
            });
        }
    });
    res.json({ 
        sinop: $('.sinopc').first().text().trim() || "Sinopsis tidak tersedia", 
        thumb: $('.fotoanime img').attr('src'), 
        eps 
    });
});

app.get('/api/video/:id', async (req, res) => {
    const $ = await fetchD(`${BASE}episode/${req.params.id}/`);
    if(!$) return res.json({u: '', dl: []});
    
    // 1. Cari Link Stream (Coba 3 kemungkinan tempat)
    let v = $('#pembed iframe').attr('src') || 
            $('.responsive-embed-stream iframe').attr('src') || 
            $('.video-content iframe').attr('src');

    // 2. Cari Link Download (Struktur Baru)
    const dl = [];
    $('.download ul li').each((i, el) => {
        const quality = $(el).find('strong').text().trim() || $(el).find('i').text().trim();
        if (quality) {
            const links = [];
            $(el).find('a').each((j, a) => {
                const name = $(a).text().trim();
                const url = $(a).attr('href');
                if (url) links.push({ h: name, u: url });
            });
            if (links.length > 0) dl.push({ q: quality, links });
        }
    });

    res.json({ u: v || '', dl });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server nyala di port ${PORT}`));
