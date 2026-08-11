'use strict'

/*
    this project is for fun. 
    and still not completed yet.
    TODO : we need to play music online so we have to deal with cors 
    TODO : better UI        
*/


const tracks = [];
let currentIndex = 0;
let isPlayingAudio = false;
let isSeeking = false;


const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const curTimeEl = document.getElementById('curTime');
const durTimeEl = document.getElementById('durTime');
const volumeSlider = document.getElementById('volume');
const playlistEl = document.getElementById('playlistEl');



function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

function renderPlaylist() {
    playlistEl.innerHTML = '';
    tracks.forEach((t, i) => {
        const row = document.createElement('div');
        row.className = 'track-row' + (i === currentIndex ? ' active' : '');
        row.innerHTML = `
      <span class="track-index">${(i + 1).toString().padStart(2, '0')}</span>
      <div class="track-info">
        <p class="name">${t.title}</p>
        <p class="sub">${t.artist}</p>
      </div>
      ${i === currentIndex && isPlayingAudio
                ? '<div class="eq-bars"><span></span><span></span><span></span></div>'
                : '<span class="track-len">' + (t.duration || '') + '</span>'}
    `;
        row.addEventListener('click', () => loadTrack(i, true));
        playlistEl.appendChild(row);

    });
}

function play() {
    audio.play();
}
function pause() {
    audio.pause();
}
function loadTrack(i, autoPlay) {
    currentIndex = (i + tracks.length) % tracks.length;
    const t = tracks[currentIndex];
    audio.src = t.src;
    trackTitle.textContent = t.title;
    trackArtist.textContent = t.artist;
    renderPlaylist();
    if (autoPlay) play();

}

playBtn.addEventListener('click', () => {

    if (isPlayingAudio) pause(); else play();
});

audio.addEventListener('play', () => {
    isPlayingAudio = true;
    renderPlaylist();
});

audio.addEventListener('pause', () => {
    isPlayingAudio = false;
    renderPlaylist();
});

audio.addEventListener('ended', () => loadTrack(currentIndex + 1, true));
prevBtn.addEventListener('click', () => loadTrack(currentIndex - 1, true));
nextBtn.addEventListener('click', () => loadTrack(currentIndex + 1, true));
audio.addEventListener('loadedmetadata', () => {
    durTimeEl.textContent = formatTime(audio.duration);
});


loadTrack(0, false);