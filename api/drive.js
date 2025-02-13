const { google } = require('googleapis');

// Service account credentials
const credentials = {
  "type": "service_account",
  "project_id": "cohesive-scope-450810-t5",
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": "eidsfoss-marked-admin@cohesive-scope-450810-t5.iam.gserviceaccount.com",
  "client_id": process.env.CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/eidsfoss-marked-admin@cohesive-scope-450810-t5.iam.gserviceaccount.com`
};

// Google Drive folder ID
const FOLDER_ID = '1q69DfRrRHDZQ5UxjCc4myYZluTM7e4Kf';

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

const drive = google.drive({ version: 'v3', auth });

// API handler
module.exports = async (req, res) => {
  try {
    const { method, action, fileName, content, fileId } = req.body;

    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    switch (action) {
      case 'list':
        // List files in folder
        const response = await drive.files.list({
          q: `'${FOLDER_ID}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType)',
        });
        res.json(response.data);
        break;

      case 'read':
        // Read file content
        if (!fileId) {
          // Find file by name
          const files = await drive.files.list({
            q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
            fields: 'files(id, name)',
          });

          if (files.data.files.length > 0) {
            const file = await drive.files.get({
              fileId: files.data.files[0].id,
              alt: 'media'
            });
            res.json({ content: file.data });
          } else {
            // Create new file if it doesn't exist
            const newFile = await drive.files.create({
              requestBody: {
                name: fileName,
                parents: [FOLDER_ID],
                mimeType: 'text/markdown'
              },
              media: {
                mimeType: 'text/markdown',
                body: ''
              },
              fields: 'id'
            });
            res.json({ content: '', fileId: newFile.data.id });
          }
        } else {
          // Read existing file
          const file = await drive.files.get({
            fileId: fileId,
            alt: 'media'
          });
          res.json({ content: file.data });
        }
        break;

      case 'write':
        // Write file content
        await drive.files.update({
          fileId: fileId,
          media: {
            mimeType: 'text/markdown',
            body: content
          }
        });
        res.json({ success: true });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
};
