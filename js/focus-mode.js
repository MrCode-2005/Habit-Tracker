// ===================================
// Focus Mode - Immersive Timer Experience
// ===================================

const FocusMode = {
    isActive: false,
    isPaused: true,
    isBreakMode: false,
    currentTask: null,
    currentSubtask: null,

    // Timer state
    totalSeconds: 0,
    remainingSeconds: 0,
    timerInterval: null,
    subtaskTimerStates: {}, // Store remaining seconds per subtask (keyed by title)

    // Break settings
    breakDuration: 5 * 60, // 5 minutes default

    // Quote rotation
    quoteInterval: null,
    currentQuoteIndex: 0,

    // Animation & Sound
    currentAnimation: 'stars',
    currentSound: 'none',
    audioContext: null,
    currentAudio: null,
    volume: 0.5,

    // Playlist
    playlists: {},
    currentPlaylist: null,
    currentTrackIndex: 0,
    isShuffleMode: false,

    // Video Playlists
    videoPlaylists: {},
    currentVideoPlaylist: null,
    currentVideoIndex: 0,
    isVideoShuffleMode: false,

    // Animation canvas
    animationCanvas: null,
    animationCtx: null,
    animationFrame: null,

    // Focus quotes
    focusQuotes: [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
        { text: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
        { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
        { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
        { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
        { text: "Lack of direction, not lack of time, is the problem.", author: "Zig Ziglar" },
        { text: "You can do anything, but not everything.", author: "David Allen" },
        { text: "The main thing is to keep the main thing the main thing.", author: "Stephen Covey" },
        { text: "Starve your distractions and feed your focus.", author: "Unknown" },
        { text: "Do what you have to do until you can do what you want to do.", author: "Oprah Winfrey" },
        { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
    ],

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.loadPlaylists();
        this.loadVideoPlaylists();

        // Restore focus mode if it was active before refresh
        this.restoreState();
    },

    setupEventListeners() {
        // Back button
        document.getElementById('focusBackBtn')?.addEventListener('click', () => this.close());

        // Timer controls
        document.getElementById('focusStartBtn')?.addEventListener('click', () => this.toggleTimer());
        document.getElementById('focusResetBtn')?.addEventListener('click', () => this.resetTimer());
        document.getElementById('focusBreakBtn')?.addEventListener('click', () => this.toggleBreakMode());

        // Subtask navigation
        document.getElementById('prevSubtaskBtn')?.addEventListener('click', () => this.navigateSubtask('prev'));
        document.getElementById('nextSubtaskBtn')?.addEventListener('click', () => this.navigateSubtask('next'));

        // Break duration options
        document.querySelectorAll('.break-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setBreakDuration(minutes);
            });
        });

        // Settings panels
        document.getElementById('focusSoundBtn')?.addEventListener('click', () => {
            this.togglePanel('sound');
            // Hide the mini audio panel when opening main sound panel
            document.getElementById('focusAudioPanel')?.classList.add('hidden');
        });
        document.getElementById('focusAnimationBtn')?.addEventListener('click', () => this.togglePanel('animation'));

        // Toggle audio panel button (floating)
        document.getElementById('toggleAudioPanelBtn')?.addEventListener('click', () => {
            const panel = document.getElementById('focusAudioPanel');
            const toggleBtn = document.getElementById('toggleAudioPanelBtn');
            if (panel && toggleBtn) {
                panel.classList.toggle('hidden');
                toggleBtn.classList.toggle('active', !panel.classList.contains('hidden'));
            }
        });

        // Hide audio panel button (in panel header)
        document.getElementById('hideAudioPanelBtn')?.addEventListener('click', () => {
            const panel = document.getElementById('focusAudioPanel');
            const toggleBtn = document.getElementById('toggleAudioPanelBtn');
            if (panel) panel.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('active');
        });

        // Make toggle button draggable
        this.initDraggableButton();

        // Animation options
        document.querySelectorAll('.animation-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const animation = e.currentTarget.dataset.animation;
                this.setAnimation(animation);
            });
        });

        // Sound options
        document.querySelectorAll('.sound-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sound = e.currentTarget.dataset.sound;
                this.setSound(sound);
            });
        });

        // Custom sound upload
        document.getElementById('customSoundInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadCustomSound(file);
            }
        });

        // YouTube URL play button
        document.getElementById('youtubePlayBtn')?.addEventListener('click', () => {
            const url = document.getElementById('youtubeUrlInput')?.value;
            if (url) {
                this.playYouTubeAudio(url);
            }
        });

        // Also play on Enter key in YouTube input
        document.getElementById('youtubeUrlInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const url = e.target.value;
                if (url) {
                    this.playYouTubeAudio(url);
                }
            }
        });

        // Volume control
        document.getElementById('focusVolumeSlider')?.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Playlist event listeners
        document.getElementById('youtubeAddBtn')?.addEventListener('click', () => {
            const url = document.getElementById('youtubeUrlInput')?.value;
            if (url) {
                this.addToPlaylist(url);
            }
        });

        document.getElementById('newPlaylistBtn')?.addEventListener('click', () => {
            this.createNewPlaylist();
        });

        document.getElementById('playlistSelect')?.addEventListener('change', (e) => {
            this.selectPlaylist(e.target.value);
        });

        document.getElementById('playPlaylistBtn')?.addEventListener('click', () => {
            this.playPlaylist();
        });

        document.getElementById('shufflePlaylistBtn')?.addEventListener('click', () => {
            this.toggleShuffle();
        });

        // Expand sound panel
        document.getElementById('expandSoundPanel')?.addEventListener('click', () => {
            const panel = document.getElementById('focusSoundPanel');
            const btn = document.getElementById('expandSoundPanel');
            if (panel && btn) {
                panel.classList.toggle('expanded');
                btn.classList.toggle('active');
                // Toggle icon
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = panel.classList.contains('expanded')
                        ? 'fas fa-compress-alt'
                        : 'fas fa-expand-alt';
                }
            }
        });

        // Audio Skip Controls
        document.getElementById('skipBack10')?.addEventListener('click', () => this.skipAudio(-10));
        document.getElementById('skipBack5')?.addEventListener('click', () => this.skipAudio(-5));
        document.getElementById('skipForward5')?.addEventListener('click', () => this.skipAudio(5));
        document.getElementById('skipForward10')?.addEventListener('click', () => this.skipAudio(10));

        // Audio Progress Bar Seek
        document.getElementById('audioProgress')?.addEventListener('input', (e) => {
            this.seekAudio(e.target.value);
        });

        // Main audio controls - Previous, Play/Pause, Next
        document.getElementById('audioPrevTrack')?.addEventListener('click', () => {
            this.playPreviousTrack();
        });

        document.getElementById('audioPlayPause')?.addEventListener('click', () => {
            this.toggleAudioPause();
        });

        document.getElementById('audioNextTrack')?.addEventListener('click', () => {
            this.playNextTrack();
        });

        // ====== Right-Side Mini Audio Panel Controls ======
        // Volume
        document.getElementById('volumeSliderMini')?.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
            document.getElementById('focusVolumeSlider').value = e.target.value;
        });

        // Prev / Play-Pause / Next
        document.getElementById('prevTrackMini')?.addEventListener('click', () => this.playPreviousTrack());
        document.getElementById('playPauseMini')?.addEventListener('click', () => this.toggleAudioPause());
        document.getElementById('nextTrackMini')?.addEventListener('click', () => this.playNextTrack());

        // Skip controls
        document.getElementById('skipBack10Mini')?.addEventListener('click', () => this.skipAudio(-10));
        document.getElementById('skipBack5Mini')?.addEventListener('click', () => this.skipAudio(-5));
        document.getElementById('skipForward5Mini')?.addEventListener('click', () => this.skipAudio(5));
        document.getElementById('skipForward10Mini')?.addEventListener('click', () => this.skipAudio(10));

        // Progress bar
        document.getElementById('audioProgressMini')?.addEventListener('input', (e) => this.seekAudio(e.target.value));

        // Playlist controls
        document.getElementById('playAllBtnMini')?.addEventListener('click', () => this.playAllTracks());
        document.getElementById('shuffleBtnMini')?.addEventListener('click', () => this.toggleShuffle());
        document.getElementById('playlistSelectMini')?.addEventListener('change', (e) => {
            this.selectPlaylist(e.target.value);
            this.renderPlaylistTracksMini();
        });

        // Video Background - YouTube URL
        document.getElementById('setVideoBgBtn')?.addEventListener('click', () => {
            const url = document.getElementById('videoBgUrl')?.value;
            if (url) this.setVideoBackground(url);
        });

        // Video Background - File Upload
        document.getElementById('videoBgUpload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.uploadVideoBackground(file);
        });

        // Clear Video Background
        document.getElementById('clearVideoBgBtn')?.addEventListener('click', () => {
            this.clearVideoBackground();
        });

        // ====== Video Playlist Event Listeners ======
        document.getElementById('newVideoPlaylistBtn')?.addEventListener('click', () => {
            this.createVideoPlaylist();
        });

        document.getElementById('addVideoToPlaylistBtn')?.addEventListener('click', () => {
            const url = document.getElementById('videoPlaylistUrl')?.value;
            if (url) {
                this.addVideoToPlaylist(url);
                document.getElementById('videoPlaylistUrl').value = '';
            }
        });

        document.getElementById('playVideoPlaylistBtn')?.addEventListener('click', () => {
            this.playVideoPlaylist();
        });

        document.getElementById('shuffleVideoPlaylistBtn')?.addEventListener('click', () => {
            this.toggleVideoShuffle();
        });

        document.getElementById('videoPlaylistSelect')?.addEventListener('change', (e) => {
            this.selectVideoPlaylist(e.target.value);
        });

        // Edit Playlist Name Button
        document.getElementById('editVideoPlaylistNameBtn')?.addEventListener('click', () => {
            this.renameVideoPlaylist();
        });

        // Edit Audio Playlist Name Button (in sound panel)
        document.getElementById('editPlaylistNameBtn')?.addEventListener('click', () => {
            this.renamePlaylist();
        });

        // Interval Alert Toggle
        document.getElementById('enableIntervalAlert')?.addEventListener('change', (e) => {
            const settings = document.getElementById('intervalSettings');
            if (settings) {
                settings.classList.toggle('active', e.target.checked);
            }
            if (e.target.checked) {
                this.startIntervalAlerts();
            } else {
                this.stopIntervalAlerts();
            }
        });

        // Interval Minutes Change
        document.getElementById('intervalMinutes')?.addEventListener('change', (e) => {
            if (document.getElementById('enableIntervalAlert')?.checked) {
                this.startIntervalAlerts();
            }
        });

        // Test Alert Button
        document.getElementById('testAlertBtn')?.addEventListener('click', () => {
            this.playAlertSound();
        });

        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.focus-settings-panel') &&
                !e.target.closest('.focus-control-btn')) {
                this.closePanels();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === ' ' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggleTimer();
            }
        });
    },

    setupCanvas() {
        this.animationCanvas = document.getElementById('focusAnimationCanvas');
        if (this.animationCanvas) {
            this.animationCtx = this.animationCanvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    },

    resizeCanvas() {
        if (this.animationCanvas) {
            this.animationCanvas.width = window.innerWidth;
            this.animationCanvas.height = window.innerHeight;
        }
    },

    // Open focus mode with a task
    open(task, subtask = null) {
        // Load persisted subtask timer states from localStorage
        this.loadSubtaskTimerStates();

        // Clear saved timer states when switching to a different task
        if (!this.currentTask || this.currentTask.id !== task.id) {
            // Don't clear the persisted states, just the in-memory ones for different task
            // The persisted states are keyed by taskId_subtaskTitle so they won't conflict
        }

        this.currentTask = task;
        this.currentSubtask = subtask;

        // Calculate total time in seconds
        let totalMinutes = 0;

        if (subtask) {
            // Specific subtask selected - use duration or hours/minutes
            if (subtask.duration !== undefined) {
                totalMinutes = subtask.duration || 0;
            } else if (subtask.hours !== undefined || subtask.minutes !== undefined) {
                totalMinutes = (subtask.hours || 0) * 60 + (subtask.minutes || 0);
            }
        } else if (task && task.subtasks && task.subtasks.length > 0) {
            // Task with subtasks - find first INCOMPLETE subtask
            const incompleteSubtasks = task.subtasks.filter(s => !s.completed);

            if (incompleteSubtasks.length > 0) {
                // Set current subtask to first incomplete one
                this.currentSubtask = incompleteSubtasks[0];
                totalMinutes = this.currentSubtask.duration || 0;
            } else {
                // All subtasks complete - use task total time
                totalMinutes = (task.hours || 0) * 60 + (task.minutes || 0);
            }
        } else if (task) {
            // Task without subtasks
            totalMinutes = (task.hours || 0) * 60 + (task.minutes || 0);
        }

        this.totalSeconds = totalMinutes * 60;
        this.remainingSeconds = this.totalSeconds;

        // Check if we have a saved timer state for this specific subtask or task
        if (this.currentSubtask && task) {
            // For subtasks, key by taskId_subtaskTitle
            const timerKey = `${task.id}_${this.currentSubtask.title}`;
            const savedState = this.subtaskTimerStates[timerKey];
            if (savedState && savedState.remainingSeconds !== undefined && savedState.remainingSeconds > 0) {
                // Restore the saved remaining seconds
                this.remainingSeconds = savedState.remainingSeconds;
                this.totalSeconds = savedState.totalSeconds || this.totalSeconds;
                console.log(`Restored timer for subtask "${this.currentSubtask.title}": ${this.remainingSeconds}s remaining`);
            }
        } else if (task && !this.currentSubtask) {
            // For tasks without subtasks, key by taskId_main
            const timerKey = `${task.id}_main`;
            const savedState = this.subtaskTimerStates[timerKey];
            if (savedState && savedState.remainingSeconds !== undefined && savedState.remainingSeconds > 0) {
                // Restore the saved remaining seconds
                this.remainingSeconds = savedState.remainingSeconds;
                this.totalSeconds = savedState.totalSeconds || this.totalSeconds;
                console.log(`Restored timer for task "${task.title}": ${this.remainingSeconds}s remaining`);
            }
        }

        // Update UI
        this.updateTaskInfo();
        this.updateTimerDisplay();
        this.updateProgress(this.remainingSeconds / this.totalSeconds);

        // Show focus mode
        document.getElementById('focusMode').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.isActive = true;
        this.isPaused = true;

        // Start animation
        this.startAnimation();

        // Show initial quote
        this.showRandomQuote();
        this.startQuoteRotation();

        // Save state for refresh persistence
        this.saveState();

        // Auto-start timer
        setTimeout(() => {
            this.startTimer();
        }, 500);
    },

    close(clearSession = false) {
        // Save audio/video playback position before stopping
        this.savePlaybackPosition();

        // Save the current timer state to persistent storage BEFORE pausing
        if (this.currentTask && this.remainingSeconds > 0) {
            let timerKey;
            let logMessage;

            if (this.currentSubtask) {
                // For subtasks, key by taskId_subtaskTitle
                timerKey = `${this.currentTask.id}_${this.currentSubtask.title}`;
                logMessage = `Saved timer for subtask "${this.currentSubtask.title}": ${this.remainingSeconds}s remaining`;
            } else {
                // For tasks without subtasks, key by taskId_main
                timerKey = `${this.currentTask.id}_main`;
                logMessage = `Saved timer for task "${this.currentTask.title}": ${this.remainingSeconds}s remaining`;
            }

            this.subtaskTimerStates[timerKey] = {
                remainingSeconds: this.remainingSeconds,
                totalSeconds: this.totalSeconds,
                savedAt: Date.now()
            };
            // Persist to localStorage
            this.saveSubtaskTimerStates();
            console.log(logMessage);
        }

        this.pauseTimer();
        this.stopAnimation();
        this.stopQuoteRotation();
        this.stopSound();

        document.getElementById('focusMode').classList.remove('active');
        document.body.style.overflow = '';
        this.isActive = false;
        this.closePanels();

        // Remove the focus mode preload flag (from refresh during focus mode)
        // This disables the CSS rules that hide navbar/main content
        document.documentElement.removeAttribute('data-focus-active');

        if (clearSession) {
            // Only clear if explicitly requested (timer completed or user cancelled)
            this.clearState();
            // Also clear the timer state since it's completed
            if (this.currentTask) {
                let timerKey;
                if (this.currentSubtask) {
                    timerKey = `${this.currentTask.id}_${this.currentSubtask.title}`;
                } else {
                    timerKey = `${this.currentTask.id}_main`;
                }
                delete this.subtaskTimerStates[timerKey];
                this.saveSubtaskTimerStates();
            }
        } else {
            // Save state so user can return to where they left off
            this.saveState();
        }
    },

    // Save current audio/video playback position
    savePlaybackPosition() {
        const playbackState = {
            // YouTube player position
            youtubePosition: 0,
            // Custom audio position
            audioPosition: 0
        };

        if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
            try {
                playbackState.youtubePosition = this.youtubePlayer.getCurrentTime();
            } catch (e) { }
        }

        if (this.currentAudio) {
            playbackState.audioPosition = this.currentAudio.currentTime;
        }

        localStorage.setItem('focusPlaybackPosition', JSON.stringify(playbackState));
    },

    // Resume audio/video from saved position
    resumePlaybackPosition() {
        try {
            const saved = localStorage.getItem('focusPlaybackPosition');
            if (!saved) return;

            const playbackState = JSON.parse(saved);

            // Wait a bit for player to initialize, then seek
            setTimeout(() => {
                if (this.youtubePlayer && this.youtubePlayer.seekTo && playbackState.youtubePosition > 0) {
                    this.youtubePlayer.seekTo(playbackState.youtubePosition, true);
                }
                if (this.currentAudio && playbackState.audioPosition > 0) {
                    this.currentAudio.currentTime = playbackState.audioPosition;
                }
            }, 1500);
        } catch (e) {
            console.log('Could not restore playback position:', e);
        }
    },

    updateTaskInfo() {
        const titleEl = document.getElementById('focusTaskTitle');
        const subtaskEl = document.getElementById('focusSubtaskTitle');
        const progressEl = document.getElementById('focusTaskProgress');
        const detailsEl = document.getElementById('focusSubtaskDetails');
        const commentEl = document.getElementById('focusSubtaskComment');
        const linkEl = document.getElementById('focusSubtaskLink');

        if (titleEl) {
            titleEl.textContent = this.currentTask?.title || 'Focus Session';
        }

        if (subtaskEl) {
            if (this.currentSubtask) {
                subtaskEl.textContent = `Sub-task: ${this.currentSubtask.title}`;
                subtaskEl.style.display = 'block';
            } else {
                subtaskEl.style.display = 'none';
            }
        }

        // Show subtask comment and link
        if (detailsEl && commentEl && linkEl) {
            const hasComment = this.currentSubtask?.comment && this.currentSubtask.comment.trim();
            const hasLink = this.currentSubtask?.link && this.currentSubtask.link.trim();

            if (hasComment) {
                commentEl.textContent = this.currentSubtask.comment;
                commentEl.style.display = 'block';
            } else {
                commentEl.style.display = 'none';
            }

            if (hasLink) {
                linkEl.href = this.currentSubtask.link;
                linkEl.textContent = this.currentSubtask.link;
                linkEl.style.display = 'inline-block';
            } else {
                linkEl.style.display = 'none';
            }

            // Show/hide the container based on whether there's any content
            detailsEl.style.display = (hasComment || hasLink) ? 'block' : 'none';
        }

        // Show task progress if we have a task with subtasks
        const navEl = document.getElementById('focusSubtaskNav');
        if (progressEl && this.currentTask && this.currentTask.subtasks && this.currentTask.subtasks.length > 0) {
            const total = this.currentTask.subtasks.length;
            const completed = this.currentTask.subtasks.filter(s => s.completed).length;
            const currentIdx = this.currentSubtask
                ? this.currentTask.subtasks.findIndex(s =>
                    (s.id && s.id === this.currentSubtask.id) ||
                    (s.title && s.title === this.currentSubtask.title)
                ) + 1
                : 0;

            progressEl.innerHTML = `
                <div class="task-progress-bar">
                    <div class="task-progress-fill" style="width: ${(completed / total) * 100}%"></div>
                </div>
                <span class="task-progress-text">${completed}/${total} completed${currentIdx > 0 ? ` • Working on #${currentIdx}` : ''}</span>
            `;
            progressEl.style.display = 'block';
            if (navEl) navEl.style.display = 'flex';
        } else if (progressEl) {
            progressEl.style.display = 'none';
            if (navEl) navEl.style.display = 'none';
        }
    },

    navigateSubtask(direction) {
        if (!this.currentTask || !this.currentTask.subtasks || this.currentTask.subtasks.length === 0) return;

        const subtasks = this.currentTask.subtasks;

        // Find current subtask index by title (subtasks may not have id)
        let currentIdx = -1;
        if (this.currentSubtask) {
            currentIdx = subtasks.findIndex(s =>
                (s.id && s.id === this.currentSubtask.id) ||
                (s.title && s.title === this.currentSubtask.title)
            );
        }

        // Save the current subtask's remaining time before switching (using new object format)
        if (this.currentSubtask && this.currentSubtask.title && this.remainingSeconds > 0) {
            const key = `${this.currentTask.id}_${this.currentSubtask.title}`;
            this.subtaskTimerStates[key] = {
                remainingSeconds: this.remainingSeconds,
                totalSeconds: this.totalSeconds,
                savedAt: Date.now()
            };
            // Persist to localStorage
            this.saveSubtaskTimerStates();
        }

        // Pause the timer before switching
        this.pauseTimer();

        let newIdx;
        if (direction === 'prev') {
            newIdx = currentIdx > 0 ? currentIdx - 1 : subtasks.length - 1;
        } else {
            newIdx = currentIdx < subtasks.length - 1 ? currentIdx + 1 : 0;
        }

        // Skip completed subtasks when navigating forward
        if (direction === 'next') {
            let attempts = 0;
            while (subtasks[newIdx] && subtasks[newIdx].completed && attempts < subtasks.length) {
                newIdx = (newIdx + 1) % subtasks.length;
                attempts++;
            }
        }

        const newSubtask = subtasks[newIdx];
        if (!newSubtask) return;

        this.currentSubtask = newSubtask;

        // Check if we have saved timer state for this subtask (using new object format)
        const newKey = `${this.currentTask.id}_${newSubtask.title}`;
        const savedState = this.subtaskTimerStates[newKey];

        // Calculate default total time
        const durationMinutes = newSubtask.duration || 25;
        this.totalSeconds = durationMinutes * 60;

        // Restore saved remaining time or use default
        if (savedState && savedState.remainingSeconds !== undefined && savedState.remainingSeconds > 0) {
            this.remainingSeconds = savedState.remainingSeconds;
            this.totalSeconds = savedState.totalSeconds || this.totalSeconds;
        } else {
            this.remainingSeconds = this.totalSeconds;
        }

        this.updateTimerDisplay();
        this.updateProgress(this.remainingSeconds / this.totalSeconds);
        this.updateTaskInfo();
    },

    // Timer functions
    toggleTimer() {
        if (this.isPaused) {
            this.startTimer();
        } else {
            this.pauseTimer();
        }
    },

    startTimer() {
        if (this.remainingSeconds <= 0) return;

        this.isPaused = false;
        this.animationPaused = false; // Resume animation when timer starts
        this.updateStartButton();

        // If there's an audio enable overlay, remove it and start the pending audio
        this.dismissAudioOverlayAndPlay();

        this.timerInterval = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.updateTimerDisplay();
                this.updateProgress(this.remainingSeconds / this.totalSeconds);
                // Update saved state periodically
                this.saveState();
            } else {
                this.timerComplete();
            }
        }, 1000);
    },

    // Helper to dismiss audio overlay and start playing
    dismissAudioOverlayAndPlay() {
        const overlay = document.getElementById('audioEnableOverlay');
        if (overlay) {
            overlay.remove();
            document.getElementById('audioOverlayStyles')?.remove();
        }

        // If there's pending audio to resume, play it now
        if (this.pendingAudioResume) {
            this.playTrack(this.pendingAudioResume.trackIndex);
            this.pendingAudioResume = null;
        }
    },

    pauseTimer() {
        this.isPaused = true;
        this.animationPaused = true; // Pause animation when timer is paused
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.updateStartButton();

        // Also pause YouTube video background if playing
        if (this.youtubePlayer && this.youtubePlayer.pauseVideo) {
            try {
                this.youtubePlayer.pauseVideo();
            } catch (e) { }
        }
    },

    resetTimer() {
        this.pauseTimer();
        this.remainingSeconds = this.isBreakMode ? this.breakDuration : this.totalSeconds;
        this.updateTimerDisplay();
        this.updateProgress(1);
    },

    timerComplete() {
        this.pauseTimer();

        if (this.isBreakMode) {
            // Break complete - switch back to focus
            this.toggleBreakMode();
            this.showNotification('Break complete! Ready to focus?');
        } else {
            // Focus complete - auto-complete subtask/task
            if (this.currentTask && this.currentSubtask) {
                // Clear the saved timer state for this completed subtask
                this.clearSubtaskTimerState(this.currentTask.id, this.currentSubtask.title);

                // Find the subtask index in the task
                const subtaskIndex = this.currentTask.subtasks?.findIndex(
                    s => s.title === this.currentSubtask.title
                );

                if (subtaskIndex !== -1 && subtaskIndex !== undefined) {
                    // Mark subtask as completed
                    Tasks.toggleSubtask(this.currentTask.id, subtaskIndex);
                    this.showNotification('Subtask completed! Great work! 🎉');
                } else {
                    this.showNotification('Session complete! 🎉');
                }
            } else if (this.currentTask) {
                // Clear the saved timer state for this completed task (without subtasks)
                this.clearSubtaskTimerState(this.currentTask.id, 'main');

                // Mark main task as completed
                Tasks.toggleComplete(this.currentTask.id);
                this.showNotification('Task completed! Great job! 🎉');
            } else {
                this.showNotification('Great job! Session complete! 🎉');
            }
        }
    },

    updateTimerDisplay() {
        const hours = Math.floor(this.remainingSeconds / 3600);
        const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
        const seconds = this.remainingSeconds % 60;

        const display = document.getElementById('focusTimerDisplay');
        if (display) {
            if (hours > 0) {
                display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            } else {
                display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }

        // Update label
        const label = document.getElementById('focusTimerLabel');
        if (label) {
            label.textContent = this.isBreakMode ? 'BREAK TIME' : 'FOCUS TIME';
        }
    },

    updateProgress(progress) {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const circumference = 2 * Math.PI * 140; // radius = 140
            const offset = circumference * (1 - progress);
            progressBar.style.strokeDasharray = circumference;
            progressBar.style.strokeDashoffset = offset;
        }
    },

    updateStartButton() {
        const btn = document.getElementById('focusStartBtn');
        if (btn) {
            if (this.isPaused) {
                btn.innerHTML = '<i class="fas fa-play"></i> Start';
            } else {
                btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            }
        }
    },

    // Break mode
    toggleBreakMode() {
        this.isBreakMode = !this.isBreakMode;
        this.pauseTimer();

        const focusMode = document.getElementById('focusMode');
        const breakBtn = document.getElementById('focusBreakBtn');
        const durationSelector = document.querySelector('.break-duration-selector');

        if (this.isBreakMode) {
            focusMode?.classList.add('break-mode');
            breakBtn?.classList.add('active');
            durationSelector?.classList.add('active');
            this.remainingSeconds = this.breakDuration;
            this.totalSeconds = this.breakDuration;
        } else {
            focusMode?.classList.remove('break-mode');
            breakBtn?.classList.remove('active');
            durationSelector?.classList.remove('active');
            // Restore original task time
            let hours = 0, minutes = 0;
            if (this.currentSubtask) {
                hours = this.currentSubtask.hours || 0;
                minutes = this.currentSubtask.minutes || 0;
            } else if (this.currentTask) {
                hours = this.currentTask.hours || 0;
                minutes = this.currentTask.minutes || 0;
            }
            this.totalSeconds = (hours * 60 + minutes) * 60;
            this.remainingSeconds = this.totalSeconds;
        }

        this.updateTimerDisplay();
        this.updateProgress(1);
    },

    setBreakDuration(minutes) {
        this.breakDuration = minutes * 60;

        // Update UI
        document.querySelectorAll('.break-option').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.minutes) === minutes);
        });

        if (this.isBreakMode) {
            this.remainingSeconds = this.breakDuration;
            this.totalSeconds = this.breakDuration;
            this.updateTimerDisplay();
            this.updateProgress(1);
        }
    },

    // Quotes
    showRandomQuote() {
        const quotes = this.focusQuotes;
        this.currentQuoteIndex = Math.floor(Math.random() * quotes.length);
        this.displayQuote(quotes[this.currentQuoteIndex]);
    },

    displayQuote(quote) {
        const textEl = document.getElementById('focusQuoteText');
        const authorEl = document.getElementById('focusQuoteAuthor');

        if (textEl && authorEl) {
            textEl.style.opacity = 0;
            authorEl.style.opacity = 0;

            setTimeout(() => {
                textEl.textContent = `"${quote.text}"`;
                authorEl.textContent = `— ${quote.author}`;
                textEl.style.opacity = 1;
                authorEl.style.opacity = 1;
            }, 300);
        }
    },

    startQuoteRotation() {
        // Rotate quotes every 15 minutes
        this.quoteInterval = setInterval(() => {
            this.showRandomQuote();
        }, 15 * 60 * 1000);
    },

    stopQuoteRotation() {
        if (this.quoteInterval) {
            clearInterval(this.quoteInterval);
            this.quoteInterval = null;
        }
    },

    // Settings panels
    togglePanel(panel) {
        const soundPanel = document.getElementById('focusSoundPanel');
        const animationPanel = document.getElementById('focusAnimationPanel');

        if (panel === 'sound') {
            animationPanel?.classList.remove('active');
            soundPanel?.classList.toggle('active');
        } else if (panel === 'animation') {
            soundPanel?.classList.remove('active');
            animationPanel?.classList.toggle('active');
        }
    },

    closePanels() {
        document.querySelectorAll('.focus-settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
    },

    // Animation system
    setAnimation(animation) {
        this.currentAnimation = animation;

        // Update UI
        document.querySelectorAll('.animation-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.animation === animation);
        });

        // Clear video background elements directly (don't call clearVideoBackground to avoid double startAnimation)
        const videoPlayer = document.getElementById('videoBgPlayer');
        const youtubeVideoBg = document.getElementById('youtubeVideoBg');
        const canvas = document.getElementById('focusAnimationCanvas');

        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.src = '';
            videoPlayer.classList.remove('active');
        }
        if (youtubeVideoBg) {
            youtubeVideoBg.innerHTML = '';
            youtubeVideoBg.classList.remove('active');
        }
        if (canvas) {
            canvas.style.display = 'block';
        }

        this.videoBgActive = false;

        // Restart animation (single call)
        this.stopAnimation();
        this.startAnimation();

        // Save animation state
        this.saveAnimationState();
    },

    startAnimation() {
        this.stopAnimation();

        switch (this.currentAnimation) {
            case 'campfire':
                this.animateCampfire();
                break;
            case 'rain':
                this.animateRain();
                break;
            case 'ocean':
                this.animateOcean();
                break;
            case 'stars':
                this.animateStars();
                break;
            case 'forest':
                this.animateForest();
                break;
            case 'cozy':
                this.animateCozy();
                break;
            case 'aurora':
                this.animateAurora();
                break;
            case 'snow':
                this.animateSnow();
                break;
            case 'sunset':
                this.animateSunset();
                break;
            case 'cherry':
                this.animateCherry();
                break;
            case 'underwater':
                this.animateUnderwater();
                break;
            case 'candle':
                this.animateCandle();
                break;
            case 'thunder':
                this.animateThunder();
                break;
            case 'galaxy':
                this.animateGalaxy();
                break;
            case 'zen':
                this.animateZen();
                break;
            case 'meadow':
                this.animateMeadow();
                break;
            default:
                this.animateStars();
        }
    },

    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    },

    // Star animation
    animateStars() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const stars = [];
        const numStars = 200;

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                alphaChange: (Math.random() - 0.5) * 0.02,
                vx: (Math.random() - 0.5) * 0.3, // Horizontal velocity
                vy: (Math.random() - 0.5) * 0.3  // Vertical velocity
            });
        }

        const animate = () => {
            // Check if animation is paused
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            ctx.fillStyle = 'rgba(15, 15, 35, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                // Twinkle effect
                star.alpha += star.alphaChange;
                if (star.alpha <= 0.2 || star.alpha >= 1) {
                    star.alphaChange *= -1;
                }

                // Slow movement - stars drift
                star.x += star.vx;
                star.y += star.vy;

                // Wrap around screen
                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        // Initial clear
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animate();
    },

    // Rain animation
    animateRain() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const drops = [];
        const numDrops = 300;

        for (let i = 0; i < numDrops; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 10 + 10,
                opacity: Math.random() * 0.3 + 0.1
            });
        }

        const animate = () => {
            // Check if animation is paused
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            ctx.fillStyle = 'rgba(20, 30, 48, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
            ctx.lineWidth = 1;

            drops.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + 1, drop.y + drop.length);
                ctx.globalAlpha = drop.opacity;
                ctx.stroke();

                drop.y += drop.speed;
                if (drop.y > canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * canvas.width;
                }
            });

            ctx.globalAlpha = 1;
            this.animationFrame = requestAnimationFrame(animate);
        };

        ctx.fillStyle = '#141e30';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animate();
    },

    // Campfire animation
    animateCampfire() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const particles = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.8;

        const animate = () => {
            // Check if animation is paused
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            ctx.fillStyle = 'rgba(15, 10, 5, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add new particles
            if (particles.length < 100) {
                particles.push({
                    x: centerX + (Math.random() - 0.5) * 60,
                    y: centerY,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 2,
                    radius: Math.random() * 8 + 4,
                    life: 1,
                    decay: Math.random() * 0.02 + 0.01
                });
            }

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy -= 0.05;
                p.life -= p.decay;
                p.radius *= 0.99;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                const alpha = p.life * 0.8;
                gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 20, ${alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(100, 20, 0, 0)`);

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Base glow
            const baseGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
            baseGlow.addColorStop(0, 'rgba(255, 150, 50, 0.3)');
            baseGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.beginPath();
            ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
            ctx.fillStyle = baseGlow;
            ctx.fill();

            this.animationFrame = requestAnimationFrame(animate);
        };

        ctx.fillStyle = '#0a0805';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animate();
    },

    // Ocean waves animation
    animateOcean() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        let time = 0;

        const animate = () => {
            // Check if animation is paused
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.02;

            // Sky gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
            skyGradient.addColorStop(0, '#1a1a3e');
            skyGradient.addColorStop(1, '#2d3a5f');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

            // Ocean
            const oceanGradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
            oceanGradient.addColorStop(0, '#1e3a5f');
            oceanGradient.addColorStop(1, '#0a1628');
            ctx.fillStyle = oceanGradient;
            ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

            // Draw waves
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height);

                const waveY = canvas.height * 0.55 + i * 30;
                const amplitude = 15 - i * 2;
                const frequency = 0.005 + i * 0.002;
                const speed = time * (1 + i * 0.2);

                for (let x = 0; x <= canvas.width; x += 5) {
                    const y = waveY + Math.sin(x * frequency + speed) * amplitude;
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.closePath();

                const alpha = 0.2 - i * 0.03;
                ctx.fillStyle = `rgba(100, 150, 200, ${alpha})`;
                ctx.fill();
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Forest animation (floating particles like pollen/fireflies)
    animateForest() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.3 - 0.2,
                alpha: Math.random() * 0.5 + 0.2,
                pulse: Math.random() * Math.PI * 2
            });
        }

        const animate = () => {
            // Check if animation is paused
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            // Forest background gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0d1f12');
            gradient.addColorStop(0.5, '#162419');
            gradient.addColorStop(1, '#0a150c');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.03;

                const currentAlpha = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3);

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Glow effect
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
                glow.addColorStop(0, `rgba(180, 255, 150, ${currentAlpha})`);
                glow.addColorStop(1, 'rgba(100, 200, 80, 0)');

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(220, 255, 200, ${currentAlpha})`;
                ctx.fill();
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Cozy room animation (warm ambient lighting shifts)
    animateCozy() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        let hue = 30;
        let time = 0;

        const animate = () => {
            // Check if animation is paused
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.01;
            hue = 25 + Math.sin(time) * 5;

            const gradient = ctx.createRadialGradient(
                canvas.width * 0.3, canvas.height * 0.3, 0,
                canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
            );
            gradient.addColorStop(0, `hsl(${hue}, 60%, 25%)`);
            gradient.addColorStop(0.5, `hsl(${hue - 5}, 40%, 15%)`);
            gradient.addColorStop(1, `hsl(${hue - 10}, 30%, 8%)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Warm light spots
            const lightX = canvas.width * 0.7 + Math.sin(time * 0.5) * 20;
            const lightY = canvas.height * 0.4 + Math.cos(time * 0.3) * 10;

            const light = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 200);
            light.addColorStop(0, 'rgba(255, 200, 100, 0.15)');
            light.addColorStop(1, 'rgba(255, 150, 50, 0)');

            ctx.beginPath();
            ctx.arc(lightX, lightY, 200, 0, Math.PI * 2);
            ctx.fillStyle = light;
            ctx.fill();

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Aurora Borealis animation
    animateAurora() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        let time = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.01;

            // Dark sky
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw aurora waves
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                const yBase = canvas.height * 0.3 + i * 40;

                for (let x = 0; x <= canvas.width; x += 3) {
                    const y = yBase + Math.sin((x * 0.01) + time + i) * 30 +
                        Math.sin((x * 0.02) + time * 1.5) * 20;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();

                const gradient = ctx.createLinearGradient(0, yBase - 50, 0, yBase + 100);
                const hue = 120 + i * 20 + Math.sin(time) * 20;
                gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0)`);
                gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${0.15 - i * 0.02})`);
                gradient.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Stars
            for (let i = 0; i < 50; i++) {
                const x = (i * 137.5) % canvas.width;
                const y = (i * 73.3) % (canvas.height * 0.5);
                const alpha = 0.3 + Math.sin(time * 2 + i) * 0.3;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fillRect(x, y, 1.5, 1.5);
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Snowfall animation
    animateSnow() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const snowflakes = [];
        for (let i = 0; i < 150; i++) {
            snowflakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1,
                wind: Math.random() * 0.5,
                opacity: Math.random() * 0.5 + 0.5
            });
        }

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            // Night sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#2d3a5f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            snowflakes.forEach(flake => {
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
                ctx.fill();

                flake.y += flake.speed;
                flake.x += flake.wind + Math.sin(flake.y * 0.01) * 0.5;

                if (flake.y > canvas.height) {
                    flake.y = -10;
                    flake.x = Math.random() * canvas.width;
                }
                if (flake.x > canvas.width) flake.x = 0;
                if (flake.x < 0) flake.x = canvas.width;
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Sunset animation
    animateSunset() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        let time = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.005;

            // Sky gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, '#1a0a2e');
            skyGradient.addColorStop(0.3, '#4a1a4e');
            skyGradient.addColorStop(0.5, '#ff6b35');
            skyGradient.addColorStop(0.7, '#f7c59f');
            skyGradient.addColorStop(1, '#2a1a3e');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Sun
            const sunY = canvas.height * 0.55 + Math.sin(time) * 5;
            const sunGradient = ctx.createRadialGradient(
                canvas.width * 0.5, sunY, 0,
                canvas.width * 0.5, sunY, 80
            );
            sunGradient.addColorStop(0, '#fff5e6');
            sunGradient.addColorStop(0.3, '#ffd93d');
            sunGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
            ctx.fillStyle = sunGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clouds
            for (let i = 0; i < 3; i++) {
                const x = ((i * 300 + time * 20) % (canvas.width + 200)) - 100;
                const y = canvas.height * 0.3 + i * 50;
                ctx.fillStyle = `rgba(255, 150, 100, ${0.3 - i * 0.08})`;
                ctx.beginPath();
                ctx.ellipse(x, y, 80, 30, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Cherry Blossoms animation
    animateCherry() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const petals = [];
        for (let i = 0; i < 50; i++) {
            petals.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 8 + 4,
                speedY: Math.random() * 1 + 0.5,
                speedX: Math.random() * 1 - 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.05,
                opacity: Math.random() * 0.5 + 0.5
            });
        }

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            // Soft pink gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2d1f3d');
            gradient.addColorStop(0.5, '#3d2f4d');
            gradient.addColorStop(1, '#1d0f2d');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            petals.forEach(petal => {
                ctx.save();
                ctx.translate(petal.x, petal.y);
                ctx.rotate(petal.rotation);

                // Draw petal shape
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 182, 193, ${petal.opacity})`;
                ctx.ellipse(0, 0, petal.size, petal.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                petal.y += petal.speedY;
                petal.x += petal.speedX + Math.sin(petal.y * 0.02) * 0.5;
                petal.rotation += petal.rotSpeed;

                if (petal.y > canvas.height + 20) {
                    petal.y = -20;
                    petal.x = Math.random() * canvas.width;
                }
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Underwater animation
    animateUnderwater() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const bubbles = [];
        for (let i = 0; i < 30; i++) {
            bubbles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * canvas.height,
                radius: Math.random() * 8 + 2,
                speed: Math.random() * 2 + 1,
                wobble: Math.random() * 2
            });
        }

        let time = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.02;

            // Deep blue gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#001f3f');
            gradient.addColorStop(0.5, '#003366');
            gradient.addColorStop(1, '#001a33');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Light rays
            for (let i = 0; i < 5; i++) {
                ctx.save();
                const x = canvas.width * 0.2 + i * (canvas.width * 0.15);
                ctx.globalAlpha = 0.05 + Math.sin(time + i) * 0.02;
                ctx.fillStyle = '#4dd0e1';
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x - 50, canvas.height);
                ctx.lineTo(x + 50, canvas.height);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Bubbles
            bubbles.forEach(bubble => {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
                ctx.lineWidth = 1;
                ctx.arc(bubble.x + Math.sin(bubble.y * 0.02) * bubble.wobble, bubble.y, bubble.radius, 0, Math.PI * 2);
                ctx.stroke();

                bubble.y -= bubble.speed;
                if (bubble.y < -20) {
                    bubble.y = canvas.height + 20;
                    bubble.x = Math.random() * canvas.width;
                }
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Candlelight animation
    animateCandle() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        let time = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.05;

            // Dark room
            ctx.fillStyle = '#0a0805';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Multiple candles
            const candlePositions = [
                { x: canvas.width * 0.3, y: canvas.height * 0.7 },
                { x: canvas.width * 0.5, y: canvas.height * 0.65 },
                { x: canvas.width * 0.7, y: canvas.height * 0.72 }
            ];

            candlePositions.forEach((pos, i) => {
                const flicker = Math.sin(time * 3 + i) * 5 + Math.sin(time * 7 + i * 2) * 3;

                // Glow
                const glow = ctx.createRadialGradient(pos.x, pos.y - 20, 0, pos.x, pos.y - 20, 150);
                glow.addColorStop(0, 'rgba(255, 150, 50, 0.3)');
                glow.addColorStop(0.5, 'rgba(255, 100, 30, 0.1)');
                glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Flame
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.quadraticCurveTo(pos.x - 10 + flicker * 0.5, pos.y - 30, pos.x, pos.y - 50 - Math.abs(flicker));
                ctx.quadraticCurveTo(pos.x + 10 + flicker * 0.5, pos.y - 30, pos.x, pos.y);
                const flameGradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y - 50);
                flameGradient.addColorStop(0, '#ff6600');
                flameGradient.addColorStop(0.5, '#ffcc00');
                flameGradient.addColorStop(1, '#ffffff');
                ctx.fillStyle = flameGradient;
                ctx.fill();
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Thunderstorm animation
    animateThunder() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const raindrops = [];
        for (let i = 0; i < 200; i++) {
            raindrops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 15 + 10
            });
        }

        let lightning = 0;
        let nextLightning = Math.random() * 200 + 100;
        let frame = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            frame++;

            // Dark stormy sky
            ctx.fillStyle = lightning > 0 ? `rgba(200, 200, 255, ${lightning * 0.3})` : '#0a0a15';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Rain
            ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
            ctx.lineWidth = 1;
            raindrops.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + 2, drop.y + drop.length);
                ctx.stroke();

                drop.y += drop.speed;
                drop.x += 2;
                if (drop.y > canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * canvas.width;
                }
            });

            // Lightning
            if (lightning > 0) lightning -= 0.1;
            if (frame >= nextLightning) {
                lightning = 1;
                nextLightning = frame + Math.random() * 200 + 100;
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Galaxy animation
    animateGalaxy() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const stars = [];
        for (let i = 0; i < 300; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * Math.min(canvas.width, canvas.height) * 0.4;
            stars.push({
                angle: angle,
                dist: dist,
                size: Math.random() * 2 + 0.5,
                speed: 0.002 + (dist / 1000) * 0.001,
                hue: Math.random() * 60 + 200
            });
        }

        let time = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.01;

            // Deep space
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Nebula glow
            const nebulaGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
            nebulaGradient.addColorStop(0, 'rgba(100, 50, 150, 0.3)');
            nebulaGradient.addColorStop(0.5, 'rgba(50, 100, 150, 0.1)');
            nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = nebulaGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Spiral stars
            stars.forEach(star => {
                star.angle += star.speed;
                const x = centerX + Math.cos(star.angle) * star.dist;
                const y = centerY + Math.sin(star.angle) * star.dist * 0.4;

                ctx.fillStyle = `hsla(${star.hue}, 80%, 70%, ${0.5 + Math.sin(time + star.angle) * 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Zen Garden animation
    animateZen() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        let time = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.02;

            // Calm gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a2f38');
            gradient.addColorStop(1, '#0f1f28');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Water ripples
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (let i = 0; i < 5; i++) {
                const radius = ((time * 50 + i * 80) % 400);
                const alpha = Math.max(0, 1 - radius / 400);

                ctx.strokeStyle = `rgba(100, 150, 180, ${alpha * 0.3})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Floating lotus
            const lotusX = centerX + Math.sin(time * 0.5) * 30;
            const lotusY = centerY + Math.cos(time * 0.3) * 10;

            // Lotus petals
            for (let i = 0; i < 8; i++) {
                ctx.save();
                ctx.translate(lotusX, lotusY);
                ctx.rotate((i * Math.PI / 4) + Math.sin(time) * 0.05);
                ctx.fillStyle = `rgba(255, 150, 200, ${0.6 + Math.sin(time + i) * 0.2})`;
                ctx.beginPath();
                ctx.ellipse(0, -15, 8, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Meadow animation
    animateMeadow() {
        const ctx = this.animationCtx;
        const canvas = this.animationCanvas;
        if (!ctx || !canvas) return;

        const grasses = [];
        for (let i = 0; i < 100; i++) {
            grasses.push({
                x: Math.random() * canvas.width,
                height: Math.random() * 40 + 20,
                phase: Math.random() * Math.PI * 2
            });
        }

        const butterflies = [];
        for (let i = 0; i < 5; i++) {
            butterflies.push({
                x: Math.random() * canvas.width,
                y: canvas.height * 0.5 + Math.random() * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 1,
                wingPhase: Math.random() * Math.PI * 2,
                color: `hsl(${Math.random() * 60 + 280}, 70%, 60%)`
            });
        }

        let time = 0;

        const animate = () => {
            if (this.animationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }

            time += 0.03;

            // Sky gradient (dusk)
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, '#2a1f4e');
            skyGradient.addColorStop(0.4, '#4a3f6e');
            skyGradient.addColorStop(0.7, '#3a4f3e');
            skyGradient.addColorStop(1, '#1a2f1e');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grass
            grasses.forEach(grass => {
                const sway = Math.sin(time + grass.phase) * 10;
                ctx.strokeStyle = '#4a6f4a';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(grass.x, canvas.height);
                ctx.quadraticCurveTo(
                    grass.x + sway,
                    canvas.height - grass.height / 2,
                    grass.x + sway * 1.5,
                    canvas.height - grass.height
                );
                ctx.stroke();
            });

            // Butterflies
            butterflies.forEach(b => {
                b.x += b.vx;
                b.y += b.vy + Math.sin(time * 3) * 0.5;
                b.wingPhase += 0.3;

                // Bounce off edges
                if (b.x < 0 || b.x > canvas.width) b.vx *= -1;
                if (b.y < canvas.height * 0.3 || b.y > canvas.height * 0.8) b.vy *= -1;

                const wingSpread = Math.sin(b.wingPhase) * 8;
                ctx.fillStyle = b.color;

                // Wings
                ctx.beginPath();
                ctx.ellipse(b.x - wingSpread, b.y, 6, 10, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(b.x + wingSpread, b.y, 6, 10, 0.3, 0, Math.PI * 2);
                ctx.fill();
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    },

    // Sound system using Web Audio API
    setSound(sound) {
        this.currentSound = sound;

        // Update UI
        document.querySelectorAll('.sound-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === sound);
        });

        // Play sound
        this.stopSound();
        if (sound !== 'none') {
            this.playSound(sound);
        }
    },

    playSound(sound) {
        // For noise types, use Web Audio API to generate them
        const noiseTypes = ['white', 'brown', 'pink'];

        if (noiseTypes.includes(sound)) {
            this.playGeneratedNoise(sound);
        } else {
            this.playAudioFile(sound);
        }
    },

    playGeneratedNoise(type) {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        if (type === 'white') {
            // White noise - random values
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'brown') {
            // Brown noise - integrated white noise
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // Compensate for volume loss
            }
        } else if (type === 'pink') {
            // Pink noise - Paul Kellet's method
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; // Compensate for gain
                b6 = white * 0.115926;
            }
        }

        // Create buffer source and play
        this.noiseSource = this.audioContext.createBufferSource();
        this.noiseSource.buffer = noiseBuffer;
        this.noiseSource.loop = true;

        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;

        this.noiseSource.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        this.noiseSource.start();
    },

    playAudioFile(sound) {
        // Generate nature sounds using Web Audio API for reliability
        // External URLs are unreliable, so we generate sounds locally

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        this.gainNode.connect(this.audioContext.destination);

        if (sound === 'rain') {
            // Rain: filtered white noise
            const bufferSize = 2 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            this.noiseSource = this.audioContext.createBufferSource();
            this.noiseSource.buffer = noiseBuffer;
            this.noiseSource.loop = true;

            // Lowpass filter for rain
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            this.noiseSource.connect(filter);
            filter.connect(this.gainNode);
            this.noiseSource.start();

        } else if (sound === 'fire') {
            // Fire: low frequency crackling noise
            const bufferSize = 2 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            // Brown noise with random pops
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.01 * white)) / 1.01;
                lastOut = output[i];
                // Add occasional crackles
                if (Math.random() < 0.0005) {
                    output[i] += (Math.random() - 0.5) * 0.5;
                }
            }

            this.noiseSource = this.audioContext.createBufferSource();
            this.noiseSource.buffer = noiseBuffer;
            this.noiseSource.loop = true;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 200;

            this.noiseSource.connect(filter);
            filter.connect(this.gainNode);
            this.noiseSource.start();

        } else if (sound === 'ocean') {
            // Ocean: slow modulated white noise
            const bufferSize = 4 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                // Create wave-like pattern
                const wave = Math.sin(i / this.audioContext.sampleRate * 0.1) * 0.5 + 0.5;
                output[i] = (Math.random() * 2 - 1) * wave * 0.8;
            }

            this.noiseSource = this.audioContext.createBufferSource();
            this.noiseSource.buffer = noiseBuffer;
            this.noiseSource.loop = true;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;

            this.noiseSource.connect(filter);
            filter.connect(this.gainNode);
            this.noiseSource.start();

        } else if (sound === 'forest') {
            // Forest: gentle rustling with occasional bird-like chirps
            const bufferSize = 3 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                // Gentle rustling
                output[i] = (Math.random() * 2 - 1) * 0.15;
                // Occasional chirps
                if (Math.random() < 0.00003) {
                    for (let j = 0; j < 2000 && i + j < bufferSize; j++) {
                        const chirpFreq = 2000 + Math.random() * 3000;
                        output[i + j] += Math.sin(j * chirpFreq / this.audioContext.sampleRate) *
                            Math.exp(-j / 500) * 0.3;
                    }
                }
            }

            this.noiseSource = this.audioContext.createBufferSource();
            this.noiseSource.buffer = noiseBuffer;
            this.noiseSource.loop = true;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 0.5;

            this.noiseSource.connect(filter);
            filter.connect(this.gainNode);
            this.noiseSource.start();
        }
    },

    loadCustomSound(file) {
        // Stop any currently playing sound
        this.stopSound();

        // Create a URL for the file
        if (this.customSoundUrl) {
            URL.revokeObjectURL(this.customSoundUrl);
        }
        this.customSoundUrl = URL.createObjectURL(file);

        // Update UI
        document.querySelectorAll('.sound-option').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('customSoundLabel')?.classList.add('active');

        // Show file name
        const nameEl = document.getElementById('customSoundName');
        if (nameEl) {
            nameEl.textContent = file.name;
        }

        // Play the custom sound
        this.currentSound = 'custom';
        this.currentAudio = new Audio(this.customSoundUrl);
        this.currentAudio.loop = true;
        this.currentAudio.volume = this.volume;
        this.currentAudio.play().catch(e => {
            console.log('Audio playback failed:', e.message);
            Toast.error('Could not play the audio file. Please try a different format.');
        });
    },

    // Extract YouTube video ID from various URL formats
    getYouTubeVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^#\&\?]*)/,
            /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    },

    playYouTubeAudio(url) {
        const videoId = this.getYouTubeVideoId(url);
        const statusEl = document.getElementById('youtubeStatus');

        if (!videoId) {
            if (statusEl) {
                statusEl.textContent = 'Invalid YouTube URL';
                statusEl.className = 'youtube-status error';
            }
            return;
        }

        // Stop any currently playing sound
        this.stopSound();

        // Update UI
        document.querySelectorAll('.sound-option').forEach(btn => {
            btn.classList.remove('active');
        });

        if (statusEl) {
            statusEl.textContent = '▶ Loading YouTube...';
            statusEl.className = 'youtube-status playing';
        }

        // Create YouTube player using IFrame API
        const container = document.getElementById('youtubeContainer');
        if (container) {
            // Create player element
            container.innerHTML = '<div id="youtubePlayer"></div>';

            // Load YouTube IFrame API if not already loaded
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(tag);

                // Wait for API to load
                window.onYouTubeIframeAPIReady = () => {
                    this.createYouTubePlayer(videoId);
                };
            } else {
                this.createYouTubePlayer(videoId);
            }

            this.youtubeActive = true;
            this.currentSound = 'youtube';
        }
    },

    createYouTubePlayer(videoId) {
        const statusEl = document.getElementById('youtubeStatus');

        this.youtubePlayer = new YT.Player('youtubePlayer', {
            height: '1',
            width: '1',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'loop': this.currentPlaylist ? 0 : 1, // Don't loop single video if in playlist mode
                'playlist': this.currentPlaylist ? undefined : videoId,
                'controls': 0
            },
            events: {
                'onReady': (event) => {
                    event.target.setVolume(this.volume * 100);
                    event.target.playVideo();
                    if (statusEl) {
                        statusEl.textContent = '▶ Loading...';
                        statusEl.className = 'youtube-status playing';
                    }
                },
                'onStateChange': (event) => {
                    const playPauseBtn = document.getElementById('audioPlayPause');
                    const playPauseMiniBtn = document.getElementById('playPauseMini');

                    // State 1 = playing - NOW duration is available
                    if (event.data === 1) {
                        // Start timeline update when video actually starts playing
                        this.startAudioTimelineUpdate();
                        this.audioPaused = false;
                        // Update button icons to show pause
                        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        if (playPauseMiniBtn) playPauseMiniBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        if (statusEl) {
                            statusEl.textContent = '▶ Playing from YouTube';
                            statusEl.className = 'youtube-status playing';
                        }
                    }
                    // State 2 = paused
                    if (event.data === 2) {
                        this.audioPaused = true;
                        // Update button icons to show play
                        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                        if (playPauseMiniBtn) playPauseMiniBtn.innerHTML = '<i class="fas fa-play"></i>';
                        if (statusEl) {
                            statusEl.textContent = '⏸ Paused';
                        }
                    }
                    // State 0 = ended
                    if (event.data === 0 && this.currentPlaylist) {
                        this.playNextTrack();
                    }
                },
                'onError': (event) => {
                    if (statusEl) {
                        statusEl.textContent = 'Error: Video unavailable';
                        statusEl.className = 'youtube-status error';
                    }
                }
            }
        });
    },

    stopYouTube() {
        // Destroy YouTube player if exists
        if (this.youtubePlayer && this.youtubePlayer.destroy) {
            this.youtubePlayer.destroy();
            this.youtubePlayer = null;
        }

        const container = document.getElementById('youtubeContainer');
        if (container) {
            container.innerHTML = '';
        }
        this.youtubeActive = false;

        const statusEl = document.getElementById('youtubeStatus');
        if (statusEl) {
            statusEl.textContent = '';
            statusEl.className = 'youtube-status';
        }
    },

    stopSound() {
        // Stop YouTube
        this.stopYouTube();

        // Stop generated noise
        if (this.noiseSource) {
            this.noiseSource.stop();
            this.noiseSource.disconnect();
            this.noiseSource = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.gainNode) {
            this.gainNode = null;
        }

        // Stop audio file
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    },

    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
        if (this.currentAudio) {
            this.currentAudio.volume = value;
        }
        // Control YouTube player volume
        if (this.youtubePlayer && this.youtubePlayer.setVolume) {
            this.youtubePlayer.setVolume(value * 100);
        }
    },

    // Notification
    showNotification(message) {
        // Simple notification - could be enhanced
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Mode', { body: message });
        }

        // Also show on screen
        const label = document.getElementById('focusTimerLabel');
        if (label) {
            const originalText = label.textContent;
            label.textContent = message;
            setTimeout(() => {
                label.textContent = this.isBreakMode ? 'BREAK TIME' : 'FOCUS TIME';
            }, 3000);
        }
    },

    // ==============================
    // Playlist Methods
    // ==============================

    async loadPlaylists() {
        try {
            // Load from localStorage first
            const saved = localStorage.getItem('focusPlaylists');
            this.playlists = saved ? JSON.parse(saved) : {};

            // If user is logged in, also fetch from Supabase and merge
            if (typeof SupabaseDB !== 'undefined') {
                const user = await SupabaseDB.getCurrentUser();
                if (user) {
                    const cloudPlaylists = await SupabaseDB.getPlaylists(user.id);
                    if (cloudPlaylists && cloudPlaylists.length > 0) {
                        // Merge cloud playlists with local (cloud takes precedence)
                        cloudPlaylists.forEach(pl => {
                            this.playlists[pl.id] = {
                                name: pl.name,
                                url: pl.url,
                                tracks: pl.tracks || this.playlists[pl.id]?.tracks || []
                            };
                        });
                        // Save merged result to localStorage
                        localStorage.setItem('focusPlaylists', JSON.stringify(this.playlists));
                    }
                }
            }

            this.updatePlaylistDropdown();
        } catch (e) {
            console.log('Error loading playlists:', e);
            this.playlists = {};
        }
    },

    async savePlaylists() {
        try {
            // Save to localStorage
            localStorage.setItem('focusPlaylists', JSON.stringify(this.playlists));

            // If user is logged in, sync to Supabase
            if (typeof SupabaseDB !== 'undefined') {
                const user = await SupabaseDB.getCurrentUser();
                if (user) {
                    // Sync each playlist to cloud (including tracks)
                    for (const [playlistId, playlist] of Object.entries(this.playlists)) {
                        await SupabaseDB.upsertPlaylist(user.id, {
                            id: playlistId,
                            name: playlist.name,
                            url: playlist.url || '',
                            tracks: playlist.tracks || []
                        });
                    }
                }
            }
        } catch (e) {
            console.log('Error saving playlists:', e);
        }
    },

    createNewPlaylist() {
        const name = prompt('Enter playlist name:');
        if (!name || name.trim() === '') return;

        const playlistId = 'pl_' + Date.now();
        this.playlists[playlistId] = {
            name: name.trim(),
            tracks: []
        };

        this.savePlaylists();
        this.updatePlaylistDropdown();

        // Select the new playlist
        const selectEl = document.getElementById('playlistSelect');
        if (selectEl) {
            selectEl.value = playlistId;
            this.selectPlaylist(playlistId);
        }
    },

    addToPlaylist(url) {
        const videoId = this.getYouTubeVideoId(url);
        if (!videoId) {
            Toast.warning('Invalid YouTube URL');
            return;
        }

        // Get current selected playlist or create a default one
        let playlistId = document.getElementById('playlistSelect')?.value;

        if (!playlistId) {
            // Create default playlist if none exists
            playlistId = 'pl_default';
            if (!this.playlists[playlistId]) {
                this.playlists[playlistId] = {
                    name: 'My Focus Mix',
                    tracks: []
                };
                this.updatePlaylistDropdown();
            }
            document.getElementById('playlistSelect').value = playlistId;
            this.currentPlaylist = playlistId;
        }

        // Add track
        const track = {
            id: videoId,
            url: url,
            title: `Track ${this.playlists[playlistId].tracks.length + 1}` // Will be updated with actual title
        };

        this.playlists[playlistId].tracks.push(track);
        this.savePlaylists();
        this.renderPlaylistTracks(playlistId);

        // Clear input
        const input = document.getElementById('youtubeUrlInput');
        if (input) input.value = '';

        // Show confirmation
        const statusEl = document.getElementById('youtubeStatus');
        if (statusEl) {
            statusEl.textContent = '✓ Added to playlist';
            statusEl.className = 'youtube-status playing';
            setTimeout(() => {
                statusEl.textContent = '';
            }, 2000);
        }
    },

    removeFromPlaylist(playlistId, trackIndex) {
        if (!this.playlists[playlistId]) return;

        this.playlists[playlistId].tracks.splice(trackIndex, 1);
        this.savePlaylists();
        this.renderPlaylistTracks(playlistId);
    },

    selectPlaylist(playlistId) {
        this.currentPlaylist = playlistId;
        this.currentTrackIndex = 0;
        this.renderPlaylistTracks(playlistId);
    },

    renderPlaylistTracks(playlistId) {
        const container = document.getElementById('playlistTracks');
        if (!container) return;

        if (!playlistId || !this.playlists[playlistId]) {
            container.innerHTML = '<div class="playlist-empty">Select or create a playlist</div>';
            return;
        }

        const playlist = this.playlists[playlistId];

        if (playlist.tracks.length === 0) {
            container.innerHTML = '<div class="playlist-empty">No tracks. Paste a YouTube URL and click + to add.</div>';
            return;
        }

        container.innerHTML = playlist.tracks.map((track, index) => `
            <div class="playlist-track ${index === this.currentTrackIndex && this.currentSound === 'youtube' ? 'playing' : ''}" data-index="${index}">
                <button class="playlist-track-btn play" onclick="FocusMode.playTrack(${index})">
                    <i class="fas fa-play"></i>
                </button>
                <span class="playlist-track-title" onclick="FocusMode.renameTrack(${index})" style="cursor: pointer;" title="Click to rename">${track.name || track.title || 'Track ' + (index + 1)}</span>
                <button class="playlist-track-btn delete" onclick="FocusMode.removeFromPlaylist('${playlistId}', ${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    updatePlaylistDropdown() {
        const selectEl = document.getElementById('playlistSelect');
        const selectMini = document.getElementById('playlistSelectMini');

        const currentValue = selectEl?.value || '';
        const currentValueMini = selectMini?.value || '';

        // Update main panel dropdown
        if (selectEl) {
            selectEl.innerHTML = '<option value="">-- Select Playlist --</option>';
            Object.keys(this.playlists).forEach(playlistId => {
                const playlist = this.playlists[playlistId];
                const option = document.createElement('option');
                option.value = playlistId;
                option.textContent = `${playlist.name} (${playlist.tracks.length})`;
                selectEl.appendChild(option);
            });
            if (currentValue && this.playlists[currentValue]) {
                selectEl.value = currentValue;
            }
        }

        // Also update mini panel dropdown
        if (selectMini) {
            selectMini.innerHTML = '<option value="">-- Select Playlist --</option>';
            Object.keys(this.playlists).forEach(playlistId => {
                const playlist = this.playlists[playlistId];
                const option = document.createElement('option');
                option.value = playlistId;
                option.textContent = `${playlist.name} (${playlist.tracks.length})`;
                selectMini.appendChild(option);
            });
            if (currentValueMini && this.playlists[currentValueMini]) {
                selectMini.value = currentValueMini;
            } else if (this.currentPlaylist) {
                selectMini.value = this.currentPlaylist;
            }
        }

        // Also render tracks in mini panel
        this.renderPlaylistTracksMini();
    },

    renderPlaylistTracksMini() {
        const container = document.getElementById('playlistTracksMini');
        if (!container) return;

        const playlistId = this.currentPlaylist;
        if (!playlistId || !this.playlists[playlistId]) {
            container.innerHTML = '<div class="playlist-empty-mini">Select a playlist</div>';
            return;
        }

        const tracks = this.playlists[playlistId].tracks;
        if (tracks.length === 0) {
            container.innerHTML = '<div class="playlist-empty-mini">No tracks yet</div>';
            return;
        }

        container.innerHTML = tracks.map((track, index) => `
            <div class="track-item-mini ${index === this.currentTrackIndex ? 'active' : ''}" data-index="${index}">
                <i class="fas fa-play" onclick="FocusMode.playTrack(${index})"></i>
                <span onclick="FocusMode.renameTrack(${index})">${track.name || track.title || 'Track ' + (index + 1)}</span>
                <i class="fas fa-times" onclick="FocusMode.removeFromPlaylist('${playlistId}', ${index})"></i>
            </div>
        `).join('');
    },

    playTrack(index) {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) return;

        const tracks = this.playlists[this.currentPlaylist].tracks;
        if (index < 0 || index >= tracks.length) return;

        this.currentTrackIndex = index;
        const track = tracks[index];
        this.playYouTubeAudio(track.url);
        this.renderPlaylistTracks(this.currentPlaylist);
        this.renderPlaylistTracksMini();

        // Check if we're resuming from a refresh and need to seek to saved position
        if (this.pendingAudioResume && this.pendingAudioResume.needsSeek && this.pendingAudioResume.trackIndex === index) {
            // Wait for player to be ready, then seek
            setTimeout(() => {
                this.resumePlaybackPosition();
                this.pendingAudioResume = null;
            }, 2500);
        }
    },

    playPlaylist() {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) {
            Toast.warning('Please select a playlist first');
            return;
        }

        const tracks = this.playlists[this.currentPlaylist].tracks;
        if (tracks.length === 0) {
            Toast.warning('Playlist is empty. Add some tracks first.');
            return;
        }

        if (this.isShuffleMode) {
            this.currentTrackIndex = Math.floor(Math.random() * tracks.length);
        } else {
            this.currentTrackIndex = 0;
        }

        this.playTrack(this.currentTrackIndex);
    },

    playNextTrack() {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) return;

        const tracks = this.playlists[this.currentPlaylist].tracks;
        if (tracks.length === 0) return;

        if (this.isShuffleMode) {
            this.currentTrackIndex = Math.floor(Math.random() * tracks.length);
        } else {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % tracks.length;
        }

        this.playTrack(this.currentTrackIndex);
    },

    toggleShuffle() {
        this.isShuffleMode = !this.isShuffleMode;
        const btn = document.getElementById('shufflePlaylistBtn');
        if (btn) {
            btn.classList.toggle('active', this.isShuffleMode);
        }
    },

    playPreviousTrack() {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) return;

        const tracks = this.playlists[this.currentPlaylist].tracks;
        if (tracks.length === 0) return;

        if (this.isShuffleMode) {
            this.currentTrackIndex = Math.floor(Math.random() * tracks.length);
        } else {
            this.currentTrackIndex = (this.currentTrackIndex - 1 + tracks.length) % tracks.length;
        }

        this.playTrack(this.currentTrackIndex);
    },

    toggleAudioPause() {
        const playPauseBtn = document.getElementById('audioPlayPause');
        const playPauseMiniBtn = document.getElementById('playPauseMini');

        // Helper to update both buttons
        const updateButtons = (isPaused) => {
            const icon = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
            if (playPauseBtn) playPauseBtn.innerHTML = icon;
            if (playPauseMiniBtn) playPauseMiniBtn.innerHTML = icon;
        };

        // Toggle YouTube player
        if (this.youtubePlayer) {
            const state = this.youtubePlayer.getPlayerState ? this.youtubePlayer.getPlayerState() : -1;
            if (state === 1) { // Playing
                this.youtubePlayer.pauseVideo();
                this.audioPaused = true;
                updateButtons(true);
            } else {
                this.youtubePlayer.playVideo();
                this.audioPaused = false;
                updateButtons(false);
            }
        }

        // Toggle native audio
        if (this.currentAudio) {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
                this.audioPaused = false;
                updateButtons(false);
            } else {
                this.currentAudio.pause();
                this.audioPaused = true;
                updateButtons(true);
            }
        }
    },

    // ==============================
    // Video Playlist Methods
    // ==============================

    async loadVideoPlaylists() {
        try {
            // Load from localStorage first
            const stored = localStorage.getItem('focusVideoPlaylists');
            this.videoPlaylists = stored ? JSON.parse(stored) : {};

            // If user is logged in, also fetch from Supabase and merge
            if (typeof SupabaseDB !== 'undefined') {
                const user = await SupabaseDB.getCurrentUser();
                if (user) {
                    const cloudPlaylists = await SupabaseDB.getVideoPlaylists(user.id);
                    if (cloudPlaylists && cloudPlaylists.length > 0) {
                        cloudPlaylists.forEach(pl => {
                            this.videoPlaylists[pl.id] = {
                                name: pl.name,
                                videos: pl.videos || this.videoPlaylists[pl.id]?.videos || []
                            };
                        });
                        localStorage.setItem('focusVideoPlaylists', JSON.stringify(this.videoPlaylists));
                    }
                }
            }

            this.updateVideoPlaylistDropdown();
        } catch (e) {
            console.log('Error loading video playlists:', e);
        }
    },

    async saveVideoPlaylists() {
        try {
            // Save to localStorage
            localStorage.setItem('focusVideoPlaylists', JSON.stringify(this.videoPlaylists));

            // If user is logged in, sync to Supabase
            if (typeof SupabaseDB !== 'undefined') {
                const user = await SupabaseDB.getCurrentUser();
                if (user) {
                    for (const [playlistId, playlist] of Object.entries(this.videoPlaylists)) {
                        await SupabaseDB.upsertVideoPlaylist(user.id, {
                            id: playlistId,
                            name: playlist.name,
                            videos: playlist.videos || []
                        });
                    }
                }
            }
        } catch (e) {
            console.log('Error saving video playlists:', e);
        }
    },

    createVideoPlaylist() {
        const name = prompt('Enter video playlist name:');
        if (!name || name.trim() === '') return;

        const playlistId = 'vpl_' + Date.now();
        this.videoPlaylists[playlistId] = {
            name: name.trim(),
            videos: []
        };

        this.saveVideoPlaylists();
        this.updateVideoPlaylistDropdown();

        // Select the new playlist
        const selectEl = document.getElementById('videoPlaylistSelect');
        if (selectEl) {
            selectEl.value = playlistId;
            this.selectVideoPlaylist(playlistId);
        }
    },

    addVideoToPlaylist(url) {
        const videoId = this.getYouTubeVideoId(url);
        if (!videoId) {
            Toast.warning('Invalid YouTube URL');
            return;
        }

        let playlistId = document.getElementById('videoPlaylistSelect')?.value;

        if (!playlistId) {
            // Create default playlist
            playlistId = 'vpl_default';
            if (!this.videoPlaylists[playlistId]) {
                this.videoPlaylists[playlistId] = {
                    name: 'My Video Mix',
                    videos: []
                };
                this.updateVideoPlaylistDropdown();
            }
            document.getElementById('videoPlaylistSelect').value = playlistId;
            this.currentVideoPlaylist = playlistId;
        }

        // Add video with default name
        const video = {
            id: videoId,
            url: url,
            name: `Video ${this.videoPlaylists[playlistId].videos.length + 1}`
        };

        this.videoPlaylists[playlistId].videos.push(video);
        this.saveVideoPlaylists();
        this.renderVideoPlaylistTracks();
    },

    updateVideoPlaylistDropdown() {
        const select = document.getElementById('videoPlaylistSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Playlist --</option>';
        Object.keys(this.videoPlaylists).forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${this.videoPlaylists[id].name} (${this.videoPlaylists[id].videos.length})`;
            select.appendChild(option);
        });
    },

    selectVideoPlaylist(playlistId) {
        this.currentVideoPlaylist = playlistId;
        this.currentVideoIndex = 0;
        this.renderVideoPlaylistTracks();
    },

    renderVideoPlaylistTracks() {
        const container = document.getElementById('videoPlaylistTracks');
        if (!container) return;

        if (!this.currentVideoPlaylist || !this.videoPlaylists[this.currentVideoPlaylist]) {
            container.innerHTML = '<div class="playlist-empty">No videos yet</div>';
            return;
        }

        const videos = this.videoPlaylists[this.currentVideoPlaylist].videos;
        if (videos.length === 0) {
            container.innerHTML = '<div class="playlist-empty">No videos yet</div>';
            return;
        }

        container.innerHTML = videos.map((v, index) => `
            <div class="video-track-item" data-index="${index}">
                <i class="fas fa-play" onclick="FocusMode.playVideoAtIndex(${index})"></i>
                <span class="track-name" onclick="FocusMode.renameVideoTrack(${index})">${v.name}</span>
                <button onclick="FocusMode.removeVideoFromPlaylist(${index})" title="Remove"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    },

    playVideoPlaylist() {
        if (!this.currentVideoPlaylist || !this.videoPlaylists[this.currentVideoPlaylist]) return;

        const videos = this.videoPlaylists[this.currentVideoPlaylist].videos;
        if (videos.length === 0) return;

        this.currentVideoIndex = this.isVideoShuffleMode
            ? Math.floor(Math.random() * videos.length)
            : 0;

        this.playVideoAtIndex(this.currentVideoIndex);
    },

    playVideoAtIndex(index) {
        const videos = this.videoPlaylists[this.currentVideoPlaylist]?.videos;
        if (!videos || !videos[index]) return;

        this.currentVideoIndex = index;
        this.setVideoBackground(videos[index].url);
    },

    toggleVideoShuffle() {
        this.isVideoShuffleMode = !this.isVideoShuffleMode;
        const btn = document.getElementById('shuffleVideoPlaylistBtn');
        if (btn) {
            btn.classList.toggle('active', this.isVideoShuffleMode);
        }
    },

    removeVideoFromPlaylist(index) {
        if (!this.currentVideoPlaylist) return;
        this.videoPlaylists[this.currentVideoPlaylist].videos.splice(index, 1);
        this.saveVideoPlaylists();
        this.renderVideoPlaylistTracks();
    },

    renameVideoPlaylist() {
        if (!this.currentVideoPlaylist) {
            Toast.warning('Please select a playlist first');
            return;
        }
        const playlist = this.videoPlaylists[this.currentVideoPlaylist];
        const newName = prompt('Enter new playlist name:', playlist.name);
        if (newName && newName.trim()) {
            playlist.name = newName.trim();
            this.saveVideoPlaylists();
            this.updateVideoPlaylistDropdown();
            document.getElementById('videoPlaylistSelect').value = this.currentVideoPlaylist;
        }
    },

    renameVideoTrack(index) {
        if (!this.currentVideoPlaylist) return;
        const video = this.videoPlaylists[this.currentVideoPlaylist].videos[index];
        const newName = prompt('Enter new name:', video.name);
        if (newName && newName.trim()) {
            video.name = newName.trim();
            this.saveVideoPlaylists();
            this.renderVideoPlaylistTracks();
        }
    },

    // ==============================
    // Draggable Toggle Button
    // ==============================

    initDraggableButton() {
        const btn = document.getElementById('toggleAudioPanelBtn');
        if (!btn) return;

        let isDragging = false;
        let startX, startY, initialX, initialY;
        let hasMoved = false;

        // Restore saved position
        const savedPos = localStorage.getItem('audioPanelBtnPos');
        if (savedPos) {
            try {
                const pos = JSON.parse(savedPos);
                btn.style.top = pos.top + 'px';
                btn.style.right = 'auto';
                btn.style.left = pos.left + 'px';
            } catch (e) { }
        }

        const onStart = (e) => {
            isDragging = true;
            hasMoved = false;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            const rect = btn.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            btn.style.cursor = 'grabbing';
            e.preventDefault();
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved = true;
            }

            let newX = initialX + dx;
            let newY = initialY + dy;

            // Keep within bounds
            newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
            newY = Math.max(0, Math.min(window.innerHeight - 60, newY));

            btn.style.right = 'auto';
            btn.style.left = newX + 'px';
            btn.style.top = newY + 'px';
        };

        const onEnd = () => {
            if (isDragging) {
                isDragging = false;
                btn.style.cursor = 'grab';

                // Save position
                const rect = btn.getBoundingClientRect();
                localStorage.setItem('audioPanelBtnPos', JSON.stringify({
                    left: rect.left,
                    top: rect.top
                }));
            }
        };

        // Mouse events
        btn.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Touch events
        btn.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);

        // Style
        btn.style.cursor = 'grab';
    },

    // ==============================
    // Audio Playlist Rename Methods
    // ==============================

    renamePlaylist() {
        if (!this.currentPlaylist) {
            Toast.warning('Please select a playlist first');
            return;
        }
        const playlist = this.playlists[this.currentPlaylist];
        const newName = prompt('Enter new playlist name:', playlist.name);
        if (newName && newName.trim()) {
            playlist.name = newName.trim();
            this.savePlaylists();
            this.updatePlaylistDropdown();
            document.getElementById('playlistSelect').value = this.currentPlaylist;
        }
    },

    renameTrack(index) {
        if (!this.currentPlaylist) return;
        const track = this.playlists[this.currentPlaylist].tracks[index];
        const newName = prompt('Enter new name:', track.name);
        if (newName && newName.trim()) {
            track.name = newName.trim();
            this.savePlaylists();
            this.renderPlaylistTracks();
        }
    },

    // ==============================
    // State Persistence Methods
    // ==============================

    saveState() {
        const state = {
            isActive: this.isActive,
            task: this.currentTask,
            subtask: this.currentSubtask,
            totalSeconds: this.totalSeconds,
            remainingSeconds: this.remainingSeconds,
            isBreakMode: this.isBreakMode,
            breakDuration: this.breakDuration,
            // Animation and video state
            currentAnimation: this.currentAnimation,
            videoBgActive: this.videoBgActive,
            currentVideoBgUrl: this.currentVideoBgUrl || '',
            // Audio state
            currentPlaylist: this.currentPlaylist,
            currentTrackIndex: this.currentTrackIndex,
            volume: this.volume
        };
        sessionStorage.setItem('focusModeState', JSON.stringify(state));
    },

    saveAnimationState() {
        // Save animation state separately to localStorage for persistence across sessions
        localStorage.setItem('focusAnimationState', JSON.stringify({
            currentAnimation: this.currentAnimation,
            videoBgActive: this.videoBgActive,
            currentVideoBgUrl: this.currentVideoBgUrl || ''
        }));
    },

    // Save subtask timer states to localStorage for persistence across page navigation
    saveSubtaskTimerStates() {
        try {
            // Clean up old entries (older than 24 hours) to prevent localStorage bloat
            const now = Date.now();
            const cleanedStates = {};
            for (const key in this.subtaskTimerStates) {
                const state = this.subtaskTimerStates[key];
                // Keep entries that are less than 24 hours old
                if (state.savedAt && (now - state.savedAt) < 24 * 60 * 60 * 1000) {
                    cleanedStates[key] = state;
                }
            }
            this.subtaskTimerStates = cleanedStates;
            localStorage.setItem('subtaskTimerStates', JSON.stringify(this.subtaskTimerStates));
        } catch (e) {
            console.log('Error saving subtask timer states:', e);
        }
    },

    // Load subtask timer states from localStorage
    loadSubtaskTimerStates() {
        try {
            const saved = localStorage.getItem('subtaskTimerStates');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with existing in-memory states (in-memory takes precedence for current session)
                this.subtaskTimerStates = { ...parsed, ...this.subtaskTimerStates };

                // Clean up old entries while loading
                const now = Date.now();
                for (const key in this.subtaskTimerStates) {
                    const state = this.subtaskTimerStates[key];
                    if (state.savedAt && (now - state.savedAt) > 24 * 60 * 60 * 1000) {
                        delete this.subtaskTimerStates[key];
                    }
                }
            }
        } catch (e) {
            console.log('Error loading subtask timer states:', e);
            this.subtaskTimerStates = {};
        }
    },

    // Clear a specific subtask's timer state (called when subtask is completed)
    clearSubtaskTimerState(taskId, subtaskTitle) {
        const timerKey = `${taskId}_${subtaskTitle}`;
        delete this.subtaskTimerStates[timerKey];
        this.saveSubtaskTimerStates();
    },

    clearState() {
        sessionStorage.removeItem('focusModeState');
    },

    restoreState() {
        try {
            const saved = sessionStorage.getItem('focusModeState');
            if (!saved) return;

            const state = JSON.parse(saved);
            if (!state.isActive) return;

            // Restore state
            this.currentTask = state.task;
            this.currentSubtask = state.subtask;
            this.totalSeconds = state.totalSeconds;
            this.remainingSeconds = state.remainingSeconds;
            this.isBreakMode = state.isBreakMode;
            this.breakDuration = state.breakDuration;

            // Restore animation/video state
            if (state.currentAnimation) {
                this.currentAnimation = state.currentAnimation;
            }
            if (state.volume !== undefined) {
                this.volume = state.volume;
                // Update volume sliders
                const volumeSlider = document.getElementById('focusVolumeSlider');
                const volumeSliderMini = document.getElementById('volumeSliderMini');
                if (volumeSlider) volumeSlider.value = this.volume * 100;
                if (volumeSliderMini) volumeSliderMini.value = this.volume * 100;
            }

            // Store playlist state to restore after a delay (to ensure playlists are loaded)
            const savedPlaylist = state.currentPlaylist;
            const savedTrackIndex = state.currentTrackIndex || 0;

            // Update UI
            this.updateTaskInfo();
            this.updateTimerDisplay();
            this.updateProgress(this.remainingSeconds / this.totalSeconds);

            // Show focus mode
            document.getElementById('focusMode').classList.add('active');
            document.body.style.overflow = 'hidden';
            this.isActive = true;
            this.isPaused = true;

            if (this.isBreakMode) {
                document.getElementById('focusMode')?.classList.add('break-mode');
                document.getElementById('focusBreakBtn')?.classList.add('active');
                document.querySelector('.break-duration-selector')?.classList.add('active');
            }

            // Restore video background or start animation
            if (state.videoBgActive && state.currentVideoBgUrl) {
                this.setVideoBackground(state.currentVideoBgUrl);
            } else {
                // Update animation option buttons
                document.querySelectorAll('.animation-option').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.animation === this.currentAnimation);
                });
                this.startAnimation();
            }

            // Restore audio playlist after a short delay to ensure playlists are loaded
            // This handles both sync (localStorage) and async (Supabase) loading
            setTimeout(() => {
                this.restoreAudioPlayback(savedPlaylist, savedTrackIndex);
            }, 500);

            this.showRandomQuote();
            this.startQuoteRotation();

            // Remove the focus mode preload flag - focus mode is now properly active
            // (The CSS rules are no longer needed since JS has taken over)
            document.documentElement.removeAttribute('data-focus-active');

            console.log('Focus mode restored after refresh');
        } catch (e) {
            console.log('Error restoring focus state:', e);
            // Remove preload flag on error so content is visible
            document.documentElement.removeAttribute('data-focus-active');
        }
    },

    // Helper method to restore audio playback after refresh
    restoreAudioPlayback(playlistId, trackIndex) {
        try {
            if (!playlistId) return;

            // Check if playlist exists
            if (!this.playlists[playlistId]) {
                console.log('Playlist not found for restore:', playlistId);
                return;
            }

            // Set the current playlist
            this.currentPlaylist = playlistId;
            this.currentTrackIndex = trackIndex;

            // Update dropdown selections
            const selectEl = document.getElementById('playlistSelect');
            const selectMini = document.getElementById('playlistSelectMini');

            if (selectEl) {
                selectEl.value = playlistId;
            }
            if (selectMini) {
                selectMini.value = playlistId;
            }

            // Render the playlist tracks
            this.renderPlaylistTracks(playlistId);
            this.renderPlaylistTracksMini();

            // Check if there was a track to restore
            const tracks = this.playlists[playlistId].tracks;
            if (tracks && tracks.length > 0 && trackIndex >= 0 && trackIndex < tracks.length) {
                const trackName = tracks[trackIndex].name || tracks[trackIndex].title || `Track ${trackIndex + 1}`;
                console.log(`Attempting to auto-play track ${trackIndex + 1}: "${trackName}"`);

                // Store pending resume info
                this.pendingAudioResume = {
                    trackIndex: trackIndex,
                    needsSeek: true
                };

                // Try to auto-play (might be blocked by browser)
                this.playTrack(trackIndex);

                // Show a click overlay in case autoplay is blocked
                // This gives user an easy way to enable audio with one click anywhere
                this.showAudioEnableOverlay(trackName);
            }
        } catch (e) {
            console.log('Error restoring audio playback:', e);
        }
    },

    // Show an overlay that enables audio with a single click
    showAudioEnableOverlay(trackName) {
        // Check if overlay already exists
        if (document.getElementById('audioEnableOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'audioEnableOverlay';
        overlay.innerHTML = `
            <div class="audio-enable-content">
                <i class="fas fa-music"></i>
                <p>Click anywhere to resume audio</p>
                <span class="audio-track-name">${trackName}</span>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
            animation: fadeIn 0.3s ease;
        `;

        const style = document.createElement('style');
        style.id = 'audioOverlayStyles';
        style.textContent = `
            .audio-enable-content {
                text-align: center;
                color: white;
                padding: 2rem;
                border-radius: 20px;
                background: rgba(124, 58, 237, 0.3);
                border: 1px solid rgba(124, 58, 237, 0.5);
            }
            .audio-enable-content i {
                font-size: 3rem;
                margin-bottom: 1rem;
                color: #a78bfa;
                animation: pulse 2s infinite;
            }
            .audio-enable-content p {
                font-size: 1.25rem;
                margin-bottom: 0.5rem;
            }
            .audio-track-name {
                font-size: 0.875rem;
                color: rgba(255,255,255,0.6);
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        const removeOverlay = () => {
            overlay.remove();
            document.getElementById('audioOverlayStyles')?.remove();

            // If audio wasn't playing yet, start it now
            if (this.pendingAudioResume) {
                this.playTrack(this.pendingAudioResume.trackIndex);
            }
        };

        overlay.addEventListener('click', removeOverlay, { once: true });

        // Auto-remove overlay after 3 seconds if audio started playing successfully
        setTimeout(() => {
            if (document.getElementById('audioEnableOverlay')) {
                // Check if audio is actually playing
                if (this.youtubePlayer && !this.audioPaused) {
                    removeOverlay();
                }
            }
        }, 3000);

        document.body.appendChild(overlay);
    },

    // ==============================
    // Audio Skip & Timeline Methods
    // ==============================

    skipAudio(seconds) {
        // Skip YouTube player
        if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
            const currentTime = this.youtubePlayer.getCurrentTime();
            const duration = this.youtubePlayer.getDuration();
            const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
            this.youtubePlayer.seekTo(newTime, true);
        }
        // Skip native audio
        if (this.currentAudio) {
            this.currentAudio.currentTime = Math.max(0, Math.min(this.currentAudio.duration, this.currentAudio.currentTime + seconds));
        }
    },

    seekAudio(percentage) {
        const percent = parseFloat(percentage) / 100;

        // Seek YouTube player
        if (this.youtubePlayer && this.youtubePlayer.getDuration) {
            const duration = this.youtubePlayer.getDuration();
            this.youtubePlayer.seekTo(duration * percent, true);
        }
        // Seek native audio
        if (this.currentAudio && this.currentAudio.duration) {
            this.currentAudio.currentTime = this.currentAudio.duration * percent;
        }
    },

    startAudioTimelineUpdate() {
        // Clear existing interval
        if (this.audioTimelineInterval) {
            clearInterval(this.audioTimelineInterval);
        }

        this.audioTimelineInterval = setInterval(() => {
            let currentTime = 0;
            let duration = 0;

            // Get from YouTube player
            if (this.youtubePlayer && typeof this.youtubePlayer.getCurrentTime === 'function') {
                try {
                    currentTime = this.youtubePlayer.getCurrentTime() || 0;
                    duration = this.youtubePlayer.getDuration() || 0;
                } catch (e) {
                    // Player may not be ready
                }
            }
            // Get from native audio
            else if (this.currentAudio) {
                currentTime = this.currentAudio.currentTime || 0;
                duration = this.currentAudio.duration || 0;
            }

            // Update time displays
            const currentTimeEl = document.getElementById('audioCurrentTime');
            const durationEl = document.getElementById('audioDuration');
            const progressBar = document.getElementById('audioProgress');

            // Mini panel elements (floating Audio Controls panel) - use correct IDs
            const miniCurrentEl = document.getElementById('audioTimeMini');
            const miniDurationEl = document.getElementById('audioDurationMini');
            const miniProgress = document.getElementById('audioProgressMini');

            if (duration > 0) {
                // Update progress bar (main panel)
                if (progressBar) {
                    progressBar.value = (currentTime / duration) * 100;
                }

                // Update time display in main panel
                if (currentTimeEl) currentTimeEl.textContent = this.formatTime(currentTime);
                if (durationEl) durationEl.textContent = this.formatTime(duration);

                // Update floating mini panel timeline
                if (miniCurrentEl) miniCurrentEl.textContent = this.formatTime(currentTime);
                if (miniDurationEl) miniDurationEl.textContent = this.formatTime(duration);
                if (miniProgress) miniProgress.value = (currentTime / duration) * 100;
            } else {
                // Show loading state if duration not yet available
                if (durationEl) durationEl.textContent = '--:--';
                if (miniDurationEl) miniDurationEl.textContent = '--:--';
            }
        }, 500);
    },

    stopAudioTimelineUpdate() {
        if (this.audioTimelineInterval) {
            clearInterval(this.audioTimelineInterval);
            this.audioTimelineInterval = null;
        }
    },

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // ==============================
    // Video Background Methods
    // ==============================

    setVideoBackground(url) {
        const videoId = this.getYouTubeVideoId(url);
        if (!videoId) {
            Toast.warning('Please enter a valid YouTube URL');
            return;
        }

        // Save URL for persistence
        this.currentVideoBgUrl = url;

        // Stop canvas animation
        this.stopAnimation();

        // Hide canvas
        const canvas = document.getElementById('focusAnimationCanvas');
        if (canvas) canvas.style.display = 'none';

        // Create YouTube iframe for video background (in the visible video bg container)
        const container = document.getElementById('youtubeVideoBg');
        if (container) {
            container.innerHTML = `
                <iframe 
                    id="videoBgIframe"
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1"
                    frameborder="0"
                    allow="autoplay; encrypted-media"
                    allowfullscreen
                ></iframe>
            `;
            container.classList.add('active');
        }

        this.videoBgActive = true;

        // Save state for persistence
        this.saveAnimationState();
        this.saveState();
    },

    uploadVideoBackground(file) {
        if (!file.type.startsWith('video/')) {
            Toast.warning('Please upload a video file');
            return;
        }

        const videoPlayer = document.getElementById('videoBgPlayer');
        const canvas = document.getElementById('focusAnimationCanvas');

        if (videoPlayer) {
            const url = URL.createObjectURL(file);
            videoPlayer.src = url;
            videoPlayer.classList.add('active');
            videoPlayer.play();

            if (canvas) canvas.style.display = 'none';
            this.stopAnimation();
            this.videoBgActive = true;
        }
    },

    clearVideoBackground() {
        const videoPlayer = document.getElementById('videoBgPlayer');
        const canvas = document.getElementById('focusAnimationCanvas');
        const youtubeVideoBg = document.getElementById('youtubeVideoBg');

        if (videoPlayer) {
            videoPlayer.src = '';
            videoPlayer.classList.remove('active');
        }

        if (youtubeVideoBg) {
            youtubeVideoBg.innerHTML = '';
            youtubeVideoBg.classList.remove('active');
        }

        if (canvas) {
            canvas.style.display = 'block';
        }

        this.videoBgActive = false;
        this.startAnimation();

        const urlInput = document.getElementById('videoBgUrl');
        if (urlInput) urlInput.value = '';
    },

    // ==============================
    // Interval Alert Methods
    // ==============================

    startIntervalAlerts() {
        this.stopIntervalAlerts();

        const minutes = parseInt(document.getElementById('intervalMinutes')?.value) || 15;
        const intervalMs = minutes * 60 * 1000;

        this.intervalAlertTimer = setInterval(() => {
            if (!this.isPaused && this.isActive) {
                this.playAlertSound();
            }
        }, intervalMs);
    },

    stopIntervalAlerts() {
        if (this.intervalAlertTimer) {
            clearInterval(this.intervalAlertTimer);
            this.intervalAlertTimer = null;
        }
    },

    playAlertSound() {
        const soundType = document.getElementById('alertSoundSelect')?.value || 'chime';

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.3;
        gainNode.connect(audioCtx.destination);

        if (soundType === 'chime') {
            // Chime - ascending notes
            [523, 659, 784].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                osc.frequency.value = freq;
                osc.type = 'sine';
                const env = audioCtx.createGain();
                env.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.15);
                env.gain.exponentialDecayTo && env.gain.exponentialDecayTo(0.001, 0.5);
                osc.connect(env);
                env.connect(gainNode);
                osc.start(audioCtx.currentTime + i * 0.15);
                osc.stop(audioCtx.currentTime + i * 0.15 + 0.5);
            });
        } else if (soundType === 'bell') {
            // Bell - single rich tone
            const osc = audioCtx.createOscillator();
            osc.frequency.value = 880;
            osc.type = 'sine';
            osc.connect(gainNode);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
        } else if (soundType === 'gong') {
            // Gong - low rumble
            const osc = audioCtx.createOscillator();
            osc.frequency.value = 100;
            osc.type = 'triangle';
            osc.connect(gainNode);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.5);
        } else if (soundType === 'water') {
            // Water drop - descending blip
            const osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
            osc.type = 'sine';
            osc.connect(gainNode);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } else if (soundType === 'bird') {
            // Bird chirp - quick ascending notes
            [1500, 2000, 1800].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                osc.frequency.value = freq;
                osc.type = 'sine';
                osc.connect(gainNode);
                osc.start(audioCtx.currentTime + i * 0.08);
                osc.stop(audioCtx.currentTime + i * 0.08 + 0.1);
            });
        } else if (soundType === 'bowl') {
            // Singing bowl - sustained harmonic
            [256, 512, 768].forEach((freq) => {
                const osc = audioCtx.createOscillator();
                osc.frequency.value = freq;
                osc.type = 'sine';
                const env = audioCtx.createGain();
                env.gain.setValueAtTime(0.2, audioCtx.currentTime);
                osc.connect(env);
                env.connect(gainNode);
                osc.start();
                osc.stop(audioCtx.currentTime + 2);
            });
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    FocusMode.init();
});

// Expose globally
window.FocusMode = FocusMode;
