const AWS = require("aws-sdk")
const request = require("request")
const fs = require("fs")
const REGION = "us-west-2"
const PROJECT_NAME = "Automation Test"

const ACCESS_KEY = process.env.ACCESS_KEY
const SECRET_KEY = process.env.SECRET_KEY
if (ACCESS_KEY && SECRET_KEY) {
    AWS.config = new AWS.Config()
    AWS.config.credentials = new AWS.Credentials(process.env.ACCESS_KEY, process.env.SECRET_KEY)
}

let devicefarm = new AWS.DeviceFarm({ region: REGION })

/* TODO */
const source = process.argv[2]
const destination = process.argv[3]

if (!source || !destination) {
    console.log(`Invalid number of arguments`)
    printHelp()
    process.exit(1)
}

upload("ANDROID_APP", source, destination).catch((e) => {
    console.log(e)
    process.exit(1)
})

function printHelp() {
    console.log(
        `usage:\tupload.js [SOURCE] [DESTINATION]` +
            `\n\tSOURCE: relative path to file on local machine` +
            `\n\tDESTINATION: filename under DeviceFarm's Uploads menu`
    )
}
/* END TODO */

async function upload(upload_type, upload_path, upload_name) {
    console.log(`Uploading [${upload_path}] to [${upload_name}]...`)
    const project_arn = await get_project_arn_by_name(PROJECT_NAME)
    let upload_arn = await get_project_upload_arn_by_name(project_arn, upload_name)
    if (upload_arn) {
        await delete_upload(upload_arn)
    }
    console.log("Creating upload...")
    let url = await create_upload(project_arn, upload_type, upload_name)
    console.log("Uploading to presigned url...")
    upload_arn = await upload_presigned_url(url, upload_path)
    console.log(`Polling...`)
    await _poll_until_upload_done(upload_arn)
}

function get_project_arn_by_name(name) {
    return new Promise((resolve, reject) => {
        devicefarm.listProjects(function (err, data) {
            if (err) reject(err)
            else {
                let projects = data.projects.filter((project) => project.name == name)
                if (projects.length == 0) reject(`${name} not found`)
                resolve(projects[0].arn)
            }
        })
    })
}

function get_project_upload_arn_by_name(project_arn, name) {
    return new Promise((resolve, reject) => {
        let param = { arn: project_arn }
        devicefarm.listUploads(param, function (err, data) {
            if (err) reject(err)
            else {
                let uploads = data.uploads.filter((upload) => upload.name === name)
                resolve(uploads[0]?.arn)
            }
        })
    })
}

function delete_upload(upload_arn) {
    return new Promise((resolve, reject) => {
        let param = { arn: upload_arn }
        devicefarm.deleteUpload(param, function (err, data) {
            if (err) reject(err)
            else resolve(data)
        })
    })
}

function create_upload(project_arn, upload_type, name) {
    return new Promise((resolve, reject) => {
        devicefarm.createUpload(
            {
                projectArn: project_arn,
                name: name,
                type: upload_type,
                contentType: "application/octet-stream",
            },
            function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            }
        )
    })
}

function upload_presigned_url(url, file_path) {
    let file = fs.readFileSync(file_path)
    return new Promise((resolve, reject) => {
        request.put(
            url.upload.url,
            {
                body: file,
                headers: {
                    "Content-Type": "application/octet-stream",
                },
            },
            function (err, res, body) {
                if (err) {
                    reject(err)
                } else {
                    resolve(url.upload.arn)
                }
            }
        )
    })
}

async function _poll_until_upload_done(uploadArn, timeOutSeconds = 60 * 5) {
    const retryDelayInSeconds = 15
    let counter = 0
    while (counter < timeOutSeconds) {
        const { status } = await get_upload(uploadArn)
        console.log("Current status: " + status)
        if (status === "SUCCEEDED") {
            return
        } else if (status === "FAILED") {
            throw "Upload failed"
        }
        await Utils.sleep(retryDelayInSeconds * 1000)
        counter += retryDelayInSeconds
    }
    throw `Upload timeout: ${timeOutSeconds} seconds`
}

function get_upload(upload_arn) {
    return new Promise((resolve, reject) => {
        devicefarm.getUpload({ arn: upload_arn }, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data.upload)
            }
        })
    })
}

/* Utils */
const Utils = {
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}
