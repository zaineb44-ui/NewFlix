const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const type = params.get("type");
const player = document.getElementById("player");
let currentSource = localStorage.getItem("preferredSource") || "vidfast";
let currentSeason = 1;
let currentEpisode = 1;

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
    if (type === "tv") {
      buildSeasons(data.seasons);
      document.getElementById("controlsWrapper").style.display = "flex";
    }
  } catch (e) { console.error(e); }
}

function buildPlayerURL() {
  if (type === "movie") {
    switch(currentSource) {
      case "vidfast": return `https://vidfast.pro/movie/${id}?autoPlay=true`;
      case "streamrip": return `https://streamrip.fun/movie/${id}`;
      case "2embed": return `https://www.2embed.cc/embed/movie/${id}`;
      case "multiembed": return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      default: return `https://vidfast.pro/movie/${id}?autoPlay=true`;
    }
  }
  switch(currentSource) {
    case "vidfast": return `https://vidfast.pro/tv/${id}/${currentSeason}/${currentEpisode}?autoPlay=true`;
    case "streamrip": return `https://streamrip.fun/tv/${id}/${currentSeason}/${currentEpisode}`;
    case "2embed": return `https://www.2embed.cc/embed/tv/${id}/${currentSeason}/${currentEpisode}`;
    case "multiembed": return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`;
    default: return `https://vidfast.pro/tv/${id}/${currentSeason}/${currentEpisode}?autoPlay=true`;
  }
}

function loadPlayer() {
  const url = buildPlayerURL();
  document.getElementById("sourceStatus").innerHTML = `Source: <b>${currentSource}</b> – ${url}`;
  player.src = url;
  saveContinueWatching();
}

async function saveContinueWatching() {
  const user = getSession();
  // Save to localStorage always
  let list = JSON.parse(localStorage.getItem('continueWatchingList')) || [];
  const newEntry = {
    id: id, type: type,
    season: currentSeason, episode: currentEpisode,
    timestamp: Date.now()
  };
  const existing = list.findIndex(item => item.id == id && item.type === type);
  if (existing > -1) list[existing] = newEntry;
  else list.push(newEntry);
  localStorage.setItem('continueWatchingList', JSON.stringify(list));
  localStorage.setItem('continueWatching', JSON.stringify(newEntry));

  // Save to Airtable if logged in
  if (user) {
    try {
      await addContinueWatching(user.id, id, type, currentSeason, currentEpisode);
    } catch (e) {
      console.warn('Could not save continue to cloud', e);
    }
  }
}

// ── TV show helpers ──
async function buildSeasons(seasons) {
  const seasonContainer = document.getElementById("seasonButtons");
  const episodeContainer = document.getElementById("episodeButtons");
  const episodeSection = document.getElementById("episodeSection");

  seasonContainer.innerHTML = "";
  const validSeasons = seasons.filter(s => s.season_number > 0);
  validSeasons.forEach(season => {
    const btn = document.createElement("button");
    btn.innerText = season.season_number;
    if (season.season_number === 1) btn.classList.add("active");
    btn.onclick = () => {
      document.querySelectorAll("#seasonButtons button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSeason = season.season_number;
      loadEpisodes(currentSeason);
    };
    seasonContainer.appendChild(btn);
  });
  if (validSeasons.length > 0) {
    loadEpisodes(1);
  } else {
    episodeSection.style.display = "none";
  }
}

async function loadEpisodes(season) {
  try {
    const res = await fetch(`${API_URL}/tv/${id}/season/${season}?api_key=${API_KEY}`);
    const data = await res.json();
    const episodeSection = document.getElementById("episodeSection");
    const container = document.getElementById("episodeButtons");
    container.innerHTML = "";
    episodeSection.style.display = "block";

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
  } catch (e) {
    console.error(e);
    document.getElementById("episodeSection").style.display = "none";
  }
}

loadInfo();