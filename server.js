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
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
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
        r.push({
            title: $(el).find('h2').text().trim(),
            thumb: $(el).find('img').attr('src'),
            id: $(el).find('a').attr('href').split('/').filter(Boolean).pop(),
            score: $(el).find('.skor').text().trim() || 'N/A'
        });
    });
    res.json(r);
});

app.get('/api/detail/:id', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}anime/${req.params.id}`);
    if (!$) return res.json({ e: 1 });
    const eps = [];
    $('.episodelist ul li').each((i, el) => {
        const a = $(el).find('a');
        if (a.length && a.attr('href').includes('/episode/')) {
            eps.push({ title: a.text().trim(), id: a.attr('href').split('/').filter(Boolean).pop() });
        }
    });
    res.json({ 
        sinop: $('.sinopc').text().trim(), 
        thumb: $('.fotoanime img').attr('src'),
        score: $('.infozingle p:contains("Skor")').text().split(':')[1]?.trim() || 'N/A',
        eps: eps.reverse() 
    });
});

app.get('/api/video/:id', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}episode/${req.params.id}`);
    if(!$) return res.json({u: '', dl: []});
    const dl = [];
    $('.download ul li').each((i, el) => {
        const q = $(el).find('strong').text().trim();
        const links = [];
        $(el).find('a').each((j, a) => { links.push({ h: $(a).text().trim(), u: $(a).attr('href') }); });
        if(q) dl.push({ q, links });
    });
    res.json({ u: $('.responsive-embed-stream iframe').attr('src'), dl });
});

app.get('/api/jadwal', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}jadwal-rilis/`);
    const r = [];
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    if($) $('h2, h3').each((i, el) => {
        const dText = $(el).text().trim();
        const found = days.find(d => dText.includes(d));
        if (found) {
            const ani = [];
            $(el).nextAll('ul').first().find('li').each((j, li) => {
                const a = $(li).find('a');
                if (a.length) ani.push({ title: a.text().trim(), id: a.attr('href').split('/').filter(Boolean).pop() });
            });
            r.push({ day: found, ani });
        }
    });
    res.json(r);
});

app.get('/api/search/:q', async (req, res) => {
    const $ = await fetchD(`${BASE_URL}?s=${req.params.q}&post_type=anime`);
    const r = [];
    if($) $('.chivsrc li').each((i, el) => {
        r.push({ 
            title: $(el).find('h2').text().trim(), 
            thumb: $(el).find('img').attr('src'), 
            id: $(el).find('a').attr('href').split('/').filter(Boolean).pop(),
            score: $(el).find('.set').first().text().trim() || 'N/A'
        });
    });
    res.json(r);
});

app.listen(8080, '0.0.0.0', () => console.log("SERVER TENIME RESMI AKTIF"));

