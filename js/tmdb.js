const API_KEY="f5c8d5add995935daa212039d7b34e5d";

const API_URL="https://api.themoviedb.org/3";

const IMAGE_URL="https://image.tmdb.org/t/p/original";

async function fetchTMDB(endpoint){

    const res=await fetch(
        `${API_URL}${endpoint}?api_key=${API_KEY}`
    );

    return await res.json();
}

async function getTrending(){
    return await fetchTMDB("/trending/all/day");
}

async function getMovies(){
    return await fetchTMDB("/movie/popular");
}

async function getTV(){
    return await fetchTMDB("/tv/popular");
}

async function getTopRated(){
    return await fetchTMDB("/movie/top_rated");
}