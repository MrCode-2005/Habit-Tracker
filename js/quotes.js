// ===================================
// Motivational Quotes Module
// ===================================

const Quotes = {
    quotes: [
        "The secret of getting ahead is getting started. - Mark Twain",
        "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Believe you can and you're halfway there. - Theodore Roosevelt",
        "It does not matter how slowly you go as long as you do not stop. - Confucius",
        "Everything you've ever wanted is on the other side of fear. - George Addair",
        "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
        "Hardships often prepare ordinary people for an extraordinary destiny. - C.S. Lewis",
        "The future depends on what you do today. - Mahatma Gandhi",
        "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
        "Difficult roads often lead to beautiful destinations.",
        "Do something today that your future self will thank you for.",
        "Little things make big days.",
        "It's going to be hard, but hard does not mean impossible.",
        "Don't stop when you're tired. Stop when you're done.",
        "Wake up with determination. Go to bed with satisfaction.",
        "Do it now. Sometimes 'later' becomes 'never'.",
        "Great things never come from comfort zones.",
        "Dream it. Wish it. Do it.",
        "Success doesn't just find you. You have to go out and get it.",
        "The harder you work for something, the greater you'll feel when you achieve it.",
        "Dream bigger. Do bigger.",
        "Don't wait for opportunity. Create it.",
        "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
        "The key to success is to focus on goals, not obstacles.",
        "Dream it. Believe it. Build it.",
        "Your limitation—it's only your imagination.",
        "Push yourself, because no one else is going to do it for you.",
        "Great things never came from comfort zones.",
        "Success is what comes after you stop making excuses.",
        "Work hard in silence, let your success be your noise.",
        "The difference between who you are and who you want to be is what you do.",
        "You don't have to be great to start, but you have to start to be great.",
        "A goal without a plan is just a wish.",
        "The only impossible journey is the one you never begin.",
        "Focus on being productive instead of busy.",
        "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
        "Act as if what you do makes a difference. It does. - William James",
        "Success usually comes to those who are too busy to be looking for it. - Henry David Thoreau",
        "Opportunities don't happen, you create them. - Chris Grosser",
        "Don't be afraid to give up the good to go for the great. - John D. Rockefeller",
        "I find that the harder I work, the more luck I seem to have. - Thomas Jefferson",
        "The way to get started is to quit talking and begin doing. - Walt Disney",
        "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty. - Winston Churchill",
        "Don't let yesterday take up too much of today. - Will Rogers",
        "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you. - Steve Jobs",
        "People who are crazy enough to think they can change the world, are the ones who do. - Rob Siltanen",
        "We may encounter many defeats but we must not be defeated. - Maya Angelou",
        "Knowing is not enough; we must apply. Wishing is not enough; we must do. - Johann Wolfgang Von Goethe",
        "Whether you think you can or think you can't, you're right. - Henry Ford",
        "The man who has confidence in himself gains the confidence of others. - Hasidic Proverb",
        "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
        "Creativity is intelligence having fun. - Albert Einstein",
        "What you lack in talent can be made up with desire, hustle and giving 110% all the time. - Don Zimmer"
    ],

    currentQuoteIndex: -1,
    rotationInterval: null,

    init() {
        // Display initial quote
        this.displayRandomQuote();

        // Rotate quotes every 30 minutes (30 * 60 * 1000 milliseconds)
        this.rotationInterval = setInterval(() => {
            this.displayRandomQuote();
        }, 30 * 60 * 1000);

        // Also allow manual refresh
        const refreshBtn = document.getElementById('refreshQuoteBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.displayRandomQuote());
        }
    },

    displayRandomQuote() {
        // Get a random quote different from the current one
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.quotes.length);
        } while (newIndex === this.currentQuoteIndex && this.quotes.length > 1);

        this.currentQuoteIndex = newIndex;
        const quote = this.quotes[newIndex];

        const quoteElement = document.getElementById('motivationalQuote');
        if (quoteElement) {
            // Add fade out effect
            quoteElement.style.opacity = '0';

            setTimeout(() => {
                quoteElement.textContent = quote;
                // Add fade in effect
                quoteElement.style.opacity = '1';
            }, 300);
        }
    },

    destroy() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
    }
};
