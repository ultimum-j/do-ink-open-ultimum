/**
 * storage.js — IndexedDB-backed project persistence for Do Ink Open
 * 
 * Replaces the Base44 SDK with browser-native IndexedDB storage.
 * All project data lives locally in the browser — no external API calls.
 * 
 * Maintained by Ultimum (https://ultimumgroup.com)
 */

const DB_NAME = 'doink-open';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

/** Open (or create) the IndexedDB database */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updated_date', 'updated_date', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Generate a unique ID */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Get current ISO timestamp */
function now() {
  return new Date().toISOString();
}

/**
 * Project storage API — drop-in replacement for base44.entities.Project
 */
export const projectStorage = {
  /**
   * List all projects, sorted by updated_date descending (newest first)
   */
  async list() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = request.result;
        projects.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get a single project by ID
   */
  async get(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Create a new project
   * @param {Object} data - Project data (name, type, tags, data, etc.)
   * @returns {Object} The created project with id and timestamps
   */
  async create(data) {
    const db = await openDB();
    const project = {
      ...data,
      id: generateId(),
      created_date: now(),
      updated_date: now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(project);

      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Update an existing project (merges with existing data)
   * @param {string} id - Project ID
   * @param {Object} updates - Fields to update
   * @returns {Object} The updated project
   */
  async update(id, updates) {
    const db = await openDB();
    const existing = await this.get(id);
    if (!existing) throw new Error(`Project ${id} not found`);

    const updated = {
      ...existing,
      ...updates,
      id, // ensure ID is preserved
      updated_date: now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete a project by ID
   */
  async delete(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Filter projects by a query object (simple field matching)
   * @param {Object} query - e.g. { id: '123' } or { type: 'drawing' }
   * @returns {Array} Matching projects
   */
  async filter(query) {
    const all = await this.list();
    return all.filter(project => {
      return Object.entries(query).every(([key, value]) => project[key] === value);
    });
  },
};
