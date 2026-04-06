const STORE_SECTIONS = ["Produce", "Meat/Seafood", "Dairy", "Pantry", "Frozen"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NEWLINE = "\n";
const STAPLE_KEYWORDS = [
  "salt",
  "pepper",
  "olive oil",
  "cooking oil",
  "butter",
  "mayonnaise",
  "flour",
  "sugar",
  "water"
];

const defaultRecipes = [
  {
    id: "herby-pork-chops",
    name: "Herby Pork Chops in Tomato Cream Sauce",
    servings: 4,
    tags: ["favorite", "high effort"],
    ingredients: [
      { section: "Meat/Seafood", item: "pork chops", amount: 20, unit: "oz" },
      { section: "Produce", item: "garlic", amount: 6, unit: "clove" },
      { section: "Produce", item: "carrots", amount: 24, unit: "oz" },
      { section: "Produce", item: "tomato", amount: 2, unit: "whole" },
      { section: "Produce", item: "lemon", amount: 2, unit: "whole" },
      { section: "Dairy", item: "cream cheese", amount: 4, unit: "tbsp" },
      { section: "Pantry", item: "Israeli couscous", amount: 1, unit: "cup" },
      { section: "Pantry", item: "chicken stock concentrate", amount: 2, unit: "packet" },
      { section: "Pantry", item: "Italian seasoning", amount: 2, unit: "tbsp" }
    ]
  },
  {
    id: "sweet-soy-meatballs",
    name: "Sweet Soy-Glazed Meatballs",
    servings: 4,
    tags: ["quick", "favorite"],
    ingredients: [
      { section: "Meat/Seafood", item: "ground beef", amount: 20, unit: "oz" },
      { section: "Produce", item: "carrots", amount: 24, unit: "oz" },
      { section: "Produce", item: "broccoli", amount: 2, unit: "whole" },
      { section: "Produce", item: "garlic", amount: 4, unit: "clove" },
      { section: "Pantry", item: "sweet soy glaze", amount: 8, unit: "tbsp" },
      { section: "Pantry", item: "sesame seeds", amount: 2, unit: "tbsp" },
      { section: "Pantry", item: "panko breadcrumbs", amount: 1.5, unit: "cup" },
      { section: "Pantry", item: "sriracha", amount: 2, unit: "tsp" }
    ]
  },
  {
    id: "southwest-tacodillas",
    name: "Cheesy Southwest Chicken Tacodillas",
    servings: 4,
    tags: ["quick"],
    ingredients: [
      { section: "Meat/Seafood", item: "ground chicken", amount: 20, unit: "oz" },
      { section: "Produce", item: "onion", amount: 2, unit: "whole" },
      { section: "Produce", item: "tomato", amount: 2, unit: "whole" },
      { section: "Produce", item: "lime", amount: 2, unit: "whole" },
      { section: "Produce", item: "garlic", amount: 4, unit: "clove" },
      { section: "Dairy", item: "mozzarella cheese", amount: 1, unit: "cup" },
      { section: "Pantry", item: "flour tortillas", amount: 12, unit: "count" },
      { section: "Pantry", item: "southwest spice blend", amount: 2, unit: "tbsp" },
      { section: "Pantry", item: "beef stock concentrate", amount: 2, unit: "packet" }
    ]
  },
  {
    id: "buffalo-ranch-chicken",
    name: "Crispy Buffalo Ranch Chicken",
    servings: 4,
    tags: ["high effort"],
    ingredients: [
      { section: "Meat/Seafood", item: "chicken cutlets", amount: 20, unit: "oz" },
      { section: "Produce", item: "carrots", amount: 24, unit: "oz" },
      { section: "Produce", item: "potatoes", amount: 24, unit: "oz" },
      { section: "Produce", item: "garlic", amount: 4, unit: "clove" },
      { section: "Dairy", item: "sour cream", amount: 3, unit: "tbsp" },
      { section: "Pantry", item: "honey", amount: 4, unit: "tsp" },
      { section: "Pantry", item: "frank's seasoning blend", amount: 0.5, unit: "oz" },
      { section: "Pantry", item: "panko breadcrumbs", amount: 1, unit: "cup" },
      { section: "Pantry", item: "buttermilk ranch dressing", amount: 3, unit: "oz" }
    ]
  },
  {
    id: "stuffed-meatloaves",
    name: "Smothered & Stuffed Meatloaves",
    servings: 4,
    tags: ["high effort", "favorite"],
    ingredients: [
      { section: "Meat/Seafood", item: "ground beef", amount: 20, unit: "oz" },
      { section: "Produce", item: "onion", amount: 2, unit: "whole" },
      { section: "Produce", item: "green bell pepper", amount: 2, unit: "whole" },
      { section: "Produce", item: "green beans", amount: 12, unit: "oz" },
      { section: "Dairy", item: "cream cheese", amount: 4, unit: "tbsp" },
      { section: "Pantry", item: "fry seasoning", amount: 2, unit: "tsp" },
      { section: "Pantry", item: "panko breadcrumbs", amount: 0.5, unit: "cup" },
      { section: "Pantry", item: "Worcestershire sauce", amount: 2, unit: "tsp" },
      { section: "Pantry", item: "dijon mustard", amount: 2, unit: "tsp" }
    ]
  }
];

const el = {
  recipesGrid: document.getElementById("recipesGrid"),
  weeklyPlanner: document.getElementById("weeklyPlanner"),
  groceryList: document.getElementById("groceryList"),
  selectionHint: document.getElementById("selectionHint"),
  selectionCount: document.getElementById("selectionCount"),
  tagFilter: document.getElementById("tagFilter"),
  includeStaples: document.getElementById("includeStaples"),
  addRecipeBtn: document.getElementById("addRecipeBtn"),
  importBtn: document.getElementById("importBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  printBtn: document.getElementById("printBtn"),
  recipeDialog: document.getElementById("recipeDialog"),
  recipeDialogTitle: document.getElementById("recipeDialogTitle"),
  recipeForm: document.getElementById("recipeForm"),
  cancelDialog: document.getElementById("cancelDialog")
};

const state = {
  recipes: [...defaultRecipes, ...loadJson("mealPlannerRecipes", [])],
  selected: new Set(loadJson("mealPlannerSelected", [])),
  assignments: loadJson("mealPlannerAssignments", Object.fromEntries(DAYS.map((d) => [d, ""]))),
  includeStaples: loadJson("mealPlannerIncludeStaples", false),
  groceryChecks: loadJson("mealPlannerGroceryChecks", {})
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem("mealPlannerRecipes", JSON.stringify(state.recipes.filter((r) => r.id.startsWith("user-"))));
  localStorage.setItem("mealPlannerSelected", JSON.stringify([...state.selected]));
  localStorage.setItem("mealPlannerAssignments", JSON.stringify(state.assignments));
  localStorage.setItem("mealPlannerIncludeStaples", JSON.stringify(state.includeStaples));
  localStorage.setItem("mealPlannerGroceryChecks", JSON.stringify(state.groceryChecks));
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function isStaple(itemName) {
  const name = normalize(itemName);
  return STAPLE_KEYWORDS.some((keyword) => name.includes(keyword));
}

function formatAmount(num) {
  return Number.isInteger(num) ? `${num}` : `${parseFloat(num.toFixed(2))}`;
}

function upsertRecipe(recipe) {
  const idx = state.recipes.findIndex((r) => r.id === recipe.id);
  if (idx >= 0) state.recipes[idx] = recipe;
  else state.recipes.push(recipe);
}

function parseIngredientLine(line) {
  const [left, right] = line.split("|").map((part) => part.trim());
  if (!left || !right) return null;
  const match = right.match(/^([\d.]+)\s+([^\s]+)\s+(.+)$/);
  if (!match) return null;
  const normalizedSection = STORE_SECTIONS.find((s) => normalize(s) === normalize(left));
  if (!normalizedSection) return null;

  return {
    section: normalizedSection,
    amount: Number(match[1]),
    unit: match[2],
    item: match[3]
  };
}

function fillFormForRecipe(recipe) {
  el.recipeDialogTitle.textContent = recipe ? "Edit Recipe" : "Add Recipe";
  el.recipeForm.recipeId.value = recipe?.id || "";
  el.recipeForm.name.value = recipe?.name || "";
  el.recipeForm.servings.value = recipe?.servings || 4;
  el.recipeForm.tags.value = recipe?.tags?.join(", ") || "";
  el.recipeForm.ingredients.value = recipe
    ? recipe.ingredients.map((i) => `${i.section} | ${i.amount} ${i.unit} ${i.item}`).join(NEWLINE)
    : "";
}

function renderRecipes() {
  const filter = el.tagFilter.value;
  const recipes = state.recipes.filter((recipe) =>
    filter === "all" ? true : recipe.tags.map(normalize).includes(normalize(filter))
  );

  el.recipesGrid.innerHTML = "";
  recipes.forEach((recipe) => {
    const card = document.createElement("article");
    card.className = `recipe-card ${state.selected.has(recipe.id) ? "selected" : ""}`;

    const pick = document.createElement("label");
    pick.className = "checkbox-inline";
    pick.innerHTML = `<input type="checkbox" ${state.selected.has(recipe.id) ? "checked" : ""}/> Add to week`;
    pick.querySelector("input").addEventListener("change", () => {
      if (state.selected.has(recipe.id)) state.selected.delete(recipe.id);
      else state.selected.add(recipe.id);
      persist();
      renderAll();
    });

    const title = document.createElement("div");
    title.className = "recipe-title";
    title.textContent = recipe.name;

    const tagWrap = document.createElement("div");
    tagWrap.className = "tags";
    recipe.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      tagWrap.appendChild(span);
    });

    const actions = document.createElement("div");
    actions.className = "recipe-actions no-print";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      fillFormForRecipe(recipe);
      el.recipeDialog.showModal();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      if (!window.confirm(`Delete "${recipe.name}"?`)) return;
      state.recipes = state.recipes.filter((r) => r.id !== recipe.id);
      state.selected.delete(recipe.id);
      Object.keys(state.assignments).forEach((day) => {
        if (state.assignments[day] === recipe.id) state.assignments[day] = "";
      });
      persist();
      renderAll();
    });

    actions.append(editBtn, deleteBtn);
    card.append(pick, title, tagWrap, actions);
    el.recipesGrid.append(card);
  });

  el.selectionCount.textContent = `${state.selected.size} selected`;
}

