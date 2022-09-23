const axios = require('axios')
const { logger, delay } = require('./utils')
const API_KEY = process.env.STOCKS_API_KEY
const BASE_URL = process.env.STOCKS_BASE_URL

// The free tier of stocks API only allows for 8 credits/minute,
// each ticker = 1 api credit, so we can only pass in 8 at a time,
// each minute. For $29/mo we get 55 api credits as of 8/25/2022
const getCurrentPrices = async(tickers = []) => {
	const LIMIT = 8
	const numberOfTickers = tickers.length
	const numberOfCalls = Math.floor(numberOfTickers/LIMIT) + (numberOfTickers%LIMIT ? 1 : 0)
	const prices = []

	for(let i = 0; i < numberOfCalls; i++) {
		logger(`Getting current prices for ${tickers.slice(LIMIT*i, LIMIT*(i+1))}...`, { loading: true })

		if(i != 0) await delay(61000)

		const symbols = String(tickers.slice(LIMIT*i, LIMIT*(i+1)))
		const { data } = await axios.get(
			`${BASE_URL}/price?symbol=${symbols}&apikey=${API_KEY}`,
			// headers
		)

		Object.keys(data).forEach(key => {
			if(key == "price") prices.push([symbols, Number(data.price)])
			else prices.push([key, Number(data[key].price)])
		})

		logger(`Stock prices ${i+1} of ${numberOfCalls}: ${prices.slice(LIMIT*i, LIMIT*(i+1)).flat()} ✅`, { overWrite: true, LF: true })

	}
	
    return prices
}

module.exports = {
    getCurrentPrices
}

