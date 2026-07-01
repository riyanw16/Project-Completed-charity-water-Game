let score = 0;
let timeLeft = 30;
let gameRunning = false;
let itemsCollected = 0;
let difficulty = "normal";
let milestoneIndex = 0;
let audioContext;

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

const milestoneMessages = [
    { score: 10, text: "🌟 Milestone reached: 10 points!" },
    { score: 25, text: "💧 Momentum building at 25 points!" },
    { score: 50, text: "🚀 Halfway to the goal!" }
];

const difficultySettings = {
    easy: {
        label: "Easy",
        timeLimit: 45,
        winTarget: 40,
        spawnInterval: 1000,
        badPenalty: 2,
        canBonus: 5,
        canChance: 0.15,
        badChance: 0.15,
        goodChance: 0.70,
        speedUpAt: null,
        speedStep: 0
    },
    normal: {
        label: "Normal",
        timeLimit: 30,
        winTarget: 50,
        spawnInterval: 800,
        badPenalty: 3,
        canBonus: 5,
        canChance: 0.15,
        badChance: 0.20,
        goodChance: 0.65,
        speedUpAt: 20,
        speedStep: 200
    },
    hard: {
        label: "Hard",
        timeLimit: 20,
        winTarget: 70,
        spawnInterval: 550,
        badPenalty: 4,
        canBonus: 5,
        canChance: 0.15,
        badChance: 0.30,
        goodChance: 0.55,
        speedUpAt: 10,
        speedStep: 150
    }
};

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const feedback = document.getElementById("feedback");
const gameContainer = document.getElementById("game-container");
const difficultySelect = document.getElementById("difficulty-select");

document
    .getElementById("start-btn")
    .addEventListener("click", startGame);

document
    .getElementById("reset-btn")
    .addEventListener("click", resetGame);

difficultySelect.addEventListener("change", () => {
    difficulty = difficultySelect.value;

    if (!gameRunning) {
        applyDifficultySettings();
    }
});

function getDifficultySettings() {
    return difficultySettings[difficulty] || difficultySettings.normal;
}

function ensureAudioContext() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioContext = new AudioContextClass();
        }
    }

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playSound(type) {
    ensureAudioContext();

    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let frequency = 440;
    let duration = 0.12;

    if (type === "good") {
        frequency = 660;
    } else if (type === "bad") {
        frequency = 220;
        duration = 0.16;
    } else if (type === "can") {
        frequency = 880;
        duration = 0.18;
    } else if (type === "miss") {
        frequency = 180;
        duration = 0.1;
    } else if (type === "win") {
        const frequencies = [523, 659, 784];
        frequencies.forEach((freq, index) => {
            const chordOsc = audioContext.createOscillator();
            const chordGain = audioContext.createGain();
            chordOsc.type = "sine";
            chordOsc.frequency.value = freq;
            chordOsc.connect(chordGain);
            chordGain.connect(audioContext.destination);
            chordGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
            chordGain.gain.exponentialRampToValueAtTime(0.04, audioContext.currentTime + 0.02 + index * 0.01);
            chordGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28 + index * 0.01);
            chordOsc.start(audioContext.currentTime + index * 0.01);
            chordOsc.stop(audioContext.currentTime + 0.3 + index * 0.01);
        });
        return;
    }

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function showMilestoneMessage() {
    const nextMilestone = milestoneMessages[milestoneIndex];

    if (!nextMilestone) return;

    if (score >= nextMilestone.score) {
        feedback.textContent = nextMilestone.text;
        feedback.style.color = "#159A48";
        milestoneIndex += 1;
    }
}

function applyDifficultySettings() {
    const settings = getDifficultySettings();

    timeLeft = settings.timeLimit;
    timeDisplay.textContent = timeLeft;
    feedback.textContent = `${settings.label} mode: collect ${settings.winTarget} points to win.`;
    feedback.style.color = "#1A1A1A";
    difficultySelect.value = difficulty;
}

function startGame() {

    if (gameRunning) return;

    const settings = getDifficultySettings();

    gameRunning = true;
    timeLeft = settings.timeLimit;
    timeDisplay.textContent = timeLeft;

    dropMaker = setInterval(createItem, settings.spawnInterval);

    timerInterval = setInterval(() => {

        timeLeft--;

        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame();
        } else if (settings.speedUpAt !== null && (timeLeft === settings.speedUpAt || timeLeft === Math.floor(settings.speedUpAt / 2))) {
            increaseDifficulty();
        }

    }, 1000);

    feedback.textContent = `${settings.label} mode active — ${settings.winTarget} points to win.`;
    feedback.style.color = "#1A1A1A";
}

function createItem() {

    const item = document.createElement("div");

    item.classList.add("item");

    const settings = getDifficultySettings();
    const random = Math.random();

    let type;

    if (random < settings.canChance) {
        type = "can";
        item.textContent = "🪣";
        item.classList.add("drop-can");
    }
    else if (random < settings.canChance + settings.badChance) {
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
            playSound("good");

            feedback.textContent =
                "+1 Clean Water";

            feedback.style.color =
                "#159A48";
        }

        if (type === "bad") {

            score -= getDifficultySettings().badPenalty;
            playSound("bad");

            feedback.textContent =
                `-${getDifficultySettings().badPenalty} Dirty Water`;

            feedback.style.color =
                "#F5402C";
        }

        if (type === "can") {

            score += getDifficultySettings().canBonus;
            playSound("can");

            feedback.textContent =
                `+${getDifficultySettings().canBonus} Water Collected`;

            feedback.style.color =
                "#FFC907";
            
            // Pulse effect for special drops
            item.classList.add("pulse");
        }

        scoreDisplay.textContent = score;
        showMilestoneMessage();

        item.remove();

        checkWin();
    });

    item.addEventListener("animationend", () => {

        if (item.parentNode) {
            playSound("miss");
            item.remove();
        }

    });

    gameContainer.appendChild(item);
}

function checkWin() {

    const settings = getDifficultySettings();

    if (score >= settings.winTarget) {

        launchConfetti();
        playSound("win");

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

    const settings = getDifficultySettings();
    const finalMessage = score >= settings.winTarget 
        ? winMessages[Math.floor(Math.random() * winMessages.length)]
        : loseMessages[Math.floor(Math.random() * loseMessages.length)];

    alert(`Time's up! Final Score: ${score}\n\n${finalMessage}`);
}

function increaseDifficulty() {

    clearInterval(dropMaker);

    const settings = getDifficultySettings();
    const newInterval = Math.max(settings.spawnInterval - settings.speedStep, 250);
    dropMaker = setInterval(createItem, newInterval);

    feedback.textContent = "⚡ Pace is increasing!";
    feedback.style.color = "#F5402C";
}

function resetGame() {

    clearInterval(dropMaker);
    clearInterval(timerInterval);

    score = 0;
    timeLeft = getDifficultySettings().timeLimit;
    gameRunning = false;
    itemsCollected = 0;
    milestoneIndex = 0;

    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;

    applyDifficultySettings();

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

applyDifficultySettings();