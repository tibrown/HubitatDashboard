#!/usr/bin/env python3

import json
import os
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).parent.parent
INDEX_FILE = Path(__file__).parent / "index.html"
AVATAR_DIR = Path(__file__).parent / "avatars"
SHARED_SKILLS_DIR = BASE_DIR / "_skills"
PORT = int(os.environ.get("OPEN_ZEU_PORT", "8765"))

REPOS = {
    "orchestrator": {
        "path": BASE_DIR / "team" / "orchestrator" / "data.json",
        "root": BASE_DIR / "team" / "orchestrator",
        "skills_dir": BASE_DIR / "team" / "orchestrator" / "skills",
        "color": "#c084fc",
        "label": "Raava",
        "codename": "Raava",
        "role": "Orchestrator",
        "sub": "Task creation & intake",
    },
    "project-manager": {
        "path": BASE_DIR / "team" / "project-manager" / "data.json",
        "root": BASE_DIR / "team" / "project-manager",
        "skills_dir": BASE_DIR / "team" / "project-manager" / "skills",
        "color": "#60a5fa",
        "label": "Project Manager",
        "codename": "Project Manager",
        "role": "Project Manager",
        "sub": "Delegation & prioritization",
    },
    "backend-dev": {
        "path": BASE_DIR / "team" / "backend-dev" / "data.json",
        "root": BASE_DIR / "team" / "backend-dev",
        "skills_dir": BASE_DIR / "team" / "backend-dev" / "skills",
        "color": "#10b981",
        "label": "Backend Dev",
        "codename": "Backend Dev",
        "role": "Backend Dev",
        "sub": "APIs, integrations & services",
    },
    "dba": {
        "path": BASE_DIR / "team" / "dba" / "data.json",
        "root": BASE_DIR / "team" / "dba",
        "skills_dir": BASE_DIR / "team" / "dba" / "skills",
        "color": "#f97316",
        "label": "DBA",
        "codename": "DBA",
        "role": "DBA",
        "sub": "Schema design & migrations",
    },
    "frontend-dev": {
        "path": BASE_DIR / "team" / "frontend-dev" / "data.json",
        "root": BASE_DIR / "team" / "frontend-dev",
        "skills_dir": BASE_DIR / "team" / "frontend-dev" / "skills",
        "color": "#f59e0b",
        "label": "Frontend Dev",
        "codename": "Frontend Dev",
        "role": "Frontend Dev",
        "sub": "UI & components",
    },
    "architect": {
        "path": BASE_DIR / "team" / "architect" / "data.json",
        "root": BASE_DIR / "team" / "architect",
        "skills_dir": BASE_DIR / "team" / "architect" / "skills",
        "color": "#94a3b8",
        "label": "Architect",
        "codename": "Architect",
        "role": "Architect",
        "sub": "ADRs & code review",
    },
    "qa-tester": {
        "path": BASE_DIR / "team" / "qa-tester" / "data.json",
        "root": BASE_DIR / "team" / "qa-tester",
        "skills_dir": BASE_DIR / "team" / "qa-tester" / "skills",
        "color": "#f87171",
        "label": "QA Tester",
        "codename": "QA Tester",
        "role": "QA Tester",
        "sub": "Testing & bug reports",
    },
    "research": {
        "path": BASE_DIR / "team" / "research" / "data.json",
        "root": BASE_DIR / "team" / "research",
        "skills_dir": BASE_DIR / "team" / "research" / "skills",
        "color": "#22d3ee",
        "label": "Research",
        "codename": "Research",
        "role": "Research",
        "sub": "Web research & documentation",
    },
}


def _load_agent_names():
    """Load agent-names.json if present, otherwise fall back to agent-names-example.json."""
    local = BASE_DIR / "agent-names.json"
    example = BASE_DIR / "agent-names-example.json"
    names_file = local if local.exists() else example
    if not names_file.exists():
        return
    names = json.loads(names_file.read_text(encoding="utf-8"))
    for key, name in names.items():
        if key == "_comment" or key not in REPOS:
            continue
        # Orchestrator is always Raava regardless of the file
        if key == "orchestrator":
            continue
        REPOS[key]["label"] = name
        REPOS[key]["codename"] = name


