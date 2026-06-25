const params =
new URLSearchParams(
window.location.search
);

const id =
params.get("id");

const type =
params.get("type");

const player =
document.getElementById(
"player"
);

let currentSource =
localStorage.getItem(
"preferredSource"
) || "vidfast";

let currentSeason = 1;
let currentEpisode = 1;

const sourceButtons =
document.querySelectorAll(
".source-btn"
);

sourceButtons.forEach(btn=>{

    if(
        btn.dataset.source ===
        currentSource
    ){
        btn.classList.add(
            "active"
        );
    }else{
        btn.classList.remove(
            "active"
        );
    }

    btn.addEventListener(
        "click",
        ()=>{

            currentSource =
            btn.dataset.source;

            localStorage.setItem(
                "preferredSource",
                currentSource
            );

            sourceButtons.forEach(
                b=>b.classList.remove(
                    "active"
                )
            );

            btn.classList.add(
                "active"
            );

            loadPlayer();
        }
    );
});

async function loadInfo(){

    const res =
    await fetch(
`${API_URL}/${type}/${id}?api_key=${API_KEY}`
    );

    const data =
    await res.json();

    document
    .getElementById(
        "mediaTitle"
    )
    .innerText =
    data.title ||
    data.name;

    document
    .getElementById(
        "mediaOverview"
    )
    .innerText =
    data.overview;

    if(type==="tv"){

        buildSeasons(
            data.seasons
        );
    }
}

function buildPlayerURL(){

    if(type==="movie"){

        if(
            currentSource===
            "vidfast"
        ){

            return
`https://vidfast.pro/movie/${id}?autoPlay=true`;

        }

        return
`https://streamrip.fun/movie/${id}`;
    }

    if(
        currentSource===
        "vidfast"
    ){

        return
`https://vidfast.pro/tv/${id}/${currentSeason}/${currentEpisode}?autoPlay=true`;

    }

    return
`https://streamrip.fun/tv/${id}/${currentSeason}/${currentEpisode}`;
}

function loadPlayer(){

    player.src =
    buildPlayerURL();

    saveContinueWatching();
}

function saveContinueWatching(){

    localStorage.setItem(
        "continueWatching",

        JSON.stringify({

            id,

            type,

            season:
            currentSeason,

            episode:
            currentEpisode,

            source:
            currentSource

        })
    );
}

async function buildSeasons(
    seasons
){

    document
    .getElementById(
        "seasonSection"
    )
    .style.display =
    "block";

    const container =
    document.getElementById(
        "seasonButtons"
    );

    container.innerHTML="";

    seasons.forEach(
        season=>{

        if(
            season.season_number===0
        ) return;

        const btn =
        document.createElement(
            "button"
        );

        btn.innerText =
        `Season ${season.season_number}`;

        if(
            season.season_number===1
        ){
            btn.classList.add(
                "active"
            );
        }

        btn.onclick=()=>{

            document
            .querySelectorAll(
                "#seasonButtons button"
            )
            .forEach(
                b=>b.classList.remove(
                    "active"
                )
            );

            btn.classList.add(
                "active"
            );

            currentSeason =
            season.season_number;

            loadEpisodes(
                currentSeason
            );
        };

        container.appendChild(
            btn
        );
    });

    loadEpisodes(1);
}

async function loadEpisodes(
    season
){

    const res =
    await fetch(

`${API_URL}/tv/${id}/season/${season}?api_key=${API_KEY}`

    );

    const data =
    await res.json();

    document
    .getElementById(
        "episodeSection"
    )
    .style.display =
    "block";

    const container =
    document.getElementById(
        "episodeButtons"
    );

    container.innerHTML="";

    data.episodes.forEach(
        episode=>{

        const btn =
        document.createElement(
            "button"
        );

        btn.innerText =
        episode.episode_number;

        if(
            episode.episode_number===1
        ){
            btn.classList.add(
                "active"
            );
        }

        btn.onclick=()=>{

            document
            .querySelectorAll(
                "#episodeButtons button"
            )
            .forEach(
                b=>b.classList.remove(
                    "active"
                )
            );

            btn.classList.add(
                "active"
            );

            currentEpisode =
            episode.episode_number;

            loadPlayer();
        };

        container.appendChild(
            btn
        );
    });

    currentEpisode = 1;

    loadPlayer();
}

loadInfo();
loadPlayer();