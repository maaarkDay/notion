// Console 📺
let _loadingInProgress

const _loading = (message) => {
    let dots = ""

    _loadingInProgress =  setInterval(() => {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0);
        process.stdout.write(`${message}${dots}`)
        dots = dots + "."
    }, 500)
}

const _overWrite = (message, lineFeed = false) => {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0);
    if(!lineFeed) process.stdout.write(message)
    else process.stdout.write(`${message}\n`)
}

const logger = (message = "string", options = { overWrite: false, LF: false, loading: false }) => {
    const { overWrite, LF, loading } = options
    
    if(!(process.env.ENVIRONMENT == 'dev')) return console.log(message)
    if(_loadingInProgress) clearInterval(_loadingInProgress)
    if(loading) return _loading(message)
    if(overWrite) return _overWrite(message, LF)
    if(LF) return process.stdout.write(`\n${message}`)

    return console.log(message)
}

// Time ⏰
const delay = (time) => {
    return new Promise(resolve => setTimeout(resolve, time))
}

module.exports = {
    logger,
    delay
}