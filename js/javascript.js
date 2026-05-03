// Esta primera parte es simplemente crear constantes del client ID y el header, que nos haran falta para acceder a la API porque 
// la API de MyAnimeList requiere autenticación. Yo ya me he creado uno en su página web y es el que vamos a usar.
// Mientras que no pierdas mi ID entonces no hay problemas, en caso de que lo pierdas sin querer mandame un correo Sergio.

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado!");
    initialize();
    playMusic();
});

function playMusic() {
    const audio = new Audio("audio/Zenless_Zone_Zero_OST_Vacation.mp3");
    audio.play();
    audio.loop = true;
    audio.volume = 0.3;
}

function initialize() {
    loadAnimePool();
}

const CLIENT_ID = "91c1bbf813d043114e162c57bb602916";

const headers = {
    "X-MAL-CLIENT-ID": CLIENT_ID
};

let animePool = [];
let currentAnime = [];

// Funcion para llamar a la API, de momento solo he conseguido obtener 300 animes, por que la llamada tiene un limite.
// Despues de llamar a la api gurado los datos en animePool para usarlos despues.
// Y por cierto, de normal, si llamas a la API el navegador te bloquea la conexion directa por motivos de seguridad.
// Así que el apaño que he tenido que buscar es usar un servidor proxy gratis para que haga de intermedio entre yo y la API.
// Por eso en el fetch de abajo, uso el proxy corsproxy.io y ademas encapsulo la URL de la API con encodeURIComponent 
// para que no haya problemas con caracteres especiales.
function loadAnimePool() {
    const targetUrl = "https://api.myanimelist.net/v2/anime/ranking?ranking_type=all&limit=500";
    fetch("https://corsproxy.io/?" + encodeURIComponent(targetUrl), { headers })
        .then(response => {
            console.log("Respuesta:", response);

            if (!response.ok) {
                throw new Error("Respuesta no OK. Código HTTP: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos:", data);
            animePool = data.data.map(item => item.node);
            console.log("Tamaño de la piscina de animes", animePool.length);
            console.log("Primer anime de la piscina:", animePool[0]);
            setupClicks();
            newRound();
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Funcion para obtener todos los detalles de un anime, como la puntuación y la imagen.
// Tambien usa el proxy y encodeURIComponent por las mismas razones que la funcion anterior.
function getAnimeDetails(id) {
    const targetUrl = `https://api.myanimelist.net/v2/anime/${id}?fields=title,mean,main_picture`;
    return fetch("https://corsproxy.io/?" + encodeURIComponent(targetUrl), { headers })
        .then(response => {
            console.log("Respuesta:", response);

            if (!response.ok) {
                throw new Error("Respuesta no OK. Código HTTP: " + response.status);
            }
            return response.json();
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Funcion para elegir dos animes al azar de la piscina.
// Ademas mientras que el anime elegido sea el mismo que el anterior, se vuelve a elegir otro.
function getRandomPair() {
    const anime1 = animePool[Math.floor(Math.random() * animePool.length)];
    let anime2 = animePool[Math.floor(Math.random() * animePool.length)];
    while (anime1.id === anime2.id) {
        anime2 = animePool[Math.floor(Math.random() * animePool.length)];
    }

    return [anime1, anime2];
}

// Esta funcion actualiza el html para mostrar la nueva imagen del anime y su nombre
// Ademas tambien guarda la puntuacion (o rating) en el dataset del titulo. Antes lo guardaba en la misma carta pero entonces la funcion de onclick mas adelante tambien 
// funcionaba al hacerle click a la carta y yo solo queria que funcionara al hacerle click al titulo que en verdad es un boton.
function updateCard(card, anime) {
    const img = card.querySelector("img");
    const title = card.querySelector(".anime-title");

    img.src = anime.main_picture?.large || anime.main_picture?.medium;
    title.textContent = anime.title;
}

// Esta funcion empieza una ronda nueva.
// Elige dos animes al azar (y se asegura de que no sean el mismo) y llama a updateCard para mostrarlos en el html.
function newRound() {

    const cards = document.querySelectorAll(".anime-card");

    const [anime1, anime2] = getRandomPair();
    

    getAnimeDetails(anime1.id)
        .then(anime1 => {
            console.log("Anime 1 conseguido:", anime1);
            return getAnimeDetails(anime2.id).then(anime2 => {
                console.log("Anime 2 conseguido:", anime2);
                updateCard(cards[0], anime1);
                updateCard(cards[1], anime2);
                currentAnime = [anime1, anime2];
            });
        })
        .catch(error => {
            console.error("Error in newRound:", error);
        });

}

// Aqui es donde he tenido muchos problemas, por que no sabia como guardar la puntuacion de los animes
// y ademas queria que funcionara al hacerle click al titulo que en verdad es un boton.
// Entonces al final como he dicho antes lo que he hecho es guardar la puntuacion en el dataset del titulo.
// Y una vez le haces click a un boton saca la puntuacion de los dos animes y compara la del anime que has elegido con el otro.
// Si es mayor o igual entonces es correcto y te dice que lo es, si no, te dice que es incorrecto.
// Y por ultimo empieza una ronda nueva.
function setupClicks() {
    const buttons = document.querySelectorAll(".anime-title");
    const scoreContainer = document.querySelector(".score-container");
    const score = document.getElementById("score");
    const highScore = document.getElementById("high-score");
    const result = document.getElementById("result");

    let puntuacion = 0;
    let highscore = 0;

    buttons[0].addEventListener("click", () => {
        const rating0 = currentAnime[0].mean;
        const rating1 = currentAnime[1].mean;
        scoreContainer.classList.remove("correct-border", "incorrect-border");
        if (rating0 >= rating1) {
            result.innerHTML = "<p class='correct'>Correcto</p>";
            scoreContainer.classList.add("correct-border");
            puntuacion++;
            score.innerHTML = "Puntuación: " + puntuacion;
        } else {
            result.innerHTML = "<p class='incorrect'>Incorrecto</p>";

            scoreContainer.classList.add("incorrect-border");
            if (puntuacion > highscore) {
                highscore = puntuacion;
            }
            highScore.innerHTML = "Mejor puntuación: " + highscore;
            puntuacion = 0;
            score.innerHTML = "Puntuación: " + puntuacion;
        }
        newRound();
    });

    buttons[1].addEventListener("click", () => {
        const rating0 = currentAnime[0].mean;
        const rating1 = currentAnime[1].mean;
        scoreContainer.classList.remove("correct-border", "incorrect-border");
        if (rating1 >= rating0) {
            result.innerHTML = "<p class='correct'>Correcto</p>";
            scoreContainer.classList.add("correct-border");
            puntuacion++;
            score.innerHTML = "Puntuación: " + puntuacion;
        } else {
            result.innerHTML = "<p class='incorrect'>Incorrecto</p>";
            scoreContainer.classList.add("incorrect-border");
            if (puntuacion > highscore) {
                highscore = puntuacion;
            }
            highScore.innerHTML = "Mejor puntuación: " + highscore;
            puntuacion = 0;
            score.innerHTML = "Puntuación: " + puntuacion;
        }
        newRound();
    });
}


