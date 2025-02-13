// Konfigurer marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
});

// GitHub konfigurasjon
const GITHUB_TOKEN = '';

// Versjonshåndtering
let currentVersion = 1.0;

// Funksjon for å nullstille versjonsnummer
function resetVersion() {
    console.log('Nullstiller versjon...');
    currentVersion = 1.0;
    localStorage.clear(); // Tømmer all localStorage
    const versionElement = document.getElementById('version');
    if (versionElement) {
        console.log('Setter versjon til 1.0');
        versionElement.textContent = 'v' + currentVersion.toFixed(1);
    }
}

function incrementVersion() {
    currentVersion += 0.1;
    const versionElement = document.getElementById('version');
    if (versionElement) {
        versionElement.textContent = 'v' + currentVersion.toFixed(1);
    }
    localStorage.setItem('currentVersion', currentVersion);
    console.log('Økte versjon til:', currentVersion);
}

// Nullstill versjon ved oppstart
resetVersion();

// Last inn lagret versjon når siden lastes
document.addEventListener('DOMContentLoaded', function() {
    console.log('Side lastet, nullstiller versjon...');
    resetVersion();
    // Nullstill versjon hvis det er første gang siden lastes etter oppdatering
    const lastUpdate = localStorage.getItem('lastUpdate');
    const currentDate = new Date().toDateString();
    
    if (lastUpdate !== currentDate) {
        resetVersion();
        localStorage.setItem('lastUpdate', currentDate);
    } else {
        const savedVersion = localStorage.getItem('currentVersion');
        if (savedVersion) {
            currentVersion = parseFloat(savedVersion);
            const versionElement = document.getElementById('version');
            if (versionElement) {
                versionElement.textContent = 'v' + currentVersion.toFixed(1);
            }
        } else {
            // Hvis ingen versjon er lagret, start på 1.0
            localStorage.setItem('currentVersion', currentVersion);
            const versionElement = document.getElementById('version');
            if (versionElement) {
                versionElement.textContent = 'v' + currentVersion.toFixed(1);
            }
        }
    }
});

// Funksjon for å starte automatisk oppdatering
function startAutoRefresh() {
    console.log('Starter lasting av filer...');
    // Last inn alle filer ved oppstart
    document.querySelectorAll('.file-section').forEach(section => {
        const sectionId = section.id;
        console.log('Laster seksjon:', sectionId);
        loadMarkdownFile(`${sectionId}.md`, sectionId);
    });
    
    // Sjekk hash ved oppstart
    checkHash();
}

