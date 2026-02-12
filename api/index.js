const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

app.use(cors());

// Daftar domain Otakudesu (urutan dari yang paling stabil)
const DOMAINS = [
    'https://otakudesu.best/',
    'https://otakudesu.cloud/',
    'https://otakudesu.cam/'
];

const fetchD = async (endpoint) => {
    for (let domain of DOMAINS) {
        try {
            const targetUrl = domain + endpoint;
            const { data } = await axios.get(targetUrl, { 
                timeout: 8000,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Referer': domain
                }
            });
            if (data) return cheerio.load(data);
        } catch (e) {
            console.log(`Gagal di domain ${domain}, mencoba domain lain...`);
            continue; 
        }
    }
    return null; 
};

app.get('/api/ping', (req, res) => res.json({ s: 'ok' }));

app.get('/api/terbaru', async (req, res) => {
    const $ = await fetchD('');
    if (!$) return res.json([{title: "Semua Server Down - Coba Lagi Nanti", thumb: "", id: ""}]);
    
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

// Endpoint Detail & Video juga disesuaikan pake fetchD
app.get('/api/detail/:id', async (req, res) => {
    const $ = await fetchD(`anime/${req.params.id}/`);
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
    const $ = await fetchD(`episode/${req.params.id}/`);
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
                             
