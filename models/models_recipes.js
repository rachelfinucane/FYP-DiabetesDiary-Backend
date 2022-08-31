/**
 * This file handles all db interaction regarding recipes
 */

const { sql, poolAsync } = require('./db');

/**
 * Returns an array of recipes that match the requested filters.
 * @param {string} userId userId of relevant user
 * @param {string} filters string of filters in the form "filter1, filter2, filter3"
 * @returns Matching array of recipes
 */
async function handleGetRecipesWithFilter(userId, filters) {
    const pool = await poolAsync;
    const queryString = `select ${filters} from recipe where userId =@userId;`
    let result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId, userId)
        .query(queryString);
    return result.recordset;
}

/**
 * Using node-mssql, connects to the database and retrieves
 * all recipes for a given user.
 * Uses FOR JSON AUTO to automatically turn the flat
 * result structure into a nested JSON structure.
 * This was the cooles thing that I discovered while doing this project.
 * @param {string} userId userId of relevant user in GUID format
 * @returns An array of matching recipes.
 */
async function handleGetRecipesByUserId(userId) {
    const pool = await poolAsync;

    const queryString = "SELECT DISTINCT (" +
        "SELECT r.recipeId, carbsPerServing, totalCarbs, recipeType, " +
        "recipeInstructions, recipeYields, recipeName, ingredientName, " +
        "ingredientAmount, ingredientUnit, apiFoodName, carbs, recipeImageUrl " +
        "FROM Users as u " +
        "JOIN Recipe as r ON (u.userId = r.userId) " +
        "JOIN IngredientList as il ON (r.recipeId = il.recipeId) " +
        "JOIN Ingredient as ingredients ON (il.ingredientId = ingredients.ingredientId) " +
        "WHERE u.userId = @userId " +
        // THIS IS VERY COOL AND HANDY
        "FOR JSON AUTO " +
        ") AS recipe"; // Ref: https://docs.microsoft.com/en-us/sql/relational-databases/json/format-json-output-automatically-with-auto-mode-sql-server?view=sql-server-ver16


    const result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId, userId)
        .query(queryString);

    return result.recordset[0];
}

/**
 * Inserts a new recipe. First, inserts a recipe,
 * then inserts all its ingredients. Finally inserts the weak 
 * entity that joins the two. In an ideal world, the ingredients 
 * would be unique. But due to time constraints, do not check.
 * 
 * @param {object} newRecipe Recipe to insert
 * @param {string} userId userId that owns the recipe
 * @param {string} recipeImageUrl url of image associated with recipe
 */
async function handleInsertRecipe(newRecipe, userId, recipeImageUrl) {
    const pool = await poolAsync;

    // First insert the recipe
    const recipeId = await insertRecipe(newRecipe, userId, pool, recipeImageUrl);
    // Then insert the ingredients
    const ingredientIds = await insertIngredients(newRecipe);
    // Then insert ingredientsList, the weak entity that joins the two
    await insertIngredientList(recipeId, ingredientIds);
}

/**
 * Inserts a recipe
 * @param {object} recipe Recipe to insert
 * @param {string} userId userId
 * @param {pool} pool The pool used for the query
 * @param {string} recipeImageUrl url associated with the recipe
 * @returns insertedRecipeId
 */
async function insertRecipe(recipe, userId, pool, recipeImageUrl) {

    const queryString = "INSERT INTO Recipe (userId, carbsPerServing, totalCarbs, recipeType, " +
        "recipeInstructions, recipeYields, recipeName, recipeImageUrl) OUTPUT inserted.recipeId " +
        "VALUES (@userId, @carbsPerServing, @totalCarbs, @recipeType, @recipeInstructions, " +
        "@recipeYields, @recipeName, @recipeImageUrl)"

    try {
        const result = await pool.request()
            .input("userId", sql.UniqueIdentifier, userId)
            .input("carbsPerServing", sql.Decimal(7, 2), recipe.carbsPerServing)
            .input("totalCarbs", sql.Decimal(7, 2), recipe.carbsPerServing)
            .input("recipeType", sql.VarChar(100), recipe.type)
            .input("recipeInstructions", sql.VarChar(8000), recipe.instructions)
            .input("recipeYields", sql.TinyInt, recipe.yields)
            .input("recipeName", sql.VarChar(500), recipe.recipeName)
            .input("recipeImageUrl", sql.VarChar(1000), recipeImageUrl)
            .query(queryString);

        return result.recordsets[0][0];
    } catch (err) {
        throw new Error("Error inserting into recipe: ", queryString, err.message);
    }
}

