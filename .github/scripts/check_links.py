"""Fails if a page or stylesheet points at a local file that doesn't exist.

Vercel's file system is case-sensitive, so "Buddy.png" and "buddy.PNG" are different
files there even when they look the same on a laptop."""
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKIP_DIRS = {".git", "node_modules", "backend", ".github", ".vscode"}


def is_local(ref):
    if not ref or ref.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return False
    return not urlparse(ref).scheme and not ref.startswith("//")


def exists_exactly(path):
    """os.path.exists, but with the exact letter case of every part of the path."""
    path = os.path.normpath(path)
    if not os.path.exists(path):
        return False
    rel = os.path.relpath(path, ROOT).split(os.sep)
    current = ROOT
    for part in rel:
        if part == "..":
            current = os.path.dirname(current)
            continue
        if part not in os.listdir(current):
            return False
        current = os.path.join(current, part)
    return True


class Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("src", "href") and value:
                self.refs.append(value)


problems = []
for folder, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for name in files:
        path = os.path.join(folder, name)
        if name.endswith(".html"):
            parser = Refs()
            parser.feed(open(path, encoding="utf-8").read())
            refs = parser.refs
        elif name.endswith(".css"):
            refs = re.findall(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", open(path, encoding="utf-8").read())
        else:
            continue
        for ref in refs:
            if not is_local(ref):
                continue
            target = os.path.join(folder, urlparse(ref).path)
            if not exists_exactly(target):
                problems.append(f"{os.path.relpath(path, ROOT)}: {ref}")

if problems:
    print("Missing files:")
    print("\n".join(f"  {p}" for p in problems))
    sys.exit(1)
print("All local links point at existing files.")
