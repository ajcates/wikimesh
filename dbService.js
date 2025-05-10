let db;

// Initialize IndexedDB database and return a promise
export function initializeDB() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('WikiArticles', 1);

        // Create object store and index on first run or version upgrade
        dbRequest.onupgradeneeded = function(event) {
            db = event.target.result;
            const objectStore = db.createObjectStore('articles', { keyPath: 'id' });
            objectStore.createIndex('slug', 'slug', { unique: true });
        };

        // Assign db instance on successful opening
        dbRequest.onsuccess = function(event) {
            db = event.target.result;
            resolve(db);
        };

        // Reject promise on error
        dbRequest.onerror = function(event) {
            console.error('Database error:', event.target.errorCode);
            reject(event.target.error);
        };
    });
}

// Database service object with CRUD methods
export const dbService = {
    // Save a new article to the database
    saveArticle(article, callback) {
        if (!db) {
            callback(new Error('Database not initialized'));
            return;
        }
        const transaction = db.transaction(['articles'], 'readwrite');
        const objectStore = transaction.objectStore('articles');
        const request = objectStore.add(article);

        request.onsuccess = () => callback(null);
        request.onerror = (event) => callback(event.target.error);
    },

    // Retrieve an article by slug
    getArticle(slug, callback) {
        if (!db) {
            callback(new Error('Database not initialized'));
            return;
        }
        const transaction = db.transaction(['articles'], 'readonly');
        const objectStore = transaction.objectStore('articles');
        const index = objectStore.index('slug');
        const request = index.get(slug);

        request.onsuccess = () => callback(null, request.result);
        request.onerror = (event) => callback(event.target.error);
    },

    // Update an existing article
    updateArticle(article, callback) {
        if (!db) {
            callback(new Error('Database not initialized'));
            return;
        }
        const transaction = db.transaction(['articles'], 'readwrite');
        const objectStore = transaction.objectStore('articles');
        const request = objectStore.put(article);

        request.onsuccess = () => callback(null);
        request.onerror = (event) => callback(event.target.error);
    },

    // Fetch all articles
    getAllArticles(callback) {
        if (!db) {
            callback(new Error('Database not initialized'));
            return;
        }
        const transaction = db.transaction(['articles'], 'readonly');
        const objectStore = transaction.objectStore('articles');
        const request = objectStore.getAll();

        request.onsuccess = () => callback(null, request.result);
        request.onerror = (event) => callback(event.target.error);
    }
};;
