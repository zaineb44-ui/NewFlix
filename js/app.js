const trendingContainer = document.getElementById("trending");
const moviesContainer = document.getElementById("movies");
const tvContainer = document.getElementById("tv");
const topContainer = document.getElementById("toprated");
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("heroTitle");
const heroOverview = document.getElementById("heroOverview");

function createCard(item, type) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img src="https://image.tmdb.org/t/p/w500${item.poster_path}" alt="${item.title || item.name}">
    <div class="card-info">
      <div class="card-title">${item.title || item.name}</div>
      <p>${item.release_date || item.first_air_date || ''}</p>
    </div>
  `;
  card.onclick = () => location.href = `details.html?id=${item.id}&type=${type}`;
  return card;
}
// Make it globally accessible for search
window.createCard = createCard;

async function loadHero() {
  const data = await getTrending();
  const heroMovie = data.results[0];
  hero.style.backgroundImage = `url(${IMAGE_URL}${heroMovie.backdrop_path})`;
  heroTitle.innerText = heroMovie.title || heroMovie.name;
  heroOverview.innerText = heroMovie.overview;
  document.getElementById("watchHero").onclick = () => {
    location.href = `details.html?id=${heroMovie.id}&type=${heroMovie.media_type}`;
  };
}

async function loadRows() {
  const sections = [
    { id: 'trending', data: await getTrending(), type: 'media_type' },
    { id: 'movies', data: await getMovies(), type: 'movie' },
    { id: 'tv', data: await getTV(), type: 'tv' },
    { id: 'toprated', data: await getTopRated(), type: 'movie' }
  ];
  sections.forEach(({ id, data, type }) => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    data.results.forEach(item => {
      container.appendChild(createCard(item, item.media_type || type));
    });
  });
}

// Create sections dynamically if they don't exist
function createSections() {
  const main = document.querySelector('main');
  const sectionData = [
    { id: 'trending', title: '🔥 Trending' },
    { id: 'movies', title: '🎬 Popular Movies' },
    { id: 'tv', title: '📺 Popular TV Shows' },
    { id: 'toprated', title: '⭐ Top Rated' }
  ];
  sectionData.forEach(({ id, title }) => {
    if (!document.getElementById(id)) {
      const section = document.createElement('section');
      section.innerHTML = `<h2>${title}</h2><div id="${id}" class="row"></div>`;
      main.appendChild(section);
    }
  });
}

createSections();
loadHero();
loadRows();

// Continue Watching row (added after main sections)
async function loadContinueWatchingRow() {
  const data = JSON.parse(localStorage.getItem("continueWatching"));
  if (!data) return;
  const main = document.querySelector('main');
  const section = document.createElement('section');
  section.id = 'continueSection';
  section.innerHTML = `<h2><i class="fas fa-clock"></i> Continue Watching</h2><div id="continueRow" class="row"></div>`;
  main.prepend(section);

  try {
    const res = await fetch(`${API_URL}/${data.type}/${data.id}?api_key=${API_KEY}`);
    const movie = await res.json();
    const card = createCard(movie, data.type);
    document.getElementById("continueRow").appendChild(card);
  } catch (e) { console.error(e); }
}
loadContinueWatchingRow();