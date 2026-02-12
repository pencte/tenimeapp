const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const https = require('https');
const app = express();

app.use(cors());
const agent = new https.Agent({ rejectUnauthorized: false });
const BASE_URL = 'https://otakudesu.cloud/';

const fetchD = async (url) => {
    try {
        const { data } = await axios.get(url, { 
            httpsAgent: agent,
            timeout: 10000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': BASE_URL
            }
        });
        return cheerio.load(data);
    } catch (e) { return null; }
};

app.get('/api/ping', (req, res) => res.json({ s: 'ok' }));

app.get('/api/terbaru', async (req, res) => {
    const $ = await fetchD(BASE_URL);
    if (!$) return res.json([]);
    const r = [];
    $('.venz ul li').each((i, el) => {
        const link = $(el).find('a').attr('href');
        if (link) {
            r.push({
                title: $(el).find('h2').text().trim(),
                thumb: $(el).find('img').attr('src'),
                id: link.split('/').filter(Boolean).pop(),
                score: $(el).find('.skor').text().trim() || '0'
            });
        }
    });
    res.json(r);
});

app.get('/api/detail/:id', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}anime/${req.params.id}`);
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
        sinop: $('.sinopc').first().text().trim(), 
        thumb: $('.fotoanime img').attr('src'),
        eps: eps
    });
});

app.get('/api/video/:id', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}episode/${req.params.id}`);
    if(!$) return res.json({u: '', dl: []});
    
    // Taktik 1: Cari di iframe utama
    let v = $('.responsive-embed-stream iframe').attr('src') || $('#pembed iframe').attr('src');
    
    // Taktik 2: Jika masih kosong, cari di semua iframe yang ada
    if(!v) {
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if(src && (src.includes('desustream') || src.includes('embed'))) v = src;
        });
    }

    const dl = [];
    $('.download ul li').each((i, el) => {
        const q = $(el).find('strong').text().trim();
        const links = [];
        $(el).find('a').each((j, a) => { 
            links.push({ h: $(a).text().trim(), u: $(a).attr('href') }); 
        });
        if(q) dl.push({ q, links });
    });

    res.json({ u: v || '', dl });
});

module.exports = app;
