// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && window.innerWidth <= 768) {
        navLinks.style.display = 'none';
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu after clicking a link
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        }
    });
});

// Notes functionality
const lessonNotes = document.querySelector('.lesson-notes');
const saveNotesBtn = document.querySelector('.save-notes');
const clearNotesBtn = document.querySelector('.clear-notes');
const notesList = document.querySelector('.notes-list');
const noteCategory = document.querySelector('.note-category');
const categoryList = document.querySelectorAll('.category-list li');
const searchInput = document.querySelector('.search-input');
const sortNotes = document.querySelector('.sort-notes');

// Save note
saveNotesBtn.addEventListener('click', () => {
    const noteText = lessonNotes.value.trim();
    if (noteText) {
        // Extract tags from the note text (format: #tag1 #tag2)
        const tags = noteText.match(/#[\w-]+/g) || [];
        const cleanTags = tags.map(tag => tag.slice(1)); // Remove # symbol
        
        const note = {
            id: Date.now().toString(),
            text: noteText,
            tags: cleanTags,
            category: noteCategory.value || 'other',
            date: new Date().toISOString(),
            images: [] // Array to store image data
        };
        
        // Get existing notes
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes.push(note);
        
        // Save to localStorage
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Clear textarea
        lessonNotes.value = '';
        
        // Update notes list
        displayNotes();
        
        // Show success message
        showNotification('Note saved successfully!');
    }
});

// Clear note
clearNotesBtn.addEventListener('click', () => {
    lessonNotes.value = '';
});

// Display notes
function displayNotes(filter = 'all', searchTerm = '') {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notesList.innerHTML = '';
    
    // Filter and search notes
    const filteredNotes = notes
        .filter(note => {
            const matchesCategory = filter === 'all' || note.category === filter;
            const matchesSearch = searchTerm === '' || 
                note.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
            const sortBy = sortNotes.value;
            if (sortBy === 'newest') {
                return new Date(b.date) - new Date(a.date);
            } else if (sortBy === 'oldest') {
                return new Date(a.date) - new Date(b.date);
            } else {
                return a.category.localeCompare(b.category);
            }
        });
    
    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<div class="no-notes">No notes found</div>';
        return;
    }
    
    filteredNotes.forEach(note => {
        const li = document.createElement('div');
        li.className = 'note-item';
        
        // Create note content
        const noteContent = document.createElement('div');
        noteContent.className = 'note-content';
        noteContent.innerHTML = formatNoteText(note.text);
        
        // Add images if they exist
        if (note.images && note.images.length > 0) {
            note.images.forEach(imageData => {
                const container = document.createElement('div');
                container.className = 'note-image-container';
                
                const img = document.createElement('img');
                img.src = imageData;
                img.className = 'note-image';
                img.alt = 'Screenshot';
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', () => removeImage(note.id, imageData));
                
                container.appendChild(img);
                container.appendChild(removeBtn);
                noteContent.appendChild(container);
            });
        }
        
        li.appendChild(noteContent);
        
        // Add tags if they exist
        if (note.tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'note-tags';
            tagsDiv.innerHTML = note.tags.map(tag => `<span class="note-tag">#${tag}</span>`).join('');
            li.appendChild(tagsDiv);
        }
        
        // Add footer
        const footer = document.createElement('div');
        footer.className = 'note-footer';
        footer.innerHTML = `
            <span class="note-category-badge">${note.category}</span>
            <span class="note-date">${formatDate(note.date)}</span>
        `;
        li.appendChild(footer);
        
        // Add actions
        const actions = document.createElement('div');
        actions.className = 'note-actions';
        actions.innerHTML = `
            <button class="note-action-btn edit-note" data-note-id="${note.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="note-action-btn delete-note" data-note-id="${note.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        li.appendChild(actions);
        
        notesList.appendChild(li);
    });

    // Add event listeners for note actions
    addNoteActionListeners();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // If less than 24 hours ago
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        if (hours === 0) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        }
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    
    // If less than 7 days ago
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    
    // Otherwise, show full date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format note text (handle markdown-like syntax)
function formatNoteText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n- (.*?)(?=\n|$)/g, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
}

// Add event listeners for note actions
function addNoteActionListeners() {
    // Edit note
    document.querySelectorAll('.edit-note').forEach(btn => {
        btn.addEventListener('click', () => {
            const noteId = btn.dataset.noteId;
            const notes = JSON.parse(localStorage.getItem('notes') || '[]');
            const note = notes.find(n => n.id === noteId);
            
            if (note) {
                // Set the note text in the textarea
                lessonNotes.value = note.text;
                noteCategory.value = note.category;
                
                // Scroll to notes input
                document.querySelector('.notes-input').scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Delete the old note
                const updatedNotes = notes.filter(n => n.id !== noteId);
                localStorage.setItem('notes', JSON.stringify(updatedNotes));
                
                // Update display
                displayNotes();
                
                showNotification('Note loaded for editing');
            }
        });
    });
    
    // Delete note
    document.querySelectorAll('.delete-note').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this note?')) {
                const noteId = btn.dataset.noteId;
                const notes = JSON.parse(localStorage.getItem('notes') || '[]');
                const updatedNotes = notes.filter(note => note.id !== noteId);
                localStorage.setItem('notes', JSON.stringify(updatedNotes));
                displayNotes();
                showNotification('Note deleted successfully!');
            }
        });
    });

    // Remove image
    document.querySelectorAll('.remove-image').forEach(btn => {
        btn.addEventListener('click', () => {
            const imageData = btn.closest('.note-item').querySelector('.note-image').src;
            const noteId = btn.closest('.note-item').querySelector('.edit-note').dataset.noteId;
            
            // Get the note from localStorage
            const notes = JSON.parse(localStorage.getItem('notes') || '[]');
            const note = notes.find(n => n.id === noteId);
            
            if (note) {
                // Remove the image from the note's images array
                note.images = note.images.filter(img => img !== imageData);
                
                // Update localStorage
                localStorage.setItem('notes', JSON.stringify(notes));
                
                // Update display
                displayNotes();
                
                showNotification('Image removed successfully!');
            }
        });
    });
}

// Category filter
categoryList.forEach(item => {
    item.addEventListener('click', () => {
        // Update active state
        categoryList.forEach(li => li.classList.remove('active'));
        item.classList.add('active');
        
        // Filter notes
        displayNotes(item.dataset.category, searchInput.value);
    });
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const activeCategory = document.querySelector('.category-list li.active').dataset.category;
    displayNotes(activeCategory, e.target.value);
});

// Sort functionality
sortNotes.addEventListener('change', () => {
    const activeCategory = document.querySelector('.category-list li.active').dataset.category;
    displayNotes(activeCategory, searchInput.value);
});

// Format buttons
document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        const start = lessonNotes.selectionStart;
        const end = lessonNotes.selectionEnd;
        const text = lessonNotes.value;
        let formattedText = '';
        
        switch(format) {
            case 'bold':
                formattedText = text.substring(0, start) + 
                    `**${text.substring(start, end)}**` + 
                    text.substring(end);
                break;
            case 'italic':
                formattedText = text.substring(0, start) + 
                    `*${text.substring(start, end)}*` + 
                    text.substring(end);
                break;
            case 'list':
                formattedText = text.substring(0, start) + 
                    `\n- ${text.substring(start, end)}` + 
                    text.substring(end);
                break;
            case 'code':
                formattedText = text.substring(0, start) + 
                    `\`${text.substring(start, end)}\`` + 
                    text.substring(end);
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    formattedText = text.substring(0, start) + 
                        `[${text.substring(start, end)}](${url})` + 
                        text.substring(end);
                }
                break;
            case 'image':
                document.getElementById('imageUpload').click();
                break;
        }
        
        if (formattedText) {
            lessonNotes.value = formattedText;
            lessonNotes.focus();
        }
    });
});

