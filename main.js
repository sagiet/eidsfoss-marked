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

// Hent API-nøkler fra config
const config = {
    CLIENT_ID: '', // Sett denne i config.local.js
    API_KEY: '',   // Sett denne i config.local.js
    FOLDER_ID: ''  // Sett denne i config.local.js
};

// Last inn config fra config.local.js hvis den finnes
if (typeof localConfig !== 'undefined') {
    Object.assign(config, localConfig);
}

// Google Drive API oppsett
const CLIENT_ID = config.CLIENT_ID;
const API_KEY = config.API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Mappe-ID for hvor MD-filene ligger i Google Drive
const FOLDER_ID = config.FOLDER_ID;

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Last inn Google API
function loadGoogleAPI() {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.onload = gapiLoaded;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.onload = gisLoaded;
    document.head.appendChild(script2);
}

// Initialiser Google API
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Defineres ved bruk
    });
    gisInited = true;
    maybeEnableButtons();
}

// Sjekk om vi er klare til å bruke API-en
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        console.log('Google Drive API er klar til bruk');
        loadContent();
    }
}

// Last inn innhold fra MD-filer i Google Drive
async function loadContent() {
    try {
        const sections = ['beskrivelse', 'prosjektstatus', 'arbeidsliste', 'ressurser', 'skilting_og_hensyn'];
        
        for (const sectionId of sections) {
            const fileName = `${sectionId}.md`;
            const fileId = await findOrCreateFile(fileName);
            
            if (fileId) {
                const content = await readFile(fileId);
                const contentDiv = document.querySelector(`#${sectionId} .markdown-content`);
                if (contentDiv) {
                    contentDiv.innerHTML = marked.parse(content);
                    contentDiv.setAttribute('data-file-id', fileId);
                    addEditButton(contentDiv);
                }
            }
        }
    } catch (err) {
        console.error('Feil ved lasting av innhold:', err);
    }
}

// Finn eller opprett MD-fil i Google Drive
async function findOrCreateFile(fileName) {
    try {
        // Søk etter eksisterende fil
        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (response.result.files.length > 0) {
            return response.result.files[0].id;
        }

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

        return newFile.result.id;
    } catch (err) {
        console.error('Feil ved søk/opprettelse av fil:', err);
        return null;
    }
}

// Les innhold fra fil
async function readFile(fileId) {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.body;
    } catch (err) {
        console.error('Feil ved lesing av fil:', err);
        return '';
    }
}

// Lagre endringer til MD-fil
async function saveFile(fileId, content) {
    try {
        const file = new Blob([content], {type: 'text/markdown'});
        const metadata = {
            mimeType: 'text/markdown'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        await gapi.client.request({
            path: '/upload/drive/v3/files/' + fileId,
            method: 'PATCH',
            params: {uploadType: 'multipart'},
            body: form
        });

        console.log('Fil lagret i Google Drive');
    } catch (err) {
        console.error('Feil ved lagring:', err);
    }
}

// Rediger innhold
function editContent(element) {
    const content = element.getAttribute('data-markdown') || '';
    const editor = document.getElementById('editor');
    const overlay = document.getElementById('editorOverlay');
    
    editor.value = content;
    overlay.style.display = 'flex';
    
    // Lagre referanse til elementet som redigeres
    editor.setAttribute('data-editing-element', element.id);
    editor.setAttribute('data-file-id', element.getAttribute('data-file-id'));
}

// Lagre endringer
async function saveEdit() {
    const editor = document.getElementById('editor');
    const content = editor.value;
    const fileId = editor.getAttribute('data-file-id');
    
    if (fileId) {
        await saveFile(fileId, content);
        const element = document.getElementById(editor.getAttribute('data-editing-element'));
        if (element) {
            element.innerHTML = marked.parse(content);
            element.setAttribute('data-markdown', content);
        }
    }
    
    document.getElementById('editorOverlay').style.display = 'none';
}

// Avbryt redigering
function cancelEdit() {
    document.getElementById('editorOverlay').style.display = 'none';
}

// Start oppsett når siden lastes
document.addEventListener('DOMContentLoaded', loadGoogleAPI);
