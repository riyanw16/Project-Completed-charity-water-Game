let score = 0;
let timeLeft = 30;
let gameRunning = false;
let itemsCollected = 0;

let dropMaker;
let timerInterval;

// Messages for when player wins
const winMessages = [
    "🎉 You helped provide clean water!",
    "🌊 Excellent work! Communities will thrive!",
    "💪 Amazing effort! You're a water hero!",
    "✨ Outstanding! Clean water for all!"
];

// Messages for when player loses
const loseMessages = [
    "Keep practicing! Every drop counts!",
    "So close! Try again and do better!",
    "You'll do better next time! Keep going!",
    "Good effort! Come back for another round!"
];

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const feedback = document.getElementById("feedback");
const gameContainer = document.getElementById("game-container");

document
    .getElementById("start-btn")
    .addEventListener("click", startGame);

document
    .getElementById("reset-btn")
    .addEventListener("click", resetGame);

function startGame() {

    if (gameRunning) return;

    gameRunning = true;

    // Start with initial interval, will speed up with difficulty
    dropMaker = setInterval(createItem, 800);

    timerInterval = setInterval(() => {

        timeLeft--;

        timeDisplay.textContent = timeLeft;

        // Increase difficulty as time progresses
        if (timeLeft <= 0) {
            endGame();
        } else if (timeLeft === 20 || timeLeft === 10) {
            increaseDifficulty();
        }

    }, 1000);
}

function createItem() {

    const item = document.createElement("div");

    item.classList.add("item");

    const random = Math.random();

    let type;

    if (random < 0.15) {
        type = "can";
        item.textContent = "🪣";
        item.classList.add("drop-can");
    }
    else if (random < 0.35) {
        type = "bad";
        item.textContent = "🟤";
        item.classList.add("drop-bad");
    }
    else {
        type = "good";
        item.textContent = "💧";
        item.classList.add("drop-good");
    }

    const x =
        Math.random() *
        (gameContainer.offsetWidth - 60);

    item.style.left = `${x}px`;

    // Animation gets faster based on score (difficulty progression)
    const speedMultiplier = 1 - (score / 200);
    const baseDuration = Math.random() * 3 + 6;
    const duration = baseDuration * Math.max(speedMultiplier, 0.5);

    item.style.animationDuration =
    `${duration}s`;

    item.addEventListener("click", () => {

        if (!gameRunning) return;

        itemsCollected++;

        if (type === "good") {

            score += 1;

            feedback.textContent =
                "+1 Clean Water";

            feedback.style.color =
                "#159A48";
        }

        if (type === "bad") {

            score -= 3;

            feedback.textContent =
                "-3 Dirty Water";

            feedback.style.color =
                "#F5402C";
        }

        if (type === "can") {

            score += 5;

            feedback.textContent =
                "+5 Water Collected";

            feedback.style.color =
                "#FFC907";
            
            // Pulse effect for special drops
            item.classList.add("pulse");
        }

        scoreDisplay.textContent = score;

        item.remove();

        checkWin();
    });

    item.addEventListener("animationend", () => {

        if (item.parentNode) {
            item.remove();
        }

    });

    gameContainer.appendChild(item);
}

function checkWin() {

    if (score >= 50) {

        launchConfetti();

        clearInterval(dropMaker);
        clearInterval(timerInterval);

        gameRunning = false;

        const winMessage = winMessages[Math.floor(Math.random() * winMessages.length)];
        alert(winMessage);
    }
}

function endGame() {

    clearInterval(dropMaker);
    clearInterval(timerInterval);

    gameRunning = false;

    const finalMessage = score >= 20 
        ? winMessages[Math.floor(Math.random() * winMessages.length)]
        : loseMessages[Math.floor(Math.random() * loseMessages.length)];

    alert(`Time's up! Final Score: ${score}\n\n${finalMessage}`);
}

function increaseDifficulty() {

    // Increase drop spawn rate
    clearInterval(dropMaker);

    const newInterval = timeLeft === 20 ? 600 : 400;
    dropMaker = setInterval(createItem, newInterval);

    feedback.textContent = "⚡ Difficulty Increased!";
    feedback.style.color = "#F5402C";
}

function resetGame() {

    clearInterval(dropMaker);
    clearInterval(timerInterval);

    score = 0;
    timeLeft = 30;
    gameRunning = false;
    itemsCollected = 0;

    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;

    feedback.textContent =
        "Collect clean water!";

    feedback.style.color = "black";

    gameContainer.innerHTML = "";
}

function launchConfetti() {

    confetti({
        particleCount: 150,
        spread: 100,
        origin: {
            y: 0.6
        }
    });
}