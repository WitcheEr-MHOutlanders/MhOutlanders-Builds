"""Check local page/asset references and basic accessibility without network access."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {".git", "node_modules"}

class PageInspector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []
        self.ids = set()
        self.errors = []
        self.viewport = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "meta" and values.get("name", "").lower() == "viewport":
            self.viewport = True
        if "id" in values:
            if values["id"] in self.ids:
                self.errors.append(f"duplicate id: {values['id']}")
            self.ids.add(values["id"])
        if tag == "img" and not values.get("alt") and "alt" not in values:
            self.errors.append("image missing alt attribute")
        for attr in ("href", "src"):
            if values.get(attr):
                self.refs.append(values[attr])

def check():
    errors = []
    pages = sorted(ROOT.rglob("*.html"))
    for page in pages:
        if any(part in EXCLUDED for part in page.parts):
            continue
        relative = page.relative_to(ROOT)
        inspector = PageInspector()
        inspector.feed(page.read_text(encoding="utf-8"))
        for issue in inspector.errors:
            errors.append(f"{relative}: {issue}")
        if not inspector.viewport:
            errors.append(f"{relative}: missing mobile viewport")
        for ref in inspector.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc or not url.path or ref.startswith(("mailto:", "tel:", "data:", "//")):
                continue
            path = unquote(url.path)
            if path.startswith("/"):
                # Site is published at /MhOutlanders-Builds/ on GitHub Pages.
                path = path.removeprefix("/MhOutlanders-Builds/")
                target = ROOT / path.lstrip("/")
            else:
                target = page.parent / path
            if target.is_dir():
                target = target / "index.html"
            try:
                target.resolve().relative_to(ROOT.resolve())
            except ValueError:
                errors.append(f"{relative}: path escapes site: {ref}")
                continue
            if not target.is_file():
                errors.append(f"{relative}: missing local target: {ref}")
    # All published build detail pages should include both navigation actions.
    for page in sorted((ROOT / "builds").rglob("*.html")):
        if page == ROOT / "builds/index.html":
            continue
        content = page.read_text(encoding="utf-8")
        relative = page.relative_to(ROOT)
        if "Back to Build Library" not in content:
            errors.append(f"{relative}: missing Back to Build Library action")
        if "Feedback" not in content or "community/" not in content:
            errors.append(f"{relative}: missing Feedback to Community action")
    for section in ("index.html", "builder/index.html", "builds/index.html", "guide/index.html", "community/index.html"):
        content = (ROOT / section).read_text(encoding="utf-8")
        if 'class="unified-nav"' not in content or 'aria-label="Open navigation menu"' not in content:
            errors.append(f"{section}: missing shared mobile navigation")
    if errors:
        raise SystemExit("Site validation failed:\n" + "\n".join(errors))
    print(f"Validated {len(pages)} HTML pages: local links, image references, IDs, viewport and image alt.")

if __name__ == "__main__":
    check()
