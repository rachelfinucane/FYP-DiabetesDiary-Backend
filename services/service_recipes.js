const axios = require('axios');
// import { parse } from 'node-html-parser';
const { parse } = require('node-html-parser')

async function scrapeNutritionInfo(service, url) {

    // let response = await axios.get(url);

    // const root = parse(response.data.toString());

    // const infoNode = root.getElementById('__NEXT_DATA__');
    // const infoContent = (JSON.parse(infoNode.innerHTML)).props.pageProps;
    // return {
    //     title: infoContent.title,
    //     description: infoContent.description,
    //     ingredients: infoContent.ingredients,
    //     nutritionalInfo: infoContent.nutritionalInfo,
    //     servings: infoContent.servings
    // }
    if(service === 'BBC'){
        return scrapeBBC(url);
    }
    throw new Error("Could not process request: a valid service (e.g. BBC) not provided");
}

async function scrapeBBC(url) {

    let response = await axios.get(url);

    const root = parse(response.data.toString());
    const infoNode = root.getElementById('__NEXT_DATA__');
    const infoContent = (JSON.parse(infoNode.innerHTML)).props.pageProps;
    return {
        title: infoContent.title,
        description: infoContent.description,
        ingredients: infoContent.ingredients,
        nutritionalInfo: infoContent.nutritionalInfo,
        servings: infoContent.servings
    }
}

module.exports = { scrapeNutritionInfo };