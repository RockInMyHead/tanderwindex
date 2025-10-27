// Скрипт для проверки структуры базы данных
const Database = require('better-sqlite3');
const path = require('path');

function checkDatabase() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'construction-platform.db');
    
    console.log('Checking database at:', dbPath);
    
    const sqlite = new Database(dbPath);
    
    // Проверяем структуру таблицы users
    console.log('\n=== Users table structure ===');
    const userColumns = sqlite.prepare('PRAGMA table_info(users)').all();
    console.table(userColumns);
    
    // Проверяем количество пользователей
    const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('\nTotal users:', userCount.count);
    
    // Проверяем существующих пользователей
    if (userCount.count > 0) {
      console.log('\n=== Existing users ===');
      const users = sqlite.prepare('SELECT id, username, email, user_type, isAdmin FROM users').all();
      console.table(users);
    }
    
    // Проверяем другие таблицы
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\n=== All tables ===');
    console.table(tables);
    
    sqlite.close();
    console.log('\nDatabase check completed successfully!');
    
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabase();
