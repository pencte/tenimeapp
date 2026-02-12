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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': BASE_URL
            }
        });
        return cheerio.load(data);
    } catch (e) { 
        console.error("Fetch Error:", e.message);
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
                id: link.split('/').filter(Boolean).pop(),
                score: $(el).find('.skor').text().trim() || 'N/A'
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
        const href = a.attr('href');
        if (href && href.includes('/episode/')) {
            eps.push({ 
                title: a.text().trim(), 
                id: href.split('/').filter(Boolean).pop() 
            });
        }
    });
    res.json({ 
        sinop: $('.sinopc').first().text().trim(), 
        thumb: $('.fotoanime img').attr('src'),
        score: $('.infozingle p:contains("Skor")').text().split(':')[1]?.trim() || 'N/A',
        eps: eps
    });
});

app.get('/api/video/:id', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}episode/${req.params.id}`);
    if(!$) return res.json({u: '', dl: []});
    
    // Cari iframe di area streaming
    let streamUrl = $('#pembed iframe').attr('src') || $('.responsive-embed-stream iframe').attr('src');
    
    // Jika tidak ketemu, coba cari di area lain
    if(!streamUrl) {
        streamUrl = $('iframe').first().attr('src');
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

    res.json({ u: streamUrl, dl });
});

module.exports = app;