// Image upload functionality
const uploadImageBtn = document.querySelector('.upload-image');
const imageUpload = document.getElementById('imageUpload');

uploadImageBtn.addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Create an image element
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = 'note-image';
            img.alt = 'Screenshot';
            
            // Create a container for the image
            const container = document.createElement('div');
            container.className = 'note-image-container';
            
            // Create image actions container
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'image-actions';
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'image-action-btn delete-image';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this screenshot?')) {
                    container.remove();
                }
            });
            
            // Create save button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'image-action-btn save-image';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
            saveBtn.addEventListener('click', () => {
                // Get the current note
                const noteText = lessonNotes.value.trim();
                if (noteText) {
                    // Extract tags from the note text
                    const tags = noteText.match(/#[\w-]+/g) || [];
                    const cleanTags = tags.map(tag => tag.slice(1));
                    
                    const note = {
                        id: Date.now().toString(),
                        text: noteText,
                        tags: cleanTags,
                        category: noteCategory.value || 'other',
                        date: new Date().toISOString(),
                        images: [event.target.result] // Save the image data
                    };
                    
                    // Get existing notes
                    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
                    notes.push(note);
                    
                    // Save to localStorage
                    localStorage.setItem('notes', JSON.stringify(notes));
                    
                    // Clear textarea
                    lessonNotes.value = '';
                    
                    // Update notes list
                    displayNotes();
                    
                    // Show success message
                    showNotification('Screenshot saved successfully!');
                } else {
                    showNotification('Please add some text to your note before saving the screenshot', 'error');
                }
            });
            
            // Add buttons to actions container
            actionsContainer.appendChild(saveBtn);
            actionsContainer.appendChild(deleteBtn);
            
            // Add image and actions to container
            container.appendChild(img);
            container.appendChild(actionsContainer);
            
            // Add the container to the notes list
            const notesList = document.querySelector('.notes-list');
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.appendChild(container);
            notesList.appendChild(noteItem);
            
            // Clear the file input
            imageUpload.value = '';
        };
        reader.readAsDataURL(file);
    }
});

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load notes when page loads
document.addEventListener('DOMContentLoaded', () => {
    displayNotes();
});

// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const themeText = themeToggle.querySelector('span');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeUI(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
});

function updateThemeUI(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark Mode';
    }
}

// Project Management
const projectGrid = document.querySelector('.project-grid');
const addProjectBtn = document.getElementById('addProjectBtn');
const projectModal = document.getElementById('projectModal');
const projectForm = document.getElementById('projectForm');
let currentProjectId = null;

// Load projects from localStorage
function loadProjects() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    projectGrid.innerHTML = '';
    
    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectGrid.appendChild(projectCard);
    });
}

// Create project card
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = project.id;
    
    card.innerHTML = `
        <div class="project-header">
            <h3>${project.title}</h3>
            <div class="project-actions">
                <button class="edit-project" title="Edit Project">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-project" title="Delete Project">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="project-content">
            <p class="project-description">${project.description}</p>
            <div class="project-links">
                ${project.githubLink ? `
                    <a href="${project.githubLink}" class="btn" target="_blank">
                        <i class="fab fa-github"></i> View Code
                    </a>
                ` : ''}
                ${project.demoLink ? `
                    <a href="${project.demoLink}" class="btn" target="_blank">
                        <i class="fas fa-external-link-alt"></i> Live Demo
                    </a>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Remove image function
function removeImage(noteId, imageData) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
        // Remove the image from the note's images array
        notes[noteIndex].images = notes[noteIndex].images.filter(img => img !== imageData);
        
        // Update localStorage
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Update display
        displayNotes();
        
        showNotification('Image removed successfully!');
    }
}

// Progress tracking system
const weekItems = document.querySelectorAll('.week-item');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');

