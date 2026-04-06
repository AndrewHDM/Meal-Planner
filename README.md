# Meal Planner (iPhone + iPad Friendly)

A lightweight weekly meal planner you can run for free on GitHub Pages.

## What it does

- Choose **3–5 meals** for the week.
- Assign selected meals to **Monday–Sunday**.
- Auto-generate a grocery list grouped by:
  - Produce
  - Meat/Seafood
  - Dairy
  - Pantry
  - Frozen
- Combines duplicate ingredients and scales each recipe to **4 servings**.
- Grocery list checkboxes save progress automatically.
- Pantry staples can be excluded by default (toggle on/off).
- Add, edit, delete recipes.
- Import/export recipes as JSON backups.
- Print-friendly grocery list.

## Quick start (local)

1. Download or clone this repo.
2. Open `index.html` directly in your browser **or** run:

```bash
python3 -m http.server 8000
```

3. Visit `http://localhost:8000`.

## GitHub Pages setup (exact steps)

1. Push this project to a GitHub repo.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or your default branch)
   - **Folder**: `/ (root)`
4. Click **Save**.
5. Wait ~1 minute, then open your site URL shown in Pages settings.

No build tools are required. This app is plain HTML/CSS/JS.

## How to use

1. In **Choose 3–5 Meals**, tap “Add to week” on recipes.
2. In **Assign Meals to Days**, pick meals for each day (optional).
3. In **Grocery List**, check items as you shop.
4. Use **Include pantry staples** if you want basics like oil/butter included.
5. Use **Print** for a paper copy.

## Adding recipes manually

Tap **Add Recipe** and format ingredients one per line like:

```text
Produce | 2 whole onions
Meat/Seafood | 1 lb chicken breast
Pantry | 2 cup rice
```

Supported sections: `Produce`, `Meat/Seafood`, `Dairy`, `Pantry`, `Frozen`.

## Import / Export

- **Export** downloads all current recipes to `meal-planner-recipes.json`.
- **Import** merges recipes from a previous export file.

## Notes

- Custom data is saved in your browser (`localStorage`) on that device.
- If you clear browser data, local recipes/plans/checkmarks will reset.
