// TODO:
// Remove axios dependency
const axios = require('axios')
const { logger, delay } = require('./utils')
const BASE_URL = "https://api.notion.com/v1"
const API_KEY = process.env.NOTION_API_KEY
const headers = { headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Notion-Version': "2022-06-28"
}}
const enabledDatabases = ['crypto', 'stocks']
const supportedPageProps = ['Ticker', 'Current Price']

// TODO:
// Lower the amount of API requests, currently there is a request for each page in a database,
// for example if I want to get the current crypto tickers like ETH, BTC, etc.. I have to send 
// a call for each so it's a 1:1 ratio, same for updating current_price. Have to send them one
// at a time. Feedback from Notion is they are working on this as of email dated  8/23/2022...

// Uncomment this to log each call to console 👇
// axios.interceptors.request.use( req => {
//     console.log(`Axios ${req.method.toUpperCase()} request -> ${req.url}`)
//     return req
// })

getDatabases = async(pageId = "") => {
    logger(`Retrieving supported databases...`, { LF: true } )

    const data = await _getBlockChildren(pageId)
    
    let databases = data.map(result => {
        if(result.type == "child_database") return {
            id: result.id,
            title: result[result.type].title
        }
    }).filter(x => x != undefined && enabledDatabases.indexOf(x.title.toLowerCase()) > -1 )

    logger(`Found databases: ${databases.map(x => x.title)} ✅`, { overWrite: true, LF: true })
 
    databases = await Promise.all(databases.map(async (db) => {
        return {
            title: db.title,
            pages: await _getDatabaseEntries(db.id)
        }
    }))

    databases = databases.filter(db => { 
        logger(`Checking ${db.title} database for supported properties: ${supportedPageProps}...`, { loading: true})
        
        const x = []
        supportedPageProps.forEach(supportedPageProp => {
            const hasProp = Object.keys(db.pages[0].properties).includes(supportedPageProp)
            x.push(hasProp)

            if(!hasProp) console.error(`${db.title} database missing ${supportedPageProp}`)
        })
        if(x.includes(false)) {
            logger(`${db.title} database missing supported properties ❌`, { overWrite: true, LF: true })
            return false
        }
        else {
            logger(`${db.title} database has all supported properties ✅`, { overWrite: true, LF: true })
            return true
        }
    })

    if(!databases.length) throw new Error("No supported databases found")
    else return await _getTickerSymbols(databases)
}

updateDatabases = async(databases = [], props = []) => {
    const result = []
    const properties = {}

    props.forEach(prop => properties[prop] = null)

    for(i = 0; i < databases.length; i++) {
        logger(`Updating Notion database: ${databases[i].title}...`, { loading: true })

        for(j = 0; j < databases[i].pages.length; j++) {
            if(Object.keys(properties).includes('Current Price')) properties['Current Price'] = databases[i].pages[j].properties['Current Price'].usd
            result.push( await _updatePagePropertyItems( databases[i].pages[j].id, properties))
        }

        logger(`${databases[i].title} database update complete ✅`, { overWrite: true, LF: true })
    }
    
    return result
}

/* 
 * 👆 Public
 * 👇 Private
 */

_getTickerSymbols = async(databases = []) => {
    for(let i = 0; i < databases.length; i++) {
        const symbols = []

        logger(`Getting ticker symbols for ${databases[i].title} database...`, { loading: true })

        for(let j = 0; j < databases[i].pages.length; j++) {
            const [ prop ] = await _getPagePropertyItem(databases[i].pages[j].id, databases[i].pages[j].properties.Ticker.id)

            if(prop) {
                const propName = prop.rich_text.text.content
                
                symbols.push(propName)
                databases[i].pages[j].properties.Ticker.value = propName
            }
        }   

        logger(`${databases[i].title} ticker symbols: ${symbols} ✅`, { overWrite: true, LF: true })
    }

    return databases
}

_getBlockChildren = async(blockId = "") => {
    const { data } = await axios.get(
        `${BASE_URL}/blocks/${blockId}/children`,
        headers
    )

    return data.results
}

_getDatabaseEntries = async(databaseId = "") => {
    const { data } = await axios.post(
        `${BASE_URL}/databases/${databaseId}/query`,
        null,
        headers
    )

    return data.results  
}

_getPagePropertyItem = async(pageId, propId) => {
    const { data } = await axios.get(
        `${BASE_URL}/pages/${pageId}/properties/${decodeURI(propId)}`,
        headers
    )

    return data.results
}

_updatePagePropertyItems = async(pageId, props = {}) => {	
	const { data } = await axios.patch(
		`${BASE_URL}/pages/${pageId}`, {
            properties: props
        },
		headers
	)

	return data
}

module.exports = {
    getDatabases,
    updateDatabases
}

   

    



