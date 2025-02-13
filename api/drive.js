const { google } = require('googleapis');

// Google Drive folder ID
const FOLDER_ID = '1-0dYJQXnXF_Lq9l0oEfBYrJYVGpQKDEX';

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

    // Opprett JWT client
    const auth = new google.auth.JWT({
      email: 'eidsfossmarked@cohesive-scope-450810-t5.iam.gserviceaccount.com',
      key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    console.log('JWT client created');

    // Opprett Drive client
    const drive = google.drive({ version: 'v3', auth });
    console.log('Drive client created');

    const { action, fileName, fileId, content } = req.body;

    switch (action) {
      case 'read':
        console.log('Reading file:', fileName);
        // Find file by name
        const files = await drive.files.list({
          q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive'
        });

        console.log('Files found:', files.data.files);

        if (files.data.files.length > 0) {
          const fileId = files.data.files[0].id;
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
      details: error.message,
      stack: error.stack
    });
  }
};