_load_agent_names()


def load_repo_data(repo_name):
    path = REPOS[repo_name]["path"]
    if not path.exists():
        return {"backlog": [], "archive": []}
    return json.loads(path.read_text(encoding="utf-8"))


def save_repo_data(repo_name, data):
    path = REPOS[repo_name]["path"]
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def normalize_repo(repo_name):
    data = load_repo_data(repo_name)
    for item in data.get("backlog", []):
        item["repo"] = repo_name
    for item in data.get("archive", []):
        item["repo"] = repo_name
    return data


def denormalize_item(item):
    return {k: v for k, v in item.items() if k != "repo"}


@app.route("/")
def index():
    return send_file(INDEX_FILE)


@app.route("/avatars/<path:filename>")
def avatar(filename):
    avatar_path = (AVATAR_DIR / filename).resolve()
    try:
        avatar_path.relative_to(AVATAR_DIR.resolve())
    except ValueError:
        abort(404)
    if not avatar_path.exists() or not avatar_path.is_file():
        abort(404)
    return send_file(avatar_path)


@app.route("/<path:filename>")
def static_file(filename):
    file_path = (Path(__file__).parent / filename).resolve()
    try:
        file_path.relative_to(Path(__file__).parent.resolve())
    except ValueError:
        abort(404)
    if not file_path.exists() or not file_path.is_file():
        abort(404)
    return send_file(file_path)


@app.route("/api/repos", methods=["GET"])
def get_repos():
    return jsonify(
        {
            name: {
                "root": str(info["root"]),
                "color": info["color"],
                "label": info["label"],
                "codename": info["codename"],
                "role": info["role"],
                "sub": info["sub"],
            }
            for name, info in REPOS.items()
        }
    )


@app.route("/api/data", methods=["GET"])
def get_all_data():
    return jsonify({name: normalize_repo(name) for name in REPOS})


@app.route("/api/data/<repo_name>", methods=["GET"])
def get_repo_data(repo_name):
    if repo_name not in REPOS:
        return jsonify({"error": "Unknown repo"}), 404
    return jsonify(normalize_repo(repo_name))


@app.route("/api/data/<repo_name>", methods=["PUT"])
def update_repo_data(repo_name):
    if repo_name not in REPOS:
        return jsonify({"error": "Unknown repo"}), 404

    incoming = request.json or {}
    data = {
        "backlog": [denormalize_item(item) for item in incoming.get("backlog", [])],
        "archive": [denormalize_item(item) for item in incoming.get("archive", [])],
    }
    save_repo_data(repo_name, data)
    return jsonify({"status": "ok"})


@app.route("/api/skills", methods=["GET"])
def get_skills():
    result = {}
    for repo_name, info in REPOS.items():
        skills_dir = info["skills_dir"]
        if not skills_dir.exists():
            continue
        skills = []
        for file_path in sorted(skills_dir.glob("skill_*.md")):
            skills.append(
                {
                    "name": file_path.stem.replace("skill_", "").replace("_", " "),
                    "file": file_path.name,
                    "path": str(file_path),
                }
            )
        if skills:
            result[repo_name] = skills

    shared_skills = []
    if SHARED_SKILLS_DIR.exists():
        for file_path in sorted(SHARED_SKILLS_DIR.glob("skill_*.md")):
            shared_skills.append(
                {
                    "name": file_path.stem.replace("skill_", "").replace("_", " "),
                    "file": file_path.name,
                    "path": str(file_path),
                }
            )
    if shared_skills:
        result["shared"] = shared_skills

    return jsonify(result)


@app.route("/api/file")
def get_file():
    path = request.args.get("path", "")
    if not path:
        return jsonify({"error": "No path provided"}), 400

    file_path = Path(path)
    try:
        resolved = file_path.resolve()
        resolved.relative_to(BASE_DIR.resolve())
    except (ValueError, OSError):
        return jsonify({"error": "Access denied"}), 403

    if not file_path.exists() or not file_path.is_file():
        return jsonify({"error": "File not found"}), 404

    try:
        return jsonify({"content": file_path.read_text(encoding="utf-8")})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    print(f"Starting Dev Team Board at http://localhost:{PORT}")
    app.run(port=PORT, debug=True)
