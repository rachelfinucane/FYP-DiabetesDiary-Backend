const { sql, poolAsync } = require('./db');

async function handleInsertRecipe(newRecipe, userId) {
    // How to use transactions:
    // From mssql docs https://tediousjs.github.io/node-mssql/#transaction
    // Use with await/async: https://stackoverflow.com/a/68832025
    const pool = await poolAsync;

    const recipeId = await insertRecipe(newRecipe, userId, pool);
    const ingredientIds = await insertIngredients(newRecipe);

    await insertIngredientList(recipeId, ingredientIds);
}

async function insertRecipe(recipe, userId, pool) {

    const queryString = "INSERT INTO Recipe (userId, carbsPerServing, totalCarbs, recipeType, " +
        "recipeInstructions, recipeYields, recipeName) OUTPUT inserted.recipeId " +
        "VALUES (@userId, @carbsPerServing, @totalCarbs, @recipeType, @recipeInstructions, " +
        "@recipeYields, @recipeName)"

    try {
        const result = await pool.request()
            .input("userId", sql.UniqueIdentifier, userId)
            .input("carbsPerServing", sql.Decimal(7, 2), recipe.carbsPerServing)
            .input("totalCarbs", sql.Decimal(7, 2), recipe.carbsPerServing)
            .input("recipeType", sql.VarChar(100), recipe.type)
            .input("recipeInstructions", sql.VarChar(8000), recipe.instructions)
            .input("recipeYields", sql.TinyInt, recipe.yields)
            .input("recipeName", sql.VarChar(500), recipe.recipeName)
            .query(queryString);

        console.log(result.recordsets[0][0]);

        return result.recordsets[0][0];
    } catch (err) {
        console.log(queryString);
        throw new Error("Error inserting into recipe: ", queryString, err.message);
    }
}

async function insertIngredients(recipe) {
    const pool = await poolAsync;

    let values = recipe.ingredients.map(ingredient => {
        let ingredientName = (ingredient.ingredientName == null) ? null : `'${ingredient.ingredientName}'`;
        let ingredientAmount = (ingredient.ingredientAmount == null) ? null : `${ingredient.ingredientAmount}`;
        let ingredientUnit = ingredient.ingredientUnit == null ? null : `'${ingredient.ingredientUnit}'`;
        let apiFoodName = ingredient.apiFoodName == null ? null : `'${ingredient.apiFoodName}'`;
        let recipeIngredientCarbs = ingredient.recipeIngredientCarbs == null ? null : `${ingredient.recipeIngredientCarbs}`;

        return (`(${ingredientName}, ${ingredientAmount}, ${ingredientUnit}, ${apiFoodName}, ${recipeIngredientCarbs})`);
    });

    values = values.join(',');

    queryString = `INSERT INTO Ingredient (ingredientName, ingredientAmount, ingredientUnit, apiFoodName, carbs) OUTPUT inserted.ingredientId VALUES ${values}`;
    try {
        let result = await pool.request()
            .query(queryString);

        return result.recordsets[0];
    } catch (err) {
        console.log(queryString);
        throw new Error("Error inserting into Ingredients: ", queryString, err.message);
    }
}

async function insertIngredientList(recipeId, ingredientIds) {
    const pool = await poolAsync;

    let values = ingredientIds.map((ingredientId) => {
        let id = ingredientId.ingredientId ?? null;

        return (`('${recipeId.recipeId}', '${id}')`);
    });
    values = values.join(',');

    queryString = `INSERT INTO IngredientList (recipeId, ingredientId) VALUES ${values}`;
    try {

        let result = await pool.request()
            .query(queryString);

        return result.recordsets[0];
    } catch (err) {
        console.log(queryString);
        throw new Error("Error inserting into ingredients list: ", queryString, err.message);
    }
}

// This would be the best way to insert multiple records at once
// in terms of performance
// but the inserted id's aren't returned
// so they can't be used in further transactions
async function insertBulkIngredients(request, recipe) {
    const pool = await poolAsync;
    console.log("inserting ingredients");

    let ingredientTable = new sql.Table("Ingredient");
    ingredientTable.create = false;
    ingredientTable.columns.add('ingredientName', sql.VarChar(100), { nullable: true });
    ingredientTable.columns.add('ingredientAmount', sql.Decimal(7, 2), { nullable: true });
    ingredientTable.columns.add('ingredientUnit', sql.VarChar(50), { nullable: true });
    ingredientTable.columns.add('apiFoodName', sql.VarChar(100), { nullable: true });
    ingredientTable.columns.add('carbs', sql.Decimal(7, 2), { nullable: true });

    recipe.ingredients.forEach(ingredient => {
        console.log(ingredient);
        ingredientTable.rows.add(ingredient.ingredientName, ingredient.ingredientAmount, ingredient.ingredientUnit, ingredient.apiFoodName, ingredient.recipeIngredientCarbs);
    });

    result = await request.bulk(ingredientTable);
    console.log(result);
}

module.exports = { handleInsertRecipe }