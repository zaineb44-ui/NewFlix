const container = document.getElementById("continueCard");
const clearBtn = document.getElementById("clearHistoryBtn");

function getContinueList() {
  return JSON.parse(localStorage.getItem('continueWatchingList')) || [];
}
function saveContinueList(list) {
  localStorage.setItem('continueWatchingList', JSON.stringify(list));
}

function clearAllHistory() {
  if (confirm("Clear all continue watching history?")) {
    saveContinueList([]);
    renderList();
  }
}

function removeItem(id, type) {
  if (confirm("Remove this item from continue watching?")) {
    let list = getContinueList();
    list = list.filter(item => !(item.id == id && item.type === type));
    saveContinueList(list);
    renderList();
  }
}

async function renderList() {
  const list = getContinueList();
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = `<p class="empty-history">No history to continue.</p>`;
    return;
  }

  // Newest first
  list.sort((a, b) => b.timestamp - a.timestamp);

  for (const entry of list) {
    try {
      const res = await fetch(`${API_URL}/${entry.type}/${entry.id}?api_key=${API_KEY}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      const wrapper = document.createElement("div");
      wrapper.className = "continue-card-wrapper";
      wrapper.style.position = "relative";
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = "500px";
      wrapper.style.marginBottom = "20px";

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-continue-btn";
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.style.position = "absolute";
      removeBtn.style.top = "10px";
      removeBtn.style.right = "10px";
      removeBtn.style.background = "rgba(255,0,0,0.7)";
      removeBtn.style.border = "none";
      removeBtn.style.borderRadius = "50%";
      removeBtn.style.width = "32px";
      removeBtn.style.height = "32px";
      removeBtn.style.color = "#fff";
      removeBtn.style.fontSize = "16px";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.zIndex = "5";
      removeBtn.style.transition = "0.3s";
      removeBtn.onmouseover = () => removeBtn.style.background = "#ff3333";
      removeBtn.onmouseout = () => removeBtn.style.background = "rgba(255,0,0,0.7)";
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeItem(entry.id, entry.type);
      };
      wrapper.appendChild(removeBtn);

      // Card
      const card = document.createElement("div");
      card.className = "card";
      card.style.display = "flex";
      card.style.gap = "20px";
      card.style.alignItems = "center";
      card.style.padding = "20px";
      card.style.background = "rgba(255,255,255,0.05)";
      card.style.backdropFilter = "blur(12px)";
      card.style.borderRadius = "20px";
      card.style.border = "1px solid rgba(255,255,255,0.06)";
      card.style.width = "100%";

      const img = document.createElement("img");
      img.src = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '';
      img.alt = data.title || data.name || "Unknown";
      img.style.width = "140px";
      img.style.height = "200px";
      img.style.borderRadius = "12px";
      img.style.objectFit = "cover";
      img.style.flexShrink = "0";
      if (!data.poster_path) {
        img.style.background = "#222";
        img.style.display = "flex";
        img.style.alignItems = "center";
        img.style.justifyContent = "center";
        img.style.color = "#777";
        img.style.fontSize = "14px";
        img.alt = "No poster";
      }
      card.appendChild(img);

      const info = document.createElement("div");
      info.className = "card-info";
      info.style.flex = "1";

      const title = document.createElement("h2");
      title.innerText = data.title || data.name || "Untitled";
      title.style.fontSize = "1.4rem";
      title.style.marginBottom = "8px";
      info.appendChild(title);

      if (entry.type === "tv") {
        const seasonEp = document.createElement("p");
        seasonEp.innerText = `Season ${entry.season} · Episode ${entry.episode}`;
        seasonEp.style.opacity = "0.7";
        seasonEp.style.marginBottom = "12px";
        info.appendChild(seasonEp);
      } else {
        const runtime = document.createElement("p");
        runtime.innerText = data.runtime ? `${data.runtime} min` : "Movie";
        runtime.style.opacity = "0.7";
        runtime.style.marginBottom = "12px";
        info.appendChild(runtime);
      }

      const resumeBtn = document.createElement("button");
      resumeBtn.innerHTML = `<i class="fas fa-play"></i> Resume`;
      resumeBtn.style.padding = "8px 20px";
      resumeBtn.style.border = "none";
      resumeBtn.style.borderRadius = "40px";
      resumeBtn.style.background = "#00d4ff";
      resumeBtn.style.color = "#000";
      resumeBtn.style.fontWeight = "600";
      resumeBtn.style.cursor = "pointer";
      resumeBtn.style.transition = "0.3s";
      resumeBtn.onmouseover = () => resumeBtn.style.boxShadow = "0 0 20px rgba(0,212,255,0.3)";
      resumeBtn.onmouseout = () => resumeBtn.style.boxShadow = "none";
      resumeBtn.onclick = () => {
        // Store the single‑entry version so player.js picks it up
        const single = { id: entry.id, type: entry.type, season: entry.season, episode: entry.episode };
        localStorage.setItem('continueWatching', JSON.stringify(single));
        location.href = `player.html?id=${entry.id}&type=${entry.type}`;
      };
      info.appendChild(resumeBtn);

      card.appendChild(info);
      wrapper.appendChild(card);
      container.appendChild(wrapper);

    } catch (error) {
      console.error("Error loading continue item:", error);
      const fallback = document.createElement("div");
      fallback.style.padding = "15px";
      fallback.style.background = "rgba(255,0,0,0.05)";
      fallback.style.borderRadius = "12px";
      fallback.style.marginBottom = "10px";
      fallback.innerText = `Could not load ${entry.type} with ID ${entry.id}`;
      container.appendChild(fallback);
    }
  }
}

clearBtn.addEventListener("click", clearAllHistory);
renderList();