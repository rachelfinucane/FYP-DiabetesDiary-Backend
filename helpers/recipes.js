const parseFract = require('parse-fraction');
const { isNullOrWhitespace } = require('../helpers/helpers.js');

const weightDict = {
    'pounds': 'lb',
    'pound': 'lb',
    'lbs': 'lb',
    'lb.': 'lb',
    'lbs.': 'lb',
    'lb': 'lb',

    'ounces': 'oz',
    'ounce': 'oz',
    'oz.': 'oz',
    'oz': 'oz',

    'grams': 'g',
    'gram': 'g',
    'grammes': 'g',
    'g': 'g',

    'kilograms': 'kg',
    'kilogram': 'kg',
    'kilos': 'kg',
    'kilo': 'kg',
    'kg': 'kg'
};

const volumeDict = {
    'ml': 'ml',
    'mils': 'ml',
    'mil': 'ml',
    'millilitres': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'millilitre': 'ml',

    'l': 'l',
    'liter': 'l',
    'liters': 'l',
    'litre': 'l',
    'litres': 'l',

    'tsp': 'tsp',
    'tsps': 'tsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',

    'tbs': 'Tbs',
    'tablespoon': 'Tbs',
    'tablespoons': 'Tbs',

    'fl-oz': 'fl-oz',
    'floz': 'fl-oz',
    'floz.': 'fl-oz',
    'fl oz.': 'fl-oz',
    'fl oz': 'fl-oz',
    'fluid ounce': 'fl-oz',
    'fluid ounces': 'fl-oz',
    'fluid oz': 'fl-oz',
    'fluid oz.': 'fl-oz',

    'cup': 'cup',
    'cups': 'cup',

    'pnt': 'pnt',
    'pnts': 'pnt',
    'pint': 'pnt',
    'pints': 'pnt',

    'qt': 'qt',
    'qts': 'qt',
    'quart': 'qt',
    'quarts': 'qt',

    'gal': 'gal',
    'gals': 'gal',
    'gallon': 'gal',
    'gallons': 'gal'
};

// // Ref: https://stackoverflow.com/a/22921273
function removeTabsAndReturns(string) {
    if (string) {
        return string.replace(/[\n\r\t]+/g, '');
    }
}

function convertFractionToFloat(numberString) {
    if (isNullOrWhitespace(numberString)) {
        return numberString;
    }
    try {
        let fraction = parseFract(numberString);
        return fraction[0] / fraction[1];
    } catch (err) {
        console.error("There was a problem converting the fraction to a float ", numberString, " ", err.message);
        throw new Error("There was a problem converting the fraction to a float ", numberString, " ", err.message);
    }
}

module.exports = { weightDict, volumeDict, removeTabsAndReturns, convertFractionToFloat };