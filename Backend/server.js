require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(cors());
app.use(limiter);

const GENIUS_ACCESS_TOKEN = process.env.Genius_Token;

// Rotating headers and user agents
const HEADERS_LIST = [
    {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
    },
    {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.5',
        'Referer': 'https://www.bing.com/'
    },
    {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-CA,en;q=0.5',
        'Referer': 'https://duckduckgo.com/'
    }
];

// Alternative lyrics sources
const LYRICS_SOURCES = {
    MUSIXMATCH: 'musixmatch',
    AZLYRICS: 'azlyrics',
    GENIUS: 'genius'
};

function getRandomHeaders() {
    return HEADERS_LIST[Math.floor(Math.random() * HEADERS_LIST.length)];
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const headers = {
                ...getRandomHeaders(),
                ...options.headers
            };

            const response = await axios({
                url,
                ...options,
                headers,
                timeout: 10000,
                validateStatus: function (status) {
                    return status >= 200 && status < 500;
                }
            });

            if (response.status === 403) {
                throw new Error('IP blocked');
            }

            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await delay(2000 * (i + 1));
        }
    }
}

async function searchMusixmatch(song) {
    try {
        const searchUrl = `https://www.musixmatch.com/search/${encodeURIComponent(song)}`;
        const response = await fetchWithRetry(searchUrl);
        const dom = new JSDOM(response.data);
        const firstResult = dom.window.document.querySelector('.media-card-title a');
        
        if (!firstResult) return null;
        
        const songUrl = 'https://www.musixmatch.com' + firstResult.href;
        const lyricsResponse = await fetchWithRetry(songUrl);
        const lyricsDom = new JSDOM(lyricsResponse.data);
        const lyricsContainer = lyricsDom.window.document.querySelector('.mxm-lyrics');
        
        return lyricsContainer ? lyricsContainer.textContent.trim() : null;
    } catch (error) {
        console.error('Musixmatch fetch failed:', error.message);
        return null;
    }
}

async function searchAZLyrics(song) {
    try {
        const searchUrl = `https://search.azlyrics.com/search.php?q=${encodeURIComponent(song)}`;
        const response = await fetchWithRetry(searchUrl);
        const dom = new JSDOM(response.data);
        const firstResult = dom.window.document.querySelector('.text-left a');
        
        if (!firstResult) return null;
        
        const songUrl = firstResult.href;
        const lyricsResponse = await fetchWithRetry(songUrl);
        const lyricsDom = new JSDOM(lyricsResponse.data);
        const lyricsContainer = lyricsDom.window.document.querySelector('.ringtone ~ div');
        
        return lyricsContainer ? lyricsContainer.textContent.trim() : null;
    } catch (error) {
        console.error('AZLyrics fetch failed:', error.message);
        return null;
    }
}

async function searchGenius(song) {
    try {
        const searchResponse = await fetchWithRetry(
            `https://api.genius.com/search?q=${encodeURIComponent(song)}`,
            {
                headers: {
                    'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`
                }
            }
        );

        const hits = searchResponse.data.response.hits;
        if (hits.length === 0) return null;

        const songPath = hits[0].result.path;
        const lyricsPageUrl = `https://genius.com${songPath}`;
        
        await delay(1000);
        
        const lyricsResponse = await fetchWithRetry(lyricsPageUrl);
        const dom = new JSDOM(lyricsResponse.data);
        const lyricsContainers = dom.window.document.querySelectorAll('[class*="Lyrics__Container"], [class*="lyrics"]');
        
        if (lyricsContainers.length === 0) return null;
        
        let lyrics = Array.from(lyricsContainers)
            .map(container => container.textContent)
            .join('\n\n')
            .replace(/\[\w+\]/g, '')
            .trim();
            
        return lyrics || null;
    } catch (error) {
        console.error('Genius fetch failed:', error.message);
        return null;
    }
}

app.get("/lyrics", async (req, res) => {
    const { song } = req.query;
    if (!song) {
        return res.status(400).json({ error: "Song title is required" });
    }

    console.log(`Searching lyrics for: ${song}`);

    try {
        // Try each source in sequence until we get lyrics
        let lyrics = null;
        
        // Try Genius first
        lyrics = await searchGenius(song);
        if (lyrics) {
            console.log('Found lyrics on Genius');
            return res.json({ lyrics, source: LYRICS_SOURCES.GENIUS });
        }

        // Try Musixmatch second
        lyrics = await searchMusixmatch(song);
        if (lyrics) {
            console.log('Found lyrics on Musixmatch');
            return res.json({ lyrics, source: LYRICS_SOURCES.MUSIXMATCH });
        }

        // Try AZLyrics last
        lyrics = await searchAZLyrics(song);
        if (lyrics) {
            console.log('Found lyrics on AZLyrics');
            return res.json({ lyrics, source: LYRICS_SOURCES.AZLYRICS });
        }

        // No lyrics found in any source
        return res.status(404).json({ error: "Lyrics not found in any source" });

    } catch (error) {
        console.error("Error fetching lyrics:", error);
        const isBlocked = error.message.includes('IP blocked') || error.response?.status === 403;
        
        return res.status(isBlocked ? 403 : 500).json({
            error: isBlocked ? 
                "Access temporarily restricted. Trying alternative sources..." :
                "Failed to fetch lyrics"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
