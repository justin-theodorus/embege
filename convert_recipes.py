import csv
import json
import ast
import random
import re

INPUT_CSV = "dataset/full_dataset.csv"
OUTPUT_JSON = "data/recipes.json"
TARGET_COUNT = 5000

CUISINES = ["Italian", "Chinese", "Japanese", "Korean", "Thai", 
            "Indian", "Singaporean", "Western", "Mexican", "Mediterranean"]

MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "dessert"]

DIETARY_TAGS_MAP = {
    "chicken": ["high-protein"],
    "beef": ["high-protein"],
    "tofu": ["vegetarian", "vegan"],
    "chocolate": [],
    "cake": [],
    "salad": ["vegetarian"],
    "soup": [],
}

def parse_list_field(raw):
    """Parse stringified Python lists from the CSV."""
    try:
        return ast.literal_eval(raw)
    except:
        return []

def infer_meal_type(title, ingredients_str):
    title_lower = title.lower()
    if any(w in title_lower for w in ["cake", "pie", "cookie", "dessert", "candy", "fudge", "brownie"]):
        return "dessert"
    if any(w in title_lower for w in ["breakfast", "pancake", "waffle", "muffin", "toast"]):
        return "breakfast"
    if any(w in title_lower for w in ["salad", "sandwich", "wrap", "soup"]):
        return "lunch"
    if any(w in title_lower for w in ["snack", "dip", "chips", "appetizer"]):
        return "snack"
    return "dinner"

def infer_difficulty(directions):
    steps = len(directions)
    if steps <= 4:
        return "easy"
    elif steps <= 8:
        return "medium"
    return "hard"

def infer_times(directions):
    """Rough heuristic based on number of steps."""
    steps = len(directions)
    prep = steps * 3
    cook = steps * 5
    return prep, cook, prep + cook

def parse_ingredients(ner_list, ingredients_raw):
    """Convert NER list to structured ingredient objects."""
    result = []
    for i, name in enumerate(ner_list):
        # Try to extract amount/unit from the raw ingredient string
        raw = ingredients_raw[i] if i < len(ingredients_raw) else ""
        
        # Simple heuristic: look for numbers at the start
        amount = 1.0
        unit = "piece"
        match = re.match(r"([\d./]+)\s*(c\.|cup|tsp|tbsp|lb|oz|g|ml|pkg|can|pkg\.)?", raw)
        if match:
            try:
                amount = eval(match.group(1))  # handles fractions like 1/2
            except:
                amount = 1.0
            unit_raw = (match.group(2) or "piece").strip(".")
            unit_map = {"c": "cup", "tsp": "tsp", "tbsp": "tbsp", 
                       "lb": "lb", "oz": "oz", "g": "g", "ml": "ml"}
            unit = unit_map.get(unit_raw, unit_raw or "piece")

        # Infer category
        name_lower = name.lower()
        if any(w in name_lower for w in ["chicken", "beef", "pork", "fish", "egg", "turkey", "shrimp"]):
            category = "protein"
        elif any(w in name_lower for w in ["milk", "cheese", "butter", "cream", "yogurt"]):
            category = "dairy"
        elif any(w in name_lower for w in ["flour", "sugar", "rice", "pasta", "bread", "oat"]):
            category = "carbs"
        elif any(w in name_lower for w in ["apple", "banana", "strawberry", "cherry", "lemon", "pineapple"]):
            category = "fruits"
        elif any(w in name_lower for w in ["onion", "pepper", "garlic", "broccoli", "tomato", "corn", "celery"]):
            category = "vegetables"
        elif any(w in name_lower for w in ["oil", "sauce", "vinegar", "salt", "pepper", "soy", "ketchup"]):
            category = "condiments"
        elif any(w in name_lower for w in ["peanut butter", "peanut", "almond", "cashew"]):
            category = "pantry_staple"
        elif any(w in name_lower for w in ["bacon", "ham", "sausage", "salami"]):
            category = "protein"
        elif any(w in name_lower for w in ["potato", "corn", "carrot", "spinach", "lettuce", "cabbage"]):
            category = "vegetables"
        elif any(w in name_lower for w in ["powder", "spice", "seasoning", "extract", "soda", "baking"]):
            category = "pantry_staple"
        else:
            category = "pantry_staple"

        result.append({
            "name": name.lower(),
            "amount": amount,
            "unit": unit,
            "category": category
        })
    return result

def infer_dietary_tags(ner_list, instructions):
    combined = " ".join([n.lower() for n in ner_list]) + " " + instructions.lower()
    has_meat = any(w in combined for w in ["chicken", "beef", "pork", "steak", "turkey", "bacon", "ham", "lamb", "fish", "shrimp"])
    tags = set()
    names = [n.lower() for n in ner_list]
    
    has_meat = any(w in " ".join(names) for w in ["chicken", "beef", "pork", "turkey", "bacon", "ham"])
    has_dairy = any(w in " ".join(names) for w in ["milk", "cheese", "butter", "cream"])
    
    if not has_meat and not has_dairy:
        tags.add("vegan")
    if not has_meat:
        tags.add("vegetarian")
    if any(w in " ".join(names) for w in ["chicken", "beef", "egg", "protein"]):
        tags.add("high-protein")
    
    return list(tags)

recipes = []
print("Processing CSV...")

with open(INPUT_CSV, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    
    for i, row in enumerate(reader):
        if len(recipes) >= TARGET_COUNT:
            break
        
        # Skip rows with missing data
        title = row.get("title", "").strip()
        if not title:
            continue

        ingredients_raw = parse_list_field(row.get("ingredients", "[]"))
        directions = parse_list_field(row.get("directions", "[]"))
        ner_list = parse_list_field(row.get("NER", "[]"))
        instructions = " ".join([f"{j+1}. {step}" for j, step in enumerate(directions)])

        if not ingredients_raw or not directions or not ner_list:
            continue

        # Build the recipe
        ingredient_list = ", ".join([n.lower() for n in ner_list])
        structured_ingredients = parse_ingredients(ner_list, ingredients_raw)
        prep, cook, total = infer_times(directions)



        recipe = {
            "id": f"R-{str(i).zfill(5)}",
            "title": title,
            "description": f"A {'delicious' if i % 2 == 0 else 'homestyle'} recipe featuring {ingredient_list[:80]}.",
            "ingredients": structured_ingredients,
            "ingredient_list": ingredient_list,
            "ingredient_list_text": ingredient_list,
            "cuisine": random.choice(CUISINES),  # RecipeNLG doesn't have cuisine labels
            "meal_type": infer_meal_type(title, ingredient_list),
            "prep_time_minutes": prep,
            "cook_time_minutes": cook,
            "total_time_minutes": total,
            "servings": 4,
            "difficulty": infer_difficulty(directions),
            "calories_per_serving": random.randint(200, 600),
            "dietary_tags": infer_dietary_tags(ner_list, instructions),
            "instructions": " ".join([f"{j+1}. {step}" for j, step in enumerate(directions)])
        }

        recipes.append(recipe)
        
        if len(recipes) % 500 == 0:
            print(f"  Processed {len(recipes)} recipes...")

with open(OUTPUT_JSON, "w") as f:
    json.dump(recipes, f, indent=2)

print(f"✅ Done! Written {len(recipes)} recipes to {OUTPUT_JSON}")