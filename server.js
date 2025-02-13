const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Tillat CORS og JSON data
app.use(cors());
app.use(express.json());

// Serve statiske filer
app.use(express.static('.'));

// API for å lagre fil
app.post('/save', async (req, res) => {
    try {
        const { id, content } = req.body;
        if (!id || !content) {
            return res.status(400).json({ error: 'Mangler id eller innhold' });
        }

        // Lagre til fil i content-mappen
        const filePath = path.join(__dirname, 'content', `${id}.md`);
        await fs.writeFile(filePath, content, 'utf8');

        // Git commit og push
        const { execSync } = require('child_process');
        execSync('git add content/*', { cwd: __dirname });
        execSync(`git commit -m "Oppdatert ${id}.md via editor"`, { cwd: __dirname });
        execSync('git push origin main', { cwd: __dirname });

        res.json({ success: true, message: 'Fil lagret og pushet til GitHub' });
    } catch (error) {
        console.error('Feil ved lagring:', error);
        res.status(500).json({ error: 'Kunne ikke lagre fil: ' + error.message });
    }
});

app.listen(port, () => {
    console.log(`Server kjører på http://localhost:${port}`);
});
