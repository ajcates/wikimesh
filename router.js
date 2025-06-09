// router.js - Handles client-side routing based on URL hash changes.
// This file is responsible for determining which view (e.g., home, view article, edit article)
// to display based on the fragment identifier in the URL (e.g., #home, #my-article-slug, #edit/my-article-slug).

// Imported modules:
// - dbService: Used for all interactions with the IndexedDB database (fetching, saving articles).
// - processContent: A UI utility function from ui.js, likely used to format article content for display (e.g., Markdown to HTML).
// - updateArticleList: A UI utility function from ui.js, used to refresh the list of articles on the home page.
import { dbService } from './dbService.js';
import { processContent, updateArticleList } from './ui.js';

// DOM elements fetched at the beginning for efficient access and manipulation:
// - editContainer: The container div for the new/edit article form.
// - viewContainer: The container div for displaying a single article's content.
// - homeContainer: The container div for the home page, usually displaying a list of articles.
// - articleTitle: The element (e.g., <h1>) where the title of a viewed article is displayed.
// - articleContent: The element (e.g., <div>) where the processed content of a viewed article is displayed.
// - formTitle: The element (e.g., <h2>) that displays the title of the new/edit article form (e.g., "New Article" or "Edit Article").
// - titleInput: The <input type="text"> field for the article's title in the form.
// - slugInput: The <input type="text"> field for the article's slug in the form.
// - contentInput: The <textarea> for the article's main content in the form.
// - saveBtn: The <button> used to save or update an article from the form.
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
const instructionsInput = document.getElementById('instructions'); // For article specific instructions

// Settings page elements
const settingsContainer = document.getElementById('settings-container');
const apiKeyInput = document.getElementById('apiKey');
const defaultInstructionsInput = document.getElementById('defaultInstructions');

// Global variable `prefillSlug`:
// This variable is used to carry a slug from a "not found" page to the new article form.
// If a user tries to access an article by a slug that doesn't exist, they are offered to create it.
// If they choose to create it, this variable holds the initially requested slug to pre-fill the slug input field in the new article form.
let prefillSlug = null;

/**
 * @function hideAllContainers
 * @description A utility function to hide all main content containers.
 * This is typically called at the beginning of a route change to ensure a clean slate
 * before displaying the container relevant to the new route.
 */
function hideAllContainers() {
    editContainer.style.display = 'none';
    viewContainer.style.display = 'none';
    homeContainer.style.display = 'none';
    settingsContainer.style.display = 'none';
}

/**
 * @function handleRoute
 * @description The main routing function. It determines the current route based on `window.location.hash`
 * and updates the UI accordingly. It manages which container is visible and fetches data
 * if necessary (e.g., article content, list of all articles).
 *
 * `window.editingId` is a global variable (implicitly declared on the window object) used to store the ID
 * of the article currently being edited. This helps `ui.js` (or other parts of the application)
 * know whether a save operation should be an update to an existing article or a creation of a new one.
 */
