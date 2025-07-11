// Configuration SQLite enrichie
const config = {
  dbPath: './database/content.db',
  tables: {
    content: `
      CREATE TABLE IF NOT EXISTS content (
        entity TEXT,
        field TEXT,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (entity, field)
      )
    `
  }
};

module.exports = config;