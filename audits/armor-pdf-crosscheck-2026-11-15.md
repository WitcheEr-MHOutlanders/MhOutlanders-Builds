# Armor PDF ↔ live builder cross-check (2026-11-15)

**Status: audit snapshot, NOT approved armor database import.** This file is saved on a review branch; the published site and existing builder records are unchanged.

## Sources and methodology
- Screenshot source: local corrected `Armor_sets_final_1_to_42(2).pdf`, 452 pages, 42 headings. The PDF is image-based. Page boundaries were confirmed programmatically from its heading text. PDF itself is **not** committed to GitHub.
- Repository source: `builder/index.html` on default branch, embedded `const pieces=[...]` dataset, blob SHA `9b0a64d989a404837fadc5b3be58c64a14f73852` when checked.
- Repository contains **96 piece records**: **19 complete sets (95 pieces)** plus **one Kadachi Helm II**. Remaining 22 numbered sets have no corresponding entries in this embedded dataset.
- Earlier chat reviewed 42 numbered sets; **the earlier transcriptions and repeated AP/Defense numbers are not independently validated in this cross-check**. Do not treat this manifest as a fully verified 210-piece import.
- Source priorities: screenshots for game values; repository for currently implemented values; external web references are secondary and must be specific to **Monster Hunter Outlanders**, not Wilds/World/Rise.

## Coverage by PDF set number

| PDF set # | Set label (working catalog) | PDF pages | Builder pieces | Coverage |
|---:|---|---:|---:|---|
| 1 | Radiant Tzitzi-Ya-Ku Set IV | 1–6 | 5 | Present (not reverified)  |
| 2 | Ruger Aidal Set IV | 7–14 | 5 | Present (not reverified)  |
| 3 | Radiant Paolumu Set IV | 15–23 | 5 | Present (not reverified)  |
| 4 | Pink Rathian Set IV | 24–34 | 5 | Present (not reverified)  |
| 5 | Legiana Set III | 35–44 | 5 | Present (not reverified)  |
| 6 | Paolumu Set III | 45–55 | 5 | Present (not reverified)  |
| 7 | Tzitzi-Ya-Ku Set III | 56–66 | 5 | Present (not reverified)  |
| 8 | Odogaron Set III | 67–78 | 5 | Present (not reverified)  |
| 9 | Baan Set III | 79–89 | 5 | Present (not reverified)  |
| 10 | Radiant Kadachi Set III | 90–100 | 5 | Present (not reverified)  |
| 11 | Radiant Great Girros Set III | 101–111 | 5 | Present (not reverified)  |
| 12 | Diablos Set III | 112–122 | 5 | Present (not reverified)  |
| 13 | Rathalos Set II | 123–133 | 5 | Present (not reverified)  |
| 14 | Rathian Set II | 134–143 | 5 | Present (not reverified)  |
| 15 | Radiant Jyuratodus Set II | 144–153 | 5 | Present (not reverified)  |
| 16 | Ingot Set II | 154–163 | 5 | Present (not reverified)  |
| 17 | Radiant Barroth Set II | 164–172 | 5 | Present (not reverified)  |
| 18 | Radiant Kulu-Ya-Ku Set II | 173–182 | 5 | Present (not reverified)  |
| 19 | Radiant Anjanath Set II | 183–194 | 5 | Present (not reverified)  |
| 20 | Kadachi Set II | 195–204 | 1 | Partial |
| 21 | Butterfly Set I | 205–215 | 0 | Missing |
| 22 | King Beetle Set I | 216–225 | 0 | Missing |
| 23 | High Metal Set I | 226–236 | 0 | Missing |
| 24 | Hornetaur Set I | 237–246 | 0 | Missing |
| 25 | Radiant Pukei-Pukei Set I | 247–258 | 0 | Missing |
| 26 | Radiant Great Jagras Set I | 259–269 | 0 | Missing |
| 27 | Alloy Set I | 270–278 | 0 | Missing |
| 28 | Radiant Rathian Set I | 279–290 | 0 | Missing |
| 29 | Anjanath Set I | 291–308 | 0 | Missing |
| 30 | Vespoid Set I | 309–319 | 0 | Missing |
| 31 | Hunter Set I | 320–329 | 0 | Missing |
| 32 | Bone Set I | 330–340 | 0 | Missing |
| 33 | Barroth Set I | 341–352 | 0 | Missing |
| 34 | Jyuratodus Set I | 353–363 | 0 | Missing |
| 35 | Great Girros Set I | 364–375 | 0 | Missing |
| 36 | Chainmail Set I | 376–387 | 0 | Missing |
| 37 | Leather Set I | 388–397 | 0 | Missing |
| 38 | Pukei-Pukei Set I | 398–410 | 0 | Missing |
| 39 | Kulu-Ya-Ku Set I | 411–421 | 0 | Missing |
| 40 | Great Jagras Set I | 422–433 | 0 | Missing |
| 41 | Radiant Diablos Set V | 434–441 | 0 | Missing |
| 42 | Adventurers' Guild Set IV | 442–452 | 0 | Missing |

## Confirmed discrepancies / action items
1. **Missing records:** PDF groups 21–42 (22 sets, expected 110 pieces) are absent from the current embedded builder array.
2. **Partial record:** PDF group 20 / Kadachi Set II has only `Kadachi Helm II` in the builder (4 missing pieces).
3. **Coverage:** Current builder contains 96 pieces vs. an expected 210 for 42 complete five-piece sets; **114 missing piece records** if every group has exactly five.
4. **Verification warning:** Earlier chat outputs reused `633/151`, `633/149`, `745/163` across many unrelated sets. These figures must be re-read from each actual screenshot before import; do not mass-apply them.
5. **Rarity rules:** `Equipment Skill: Unlocks at Rarity N` is a resulting skill level, not an additive bonus. Keep set effects separate from individual piece skills.
6. **Do not overwrite:** No existing armor record has been edited. Only update records after screenshot-level field-by-field comparison and review.

## External web check
A general web search did not establish a trustworthy, current, official Outlanders armor dataset covering these 42 sets. Results about other Monster Hunter games are **not** authoritative for Outlanders.

## Next steps
- Re-read each PDF piece screenshot for exact names, rarity, AP, defense, base skills, rarity unlocks, and set bonuses.
- Compare exact values to embedded builder records for sets 1–20, log differences with PDF page citations, and avoid replacing data automatically.
- Add missing sets 20–42 in a separate data-only staging branch with tests, then seek approval before publishing.
