// ui.js - Manages DOM interactions, UI updates, and utility functions related to the user interface.
// This file is central to how the user interacts with the application, handling form inputs,
// button clicks, dynamic content updates, and visual feedback.

// Imported modules:
// - dbService: Used for database operations like saving, updating, and fetching articles, crucial for UI actions that involve data persistence.
// - Config: Likely provides configuration values, such as API keys or AI service types, used here for setting up the AI service.
// - setUpAI: A factory function from ai.js to initialize an AI service instance.
import { dbService } from './dbService.js';
// import { Config } from './config.js'; // Config may no longer be needed if AI_TYPE is also dynamic or hardcoded
import { setUpAI } from './ai.js';

// DOM elements fetched at the beginning for efficient access and manipulation throughout the UI logic:
// - titleInput, slugInput, instructionsInput, contentInput: Input fields for the article form.
// - aiBtn: Button to trigger AI-assisted content generation.
// - saveBtn, cancelBtn: Buttons for saving/canceling article edits.
// - errorMsg: Element to display error messages to the user.
// - articleList: The <ul> element where the list of articles is displayed on the home page.
// - themeSwitch: A checkbox or toggle for switching between light and dark themes.
// - zoomOutBtn, zoomInBtn: Buttons to adjust the application's font size.
// - categoriesToggle: Button to show/hide the categories sidebar.
// - categoriesList: The container for the categories list (likely part of the sidebar).
// - editBtn: Button available on the article view page to switch to the edit mode for that article.
// - backToHomeBtn: Button available on article view/edit pages to navigate back to the home page.
// Article form inputs
const titleInput = document.getElementById('title');
const slugInput = document.getElementById('slug');
const instructionsInput = document.getElementById('instructions'); // For article specific instructions
const aiBtn = document.getElementById('ai-btn');
const contentInput = document.getElementById('content');
const saveBtn = document.getElementById('save-btn'); // For articles
const cancelBtn = document.getElementById('cancel-btn'); // For articles
const errorMsg = document.getElementById('error-msg'); // For article form errors
const articleList = document.getElementById('article-list');

// Theme and UI controls
const themeSwitch = document.getElementById('theme-switch');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const categoriesToggle = document.querySelector('.categories-toggle');
const categoriesList = document.getElementById('categories-list');

// Navigation buttons
const editBtn = document.getElementById('edit-btn'); // To edit an article from view page
const backToHomeBtn = document.getElementById('back-to-home-btn');

// Settings page elements
const apiKeyInput = document.getElementById('apiKey');
const defaultInstructionsInput = document.getElementById('defaultInstructions');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const settingsMsg = document.getElementById('settings-msg');

/**
 * @function generateSlug
 * @description Creates a URL-friendly slug from a given title string.
 * It converts the title to lowercase, removes special characters (allowing only letters, numbers, and spaces),
 * replaces spaces with hyphens, collapses multiple hyphens into one, and trims leading/trailing hyphens.
 * If the process results in an empty string, it defaults to 'article-' followed by the current timestamp.
 * @param {string} title - The title to be converted into a slug.
 * @returns {string} The generated slug.
 */
export function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '') // Remove non-alphanumeric characters except spaces
        .replace(/\s+/g, '-')    // Replace spaces with hyphens
        .replace(/-+/g, '-')     // Replace multiple hyphens with a single hyphen
        .trim('-')               // Trim hyphens from start and end
        || 'article-' + Date.now(); // Fallback for empty titles
}

/**
 * @function isValidSlug
 * @description Validates the format of a given slug.
 * A valid slug must consist only of lowercase letters, numbers, and hyphens.
 * @param {string} slug - The slug to validate.
 * @returns {boolean} True if the slug is valid, false otherwise.
 */
function isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug);
}


/**
 * @function processContent
 * @description Transforms raw text content for display.
 * Specifically, it finds patterns like #hashtag and converts them into clickable HTML links
 * that navigate to a route corresponding to the hashtag (e.g., "#hashtag" becomes "<a href="#hashtag">#hashtag</a>").
 * This is useful for creating internal links or tags within article content.
 * @param {string} content - The raw text content to process.
 * @returns {string} The processed content with hashtags converted to links.
 */
export function processContent(content) {
    const regex = /#(\w+)/g; // Matches # followed by one or more word characters
    return content.replace(regex, '<a href="#$1">#$1</a>'); // Replaces with an anchor tag
}


/**
 * @function updateArticleList
 * @description Dynamically builds and updates the list of articles displayed on the home page.
 * It clears any existing items in the `articleList` element and then iterates over the provided
 * array of article objects, creating a list item (`<li>`) with a link (`<a>`) for each article.
 * The link's href is set to the article's slug (e.g., `#article-slug`).
 * @param {Array<Object>} articles - An array of article objects, each expected to have `slug` and `title` properties.
 */
export function updateArticleList(articles) {
    articleList.innerHTML = ''; // Clear existing list items
    articles.forEach(article => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${article.slug}">${article.title}</a>`;
        articleList.appendChild(li);
    });
}