function renderPlanner() {
  el.weeklyPlanner.innerHTML = "";
  const selectedRecipes = state.recipes.filter((r) => state.selected.has(r.id));

  DAYS.forEach((day) => {
    const row = document.createElement("div");
    row.className = "day-row";

    const label = document.createElement("label");
    label.textContent = day;
    label.htmlFor = `day-${day}`;

    const select = document.createElement("select");
    select.id = `day-${day}`;
    select.innerHTML = `<option value="">Unplanned</option>`;
    selectedRecipes.forEach((recipe) => {
      const option = document.createElement("option");
      option.value = recipe.id;
      option.textContent = recipe.name;
      if (state.assignments[day] === recipe.id) option.selected = true;
      select.append(option);
    });

    select.addEventListener("change", () => {
      state.assignments[day] = select.value;
      persist();
      renderGroceryList();
    });

    row.append(label, select);
    el.weeklyPlanner.append(row);
  });
}

function getActiveRecipeIds() {
  return [...state.selected];
}

function grocerySessionKey(activeRecipeIds) {
  const daysKey = DAYS.map((d) => state.assignments[d] || "-").join("|");
  return `${activeRecipeIds.slice().sort().join(",")}::${daysKey}::${state.includeStaples}`;
}

function buildGroceryItems() {
  const activeRecipeIds = getActiveRecipeIds();
  const activeRecipes = state.recipes.filter((r) => activeRecipeIds.includes(r.id));
  const totals = {};

  activeRecipes.forEach((recipe) => {
    const scale = 4 / recipe.servings;
    recipe.ingredients.forEach((ingredient) => {
      if (!state.includeStaples && isStaple(ingredient.item)) return;
      const key = `${ingredient.section}|${normalize(ingredient.item)}|${normalize(ingredient.unit)}`;
      if (!totals[key]) {
        totals[key] = { ...ingredient, amount: 0 };
      }
      totals[key].amount += ingredient.amount * scale;
    });
  });

  return Object.values(totals).sort((a, b) => a.item.localeCompare(b.item));
}

