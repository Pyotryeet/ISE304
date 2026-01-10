const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'hive.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

// Initialize database
async function initDatabase() {
    const SQL = await initSqlJs();

    // Try to load existing database
    try {
        if (fs.existsSync(DB_PATH)) {
            const buffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(buffer);
            console.log('Database loaded from file');
        } else {
            // Create new database
            db = new SQL.Database();
            console.log('Created new database');

            // Run schema
            const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
            db.run(schema);
            console.log('Schema applied');

            // Save to file
            saveDatabase();
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        db = new SQL.Database();
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        db.run(schema);
        saveDatabase();
    }

    return db;
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }
}

// Database wrapper with synchronous-like API
const dbWrapper = {
    prepare: (sql) => ({
        get: (...params) => {
            try {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                if (stmt.step()) {
                    const result = stmt.getAsObject();
                    stmt.free();
                    return result;
                }
                stmt.free();
                return undefined;
            } catch (error) {
                console.error('Query error:', error, sql, params);
                return undefined;
            }
        },
        all: (...params) => {
            try {
                const results = [];
                const stmt = db.prepare(sql);
                stmt.bind(params);
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                return results;
            } catch (error) {
                console.error('Query error:', error, sql, params);
                return [];
            }
        },
        run: (...params) => {
            try {
                db.run(sql, params);
                const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0];
                const changes = db.getRowsModified();
                saveDatabase();
                return { lastInsertRowid: lastId, changes };
            } catch (error) {
                console.error('Query error:', error, sql, params);
                return { lastInsertRowid: 0, changes: 0 };
            }
        }
    }),
    exec: (sql) => {
        try {
            db.run(sql);
            saveDatabase();
        } catch (error) {
            console.error('Exec error:', error);
        }
    },
    pragma: () => { } // No-op for compatibility
};

// Initialize on module load
let initialized = false;
const initPromise = initDatabase().then(() => {
    initialized = true;
    console.log('Database ready');
});

// Export wrapper that waits for init
module.exports = {
    ...dbWrapper,
    ready: initPromise,
    isReady: () => initialized
};
