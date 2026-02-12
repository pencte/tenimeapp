const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

app.use(cors());

// Gunakan proxy untuk menembus blokir IP
const getProxyUrl = (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

const fetchD = async (url) => {
    try {
        const { data } = await axios.get(getProxyUrl(url), { timeout: 15000 });
        // AllOrigins mengembalikan data dalam bentuk { contents: "html nya di sini" }
        return cheerio.load(data.contents);
    } catch (e) {
        console.error("Gagal mengambil data via Proxy:", e.message);
        return null;
    }
};

const BASE = 'https://otakudesu.best/';

app.get('/api/ping', (req, res) => res.json({ s: 'ok' }));

app.get('/api/terbaru', async (req, res) => {
    const $ = await fetchD(BASE);
    if (!$) return res.json([{title: "Server Sangat Sibuk - Coba Lagi Nanti", thumb: "", id: ""}]);
    
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
    res.json({ sinop: $('.sinopc').first().text().trim(), thumb: $('.fotoanime img').attr('src'), eps });
});

app.get('/api/video/:id', async (req, res) => {
    const $ = await fetchD(`${BASE}episode/${req.params.id}/`);
    if(!$) return res.json({u: '', dl: []});
    let v = $('#pembed iframe').attr('src') || $('.responsive-embed-stream iframe').attr('src');
    const dl = [];
    $('.download ul li').each((i, el) => {
        const q = $(el).find('strong').text().trim();
        const links = [];
        $(el).find('a').each((j, a) => { links.push({ h: $(a).text().trim(), u: $(a).attr('href') }); });
        if(q) dl.push({ q, links });
    });
    res.json({ u: v || '', dl });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server nyala di port ${PORT}`));
