// --- APIs ---
const API_URL = 'https://notes-8v41.onrender.com/api/notes';
const AUTH_URL = 'https://notes-8v41.onrender.com/api/auth';

// --- DOM Elements ---
const searchInput = document.getElementById('searchInput');
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');
const titleInput = document.getElementById('titleInput');
const documentInput = document.getElementById('documentInput');
const dateDisplay = document.getElementById('dateDisplay');
const statusDisplay = document.getElementById('statusDisplay');
const wordCountDisplay = document.getElementById('wordCountDisplay');
const newNoteBtn = document.getElementById('newNoteBtn');
const deleteBtn = document.getElementById('deleteBtn');
const sidebar = document.getElementById('sidebar');
const editorPane = document.getElementById('editorPane');
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Auth DOM Elements
const authScreen = document.getElementById('authScreen');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const authToggleText = document.getElementById('authToggleText');
const authError = document.getElementById('authError');

let allNotes = [];
let currentEditId = null;
let autoSaveTimeout = null;
let isLoginMode = true; // Tracks if we are logging in or signing up

// --- Security Helper ---
// Automatically attaches the VIP wristband to requests
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- Auth Logic ---
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // Logged in! Hide auth screen and load private notes
        authScreen.classList.add('hidden');
        fetchNotes();
    } else {
        // Not logged in! Show auth screen
        authScreen.classList.remove('hidden');
        authScreen.classList.add('flex');
    }
}

authToggleBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    authError.classList.add('hidden');
    if (isLoginMode) {
        authTitle.innerText = "Welcome back";
        authSubtitle.innerText = "Sign in to your private notes";
        authSubmitBtn.innerText = "Login";
        authToggleText.innerText = "Don't have an account?";
        authToggleBtn.innerText = "Sign up";
    } else {
        authTitle.innerText = "Create Account";
        authSubtitle.innerText = "Start securing your notes";
        authSubmitBtn.innerText = "Sign Up";
        authToggleText.innerText = "Already have an account?";
        authToggleBtn.innerText = "Login";
    }
};

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.classList.add('hidden');
    authSubmitBtn.innerText = "Please wait...";

    const endpoint = isLoginMode ? '/login' : '/register';
    const payload = {
        email: emailInput.value,
        password: passwordInput.value
    };

    try {
        const response = await fetch(`${AUTH_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Authentication failed");
        }

        if (isLoginMode) {
            // Save token and jump into the app!
            localStorage.setItem('token', data.token);
            emailInput.value = '';
            passwordInput.value = '';
            checkAuth();
        } else {
            // Signed up successfully! Swap to login mode automatically
            authToggleBtn.click();
            authError.classList.remove('hidden');
            authError.classList.remove('text-red-500');
            authError.classList.add('text-green-500');
            authError.innerText = "Account created! You can now log in.";
        }
    } catch (error) {
        authError.classList.remove('hidden', 'text-green-500');
        authError.classList.add('text-red-500');
        authError.innerText = error.message;
    } finally {
        authSubmitBtn.innerText = isLoginMode ? "Login" : "Sign Up";
    }
});

logoutBtn.onclick = () => {
    localStorage.removeItem('token');
    allNotes = [];
    renderSidebar();
    currentEditId = null;
    titleInput.value = '';
    documentInput.value = '';
    checkAuth();
};

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

// --- CRUD Operations (NOW SECURED) ---
async function fetchNotes(skipSidebarRender = false) {
    try {
        const response = await fetch(API_URL, { headers: getHeaders() });
        if (!response.ok) throw new Error("Unauthorized");
        
        allNotes = await response.json();
        allNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        if (!skipSidebarRender) renderSidebar();
    } catch (error) {
        console.error('Error fetching notes:', error);
        if (error.message === "Unauthorized") logoutBtn.click(); // Kick them out if token expired
    }
}

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

deleteBtn.onclick = async () => {
    if (!currentEditId) return;
    if (!confirm("Delete this note?")) return;

    try {
        await fetch(`${API_URL}/${currentEditId}`, { 
            method: 'DELETE',
            headers: getHeaders() // Security Wristband
        });
        
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

async function saveToDatabase() {
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
                headers: getHeaders(), // Security Wristband
                body: JSON.stringify(noteData)
            });
        } else {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: getHeaders(), // Security Wristband
                body: JSON.stringify(noteData)
            });
            const savedNote = await response.json();
            currentEditId = savedNote._id; 
            deleteBtn.classList.remove('hidden'); 
        }

        setStatus('All changes saved', true);
        setTimeout(() => setStatus('', false), 2000);
        fetchNotes(true); 

    } catch (error) {
        setStatus('Error saving!', true);
        console.error('Error saving note:', error);
    }
}

function handleInputChanges() {
    updateWordCount();
    if (currentEditId) {
        const localNote = allNotes.find(n => n._id === currentEditId);
        if (localNote) {
            localNote.Title = titleInput.value;
            localNote.Document = documentInput.value;
            renderSidebar();
        }
    }
    clearTimeout(autoSaveTimeout);
    setStatus('Typing...', true);
    autoSaveTimeout = setTimeout(() => saveToDatabase(), 1000);
}

titleInput.addEventListener('input', handleInputChanges);
documentInput.addEventListener('input', handleInputChanges);

noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearTimeout(autoSaveTimeout); 
    await saveToDatabase();
    if (window.innerWidth < 768) showSidebarMobile();
});

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredNotes = allNotes.filter(note => 
        (note.Title && note.Title.toLowerCase().includes(searchTerm)) || 
        (note.Document && note.Document.toLowerCase().includes(searchTerm))
    );
    renderSidebar(filteredNotes);
});

// --- Swipe Gestures ---
let touchStartX = 0; let touchEndX = 0; const SWIPE_THRESHOLD = 75; 
document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
document.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

function handleSwipe() {
    if (window.innerWidth >= 768) return;
    const swipeDistance = touchEndX - touchStartX;
    if (swipeDistance > SWIPE_THRESHOLD && !editorPane.classList.contains('hidden')) showSidebarMobile();
    if (swipeDistance < -SWIPE_THRESHOLD && !sidebar.classList.contains('hidden')) {
        if (currentEditId || titleInput.value !== '' || dateDisplay.innerText === 'NEW NOTE') showEditorMobile();
    }
}

// --- App Kickoff ---
// Instead of just fetching notes, we check auth first!
checkAuth();