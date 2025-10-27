import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase, seedDatabaseIfEmpty, addModerationFields, addBidStatusFields, addSpecialistReviewFields } from "./db-simple";
import { seedTopSpecialists } from "./seed-specialists";
import { addCompletedProjectsColumn } from "./migrations/add-completed-projects";
import { addUserFieldsAndGuarantees } from "./migrations/add-user-fields-and-guarantees";
import { addAdminField } from "./migrations/add-admin-field";
import { addDocumentsField } from "./migrations/add-documents-field";
import { AddressInfo } from "net";

const app = express();

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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Инициализируем SQLite базу данных
  initializeDatabase();
  
  // Добавляем колонку completedProjects, если она отсутствует
  await addCompletedProjectsColumn();
  
  // Добавляем новые поля пользователя и таблицу банковских гарантий
  await addUserFieldsAndGuarantees();
  
  // Добавляем поле администратора
  await addAdminField();
  
  // Добавляем поле documents в таблицу tender_bids
  await addDocumentsField();
  
  // Добавляем поля модерации
  addModerationFields();
  
  // Добавляем поля статуса заявок
  addBidStatusFields();
  
  // Добавляем поля для привязки отзывов к специалистам и бригадам
  addSpecialistReviewFields();
  
  // Заполняем тестовыми данными, если база пуста
  seedDatabaseIfEmpty();
  
  // Заполняем данными лучших специалистов
  await seedTopSpecialists();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 0;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    const address = server.address() as AddressInfo;
    log(`serving on port ${address.port}`);
  });

  // Set server options for large payloads
  server.maxHeadersCount = 0;
  server.headersTimeout = 120000;
  server.requestTimeout = 120000;
})();