// Load progress from localStorage
function loadWeeklyProgress() {
    try {
        const progress = JSON.parse(localStorage.getItem('sessionProgress')) || {};
        let totalCompleted = 0;
        const weeklyProgress = {};

        // Initialize weekly progress
        for (let i = 1; i <= 9; i++) {
            weeklyProgress[`week${i}`] = 0;
        }

        // Count completed sessions
        weekItems.forEach(item => {
            const sessionId = item.dataset.week;
            const weekNumber = sessionId.split('-')[0]; // e.g., "week1-1" -> "week1"
            
            if (progress[sessionId]) {
                item.classList.add('completed');
                item.querySelector('.week-status').textContent = 'Completed';
                totalCompleted++;
                weeklyProgress[weekNumber]++;
            } else {
                item.classList.remove('completed');
                item.querySelector('.week-status').textContent = 'Not Started';
            }
        });

        updateProgress(totalCompleted, weeklyProgress);
        console.log('Progress loaded:', progress);
    } catch (error) {
        console.error('Error loading progress:', error);
        localStorage.setItem('sessionProgress', JSON.stringify({}));
    }
}

// Toggle session completion
function toggleWeek(sessionId) {
    try {
        const progress = JSON.parse(localStorage.getItem('sessionProgress')) || {};
        const sessionItem = document.querySelector(`[data-week="${sessionId}"]`);
        const weekNumber = sessionId.split('-')[0];
        
        if (progress[sessionId]) {
            delete progress[sessionId];
            sessionItem.classList.remove('completed');
            sessionItem.querySelector('.week-status').textContent = 'Not Started';
        } else {
            progress[sessionId] = {
                completed: true,
                date: new Date().toISOString()
            };
            sessionItem.classList.add('completed');
            sessionItem.querySelector('.week-status').textContent = 'Completed';
        }

        // Save to localStorage
        localStorage.setItem('sessionProgress', JSON.stringify(progress));
        
        // Calculate progress
        const totalCompleted = Object.keys(progress).length;
        const weeklyProgress = {};
        
        // Count completed sessions per week
        for (let i = 1; i <= 9; i++) {
            weeklyProgress[`week${i}`] = 0;
        }
        
        Object.keys(progress).forEach(session => {
            const week = session.split('-')[0];
            weeklyProgress[week]++;
        });

        updateProgress(totalCompleted, weeklyProgress);
        
        // Show save confirmation
        showNotification('Progress saved successfully!', 'success');
        
        console.log('Progress updated:', progress);
    } catch (error) {
        console.error('Error updating progress:', error);
        showNotification('Error saving progress. Please try again.', 'error');
    }
}

// Update progress display
function updateProgress(totalCompleted, weeklyProgress) {
    const totalSessions = 18;
    const totalPercentage = (totalCompleted / totalSessions * 100).toFixed(2);
    
    // Update total progress bar
    progressFill.style.width = `${totalPercentage}%`;
    
    // Create progress text with total and weekly progress
    let progressHTML = `
        <div class="total-progress">
            <strong>Total Progress:</strong> ${totalPercentage}% (${totalCompleted}/${totalSessions} sessions)
        </div>
        <div class="weekly-progress">
            <strong>Weekly Progress:</strong>
    `;
    
    // Add weekly progress
    Object.entries(weeklyProgress).forEach(([week, completed]) => {
        const weekNumber = week.replace('week', '');
        const weekPercentage = (completed / 2 * 100).toFixed(0);
        progressHTML += `
            <div class="week-progress">
                Week ${weekNumber}: ${weekPercentage}% (${completed}/2 sessions)
            </div>
        `;
    });
    
    progressHTML += '</div>';
    progressText.innerHTML = progressHTML;
}

// Add event listeners for session toggles
weekItems.forEach(item => {
    const toggleBtn = item.querySelector('.toggle-week');
    toggleBtn.addEventListener('click', () => {
        toggleWeek(item.dataset.week);
    });
});

// Initialize progress tracking when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadWeeklyProgress();
});