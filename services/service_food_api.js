const axios = require('axios');
const convert = require('convert-units');
const { weightDict, volumeDict, convertFractionToFloat } = require('../helpers/recipes.js');


async function getNutritionalInfo(recipe) {
    const ingredients = recipe.parsedIngredients;

    return await Promise.all(
        ingredients.map(async (ingredient) => {
            const apiKey = process.env.USDA_API_KEY;
            const pageSize = 20;
            const dataType = 'Branded';
            const query = ingredient.ingredientName;

            const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&pageSize=${pageSize}&query=${query}&dataType=${dataType}`;

            let response = await axios.get(url);

            let apiFoodResult = response.data.foods;

            // if ingredientUnit is weight type
            if (ingredient.ingredientUnit.trim().toLowerCase() in weightDict) {

                let matchingAPIFood = getAPIFoodByServingSize(apiFoodResult, 'g');
                if (matchingAPIFood) {
                    return extractNutritionFromAPIFood(matchingAPIFood, ingredient, 'g', weightDict);
                }
            }
            // Deal with volumes
            else if (ingredient.ingredientUnit.trim().toLowerCase() in volumeDict) {

                // First check servingSizeUnit to see if ml is available
                let matchingAPIFood = getAPIFoodByServingSize(apiFoodResult, 'ml');
                if (matchingAPIFood) {
                    return extractNutritionFromAPIFood(matchingAPIFood, ingredient,
                        'ml', volumeDict);
                } else {
                    // If there aren't any foods measured in ml, check householdServingFullText
                    // This is the manufacturer description of serving size
                    // And is more likely to use cups, which is a volume and can be converted
                    // Could expand this to look for quarts etc, but cups seem most common
                    matchingAPIFood = getAPIFoodByServingDescription(apiFoodResult,
                        'cup', volumeDict);
                    if (matchingAPIFood) {
                        return extractNutritionFromAPIFood(matchingAPIFood, ingredient,
                            'cup', volumeDict);
                    }
                }
            }
            // If no matching food is found
            return {
                ingredientName: ingredient.ingredientName,
                ingredientAmount: ingredient.ingredientAmount,
                ingredientUnit: ingredient.ingredientUnit,
                apiFoodName: null,
                recipeIngredientCarbs: null
            };
        })
    );
}

function getAPIFoodByServingSize(apiFoodResult, unit) {
    // Find the first matching ingredient from the API
    // That has the info in the unit specified (e.g. g, ml)
    return matchingAPIFood = apiFoodResult.find(food => {
        // Want the first food in specified unit (g, ml) only
        if (food.servingSizeUnit.trim().toLowerCase() !== unit ||
            food === null || food === undefined) {
            return false;
        }

        /* Each food has a list of nutrients
        * We want nutrients calculated from value per serving size measure only
        * Also double-checking that the nutrient information is stored in grams
        */
        return food.foodNutrients.some(nutrient => {
            return (nutrient.derivationDescription.trim() === 'Calculated from value per serving size measure'
                && nutrient.unitName === 'G'
                && nutrient.nutrientName === 'Carbohydrate, by difference');
        });
    });
}

function extractNutritionFromAPIFood(food, ingredient, unit, unitDict) {
    let carbInfo = food.foodNutrients.find((nutrient) => {
        return nutrient.nutrientName === 'Carbohydrate, by difference';
    });

    // Convert our ingredient measure to specified unit (e.g. to ml or to g)
    let recipeIngredientAmount = convert(ingredient.ingredientAmount)
        // pull the standardised unit e.g. g not grams
        .from(unitDict[ingredient.ingredientUnit])
        .to(unit);

    let apiFoodServingSize = food.servingSize;
    let carbsPerServing = carbInfo.value;

    let recipeIngredientCarbs = ((carbsPerServing / apiFoodServingSize) * recipeIngredientAmount).toFixed(2);

    return {
        ingredientName: ingredient.ingredientName,
        ingredientAmount: ingredient.ingredientAmount,
        ingredientUnit: ingredient.ingredientUnit,
        apiFoodName: food.description,
        recipeIngredientCarbs
    };
}

function getAPIFoodByServingDescription(apiFoodResult, unit, unitDict) {
    let unitVariants = Object.keys(unitDict).filter(key => unitDict[key] === unit).join('|');
    // Matches pattern 1 oz, 25g, 1/4 kg, 0.25 lbs
    // The number pattern came from here:
    // https://www.regextester.com/94462
    let unitRegex = new RegExp(`[0-9]+[,.]?[0-9]*([\\/][0-9]+[,.]?[0-9]*)?\\s(${unitVariants})s*?`, 'i');

    let food = apiFoodResult.find(food => {

        let manufactureServingDescription = food.householdServingFullText?.trim();
        if (manufactureServingDescription) {
            if (manufactureServingDescription.match(unitRegex)) {
                /* Each food has a list of nutrients
                * We want nutrients calculated from value per serving size measure only
                * Also double-checking that the nutrient information is stored in grams
                */
                return food.foodNutrients.some(nutrient => {
                    return (nutrient.derivationDescription.trim() ===
                        'Calculated from value per serving size measure'
                        && nutrient.unitName === 'G'
                        && nutrient.nutrientName === 'Carbohydrate, by difference');
                });
            }
            return false;
        }
        return false;
    });

    if (food) {
        let matchedServingDescription = food.householdServingFullText.match(unitRegex);
        let [amount, descriptionUnit] = matchedServingDescription.input.split(' ');
        amount = convertFractionToFloat(amount).toFixed(2);
        food.servingSize = amount;
        food.servingSizeUnit = descriptionUnit;
        return food;
    }
}

module.exports = { getNutritionalInfo };