
let characters = [];
let remaining = [];
let gameOver = false;
let questionHistory = [];

const board = document.getElementById("character-board");
const attributeSelect = document.getElementById("attribute");
const valueSelect = document.getElementById("value");
const answerText = document.getElementById("answer");
const askButton = document.getElementById("ask-button");

const options = {
    glasses: [["true", "Yes"], ["false", "No"]],
    hat: [["true", "Yes"], ["false", "No"]],
    beard: [["true", "Yes"], ["false", "No"]],
    hair: [
        ["black", "Black"],
        ["brown", "Brown"],
        ["blonde", "Blonde"],
        ["red", "Red"]
    ]
};

function updateOptions() {
    const attribute = attributeSelect.value;
    valueSelect.innerHTML = "";

    options[attribute].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        valueSelect.appendChild(option);
    });
}

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
        avatar.textContent = character.avatar;

        const name = document.createElement("h3");
        name.textContent = character.name;

        const traits = document.createElement("div");
        traits.className = "traits";

        traits.textContent =
            `Hair: ${character.hair} | ` +
            `Glasses: ${character.glasses ? "Yes" : "No"} | ` +
            `Hat: ${character.hat ? "Yes" : "No"} | ` +
            `Beard: ${character.beard ? "Yes" : "No"}`;

        card.appendChild(avatar);
        card.appendChild(name);
        card.appendChild(traits);

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
    if (attribute === "hair") {
        return `Does your character have ${value} hair?`;
    }

    if (attribute === "glasses") {
        return value
            ? "Does your character wear glasses?"
            : "Does your character not wear glasses?";
    }

    if (attribute === "hat") {
        return value
            ? "Does your character wear a hat?"
            : "Does your character not wear a hat?";
    }

    return value
        ? "Does your character have a beard?"
        : "Does your character not have a beard?";
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

    askButton.disabled = gameOver;
    attributeSelect.disabled = gameOver;
    valueSelect.disabled = gameOver;

    updateStats(state.questions_asked);
    renderBoard();
}

async function askQuestion() {
    if (gameOver) return;

    const attribute = attributeSelect.value;
    let value = valueSelect.value;

    if (attribute !== "hair") {
        value = value === "true";
    }

    askButton.disabled = true;

    try {
        const response = await fetch("/api/question", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({attribute, value})
        });

        const result = await response.json();

        if (!response.ok) {
            answerText.textContent =
                result.error || "Question failed.";
            return;
        }

        remaining = result.remaining;

        const question = getQuestionText(attribute, value);

        questionHistory.push({
            question: question,
            answer: result.answer
        });

        answerText.textContent = question;
        showAnswer(result.answer);
        renderHistory();
        updateStats(result.questions_asked);
        renderBoard();
    } catch (error) {
        answerText.textContent =
            "Could not reach the game server.";
    } finally {
        askButton.disabled = gameOver;
    }
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
        askButton.disabled = true;
        attributeSelect.disabled = true;
        valueSelect.disabled = true;

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

attributeSelect.addEventListener("change", updateOptions);
askButton.addEventListener("click", askQuestion);

document.getElementById("restart-button")
    .addEventListener("click", restartGame);

document.getElementById("play-again-button")
    .addEventListener("click", restartGame);

updateOptions();
renderHistory();

loadGame().catch(() => {
    answerText.textContent =
        "Unable to load the game. Check the Flask server.";
});
