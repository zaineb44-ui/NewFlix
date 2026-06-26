// js/movies.js
const grid = document.getElementById('movieGrid');
const loadBtn = document.getElementById('loadMoreBtn');
const genreSelect = document.getElementById('genreFilter');
const yearSelect = document.getElementById('yearFilter');
const resetBtn = document.getElementById('resetFiltersBtn');

let currentPage = 1;
let isLoading = false;
let totalPages = 1;
let currentFilters = { genre: '', year: '' };

// ─── Populate genre dropdown ───
async function loadGenres() {
  try {
    const res = await fetch(`${API_URL}/genre/movie/list?api_key=${API_KEY}`);
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

// ─── Populate year dropdown (1900 - current) ───
function populateYears() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1900; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

// ─── Card creator ───
function createMovieCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title}">
    <div class="card-info">
      <div class="card-title">${item.title}</div>
      <p>${item.release_date ? item.release_date.split('-')[0] : ''}</p>
    </div>
  `;
  card.onclick = () => location.href = `details.html?id=${item.id}&type=movie`;
  return card;
}

// ─── Build API URL with filters ───
function buildUrl(page) {
  let url = `${API_URL}/discover/movie?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc`;
  if (currentFilters.genre) url += `&with_genres=${currentFilters.genre}`;
  if (currentFilters.year) url += `&primary_release_year=${currentFilters.year}`;
  return url;
}

// ─── Load movies ───
async function loadMovies(page, append = true) {
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
      grid.innerHTML = `<div class="empty-message"><i class="fas fa-frown"></i> No movies found with these filters.</div>`;
      loadBtn.style.display = 'none';
      return;
    }

    if (!append) grid.innerHTML = '';
    data.results.forEach(item => {
      if (item.poster_path) {
        grid.appendChild(createMovieCard(item));
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
    console.error('Movies load error:', err);
    loadBtn.textContent = 'Error loading. Check console or try again.';
    loadBtn.disabled = false;
    if (grid.children.length === 0) {
      grid.innerHTML = `<div class="empty-message"><i class="fas fa-exclamation-triangle"></i> Could not load movies. Please refresh or try again later.</div>`;
    }
  }
  isLoading = false;
}

// ─── Apply filters and reset ───
function applyFilters() {
  currentFilters.genre = genreSelect.value;
  currentFilters.year = yearSelect.value;
  currentPage = 1;
  totalPages = 1;
  loadMovies(1, false);
}

function resetFilters() {
  genreSelect.value = '';
  yearSelect.value = '';
  currentFilters = { genre: '', year: '' };
  currentPage = 1;
  totalPages = 1;
  loadMovies(1, false);
}

// ─── Event listeners ───
genreSelect.addEventListener('change', applyFilters);
yearSelect.addEventListener('change', applyFilters);
resetBtn.addEventListener('click', resetFilters);
loadBtn.addEventListener('click', () => {
  loadMovies(currentPage + 1, true);
});

// ─── Init ───
populateYears();
loadGenres().then(() => loadMovies(1, false));