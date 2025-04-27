require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { JSDOM } = require("jsdom");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const GENIUS_ACCESS_TOKEN = process.env.Genius_Token;

// Rotating User-Agents to prevent blocking
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
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
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios(url, {
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
                timeout: 10000
            });
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await delay(1000 * (i + 1)); // Exponential backoff
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
            
            const lyricsPageResponse = await fetchWithRetry(lyricsPageUrl, {});
            const dom = new JSDOM(lyricsPageResponse.data);
            const document = dom.window.document;

            // Try multiple selector patterns to find lyrics
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
        const errorMessage = error.response?.status === 403 
            ? "Access temporarily restricted. Try again later."
            : "Failed to fetch lyrics";
        return res.status(error.response?.status || 500).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
