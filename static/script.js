
let characters = [];
let remaining = [];
let gameOver = false;
let questionHistory = [];

const board = document.getElementById("character-board");
const answerText = document.getElementById("answer");
const askAIButton = document.getElementById("ask-ai-button");

const questionInput = document.getElementById("question-input");
const aiFeedback = document.getElementById("ai-feedback");
const feedbackMessage = document.getElementById("feedback-message");
const suggestionButton = document.getElementById("use-suggestion");

const attributeValues = {
    gender: ["male", "female"],
    hair: ["black", "brown", "blonde", "red"],
    eye_color: ["brown", "blue", "green", "hazel"],
    clothing_color: [
        "red", "blue", "green", "yellow",
        "purple", "orange", "black", "white"
    ],
    hair_length: ["short", "medium", "long"],
    face_shape: ["round", "oval", "square"],
    glasses: ["true", "false"],
    hat: ["true", "false"],
    beard: ["true", "false"],
    earrings: ["true", "false"]
};


function updateStats(questionCount) {
    document.getElementById("question-count").textContent =
        questionCount;

    document.getElementById("remaining-count").textContent =
        remaining.length;

    document.getElementById("turn-label").textContent =
        `Question ${questionCount + 1}`;

    document.getElementById("board-status").textContent =
        `${remaining.length} / ${characters.length} Remaining`;

    const percentage = characters.length
        ? (remaining.length / characters.length) * 100
        : 0;

    document.getElementById("progress-fill").style.width =
        `${percentage}%`;
}

function renderBoard() {
    board.innerHTML = "";

    characters.forEach(character => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "character";

        if (!remaining.includes(character.id)) {
            card.classList.add("eliminated");
        }

        const avatar = document.createElement("div");
        avatar.className = "avatar";

        const img = document.createElement("img");
        img.src = `/static/${character.image}`;
        img.alt = character.name;
        img.className = "character-portrait";

        img.onerror = () => {
            img.remove();
            avatar.textContent = "👤";
        };

        avatar.appendChild(img);

        const name = document.createElement("h3");
        name.textContent = character.name;

        card.appendChild(avatar);
        card.appendChild(name);

        const available = !gameOver &&
            remaining.includes(character.id);

        card.disabled = !available;
        card.setAttribute(
            "aria-label",
            `Guess ${character.name}`
        );

        if (available) {
            card.addEventListener("click", () => {
                guessCharacter(character.id, character.name);
            });
        }

        board.appendChild(card);
    });
}

function showAnswer(answer) {
    document.getElementById("yes-indicator")
        .classList.toggle("active", answer === true);

    document.getElementById("no-indicator")
        .classList.toggle("active", answer === false);
}

function renderHistory() {
    const container =
        document.getElementById("question-history");

    container.innerHTML = "";

    if (questionHistory.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-history";
        empty.textContent = "No questions asked yet.";
        container.appendChild(empty);
        return;
    }

    [...questionHistory].reverse().forEach(entry => {
        const row = document.createElement("div");
        row.className = "history-entry";

        const question = document.createElement("span");
        question.textContent = entry.question;

        const answer = document.createElement("span");
        answer.className =
            `history-answer ${entry.answer ? "yes" : "no"}`;
        answer.textContent = entry.answer ? "YES" : "NO";

        row.appendChild(question);
        row.appendChild(answer);
        container.appendChild(row);
    });
}

function getQuestionText(attribute, value) {
    switch (attribute) {
        case "gender":
            return `Is your character ${value}?`;

        case "hair":
            return `Does your character have ${value} hair?`;

        case "eye_color":
            return `Does your character have ${value} eyes?`;

        case "clothing_color":
            return `Is your character wearing ${value}?`;

        case "hair_length":
            return `Does your character have ${value} hair?`;

        case "face_shape":
            return `Does your character have a ${value} face?`;

        case "glasses":
            return value
                ? "Does your character wear glasses?"
                : "Does your character not wear glasses?";

        case "hat":
            return value
                ? "Does your character wear a hat?"
                : "Does your character not wear a hat?";

        case "beard":
            return value
                ? "Does your character have a beard?"
                : "Does your character not have a beard?";

        case "earrings":
            return value
                ? "Does your character wear earrings?"
                : "Does your character not wear earrings?";

        default:
            return "Unknown question";
    }
}

async function loadGame() {
    const characterResponse = await fetch("/api/characters");
    if (!characterResponse.ok) {
        throw new Error("Could not load characters.");
    }

    characters = await characterResponse.json();

    const stateResponse = await fetch("/api/state");
    if (!stateResponse.ok) {
        throw new Error("Could not load game state.");
    }

    const state = await stateResponse.json();

    remaining = state.remaining;
    gameOver = state.game_over;

    askAIButton.disabled = gameOver;
    questionInput.disabled = gameOver;

    updateStats(state.questions_asked);
    renderBoard();
}

function showFeedback(message, suggestion = "") {
    aiFeedback.hidden = false;
    feedbackMessage.textContent = message;

    suggestionButton.hidden = !suggestion;
    suggestionButton.textContent = suggestion;

    suggestionButton.onclick = () => {
        questionInput.value = suggestion;
        aiFeedback.hidden = true;
        questionInput.focus();
    };
}

function hideFeedback() {
    aiFeedback.hidden = true;
}

async function guessCharacter(id, name) {
    if (gameOver) return;

    if (!confirm(`Is ${name} your final guess?`)) {
        return;
    }

    try {
        const response = await fetch("/api/guess", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({character_id: id})
        });

        const result = await response.json();

        if (!response.ok) {
            answerText.textContent =
                result.error || "Guess failed.";
            return;
        }

        gameOver = true;
        askAIButton.disabled = true;
        questionInput.disabled = true;

        renderBoard();

        document.getElementById("result-icon").textContent =
            result.correct ? "🏆" : "🎭";

        document.getElementById("result-title").textContent =
            result.correct ? "You Win!" : "Not Quite!";

        document.getElementById("result-message").textContent =
            result.correct
                ? `You found ${result.secret_name} after ` +
                  `${result.questions_asked} questions!`
                : `You guessed ${name}, but the secret ` +
                  `character was ${result.secret_name}.`;

        document.getElementById("result-modal")
            .classList.remove("hidden");

        document.getElementById("play-again-button").focus();
    } catch (error) {
        answerText.textContent =
            "Could not submit your guess.";
    }
}

async function restartGame() {
    try {
        const response = await fetch("/api/restart", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Restart failed.");
        }

        questionHistory = [];
        showAnswer(null);
        renderHistory();

        answerText.textContent = "Ask a question to begin!";

        document.getElementById("result-modal")
            .classList.add("hidden");

        await loadGame();
    } catch (error) {
        answerText.textContent =
            "Could not restart the game.";
    }
}

document.getElementById("restart-button")
    .addEventListener("click", restartGame);

document.getElementById("play-again-button")
    .addEventListener("click", restartGame);

renderHistory();

loadGame().catch(() => {
    answerText.textContent =
        "Unable to load the game. Check the Flask server.";
});
