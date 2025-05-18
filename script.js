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
const trackablePoints = document.querySelectorAll('.trackable-point');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');
const totalProgressCircle = document.querySelector('.total-progress-circle');
const weeklyProgressCircle = document.querySelector('.weekly-progress-circle');
const currentWeekNumberSpan = document.querySelector('.current-week-number');
const weeklyProgressSummaryDiv = document.querySelector('.weekly-progress-summary');

// Create and append current week display
const currentWeekDisplay = document.createElement('div');
currentWeekDisplay.className = 'current-week-display';
currentWeekDisplay.innerHTML = '<strong>Current Week:</strong> Week 1';

// Append currentWeekDisplay to the progress section
document.addEventListener('DOMContentLoaded', () => {
    const progressSection = document.getElementById('progress');
    if(progressSection) {
        const progressOverview = progressSection.querySelector('.progress-overview');
        if(progressOverview) {
            progressSection.insertBefore(currentWeekDisplay, progressOverview);
        }
    }
});

// Load progress from localStorage
function loadProgress() {
    try {
        const completedPoints = JSON.parse(localStorage.getItem('learningProgress')) || {};
        let totalCompleted = 0;
        const weeklyCompletedCounts = {};
        const totalPointsPerWeek = {};
        let totalPossiblePoints = 0;

        // Initialize weekly counts and total points per week
        const trackablePoints = document.querySelectorAll('.trackable-point'); // Select inside loadProgress
        trackablePoints.forEach(point => {
            const sessionId = point.dataset.sessionId;
            const weekNumber = sessionId.split('-')[0];
            if (!weeklyCompletedCounts[weekNumber]) {
                weeklyCompletedCounts[weekNumber] = 0;
                totalPointsPerWeek[weekNumber] = 0;
            }
            totalPointsPerWeek[weekNumber]++;
            totalPossiblePoints++;
        });

        // Count completed points and update UI
        trackablePoints.forEach(point => {
            const sessionId = point.dataset.sessionId;
            const pointId = point.dataset.pointId;
            const pointKey = `${sessionId}-${pointId}`;
            const weekNumber = sessionId.split('-')[0];

            if (completedPoints[pointKey]) {
                point.classList.add('completed');
                totalCompleted++;
                weeklyCompletedCounts[weekNumber]++;
            } else {
                point.classList.remove('completed');
            }
        });

        updateProgress(totalCompleted, weeklyCompletedCounts, totalPointsPerWeek, totalPossiblePoints);
        console.log('Progress loaded:', completedPoints);
    } catch (error) {
        console.error('Error loading progress:', error);
        localStorage.setItem('learningProgress', JSON.stringify({})); // Reset if error
    }
}

// Add event listeners for trackable points
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Setting up checkbox listeners.');
    const checkboxes = document.querySelectorAll('.completion-checkbox');
    console.log(`Found ${checkboxes.length} completion checkboxes.`);

    checkboxes.forEach(checkbox => {
        checkbox.style.cursor = 'pointer'; // Indicate clickable
        checkbox.addEventListener('click', (event) => {
            console.log('Checkbox clicked!');
            const pointElement = checkbox.closest('.trackable-point'); // Find the parent list item
            if (pointElement) {
                try {
                    togglePointCompletion(pointElement); // Toggle completion on the parent li
                    showNotification('Progress updated successfully!', 'success');
                } catch (error) {
                    console.error('Error toggling point completion:', error);
                    showNotification('An error occurred while updating point status.', 'error');
                }
            }
            event.stopPropagation(); // Prevent click from bubbling up to parent li
        });
    });

    // Load initial progress
    loadProgress();
});

