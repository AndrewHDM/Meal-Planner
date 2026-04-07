const STORE_SECTIONS = ["Produce", "Meat/Seafood", "Dairy", "Pantry", "Frozen"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TARGET_SERVINGS = 2;
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
    servings: 2,
    tags: ["favorite", "high effort"],
    ingredients: [
      { section: "Meat/Seafood", item: "pork chops", amount: 10, unit: "oz" },
      { section: "Produce", item: "garlic", amount: 3, unit: "clove" },
      { section: "Produce", item: "carrots", amount: 12, unit: "oz" },
      { section: "Produce", item: "tomato", amount: 1, unit: "whole" },
      { section: "Produce", item: "lemon", amount: 1, unit: "whole" },
      { section: "Dairy", item: "cream cheese", amount: 2, unit: "tbsp" },
      { section: "Pantry", item: "Israeli couscous", amount: 0.5, unit: "cup" },
      { section: "Pantry", item: "chicken stock concentrate", amount: 1, unit: "packet" },
      { section: "Pantry", item: "Italian seasoning", amount: 1, unit: "tbsp" }
    ]
  },
  {
    id: "sweet-soy-meatballs",
    name: "Sweet Soy-Glazed Meatballs",
    servings: 2,
    tags: ["quick", "favorite"],
    ingredients: [
      { section: "Meat/Seafood", item: "ground beef", amount: 10, unit: "oz" },
      { section: "Produce", item: "carrots", amount: 12, unit: "oz" },
      { section: "Produce", item: "broccoli", amount: 1, unit: "whole" },
      { section: "Produce", item: "garlic", amount: 2, unit: "clove" },
      { section: "Pantry", item: "sweet soy glaze", amount: 4, unit: "tbsp" },
      { section: "Pantry", item: "sesame seeds", amount: 1, unit: "tbsp" },
      { section: "Pantry", item: "panko breadcrumbs", amount: 0.75, unit: "cup" },
      { section: "Pantry", item: "sriracha", amount: 1, unit: "tsp" }
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
  addRecipePhotoBtn: document.getElementById("addRecipePhotoBtn"),
  importBtn: document.getElementById("importBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  printBtn: document.getElementById("printBtn"),
  clearWeekBtn: document.getElementById("clearWeekBtn"),
  saveWeekBtn: document.getElementById("saveWeekBtn"),
  repeatWeekBtn: document.getElementById("repeatWeekBtn"),
  recipeDialog: document.getElementById("recipeDialog"),
  recipeDialogTitle: document.getElementById("recipeDialogTitle"),
  recipeForm: document.getElementById("recipeForm"),
  ingredientRows: document.getElementById("ingredientRows"),
  addIngredientRowBtn: document.getElementById("addIngredientRowBtn"),
  cancelDialog: document.getElementById("cancelDialog"),
  photoDialog: document.getElementById("photoDialog"),
  photoInput: document.getElementById("photoInput"),
  photoPreview: document.getElementById("photoPreview"),
  photoText: document.getElementById("photoText"),
  cancelPhotoDialog: document.getElementById("cancelPhotoDialog"),
  usePhotoTextBtn: document.getElementById("usePhotoTextBtn")
};

const state = {
  recipes: [...defaultRecipes, ...loadJson("mealPlannerRecipes", [])],
  selected: new Set(loadJson("mealPlannerSelected", [])),
  assignments: loadJson("mealPlannerAssignments", Object.fromEntries(DAYS.map((d) => [d, ""]))),
  includeStaples: loadJson("mealPlannerIncludeStaples", false),
  groceryChecks: loadJson("mealPlannerGroceryChecks", {}),
  savedWeek: loadJson("mealPlannerSavedWeek", null),
  draftIngredients: []
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
  localStorage.setItem("mealPlannerSavedWeek", JSON.stringify(state.savedWeek));
}

function normalize(text) {
  return (text || "").toString().trim().toLowerCase();
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
  const split = line.split("|").map((part) => part.trim());
  if (split.length >= 2) {
    const section = STORE_SECTIONS.find((s) => normalize(s) === normalize(split[0]));
    const right = split.slice(1).join(" |");
    const match = right.match(/^([\d.]+)\s+([^\s]+)\s+(.+)$/);
    if (section && match) {
      return { section, amount: Number(match[1]), unit: match[2], item: match[3] };
    }
  }

  const match = line.match(/^([\d.]+)\s+([^\s]+)\s+(.+)$/);
  if (!match) return null;
  const item = match[3].trim();
  return {
    section: inferSection(item),
    amount: Number(match[1]),
    unit: match[2],
    item
  };
}

function inferSection(item) {
  const name = normalize(item);
  if (["chicken", "beef", "pork", "fish", "salmon", "shrimp", "turkey"].some((w) => name.includes(w))) {
    return "Meat/Seafood";
  }
  if (["milk", "cheese", "yogurt", "cream", "sour cream", "butter"].some((w) => name.includes(w))) {
    return "Dairy";
  }
  if (["frozen", "ice cream"].some((w) => name.includes(w))) {
    return "Frozen";
  }
  if (["onion", "garlic", "tomato", "carrot", "broccoli", "pepper", "potato", "lime", "lemon"].some((w) => name.includes(w))) {
    return "Produce";
  }
  return "Pantry";
}

function makeIngredientRow(ingredient = { section: "Pantry", amount: "", unit: "", item: "" }) {
  return {
    section: ingredient.section || "Pantry",
    amount: ingredient.amount ?? "",
    unit: ingredient.unit || "",
    item: ingredient.item || ""
  };
}

function renderIngredientRows() {
  el.ingredientRows.innerHTML = "";
  state.draftIngredients.forEach((row, index) => {
    const wrap = document.createElement("div");
    wrap.className = "ingredient-row";

    const section = document.createElement("select");
    STORE_SECTIONS.forEach((s) => {
      const option = document.createElement("option");
      option.value = s;
      option.textContent = s;
      if (row.section === s) option.selected = true;
      section.append(option);
    });

    const amount = document.createElement("input");
    amount.type = "number";
    amount.step = "0.25";
    amount.min = "0";
    amount.placeholder = "Amt";
    amount.value = row.amount;

    const unit = document.createElement("input");
    unit.placeholder = "Unit";
    unit.value = row.unit;

    const item = document.createElement("input");
    item.placeholder = "Ingredient";
    item.value = row.item;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";

    section.addEventListener("change", () => {
      state.draftIngredients[index].section = section.value;
    });
    amount.addEventListener("input", () => {
      state.draftIngredients[index].amount = amount.value;
    });
    unit.addEventListener("input", () => {
      state.draftIngredients[index].unit = unit.value;
    });
    item.addEventListener("input", () => {
      state.draftIngredients[index].item = item.value;
    });
    remove.addEventListener("click", () => {
      state.draftIngredients.splice(index, 1);
      renderIngredientRows();
    });

    wrap.append(section, amount, unit, item, remove);
    el.ingredientRows.append(wrap);
  });
}

function collectValidIngredients() {
  return state.draftIngredients
    .map((row) => ({
      section: row.section,
      amount: Number(row.amount),
      unit: row.unit.trim(),
      item: row.item.trim()
    }))
    .filter((row) => row.item && row.unit && row.amount > 0 && STORE_SECTIONS.includes(row.section));
}

function fillFormForRecipe(recipe) {
  el.recipeDialogTitle.textContent = recipe ? "Edit Recipe" : "Add Recipe";
  el.recipeForm.recipeId.value = recipe?.id || "";
  el.recipeForm.name.value = recipe?.name || "";
  el.recipeForm.servings.value = recipe?.servings || TARGET_SERVINGS;
  el.recipeForm.tags.value = recipe?.tags?.join(", ") || "";
  state.draftIngredients = (recipe?.ingredients || [makeIngredientRow()]).map(makeIngredientRow);
  renderIngredientRows();
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

    const select = document.createElement("select");
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
    const scale = TARGET_SERVINGS / recipe.servings;
    recipe.ingredients.forEach((ingredient) => {
      if (!state.includeStaples && isStaple(ingredient.item)) return;
      const key = `${ingredient.section}|${normalize(ingredient.item)}|${normalize(ingredient.unit)}`;
      if (!totals[key]) totals[key] = { ...ingredient, amount: 0 };
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
    el.selectionHint.textContent = `You currently have ${count} meals. Keep it between 3 and 5 for the week.`;
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
        text.classList.toggle("done", box.checked);
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

function clearWeek() {
  const ok = window.confirm("Clear selected meals, weekday assignments, and grocery progress for this week?");
  if (!ok) return;
  state.selected = new Set();
  state.assignments = Object.fromEntries(DAYS.map((d) => [d, ""]));
  state.groceryChecks = {};
  persist();
  renderAll();
}

function saveWeek() {
  state.savedWeek = {
    selected: [...state.selected],
    assignments: { ...state.assignments }
  };
  persist();
  window.alert("Week saved. You can restore it anytime with Repeat Last Week.");
}

function repeatLastWeek() {
  if (!state.savedWeek) {
    window.alert("No saved week yet. Tap Save Week first.");
    return;
  }

  const validIds = new Set(state.recipes.map((r) => r.id));
  state.selected = new Set((state.savedWeek.selected || []).filter((id) => validIds.has(id)));
  const restoredAssignments = Object.fromEntries(DAYS.map((d) => [d, ""]));
  DAYS.forEach((day) => {
    const id = state.savedWeek.assignments?.[day] || "";
    restoredAssignments[day] = validIds.has(id) ? id : "";
  });
  state.assignments = restoredAssignments;
  persist();
  renderAll();
}

function parsePhotoText(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const title = lines[0].replace(/^recipe[:\s-]*/i, "").trim();
  const ingredients = lines
    .slice(1)
    .map(parseIngredientLine)
    .filter(Boolean);

  return {
    name: title || "New Recipe",
    servings: TARGET_SERVINGS,
    tags: [],
    ingredients: ingredients.length ? ingredients : [makeIngredientRow()]
  };
}

function openPhotoDialog() {
  el.photoInput.value = "";
  el.photoText.value = "";
  el.photoPreview.hidden = true;
  el.photoPreview.src = "";
  el.photoDialog.showModal();
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

      parsed
        .filter((r) => r?.name && Array.isArray(r?.ingredients))
        .forEach((recipe) => {
          upsertRecipe({
            id: recipe.id || `user-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
            name: recipe.name,
            servings: Number(recipe.servings) || TARGET_SERVINGS,
            tags: Array.isArray(recipe.tags) ? recipe.tags.map((t) => t.toString()) : [],
            ingredients: recipe.ingredients
              .map((i) => ({
                section: STORE_SECTIONS.includes(i.section) ? i.section : "Pantry",
                item: i.item,
                amount: Number(i.amount) || 0,
                unit: i.unit || "unit"
              }))
              .filter((i) => i.item && i.amount > 0)
          });
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
el.addRecipePhotoBtn.addEventListener("click", openPhotoDialog);

el.cancelDialog.addEventListener("click", () => el.recipeDialog.close());
el.cancelPhotoDialog.addEventListener("click", () => el.photoDialog.close());

el.addIngredientRowBtn.addEventListener("click", () => {
  state.draftIngredients.push(makeIngredientRow());
  renderIngredientRows();
});

el.photoInput.addEventListener("change", () => {
  const file = el.photoInput.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  el.photoPreview.src = url;
  el.photoPreview.hidden = false;
});

el.usePhotoTextBtn.addEventListener("click", () => {
  const parsed = parsePhotoText(el.photoText.value);
  fillFormForRecipe(parsed || { name: "", servings: TARGET_SERVINGS, tags: [], ingredients: [makeIngredientRow()] });
  el.photoDialog.close();
  el.recipeDialog.showModal();
});

el.recipeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(el.recipeForm);
  const ingredients = collectValidIngredients();

  if (!formData.get("name").toString().trim()) {
    window.alert("Recipe name is required.");
    return;
  }

  if (!ingredients.length) {
    window.alert("Add at least one valid ingredient (amount, unit, and name).");
    return;
  }

  const recipeId = formData.get("recipeId").toString() || `user-${Date.now()}`;
  upsertRecipe({
    id: recipeId,
    name: formData.get("name").toString().trim(),
    servings: Number(formData.get("servings")) || TARGET_SERVINGS,
    tags: formData
      .get("tags")
      .toString()
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    ingredients
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
el.clearWeekBtn.addEventListener("click", clearWeek);
el.saveWeekBtn.addEventListener("click", saveWeek);
el.repeatWeekBtn.addEventListener("click", repeatLastWeek);

renderAll();
