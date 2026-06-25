const container = document.getElementById("watchlistGrid");
const clearBtn = document.getElementById("clearWatchlistBtn");

function getWatchlist() {
  return JSON.parse(localStorage.getItem("watchlist")) || [];
}
function saveWatchlist(list) {
  localStorage.setItem("watchlist", JSON.stringify(list));
}

async function loadWatchlist() {
  const list = getWatchlist();
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = `<p class="watchlist-empty">Your watchlist is empty.</p>`;
    return;
  }
  for (const item of list) {
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
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Remove "${data.title || data.name}" from watchlist?`)) {
          const updated = getWatchlist().filter(w => !(w.id == item.id && w.type === item.type));
          saveWatchlist(updated);
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

clearBtn.addEventListener("click", () => {
  if (confirm("Remove all items from watchlist?")) {
    saveWatchlist([]);
    loadWatchlist();
  }
});

loadWatchlist();