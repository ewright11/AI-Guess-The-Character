# AI Guess Who — Team 10

## How to Run

Make sure Python 3 is installed. Open the GitHub project folder in VS Code and open a terminal in the folder containing `app.py`.

### 1. Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

### 2. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 3. Start the game

```bash
python app.py
```

### 4. Open the website

Visit http://127.0.0.1:5000 in your browser.

Keep the terminal running while playing. Press `Ctrl+C` to stop the server.

**Note:** If `python` is not recognized, try `py` on Windows or `python3` on macOS/Linux when creating the virtual environment. If `requirements.txt` is missing, install Flask with `python -m pip install flask` instead.
