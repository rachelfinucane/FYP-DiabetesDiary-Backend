const axios = require('axios');
const convert = require('convert-units');
const { weightDict, volumeDict } = require('../helpers/recipes.js');


async function getNutritionalInfo(recipe) {
    console.log(recipe);
    const ingredients = recipe.parsedIngredients;

    let results = await Promise.all(
        ingredients.map(async (ingredient) => {
            const apiKey = process.env.USDA_API_KEY;
            const pageSize = 10;
            const dataType = 'Branded';
            const query = ingredient.ingredientName;

            const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&pageSize=${pageSize}&query=${query}&dataType=${dataType}`;

            let response = await axios.get(url);

            let apiFoodResult = response.data.foods;

            // if ingredientUnit is weight type
            if (ingredient.ingredientUnit.trim().toLowerCase() in weightDict) {

                // // Find the first matching ingredient from the API
                // // That has the info in grams
                // let matchingAPIFood = apiFoodResult.find(food => {

                //     // Want the first food in grams only
                //     if (food.servingSizeUnit.trim().toLowerCase() !== 'g' ||
                //         food === null || food === undefined) {
                //         return false;
                //     }

                //     /* Each food has a list of nutrients
                //     * We want nutrients calculated from value per serving size measure only
                //     * Also double-checking that the nutrient information is stored in grams
                //     */
                //     return food.foodNutrients.some(nutrient => {
                //         return (nutrient.derivationDescription.trim() === 'Calculated from value per serving size measure'
                //             && nutrient.unitName === 'G')
                //     });
                // });
                // if (matchingAPIFood) {
                //     let carbInfo = matchingAPIFood.foodNutrients.find((nutrient) => {
                //         return nutrient.nutrientName === 'Carbohydrate, by difference';
                //     });

                //     // Convert our ingredient weight to grams
                //     let recipeIngredientWeight = convert(ingredient.ingredientAmount)
                //         // pull the standardised unit e.g. g not grams
                //         .from(weightDict[ingredient.ingredientUnit])
                //         .to('g');

                //     let apiFoodServingSize = matchingAPIFood.servingSize;
                //     let carbsPerServing = carbInfo.value;

                //     let recipeIngredientCarbs = (carbsPerServing / apiFoodServingSize) * recipeIngredientWeight;

                //     return { ingredientName: ingredient.ingredientName, apiFoodName: matchingAPIFood.description, recipeIngredientCarbs };

                // } else {
                //     // TODO move to outside if/else block
                //     return "No Info Avalilable"
                // }
                return searchForNutrition(apiFoodResult, ingredient, 'g');
            }
            // Deal with volumes
            else if (ingredient.ingredientUnit.trim().toLowerCase() in volumeDict) {
                // First check servingSizeUnit to see if ml is available
                // If it's only a weight available, then check householdServingFullText
                // This is the manufacturer description of the serving size
                // And is likely to be in cups

                // Find the first matching ingredient from the API
                // That has the info in ml
                let matchingAPIFood = apiFoodResult.find(food => {

                    // Want the first food in grams only
                    if (food.servingSizeUnit.trim().toLowerCase() !== 'ml' ||
                        food === null || food === undefined) {
                        return false;
                    }

                    /* Each food has a list of nutrients
                    * We want nutrients calculated from value per serving size measure only
                    * Also double-checking that the nutrient information is stored in grams
                    * E.g. 80g Carbs in 100ml serving size 
                    */
                    return food.foodNutrients.some(nutrient => {
                        return (nutrient.derivationDescription.trim() === 'Calculated from value per serving size measure'
                            && nutrient.unitName === 'G')
                    });
                });
                if (matchingAPIFood) {
                    let carbInfo = matchingAPIFood.foodNutrients.find((nutrient) => {
                        return nutrient.nutrientName === 'Carbohydrate, by difference';
                    });

                    // Convert our ingredient volume to ml
                    // TODO handle error
                    let recipeIngredientWeight = convert(ingredient.ingredientAmount)
                        // pull the standardised unit e.g. ml not milliliters
                        .from(volumeDict[ingredient.ingredientUnit]) // Assume already stored as Float not fraction
                        .to('ml');

                    let apiFoodServingSize = matchingAPIFood.servingSize;
                    let carbsPerServing = carbInfo.value;

                    let recipeIngredientCarbs = (carbsPerServing / apiFoodServingSize) * recipeIngredientWeight;

                    console.log(ingredient.ingredientName, " volume carbs ", recipeIngredientCarbs);
                    return { ingredientName: ingredient.ingredientName, apiFoodName: matchingAPIFood.description, recipeIngredientCarbs };

                } else {
                    // Search for the cups
                    // TODO move to outside if/else block
                    console.log('we need the cups!');
                    return "No Info Avalilable"
                }

                // let foodsWithMatchingUnits = surveyFoods.filter(food => {
                //     return food.foodMeasures.filter(foodMeasure => {
                //         let unit = weightDict[ingredient.ingredientUnit.trim().toLowerCase()];
                //         let foodMeasureUnit = foodMeasure.disseminationText.toString().trim().toLowerCase();

                //         // Matches pattern 1 oz, 25g, 1/4 kg, 0.25 lbs
                //         // The number pattern came from here:
                //         // https://www.regextester.com/94462
                //         let unitRegex = new RegExp(`[0-9]+[,.]?[0-9]*([\\/][0-9]+[,.]?[0-9]*)?\\s*${unit}`, 'i');

                //         return foodMeasureUnit.match(unitRegex) !== null;
                //     });
                // });

                // look for any that match volume!

            }
            return ({ hello: 'hello' });
        })
    );
    console.log(results);
}

function searchForNutrition(apiFoodResult, ingredient, unit) {


    // Find the first matching ingredient from the API
    // That has the info in grams
    let matchingAPIFood = apiFoodResult.find(food => {

        // Want the first food in grams only
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
                && nutrient.unitName === 'G')
        });
    });
    if (matchingAPIFood) {
        let carbInfo = matchingAPIFood.foodNutrients.find((nutrient) => {
            return nutrient.nutrientName === 'Carbohydrate, by difference';
        });

        // Convert our ingredient weight to grams
        let recipeIngredientWeight = convert(ingredient.ingredientAmount)
            // pull the standardised unit e.g. g not grams
            .from(weightDict[ingredient.ingredientUnit])
            .to('g');

        let apiFoodServingSize = matchingAPIFood.servingSize;
        let carbsPerServing = carbInfo.value;

        let recipeIngredientCarbs = (carbsPerServing / apiFoodServingSize) * recipeIngredientWeight;

        return { ingredientName: ingredient.ingredientName, apiFoodName: matchingAPIFood.description, recipeIngredientCarbs };

    } else {
        // TODO move to outside if/else block
        return "No Info Avalilable"
    }

}

module.exports = { getNutritionalInfo };