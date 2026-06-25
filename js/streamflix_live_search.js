const searchInput = document.getElementById('searchInput');
let searchTimeout;

function createCardFallback(item, type) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}">
    <div class="card-info">
      <div class="card-title">${item.title || item.name}</div>
    </div>
  `;
  card.onclick = () => location.href = `details.html?id=${item.id}&type=${type}`;
  return card;
}

const cardMaker = (typeof createCard !== 'undefined') ? createCard : createCardFallback;

async function searchMulti(query) {
  const url = `${API_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Search failed:', e);
    return { results: [] };
  }
}

function displaySearchResults(results) {
  const hero = document.getElementById('hero');
  if (hero) hero.style.display = 'none';

  let searchSection = document.getElementById('searchSection');
  if (!searchSection) {
    searchSection = document.createElement('section');
    searchSection.id = 'searchSection';
    searchSection.style.marginTop = '20px';
    searchSection.innerHTML = `
      <h2 style="font-size:2rem;margin-bottom:20px;">
        <i class="fas fa-search" style="color:#00d4ff;"></i> Search Results
      </h2>
      <div id="searchResults" class="row"></div>
    `;
    const main = document.querySelector('main');
    main.prepend(searchSection);
  }
  const container = document.getElementById('searchResults');
  container.innerHTML = '';

  document.querySelectorAll('main section:not(#searchSection)').forEach(sec => sec.style.display = 'none');
  searchSection.style.display = 'block';

  let count = 0;
  results.forEach(item => {
    if (item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv')) {
      const card = cardMaker(item, item.media_type);
      container.appendChild(card);
      count++;
    }
  });
  if (count === 0) {
    container.innerHTML = `<p style="padding:20px;color:#777;font-size:1.2rem;">No results found</p>`;
  }
}

function hideSearchResults() {
  const hero = document.getElementById('hero');
  if (hero) hero.style.display = 'flex';
  const searchSection = document.getElementById('searchSection');
  if (searchSection) searchSection.style.display = 'none';
  document.querySelectorAll('main section:not(#searchSection)').forEach(sec => sec.style.display = 'block');
}

searchInput.addEventListener('input', function() {
  clearTimeout(searchTimeout);
  const query = this.value.trim();
  if (query.length === 0) {
    hideSearchResults();
    return;
  }
  searchTimeout = setTimeout(async () => {
    const data = await searchMulti(query);
    displaySearchResults(data.results);
  }, 300);
});