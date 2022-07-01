const { google } = require('googleapis');
const fs = require('fs');

module.exports = {
    createFolder: async function createFolder(auth, props) {

        const service = google.drive({ version: 'v3', auth });
        const fileMetadata = {
            // 'title': 'Invoices',
            name: props.name,
            'mimeType': 'application/vnd.google-apps.folder',
        };
        try {
            const file = await service.files.create({
                resource: fileMetadata,
                fields: 'id',
            });
            console.log('Folder Id:', file.data.id);
            return file.data.id;
        } catch (err) {
            // TODO(developer) - Handle error
            throw err;
        }
    },

    listFiles: async function listFiles(auth, props) {
        const drive = google.drive({ version: 'v3', auth });
        drive.files.list({
            pageSize: props.n,
            fields: 'nextPageToken, files(id, name)',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if (files.length) {
                console.log('Files:');
                files.map((file) => {
                    console.log(`${file.name} (${file.id})`);
                });
            } else {
                console.log('No files found.');
            }
        });
    },

    uploadBasic: async function uploadBasic(auth, props) {
        console.log(props);
        const service = google.drive({ version: 'v3', auth });
        const fileMetadata = {
            // title: 'Discrete Mathematics (1).jpg',
            name: props.name,
        };
        const media = {
            mimeType: props.mimeType,
            body: fs.createReadStream(props.location),
        };
        try {
            const file = await service.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            console.log(file.data);
            console.log('File Id:', file.data.id);
            return file.data.id;
        } catch (err) {
            // TODO(developer) - Handle error
            throw err;
        }
    },

    uploadToFolder: async function uploadToFolder(auth, props) {

        const service = google.drive({ version: 'v3', auth });

        // TODO(developer): set folder Id
        // folderId = '1lWo8HghUBd-3mN4s98ArNFMdqmhqCXH7';
        const fileMetadata = {
            // 'title': 'Discrete Mathematics (1).jpg',
            name: props.name,
            'parents': [props.folderID],
        };
        const media = {
            mimeType: props.mimeType,
            body: fs.createReadStream(props.location),
        };

        try {
            const file = await service.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            console.log('foler upload File Id:', file.data.id);
            console.log("1 - " + file.data.id);
            return file.data.id;
        } catch (err) {
            // TODO(developer) - Handle error
            throw err;
        }

    },

    moveFileToFolder: async function moveFileToFolder(auth, props) {

        const service = google.drive({ version: 'v3', auth });

        try {
            // Retrieve the existing parents to remove
            const file = await service.files.get({
                fileId: props.fileId,
                fields: 'parents',
            });

            // Move the file to the new folder
            const previousParents = file.data.parents.map(function (parent) {
                return parent.id;
            }).join(',');
            const files = await service.files.update({
                fileId: props.fileId,
                addParents: props.folderId,
                removeParents: previousParents,
                fields: 'id, parents',
            });
            console.log(files.status);
            console.log("Sccessfully moved file to the destination folder");
            return files.status;
        } catch (err) {
            // TODO(developer) - Handle error
            throw err;
        }
    }
}

