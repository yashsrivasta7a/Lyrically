const chatbot = document.createElement("div");
chatbot.id = "lyricsBot";
chatbot.innerHTML = `
<div id="lyricsHeader">🎵 Lyrically 🎵</div>
<div id="lyricsContent">Loading lyrics...</div>
`;
document.body.appendChild(chatbot);

const songTitle = () => {
	const title = document.title
		.replace(" - YouTube", "")
		.replace(/\(.*?\)/g, "")
		.trim();
		console.log(title);
	return title;
};

const fetchLyrics = async (song) => {
	try {
		const backendUrl = `http://localhost:3000/lyrics?song=${encodeURIComponent(song)}`;
		console.log(backendUrl);
		
		const response = await fetch(backendUrl);
		
		if (!response.ok) {
			throw new Error("Failed to fetch lyrics");
		}

		const data = await response.json();
		console.log(data);
		
		if (data.lyrics) {
			document.getElementById("lyricsContent").innerText = data.lyrics;
			console.log(data.lyrics);
			
		} else {
			document.getElementById("lyricsContent").innerText = "Lyrics Not Found";
		}
	} catch (error) {
		console.error("Error fetching lyrics:", error);
		document.getElementById("lyricsContent").innerText = "Failed to load lyrics.";
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
		console.log("new title :" ,currentSong);
		
		fetchLyrics(currentSong);
	}
}, 1000); 
