import path from 'path';
import express from 'express';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createAppChildLogger } from "./utils/Logger.js";
import swaggerSpec from './config/SwaggerConfig.js';
import { Logger } from 'winston';
import { initializeDbConnection } from './config/Database.js';
import { AdminService } from './services/admin.service.js';
import 'reflect-metadata';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const logger: Logger = createAppChildLogger("Server");
const validEnvironments: string[] = ['dev', 'prod', 'test', 'docker'];

// Importing environment
const environment: string = process.env.NODE_ENV || 'dev';

if (!validEnvironments.includes(environment)) {
    logger.error(`Invalid environment setting: ${environment}`);
    process.exit(1);
}

const configModule = await import(`./config/environment/${environment}.js`);
const env = configModule.default;

// Initialize database connection FIRST
try {
    await initializeDbConnection(env.dbConfig);
    logger.info('Database connection initialized successfully');

    // Initialize admin password from .env
    const adminService = new AdminService();
    await adminService.initializeAdminPassword();
    logger.info('Admin password initialized successfully');
} catch (error) {
    logger.error('Failed to initialize database connection or admin password', error);
    process.exit(1);
}

// Import routes AFTER database is initialized
const adminRoutes = (await import("./routes/admin.routes.js")).default;
const cardsRoutes = (await import("./routes/cards.routes.js")).default;
const authRoutes = (await import("./routes/auth.routes.js")).default;

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'votre-secret-super-securise-a-changer',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 heures
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    },
    proxy: process.env.NODE_ENV === 'prod'
}));

// Middleware pour parser les données de formulaires
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware pour rendre les données de session disponibles dans les vues
app.use((req, res, next) => {
    res.locals.memberName = req.session.memberName || null;
    res.locals.memberId = req.session.memberId || null;
    next();
});

if (['dev', 'test', 'docker'].includes(process.env.NODE_ENV || '')) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
    app.use('/api-docs', (req, res) => {
        res.status(403).send('Not available');
    });
}

// Routes
app.use('/', authRoutes);
app.use('/', cardsRoutes);
app.use('/', adminRoutes);

// Error handling
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page non trouvée'
    });
});

app.listen(env.port, () => {
    logger.info(`Server is running at http://${env.host}:${env.port}`);
});
