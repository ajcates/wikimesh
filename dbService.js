// A variable to hold the database instance once initialized.
let db;

/**
 * @function initializeDB
 * @description Initializes the IndexedDB database.
 * This function sets up an IndexedDB database named 'WikiArticles'.
 * If it's the first time running or if the database version changes,
 * it creates an object store named 'articles'. This store uses 'id' as its keyPath
 * and creates an index named 'slug' on the 'slug' property of the stored objects,
 * ensuring that slugs are unique.
 * The function returns a Promise that resolves with the database instance on successful
 * initialization or rejects with an error if initialization fails.
 * This promise-based approach allows asynchronous setup of the database before it's used.
 *
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance or rejects on error.
 */
export function initializeDB() {
    return new Promise((resolve, reject) => {
        // Request to open the 'WikiArticles' database with version 1.
        const dbRequest = indexedDB.open('WikiArticles', 1);

        // This event is triggered if the database version is new or doesn't exist.
        // It's used to define the schema (object stores and indexes).
        dbRequest.onupgradeneeded = function(event) {
            db = event.target.result; // Get the database instance.
            // Create an object store named 'articles' with 'id' as the key.
            const objectStore = db.createObjectStore('articles', { keyPath: 'id' });
            // Create an index named 'slug' on the 'slug' property. 'unique: true' ensures no duplicate slugs.
            objectStore.createIndex('slug', 'slug', { unique: true });
        };

        // This event is triggered when the database is successfully opened.
        dbRequest.onsuccess = function(event) {
            db = event.target.result; // Assign the database instance to the global 'db' variable.
            resolve(db); // Resolve the promise with the database instance.
        };

        // This event is triggered if there's an error opening the database.
        dbRequest.onerror = function(event) {
            console.error('Database error:', event.target.errorCode);
            reject(event.target.error); // Reject the promise with the error.
        };
    });
}

/**
 * @object dbService
 * @description An object that encapsulates methods for interacting with the IndexedDB 'articles' object store.
 * It provides CRUD (Create, Read, Update, Delete - though delete is not implemented here) functionalities.
 * All methods check if the `db` instance is available before proceeding.
 * These methods use callbacks for handling asynchronous results, contrasting with the
 * promise-based approach in `initializeDB`.
 */
export const dbService = {
    /**
     * @method saveArticle
     * @description Adds a new article object to the 'articles' object store.
     * It uses a 'readwrite' transaction to ensure data integrity.
     * @param {Object} article - The article object to save. It should have an 'id' and a 'slug'.
     * @param {function(Error|null, any=): void} callback - A callback function that is invoked upon completion.
     * It receives an error object if the operation fails, or null if successful.
     */
    saveArticle(article, callback) {
        if (!db) { // Check if the database is initialized.
            callback(new Error('Database not initialized'));
            return;
        }
        // Start a 'readwrite' transaction on the 'articles' object store.
        const transaction = db.transaction(['articles'], 'readwrite');
        const objectStore = transaction.objectStore('articles');
        // Request to add the article object to the store.
        const request = objectStore.add(article);

        // Handle successful addition.
        request.onsuccess = () => callback(null);
        // Handle error during addition.
        request.onerror = (event) => callback(event.target.error);
    },

    /**
     * @method getArticle
     * @description Retrieves an article from the 'articles' object store by its 'slug'.
     * It uses a 'readonly' transaction and the 'slug' index for efficient lookup.
     * @param {string} slug - The slug of the article to retrieve.
     * @param {function(Error|null, Object=): void} callback - A callback function invoked upon completion.
     * It receives an error object if the operation fails, or null and the article object if successful.
     */
    getArticle(slug, callback) {
        if (!db) { // Check if the database is initialized.
            callback(new Error('Database not initialized'));
            return;
        }
        // Start a 'readonly' transaction.
        const transaction = db.transaction(['articles'], 'readonly');
        const objectStore = transaction.objectStore('articles');
        // Access the 'slug' index.
        const index = objectStore.index('slug');
        // Request to get the article by its slug from the index.
        const request = index.get(slug);

        // Handle successful retrieval.
        request.onsuccess = () => callback(null, request.result);
        // Handle error during retrieval.
        request.onerror = (event) => callback(event.target.error);
    },

    /**
     * @method updateArticle
     * @description Updates an existing article in the 'articles' object store.
     * It uses a 'readwrite' transaction and the `put` method, which adds or updates an object.
     * The article object must have a keyPath ('id') that matches an existing record to update it.
     * @param {Object} article - The article object to update. It must contain the keyPath field ('id').
     * @param {function(Error|null, any=): void} callback - A callback function invoked upon completion.
     * It receives an error object if the operation fails, or null if successful.
     */
    updateArticle(article, callback) {
        if (!db) { // Check if the database is initialized.
            callback(new Error('Database not initialized'));
            return;
        }
        // Start a 'readwrite' transaction.
        const transaction = db.transaction(['articles'], 'readwrite');
        const objectStore = transaction.objectStore('articles');
        // Request to update (or add if not existing, based on key) the article.
        const request = objectStore.put(article);

        // Handle successful update.
        request.onsuccess = () => callback(null);
        // Handle error during update.
        request.onerror = (event) => callback(event.target.error);
    },

    /**
     * @method getAllArticles
     * @description Fetches all articles from the 'articles' object store.
     * It uses a 'readonly' transaction and the `getAll()` method of the object store.
     * @param {function(Error|null, Array<Object>=): void} callback - A callback function invoked upon completion.
     * It receives an error object if the operation fails, or null and an array of article objects if successful.
     */
    getAllArticles(callback) {
        if (!db) { // Check if the database is initialized.
            callback(new Error('Database not initialized'));
            return;
        }
        // Start a 'readonly' transaction.
        const transaction = db.transaction(['articles'], 'readonly');
        const objectStore = transaction.objectStore('articles');
        // Request to get all articles from the store.
        const request = objectStore.getAll();

        // Handle successful retrieval of all articles.
        request.onsuccess = () => callback(null, request.result);
        // Handle error during retrieval.
        request.onerror = (event) => callback(event.target.error);
    }
};;
