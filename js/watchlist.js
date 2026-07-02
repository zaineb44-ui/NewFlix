const container = document.getElementById("watchlistGrid");
const clearBtn = document.getElementById("clearWatchlistBtn");

async function loadWatchlist() {
  const user = getSession();
  let items = [];
  if (user) {
    try {
      const records = await getWatchlist(user.id);
      items = records.map(r => ({
        id: parseInt(r.fields.TmdbId),
        type: r.fields.Type,
        recordId: r.id
      }));
    } catch (e) {
      console.warn('Could not load watchlist from cloud, using local', e);
      items = JSON.parse(localStorage.getItem('watchlist')) || [];
    }
  } else {
    items = JSON.parse(localStorage.getItem('watchlist')) || [];
  }

  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = `<p class="watchlist-empty">Your watchlist is empty.</p>`;
    return;
  }

  for (const item of items) {
    try {
      const res = await fetch(`${API_URL}/${item.type}/${item.id}?api_key=${API_KEY}`);
      const data = await res.json();
      const card = document.createElement("div");
      card.className = "card watchlist-card";
      card.style.position = "relative";

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.innerHTML = '<i class="fas fa-times"></i>';
      delBtn.style.position = "absolute";
      delBtn.style.top = "10px";
      delBtn.style.right = "10px";
      delBtn.style.background = "rgba(255,0,0,0.7)";
      delBtn.style.border = "none";
      delBtn.style.borderRadius = "50%";
      delBtn.style.width = "30px";
      delBtn.style.height = "30px";
      delBtn.style.color = "#fff";
      delBtn.style.fontSize = "16px";
      delBtn.style.cursor = "pointer";
      delBtn.style.zIndex = "5";
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Remove "${data.title || data.name}" from watchlist?`)) {
          if (user) {
            try {
              // Find record ID if we have it
              if (item.recordId) {
                await deleteWatchlist(item.recordId);
              } else {
                const records = await getWatchlist(user.id);
                const found = records.find(r => r.fields.TmdbId === String(item.id) && r.fields.Type === item.type);
                if (found) await deleteWatchlist(found.id);
              }
            } catch (e) { console.warn('Could not delete from cloud', e); }
          }
          // Update local
          let local = JSON.parse(localStorage.getItem('watchlist')) || [];
          local = local.filter(w => !(w.id == item.id && w.type === item.type));
          localStorage.setItem('watchlist', JSON.stringify(local));
          loadWatchlist();
        }
      };
      card.appendChild(delBtn);

      const img = document.createElement("img");
      img.src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
      img.alt = data.title || data.name;
      card.appendChild(img);

      const info = document.createElement("div");
      info.className = "card-info";
      info.innerHTML = `<div class="card-title">${data.title || data.name}</div>`;
      card.appendChild(info);

      card.onclick = () => location.href = `details.html?id=${data.id}&type=${item.type}`;
      container.appendChild(card);
    } catch (e) {
      console.error(e);
    }
  }
}

clearBtn.addEventListener("click", async () => {
  if (confirm("Remove all items from watchlist?")) {
    const user = getSession();
    if (user) {
      try {
        const records = await getWatchlist(user.id);
        for (const rec of records) {
          await deleteWatchlist(rec.id);
        }
      } catch (e) { console.warn('Could not clear cloud watchlist', e); }
    }
    localStorage.setItem('watchlist', JSON.stringify([]));
    loadWatchlist();
  }
});

loadWatchlist();