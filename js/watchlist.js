const container =
document.getElementById(
"watchlistGrid"
);

async function loadWatchlist(){

    const list =

    JSON.parse(
        localStorage.getItem(
            "watchlist"
        )
    ) || [];

    for(const item of list){

        const res =
        await fetch(

`${API_URL}/${item.type}/${item.id}?api_key=${API_KEY}`

        );

        const data =
        await res.json();

        const card =
        document.createElement(
            "div"
        );

        card.className =
        "card";

        card.innerHTML=`

        <img
        src="https://image.tmdb.org/t/p/w500${data.poster_path}"
        >

        <div class="card-info">

        <div class="card-title">

        ${data.title || data.name}

        </div>

        </div>

        `;

        card.onclick=()=>{

            location.href=
            `details.html?id=${data.id}&type=${item.type}`;

        };

        container.appendChild(
            card
        );
    }
}

loadWatchlist();