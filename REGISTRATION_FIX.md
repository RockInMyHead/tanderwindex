# Исправление проблемы с регистрацией

## Проблема
При попытке регистрации пользователь получает ошибку 400 Bad Request с HTML-страницей вместо JSON-ответа.

## Причины
1. **Отсутствие CORS middleware** - сервер не обрабатывает preflight запросы
2. **Неправильная конфигурация Apache** - reverse proxy может блокировать запросы
3. **Проблемы с валидацией данных** - схема Zod может отклонять данные

## Внесенные исправления

### 1. Добавлен CORS middleware в server/index.ts
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

### 2. Улучшена обработка ошибок в server/routes.ts
- Добавлено детальное логирование запросов
- Улучшена валидация входных данных
- Более информативные сообщения об ошибках

### 3. Создан тестовый скрипт test-registration.js
Для проверки API регистрации локально.

## Дополнительные рекомендации

### Для продакшена (Apache конфигурация)
Добавьте в .htaccess или конфигурацию Apache:

```apache
# Разрешить CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"

# Обработка preflight запросов
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Проксирование API запросов
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Проверка работы
1. Перезапустите сервер: `npm run dev`
2. Проверьте логи сервера при попытке регистрации
3. Используйте тестовый скрипт: `node test-registration.js`

### Возможные проблемы
1. **Порт 3000 заблокирован** - проверьте, что порт доступен
2. **База данных не инициализирована** - убедитесь, что SQLite файл создан
3. **Права доступа** - проверьте права на запись в папку data/

## Тестирование
После внесения изменений:
1. Попробуйте зарегистрироваться через веб-интерфейс
2. Проверьте логи сервера на наличие ошибок
3. Используйте браузерные инструменты разработчика для анализа запросов
