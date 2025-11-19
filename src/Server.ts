
import path from 'path';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createAppChildLogger } from "./utils/Logger.js";
import swaggerSpec from './config/SwaggerConfig.js';
import { Logger } from 'winston';
import {initializeDbConnection} from "./config/Database.js";

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

const app = express();

app.set('view engine', 'ejs'); // Set EJS as the template engine.
app.set('views', path.join(__dirname, 'views')); // Define the path to the view templates.


if (['dev', 'test', 'docker'].includes(process.env.NODE_ENV || '')) {
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
    app.use('/api-docs', (req, res) => {
        res.status(403).send('Not available');
    });
}

// Add your routes here


let MssqlDataSource;
initializeDbConnection(env.dbConfig).then(dataSource => {
    MssqlDataSource = dataSource;
    app.listen(env.port, () => {
        logger.info(`Server is running at http://${env.host}:${env.port}`);
    });
}).catch(error => {
    logger.error(error);
});
