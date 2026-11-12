
let characters = [];
let remaining = [];
let gameOver = false;

const board = document.getElementById("character-board");
const attributeSelect = document.getElementById("attribute");
const valueSelect = document.getElementById("value");
const answerText = document.getElementById("answer");
const askButton = document.getElementById("ask-button");

const options = {
    glasses: [
        ["true", "Yes"],
        ["false", "No"]
    ],
    hat: [
        ["true", "Yes"],
        ["false", "No"]
    ],
    beard: [
        ["true", "Yes"],
        ["false", "No"]
    ],
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

function renderBoard() {
    board.innerHTML = "";

    characters.forEach(character => {
        const card = document.createElement("div");
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

        if (!gameOver && remaining.includes(character.id)) {
            card.addEventListener("click", () => {
                guessCharacter(character.id, character.name);
            });
        }

        board.appendChild(card);
    });

    document.getElementById("remaining-count").textContent =
        remaining.length;
}

async function loadGame() {
    const charactersResponse = await fetch("/api/characters");
    characters = await charactersResponse.json();

    const stateResponse = await fetch("/api/state");
    const state = await stateResponse.json();

    remaining = state.remaining;
    gameOver = state.game_over;

    document.getElementById("question-count").textContent =
        state.questions_asked;

    askButton.disabled = gameOver;
    answerText.textContent = gameOver
        ? "Game finished. Start a new game."
        : "Ask a question to begin!";

    renderBoard();
}

async function askQuestion() {
    if (gameOver) return;

    const attribute = attributeSelect.value;
    let value = valueSelect.value;

    if (attribute !== "hair") {
        value = value === "true";
    }

    const response = await fetch("/api/question", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({attribute, value})
    });

    const result = await response.json();

    if (!response.ok) {
        answerText.textContent = result.error;
        return;
    }

    answerText.textContent =
        result.answer ? "Answer: YES" : "Answer: NO";

    remaining = result.remaining;

    document.getElementById("question-count").textContent =
        result.questions_asked;

    renderBoard();
}

async function guessCharacter(id, name) {
    if (gameOver) return;

    if (!confirm(`Is ${name} your final guess?`)) {
        return;
    }

    const response = await fetch("/api/guess", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({character_id: id})
    });

    const result = await response.json();

    if (!response.ok) {
        answerText.textContent = result.error;
        return;
    }

    gameOver = true;
    askButton.disabled = true;

    answerText.textContent = result.correct
        ? `You win! The character was ${result.secret_name}!`
        : `Incorrect! The character was ${result.secret_name}.`;

    renderBoard();
}

async function restartGame() {
    const response = await fetch("/api/restart", {
        method: "POST"
    });

    if (!response.ok) {
        answerText.textContent = "Could not restart game.";
        return;
    }

    await loadGame();
}

attributeSelect.addEventListener("change", updateOptions);
askButton.addEventListener("click", askQuestion);

document.getElementById("restart-button")
    .addEventListener("click", restartGame);

updateOptions();
loadGame();
