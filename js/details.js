const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const type = params.get("type");

const watchNowBtn = document.getElementById("watchNow");
const watchlistBtn = document.getElementById("watchlistBtn");

// ── Helpers ──
function getWatchlist() {
  return JSON.parse(localStorage.getItem("watchlist")) || [];
}
function saveWatchlist(list) {
  localStorage.setItem("watchlist", JSON.stringify(list));
}
function getContinueList() {
  return JSON.parse(localStorage.getItem('continueWatchingList')) || [];
}
function saveContinueList(list) {
  localStorage.setItem('continueWatchingList', JSON.stringify(list));
}

function isInWatchlist() {
  return getWatchlist().some(item => item.id == id && item.type === type);
}
function isInContinue() {
  return getContinueList().some(item => item.id == id && item.type === type);
}

function updateWatchlistButton() {
  if (isInWatchlist()) {
    watchlistBtn.innerHTML = '<i class="fas fa-check"></i> In Watchlist';
    watchlistBtn.classList.add("in-watchlist");
  } else {
    watchlistBtn.innerHTML = '<i class="fas fa-plus"></i> Watchlist';
    watchlistBtn.classList.remove("in-watchlist");
  }
}
function updateWatchNowButton() {
  if (isInContinue()) {
    watchNowBtn.innerHTML = '<i class="fas fa-play"></i> Continue Watching';
  } else {
    watchNowBtn.innerHTML = '<i class="fas fa-play"></i> Watch Now';
  }
}

function toggleWatchlist() {
  let list = getWatchlist();
  const idx = list.findIndex(item => item.id == id && item.type === type);
  if (idx > -1) {
    list.splice(idx, 1);
    saveWatchlist(list);
    alert("Removed from watchlist");
  } else {
    list.push({ id, type });
    saveWatchlist(list);
    alert("Added to watchlist");
  }
  updateWatchlistButton();
}

// ── Load details ──
async function loadDetails() {
  try {
    const res = await fetch(`${API_URL}/${type}/${id}?api_key=${API_KEY}`);
    const data = await res.json();

    document.getElementById("detailsPage").style.backgroundImage =
      `url(${IMAGE_URL}${data.backdrop_path})`;
    document.getElementById("poster").src = `${IMAGE_URL}${data.poster_path}`;
    document.getElementById("title").innerText = data.title || data.name;
    document.getElementById("overview").innerText = data.overview;
    document.getElementById("meta").innerHTML = `
      <span><i class="fas fa-star" style="color:#f5c518;"></i> ${data.vote_average.toFixed(1)}</span>
      <span>${data.release_date || data.first_air_date || 'Unknown'}</span>
      ${data.runtime ? `<span>${data.runtime} min</span>` : ''}
    `;
    document.getElementById("genres").innerHTML = data.genres.map(g => `<span>${g.name}</span>`).join('');

    updateWatchlistButton();
    updateWatchNowButton();

    // ── Watch Now / Continue ──
    watchNowBtn.onclick = () => {
      if (!isInContinue()) {
        let list = getContinueList();
        const newEntry = {
          id: id,
          type: type,
          season: 1,
          episode: 1,
          timestamp: Date.now()
        };
        list.push(newEntry);
        saveContinueList(list);
        localStorage.setItem('continueWatching', JSON.stringify(newEntry));
        updateWatchNowButton();
      }
      location.href = `player.html?id=${id}&type=${type}`;
    };

    watchlistBtn.onclick = toggleWatchlist;

  } catch (e) {
    console.error(e);
  }
}

loadDetails();