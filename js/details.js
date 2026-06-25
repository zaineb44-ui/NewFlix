const params =
new URLSearchParams(
window.location.search
);

const id =
params.get("id");

const type =
params.get("type");

async function loadDetails(){

    const res =
    await fetch(
        `${API_URL}/${type}/${id}?api_key=${API_KEY}`
    );

    const data =
    await res.json();

    document
    .getElementById("detailsPage")
    .style.backgroundImage =
    `url(${IMAGE_URL}${data.backdrop_path})`;

    document
    .getElementById("poster")
    .src =
    `${IMAGE_URL}${data.poster_path}`;

    document
    .getElementById("title")
    .innerText =
    data.title || data.name;

    document
    .getElementById("overview")
    .innerText =
    data.overview;

    document
    .getElementById("meta")
    .innerHTML =

    `
    ⭐ ${data.vote_average.toFixed(1)}
    ·
    ${data.release_date || data.first_air_date}
    `;

    document
    .getElementById("genres")
    .innerHTML =
    data.genres
    .map(g =>
        `<span>${g.name}</span>`
    )
    .join(" • ");

    document
    .getElementById("watchNow")
    .onclick=()=>{

        location.href=
        `player.html?id=${id}&type=${type}`;

    };
}

function addToWatchlist(){

    let watchlist =

    JSON.parse(
        localStorage.getItem(
            "watchlist"
        )
    ) || [];

    if(
        !watchlist.some(
            item =>
            item.id == id
        )
    ){

        watchlist.push({
            id,
            type
        });

        localStorage.setItem(
            "watchlist",
            JSON.stringify(
                watchlist
            )
        );

        alert(
            "Added to watchlist"
        );
    }
}

document
.getElementById(
"watchlistBtn"
)
.addEventListener(
"click",
addToWatchlist
);

loadDetails();