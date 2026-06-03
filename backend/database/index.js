const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'family.db');
const db = new sqlite3.Database(dbPath);

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({
                lastID: this.lastID,
                changes: this.changes
            });
        });
    });
};

const exec = (sql) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

const initDatabase = async () => {
    const sql = fs.readFileSync(
        path.join(__dirname, 'init.sql'),
        'utf8'
    );

    await exec(sql);

    console.log('База данных инициализирована');
};

module.exports = {
    db,
    query,
    run,
    exec,
    initDatabase
};