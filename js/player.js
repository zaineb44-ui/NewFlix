const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const type = params.get("type");
const player = document.getElementById("player");
let currentSource = localStorage.getItem("preferredSource") || "vidfast";
let currentSeason = 1;
let currentEpisode = 1;

// Source buttons
document.querySelectorAll(".source-btn").forEach(btn => {
  if (btn.dataset.source === currentSource) btn.classList.add("active");
  btn.addEventListener("click", () => {
    currentSource = btn.dataset.source;
    localStorage.setItem("preferredSource", currentSource);
    document.querySelectorAll(".source-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadPlayer();
  });
});

async function loadInfo() {
  try {
    const res = await fetch(`${API_URL}/${type}/${id}?api_key=${API_KEY}`);
    const data = await res.json();
    document.getElementById("mediaTitle").innerText = data.title || data.name;
    document.getElementById("mediaOverview").innerText = data.overview;
    if (type === "tv") buildSeasons(data.seasons);
  } catch (e) { console.error(e); }
}

function buildPlayerURL() {
  if (type === "movie") {
    return currentSource === "vidfast"
      ? `https://vidfast.pro/movie/${id}?autoPlay=true`
      : `https://streamrip.fun/movie/${id}`;
  }
  return currentSource === "vidfast"
    ? `https://vidfast.pro/tv/${id}/${currentSeason}/${currentEpisode}?autoPlay=true`
    : `https://streamrip.fun/tv/${id}/${currentSeason}/${currentEpisode}`;
}

function loadPlayer() {
  const url = buildPlayerURL();
  document.getElementById("sourceStatus").innerHTML = `Source: <b>${currentSource}</b> – ${url}`;
  player.src = url;
  saveContinueWatching();
}

// ─── Save to multi‑item list ───
function saveContinueWatching() {
  let list = JSON.parse(localStorage.getItem('continueWatchingList')) || [];
  const newEntry = {
    id: id,
    type: type,
    season: currentSeason,
    episode: currentEpisode,
    timestamp: Date.now()
  };
  const existingIndex = list.findIndex(item => item.id == id && item.type === type);
  if (existingIndex > -1) {
    list[existingIndex] = newEntry;
  } else {
    list.push(newEntry);
  }
  localStorage.setItem('continueWatchingList', JSON.stringify(list));

  // Also keep a single‑entry version for compatibility with details.js
  localStorage.setItem('continueWatching', JSON.stringify(newEntry));
}

// ─── TV show helpers ───
async function buildSeasons(seasons) {
  document.getElementById("seasonSection").style.display = "block";
  const container = document.getElementById("seasonButtons");
  container.innerHTML = "";
  seasons.forEach(season => {
    if (season.season_number === 0) return;
    const btn = document.createElement("button");
    btn.innerText = `Season ${season.season_number}`;
    if (season.season_number === 1) btn.classList.add("active");
    btn.onclick = () => {
      document.querySelectorAll("#seasonButtons button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSeason = season.season_number;
      loadEpisodes(currentSeason);
    };
    container.appendChild(btn);
  });
  loadEpisodes(1);
}

async function loadEpisodes(season) {
  try {
    const res = await fetch(`${API_URL}/tv/${id}/season/${season}?api_key=${API_KEY}`);
    const data = await res.json();
    document.getElementById("episodeSection").style.display = "block";
    const container = document.getElementById("episodeButtons");
    container.innerHTML = "";
    data.episodes.forEach(ep => {
      const btn = document.createElement("button");
      btn.innerText = ep.episode_number;
      if (ep.episode_number === 1) btn.classList.add("active");
      btn.onclick = () => {
        document.querySelectorAll("#episodeButtons button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentEpisode = ep.episode_number;
        loadPlayer();
      };
      container.appendChild(btn);
    });
    currentEpisode = 1;
    loadPlayer();
  } catch (e) { console.error(e); }
}

loadInfo();