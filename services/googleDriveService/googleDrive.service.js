const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/docs'];
const TOKEN_PATH = 'token.json';
// If modifying these scopes, delete token.json.
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.


async function handleGoogleDrive(type, data) {
  const innerCallback = type === 'folder' ? createFolder : uploadFile
  // const innerCallback = listFiles
  // Load client secrets from a local file.
  return new Promise((resolve, reject) => {

    fs.readFile(__dirname + '/credentials.json', async (err, content) => {
      if (err) {
        return reject(console.log('Error loading client secret file:', err));
      }
      // Authorize a client with credentials, then call the Google Drive API.
      // authorize(JSON.parse(content), listFiles);
      await authorize(JSON.parse(content), async (auth) => {
        const res = await innerCallback(auth, data)
        resolve(res)
      });
    });
  })

}





/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  return new Promise((resolve, reject) => {
    fs.readFile(TOKEN_PATH, async (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      await callback(oAuth2Client);
      resolve()
    });

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

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  return new Promise((resolve, reject) => {
    const drive = google.drive({ version: 'v3', auth });
    drive.files.list({
      // pageSize: 10,
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
      // q: "mimeType='application/pdf' and parents in '1KoTFSWUOhSXcLRaCNVhPYyC8vnYDj0EB'",
      // q: "parents in '1KoTFSWUOhSXcLRaCNVhPYyC8vnYDj0EB'",
      // q: "mimeType = 'application/vnd.google-apps.folder/1KoTFSWUOhSXcLRaCNVhPYyC8vnYDj0EB'",
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const files = res.data.files;
      if (files.length) {
        console.log('Files:');
        files.map((file) => {
          console.log(`${file.name} (${file.id})`);
        });
        resolve({ folderId: 3 })
      } else {
        console.log('No files found.');
      }
    });

  })

}


function uploadFile(auth, data) {
  return new Promise((resolve, reject) => {
    // data.parentId = data.parentId || '1KoTFSWUOhSXcLRaCNVhPYyC8vnYDj0EB'

    const drive = google.drive({ version: 'v3', auth });
    console.log('data.filename: ', data.filename);

    var fileMetadata = {
      'name': data.filename,
    };
    if (data.parentId) fileMetadata.parents = [data.parentId]
    if (data.mimeType === 'text/csv') fileMetadata.mimeType = 'application/vnd.google-apps.spreadsheet'

    var media = {
      mimeType: data.mimeType,
      body: data.mimeType === 'text/csv' ? data.content : fs.createReadStream('./document.pdf') //!Testing
      // body: data.content
    };
    drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id'
    }, function (err, file) {
      if (err) {
        // Handle error
        console.error(err);
        reject()
      } else {
        // console.log('File Id: ', file.data.id);
        resolve({ folderId: file.data.id })
      }
    });
  })

}


function createFolder(auth, data) {
  return new Promise((resolve, reject) => {
    // data.parentId = data.parentId || '1KoTFSWUOhSXcLRaCNVhPYyC8vnYDj0EB'
    const drive = google.drive({ version: 'v3', auth });
    var fileMetadata = {
      'name': data.name,
      'mimeType': 'application/vnd.google-apps.folder',
    };
    if (data.parentId) fileMetadata.parents = [data.parentId]

    drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }, function (err, file) {
      if (err) {
        // Handle error
        console.error(err);
        reject()
      } else {
        console.log('Folder Id: ', file.data.id);
        resolve({ folderId: file.data.id })
      }
    });
  })

}


module.exports = {
  handleGoogleDrive
}