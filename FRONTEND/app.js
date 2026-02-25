const API_URL = 'https://notes-8v41.onrender.com/api/notes';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');
const titleInput = document.getElementById('titleInput');
const documentInput = document.getElementById('documentInput');
const dateDisplay = document.getElementById('dateDisplay');
const statusDisplay = document.getElementById('statusDisplay'); // NEW
const wordCountDisplay = document.getElementById('wordCountDisplay'); // NEW
const newNoteBtn = document.getElementById('newNoteBtn');
const deleteBtn = document.getElementById('deleteBtn');
const sidebar = document.getElementById('sidebar');
const editorPane = document.getElementById('editorPane');
const backBtn = document.getElementById('backBtn');

let allNotes = [];
let currentEditId = null;
let autoSaveTimeout = null; // Keeps track of our typing timer

// --- UI Helpers ---
function updateWordCount() {
    const text = documentInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    wordCountDisplay.innerText = `${words} word${words !== 1 ? 's' : ''} | ${chars} char${chars !== 1 ? 's' : ''}`;
}

function setStatus(text, show = true) {
    statusDisplay.innerText = text;
    statusDisplay.style.opacity = show ? '1' : '0';
}

// --- Mobile Navigation Logic ---
function showEditorMobile() {
    sidebar.classList.add('hidden');
    sidebar.classList.remove('flex', 'slide-in-left');
    editorPane.classList.remove('hidden');
    editorPane.classList.add('flex', 'slide-in-right'); 
}

function showSidebarMobile() {
    editorPane.classList.add('hidden');
    editorPane.classList.remove('flex', 'slide-in-right');
    sidebar.classList.remove('hidden');
    sidebar.classList.add('flex', 'slide-in-left');
}

backBtn.onclick = showSidebarMobile;

// --- Fetch & Display ---
async function fetchNotes(skipSidebarRender = false) {
    try {
        const response = await fetch(API_URL);
        allNotes = await response.json();
        allNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Sometimes we fetch data in the background and don't want to steal the user's focus
        if (!skipSidebarRender) {
            renderSidebar();
        }
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

// --- Draw Sidebar ---
function renderSidebar(notesToDisplay = allNotes) {
    notesList.innerHTML = '';

    if (notesToDisplay.length === 0) {
        notesList.innerHTML = `<div class="text-center text-gray-500 mt-10 text-sm">No notes found.</div>`;
        return;
    }

    notesToDisplay.forEach(note => {
        const sidebarItem = document.createElement('div');
        const isSelected = note._id === currentEditId;
        
        sidebarItem.className = `p-4 rounded-xl cursor-pointer mb-1 transition-all duration-200 border-b border-[#333336]/30 ${isSelected ? 'bg-[#2c2c2e]' : 'hover:bg-[#2c2c2e] bg-transparent'}`;
        
        const snippet = note.Document.length > 35 ? note.Document.substring(0, 35) + '...' : note.Document;
        const dateStr = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

        sidebarItem.innerHTML = `
            <h3 class="font-bold text-white truncate mb-1">${note.Title || 'New Note'}</h3>
            <div class="flex text-sm">
                <span class="mr-3 text-gray-500 min-w-max">${dateStr}</span>
                <span class="text-gray-400 truncate">${snippet || 'No additional text'}</span>
            </div>
        `;
        
        sidebarItem.onclick = () => loadNote(note._id);
        notesList.appendChild(sidebarItem);
    });
}

// --- Load Note ---
function loadNote(id) {
    const noteToEdit = allNotes.find(note => note._id === id);
    if (!noteToEdit) return;

    currentEditId = id;
    titleInput.value = noteToEdit.Title;
    documentInput.value = noteToEdit.Document;
    
    const dateStr = noteToEdit.updatedAt ? new Date(noteToEdit.updatedAt).toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }) : '';
    dateDisplay.innerText = dateStr;
    setStatus('', false);

    updateWordCount();
    deleteBtn.classList.remove('hidden');
    renderSidebar(); 
    
    if (window.innerWidth < 768) showEditorMobile();
}

