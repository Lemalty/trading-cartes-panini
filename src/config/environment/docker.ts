export default {
  "host": "localhost",
  "port": 3000,
  "NODE_ENV": "docker",
  "dbConfig": {
    "type": "sqlite",
    "host": "localhost",
    "username": "user",
    "password": "pwd",
    "database": "Database",
    "entities": [
      "./src/entities/*.js"
    ],
    "synchronize": true,
    "logging": false
  }
};