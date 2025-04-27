require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const rateLimit = require('express-rate-limit');
const HttpsProxyAgent = require('https-proxy-agent');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(cors());
app.use(limiter);

const GENIUS_ACCESS_TOKEN = process.env.Genius_Token;

// Proxy configuration - Add multiple proxies if available
const PROXIES = process.env.PROXIES ? process.env.PROXIES.split(',') : [];
let currentProxyIndex = 0;

// Rotating User-Agents
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

// Cache implementation
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getNextProxy() {
    if (PROXIES.length === 0) return null;
    currentProxyIndex = (currentProxyIndex + 1) % PROXIES.length;
    return PROXIES[currentProxyIndex];
}

function extractTextRecursively(node) {
    if (node.nodeName === "BR") {
        return "\n";
    } else if (node.nodeType === 3) { // Text node
        return node.textContent;
    } else if (node.nodeType === 1) { // Element node
        return Array.from(node.childNodes).map(extractTextRecursively).join("");
    }
    return "";
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3) {
    const cacheKey = url + JSON.stringify(options);
    
    // Check cache first
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        } else {
            cache.delete(cacheKey);
        }
    }

    for (let i = 0; i < retries; i++) {
        try {
            const proxy = getNextProxy();
            const axiosConfig = {
                ...options,
                headers: {
                    ...options.headers,
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: 15000
            };

            if (proxy) {
                axiosConfig.httpsAgent = new HttpsProxyAgent(proxy);
            }

            const response = await axios(url, axiosConfig);
            
            // Cache successful response
            cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });
            
            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            
            if (error.response?.status === 403) {
                // Try different proxy on next attempt
                await delay(2000 * (i + 1)); // Exponential backoff
                continue;
            }
            
            if (i === retries - 1) throw error;
            await delay(1000 * (i + 1));
        }
    }
}

app.get("/lyrics", async (req, res) => {
    const { song } = req.query;
    if (!song) {
        return res.status(400).json({ error: "Song title is required" });
    }

    try {
        // Search for lyrics
        const searchResponse = await fetchWithRetry(
            `https://api.genius.com/search?q=${encodeURIComponent(song)}`,
            {
                headers: {
                    Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
                }
            }
        );

        const hits = searchResponse.data.response.hits;
        if (hits.length > 0) {
            const songPath = hits[0].result.path;
            const lyricsPageUrl = `https://genius.com${songPath}`;
            
            // Add small delay between requests
            await delay(1000);
            
            const lyricsPageResponse = await fetchWithRetry(lyricsPageUrl, {});
            const dom = new JSDOM(lyricsPageResponse.data);
            const document = dom.window.document;

            // Try multiple selector patterns
            const selectors = [
                ".Lyrics__Container-sc-78fb6627-1",
                "[class*='Lyrics__Container']",
                "[class*='lyrics']",
                ".lyrics"
            ];

            let lyricsContainers = [];
            for (const selector of selectors) {
                lyricsContainers = document.querySelectorAll(selector);
                if (lyricsContainers.length > 0) break;
            }

            if (lyricsContainers.length > 0) {
                let lyrics = "";
                lyricsContainers.forEach(container => {
                    lyrics += extractTextRecursively(container) + "\n\n";
                });

                lyrics = lyrics
                    .replace(/\d+\s*Contributors.*?Lyrics/g, '')
                    .replace(/\[.*?\]/g, '')
                    .replace(/\n\s*\n\s*\n/g, '\n\n')
                    .trim();

                return res.json({ lyrics });
            }
            return res.status(404).json({ error: "Lyrics not found on page" });
        }
        return res.status(404).json({ error: "Song not found" });
    } catch (error) {
        console.error("Error fetching lyrics:", error.message);
        let errorMessage = "Failed to fetch lyrics";
        let statusCode = 500;

        if (error.response) {
            if (error.response.status === 403) {
                errorMessage = "Access temporarily restricted. Retrying with different proxy...";
                statusCode = 403;
            } else if (error.response.status === 429) {
                errorMessage = "Too many requests. Please try again later.";
                statusCode = 429;
            }
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