// Toggle point completion
function togglePointCompletion(pointElement) {
    try {
        const completedPoints = JSON.parse(localStorage.getItem('learningProgress')) || {};
        const sessionId = pointElement.dataset.sessionId;
        const pointId = pointElement.dataset.pointId;
        const pointKey = `${sessionId}-${pointId}`;

        if (completedPoints[pointKey]) {
            delete completedPoints[pointKey];
            pointElement.classList.remove('completed');
        } else {
            completedPoints[pointKey] = {
                completed: true,
                date: new Date().toISOString()
            };
            pointElement.classList.add('completed');
        }

        // Save to localStorage
        localStorage.setItem('learningProgress', JSON.stringify(completedPoints));

        // Recalculate and update progress
        let totalCompleted = 0;
        const weeklyCompletedCounts = {};
        const totalPointsPerWeek = {};
        let totalPossiblePoints = 0;

        // Initialize counts
        const trackablePoints = document.querySelectorAll('.trackable-point');
        trackablePoints.forEach(point => {
            const sessionId = point.dataset.sessionId;
            const weekNumber = sessionId.split('-')[0];
            if (!weeklyCompletedCounts[weekNumber]) {
                weeklyCompletedCounts[weekNumber] = 0;
                totalPointsPerWeek[weekNumber] = 0;
            }
            totalPointsPerWeek[weekNumber]++;
            totalPossiblePoints++;
        });

        // Count completed after toggle
        Object.keys(completedPoints).forEach(key => {
            const [sessionId, pointId] = key.split('-');
            const weekNumber = sessionId.split('-')[0];
            totalCompleted++;
            weeklyCompletedCounts[weekNumber]++;
        });

        updateProgress(totalCompleted, weeklyCompletedCounts, totalPointsPerWeek, totalPossiblePoints);
    } catch (error) {
        console.error('Error updating progress:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

// Update progress display (both circular and text summary)
function updateProgress(totalCompleted, weeklyCompletedCounts, totalPointsPerWeek, totalPossiblePoints) {
    console.log('Updating progress...', {totalCompleted, weeklyCompletedCounts, totalPointsPerWeek, totalPossiblePoints});
    try {
        // Update Total Progress Circle
        const totalPercentage = totalPossiblePoints > 0 ? (totalCompleted / totalPossiblePoints) * 100 : 0;
        totalProgressCircle.style.background = `conic-gradient(var(--accent-color) ${totalPercentage}%, var(--border-color) 0%)`;
        totalProgressCircle.querySelector('.progress-circle-inner').textContent = `${Math.round(totalPercentage)}%`;

        // Find and display the current week
        let currentWeekNumber = 1;
        for (let i = 1; i <= 9; i++) { // Iterate through weeks
             // Check if the week has any points and if not all points in the week are completed
             const weekTotalPoints = totalPointsPerWeek[`week${i}`] || 0;
             const weekCompletedPoints = weeklyCompletedCounts[`week${i}`] || 0;
             if (weekTotalPoints > 0 && weekCompletedPoints < weekTotalPoints) {
                 currentWeekNumber = i;
                 break; // Found the first week with incomplete points
             }
             if (i === 9 && weekCompletedPoints === weekTotalPoints && weekTotalPoints > 0) {
                 // If all points in the last week are completed, stay on the last week
                 currentWeekNumber = i;
             }
        }

        // Update current week display
        currentWeekNumberSpan.textContent = currentWeekNumber;
        currentWeekDisplay.innerHTML = `<strong>Current Week:</strong> Week ${currentWeekNumber}`;

        // Update Weekly Progress Circle for the current week
        const currentWeekCompleted = weeklyCompletedCounts[`week${currentWeekNumber}`] || 0;
        const currentWeekTotalPoints = totalPointsPerWeek[`week${currentWeekNumber}`] || 0;
        const weeklyPercentage = currentWeekTotalPoints > 0 ? (currentWeekCompleted / currentWeekTotalPoints) * 100 : 0;
        weeklyProgressCircle.style.background = `conic-gradient(var(--accent-color) ${weeklyPercentage}%, var(--border-color) 0%)`;
        weeklyProgressCircle.querySelector('.progress-circle-inner').textContent = `${Math.round(weeklyPercentage)}%`;

        // Update Weekly Progress Summary Text
        let weeklySummaryHTML = '<strong>Weekly Progress:</strong>';
        for (let i = 1; i <= 9; i++) {
            const weekCompleted = weeklyCompletedCounts[`week${i}`] || 0;
            const weekTotal = totalPointsPerWeek[`week${i}`] || 0;
            const weekPercent = weekTotal > 0 ? (weekCompleted / weekTotal * 100).toFixed(0) : 0;
            weeklySummaryHTML += `
                <div class="week-progress">
                    Week ${i}: ${weekPercent}% (${weekCompleted}/${weekTotal} points)
                </div>
            `;
        }
        weeklyProgressSummaryDiv.innerHTML = weeklySummaryHTML;

        // Update the old progress bar text as well, for consistency or if still used
        const totalWeeks = 9; // Assuming 9 weeks total
        const completedWeeks = totalCompleted / (totalPossiblePoints / totalWeeks);
        // Corrected this line: use totalCompleted instead of completedCompleted
         progressText.textContent = `${Math.round(totalPercentage)}% Complete (${totalCompleted}/${totalPossiblePoints} points, ${completedWeeks.toFixed(1)}/9 weeks)`;

    } catch (error) {
        console.error('Error in updateProgress:', error);
        showNotification('An error occurred while displaying progress.', 'error');
    }
}