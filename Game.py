
import random


class GuessWhoGame:
    def __init__(self, characters):
        self.characters = characters
        self.restart()

    def restart(self):
        self.secret = random.choice(self.characters)
        self.remaining = [
            character["id"] for character in self.characters
        ]
        self.questions_asked = 0
        self.game_over = False

    def ask_question(self, attribute, value):
        if self.game_over:
            return {"error": "The game is over."}

        allowed = {
            "hair": ["black", "brown", "blonde", "red"],
            "glasses": [True, False],
            "hat": [True, False],
            "beard": [True, False]
        }

        if attribute not in allowed:
            return {"error": "Invalid attribute."}

        if type(value) is not type(allowed[attribute][0]):
            return {"error": "Invalid value."}

        if value not in allowed[attribute]:
            return {"error": "Invalid value."}

        answer = self.secret[attribute] == value
        self.questions_asked += 1

        self.remaining = [
            character["id"]
            for character in self.characters
            if character["id"] in self.remaining
            and (character[attribute] == value) == answer
        ]

        return {
            "answer": answer,
            "remaining": self.remaining,
            "questions_asked": self.questions_asked
        }

    def guess_character(self, character_id):
        if self.game_over:
            return {"error": "The game is over."}

        self.game_over = True
        correct = character_id == self.secret["id"]

        return {
            "correct": correct,
            "secret_name": self.secret["name"],
            "questions_asked": self.questions_asked
        }
