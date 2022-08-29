// TODO
// Remove axios dependency
const axios = require('axios')
const { logger } = require('./utils')
const baseUrl = "https://pro-api.coinmarketcap.com/v2"
const headers = { headers: {
	"X-CMC_PRO_API_KEY": `${process.env.COIN_MARKET_CAP_API_KEY}`	
	}
}

const getCurrentPrices = async(tickers = []) => {
	logger(`Getting current prices for ${tickers}...`, { loading: true })

	const symbols = String(tickers)
	const { data } = await axios.get(
		`${baseUrl}/cryptocurrency/quotes/latest?symbol=${symbols}`,
		headers
	)
	const prices =  Object.keys(data.data).map(key => {
		return [
			key, data.data[key][0].quote.USD.price
		]
	})
	
	logger(`Crypto prices: ${prices.flat()} ✅`, { overWrite: true, LF: true })

    return prices
}

module.exports = {
    getCurrentPrices
}

