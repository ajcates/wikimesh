# Application Overview

This application is a simple Wiki-like system that allows users to create, view, and edit articles. It utilizes client-side JavaScript for all its operations, storing data in the browser's IndexedDB. It also features an AI integration to help generate article content.

## Core Components

The application is structured into several key JavaScript modules:

1.  **`index.html`**: The main entry point of the application. It defines the basic page structure, including header, sidebar, main content area, and footer. It also initializes the application by calling functions from `dbService.js`, `router.js`, and `ui.js`.

2.  **`main.css`**: Contains all the styles for the application, including a light and dark theme. It's designed to be responsive and user-friendly.

3.  **`router.js`**: Handles client-side routing. It listens to URL hash changes (`window.onhashchange`) to display different "pages" or views (e.g., home, view article, edit article, new article). It interacts with `dbService.js` to fetch data needed for these views and with `ui.js` to update the displayed content.

4.  **`dbService.js`**: Manages all interactions with the browser's IndexedDB.
    *   It initializes a database named `WikiArticles` with an `articles` object store.
    *   It provides CRUD (Create, Read, Update, Delete - though delete is not explicitly used for articles) operations for articles: `saveArticle`, `getArticle` (by slug), `updateArticle`, and `getAllArticles`.
    *   `initializeDB` uses a Promise, while the CRUD operations use a callback pattern for asynchronous results.

5.  **`ui.js`**: Responsible for all DOM manipulations and user interface logic.
    *   It handles event listeners for buttons (save, cancel, AI generate, theme switch, zoom, etc.), inputs (auto-slug generation), and navigation elements.
    *   It contains utility functions for UI tasks like generating slugs (`generateSlug`), validating slugs (`isValidSlug`), processing content for display (e.g., making hashtags clickable - `processContent`), and showing error messages.
    *   It interacts with `dbService.js` to save or update articles based on form input.
    *   It interacts with `ai.js` to fetch AI-generated content.

6.  **`ai.js`**: Provides an interface for interacting with AI services.
    *   It defines a base class `AIService` (not directly used but intended as an interface) and a concrete implementation `OpenAIService` for OpenAI's API.
    *   The `AI` class acts as a wrapper to select and use an AI service (currently hardcoded to OpenAI).
    *   Key methods include `chat(prompt, article)` for getting text completions and `image(prompt)` (though the image method is not fully implemented/used in the UI).
    *   The `chat` method can take an existing `article` content and insert it into the prompt where a `{article}` placeholder is found.

7.  **`config.js.example`**: A template for `config.js` (which is gitignored). `config.js` should contain API keys and other configuration, like the AI service type.

## Main User Flows

1.  **Viewing Articles (Home Page)**:
    *   The application starts at the `#home` route (or defaults to it).
    *   `router.js` handles this route.
    *   `dbService.getAllArticles()` is called to fetch all stored articles.
    *   `ui.js` (`updateArticleList`) renders the list of articles, each linking to `#[article_slug]`.

2.  **Viewing a Single Article**:
    *   User clicks an article link (e.g., `href="#my-article"`).
    *   `router.js` handles the route (`#:slug`).
    *   `dbService.getArticle(slug)` fetches the specific article.
    *   If found, `ui.js` (`articleTitle`, `articleContent` via `processContent`) displays the article content.
    *   If not found, a "not found" message is shown with an option to create the article.

3.  **Creating a New Article**:
    *   User clicks the "New Article" link (`href="#new"`).
    *   `router.js` handles the `#new` route, displaying the edit form.
    *   User fills in the title, (optionally) slug, instructions, and content.
    *   The slug is auto-generated from the title if not manually entered or if the manual entry is cleared.
    *   User clicks "Save".
    *   `ui.js` (`saveBtn` event listener) validates the input. It checks if the slug is unique (if it's a new article).
    *   `dbService.saveArticle()` stores the new article in IndexedDB.
    *   User is redirected to `#home`.

4.  **Editing an Existing Article**:
    *   From the article view, user clicks "Edit".
    *   `ui.js` (`editBtn` listener) changes the hash to `#edit/[article_slug]`.
    *   `router.js` handles this route. `dbService.getArticle(slug)` fetches the article.
    *   The edit form is displayed, populated with the article's data. `window.editingId` is set.
    *   User modifies the form.
    *   User clicks "Update".
    *   `ui.js` (`saveBtn` listener) validates input. Since `window.editingId` is set, it knows this is an update. It allows the same slug if it belongs to the current article being edited.
    *   `dbService.updateArticle()` updates the article in IndexedDB.
    *   User is redirected to `#home`.

5.  **AI Content Generation**:
    *   When creating or editing an article, the user can use the "AI Generate" button.
    *   User types instructions in the "Article Instructions" field.
    *   User clicks "AI Generate".
    *   `ui.js` (`aiBtn` listener) takes the instructions and any existing content in the "Content" field.
    *   `ai.js` (`AI.chat(instructions, content)`) sends these to the OpenAI API.
    *   The AI's response is then populated into the "Content" field.

## Data Flow Summary

*   **User Interaction**: Primarily handled by `index.html` (structure) and `ui.js` (event listeners, DOM updates).
*   **Routing**: Managed by `router.js` based on URL hash.
*   **Data Persistence**: Handled by `dbService.js` using IndexedDB.
*   **AI Interaction**: Orchestrated by `ui.js` calling `ai.js`, which communicates with the external AI API.
*   **Configuration**: API keys and AI type are expected in `config.js` (from `config.js.example`).

This architecture creates a decoupled system where UI, routing, data storage, and AI services operate as distinct modules, interacting through well-defined interfaces (functions and methods).
