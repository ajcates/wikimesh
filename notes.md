# Developer Notes and Potential Areas of Confusion

This document highlights specific areas in the codebase that might require clarification for future developers or could be sources of confusion.

1.  **`ai.js` - `AI.chat()` method and `{article}` placeholder:**
    *   **File:** `ai.js`
    *   **Line:** Around line 61 (`prompt = prompt.replace("{article}", article);`)
    *   **Note:** The `chat(prompt, article)` method in the `AI` class has an `article` parameter. This parameter is used to replace a specific placeholder string `{article}` within the `prompt` string. This is a form of basic templating. It's important for developers to know that if they want to include existing article content in a prompt for the AI, they must use this exact placeholder in their prompt string. The AI instructions provided by the user via the UI are used as the `prompt` argument, and the current content of the article text area is passed as the `article` argument.

2.  **`router.js` & `ui.js` - Global `window.editingId` for State Management:**
    *   **Files:** `router.js`, `ui.js`
    *   **Lines:**
        *   `router.js`: Around line 32 (`window.editingId = null;`), line 43 (`window.editingId = article.id;`)
        *   `ui.js`: Around line 62 (`window.editingId = null;`), line 121 (`if (existingArticle && (!window.editingId || existingArticle.id !== window.editingId))`), line 126 (`const article = { id: window.editingId || Date.now(), ... }`), line 138 (`if (window.editingId)`)
    *   **Note:** The application uses `window.editingId` to keep track of whether an article is being edited or if a new one is being created.
        *   It's set to an article's ID in `router.js` when navigating to an edit route (`#edit/:slug`).
        *   It's set to `null` in `router.js` when navigating to the new article route (`#new`) and in `ui.js` (`resetForm`) after saving or canceling.
        *   `ui.js` checks `window.editingId` during the save operation to determine if it should call `dbService.updateArticle` (if ID exists) or `dbService.saveArticle` (if ID is null, then a new ID `Date.now()` is generated). It's also used to allow an existing slug if it belongs to the article currently being edited.
    *   **Potential Confusion:** Relying on a global-like variable on the `window` object for state management can make data flow harder to trace and might lead to unexpected behavior if not handled carefully across different modules.

3.  **`dbService.js` - Mixed Asynchronous Patterns (Promise vs. Callbacks):**
    *   **File:** `dbService.js`
    *   **Lines:**
        *   `initializeDB`: Uses Promises (e.g., `return new Promise(...)`).
        *   `saveArticle`, `getArticle`, `updateArticle`, `getAllArticles`: Use traditional callback functions for handling asynchronous results (e.g., `callback(null, result)` or `callback(error)`).
    *   **Note:** The `initializeDB` function returns a Promise, which is a modern way to handle asynchronous operations in JavaScript. However, the CRUD methods (`saveArticle`, `getArticle`, etc.) within `dbService` use an older callback-based pattern.
    *   **Potential Confusion:** This inconsistency might be slightly confusing for developers. Future refactoring could involve updating the CRUD methods to also return Promises for a more consistent API.

4.  **`ui.js` - AI Loading Indicator:**
    *   **File:** `ui.js`
    *   **Line:** Around line 81 (`const spinIntv = setInterval(() => { contentInput.value += '...\n'; }, 1000);`)
    *   **Note:** When the "AI Generate" button is clicked, a loading state is indicated by appending "..." to the `contentInput` textarea every second.
    *   **Potential Confusion:** This is an unconventional way to show a loading indicator. It directly modifies user-editable content with status updates. If the AI call fails or the user interacts with the textarea during this time, the "..." might remain. A more standard approach would be to use a dedicated, non-intrusive loading spinner or message element separate from the content area.

5.  **`ai.js` - Hardcoded AI Service Type in `AI` class and `setUpAI`:**
    *   **File:** `ai.js`
    *   **Lines:**
        *   `AI` constructor: Around line 48 (`if (type === "openai") { this.service = new OpenAIService(apiKey); }`)
        *   `setUpAI`: Around line 69 (`const ai = new AI("openai", apiKey);`)
    *   **Note:** Although the `AI` class constructor takes a `type` parameter, and `setUpAI` also takes a `type`, the actual service instantiation is hardcoded to `"openai"` and `OpenAIService`. The `AIService` base class suggests an intention to support multiple AI service types, but the current implementation only supports OpenAI.
    *   **Potential Confusion:** If a developer tries to use a different `type` (e.g., from `Config.AI_TYPE`) without modifying `ai.js` to include logic for other service types, it will result in an error or unexpected behavior. The system is not yet extensible for other AI services despite appearances.

6.  **`main.css` - Toolbar Responsiveness:**
    *   **File:** `main.css`
    *   **Todo Comment:** Line 16 (`- Make the toolbar fit on one row on smaller screens.`)
    *   **Note:** The CSS file itself notes a TODO item for improving the toolbar's responsiveness on smaller screens. Currently, toolbar items might wrap undesirably. This is a known issue for future UI improvement.