/**
 * Inserts multiple ingredients in a recipe and returns an array 
 * of recipeIds.
 * 
 * I had some serious, serious trouble getting this to work.
 * Multiple ingredients need to be inserted per recipe.
 * node-mssql simply could not handle multiple inserts running at the same time.
 * It supports bulk insert, which worked, but did not return 
 * the inserted ingredientIds. Using a promise all approach running
 * multiple inserts threw errors, since only one request could be processed at once,
 * especially using a transaction.
 * Eventually, I just removed the transaction and manually constructed the 
 * insert statement string with multiple rows. 
 * It's risky, but at least it works.
 * 
 * I do not recommend using node-mssql for this reason. It was a displeasure to work with :P.
 * 
 * @param {object} recipe recipe to insert
 * @returns an array of inserted ingredientIds
 */
async function insertIngredients(recipe) {
    const pool = await poolAsync;

    // Get rows to insert in the format
    // "(value1, value2, etc), (value1, value2, etc), (value1, value2, etc)"
    let values = constructIngredientInsertValues(recipe);

    queryString = `INSERT INTO Ingredient (ingredientName, ingredientAmount, ingredientUnit, apiFoodName, carbs) OUTPUT inserted.ingredientId VALUES ${values}`;
    try {
        let result = await pool.request()
            .query(queryString);

        return result.recordsets[0];
    } catch (err) {
        throw new Error("Error inserting into Ingredients: ", queryString, err.message);
    }
}

/**
 * Takes recipe information and joins all the associated ingredients into
 * a string in the format (value1, value2, etc), (value1, value2, etc)"
 * to be used in an insert statement later. This was the only way
 * I found to insert multiple rows at once.
 * @param {object} recipe recipe information to insert (contains ingredients)
 * @returns a string with the values to insert in the format 
 * "(value1, value2, etc), (value1, value2, etc)"
 */
function constructIngredientInsertValues(recipe) {
    let values = recipe.ingredients.map(ingredient => {
        let ingredientName = (ingredient.ingredientName == null) ? null : `'${ingredient.ingredientName}'`;
        let ingredientAmount = (ingredient.ingredientAmount == null) ? null : `${ingredient.ingredientAmount}`;
        let ingredientUnit = ingredient.ingredientUnit == null ? null : `'${ingredient.ingredientUnit}'`;
        let apiFoodName = ingredient.apiFoodName == null ? null : `'${ingredient.apiFoodName}'`;
        let recipeIngredientCarbs = ingredient.recipeIngredientCarbs == null ? null : `${ingredient.recipeIngredientCarbs}`;

        return (`(${ingredientName}, ${ingredientAmount}, ${ingredientUnit}, ${apiFoodName}, ${recipeIngredientCarbs})`);
    });

    values = values.join(',');
    return values;
}

/**
 * Once the recipe and ingredients are inserted, the ingredients need to be associated
 * with the recipe. This inserts the weak entity that associates the two.
 * @param {object} recipeId the recipe id to which the ingredients belong
 * @param {Array} ingredientIds an array of ingredient ids
 * @returns The weak entity that was inserted.
 */
async function insertIngredientList(recipeId, ingredientIds) {
    const pool = await poolAsync;

    let values = constructIngredientListInserts(ingredientIds, recipeId);

    queryString = `INSERT INTO IngredientList (recipeId, ingredientId) VALUES ${values}`;
    try {

        let result = await pool.request()
            .query(queryString);

        return result.recordsets[0];
    } catch (err) {
        throw new Error("Error inserting into ingredients list: ", queryString, err.message);
    }
}


/**
 * Takes ingredient ids and a recipe id and joins the values into
 * a string in the format "(ingredientId, recipeId), (ingredientId, recipeId)"
 * to be used in an insert statement later. This was the only way
 * I found to insert multiple rows at once.
 * @param {Array} ingredientIds array of ingredientIds
 * @param {string} recipeId the recipeId
 * @returns a string with the values to insert in the format 
 * "(ingredientId, recipeId), (ingredientId, recipeId)"
 */
function constructIngredientListInserts(ingredientIds, recipeId) {
    let values = ingredientIds.map((ingredientId) => {
        let id = ingredientId.ingredientId ?? null;

        return (`('${recipeId.recipeId}', '${id}')`);
    });
    values = values.join(',');
    return values;
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
        ingredientTable.rows.add(ingredient.ingredientName, ingredient.ingredientAmount, ingredient.ingredientUnit, ingredient.apiFoodName, ingredient.recipeIngredientCarbs);
    });

    result = await request.bulk(ingredientTable);
}

module.exports = { handleInsertRecipe, handleGetRecipesByUserId, handleGetRecipesWithFilter }