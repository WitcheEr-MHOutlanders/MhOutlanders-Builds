#!/usr/bin/env python3
"""Generate static build pages and the library; no third-party dependencies."""
import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')

def escape(value):
    return html.escape(value, quote=True)

def text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{label} must be nonempty text')
    return value

def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Build must be an object')
    for key in ('slug', 'title', 'summary', 'weapon', 'weapon_type'):
        text(data.get(key), key)
    if not SLUG.fullmatch(data['slug']) or data['slug'] == 'index':
        raise ValueError('Use a unique lowercase hyphenated slug other than index')
    for key in ('armor', 'skills', 'notes', 'rotation'):
        if not isinstance(data.get(key), list):
            raise ValueError(f'{key} must be a list')
        for value in data[key]:
            text(value, key)
    for key in ('character_stats', 'visage', 'buddy'):
        if key in data:
            if not isinstance(data[key], list):
                raise ValueError(f'{key} must be a list')
            for value in data[key]:
                text(value, key)
    if 'progression' in data:
        if not isinstance(data['progression'], dict):
            raise ValueError('progression must be an object')
        for key in ('skill', 'current', 'target', 'note'):
            text(data['progression'].get(key), f'progression {key}')
    if not isinstance(data.get('screenshots'), list) or not data['screenshots']:
        raise ValueError('At least one screenshot is required')
    for shot in data['screenshots']:
        if not isinstance(shot, dict):
            raise ValueError('Screenshot must be an object')
        for key in ('file', 'alt', 'caption'):
            text(shot.get(key), f'screenshot {key}')
        path = Path(shot['file'])
        if path.name != shot['file'] or path.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
            raise ValueError('Screenshot file must be a local PNG, JPEG, or WebP filename')
        asset = ROOT / 'assets/builds' / data['slug'] / path
        if not asset.is_file() or not asset.resolve().is_relative_to((ROOT / 'assets/builds').resolve()):
            raise ValueError(f'Missing or unsafe screenshot: {asset}')
    return data

def document(title, body, featured=False):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)} | Outlanders Arsenal</title>
<link rel="stylesheet" href="../assets/builds.css">\n<style>.bottom-return-nav{{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin:36px auto;padding:0 12px}}.bottom-return-nav a{{display:inline-flex;justify-content:center;align-items:center;min-height:48px;padding:12px 20px;background:#995a30;border:1px solid #c48b57;border-radius:12px;color:#fff1df;text-decoration:none;font-weight:700}}@media(max-width:480px){{.bottom-return-nav a{{width:100%}}}}</style>
</head>
<body{' class="showcase"' if featured else ''}>
<a class="skip-link" href="#main">Skip to content</a>
<header><nav aria-label="Main navigation"><a href="../index.html">⚔ Outlanders Arsenal</a><a href="index.html">Build library</a></nav></header>
<main id="main">{body}</main>
<footer>Outlanders Arsenal · Fan-made Monster Hunter Outlanders build guides</footer>
</body>
</html>
'''

def section(title, items, ordered=False):
    if not items:
        return ''
    tag = 'ol' if ordered else 'ul'
    return f'<section class="panel"><h2>{escape(title)}</h2><{tag}>' + ''.join(f'<li>{escape(i)}</li>' for i in items) + f'</{tag}></section>'

def page(data):
    body = f'<div class="hero"><p class="eyebrow">{escape(data["weapon_type"])}</p><h1>{escape(data["title"])}</h1><p class="summary">{escape(data["summary"])}</p></div>'
    if 'progression' in data:
        progress = data['progression']
        shot = data['screenshots'][0]
        body += f'<figure class="build-cover"><img src="../assets/builds/{data["slug"]}/{escape(shot["file"])}" alt="{escape(shot["alt"])}" width="1280" height="591"><figcaption>{escape(shot["caption"])}</figcaption></figure>'
        body += f'<section class="upgrade panel" aria-labelledby="upgrade-heading"><p class="eyebrow">Equipped vs. upgrade target</p><h2 id="upgrade-heading">{escape(progress["skill"])}</h2><div class="upgrade-values"><p>Current · screenshot<strong>{escape(progress["current"])}</strong></p><p>Fully upgraded · author target<strong>{escape(progress["target"])}</strong></p></div><p>{escape(progress["note"])}</p></section>'
    body += section('Character stats · captured loadout', data.get('character_stats', []))
    body += f'<section class="panel"><h2>Weapon</h2><p>{escape(data["weapon"])}</p></section><div class="grid">'
    body += section('Armor loadout', data['armor']) + section('Skills', data['skills']) + '</div>'
    if data.get('visage') or data.get('buddy'):
        body += '<div class="grid">' + section('Visage · Ink of Flames', data.get('visage', [])) + section('Buddy · SSR Kojiro', data.get('buddy', [])) + '</div>'
    body += section('Combat rotation', data['rotation'], True) + section('Build notes', data['notes'])
    body += '<section aria-labelledby="screenshots"><h2 id="screenshots">Build screenshots</h2><div class="gallery">'
    for shot in data['screenshots']:
        src = f'../assets/builds/{data["slug"]}/{shot["file"]}'
        body += f'<figure class="panel"><a href="{escape(src)}"><img src="{escape(src)}" alt="{escape(shot["alt"])}" loading="lazy" decoding="async"></a><figcaption>{escape(shot["caption"])}</figcaption></figure>'
    body += '</div></section>'
    body += '<nav class="bottom-return-nav" aria-label="Build page actions"><a href="./" aria-label="Back to Build Library">← Back to Build Library</a><a href="../community/" aria-label="Feedback in Hunter Community">Feedback</a></nav>'
    return document(data['title'], body, featured='progression' in data)

def outputs():
    result = {}
    cards = []
    for path in sorted((ROOT / 'data/builds').glob('*.json')):
        data = validate(json.loads(path.read_text()))
        if path.stem != data['slug']:
            raise ValueError(f'{path.name} must match its build slug')
        result[ROOT / 'builds' / f'{data["slug"]}.html'] = page(data)
        cards.append(f'<article class="panel"><p class="eyebrow">{escape(data["weapon_type"])}</p><h2><a href="{data["slug"]}.html">{escape(data["title"])}</a></h2><p>{escape(data["summary"])}</p></article>')
    result[ROOT / 'builds/index.html'] = document('Build library', '<div class="hero"><p class="eyebrow">Find your next hunt</p><h1>Build library</h1><p class="summary">Explore weapon loadouts, skills, and combat guides.</p></div><div class="grid">' + ''.join(cards) + '</div>')
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check generated pages without writing them')
    args = parser.parse_args()
    generated = outputs()  # Validate every input before writing anything.
    for path, content in generated.items():
        if args.check:
            if not path.is_file() or path.read_text() != content:
                raise SystemExit(f'Outdated generated page: {path.relative_to(ROOT)}; run python3 scripts/build.py')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    print(f'{"Checked" if args.check else "Generated"} {len(generated)} static page(s)')

if __name__ == '__main__':
    main()
