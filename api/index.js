const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const https = require('https');
const app = express();

app.use(cors());
const agent = new https.Agent({ rejectUnauthorized: false });
const BASE_URL = 'https://otakudesu.best/';

const fetchD = async (url) => {
    try {
        const { data } = await axios.get(url, { 
            httpsAgent: agent,
            timeout: 15000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://otakudesu.best/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive'
            }
        });
        return cheerio.load(data);
    } catch (e) { 
        return null; 
    }
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
                id: link.replace(BASE_URL, '').replace('anime/', '').replace('/', '').split('/').filter(Boolean).pop(),
                score: $(el).find('.skor').text().trim() || 'N/A'
            });
        }
    });
    res.json(r);
});

app.get('/api/detail/:id', async (req, res) => {
    // Pastikan URL detail benar
    const targetUrl = `${BASE_URL}anime/${req.params.id}/`;
    const $ = await fetchD(targetUrl);
    
    if (!$) return res.json({ e: 1, msg: "Gagal fetch domain" });

    const eps = [];
    $('.episodelist ul li').each((i, el) => {
        const a = $(el).find('a');
        const href = a.attr('href');
        if (href) {
            eps.push({ 
                title: a.text().trim(), 
                id: href.replace(BASE_URL, '').replace('episode/', '').replace('/', '')
            });
        }
    });

    res.json({ 
        sinop: $('.sinopc').first().text().trim() || "Sinopsis tidak ditemukan", 
        thumb: $('.fotoanime img').attr('src'),
        score: $('.infozingle p:contains("Skor")').text().split(':')[1]?.trim() || 'N/A',
        eps: eps
    });
});

app.get('/api/video/:id', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}episode/${req.params.id}/`);
    if(!$) return res.json({u: '', dl: []});
    
    let v = $('#pembed iframe').attr('src') || $('.responsive-embed-stream iframe').attr('src');

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
                
