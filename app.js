require('dotenv').config()
const notion = require('./notion')
const crypto = require('./crypto')
const stocks = require('./stocks')
const { logger } = require('./utils')
const router = Object.freeze({
	crypto: crypto.getCurrentPrices,
	stocks: stocks.getCurrentPrices
})
const ENVIRONMENT = process.env.NODE_ENV
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID


/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */


exports.lambdaHandler = async (event, context) => {
	let result

	try {
        // Get supported Notion databases on parent page
		const databases = await notion.getDatabases(NOTION_PARENT_PAGE_ID)

		// Update ticker symbol prices and update Notion
		for(const database of databases) {
			// for(i=0;i < databases.length; i++) {
				const tickers = database.pages.map(page => page.properties.Ticker.value).filter(x => x)
			const prices = await router[database.title.toLowerCase()](tickers)

			database.pages.forEach(page => {
				prices.forEach(price => {
					if(page.properties.Ticker.value == price[0]) return page.properties['Current Price'].usd = price[1]
				})
			})
		}

		// Write to Notion databases
		const props = ["Current Price"]
		result = await notion.updateDatabases(databases, props)

    } catch (err) {
        console.log(err);
        return err;
    }

	logger(`All Notion databases have been updated! ✅ \n` )
	
    return {
        statusCode: 200,
        body: JSON.stringify(result)
    }

}

// Development code
ENVIRONMENT == 'dev'
? this.lambdaHandler()
: console.log(`Environment must be set to dev to run locally`)









