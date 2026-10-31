console.log("lets write javascript");
let currentSong = new Audio();
let songs = [];
let manifest = null;

// Reads songs.json (works locally and on GitHub Pages)
async function loadManifest() {
    if (!manifest) {
        const res = await fetch("songs.json");
        manifest = await res.json();
    }
    return manifest;
}

// songs of one folder -> ["folder/song.mp3", ...]
async function getSongs(folder) {
    const data = await loadManifest();
    return (data.folders[folder] || []).map(file => folder + "/" + file);
}

// songs directly inside /songs (shown when the page first opens)
async function getallSongs() {
    const data = await loadManifest();
    return data.all || [];
}

function secondsToMinutesSeconds(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
}

// "folder/My Song copy 2.mp3" -> "My Song"
function cleanName(path) {
    let name = path.split("/").pop();
    try { name = decodeURIComponent(name); } catch (e) {}
    return name
        .replace(/\.mp3$/i, "")          // remove .mp3
        .replace(/ copy( \d+)?$/, "")    // remove " copy" / " copy 2"
        .replace(/[-_ ]?\d+$/, "")       // remove the trailing number, e.g. -621847
        .trim();
}

// path of the current song relative to /songs/ (decoded, matches the songs array)
function currentTrackPath() {
    const part = currentSong.src.split("/songs/")[1] || "";
    try { return decodeURIComponent(part); } catch (e) { return part; }
}

// for playing the song
const playmusic = (track, pause = false) => {
    currentSong.src = "songs/" + encodeURI(track);   // relative path (no leading "/")
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = cleanName(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}

//show all the songs in the playlist
function loadlibrary() {
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songul.innerHTML = " ";
    for (const song of songs) {
        songul.innerHTML += `<li data-file="${song}">
                <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div>${cleanName(song)}</div>
                </div>
                <div class="playnow">
                    <span>Play now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li> `;
    }

    // attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playmusic(e.dataset.file);
        })
    })
}

async function main() {
    //get the list of all the songs
    songs = await getallSongs();
    if (songs.length > 0) {
        playmusic(songs[0], true);
    }
    loadlibrary();
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async e => {
            songs = await getSongs(e.currentTarget.dataset.folder);
            loadlibrary();
        })
    })

    //attach an event listener to play / pause
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        }
        else {
            currentSong.pause();
            play.src = "play.svg";
        }
    })

    //listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    //add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    })

    // add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })

    // add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })

    // add an event listener to previous and next
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentTrackPath());
        if ((index - 1) >= 0) {
            playmusic(songs[index - 1]);
        }
    })

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentTrackPath());
        if ((index + 1) < songs.length) {
            playmusic(songs[index + 1]);
        }
    })

    // add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    })

    //add an event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}

main();