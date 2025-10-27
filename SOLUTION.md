# Решение проблемы с регистрацией пользователей

## Проблема
При попытке регистрации пользователь получает ошибку:
```
400: <!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN"> 
<html><head> <title>400 Bad Request</title> </head><body> 
<h1>Bad Request</h1> <p>Your browser sent a request that this server could not understand.<br /> </p> 
<hr> <address>Apache/2.4.65 (Debian) Server at stroy.windexs.ru Port 443</address> </body></html>
```

## Анализ проблемы
Ошибка указывает на то, что:
1. Сервер возвращает HTML вместо JSON
2. Apache reverse proxy блокирует или неправильно обрабатывает запросы
3. Отсутствует правильная настройка CORS

## Внесенные исправления

### 1. Добавлен CORS middleware
В файле `server/index.ts` добавлен полноценный CORS middleware:
```javascript
// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});
```

### 2. Улучшена обработка ошибок
В файле `server/routes.ts` добавлено:
- Детальное логирование запросов
- Проверка пустого тела запроса
- Более информативные сообщения об ошибках

### 3. Созданы тестовые скрипты
- `test-registration.js` - для тестирования API регистрации
- `check-database.js` - для проверки структуры базы данных

## Инструкции по исправлению

### Шаг 1: Перезапуск сервера
```bash
# Остановите текущий сервер (Ctrl+C)
# Запустите заново
npm run dev
```

### Шаг 2: Проверка локальной работы
```bash
# Запустите тест регистрации
node test-registration.js

# Проверьте структуру базы данных
node check-database.js
```

### Шаг 3: Настройка Apache (для продакшена)
Добавьте в `.htaccess` или конфигурацию Apache:

```apache
# Включить mod_rewrite
RewriteEngine On

# CORS заголовки
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"

# Обработка preflight запросов
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Проксирование API запросов на Node.js сервер
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Проксирование статических файлов
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Шаг 4: Проверка портов
Убедитесь, что:
- Node.js сервер работает на порту 3000
- Apache проксирует запросы на localhost:3000
- Порт 3000 доступен для Apache

### Шаг 5: Проверка логов
После внесения изменений проверьте:
1. Логи Node.js сервера на наличие ошибок
2. Логи Apache на наличие ошибок проксирования
3. Браузерные инструменты разработчика (Network tab)

## Дополнительные проверки

### Проверка базы данных
```bash
# Запустите проверку структуры БД
node check-database.js
```

### Проверка API
```bash
# Тест регистрации
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "email": "test@example.com",
    "fullName": "Test User",
    "userType": "individual"
  }'
```

## Возможные проблемы и решения

### 1. Порт 3000 заблокирован
```bash
# Проверьте, что порт свободен
netstat -tulpn | grep :3000

# Если занят, измените порт в server/index.ts
const port = 3001; // или другой свободный порт
```

### 2. База данных не создана
```bash
# Убедитесь, что папка data/ существует
mkdir -p data

# Перезапустите сервер для создания БД
npm run dev
```

### 3. Права доступа
```bash
# Установите правильные права на папку data/
chmod 755 data/
chmod 644 data/construction-platform.db
```

## Результат
После внесения всех изменений:
1. CORS запросы будут обрабатываться корректно
2. API будет возвращать JSON вместо HTML
3. Регистрация пользователей будет работать
4. Логирование поможет диагностировать проблемы

## Тестирование
1. Откройте сайт в браузере
2. Попробуйте зарегистрироваться
3. Проверьте логи сервера
4. Используйте инструменты разработчика для анализа запросов
