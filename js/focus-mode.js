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

        // Break duration options
        document.querySelectorAll('.break-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setBreakDuration(minutes);
            });
        });

        // Settings panels
        document.getElementById('focusSoundBtn')?.addEventListener('click', () => this.togglePanel('sound'));
        document.getElementById('focusAnimationBtn')?.addEventListener('click', () => this.togglePanel('animation'));

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
        this.currentTask = task;
        this.currentSubtask = subtask;

        // Calculate total time
        let hours = 0, minutes = 0;
        if (subtask && subtask.hours !== undefined) {
            hours = subtask.hours || 0;
            minutes = subtask.minutes || 0;
        } else if (task) {
            hours = task.hours || 0;
            minutes = task.minutes || 0;
        }

        this.totalSeconds = (hours * 60 + minutes) * 60;
        this.remainingSeconds = this.totalSeconds;

        // Update UI
        this.updateTaskInfo();
        this.updateTimerDisplay();
        this.updateProgress(1);

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

    close() {
        this.pauseTimer();
        this.stopAnimation();
        this.stopQuoteRotation();
        this.stopSound();

        document.getElementById('focusMode').classList.remove('active');
        document.body.style.overflow = '';
        this.isActive = false;
        this.closePanels();

        // Clear saved state
        this.clearState();
    },

    updateTaskInfo() {
        const titleEl = document.getElementById('focusTaskTitle');
        const subtaskEl = document.getElementById('focusSubtaskTitle');

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

    pauseTimer() {
        this.isPaused = true;
        this.animationPaused = true; // Pause animation when timer is paused
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.updateStartButton();
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
            // Focus complete
            this.showNotification('Great job! Session complete! 🎉');
            // Optionally mark task as complete
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

        // Restart animation
        this.stopAnimation();
        this.startAnimation();
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
        // Use reliable public domain audio sources
        // These are from SoundBible and other free audio CDNs
        const soundUrls = {
            'rain': 'https://soundbible.com/mp3/Rain-SoundBible.com-1655499074.mp3',
            'fire': 'https://soundbible.com/mp3/Campfire-SoundBible.com-767541069.mp3',
            'ocean': 'https://soundbible.com/mp3/Ocean_Waves-Mike_Koenig-980635527.mp3',
            'forest': 'https://soundbible.com/mp3/bird-forest-ambient.mp3'
        };

        const url = soundUrls[sound];
        if (!url) return;

        this.currentAudio = new Audio(url);
        this.currentAudio.crossOrigin = 'anonymous';
        this.currentAudio.loop = true;
        this.currentAudio.volume = this.volume;
        this.currentAudio.play().catch(e => {
            console.log('Audio playback failed:', e.message);
            // Fallback: suggest using custom upload or YouTube
            const statusEl = document.getElementById('youtubeStatus');
            if (statusEl) {
                statusEl.textContent = 'Audio failed - try YouTube or upload custom';
                statusEl.className = 'youtube-status error';
            }
        });
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
            alert('Could not play the audio file. Please try a different format.');
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
                        statusEl.textContent = '▶ Playing from YouTube';
                        statusEl.className = 'youtube-status playing';
                    }
                },
                'onStateChange': (event) => {
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

    loadPlaylists() {
        try {
            const saved = localStorage.getItem('focusPlaylists');
            this.playlists = saved ? JSON.parse(saved) : {};
            this.updatePlaylistDropdown();
        } catch (e) {
            console.log('Error loading playlists:', e);
            this.playlists = {};
        }
    },

    savePlaylists() {
        try {
            localStorage.setItem('focusPlaylists', JSON.stringify(this.playlists));
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
            alert('Invalid YouTube URL');
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
                <span class="playlist-track-title">${track.title || 'Track ' + (index + 1)}</span>
                <button class="playlist-track-btn delete" onclick="FocusMode.removeFromPlaylist('${playlistId}', ${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    updatePlaylistDropdown() {
        const selectEl = document.getElementById('playlistSelect');
        if (!selectEl) return;

        const currentValue = selectEl.value;
        selectEl.innerHTML = '<option value="">-- Select Playlist --</option>';

        Object.keys(this.playlists).forEach(playlistId => {
            const playlist = this.playlists[playlistId];
            const option = document.createElement('option');
            option.value = playlistId;
            option.textContent = `${playlist.name} (${playlist.tracks.length})`;
            selectEl.appendChild(option);
        });

        // Restore selection
        if (currentValue && this.playlists[currentValue]) {
            selectEl.value = currentValue;
        }
    },

    playTrack(index) {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) return;

        const tracks = this.playlists[this.currentPlaylist].tracks;
        if (index < 0 || index >= tracks.length) return;

        this.currentTrackIndex = index;
        const track = tracks[index];
        this.playYouTubeAudio(track.url);
        this.renderPlaylistTracks(this.currentPlaylist);
    },

    playPlaylist() {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) {
            alert('Please select a playlist first');
            return;
        }

        const tracks = this.playlists[this.currentPlaylist].tracks;
        if (tracks.length === 0) {
            alert('Playlist is empty. Add some tracks first.');
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
            breakDuration: this.breakDuration
        };
        sessionStorage.setItem('focusModeState', JSON.stringify(state));
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

            // Start animation and quote
            this.startAnimation();
            this.showRandomQuote();
            this.startQuoteRotation();

            console.log('Focus mode restored after refresh');
        } catch (e) {
            console.log('Error restoring focus state:', e);
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    FocusMode.init();
});

// Expose globally
window.FocusMode = FocusMode;
