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
        const note = {
            id: Date.now().toString(),
            text: noteText,
            category: noteCategory.value,
            date: new Date().toISOString()
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
                note.text.toLowerCase().includes(searchTerm.toLowerCase());
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
        li.innerHTML = `
            <div class="note-content">${formatNoteText(note.text)}</div>
            <div class="note-footer">
                <span class="note-category-badge">${note.category}</span>
                <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
            </div>
        `;
        notesList.appendChild(li);
    });
}

// Format note text (handle markdown-like syntax)
function formatNoteText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n- (.*?)(?=\n|$)/g, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
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
        }
        
        lessonNotes.value = formattedText;
        lessonNotes.focus();
    });
});

// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load notes when page loads
document.addEventListener('DOMContentLoaded', () => {
    displayNotes();
    loadVideos();
    loadProjects();
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

// Video functionality
const videoGrid = document.querySelector('.video-grid');

// YouTube API configuration
const CHANNEL_ID = 'UC_AppoftheYearAcademy';
const VIDEO_IDS = [
    // Add your video IDs here
    'dQw4w9WgXcQ',  // Example video ID
    'jNQXAC9IVRw',  // Example video ID
];

// Video progress tracking
let watchedVideos = JSON.parse(localStorage.getItem('watchedVideos') || '[]');
let completedWeeks = JSON.parse(localStorage.getItem('completedWeeks') || '[]');

// Function to check if API key is set
function checkApiKey() {
    if (!API_KEY) {
        throw new Error('YouTube API key is not set. Please add your API key to the script.js file.');
    }
}

// Function to create week header
function createWeekHeader(weekNumber) {
    const weekHeader = document.createElement('div');
    weekHeader.className = 'week-header';
    weekHeader.innerHTML = `
        <h2>Week ${weekNumber}</h2>
        <button class="btn complete-week-btn" data-week="${weekNumber}" ${completedWeeks.includes(weekNumber) ? 'disabled' : ''}>
            ${completedWeeks.includes(weekNumber) ? 'Week Completed ✓' : 'Complete Week'}
        </button>
    `;
    
    // Add event listener for complete week button
    const completeBtn = weekHeader.querySelector('.complete-week-btn');
    completeBtn.addEventListener('click', () => {
        if (!completedWeeks.includes(weekNumber)) {
            completedWeeks.push(weekNumber);
            localStorage.setItem('completedWeeks', JSON.stringify(completedWeeks));
            completeBtn.textContent = 'Week Completed ✓';
            completeBtn.disabled = true;
            showNotification(`Week ${weekNumber} completed! 🎉`);
            updateProgress();
        }
    });
    
    return weekHeader;
}

// Function to update progress
function updateProgress() {
    const totalWeeks = 9; // Total number of weeks in the course
    const weeksCompleted = completedWeeks.length;
    const progressPercentage = (weeksCompleted / totalWeeks) * 100;
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.getElementById('progress-percentage');
    
    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `${Math.round(progressPercentage)}%`;
    
    // Update weeks completed
    document.getElementById('completed-weeks').textContent = weeksCompleted;
    document.getElementById('remaining-weeks').textContent = totalWeeks - weeksCompleted;
}

// Function to create video card
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.week = video.week; // Add week number to the card
    
    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'video-thumbnail';
    
    // Create and configure thumbnail image
    const thumbnail = document.createElement('img');
    thumbnail.src = video.thumbnail;
    thumbnail.alt = video.title;
    
    // Add error handling for thumbnail
    thumbnail.onerror = function() {
        this.src = 'https://via.placeholder.com/1280x720/1e293b/ffffff?text=Video+Thumbnail';
        this.alt = 'Thumbnail not available';
    };
    
    // Create duration overlay
    const duration = document.createElement('div');
    duration.className = 'video-duration';
    duration.textContent = formatDuration(video.duration);
    
    // Assemble thumbnail container
    thumbnailContainer.appendChild(thumbnail);
    thumbnailContainer.appendChild(duration);
    
    // Create video info
    const info = document.createElement('div');
    info.className = 'video-info';
    info.innerHTML = `
        <div class="video-header">
            <h3>${video.title}</h3>
            <label class="video-checkbox">
                <input type="checkbox" class="video-watched" data-video-id="${video.videoId}" ${watchedVideos.includes(video.videoId) ? 'checked' : ''}>
                <span>Watched</span>
            </label>
        </div>
        <p class="video-date">${new Date(video.publishedAt).toLocaleDateString()}</p>
        <p class="video-description">${video.description}</p>
        <a href="${video.url}" target="_blank" class="btn">
            <i class="fab fa-youtube"></i> Watch on YouTube
        </a>
    `;
    
    // Add event listener for checkbox
    const checkbox = info.querySelector('.video-watched');
    checkbox.addEventListener('change', (e) => {
        const videoId = e.target.dataset.videoId;
        const weekNumber = card.dataset.week;
        
        if (e.target.checked) {
            if (!watchedVideos.includes(videoId)) {
                watchedVideos.push(videoId);
            }
        } else {
            watchedVideos = watchedVideos.filter(id => id !== videoId);
            // Remove week from completed weeks if unchecking a video
            completedWeeks = completedWeeks.filter(week => week !== weekNumber);
        }
        
        // Check if week is complete
        if (isWeekComplete(weekNumber)) {
            if (!completedWeeks.includes(weekNumber)) {
                completedWeeks.push(weekNumber);
                showNotification(`Week ${weekNumber} completed! 🎉`);
            }
        } else {
            completedWeeks = completedWeeks.filter(week => week !== weekNumber);
        }
        
        // Save to localStorage
        localStorage.setItem('watchedVideos', JSON.stringify(watchedVideos));
        localStorage.setItem('completedWeeks', JSON.stringify(completedWeeks));
        
        // Update progress
        updateProgress();
    });
    
    // Assemble card
    card.appendChild(thumbnailContainer);
    card.appendChild(info);
    
    return card;
}

// Function to fetch video data using oEmbed
async function fetchVideoData(videoId) {
    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
            title: data.title,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            publishedAt: new Date().toISOString(), // oEmbed doesn't provide publish date
            url: `https://www.youtube.com/watch?v=${videoId}`,
            videoId: videoId,
            week: 1, // You'll need to manually set the week for each video
            description: data.author_name // Using author name as description since oEmbed doesn't provide description
        };
    } catch (error) {
        console.error(`Error fetching video ${videoId}:`, error);
        return null;
    }
}