/**
 * @function showError
 * @description Displays an error message to the user in the `errorMsg` DOM element.
 * The message becomes visible and then automatically hides after 3 seconds.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    setTimeout(() => errorMsg.style.display = 'none', 3000); // Hide after 3 seconds
}

/**
 * @function resetForm
 * @description Clears the input fields (title, slug, content) of the new/edit article form.
 * It also resets the text of the save button to "💾 Save" (its default state for new articles)
 * and clears `window.editingId`, indicating that any subsequent save operation should create a new article.
 */
function resetForm() {
    titleInput.value = '';
    slugInput.value = '';
    contentInput.value = '';
    if (instructionsInput) instructionsInput.value = ''; // Clear article-specific instructions
    saveBtn.textContent = '💾 Save';
    window.editingId = null; // Clear the global editing state indicator
}

/**
 * @function setupUI
 * @description Initializes all UI-related event listeners and sets up the AI service.
 * This function is intended to be called once when the application starts.
 */
export async function setupUI() { // Make setupUI async
    // The 'ai' instance will be used for AI-assisted content generation.
    let ai;
    // AI_TYPE could also come from settings in the future, or remain in a config if static.
    const aiType = "openai"; // Using "openai" directly as per example. Or use Config.AI_TYPE if it's still relevant.

    try {
        ai = await setUpAI(aiType); // setUpAI now fetches the key from dbService
        console.log("[DEBUG] setupUI: AI service initialized. API Key on ai.service:", ai && ai.service ? ai.service.apiKey : "ai.service is undefined");
        // console.log("AI service initialized successfully using API key from settings."); // Original log, can be kept or removed

        // Event listener for the AI button (aiBtn):
        // Handles AI-powered content generation or assistance.
        if (aiBtn) {
            aiBtn.addEventListener('click', async () => {
                if (!ai || !ai.service) { // Check if ai or its service is properly initialized
                    showError("AI service is not available. Please check settings and API key.");
                    console.error("[DEBUG] aiBtn click: AI service not available (ai or ai.service is null/undefined).");
                    return;
                }
                console.log("[DEBUG] aiBtn click: API Key on ai.service before chat:", ai.service.apiKey);

                const instructionsValue = instructionsInput.value.trim(); // Get AI instructions from input
                if (!instructionsValue && instructionsInput) {
                    instructionsInput.value = 'Please provide instructions.'; // Basic validation
                    return;
                }

                // Ensure ai.instruction method exists and is callable
                if (typeof ai.instruction === 'function') {
                    ai.instruction(instructionsValue); // Set instructions for the AI service
                } else {
                    showError("AI service instruction method not available.");
                    return;
                }

                const currentContent = contentInput.value.trim(); // Get current content from textarea
                // The prompt for the AI is set to be the instructions themselves.
                const prompt = instructionsValue;

                if (!prompt) {
                    showError('Please enter a prompt (instructions).');
                    return;
                }

                let spinIntv; // Declare here to be accessible in finally block
                try {
                    // Unconventional loading indicator: appends "..." to the content input periodically.
                    spinIntv = setInterval(() => {
                        if (contentInput) contentInput.value += '...\n';
                    }, 1000);

                    // Call the AI's chat method with the prompt and current article content.
                    const response = await ai.chat(prompt, currentContent);
                    if (contentInput) contentInput.value = response; // Replace content with AI's response.
                } catch (error) {
                    showError('Error generating response: ' + error.message);
                } finally {
                    if (spinIntv) clearInterval(spinIntv); // Stop the loading indicator.
                }
            });
        }
    } catch (error) {
        console.error("Failed to set up AI:", error);
        if (typeof showError === 'function') { // Ensure showError is available
            showError("Failed to initialize AI services. Check settings & API key.");
        }
    }

    // Event listener for the title input field (titleInput):
    // Automatically generates a slug in the slug input field (slugInput) as the user types a title.
    // This only happens if the slug field is empty or if its current value was also auto-generated from the previous title.
    titleInput.addEventListener('input', () => {
        // Check if slug field is empty or if its current value matches the slug generated from the *current* title input value
        // This logic might be slightly off if the user manually edits the slug then edits title again.
        // A more robust check might involve storing a flag if the slug was user-edited.
        if (!slugInput.value || slugInput.value === generateSlug(titleInput.value)) {
            slugInput.value = generateSlug(titleInput.value);
        }
    });

    // Event listener for the save button (saveBtn):
    // Handles creating a new article or updating an existing one.
    saveBtn.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const slug = slugInput.value.trim(); // Slug is taken from input, might have been auto-generated or manually edited.
        const instructions = instructionsInput.value.trim(); // Instructions are saved with the article.
        const content = contentInput.value.trim();

        if (!title) { // Basic validation for title.
            showError('Title is required.');
            return;
        }

        // If slug is empty (e.g., user cleared it), generate it from the title.
        if (!slug) {
            slugInput.value = generateSlug(title); // Update the input field as well.
            // Re-assign slug as generateSlug might have produced a different value if title was empty initially.
            // However, the above check for `!title` should prevent this.
        }

        // Validate slug format (lowercase, numbers, hyphens).
        if (!isValidSlug(slugInput.value)) { // Use slugInput.value as it might have been auto-generated if slug was empty.
            showError('Slug must contain only lowercase letters, numbers, and hyphens.');
            return;
        }

        // Check if the slug already exists to prevent duplicates.
        // This is important because slugs are used as unique identifiers in URLs.
        dbService.getArticle(slugInput.value, (error, existingArticle) => {
            if (error) {
                showError('Error checking slug: ' + error.message);
                return;
            }

            // Allow using the same slug IF we are editing the article that already has that slug.
            // `window.editingId` is set by the router when navigating to `#edit/:slug`.
            if (existingArticle && (!window.editingId || existingArticle.id !== window.editingId)) {
                showError('Slug already in use. Please choose another.');
                return;
            }

            // Prepare article object. Use `window.editingId` if it exists (update), otherwise generate a new ID (create).
            const article = {
                id: window.editingId || Date.now(),
                title,
                slug: slugInput.value, // Use the potentially auto-corrected or validated slug from input.
                content,
                instructions
            };

            // Callback function for both save and update operations.
            const saveCallback = (saveError) => {
                if (saveError) {
                    showError('Error saving article: ' + saveError.message);
                } else {
                    resetForm(); // Clear the form.
                    window.location.hash = '#home'; // Navigate back to the home page.
                }
            };

            // Distinguish between creating a new article and updating an existing one.
            if (window.editingId) {
                dbService.updateArticle(article, saveCallback); // Update existing article.
            } else {
                dbService.saveArticle(article, saveCallback); // Create new article.
            }
        });
    });

    // Event listener for the cancel button (cancelBtn):
    // Resets the form and navigates the user back to the home page.
    cancelBtn.addEventListener('click', () => {
        resetForm();
        window.location.hash = '#home';
    });

    // Event listener for the theme switch toggle:
    // Toggles a `data-theme` attribute on the `<body>` element between 'light' and 'dark'.
    // CSS rules would then apply different styles based on this attribute.
    themeSwitch.addEventListener('change', () => {
        document.body.setAttribute('data-theme', themeSwitch.checked ? 'dark' : 'light');
    });

    // Event listeners for zoom out and zoom in buttons:
    // Adjust the root font size of the document (`documentElement`, i.e., `<html>` tag).
    // This allows for a simple text scaling feature.
    zoomOutBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).fontSize);
        root.style.fontSize = `${currentSize - 0.1}rem`; // Decrease by 0.1rem
    });
    zoomInBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).fontSize);
        root.style.fontSize = `${currentSize + 0.1}rem`; // Increase by 0.1rem
    });

    // Event listener for the categories toggle button:
    // Toggles CSS classes 'collapsed' on the toggle button itself and 'open' on the `categoriesList` element.
    // This is likely used to control the visibility or collapsed/expanded state of a sidebar.
    categoriesToggle.addEventListener('click', () => {
        categoriesToggle.classList.toggle('collapsed');
        categoriesList.classList.toggle('open');
    });

    // Event listener for the edit button (editBtn):
    // This button is typically visible when viewing an article.
    // It navigates the user to the edit page for the currently viewed article.
    // It assumes the current article's slug is in `window.location.hash`.
    editBtn.addEventListener('click', () => {
        const slug = window.location.hash.split('#')[1]; // Get slug from current URL hash.
        if (slug) { // Ensure there is a slug.
            window.location.hash = `#edit/${slug}`; // Navigate to the edit route.
        }
    });

    // Event listener for the back to home button (backToHomeBtn):
    // Navigates the user to the home page ('#home').
    backToHomeBtn.addEventListener('click', () => {
        window.location.hash = '#home';
    });

    // Event listener for the save settings button (saveSettingsBtn):
    // Handles saving the application settings (API key, default instructions).
    if (saveSettingsBtn) { // Ensure the button exists on the page (it won't in test environments without full HTML)
        saveSettingsBtn.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            const defaultInstructions = defaultInstructionsInput.value.trim();

            const settings = { apiKey, defaultInstructions };

            dbService.saveSettings(settings, (error) => {
                // Clear previous messages
                settingsMsg.textContent = '';
                settingsMsg.style.display = 'none';
                settingsMsg.className = ''; // Reset any specific class

                if (error) {
                    settingsMsg.textContent = 'Error saving settings: ' + error.message;
                    settingsMsg.style.color = 'red'; // Using direct style for simplicity
                    settingsMsg.className = 'error-message'; // Or use a class
                } else {
                    settingsMsg.textContent = 'Settings saved successfully!';
                    settingsMsg.style.color = 'green'; // Using direct style for simplicity
                    settingsMsg.className = 'success-message'; // Or use a class
                    setTimeout(() => {
                        settingsMsg.style.display = 'none';
                        settingsMsg.className = '';
                    }, 3000); // Hide message after 3 seconds
                }
                settingsMsg.style.display = 'block';
            });
        });
    }
}
