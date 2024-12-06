const sqlite3 = require('sqlite3').verbose();

// 初始化数据库
const db = new sqlite3.Database('./records.db', (err) => {
    if (err) {
        console.error('无法连接到数据库:', err.message);
    } else {
        console.log('成功连接到 SQLite 数据库');
    }
});

// 创建表（如果尚未存在）
function createTable() {
    db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      numbers TEXT NOT NULL DEFAULT '[]',
      drawTime TEXT NOT NULL,
      section TEXT,
      randomZodiacs TEXT
    )
  `, (err) => {
        if (err) {
            console.error('创建表失败:', err.message);
        } else {
            console.log('表 records 已创建或已存在');
        }
    });
}

module.exports = { db, createTable };
