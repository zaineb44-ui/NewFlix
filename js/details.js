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

// ── Helpers (now with Airtable) ──
async function isInWatchlist(userId, tmdbId, type) {
  try {
    const records = await getWatchlist(userId);
    return records.some(r => r.fields.TmdbId === String(tmdbId) && r.fields.Type === type);
  } catch { return false; }
}

async function isInContinue(userId, tmdbId, type) {
  try {
    const records = await getContinueWatching(userId);
    return records.some(r => r.fields.TmdbId === String(tmdbId) && r.fields.Type === type);
  } catch { return false; }
}

async function updateWatchlistButton() {
  const user = getSession();
  if (!user) {
    watchlistBtn.innerHTML = '<i class="fas fa-plus"></i> Watchlist';
    watchlistBtn.classList.remove('in-watchlist');
    return;
  }
  const inList = await isInWatchlist(user.id, id, type);
  if (inList) {
    watchlistBtn.innerHTML = '<i class="fas fa-check"></i> In Watchlist';
    watchlistBtn.classList.add('in-watchlist');
  } else {
    watchlistBtn.innerHTML = '<i class="fas fa-plus"></i> Watchlist';
    watchlistBtn.classList.remove('in-watchlist');
  }
}

async function updateWatchNowButton() {
  const user = getSession();
  if (!user) {
    watchNowBtn.innerHTML = '<i class="fas fa-play"></i> Watch Now';
    return;
  }
  const inCont = await isInContinue(user.id, id, type);
  if (inCont) {
    watchNowBtn.innerHTML = '<i class="fas fa-play"></i> Continue Watching';
  } else {
    watchNowBtn.innerHTML = '<i class="fas fa-play"></i> Watch Now';
  }
}

async function toggleWatchlist() {
  const user = getSession();
  if (!user) {
    alert('Please sign in to manage your watchlist.');
    return;
  }
  try {
    const inList = await isInWatchlist(user.id, id, type);
    if (inList) {
      // Find record and delete
      const records = await getWatchlist(user.id);
      const found = records.find(r => r.fields.TmdbId === String(id) && r.fields.Type === type);
      if (found) {
        await deleteWatchlist(found.id);
        alert('Removed from watchlist');
      }
    } else {
      await addWatchlist(user.id, id, type);
      alert('Added to watchlist');
    }
    await updateWatchlistButton();
  } catch (e) {
    console.error(e);
    alert('Error updating watchlist. Please try again.');
  }
}

// ── Rating badge & Parental Guidance (unchanged) ──
const ratingData = {
  'G': { css: 'g', desc: 'Suitable for all ages.', tags: [] },
  'PG': { css: 'pg', desc: 'Parental guidance suggested.', tags: ['Mild Violence', 'Mild Language'] },
  'PG-13': { css: 'pg13', desc: 'Parents strongly cautioned.', tags: ['Intense Violence', 'Strong Language', 'Some Sexual Content', 'Drug Use'] },
  'R': { css: 'r', desc: 'Restricted – under 17 requires adult.', tags: ['Violence', 'Strong Language', 'Sexual Content', 'Drug Use'] },
  'NC-17': { css: 'nc17', desc: 'Adults only.', tags: ['Explicit Violence', 'Explicit Sexual Content', 'Strong Language'] },
  'Unrated': { css: 'unrated', desc: 'No rating available.', tags: [] }
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

async function fetchTrailer() {
  try {
    const res = await fetch(`${API_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    let video = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (!video) video = data.results.find(v => v.type === 'Teaser' && v.site === 'YouTube');
    if (!video) video = data.results.find(v => v.site === 'YouTube');
    if (video && video.key) {
      const key = video.key;
      trailerBtn.style.display = 'inline-flex';
      youtubeFallbackLink.href = `https://www.youtube.com/watch?v=${key}`;
      trailerBtn.onclick = () => {
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

    await updateWatchlistButton();
    await updateWatchNowButton();

    watchNowBtn.onclick = async () => {
      const user = getSession();
      if (!user) {
        alert('Please sign in to save your progress.');
        window.location.href = 'signin.html';
        return;
      }
      // Add to continue watching in Airtable
      try {
        await addContinueWatching(user.id, id, type, 1, 1);
        // Also update local storage for offline
        let list = JSON.parse(localStorage.getItem('continueWatchingList')) || [];
        const newEntry = { id: id, type: type, season: 1, episode: 1, timestamp: Date.now() };
        const existing = list.findIndex(item => item.id == id && item.type === type);
        if (existing > -1) list[existing] = newEntry;
        else list.push(newEntry);
        localStorage.setItem('continueWatchingList', JSON.stringify(list));
        localStorage.setItem('continueWatching', JSON.stringify(newEntry));
        await updateWatchNowButton();
      } catch (e) {
        console.warn('Could not save to cloud, but continuing.', e);
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