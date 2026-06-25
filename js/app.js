const trendingContainer=document.getElementById("trending");
const moviesContainer=document.getElementById("movies");
const tvContainer=document.getElementById("tv");
const topContainer=document.getElementById("toprated");

const hero=document.getElementById("hero");
const heroTitle=document.getElementById("heroTitle");
const heroOverview=document.getElementById("heroOverview");

function createCard(item,type){

    const card=document.createElement("div");

    card.className="card";

    card.innerHTML=`

        <img src="https://image.tmdb.org/t/p/w500${item.poster_path}">

        <div class="card-info">

            <div class="card-title">
                ${item.title || item.name}
            </div>

        </div>

    `;

    card.onclick=()=>{

        location.href=
        `details.html?id=${item.id}&type=${type}`;

    };

    return card;
}

async function loadHero(){

    const data=await getTrending();

    const heroMovie=data.results[0];

    hero.style.backgroundImage=
    `url(${IMAGE_URL}${heroMovie.backdrop_path})`;

    heroTitle.innerText=
    heroMovie.title || heroMovie.name;

    heroOverview.innerText=
    heroMovie.overview;

    document
    .getElementById("watchHero")
    .onclick=()=>{

        location.href=
        `details.html?id=${heroMovie.id}&type=${heroMovie.media_type}`;

    };
}

async function loadRows(){

    const trending=await getTrending();

    trending.results.forEach(item=>{

        trendingContainer.appendChild(
            createCard(
                item,
                item.media_type
            )
        );

    });

    const movies=await getMovies();

    movies.results.forEach(item=>{

        moviesContainer.appendChild(
            createCard(item,"movie")
        );

    });

    const tv=await getTV();

    tv.results.forEach(item=>{

        tvContainer.appendChild(
            createCard(item,"tv")
        );

    });

    const top=await getTopRated();

    top.results.forEach(item=>{

        topContainer.appendChild(
            createCard(item,"movie")
        );

    });
}

loadHero();
loadRows();
loadContinueWatchingRow();
async function loadContinueWatchingRow(){

const data =

JSON.parse(
localStorage.getItem(
"continueWatching"
)
);

if(!data) return;

const section =

document.createElement(
"section"
);

section.innerHTML=`

<h2>
▶ Continue Watching
</h2>

<div
id="continueRow"
class="row"
></div>

`;

document
.querySelector(
"main"
)
.prepend(
section
);

const res =
await fetch(

`${API_URL}/${data.type}/${data.id}?api_key=${API_KEY}`

);

const movie =
await res.json();

const card =
createCard(
movie,
data.type
);

document
.getElementById(
"continueRow"
)
.appendChild(
card
);
}