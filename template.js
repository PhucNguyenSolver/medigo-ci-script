;(function main() {
    const source = process.argv[2]
    const destination = process.argv[3]

    if (!source || !destination) {
        console.log(`Invalid number of arguments`)
        printHelp()
        return
    }

    try {
        upload(source, destination)
    } catch (e) {
        console.log(e)
        process.exit(1)
    }
})()

function printHelp() {
    console.log(
        `usage:\tupload.js [SOURCE] [DESTINATION]` +
            `\n\tSOURCE: relative path to file on local machine` +
            `\n\tDESTINATION: filename under DeviceFarm's Uploads menu`
    )
}

function upload(source, destination) {
    console.log(`Uploading [${source}] to [${destination}]...`)
    // throw "Exception..."
}