// Funksjon for å oppdatere innhold
function showPage(pageId) {
    // Skjul alle seksjoner
    document.querySelectorAll('.file-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Vis valgt seksjon
    const selectedSection = document.getElementById(pageId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    // Oppdater active-klasse på menylenker
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

// Nye funksjoner for redigering
function addEditButton(contentDiv) {
    // Fjern eksisterende knapper hvis de finnes
    const existingButtons = contentDiv.parentElement.querySelectorAll('button');
    existingButtons.forEach(button => button.remove());

    // Lag knappebeholder
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Legg til rediger-knapp
    const editButton = document.createElement('button');
    editButton.textContent = 'Rediger';
    editButton.className = 'edit-button';
    editButton.onclick = () => startEdit(contentDiv);
    
    // Legg til lagre-knapp
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Lagre';
    saveButton.className = 'save-button';
    saveButton.onclick = () => saveToFile(contentDiv);
    
    // Legg til oppdater-knapp
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Oppdater fra fil';
    refreshButton.className = 'refresh-button';
    refreshButton.onclick = () => refreshCurrentContent();
    
    // Legg til knappene i beholderen
    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(refreshButton);
    
    // Legg til beholderen før innholdet
    contentDiv.parentElement.insertBefore(buttonContainer, contentDiv);
}

function startEdit(contentDiv) {
    const editor = document.getElementById('editor');
    const overlay = document.getElementById('editorOverlay');
    
    // Sett innhold i editor
    const markdown = contentDiv.getAttribute('data-markdown') || contentDiv.innerText;
    editor.value = markdown;
    
    // Vis editor
    overlay.style.display = 'block';
}

function cancelEdit() {
    document.getElementById('editorOverlay').style.display = 'none';
}

async function saveEdit() {
    try {
        const editor = document.getElementById('editor');
        if (!editor) {
            throw new Error('Fant ikke editor');
        }

        const content = editor.value;
        const currentPage = document.querySelector('.file-section:not([style*="display: none"])');
        if (!currentPage) {
            throw new Error('Fant ikke aktiv side');
        }

        // Oppdater visningen
        const contentDiv = currentPage.querySelector('.markdown-content');
        if (!contentDiv) {
            throw new Error('Fant ikke innholdsdiv');
        }

        // Lagre lokalt først
        contentDiv.innerHTML = marked.parse(content);
        contentDiv.setAttribute('data-markdown', content);
        
        // Øk versjonsnummer
        incrementVersion();
        
        // Lukk editor
        const overlay = document.getElementById('editorOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Oppdater knapper
        addEditButton(contentDiv);
        
        // Lagre i localStorage
        localStorage.setItem(currentPage.id + '_content', content);
        
        // Vis bekreftelse
        alert('Endringer er lagret. Versjon: v' + currentVersion.toFixed(1));

        // Start bakgrunnssynkronisering
        syncToGitHub(currentPage.id, content).catch(console.error);
    } catch (error) {
        console.error('Error:', error);
        alert('Feil ved lagring: ' + error.message);
    }
}

// Bakgrunnssynkronisering til GitHub
async function syncToGitHub(pageId, content) {
    try {
        const fileName = `content/${pageId}.md`;
        console.log('Lagrer lokalt:', fileName);
        
        // Lagre lokalt
        localStorage.setItem(pageId + '_content', content);
        console.log('Lagret lokalt:', fileName);
        
        // TODO: Implementer GitHub-synkronisering senere
    } catch (error) {
        console.error('Feil ved lagring:', error);
    }
}

function saveToFile(contentDiv) {
    const content = contentDiv.getAttribute('data-markdown') || contentDiv.innerText;
    const sectionId = contentDiv.closest('.file-section').id;
    
    // Lagre i localStorage
    localStorage.setItem(sectionId + '_content', content);
    
    // Oppdater visningen
    contentDiv.innerHTML = marked.parse(content);
    contentDiv.setAttribute('data-markdown', content);
    
    // Øk versjonsnummer
    incrementVersion();
    
    // Oppdater knapper
    addEditButton(contentDiv);
    
    alert('Endringer er lagret. Versjon: v' + currentVersion.toFixed(1));
}

// Funksjon for manuell oppdatering
function refreshCurrentContent() {
    const visibleSection = document.querySelector('.file-section:not([style*="display: none"])');
    if (visibleSection) {
        // Fjern lokalt lagret innhold for å tvinge ny innlasting fra fil
        localStorage.removeItem(visibleSection.id + '_content');
        loadMarkdownFile(`${visibleSection.id}.md`, visibleSection.id);
    }
}

// Sjekk URL-hash og vis riktig side
function checkHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        showPage(hash);
    } else {
        // Vis første side som standard
        const firstPage = document.querySelector('.nav-menu a[data-page]');
        if (firstPage) {
            showPage(firstPage.getAttribute('data-page'));
        }
    }
}

// Last inn Markdown-fil og vis den
async function loadMarkdownFile(filename, elementId) {
    console.log('Laster inn fil:', filename, 'for element:', elementId);
    try {
        const contentDiv = document.querySelector(`#${elementId} .markdown-content`);
        if (!contentDiv) {
            console.error('Fant ikke contentDiv for:', elementId);
            return;
        }

        // Prøv å laste fra localStorage først
        const savedContent = localStorage.getItem(elementId + '_content');
        if (savedContent) {
            console.log('Fant lagret innhold for:', elementId);
            contentDiv.innerHTML = marked.parse(savedContent);
            contentDiv.setAttribute('data-markdown', savedContent);
            addEditButton(contentDiv);
            return;
        }

        // Hvis ikke i localStorage, last fra content-mappen
        try {
            console.log('Prøver å laste fra fil:', `content/${elementId}.md`);
            const response = await fetch(`content/${elementId}.md`);
            if (response.ok) {
                const text = await response.text();
                console.log('Lastet innhold for:', elementId);
                contentDiv.innerHTML = marked.parse(text);
                contentDiv.setAttribute('data-markdown', text);
                addEditButton(contentDiv);
            } else {
                throw new Error('Kunne ikke laste fil');
            }
        } catch (error) {
            console.error('Feil ved lasting av fil:', error);
            contentDiv.innerHTML = '<p>Klikk på "Rediger" for å legge til innhold</p>';
            contentDiv.setAttribute('data-markdown', '');
            addEditButton(contentDiv);
        }
    } catch (error) {
        console.error(`Error loading content for ${elementId}:`, error);
        if (contentDiv) {
            contentDiv.innerHTML = `<div class="error-message">Kunne ikke laste innhold. Prøv igjen senere.</div>`;
        }
    }
}

// Sett opp event listeners når siden er lastet
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM lastet, starter oppsett...');
    // Start autoRefresh
    startAutoRefresh();
    
    // Håndter klikk på menylenker
    document.querySelectorAll('.nav-menu a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            window.location.hash = pageId;
            showPage(pageId);
        });
    });
    
    // Håndter hash-endringer
    window.addEventListener('hashchange', () => {
        checkHash();
    });
});