function renderGroceryList() {
  const activeRecipeIds = getActiveRecipeIds();
  const count = activeRecipeIds.length;

  if (count === 0) {
    el.selectionHint.textContent = "Select meals to generate your grocery list.";
    el.groceryList.innerHTML = "";
    return;
  }

  if (count < 3 || count > 5) {
    el.selectionHint.textContent =
      `You currently have ${count} meals. Keep it between 3 and 5 for the week.`;
  } else {
    el.selectionHint.textContent = "Ready to shop. Check items off as you go.";
  }

  const items = buildGroceryItems();
  const sessionKey = grocerySessionKey(activeRecipeIds);
  const checks = state.groceryChecks[sessionKey] || {};
  el.groceryList.innerHTML = "";

  STORE_SECTIONS.forEach((section) => {
    const sectionItems = items.filter((item) => item.section === section);
    if (!sectionItems.length) return;

    const group = document.createElement("section");
    group.className = "group";

    const title = document.createElement("h3");
    title.textContent = section;

    const list = document.createElement("ul");
    sectionItems.forEach((item) => {
      const li = document.createElement("li");
      const key = `${section}|${normalize(item.item)}|${normalize(item.unit)}`;

      const wrap = document.createElement("label");
      wrap.className = "checkbox-inline";

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = Boolean(checks[key]);

      const text = document.createElement("span");
      text.textContent = `${formatAmount(item.amount)} ${item.unit} ${item.item}`;
      if (box.checked) text.classList.add("done");

      box.addEventListener("change", () => {
        const next = state.groceryChecks[sessionKey] || {};
        next[key] = box.checked;
        state.groceryChecks[sessionKey] = next;
        if (box.checked) text.classList.add("done");
        else text.classList.remove("done");
        persist();
      });

      wrap.append(box, text);
      li.append(wrap);
      list.append(li);
    });

    group.append(title, list);
    el.groceryList.append(group);
  });
}

