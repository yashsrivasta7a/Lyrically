const chatbot = document.createElement("div");
chatbot.id = "lyricsBot";
chatbot.innerHTML = `
<div id="lyricsHeader">
    🎵 Lyrically 🎵
    <button id="minimizeBtn">−</button>
</div>
<div id="lyricsContent">Loading lyrics...</div>
`;
document.body.appendChild(chatbot);

const minimizeBtn = document.getElementById("minimizeBtn");
const lyricsContent = document.getElementById("lyricsContent");
let isMinimized = false;

minimizeBtn.addEventListener("click", () => {
  isMinimized = !isMinimized;
  lyricsContent.style.display = isMinimized ? "none" : "flex";
  minimizeBtn.textContent = isMinimized ? "+" : "−";
  // chatbot.classList.toggle('minimized');
});

const songTitle = () => {
  const title = document.title
    .replace(" - YouTube", "")
    .replace(/^.*?\sx\s(.*?)\s*-/i, "$1 -") // keep only artist after 'x'
    .replace(/\s*\[[^\]]*\]/g, "") // remove content in square brackets
    .replace(/\s*\([^)]*\)/g, "") // remove content in parentheses
    .replace(/\s*(?:ft\.|feat\.|featuring).*$/i, "") // remove featuring artists
    .replace(
      /\s*-\s*(Live|Official|Music Video|Audio|Performance|One Night Only).*$/i,
      ""
    ) // remove video types
    .replace(/\s*[\/\\|]+.*$/g, "") // remove everything after /, \, or |
    .replace(/\s*\/\/.*$/g, "") // remove everything after //
    .replace(/\s*\b\d{4}\b/g, "") // remove 4-digit years
    .replace(/\s+/g, " ") // normalize spaces
    .trim();
  console.log(title);
  return title;
};

const fetchLyrics = async (song) => {
  try {
    const backendUrl = `https://lyrically-q758.onrender.com/lyrics?song=${encodeURIComponent(song)}`;
    console.log("Fetching lyrics for:", song);

    const response = await fetch(backendUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Origin': 'https://www.youtube.com'
      }
    });

    if (response.status === 403) {
      throw new Error("Access to lyrics API is restricted. Please try again later.");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch lyrics (${response.status})`);
    }

    const data = await response.json();
    console.log("Lyrics data received:", data);

    if (data.lyrics) {
      document.getElementById("lyricsContent").innerText = data.lyrics;
    } else {
      document.getElementById("lyricsContent").innerText = "Lyrics Not Found";
    }
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    document.getElementById("lyricsContent").innerText = 
      error.message === "Access to lyrics API is restricted. Please try again later."
        ? "Sorry, lyrics service is temporarily unavailable. Please try again later."
        : "Failed to load lyrics.";
  }
};

let currentSong = songTitle();
fetchLyrics(currentSong);

let lastTitle = document.title;
setInterval(() => {
  const newTitle = document.title;
  if (newTitle !== lastTitle) {
    lastTitle = newTitle;
    const newSong = songTitle();
    currentSong = newSong;
    document.getElementById("lyricsContent").innerText = "Loading lyrics...";
    console.log("new title :", currentSong);

    fetchLyrics(currentSong);
  }
}, 1000);
