const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

app.use(cors());

// Kita gunakan mirror atau IP langsung jika memungkinkan, tapi di sini kita coba ganti User-Agent lebih ekstrem
const BASE_URL = 'https://otakudesu.cloud/'; // Coba balik ke .cloud atau .cam yang proteksinya lebih rendah

const fetchD = async (url) => {
    try {
        const { data } = await axios.get(url, { 
            timeout: 15000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://google.com', // Pura-pura datang dari Google search
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
    if (!$) return res.json([{title: "Server Sibuk - Coba Refresh", thumb: "", id: ""}]);
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
    const $ = await fetchD(`${BASE_URL}anime/${req.params.id}/`);
    if (!$) return res.json({ e: 1, msg: "Blokir IP terdeteksi" });

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
    const $ = await fetchD(`${BASE_URL}episode/${req.params.id}/`);
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
// ... (Bagian atas kode scraping lo tetep sama)

// HAPUS module.exports = app;
// GANTI DENGAN INI:
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server nyala di port ${PORT}`);
});
        
      