// Function to load videos
async function loadVideos() {
    try {
        // Show loading state
        videoGrid.innerHTML = '<div class="loading">Loading videos...</div>';
        
        // Fetch videos using oEmbed
        const videoPromises = VIDEO_IDS.map(videoId => fetchVideoData(videoId));
        const videos = (await Promise.all(videoPromises)).filter(video => video !== null);
        
        // Clear loading state
        videoGrid.innerHTML = '';
        
        // Group videos by week
        const videosByWeek = {};
        videos.forEach(video => {
            if (!videosByWeek[video.week]) {
                videosByWeek[video.week] = [];
            }
            videosByWeek[video.week].push(video);
        });
        
        // Sort weeks
        const sortedWeeks = Object.keys(videosByWeek).sort((a, b) => a - b);
        
        // Create week sections
        sortedWeeks.forEach(weekNumber => {
            // Add week header
            const weekHeader = createWeekHeader(weekNumber);
            videoGrid.appendChild(weekHeader);
            
            // Create week container
            const weekContainer = document.createElement('div');
            weekContainer.className = 'week-container';
            weekContainer.dataset.week = weekNumber;
            
            // Add videos for this week
            videosByWeek[weekNumber].forEach(video => {
                const videoCard = createVideoCard(video);
                weekContainer.appendChild(videoCard);
            });
            
            videoGrid.appendChild(weekContainer);
        });
        
        // Update progress after loading videos
        updateProgress();
        
        // Show success notification
        showNotification('Videos loaded successfully!');
    } catch (error) {
        console.error('Error loading videos:', error);
        videoGrid.innerHTML = `
            <div class="error">
                <p>${error.message}</p>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
        showNotification('Error loading videos. Please check the console for details.', 'error');
    }
}

// Load videos when page loads
document.addEventListener('DOMContentLoaded', () => {
    displayNotes();
    loadVideos();
});

// Function to format duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Add loading and error styles
const style = document.createElement('style');
style.textContent = `
    .loading, .error {
        text-align: center;
        padding: 2rem;
        color: var(--text-color);
        font-size: 1.1rem;
    }
    
    .error {
        color: var(--error);
    }
`;
document.head.appendChild(style);

// Add refresh button to video actions
const videoActions = document.querySelector('.video-actions');
const refreshButton = document.createElement('button');
refreshButton.className = 'btn btn-secondary refresh-btn';
refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Videos';
refreshButton.addEventListener('click', () => {
    refreshButton.classList.add('rotating');
    loadVideos().finally(() => {
        refreshButton.classList.remove('rotating');
    });
});
videoActions.insertBefore(refreshButton, videoActions.firstChild);

// Auto-refresh every 5 minutes
setInterval(() => {
    loadVideos();
}, 5 * 60 * 1000);

// Add refresh button styles
const refreshStyles = document.createElement('style');
refreshStyles.textContent = `
    .refresh-btn {
        margin-right: 1rem;
    }
    
    .refresh-btn i {
        margin-right: 0.5rem;
    }
    
    .rotating i {
        animation: rotate 1s linear infinite;
    }
    
    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(refreshStyles);

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
    
    // Add event listeners
    card.querySelector('.edit-project').addEventListener('click', () => editProject(project));
    card.querySelector('.delete-project').addEventListener('click', () => deleteProject(project.id));
    
    return card;
}

// Show modal
function showModal() {
    projectModal.classList.add('active');
}

// Hide modal
function hideModal() {
    projectModal.classList.remove('active');
    projectForm.reset();
    currentProjectId = null;
}

// Add new project
function addProject() {
    currentProjectId = null;
    projectForm.reset();
    showModal();
}

// Edit project
function editProject(project) {
    currentProjectId = project.id;
    document.getElementById('projectTitle').value = project.title;
    document.getElementById('projectDescription').value = project.description;
    document.getElementById('githubLink').value = project.githubLink || '';
    document.getElementById('demoLink').value = project.demoLink || '';
    showModal();
}

// Delete project
function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const updatedProjects = projects.filter(project => project.id !== id);
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
        loadProjects();
        showNotification('Project deleted successfully!');
    }
}

// Save project
function saveProject(e) {
    e.preventDefault();
    
    const project = {
        id: currentProjectId || Date.now().toString(),
        title: document.getElementById('projectTitle').value,
        description: document.getElementById('projectDescription').value,
        githubLink: document.getElementById('githubLink').value,
        demoLink: document.getElementById('demoLink').value
    };
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    if (currentProjectId) {
        // Update existing project
        const index = projects.findIndex(p => p.id === currentProjectId);
        projects[index] = project;
    } else {
        // Add new project
        projects.push(project);
    }
    
    localStorage.setItem('projects', JSON.stringify(projects));
    loadProjects();
    hideModal();
    showNotification(`Project ${currentProjectId ? 'updated' : 'added'} successfully!`);
}

// Event Listeners
addProjectBtn.addEventListener('click', addProject);
projectForm.addEventListener('submit', saveProject);
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', hideModal);
});

// Close modal when clicking outside
projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) {
        hideModal();
    }
});

// Load projects when page loads
document.addEventListener('DOMContentLoaded', () => {
    displayNotes();
    loadVideos();
    loadProjects();
}); 