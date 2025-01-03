import os

structure = {
    "spaced-repetition": {
        "backend": {
            "api": ["__init__.py", "models.py", "views.py", "serializers.py", "urls.py"],
            "spaced_repetition": ["__init__.py", "settings.py", "urls.py", "wsgi.py", "asgi.py"],
            ".": ["manage.py", "requirements.txt"]
        },
        "frontend": {
            "src": {
                "components": ["AddTopic.js", "Revisions.js", "HomePage.js"],
                ".": ["api.js"]
            },
            ".": []
        },
        ".": ["README.md"]
    }
}

def create_structure(base_path, structure):
    for folder, content in structure.items():
        path = os.path.join(base_path, folder)
        os.makedirs(path, exist_ok=True)
        for file in content:
            if isinstance(content, dict):  # Nested folder
                create_structure(path, content)
            else:
                for file in content:
                    with open(os.path.join(path, file), "w") as f:
                        f.write("")

create_structure(".", structure)