function exportRecipes() {
  const blob = new Blob([JSON.stringify(state.recipes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meal-planner-recipes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importRecipes(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result.toString());
      if (!Array.isArray(parsed)) throw new Error("bad format");
      const valid = parsed.filter((r) => r?.name && Array.isArray(r?.ingredients));
      valid.forEach((recipe) => {
        const normalized = {
          id: recipe.id || `user-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
          name: recipe.name,
          servings: Number(recipe.servings) || 4,
          tags: Array.isArray(recipe.tags) ? recipe.tags.map((t) => t.toString()) : [],
          ingredients: recipe.ingredients
            .map((i) => ({
              section: STORE_SECTIONS.includes(i.section) ? i.section : "Pantry",
              item: i.item,
              amount: Number(i.amount) || 0,
              unit: i.unit || "unit"
            }))
            .filter((i) => i.item && i.amount > 0)
        };
        upsertRecipe(normalized);
      });
      persist();
      renderAll();
    } catch {
      window.alert("Could not import that file. Please use a valid meal-planner JSON export.");
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  renderRecipes();
  renderPlanner();
  renderGroceryList();
}

el.tagFilter.addEventListener("change", renderRecipes);
el.includeStaples.checked = state.includeStaples;
el.includeStaples.addEventListener("change", () => {
  state.includeStaples = el.includeStaples.checked;
  persist();
  renderGroceryList();
});

el.addRecipeBtn.addEventListener("click", () => {
  fillFormForRecipe();
  el.recipeDialog.showModal();
});

el.cancelDialog.addEventListener("click", () => el.recipeDialog.close());

el.recipeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(el.recipeForm);
  const parsedIngredients = formData
    .get("ingredients")
    .toString()
    .split(NEWLINE)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredientLine)
    .filter(Boolean);

  if (!parsedIngredients.length) {
    window.alert("Use ingredient format: Section | amount unit ingredient");
    return;
  }

  const recipeId = formData.get("recipeId").toString() || `user-${Date.now()}`;
  upsertRecipe({
    id: recipeId,
    name: formData.get("name").toString().trim(),
    servings: Number(formData.get("servings")) || 4,
    tags: formData
      .get("tags")
      .toString()
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    ingredients: parsedIngredients
  });

  persist();
  el.recipeDialog.close();
  renderAll();
});

el.exportBtn.addEventListener("click", exportRecipes);
el.importBtn.addEventListener("click", () => el.importFile.click());
el.importFile.addEventListener("change", () => {
  const file = el.importFile.files?.[0];
  if (file) importRecipes(file);
  el.importFile.value = "";
});

el.printBtn.addEventListener("click", () => window.print());

renderAll();
