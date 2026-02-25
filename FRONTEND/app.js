const API_URL = 'http://localhost:3000/api/notes';

// DOM Elements
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');
const titleInput = document.getElementById('titleInput');
const documentInput = document.getElementById('documentInput');
const dateDisplay = document.getElementById('dateDisplay');
const newNoteBtn = document.getElementById('newNoteBtn');
const deleteBtn = document.getElementById('deleteBtn');

// Mobile Navigation Elements
const sidebar = document.getElementById('sidebar');
const editorPane = document.getElementById('editorPane');
const backBtn = document.getElementById('backBtn');

let allNotes = [];
let currentEditId = null;

// --- Mobile Navigation Logic ---
function showEditorMobile() {
    sidebar.classList.add('hidden');
    sidebar.classList.remove('flex');
    editorPane.classList.remove('hidden');
    editorPane.classList.add('flex');
}

function showSidebarMobile() {
    editorPane.classList.add('hidden');
    editorPane.classList.remove('flex');
    sidebar.classList.remove('hidden');
    sidebar.classList.add('flex');
}

// Attach back button
backBtn.onclick = showSidebarMobile;

// --- 1. Fetch & Display ---
async function fetchNotes() {
    try {
        const response = await fetch(API_URL);
        allNotes = await response.json();
        allNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        renderSidebar();
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

// --- 2. Draw Sidebar ---
function renderSidebar() {
    notesList.innerHTML = '';

    allNotes.forEach(note => {
        const sidebarItem = document.createElement('div');
        const isSelected = note._id === currentEditId;
        
        // Premium Dark Mode highlight colors
        sidebarItem.className = `p-4 rounded-xl cursor-pointer mb-1 transition-colors duration-200 border-b border-[#333336]/30 ${isSelected ? 'bg-[#2c2c2e]' : 'hover:bg-[#2c2c2e] bg-transparent'}`;
        
        const snippet = note.Document.length > 35 ? note.Document.substring(0, 35) + '...' : note.Document;
        const dateStr = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

        sidebarItem.innerHTML = `
            <h3 class="font-bold text-white truncate mb-1">${note.Title}</h3>
            <div class="flex text-sm">
                <span class="mr-3 text-gray-500">${dateStr}</span>
                <span class="text-gray-400 truncate">${snippet}</span>
            </div>
        `;
        
        sidebarItem.onclick = () => loadNote(note._id);
        notesList.appendChild(sidebarItem);
    });
}

// --- 3. Load Note ---
function loadNote(id) {
    const noteToEdit = allNotes.find(note => note._id === id);
    if (!noteToEdit) return;

    currentEditId = id;
    titleInput.value = noteToEdit.Title;
    documentInput.value = noteToEdit.Document;
    
    const dateStr = noteToEdit.updatedAt ? new Date(noteToEdit.updatedAt).toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }) : '';
    dateDisplay.innerText = dateStr;

    deleteBtn.classList.remove('hidden');
    renderSidebar(); 
    
    // Slide to editor if on phone
    if (window.innerWidth < 768) showEditorMobile();
}

// --- 4. New Note ---
newNoteBtn.onclick = () => {
    currentEditId = null;
    titleInput.value = '';
    documentInput.value = '';
    dateDisplay.innerText = 'NEW NOTE';
    deleteBtn.classList.add('hidden'); 
    
    renderSidebar(); 
    if (window.innerWidth < 768) showEditorMobile();
    titleInput.focus();
};

// --- 5. Delete ---
deleteBtn.onclick = async () => {
    if (!currentEditId) return;
    if (!confirm("Delete this note?")) return;

    try {
        await fetch(`${API_URL}/${currentEditId}`, { method: 'DELETE' });
        
        // Clear editor and go back to list
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

// --- 6. Save/Update ---
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const noteData = {
        Title: titleInput.value,
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
        }

        deleteBtn.classList.remove('hidden');
        fetchNotes();
        
        // Go back to the list automatically on mobile after saving
        if (window.innerWidth < 768) showSidebarMobile();
        
    } catch (error) {
        console.error('Error saving note:', error);
    }
});

fetchNotes();