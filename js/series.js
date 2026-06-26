// js/series.js
const grid = document.getElementById('seriesGrid');
const loadBtn = document.getElementById('loadMoreBtn');
const genreSelect = document.getElementById('genreFilter');
const yearSelect = document.getElementById('yearFilter');
const resetBtn = document.getElementById('resetFiltersBtn');

let currentPage = 1;
let isLoading = false;
let totalPages = 1;
let currentFilters = { genre: '', year: '' };

// ─── Populate genre dropdown (TV genres) ───
async function loadGenres() {
  try {
    const res = await fetch(`${API_URL}/genre/tv/list?api_key=${API_KEY}`);
    const data = await res.json();
    data.genres.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      genreSelect.appendChild(opt);
    });
  } catch (e) {
    console.error('Failed to load genres:', e);
  }
}

// ─── Populate year dropdown ───
function populateYears() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1900; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

function createSeriesCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.name}">
    <div class="card-info">
      <div class="card-title">${item.name}</div>
      <p>${item.first_air_date ? item.first_air_date.split('-')[0] : ''}</p>
    </div>
  `;
  card.onclick = () => location.href = `details.html?id=${item.id}&type=tv`;
  return card;
}

function buildUrl(page) {
  let url = `${API_URL}/discover/tv?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc`;
  if (currentFilters.genre) url += `&with_genres=${currentFilters.genre}`;
  if (currentFilters.year) url += `&first_air_date_year=${currentFilters.year}`;
  return url;
}

async function loadSeries(page, append = true) {
  if (isLoading || (page > totalPages && totalPages !== 1)) return;
  isLoading = true;
  loadBtn.disabled = true;
  loadBtn.textContent = 'Loading…';

  try {
    const url = buildUrl(page);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    totalPages = data.total_pages;
    if (data.results.length === 0) {
      if (!append) grid.innerHTML = '';
      grid.innerHTML = `<div class="empty-message"><i class="fas fa-frown"></i> No series found with these filters.</div>`;
      loadBtn.style.display = 'none';
      return;
    }

    if (!append) grid.innerHTML = '';
    data.results.forEach(item => {
      if (item.poster_path) {
        grid.appendChild(createSeriesCard(item));
      }
    });

    currentPage = page;
    if (currentPage >= totalPages) {
      loadBtn.style.display = 'none';
    } else {
      loadBtn.style.display = 'block';
      loadBtn.textContent = 'Load More';
      loadBtn.disabled = false;
    }
  } catch (err) {
    console.error('Series load error:', err);
    loadBtn.textContent = 'Error loading. Check console or try again.';
    loadBtn.disabled = false;
    if (grid.children.length === 0) {
      grid.innerHTML = `<div class="empty-message"><i class="fas fa-exclamation-triangle"></i> Could not load series. Please refresh or try again later.</div>`;
    }
  }
  isLoading = false;
}

function applyFilters() {
  currentFilters.genre = genreSelect.value;
  currentFilters.year = yearSelect.value;
  currentPage = 1;
  totalPages = 1;
  loadSeries(1, false);
}

function resetFilters() {
  genreSelect.value = '';
  yearSelect.value = '';
  currentFilters = { genre: '', year: '' };
  currentPage = 1;
  totalPages = 1;
  loadSeries(1, false);
}

genreSelect.addEventListener('change', applyFilters);
yearSelect.addEventListener('change', applyFilters);
resetBtn.addEventListener('click', resetFilters);
loadBtn.addEventListener('click', () => {
  loadSeries(currentPage + 1, true);
});

populateYears();
loadGenres().then(() => loadSeries(1, false));