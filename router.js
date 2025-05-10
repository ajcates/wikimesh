// router.js - Handles routing based on URL hash

import { dbService } from './dbService.js';
import { processContent, updateArticleList } from './ui.js';

// DOM elements for routing
const editContainer = document.getElementById('edit-container');
const viewContainer = document.getElementById('view-container');
const homeContainer = document.getElementById('home-container');
const articleTitle = document.getElementById('article-title');
const articleContent = document.getElementById('article-content');
const formTitle = document.getElementById('form-title');
const titleInput = document.getElementById('title');
const slugInput = document.getElementById('slug');
const contentInput = document.getElementById('content');
const saveBtn = document.getElementById('save-btn');

// Global variable to store slug for prefilling
let prefillSlug = null;

// Hide all content containers
function hideAllContainers() {
    editContainer.style.display = 'none';
    viewContainer.style.display = 'none';
    homeContainer.style.display = 'none';
}

// Handle routing based on URL hash
export function handleRoute() {
    const hash = window.location.hash || '#home';
    hideAllContainers();

    if (hash === '#new') {
        // Show new article form
        formTitle.textContent = 'New Article';
        saveBtn.textContent = '💾 Save';
        titleInput.value = '';
        slugInput.value = prefillSlug || '';
        contentInput.value = '';
        editContainer.style.display = 'block';
        prefillSlug = null; // Clear after use
        window.editingId = null; // Reset editing state
    } else if (hash.startsWith('#edit/')) {
        // Show edit form for existing article
        const slug = hash.split('#edit/')[1];
        dbService.getArticle(slug, (error, article) => {
            if (error || !article) {
                viewContainer.innerHTML = `
                    <h1>Article not found</h1>
                    <p>The article "${slug}" does not exist. Would you like to create it?</p>
                    <button onclick="createArticleFromSlug('${slug}')">Create Article</button>
                `;
                viewContainer.style.display = 'block';
            } else {
                window.editingId = article.id; // Set editingId for ui.js
                titleInput.value = article.title;
                slugInput.value = article.slug;
                contentInput.value = article.content;
                formTitle.textContent = 'Edit Article';
                saveBtn.textContent = '💾 Update';
                editContainer.style.display = 'block';
            }
        });
    } else if (hash === '#home') {
        // Show home page with article list
        dbService.getAllArticles((error, articles) => {
            if (error) {
                console.error('Error loading articles:', error);
            } else {
                updateArticleList(articles);
                homeContainer.style.display = 'block';
            }
        });
    } else {
        // Show article view or not found page
        const slug = hash.split('#')[1];
        dbService.getArticle(slug, (error, article) => {
            if (error || !article) {
                viewContainer.innerHTML = `
                    <h1>Article not found</h1>
                    <p>The article "${slug}" does not exist. Would you like to create it?</p>
                    <button onclick="createArticleFromSlug('${slug}')">Create Article</button>
                `;
                viewContainer.style.display = 'block';
            } else {
                articleTitle.textContent = article.title;
                articleContent.innerHTML = processContent(article.content);
                viewContainer.style.display = 'block';
            }
        });
    }
}

// Create article from slug
export function createArticleFromSlug(slug) {
    prefillSlug = slug;
    window.location.hash = '#new';
}
