export default {
  "dbConfig": {
    "type": "sqlite",
    "host": process.env.DB_HOST,
    "username": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "entities": [
      "./src/entities/*.js"
    ],
    "synchronize": false,
    "logging": false
  },
  "host": process.env.HOST,
  "port": process.env.PORT,
  "NODE_ENV": "prod"
};