const dbType = process.env.DB_TYPE as 'sqlite' | 'postgres' | 'mysql';

if (!['sqlite', 'postgres', 'mysql'].includes(dbType)) {
  throw new Error(`Invalid DB_TYPE: ${process.env.DB_TYPE}`);
}

export default {
  "host": process.env.HOST || "0.0.0.0",
  "port": process.env.PORT ? parseInt(process.env.PORT) : 3000,
  "NODE_ENV": "prod",
  "dbConfig": {
    "type": dbType,
    "database": process.env.DB_DATABASE || "/app/data/Cagnotte.sqlite",
    "entities": [
      "./dist/entities/*.js"
    ],
    "synchronize": true,
    "logging": false
  }
};