// --- New Note ---
newNoteBtn.onclick = () => {
    currentEditId = null;
    titleInput.value = '';
    documentInput.value = '';
    dateDisplay.innerText = new Date().toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' });
    setStatus('', false);
    updateWordCount();
    deleteBtn.classList.add('hidden'); 
    
    renderSidebar(); 
    if (window.innerWidth < 768) showEditorMobile();
    titleInput.focus();
};

// --- Delete ---
deleteBtn.onclick = async () => {
    if (!currentEditId) return;
    if (!confirm("Delete this note?")) return;

    try {
        await fetch(`${API_URL}/${currentEditId}`, { method: 'DELETE' });
        
        currentEditId = null;
        titleInput.value = '';
        documentInput.value = '';
        deleteBtn.classList.add('hidden');
        
        if (window.innerWidth < 768) showSidebarMobile();
        fetchNotes(); 
    } catch (error) {
        console.error('Error deleting note:', error);
    }
};

// --- REAL-TIME & AUTO-SAVE LOGIC ---
async function saveToDatabase() {
    // Don't save if both are completely empty
    if (titleInput.value.trim() === '' && documentInput.value.trim() === '') return;

    setStatus('Saving...', true);

    const noteData = {
        Title: titleInput.value || 'Untitled Note',
        Document: documentInput.value
    };

    try {
        if (currentEditId) {
            await fetch(`${API_URL}/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
        } else {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            const savedNote = await response.json();
            currentEditId = savedNote._id; 
            deleteBtn.classList.remove('hidden'); // Show delete button since it's now saved
        }

        setStatus('All changes saved', true);
        
        // Hide the status text slowly after 2 seconds
        setTimeout(() => setStatus('', false), 2000);

        // Fetch new data quietly in the background so dates are perfectly accurate
        fetchNotes(true); 

    } catch (error) {
        setStatus('Error saving!', true);
        console.error('Error saving note:', error);
    }
}

// Listen to every single keystroke in the title and body
function handleInputChanges() {
    updateWordCount();
    
    // 1. Live Sidebar Sync: Instantly update the array in memory so the sidebar looks fast
    if (currentEditId) {
        const localNote = allNotes.find(n => n._id === currentEditId);
        if (localNote) {
            localNote.Title = titleInput.value;
            localNote.Document = documentInput.value;
            renderSidebar();
        }
    }

    // 2. Auto-Save Debounce: Reset the 1-second timer every time they hit a key
    clearTimeout(autoSaveTimeout);
    setStatus('Typing...', true);
    
    autoSaveTimeout = setTimeout(() => {
        saveToDatabase();
    }, 1000); // 1000 ms = 1 second of no typing triggers the save
}

titleInput.addEventListener('input', handleInputChanges);
documentInput.addEventListener('input', handleInputChanges);

// The manual "Done" button now just triggers the save immediately and closes mobile view
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearTimeout(autoSaveTimeout); // Stop the auto-save from running twice
    await saveToDatabase();
    if (window.innerWidth < 768) showSidebarMobile();
});

// --- Search Logic ---
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredNotes = allNotes.filter(note => 
        (note.Title && note.Title.toLowerCase().includes(searchTerm)) || 
        (note.Document && note.Document.toLowerCase().includes(searchTerm))
    );
    renderSidebar(filteredNotes);
});

// --- Native Swipe Gestures ---
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 75; 

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    if (window.innerWidth >= 768) return;
    const swipeDistance = touchEndX - touchStartX;
    if (swipeDistance > SWIPE_THRESHOLD && !editorPane.classList.contains('hidden')) {
        showSidebarMobile();
    }
    if (swipeDistance < -SWIPE_THRESHOLD && !sidebar.classList.contains('hidden')) {
        if (currentEditId || titleInput.value !== '' || dateDisplay.innerText === 'NEW NOTE') {
            showEditorMobile();
        }
    }
}

// Kickoff
fetchNotes();