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

// API endpoint
const API_URL = '/api/drive';

// Last inn innhold fra API
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

// Last inn markdown fil fra API
async function loadMarkdownFile(fileName, section) {
    try {
        console.log(`Laster inn fil: ${fileName} for element: ${section}`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'POST',
                action: 'read',
                fileName: fileName
            })
        });

        if (!response.ok) {
            throw new Error('Kunne ikke laste fil');
        }

        const data = await response.json();
        updateContent(section, data.content, data.fileId);
    } catch (err) {
        console.error('Feil ved lasting av fil:', err);
    }
}

// Oppdater innhold i en seksjon
function updateContent(section, content, fileId) {
    const element = document.getElementById(section);
    if (element) {
        element.innerHTML = marked.parse(content || '');
        element.setAttribute('data-file-id', fileId);
        element.setAttribute('data-markdown', content || '');
        makeEditable(element);
    }
}

// Gjør en seksjon redigerbar
function makeEditable(element) {
    element.addEventListener('dblclick', () => {
        const content = element.getAttribute('data-markdown') || element.innerText;
        const fileId = element.getAttribute('data-file-id');
        showEditor(content, async (newContent) => {
            await saveToAPI(fileId, newContent);
            element.innerHTML = marked.parse(newContent);
            element.setAttribute('data-markdown', newContent);
        });
    });
}

// Lagre innhold via API
async function saveToAPI(fileId, content) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'POST',
                action: 'write',
                fileId: fileId,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error('Kunne ikke lagre fil');
        }

        console.log('Fil lagret');
    } catch (err) {
        console.error('Feil ved lagring:', err);
    }
}

// Start lasting av innhold når siden er lastet
document.addEventListener('DOMContentLoaded', loadAllContent);

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
