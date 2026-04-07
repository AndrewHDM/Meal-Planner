const STORE_SECTIONS = ["Produce", "Meat/Seafood", "Dairy", "Pantry", "Frozen"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TARGET_SERVINGS = 2;
const LIBRARY_KEY = "mealPlannerRecipeLibrary";

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
    instructions: "Pan-sear pork, roast carrots, and finish with tomato cream sauce.",
    ingredients: [
      { section: "Meat/Seafood", item: "pork chops", amount: 10, unit: "oz" },
      { section: "Produce", item: "garlic", amount: 3, unit: "clove" },
      { section: "Produce", item: "carrots", amount: 12, unit: "oz" },
      { section: "Produce", item: "tomato", amount: 1, unit: "whole" },
      { section: "Produce", item: "lemon", amount: 1, unit: "whole" },
      { section: "Dairy", item: "cream cheese", amount: 2, unit: "tbsp" },
      { section: "Pantry", item: "Israeli couscous", amount: 0.5, unit: "cup" }
    ]
  },
  {
    id: "sweet-soy-meatballs",
    name: "Sweet Soy-Glazed Meatballs",
    servings: 2,
    tags: ["quick", "favorite"],
    instructions: "Mix and bake meatballs, roast veggies, then glaze with sweet soy.",
    ingredients: [
      { section: "Meat/Seafood", item: "ground beef", amount: 10, unit: "oz" },
      { section: "Produce", item: "carrots", amount: 12, unit: "oz" },
      { section: "Produce", item: "broccoli", amount: 1, unit: "whole" },
      { section: "Produce", item: "garlic", amount: 2, unit: "clove" },
      { section: "Pantry", item: "sweet soy glaze", amount: 4, unit: "tbsp" },
      { section: "Pantry", item: "panko breadcrumbs", amount: 0.75, unit: "cup" }
    ]
  },
  {
    id: "southwest-tacodillas",
    name: "Cheesy Southwest Chicken Tacodillas",
    servings: 2,
    tags: ["quick"],
    instructions: "Cook chicken filling, stuff tortillas with cheese, and griddle until crisp.",
    ingredients: [
      { section: "Meat/Seafood", item: "ground chicken", amount: 10, unit: "oz" },
      { section: "Produce", item: "onion", amount: 1, unit: "whole" },
      { section: "Produce", item: "tomato", amount: 1, unit: "whole" },
      { section: "Produce", item: "lime", amount: 1, unit: "whole" },
      { section: "Dairy", item: "mozzarella cheese", amount: 0.5, unit: "cup" },
      { section: "Pantry", item: "flour tortillas", amount: 6, unit: "count" }
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
  quickAddBtn: document.getElementById("quickAddBtn"),
  bulkUploadBtn: document.getElementById("bulkUploadBtn"),
  bulkPhotoInput: document.getElementById("bulkPhotoInput"),
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
  quickAddDialog: document.getElementById("quickAddDialog"),
  quickAddForm: document.getElementById("quickAddForm"),
  cancelQuickAddDialog: document.getElementById("cancelQuickAddDialog"),
  bulkReviewDialog: document.getElementById("bulkReviewDialog"),
  draftQueueList: document.getElementById("draftQueueList"),
  draftPreview: document.getElementById("draftPreview"),
  draftTitle: document.getElementById("draftTitle"),
  draftIngredients: document.getElementById("draftIngredients"),
  draftInstructions: document.getElementById("draftInstructions"),
  draftTags: document.getElementById("draftTags"),
  skipDraftBtn: document.getElementById("skipDraftBtn"),
  saveDraftBtn: document.getElementById("saveDraftBtn"),
  saveNextDraftBtn: document.getElementById("saveNextDraftBtn"),
  closeBulkDialogBtn: document.getElementById("closeBulkDialogBtn")
};

const state = {
  recipes: initRecipeLibrary(),
  selected: new Set(loadJson("mealPlannerSelected", [])),
  assignments: loadJson("mealPlannerAssignments", Object.fromEntries(DAYS.map((d) => [d, ""]))),
  includeStaples: loadJson("mealPlannerIncludeStaples", false),
  groceryChecks: loadJson("mealPlannerGroceryChecks", {}),
  savedWeek: loadJson("mealPlannerSavedWeek", null),
  draftIngredients: [],
  bulkDrafts: [],
  bulkIndex: 0
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalize(text) {
  return (text || "").toString().trim().toLowerCase();
}

function normalizeRecipe(recipe) {
  const safeIngredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
        .map((i) => ({
          section: STORE_SECTIONS.includes(i.section) ? i.section : inferSection(i.item || ""),
          item: (i.item || "").toString().trim(),
          amount: Number(i.amount) || 0,
          unit: (i.unit || "unit").toString().trim()
        }))
        .filter((i) => i.item && i.amount > 0)
    : [];

  return {
    id: recipe.id || `user-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    name: (recipe.name || "Untitled Recipe").toString().trim(),
    servings: Number(recipe.servings) || TARGET_SERVINGS,
    tags: Array.isArray(recipe.tags) ? recipe.tags.map((t) => t.toString().trim().toLowerCase()).filter(Boolean) : [],
    instructions: (recipe.instructions || "").toString(),
    ingredients: safeIngredients
  };
}

function mergeRecipes(sources) {
  const map = new Map();
  sources.flat().forEach((recipe) => {
    const normalized = normalizeRecipe(recipe);
    const key = normalized.id || `name:${normalize(normalized.name)}`;
    const nameKey = `name:${normalize(normalized.name)}`;
    const existing = map.get(key) || map.get(nameKey);
    if (existing) {
      map.set(existing.id, {
        ...existing,
        ...normalized,
        tags: [...new Set([...(existing.tags || []), ...(normalized.tags || [])]),],
        ingredients: normalized.ingredients.length ? normalized.ingredients : existing.ingredients,
        instructions: normalized.instructions || existing.instructions
      });
      return;
    }
    map.set(normalized.id, normalized);
  });
  return [...map.values()];
}

function initRecipeLibrary() {
  const legacyUser = loadJson("mealPlannerRecipes", []);
  const currentLibrary = loadJson(LIBRARY_KEY, []);
  const merged = mergeRecipes([defaultRecipes, currentLibrary, legacyUser]);
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(merged));
  return merged;
}

function persist() {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(state.recipes));
  localStorage.setItem("mealPlannerRecipes", JSON.stringify(state.recipes));
  localStorage.setItem("mealPlannerSelected", JSON.stringify([...state.selected]));
  localStorage.setItem("mealPlannerAssignments", JSON.stringify(state.assignments));
  localStorage.setItem("mealPlannerIncludeStaples", JSON.stringify(state.includeStaples));
  localStorage.setItem("mealPlannerGroceryChecks", JSON.stringify(state.groceryChecks));
  localStorage.setItem("mealPlannerSavedWeek", JSON.stringify(state.savedWeek));
}

function isStaple(itemName) {
  const name = normalize(itemName);
  return STAPLE_KEYWORDS.some((keyword) => name.includes(keyword));
}

function formatAmount(num) {
  return Number.isInteger(num) ? `${num}` : `${parseFloat(num.toFixed(2))}`;
}

function inferSection(item) {
  const name = normalize(item);
  if (["chicken", "beef", "pork", "fish", "salmon", "shrimp", "turkey"].some((w) => name.includes(w))) return "Meat/Seafood";
  if (["milk", "cheese", "yogurt", "cream", "butter"].some((w) => name.includes(w))) return "Dairy";
  if (["frozen", "ice cream"].some((w) => name.includes(w))) return "Frozen";
  if (["onion", "garlic", "tomato", "carrot", "broccoli", "pepper", "potato", "lime", "lemon"].some((w) => name.includes(w))) return "Produce";
  return "Pantry";
}

function parseIngredientLine(line) {
  const split = line.split("|").map((part) => part.trim());
  if (split.length >= 2) {
    const section = STORE_SECTIONS.find((s) => normalize(s) === normalize(split[0]));
    const right = split.slice(1).join("|").trim();
    const match = right.match(/^([\d.]+)\s+([^\s]+)\s+(.+)$/);
    if (section && match) return { section, amount: Number(match[1]), unit: match[2], item: match[3] };
  }
  const match = line.match(/^([\d.]+)\s+([^\s]+)\s+(.+)$/);
  if (!match) return null;
  return { section: inferSection(match[3]), amount: Number(match[1]), unit: match[2], item: match[3] };
}

function parseIngredientsText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredientLine)
    .filter(Boolean);
}

function upsertRecipe(recipe) {
  const normalized = normalizeRecipe(recipe);
  const idx = state.recipes.findIndex((r) => r.id === normalized.id);
  if (idx >= 0) state.recipes[idx] = normalized;
  else state.recipes.push(normalized);
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

    section.addEventListener("change", () => (state.draftIngredients[index].section = section.value));
    amount.addEventListener("input", () => (state.draftIngredients[index].amount = amount.value));
    unit.addEventListener("input", () => (state.draftIngredients[index].unit = unit.value));
    item.addEventListener("input", () => (state.draftIngredients[index].item = item.value));
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
    .map((row) => ({ section: row.section, amount: Number(row.amount), unit: row.unit.trim(), item: row.item.trim() }))
    .filter((row) => row.item && row.unit && row.amount > 0 && STORE_SECTIONS.includes(row.section));
}

function fillFormForRecipe(recipe) {
  el.recipeDialogTitle.textContent = recipe ? "Edit Recipe" : "Add Recipe";
  el.recipeForm.recipeId.value = recipe?.id || "";
  el.recipeForm.name.value = recipe?.name || "";
  el.recipeForm.servings.value = recipe?.servings || TARGET_SERVINGS;
  el.recipeForm.tags.value = recipe?.tags?.join(", ") || "";
  el.recipeForm.instructions.value = recipe?.instructions || "";
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
  const activeRecipes = state.recipes.filter((r) => getActiveRecipeIds().includes(r.id));
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

  el.selectionHint.textContent = count < 3 || count > 5
    ? `You currently have ${count} meals. Keep it between 3 and 5 for the week.`
    : "Ready to shop. Check items off as you go.";

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
  if (!window.confirm("Clear selected meals, weekday assignments, and grocery progress for this week?")) return;
  state.selected = new Set();
  state.assignments = Object.fromEntries(DAYS.map((d) => [d, ""]));
  state.groceryChecks = {};
  persist();
  renderAll();
}

function saveWeek() {
  state.savedWeek = { selected: [...state.selected], assignments: { ...state.assignments } };
  persist();
  window.alert("Week saved. You can restore it with Repeat Last Week.");
}

function repeatLastWeek() {
  if (!state.savedWeek) {
    window.alert("No saved week yet. Tap Save Week first.");
    return;
  }
  const validIds = new Set(state.recipes.map((r) => r.id));
  state.selected = new Set((state.savedWeek.selected || []).filter((id) => validIds.has(id)));
  state.assignments = Object.fromEntries(DAYS.map((day) => {
    const id = state.savedWeek.assignments?.[day] || "";
    return [day, validIds.has(id) ? id : ""];
  }));
  persist();
  renderAll();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function filenameToTitle(name) {
  return name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() || "Untitled Recipe";
}

async function startBulkUpload(files) {
  const drafts = await Promise.all(
    [...files].map(async (file, idx) => ({
      id: `draft-${Date.now()}-${idx}`,
      title: filenameToTitle(file.name),
      ingredientsText: "",
      instructions: "",
      tags: "",
      imageData: await readFileAsDataURL(file),
      status: "pending"
    }))
  );

  state.bulkDrafts = drafts;
  state.bulkIndex = 0;
  renderBulkQueue();
  loadBulkDraft(0);
  el.bulkReviewDialog.showModal();
}

function renderBulkQueue() {
  el.draftQueueList.innerHTML = "";
  state.bulkDrafts.forEach((draft, idx) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `draft-item ${idx === state.bulkIndex ? "active" : ""}`;
    button.textContent = `${idx + 1}. ${draft.title || "Untitled"} (${draft.status})`;
    button.addEventListener("click", () => loadBulkDraft(idx));
    el.draftQueueList.append(button);
  });
}

function loadBulkDraft(idx) {
  if (!state.bulkDrafts[idx]) return;
  state.bulkIndex = idx;
  const draft = state.bulkDrafts[idx];
  el.draftPreview.hidden = !draft.imageData;
  el.draftPreview.src = draft.imageData || "";
  el.draftTitle.value = draft.title || "";
  el.draftIngredients.value = draft.ingredientsText || "";
  el.draftInstructions.value = draft.instructions || "";
  el.draftTags.value = draft.tags || "";
  renderBulkQueue();
}

function saveDraftToState() {
  const draft = state.bulkDrafts[state.bulkIndex];
  if (!draft) return false;

  draft.title = el.draftTitle.value.trim();
  draft.ingredientsText = el.draftIngredients.value;
  draft.instructions = el.draftInstructions.value;
  draft.tags = el.draftTags.value;

  const ingredients = parseIngredientsText(draft.ingredientsText);
  if (!draft.title || !ingredients.length) {
    window.alert("Add at least a title and one valid ingredient line before saving.");
    return false;
  }

  upsertRecipe({
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name: draft.title,
    servings: TARGET_SERVINGS,
    tags: draft.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    instructions: draft.instructions,
    ingredients
  });

  draft.status = "saved";
  persist();
  renderAll();
  renderBulkQueue();
  return true;
}

function moveToNextDraft() {
  const next = state.bulkDrafts.findIndex((d, i) => i > state.bulkIndex && d.status !== "saved");
  if (next >= 0) {
    loadBulkDraft(next);
    return;
  }
  window.alert("No more pending drafts. You can close this queue.");
}

function quickAddRecipe(formData) {
  const name = formData.get("name").toString().trim();
  const ingredients = parseIngredientsText(formData.get("ingredients").toString());
  if (!name || !ingredients.length) {
    window.alert("Quick Add needs a title and at least one valid ingredient line.");
    return false;
  }

  upsertRecipe({
    id: `user-${Date.now()}`,
    name,
    servings: TARGET_SERVINGS,
    tags: formData.get("tags").toString().split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    instructions: formData.get("instructions").toString(),
    ingredients
  });
  persist();
  renderAll();
  return true;
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

el.quickAddBtn.addEventListener("click", () => {
  el.quickAddForm.reset();
  el.quickAddDialog.showModal();
});

el.cancelQuickAddDialog.addEventListener("click", () => el.quickAddDialog.close());

el.quickAddForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const ok = quickAddRecipe(new FormData(el.quickAddForm));
  if (ok) el.quickAddDialog.close();
});

el.bulkUploadBtn.addEventListener("click", () => el.bulkPhotoInput.click());
el.bulkPhotoInput.addEventListener("change", async () => {
  const files = el.bulkPhotoInput.files;
  if (files?.length) await startBulkUpload(files);
  el.bulkPhotoInput.value = "";
});

el.saveDraftBtn.addEventListener("click", saveDraftToState);
el.saveNextDraftBtn.addEventListener("click", () => {
  if (saveDraftToState()) moveToNextDraft();
});
el.skipDraftBtn.addEventListener("click", moveToNextDraft);
el.closeBulkDialogBtn.addEventListener("click", () => el.bulkReviewDialog.close());

el.cancelDialog.addEventListener("click", () => el.recipeDialog.close());
el.addIngredientRowBtn.addEventListener("click", () => {
  state.draftIngredients.push(makeIngredientRow());
  renderIngredientRows();
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
    window.alert("Add at least one valid ingredient (section, amount, unit, ingredient).");
    return;
  }

  upsertRecipe({
    id: formData.get("recipeId").toString() || `user-${Date.now()}`,
    name: formData.get("name").toString().trim(),
    servings: Number(formData.get("servings")) || TARGET_SERVINGS,
    tags: formData.get("tags").toString().split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    instructions: formData.get("instructions").toString(),
    ingredients
  });

  persist();
  el.recipeDialog.close();
  renderAll();
});

el.importBtn.addEventListener("click", () => el.importFile.click());
el.importFile.addEventListener("change", () => {
  const file = el.importFile.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result.toString());
      const imported = Array.isArray(parsed) ? parsed : [];
      state.recipes = mergeRecipes([state.recipes, imported]);
      persist();
      renderAll();
    } catch {
      window.alert("Could not import that file. Please use a valid recipe JSON export.");
    }
  };
  reader.readAsText(file);
  el.importFile.value = "";
});

el.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.recipes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meal-planner-recipes.json";
  a.click();
  URL.revokeObjectURL(url);
});

el.printBtn.addEventListener("click", () => window.print());
el.clearWeekBtn.addEventListener("click", clearWeek);
el.saveWeekBtn.addEventListener("click", saveWeek);
el.repeatWeekBtn.addEventListener("click", repeatLastWeek);

persist();
renderAll();