// Google Drive API konfigurasjon
const API_KEY = window.config.API_KEY;
const FOLDER_ID = window.config.FOLDER_ID;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Last inn Google Drive API
async function initializeGoogleAPI() {
    try {
        // Last inn service account credentials
        const response = await fetch('service-account.json');
        if (!response.ok) {
            throw new Error('Kunne ikke laste service-account.json');
        }
        const credentials = await response.json();

        // Initialiser Google API
        await new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: API_KEY,
                        discoveryDocs: [DISCOVERY_DOC],
                    });

                    // Sett opp service account autentisering
                    const accessToken = await getAccessToken(credentials);
                    gapi.client.setToken({
                        access_token: accessToken
                    });

                    console.log('Google Drive API er klar til bruk');
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });

        // Last inn innhold
        await loadAllContent();
    } catch (err) {
        console.error('Feil ved initialisering av Google API:', err);
    }
}

// Hent access token fra service account
async function getAccessToken(credentials) {
    const jwt = createJWT(credentials);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Kunne ikke hente access token: ' + JSON.stringify(data));
    }
    return data.access_token;
}

// Opprett JWT for service account autentisering
function createJWT(credentials) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 time

    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: credentials.private_key_id
    };

    const claim = {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/drive.file',
        aud: 'https://oauth2.googleapis.com/token',
        exp: exp,
        iat: now
    };

    const sHeader = JSON.stringify(header);
    const sClaim = JSON.stringify(claim);

    const sJWT = KJUR.jws.JWS.sign(null, sHeader, sClaim, credentials.private_key);
    return sJWT;
}

// Last inn innhold fra Google Drive
async function loadAllContent() {
    try {
        const sections = ['beskrivelse', 'prosjektstatus', 'arbeidsliste', 'ressurser', 'skilting_og_hensyn'];
        
        for (const section of sections) {
            console.log(`Laster seksjon: ${section}`);
            const fileName = `${section}.md`;
            await loadMarkdownFile(fileName, section);
        }
    } catch (err) {
        console.error('Feil ved lasting av innhold:', err);
    }
}

// Last inn markdown fil fra Google Drive
async function loadMarkdownFile(fileName, section) {
    try {
        console.log(`Laster inn fil: ${fileName} for element: ${section}`);
        
        // Finn filen i Google Drive
        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        let fileId;
        if (response.result.files.length > 0) {
            fileId = response.result.files[0].id;
            console.log(`Fant eksisterende fil: ${fileName} med ID: ${fileId}`);
        } else {
            // Opprett ny fil hvis den ikke finnes
            const fileMetadata = {
                name: fileName,
                parents: [FOLDER_ID],
                mimeType: 'text/markdown'
            };
            const newFile = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            fileId = newFile.result.id;
            console.log(`Opprettet ny fil: ${fileName} med ID: ${fileId}`);
        }

        // Les filinnhold
        const content = await readFile(fileId);
        updateContent(section, content, fileId);
    } catch (err) {
        console.error('Feil ved lasting av fil:', err);
    }
}

// Les innhold fra fil i Google Drive
async function readFile(fileId) {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.body || '';
    } catch (err) {
        console.error('Feil ved lesing av fil:', err);
        return '';
    }
}

// Oppdater innhold i en seksjon
function updateContent(section, content, fileId) {
    const element = document.getElementById(section);
    if (element) {
        element.innerHTML = marked.parse(content);
        element.setAttribute('data-file-id', fileId);
        element.setAttribute('data-markdown', content);
        makeEditable(element);
    }
}

// Gjør en seksjon redigerbar
function makeEditable(element) {
    element.addEventListener('dblclick', () => {
        const content = element.getAttribute('data-markdown') || element.innerText;
        const fileId = element.getAttribute('data-file-id');
        showEditor(content, async (newContent) => {
            await saveToGoogleDrive(fileId, newContent);
            element.innerHTML = marked.parse(newContent);
            element.setAttribute('data-markdown', newContent);
        });
    });
}

// Lagre innhold til Google Drive
async function saveToGoogleDrive(fileId, content) {
    try {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const contentType = 'text/markdown';
        const metadata = {
            mimeType: contentType
        };

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n\r\n' +
            content +
            close_delim;

        await gapi.client.request({
            'path': '/upload/drive/v3/files/' + fileId,
            'method': 'PATCH',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });

        console.log('Fil lagret i Google Drive');
    } catch (err) {
        console.error('Feil ved lagring:', err);
    }
}

// Start oppsett når siden er lastet
document.addEventListener('DOMContentLoaded', initializeGoogleAPI);