export function handleRoute() {
    const hash = window.location.hash || '#home'; // Default to #home if no hash is present.
    hideAllContainers(); // Ensure only the relevant container for the current route is shown.

    if (hash === '#new') {
        // Route: #new - Display the form for creating a new article.
        formTitle.textContent = 'New Article'; // Set form title.
        saveBtn.textContent = '💾 Save'; // Set button text for creation.
        // Clear form fields.
        titleInput.value = '';
        slugInput.value = prefillSlug || ''; // Use prefillSlug if available (e.g., from a "not found" prompt).
        contentInput.value = '';

        // Populate instructions field with default instructions from settings
        if (instructionsInput) { // Ensure the element is available
            dbService.getSettings((error, settings) => {
                if (error) {
                    console.error('Error fetching settings for default instructions:', error);
                    instructionsInput.value = ''; // Fallback to empty on error
                } else {
                    instructionsInput.value = (settings && settings.defaultInstructions) ? settings.defaultInstructions : '';
                }
            });
        }

        editContainer.style.display = 'block'; // Show the edit/new form container.
        prefillSlug = null; // Clear prefillSlug after it has been used.
        window.editingId = null; // Reset editingId, indicating a new article, not an edit.
    } else if (hash.startsWith('#edit/')) {
        // Route: #edit/:slug - Display the form for editing an existing article.
        const slug = hash.split('#edit/')[1]; // Extract the slug from the hash.
        dbService.getArticle(slug, (error, article) => { // Fetch the article by its slug.
            if (error || !article) {
                // Article not found: Display a "not found" message with an option to create.
                viewContainer.innerHTML = `
                    <h1>Article not found</h1>
                    <p>The article "${slug}" does not exist. Would you like to create it?</p>
                    <button onclick="createArticleFromSlug('${slug}')">Create Article</button>
                `;
                viewContainer.style.display = 'block';
            } else {
                // Article found: Populate the form with the article's data.
                window.editingId = article.id; // Set editingId to the ID of the article being edited.
                titleInput.value = article.title;
                slugInput.value = article.slug;
                contentInput.value = article.content;
                // Populate instructions field with the article's specific instructions
                if (instructionsInput) {
                    instructionsInput.value = article.instructions || '';
                }
                formTitle.textContent = 'Edit Article'; // Set form title for editing.
                saveBtn.textContent = '💾 Update'; // Set button text for updating.
                editContainer.style.display = 'block'; // Show the edit/new form container.
            }
        });
    } else if (hash === '#home') {
        // Route: #home - Display the home page with a list of all articles.
        dbService.getAllArticles((error, articles) => { // Fetch all articles.
            if (error) {
                console.error('Error loading articles:', error);
                // Optionally, display an error message in the homeContainer.
            } else {
                updateArticleList(articles); // Update the UI with the list of articles.
                homeContainer.style.display = 'block'; // Show the home container.
            }
        });
    } else if (hash === '#settings') {
        // Route: #settings - Display the settings page.
        // hideAllContainers(); // Already called at the start of handleRoute
        dbService.getSettings((error, settings) => {
            if (error) {
                console.error('Error fetching settings:', error);
                // Optionally, display an error to the user in settingsContainer or via a general message area
                settingsContainer.innerHTML = '<p>Error loading settings. Please try again later.</p>';
            } else {
                apiKeyInput.value = settings.apiKey || '';
                defaultInstructionsInput.value = settings.defaultInstructions || '';
            }
            settingsContainer.style.display = 'block'; // Show the settings container.
        });
    } else {
        // Default route: #:slug - Display a single article by its slug.
        const slug = hash.split('#')[1]; // Extract the slug from the hash.
        dbService.getArticle(slug, (error, article) => { // Fetch the article by its slug.
            if (error || !article) {
                // Article not found: Display a "not found" message with an option to create.
                // This allows users to create an article if they navigate to a non-existent slug.
                viewContainer.innerHTML = `
                    <h1>Article not found</h1>
                    <p>The article "${slug}" does not exist. Would you like to create it?</p>
                    <button onclick="createArticleFromSlug('${slug}')">Create Article</button>
                `;
                viewContainer.style.display = 'block';
            } else {
                // Article found: Display the article's title and content.
                articleTitle.textContent = article.title;
                articleContent.innerHTML = processContent(article.content); // Process content (e.g., Markdown to HTML).
                viewContainer.style.display = 'block'; // Show the view article container.
            }
        });
    }
}

/**
 * @function createArticleFromSlug
 * @description This function is called when a user clicks the "Create Article" button
 * on a "not found" page. It sets the `prefillSlug` global variable with the slug
 * that the user initially tried to access and then changes the URL hash to '#new'.
 * This navigates the user to the new article form, with the slug field pre-filled.
 * @param {string} slug - The slug of the article the user attempted to access.
 */
export function createArticleFromSlug(slug) {
    prefillSlug = slug; // Store the slug for pre-filling the form.
    window.location.hash = '#new'; // Change route to the new article form.
}
