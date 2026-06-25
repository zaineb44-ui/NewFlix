const historyData =

JSON.parse(
localStorage.getItem(
"continueWatching"
)
);

if(historyData){

loadContinue();
}

async function loadContinue(){

const res =

await fetch(

`${API_URL}/${historyData.type}/${historyData.id}?api_key=${API_KEY}`

);

const data =
await res.json();

const container =

document.getElementById(
"continueCard"
);

container.innerHTML=`

<div class="card">

<img
src="https://image.tmdb.org/t/p/w500${data.poster_path}"
>

<div class="card-info">

<h2>
${data.title || data.name}
</h2>

<p>

Season:
${historyData.season}

Episode:
${historyData.episode}

</p>

<br>

<button id="resumeBtn">

Resume Watching

</button>

</div>

</div>

`;

document
.getElementById(
"resumeBtn"
)
.onclick=()=>{

location.href=

`player.html?id=${historyData.id}&type=${historyData.type}`;

};
}