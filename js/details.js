const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const type = params.get("type");

const watchNowBtn = document.getElementById("watchNow");
const watchlistBtn = document.getElementById("watchlistBtn");
const trailerBtn = document.getElementById("trailerBtn");
const trailerModal = document.getElementById("trailerModal");
const trailerIframe = document.getElementById("trailerIframe");
const closeTrailer = document.getElementById("closeTrailer");
const youtubeFallbackLink = document.getElementById("youtubeFallbackLink");

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

// ── Rating badge & Parental Guidance data ──
const ratingData = {
  'G': {
    css: 'g',
    desc: 'Suitable for all ages. No objectionable content.',
    tags: []
  },
  'PG': {
    css: 'pg',
    desc: 'Parental guidance suggested. May contain mild violence, language, or brief nudity.',
    tags: ['Mild Violence', 'Mild Language']
  },
  'PG-13': {
    css: 'pg13',
    desc: 'Parents strongly cautioned. May contain intense violence, strong language, some sexual content, and drug use.',
    tags: ['Intense Violence', 'Strong Language', 'Some Sexual Content', 'Drug Use']
  },
  'R': {
    css: 'r',
    desc: 'Restricted – under 17 requires accompanying parent or adult guardian. Contains adult material such as violence, strong language, sexual content, and drug use.',
    tags: ['Violence', 'Strong Language', 'Sexual Content', 'Drug Use']
  },
  'NC-17': {
    css: 'nc17',
    desc: 'Adults only. Explicit content.',
    tags: ['Explicit Violence', 'Explicit Sexual Content', 'Strong Language']
  },
  'Unrated': {
    css: 'unrated',
    desc: 'No rating available. Viewer discretion advised.',
    tags: []
  }
};

function getRatingClass(rating) {
  if (!rating) return 'unrated';
  const r = rating.toUpperCase();
  if (r === 'G') return 'g';
  if (r === 'PG') return 'pg';
  if (r === 'PG-13') return 'pg13';
  if (r === 'R') return 'r';
  if (r === 'NC-17') return 'nc17';
  return 'unrated';
}

// ── Fetch rating (movie or TV) ──
async function fetchRating() {
  try {
    let rating = null;
    if (type === 'movie') {
      const res = await fetch(`${API_URL}/movie/${id}/release_dates?api_key=${API_KEY}`);
      const data = await res.json();
      const us = data.results.find(r => r.iso_3166_1 === 'US');
      if (us) {
        const cert = us.release_dates.find(d => d.certification && d.certification !== '');
        if (cert) rating = cert.certification;
      }
    } else if (type === 'tv') {
      const res = await fetch(`${API_URL}/tv/${id}/content_ratings?api_key=${API_KEY}`);
      const data = await res.json();
      const us = data.results.find(r => r.iso_3166_1 === 'US');
      if (us) rating = us.rating;
    }

    const safeRating = rating && ratingData[rating.toUpperCase()] ? rating.toUpperCase() : 'Unrated';
    const data = ratingData[safeRating] || ratingData['Unrated'];

    const badge = document.getElementById('ratingBadge');
    if (rating) {
      badge.textContent = rating;
      badge.className = 'rating-badge ' + getRatingClass(rating);
    } else {
      badge.textContent = 'Unrated';
      badge.className = 'rating-badge unrated';
    }

    const pgDiv = document.getElementById('parentalGuidance');
    const pgRating = document.getElementById('pgRating');
    const pgDesc = document.getElementById('pgDescription');
    const pgTags = document.getElementById('pgTags');

    pgRating.textContent = safeRating === 'Unrated' ? 'Unrated' : rating;
    pgRating.className = 'rating-badge ' + data.css;
    pgDesc.textContent = data.desc;
    pgTags.innerHTML = '';
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => {
        const span = document.createElement('span');
        span.textContent = tag;
        pgTags.appendChild(span);
      });
    } else {
      pgTags.innerHTML = '<span style="opacity:0.5;">No specific content descriptors</span>';
    }
    pgDiv.style.display = 'block';

  } catch (e) {
    console.error('Error fetching rating:', e);
    document.getElementById('parentalGuidance').style.display = 'none';
  }
}

// ── Fetch trailer (FIXED: youtube-nocookie + referrer is set in HTML) ──
async function fetchTrailer() {
  try {
    const res = await fetch(`${API_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    let video = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (!video) {
      video = data.results.find(v => v.type === 'Teaser' && v.site === 'YouTube');
    }
    if (!video) {
      video = data.results.find(v => v.site === 'YouTube');
    }
    if (video && video.key) {
      const key = video.key;
      trailerBtn.style.display = 'inline-flex';
      youtubeFallbackLink.href = `https://www.youtube.com/watch?v=${key}`;
      trailerBtn.onclick = () => {
        // Use youtube-nocookie.com to avoid cookie issues
        trailerIframe.src = `https://www.youtube-nocookie.com/embed/${key}?rel=0&modestbranding=1`;
        trailerModal.classList.add('show');
      };
    } else {
      trailerBtn.style.display = 'none';
    }
  } catch (e) {
    console.error('Error fetching trailer:', e);
    trailerBtn.style.display = 'none';
  }
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

    await Promise.all([fetchTrailer(), fetchRating()]);

  } catch (e) {
    console.error(e);
  }
}

// ── Close trailer ──
function closeTrailerModal() {
  trailerModal.classList.remove('show');
  trailerIframe.src = '';
}
closeTrailer.addEventListener('click', closeTrailerModal);
trailerModal.addEventListener('click', (e) => {
  if (e.target === trailerModal) {
    closeTrailerModal();
  }
});

loadDetails();