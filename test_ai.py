from ai import interpret_question
import json

questions = [
    "Does your character have blue eyes?",
    "Does he have spectacles?",
    "Does your character have dark hair?",
    "Do they have a dog?",
    "Does your character have a beard?",
    "Does your character have red hair and green eyes?"
]

for question in questions:
    print("\nQuestion:", question)

    result = interpret_question(question)

    print(json.dumps(result, indent=4))