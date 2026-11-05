# Outlanders Arsenal

A static Monster Hunter Outlanders guide site. Existing build information remains on the homepage; the build library links to it. New screenshot-based guides are generated as standalone pages with responsive dark styling, orange headings, system typography, and full-size screenshot links. No framework, dependencies, or AI API key is required.

## Add a build with Codex

Upload your build screenshots **in the Codex conversation** and ask:

> Follow AGENTS.md. Extract this build from my screenshots, add a build page and library entry on a new branch, and create a PR targeting main. Flag uncertain facts. Do not merge or publish.

Codex performs image interpretation using its available vision tools; the website itself does not upload images or call an AI service. No screenshots have been supplied for this setup, so no new gameplay facts or placeholder builds are published.

The exact workflow and approval boundary are in [AGENTS.md](AGENTS.md). A successful PR creation requires GitHub API access in addition to Git push access. Review each PR's extracted facts and screenshots before explicitly approving any merge or release. Depending on your hosting configuration, merging main may deploy the site; inspect that configuration before approving a merge. This repository adds no deployment workflow.

## Generate and validate

Python 3.9+ is required (3.12 is available in the cloud environment).

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 -m unittest discover -s tests -v
python3 -m http.server 8000 --bind 127.0.0.1
```

Use the repository root as the working directory. Visit `/builds/index.html` on your local server. The generated HTML is committed so existing static hosting can serve it without a build service. The original homepage remains intact except for the library navigation link.

Copy [docs/build-template.json](docs/build-template.json) to `data/builds/<slug>.json`, replace every example value with verified information, and put real screenshots in `assets/builds/<slug>/`. Empty arrays omit unsupported sections. The generator validates inputs and escapes all supplied text. It updates the library from all build records. Do not edit generated pages directly, remove existing records, or overwrite another build to add a new one.

## GitHub API setting

Current check: Git fetch/push works, but API requests to `api.github.com` are denied by the environment proxy (HTTP 403). In cloud environment settings, keep restricted Internet access and add **`api.github.com`** to **allowed domains**, preserving existing domains/presets. Save/apply the setting and retry:

```sh
gh api repos/WitcheEr-MHOutlanders/MhOutlanders-Builds --jq .full_name
```

If this then reports an authentication/authorization error, configure a supported GitHub API credential securely with Contents and Pull requests read/write access to this repository. The platform's Git proxy credentials alone do not establish API authorization. Never commit or paste a token into chat.

PR creation uses `gh pr create --base main --head <new-branch> --title <title> --body-file <description-file>`. If blocked, provide the comparison link and explain that a PR has not been created. No workflow here merges or publishes automatically.

Build records may optionally include `character_stats`, `visage`, and `buddy` as lists of verified text entries. A `progression` object contains nonempty `skill`, `current`, `target`, and `note` strings to show equipped values separately from author-confirmed targets. Guides with this object use the featured black/orange/gold presentation and the first source screenshot as a cover. See the Midori record for a real screenshot-based example.
