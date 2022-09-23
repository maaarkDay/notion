const axios = require('axios')
const { logger } = require('./utils')
const API_KEY = process.env.CRYPTO_API_KEY
const BASE_URL = process.env.CRYPTO_BASE_URL
const headers = { headers: {
	"X-CMC_PRO_API_KEY": `${API_KEY}`	
	}
}
const getCurrentPrices = async(tickers = []) => {
	logger(`Getting current prices for ${tickers}...`, { loading: true })

	const symbols = String(tickers)
	const { data } = await axios.get(
		`${BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbols}`,
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

