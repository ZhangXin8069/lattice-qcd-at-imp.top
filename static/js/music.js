/**
 * music.js — Background music player module
 * Controls playback of MP3 tracks with a floating button UI
 */
const MusicPlayer = (function() {
  let audio = null;
  let currentTrack = 0;
  let isPlaying = false;
  let hasInteracted = false;

  const tracks = [
    { file: '菊次郎的夏天(轻灵版).mp3', name_zh: '菊次郎的夏天 (轻灵版)', name_en: 'Summer (Light)' },
    { file: '菊次郎的夏天(经典版).mp3', name_zh: '菊次郎的夏天 (经典版)', name_en: 'Summer (Classic)' },
    { file: '菊次郎的夏天(治愈版).mp3', name_zh: '菊次郎的夏天 (治愈版)', name_en: 'Summer (Healing)' }
  ];

  function init() {
    audio = new Audio();
    audio.volume = 0.3;
    audio.preload = 'none';

    audio.addEventListener('ended', () => {
      nextTrack();
    });

    audio.addEventListener('error', () => {
      console.warn('Audio playback error, skipping track');
      nextTrack();
    });

    renderPlayer();
    setupListeners();

    // Listen for first user interaction to enable audio
    const enableAudio = () => {
      hasInteracted = true;
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
  }

  function renderPlayer() {
    const container = document.getElementById('music-player-container');
    if (!container) return;

    container.innerHTML = `
      <div class="music-player" id="music-player">
        <button class="music-btn" id="music-toggle" aria-label="Play music" title="Play background music">
          <i class="fas fa-music"></i>
        </button>
        <div class="music-controls" id="music-controls">
          <button class="music-ctrl-btn" id="music-prev" title="Previous track">
            <i class="fas fa-step-backward"></i>
          </button>
          <button class="music-ctrl-btn" id="music-play" title="Play/Pause">
            <i class="fas fa-play"></i>
          </button>
          <button class="music-ctrl-btn" id="music-next" title="Next track">
            <i class="fas fa-step-forward"></i>
          </button>
          <span class="music-track-name" id="music-track-name"></span>
          <input type="range" class="music-volume" id="music-volume" min="0" max="100" value="30" title="Volume">
        </div>
      </div>
    `;
  }

  function setupListeners() {
    // Use event delegation since elements are dynamically created
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('#music-toggle');
      const playBtn = e.target.closest('#music-play');
      const prevBtn = e.target.closest('#music-prev');
      const nextBtn = e.target.closest('#music-next');

      if (toggle) {
        const controls = document.getElementById('music-controls');
        controls.classList.toggle('visible');
        // Auto-play on first expand
        if (!isPlaying && controls.classList.contains('visible')) {
          play();
        }
      }
      if (playBtn) togglePlay();
      if (prevBtn) prevTrack();
      if (nextBtn) nextTrack();
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'music-volume') {
        audio.volume = e.target.value / 100;
      }
    });
  }

  function play() {
    if (!audio.src || audio.src === '') {
      audio.src = tracks[currentTrack].file;
      audio.load();
    }
    const promise = audio.play();
    if (promise) {
      promise.then(() => {
        isPlaying = true;
        updateUI();
      }).catch(err => {
        console.warn('Autoplay prevented:', err);
        isPlaying = false;
        updateUI();
      });
    }
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    updateUI();
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function nextTrack() {
    currentTrack = (currentTrack + 1) % tracks.length;
    audio.src = tracks[currentTrack].file;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
    updateUI();
  }

  function prevTrack() {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    audio.src = tracks[currentTrack].file;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
    updateUI();
  }

  function updateUI() {
    const playBtn = document.getElementById('music-play');
    const trackName = document.getElementById('music-track-name');
    const toggleBtn = document.getElementById('music-toggle');

    if (playBtn) {
      const icon = playBtn.querySelector('i');
      if (icon) {
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
      }
    }

    if (trackName) {
      const lang = I18N && I18N.getLang ? I18N.getLang() : 'zh';
      const track = tracks[currentTrack];
      trackName.textContent = isPlaying
        ? (lang === 'zh' ? track.name_zh : track.name_en)
        : (lang === 'zh' ? '未在播放' : 'Not playing');
    }

    if (toggleBtn) {
      if (isPlaying) {
        toggleBtn.classList.add('playing');
      } else {
        toggleBtn.classList.remove('playing');
      }
    }
  }

  // Update track name when language changes
  document.addEventListener('langChanged', updateUI);

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init, play, pause, togglePlay, nextTrack, prevTrack };
})();
