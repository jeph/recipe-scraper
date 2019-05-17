const puppeteer = require('puppeteer')
const fs = require('fs')

let recipeLinks = []

scrape = async (url) => {
  const browser = await puppeteer.launch({headless: false});
  try {
    const page = await browser.newPage();
    await page.goto(url);
    const tempLinks = await page.evaluate(() => {
      const recipes = document.getElementsByClassName('fixed-recipe-card__title-link')
      const recipeLinks = []
      for (let i = 0; i < recipes.length; i++) {
        recipeLinks.push(recipes[i].href)
      }
      return recipeLinks.filter(link => link)
    })
    recipeLinks = [...recipeLinks, ...tempLinks]
  }
  catch (e) {
    console.log(e)
    console.log('An error happened! Aborting...')
  }
  browser.close()
}

async function getLinks() {
  for (let i = 1; i < 2; i++) {
    const url = 'https://www.allrecipes.com/?page=' + i
    await scrape(url)
  }
}

const recipes = []

async function scrapeRecipe() {
  await getLinks()
  for (const link of recipeLinks) {
    const browser = await puppeteer.launch({headless: false});
    try {
      const page = await browser.newPage();
      await page.goto(link);
      const ingredients = await page.evaluate(() => {
        const ingredientsElements = document.getElementsByClassName('recipe-ingred_txt')
        const ingredients = []
        for (let i = 0; i < ingredientsElements.length - 1; i++) {
          ingredients.push(ingredientsElements[i].innerText)
        }
        return ingredients
      })
      const steps = await page.evaluate(() => {
        const stepsElements = document.getElementsByClassName('recipe-directions__list--item')
        const steps = []
        for (let i = 0; i < stepsElements.length - 1; i++) {
          steps.push(stepsElements[i].innerText)
        }
        return steps
      })
      const title = await page.title()
      const newRecipe = {
        title: title.replace(/ Recipe - Allrecipes.com/g, ''),
        link,
        ingredients,
        steps,
        class: ['vegan']
      }
      recipes.push(newRecipe)
      console.log('Added new recipe', newRecipe)
    }
    catch (e) {
      console.log('Error happened! Skipping...')
    }
    browser.close()
  }
}

async function writeData() {
  await scrapeRecipe()
  fs.writeFile('vegan-recipes-test.json', JSON.stringify({ recipes }), () => {
    process.exit(0)
  })
}

writeData()
