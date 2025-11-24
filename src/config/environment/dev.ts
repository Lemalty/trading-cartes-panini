export default {
  "host": "localhost",
  "port": 3000,
  "NODE_ENV": "dev",
  "dbConfig": {
    "type": "sqlite",
    "host": "localhost",
    "username": "user",
    "password": "pwd",
    "database": "trading_cards.sqlite",
    "entities": [
      "./src/entities/*.ts"
    ],
    "synchronize": true,
    "logging": false
  }
};