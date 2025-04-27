const GENIUS_ACCESS_TOKEN =
  "";

const chatbot = document.createElement("div");
chatbot.id = "lyricsBot";
chatbot.innerHTML = `
<div id="lyricsHeader">🎵 Lyrics 🎵</div>
<div id="lyricsContent">Loading lyrics...</div>
`;
document.body.appendChild(chatbot);

const songTitle = () => {
  const title = document.title
    .replace(" - YouTube", "")
    .replace(/\(.*?\)/g, "")
    .trim();
  console.log("Song Title:", title);
  return title;
};

const song = songTitle();

const fetchLyrics = async (song) => {
  try {
    const geniusApiUrl = `https://api.genius.com/search?q=${encodeURIComponent(
      song
    )}`;
    const response = await fetch( geniusApiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
      },
    });

   
    const data = await response.json();
    console.log("Response:", data);

    const hits = data.response.hits;
    if (hits.length > 0) {
      const songPath = hits[0].result.path;
      const lyricsPage = `https://genius.com${songPath}`;
      await scrappingGenius(lyricsPage);
    } else {
      document.getElementById("lyricsContent").innerText = "Lyrics Not Found";
    }
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    document.getElementById("lyricsContent").innerText =
      "Failed to load lyrics.";
  }
};

const scrappingGenius = async (url) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser(); // DOM parser
    const doc = parser.parseFromString(html, "text/html"); // Parse HTML string into DOM object

    const lyricsContainer = doc.querySelector(
      ".Lyrics__Container-sc-78fb6627-1.hiRbsH"
    );

    if (lyricsContainer) {
      const lyrics = lyricsContainer.querySelector("p").innerText;
      const removeFaltu = lyrics.replace(/\n+/g, "\n").trim();
      document.getElementById("lyricsContent").innerText = removeFaltu;
    } else {
      document.getElementById("lyricsContent").innerText = "Lyrics not found";
    }
  } catch (error) {
    console.error("Error scraping Genius:", error);
    document.getElementById("lyricsContent").innerText =
      "Failed to load lyrics.";
  }
};

fetchLyrics(song);