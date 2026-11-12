
import json
from pathlib import Path
from flask import Flask, render_template, request, jsonify, session
from game import GuessWhoGame

app = Flask(__name__)
app.secret_key = "development-only-change-this-key"

DATA_FILE = Path(__file__).parent / "data" / "characters.json"

with open(DATA_FILE, encoding="utf-8") as file:
    characters = json.load(file)


def get_game():
    game = GuessWhoGame(characters)

    if "secret_id" not in session:
        session["secret_id"] = game.secret["id"]
        session["remaining"] = game.remaining
        session["questions_asked"] = 0
        session["game_over"] = False
    else:
        game.secret = next(
            c for c in characters
            if c["id"] == session["secret_id"]
        )
        game.remaining = session["remaining"]
        game.questions_asked = session["questions_asked"]
        game.game_over = session["game_over"]

    return game


def save_game(game):
    session["secret_id"] = game.secret["id"]
    session["remaining"] = game.remaining
    session["questions_asked"] = game.questions_asked
    session["game_over"] = game.game_over


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/characters")
def get_characters():
    return jsonify(characters)


@app.route("/api/state")
def get_state():
    game = get_game()
    return jsonify({
        "remaining": game.remaining,
        "questions_asked": game.questions_asked,
        "game_over": game.game_over
    })


@app.route("/api/question", methods=["POST"])
def ask_question():
    data = request.get_json(silent=True) or {}
    game = get_game()

    result = game.ask_question(
        data.get("attribute"),
        data.get("value")
    )

    if "error" in result:
        return jsonify(result), 400

    save_game(game)
    return jsonify(result)


@app.route("/api/guess", methods=["POST"])
def guess():
    data = request.get_json(silent=True) or {}
    game = get_game()

    character_id = data.get("character_id")

    if type(character_id) is not int or not any(
        c["id"] == character_id for c in characters
    ):
        return jsonify({"error": "Invalid character."}), 400

    result = game.guess_character(character_id)

    if "error" in result:
        return jsonify(result), 400

    save_game(game)
    return jsonify(result)


@app.route("/api/restart", methods=["POST"])
def restart():
    game = GuessWhoGame(characters)
    save_game(game)
    return jsonify({
        "remaining": game.remaining,
        "questions_asked": 0,
        "game_over": False
    })


if __name__ == "__main__":
    app.run(debug=True)
