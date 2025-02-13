const { google } = require('googleapis');

// Google Drive folder ID
const FOLDER_ID = '1-0dYJQXnXF_Lq9l0oEfBYrJYVGpQKDEX';

// API handler
module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Request received:', req.method, req.body);
    console.log('Environment variables:', {
      hasPrivateKey: !!process.env.PRIVATE_KEY,
      privateKeyLength: process.env.PRIVATE_KEY?.length
    });

    // Opprett JWT client
    const auth = new google.auth.JWT({
      email: 'eidsfossmarked@cohesive-scope-450810-t5.iam.gserviceaccount.com',
      key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    console.log('JWT client created');

    // Test autentisering
    await auth.authorize();
    console.log('Authentication successful');

    // Opprett Drive client
    const drive = google.drive({ version: 'v3', auth });
    console.log('Drive client created');

    const { action, fileName, fileId, content } = req.body;

    if (!action) {
      throw new Error('Missing action parameter');
    }

    switch (action) {
      case 'read':
        if (!fileName) {
          throw new Error('Missing fileName parameter');
        }

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

          return res.status(200).json({ content: file.data, fileId: fileId });
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
          return res.status(200).json({ content: '', fileId: newFile.data.id });
        }

      case 'write':
        if (!fileId) {
          throw new Error('Missing fileId parameter');
        }
        if (content === undefined) {
          throw new Error('Missing content parameter');
        }

        console.log('Writing to file:', fileId);
        
        await drive.files.update({
          fileId: fileId,
          media: {
            mimeType: 'text/markdown',
            body: content
          }
        });

        return res.status(200).json({ success: true });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
};
