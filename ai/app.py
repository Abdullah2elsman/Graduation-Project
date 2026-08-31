"""Smart Book V2 — minimal internal AI service.

Phase 1A health-only scaffold. No AI generation yet.
Laravel is the only permitted caller (Angular never talks to Flask directly).
"""

import os

from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify(status="ok", service="smart-book-ai")


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", "5001"))
    app.run(host="0.0.0.0", port=port)