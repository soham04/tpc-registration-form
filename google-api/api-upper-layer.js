const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const operations = require("./api-operations");
const { content } = require('googleapis/build/src/apis/content');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


module.exports = {
    // 1) Authorise 

    onlyAuthorize:
        function onlyAuthorize() {
            // Load client secrets from a local file.
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Drive API.
                let props = null
                authorize(JSON.parse(content), null, props);
            });
        },


    // 2) List files 
    listFiles:
        function listFiles(n) {
            // Load client secrets from a local file.
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Drive API.
                let props = {
                    n: n,
                }
                console.log(props);
                // console.log("hi");
                authorize(JSON.parse(content), operations.listFiles, props);
            });
        },


    // 3) createFolder 
    createFolder:
        function createFolder(name) {
            // Load client secrets from a local file.
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Drive API.
                // authorize(JSON.parse(content), createFolder, { name:"hello-world" });
                let props = {
                    name: name,
                }
                authorize(JSON.parse(content), operations.createFolder, props);
            });
        },


    // 4) upload file
    uploadBasic:
        function uploadBasic(name, MimeType, location) {
            // uploads to drive homepage
            // Load client secrets from a local file.
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Drive API.
                let props = {
                    name: name,
                    MimeType: MimeType,
                    location: location,
                }
                authorize(JSON.parse(content), operations.uploadBasic, props);
            });
        },


    // 5) upload to Folder
    uploadToFolder:
        async function uploadToFolder(name, MimeType, location, folderID) {
            // Load client secrets from a local file.
            console.log("came here");
            let tmp = await helper3(name, MimeType, location, folderID)
            return tmp
        },

    // 6) move File to Folder
    moveFileToFolder:
        function moveFileToFolder(fileId, folderId) {
            // Load client secrets from a local file.
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Drive API.
                let props = {
                    fileId: fileId,
                    folderId: folderId,
                }
                return authorize(JSON.parse(content), operations.moveFileToFolder, props);
            });
        }
}

async function helper3(name, MimeType, location, folderID) {
    return new Promise(async (res, rej) => {

        fs.readFile('credentials.json', async (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Drive API.
            let props = {
                name: name,
                MimeType: MimeType,
                location: location,
                folderID: folderID,
            }
            console.log(props);
            let tmp = await helper2(content, operations, props)
            console.log("return = " + tmp);
            res(tmp)
        })
    });
}

async function helper2(content, operations, props) {
    return new Promise(async (res, rej) => {
        await authorize(JSON.parse(content), operations.uploadToFolder, props).then((id) => {
            console.log("2- " + id);
            res(id)
        });
    })
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials, callback, props) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // let idd = ""
    // Check if we have previously stored a token.
    let tmp = await helper1(oAuth2Client, callback, props)
    return tmp
}

function helper1(oAuth2Client, callback, props) {
    return new Promise((res, rej) => {
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            if (callback) {
                callback(oAuth2Client, props).then((id) => {
                    console.log("3 = " + id);
                    // idd = id
                    console.log(id);
                    // return id
                    res(id)
                });
            }
        })
    })

}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}
