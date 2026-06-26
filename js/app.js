const trendingContainer = document.getElementById("trending");
const moviesContainer = document.getElementById("movies");
const tvContainer = document.getElementById("tv");
const topContainer = document.getElementById("toprated");

const hero = document.getElementById("hero");
let carouselInterval;
let currentSlide = 0;
let slidesData = [];

// ─── Create a card for rows ───
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
window.createCard = createCard;

// ─── Load hero carousel ───
async function loadHeroCarousel() {
  try {
    const data = await getTrending();
    // Take first 6 items
    slidesData = data.results.slice(0, 6);

    // Build carousel HTML
    const carouselHTML = `
      <div class="carousel-container">
        <div class="carousel-slides" id="carouselSlides">
          ${slidesData.map((item, index) => `
            <div class="carousel-slide" data-index="${index}" style="background-image: url('${IMAGE_URL}${item.backdrop_path}');">
              <div class="hero-overlay">
                <h1>${item.title || item.name}</h1>
                <p>${item.overview}</p>
                <button class="carousel-btn" data-id="${item.id}" data-type="${item.media_type}">
                  <i class="fas fa-play"></i> Watch Now
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Navigation arrows -->
        <button class="carousel-arrow left" id="carouselPrev"><i class="fas fa-chevron-left"></i></button>
        <button class="carousel-arrow right" id="carouselNext"><i class="fas fa-chevron-right"></i></button>

        <!-- Dots -->
        <div class="carousel-dots" id="carouselDots">
          ${slidesData.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
        </div>
      </div>
    `;

    hero.innerHTML = carouselHTML;

    // Add event listeners to buttons
    document.querySelectorAll('.carousel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        location.href = `details.html?id=${id}&type=${type}`;
      });
    });

    // Arrow click events
    document.getElementById('carouselPrev').addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentSlide - 1);
      resetAutoPlay();
    });
    document.getElementById('carouselNext').addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentSlide + 1);
      resetAutoPlay();
    });

    // Dot click events
    document.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        goToSlide(idx);
        resetAutoPlay();
      });
    });

    // Pause on hover
    hero.addEventListener('mouseenter', () => clearInterval(carouselInterval));
    hero.addEventListener('mouseleave', startAutoPlay);

    // Initial slide
    goToSlide(0);
    startAutoPlay();

  } catch (e) {
    console.error('Error loading carousel:', e);
    // Fallback: show a static message
    hero.innerHTML = `
      <div class="hero-overlay">
        <h1>Welcome to NewFlix</h1>
        <p>Discover the best movies and TV shows.</p>
        <button onclick="location.href='#trending'">Explore</button>
      </div>
    `;
  }
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.dot');
  const total = slides.length;
  if (total === 0) return;
  if (index < 0) index = total - 1;
  if (index >= total) index = 0;
  currentSlide = index;

  // Move slides
  const container = document.getElementById('carouselSlides');
  container.style.transform = `translateX(-${index * 100}%)`;

  // Update dots
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function startAutoPlay() {
  clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    goToSlide(currentSlide + 1);
  }, 5000);
}

function resetAutoPlay() {
  clearInterval(carouselInterval);
  startAutoPlay();
}

// ─── Load rows ───
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
loadHeroCarousel();
loadRows();

// ─── Continue Watching Row ───
async function loadContinueWatchingRow() {
  let list = JSON.parse(localStorage.getItem('continueWatchingList')) || [];
  if (list.length === 0) {
    const single = JSON.parse(localStorage.getItem('continueWatching'));
    if (!single) return;
    list = [single];
    localStorage.setItem('continueWatchingList', JSON.stringify(list));
  }

  const main = document.querySelector('main');
  const existing = document.getElementById('continueSection');
  if (existing) existing.remove();

  const section = document.createElement('section');
  section.id = 'continueSection';

  const heading = document.createElement('div');
  heading.style.display = 'flex';
  heading.style.alignItems = 'center';
  heading.style.justifyContent = 'space-between';
  heading.style.marginBottom = '20px';
  heading.innerHTML = `
    <h2 style="margin:0;"><i class="fas fa-clock"></i> Continue Watching</h2>
    <button id="clearContinueBtn" style="padding: 8px 18px; border: none; border-radius: 40px; background: rgba(255,0,0,0.15); color: #ff6b6b; cursor: pointer; font-weight: 500; transition: 0.3s; border: 1px solid rgba(255,0,0,0.1); font-size: 0.9rem;">
      <i class="fas fa-trash"></i> Clear All
    </button>
  `;
  section.appendChild(heading);

  const rowDiv = document.createElement('div');
  rowDiv.id = 'continueRow';
  rowDiv.className = 'row';
  section.appendChild(rowDiv);
  main.prepend(section);

  await renderContinueItems(list, rowDiv);

  document.getElementById('clearContinueBtn').addEventListener('click', function() {
    if (confirm('Remove all items from Continue Watching?')) {
      localStorage.removeItem('continueWatchingList');
      localStorage.removeItem('continueWatching');
      const section = document.getElementById('continueSection');
      if (section) section.style.display = 'none';
    }
  });
}

async function renderContinueItems(list, container) {
  container.innerHTML = '';
  list.sort((a, b) => b.timestamp - a.timestamp);

  for (const entry of list) {
    try {
      const res = await fetch(`${API_URL}/${entry.type}/${entry.id}?api_key=${API_KEY}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const card = document.createElement('div');
      card.className = 'card';
      card.style.position = 'relative';
      card.style.minWidth = '200px';

      const delBtn = document.createElement('button');
      delBtn.innerHTML = '<i class="fas fa-times"></i>';
      delBtn.style.position = 'absolute';
      delBtn.style.top = '8px';
      delBtn.style.right = '8px';
      delBtn.style.background = 'rgba(255,0,0,0.7)';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '50%';
      delBtn.style.width = '28px';
      delBtn.style.height = '28px';
      delBtn.style.color = '#fff';
      delBtn.style.fontSize = '14px';
      delBtn.style.cursor = 'pointer';
      delBtn.style.zIndex = '5';
      delBtn.style.transition = '0.3s';
      delBtn.onmouseover = () => delBtn.style.background = '#ff3333';
      delBtn.onmouseout = () => delBtn.style.background = 'rgba(255,0,0,0.7)';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Remove "${data.title || data.name}" from continue watching?`)) {
          let list = JSON.parse(localStorage.getItem('continueWatchingList')) || [];
          list = list.filter(item => !(item.id == entry.id && item.type === entry.type));
          localStorage.setItem('continueWatchingList', JSON.stringify(list));
          const single = JSON.parse(localStorage.getItem('continueWatching'));
          if (single && single.id == entry.id && single.type === entry.type) {
            localStorage.removeItem('continueWatching');
          }
          const row = document.getElementById('continueRow');
          renderContinueItems(list, row);
          if (list.length === 0) {
            const section = document.getElementById('continueSection');
            if (section) section.style.display = 'none';
          }
        }
      };
      card.appendChild(delBtn);

      const img = document.createElement('img');
      img.src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
      img.alt = data.title || data.name;
      img.style.width = '100%';
      img.style.height = '310px';
      img.style.objectFit = 'cover';
      img.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
      card.appendChild(img);

      const info = document.createElement('div');
      info.className = 'card-info';
      info.innerHTML = `
        <div class="card-title">${data.title || data.name}</div>
        ${entry.type === 'tv' ? `<p>Season ${entry.season} · Episode ${entry.episode}</p>` : ''}
      `;
      card.appendChild(info);

      card.onclick = () => location.href = `details.html?id=${data.id}&type=${entry.type}`;
      container.appendChild(card);
    } catch (e) {
      console.error('Error loading continue item:', e);
    }
  }
}

loadContinueWatchingRow();