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

var devicefarm = new AWS.DeviceFarm({ region: REGION })

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

function get_project_arn(name) {
    return new Promise((resolve, reject) => {
        devicefarm.listProjects(function (err, data) {
            if (err) {
                reject(err)
            } else {
                var projectArn = data.projects.filter(function (project) {
                    return project.name === name
                })[0].arn
                resolve(projectArn)
            }
        })
    })
}

function get_upload_arn(project_arn, name) {
    return new Promise((resolve, reject) => {
        devicefarm.listUploads({ arn: project_arn }, function (err, data) {
            if (err) {
                reject(err)
            } else {
                var uploadArn = data.uploads.filter(function (upload) {
                    return upload.name === name
                })[0]?.arn
                console.log(uploadArn)
                resolve(uploadArn)
            }
        })
    })
}

function delete_upload(upload_arn) {
    return new Promise((resolve, reject) => {
        devicefarm.deleteUpload({ arn: upload_arn }, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
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
    var file = fs.readFileSync(file_path)
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

function _poll_until_upload_done(upload_arn) {
    return new Promise((resolve, reject) => {
        devicefarm.getUpload({ arn: upload_arn }, function (err, data) {
            if (err) {
                reject(err)
            } else {
                if (
                    data.upload.status === "PENDING" ||
                    data.upload.status === "PROCESSING" ||
                    data.upload.status === "INITIALIZED"
                ) {
                    console.log("Current status: " + data.upload.status)
                    setTimeout(function () {
                        _poll_until_upload_done(upload_arn)
                    }, 5000)
                } else {
                    console.log(data)
                    resolve(data)
                }
            }
        })
    })
}

async function upload(upload_type, upload_path, upload_name) {
    console.log(`Uploading [${upload_path}] to [${upload_name}]...`)
    var project_arn = await get_project_arn(PROJECT_NAME)
    var upload_arn = await get_upload_arn(project_arn, upload_name)
    try {
        if (upload_arn) {
            await delete_upload(upload_arn)
        }
    } catch (e) {
        console.log(e)
    }
    var type = upload_type
    var name = upload_name
    var url = await create_upload(project_arn, type, name)
    console.log(url.upload.arn)
    upload_arn = await upload_presigned_url(url, upload_path)
    console.log(upload_arn)
    await _poll_until_upload_done(upload_arn)
    return upload_arn
}
