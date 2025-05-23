// ui.js - Manages DOM interactions and utility functions
import { dbService } from './dbService.js';
import { Config } from './config.js';
import { setUpAI } from './ai.js';

// DOM elements for UI interactions
const titleInput = document.getElementById('title');
const slugInput = document.getElementById('slug');
const instructionsInput = document.getElementById('instructions');
const aiBtn = document.getElementById('ai-btn');
const contentInput = document.getElementById('content');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const errorMsg = document.getElementById('error-msg');
const articleList = document.getElementById('article-list');
const themeSwitch = document.getElementById('theme-switch');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const categoriesToggle = document.querySelector('.categories-toggle');
const categoriesList = document.getElementById('categories-list');
const editBtn = document.getElementById('edit-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');

// Generate slug from title
export function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') || 'article-' + Date.now();
}

// Validate slug format
function isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug);
}



// Process content to link hashtags
export function processContent(content) {
    const regex = /#(\w+)/g;
    return content.replace(regex, '<a href="#$1">#$1</a>');
}



// Update the article list on home page
export function updateArticleList(articles) {
    articleList.innerHTML = '';
    articles.forEach(article => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${article.slug}">${article.title}</a>`;
        articleList.appendChild(li);
    });
}

// Show error message to the user
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    setTimeout(() => errorMsg.style.display = 'none', 3000);
}

// Reset the edit form
function resetForm() {
    titleInput.value = '';
    slugInput.value = '';
    contentInput.value = '';
    saveBtn.textContent = '💾 Save';
    window.editingId = null; // Clear editing state
}

// Set up event listeners for UI interactions
export function setupUI() {
    const ai = setUpAI(Config.AI_TYPE, Config.AI_KEY);
    // Handle AI button click
    aiBtn.addEventListener('click', async () => {
        const instsructions = instructionsInput.value.trim();
        if (!instsructions) {
          instructionsInput.value = 'Please provide instructions.';
          return;
        }
        ai.instruction(instsructions);
        const content = contentInput.value.trim();
        const instructions = instructionsInput.value.trim();
        const prompt = instructions;
        if (!prompt) {
            showError('Please enter a prompt.');
            return;
        }

        try {
            //show loading spinner
            const spinIntv = setInterval(() => {
              contentInput.value += '...\n';
            }, 1000);

              
            const response = await ai.chat(prompt, content);
            clearInterval(spinIntv);
            contentInput.value = response;
        } catch (error) {
            showError('Error generating response: ' + error.message);
        }
    });
    // Auto-generate slug from title
    titleInput.addEventListener('input', () => {
        if (!slugInput.value || slugInput.value === generateSlug(titleInput.value)) {
            slugInput.value = generateSlug(titleInput.value);
        }
    });

    // Save or update article
    saveBtn.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const slug = slugInput.value.trim();
        const instructions = instructionsInput.value.trim();
        const content = contentInput.value.trim();

        if (!title) {
            showError('Title is required.');
            return;
        }

        if (!slug) {
            slugInput.value = generateSlug(title);
        }

        if (!isValidSlug(slug)) {
            showError('Slug must contain only lowercase letters, numbers, and hyphens.');
            return;
        }

        // Check if the slug already exists
        dbService.getArticle(slug, (error, existingArticle) => {
            if (error) {
                showError('Error checking slug: ' + error.message);
                return;
            }

            // If editing, allow the same slug for the current article
            if (existingArticle && (!window.editingId || existingArticle.id !== window.editingId)) {
                showError('Slug already in use. Please choose another.');
                return;
            }

            const article = { id: window.editingId || Date.now(), title, slug, content, instructions };

            const saveCallback = (saveError) => {
                if (saveError) {
                    showError('Error saving article: ' + saveError.message);
                } else {
                    resetForm();
                    window.location.hash = '#home';
                }
            };

            if (window.editingId) {
                dbService.updateArticle(article, saveCallback);
            } else {
                dbService.saveArticle(article, saveCallback);
            }
        });
    });

    // Cancel editing and return to home
    cancelBtn.addEventListener('click', () => {
        resetForm();
        window.location.hash = '#home';
    });

    // Toggle theme
    themeSwitch.addEventListener('change', () => {
        document.body.setAttribute('data-theme', themeSwitch.checked ? 'dark' : 'light');
    });

    // Adjust font size
    zoomOutBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).fontSize);
        root.style.fontSize = `${currentSize - 0.1}rem`;
    });
    zoomInBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).fontSize);
        root.style.fontSize = `${currentSize + 0.1}rem`;
    });

    // Toggle categories sidebar
    categoriesToggle.addEventListener('click', () => {
        categoriesToggle.classList.toggle('collapsed');
        categoriesList.classList.toggle('open');
    });

    // Navigate to edit page
    editBtn.addEventListener('click', () => {
        const slug = window.location.hash.split('#')[1];
        window.location.hash = `#edit/${slug}`;
    });

    // Navigate back to home
    backToHomeBtn.addEventListener('click', () => {
        window.location.hash = '#home';
    });
}
