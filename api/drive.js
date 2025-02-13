const { google } = require('googleapis');

// Service account credentials
const credentials = {
  "type": "service_account",
  "project_id": "cohesive-scope-450810-t5",
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": "eidsfoss-marked-admin@cohesive-scope-450810-t5.iam.gserviceaccount.com",
  "client_id": process.env.CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/eidsfoss-marked-admin@cohesive-scope-450810-t5.iam.gserviceaccount.com`
};

// Debug logging
console.log('Environment variables:');
console.log('PRIVATE_KEY_ID exists:', !!process.env.PRIVATE_KEY_ID);
console.log('CLIENT_ID exists:', !!process.env.CLIENT_ID);
console.log('PRIVATE_KEY exists:', !!process.env.PRIVATE_KEY);

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
    console.log('Request received:', req.method, req.body);

    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const { method, action, fileName, content, fileId } = req.body;

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
        console.log('Reading file:', fileName);
        // Find file by name
        const files = await drive.files.list({
          q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive'
        });

        console.log('Files found:', files.data.files);

        let fileId;
        if (files.data.files.length > 0) {
          fileId = files.data.files[0].id;
          console.log('Found existing file:', fileName, 'with ID:', fileId);
          
          // Read file content
          const file = await drive.files.get({
            fileId: fileId,
            alt: 'media'
          });

          res.json({ content: file.data, fileId: fileId });
        } else {
          // Create new file if it doesn't exist
          console.log('Creating new file:', fileName);
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
        break;

      case 'write':
        console.log('Writing to file:', fileId);
        
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
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
};
