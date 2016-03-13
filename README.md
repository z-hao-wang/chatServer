# Nodejs bases Chat server

## How to start


first set .env file

```
MONGODB_URL='mongodb://[username]:[password]@[host]:[port]/[db_name]'
PORT=3000
```

Run:  
```
npm install
npm start
```

Also can deploy to heroku

Check your http://localhost:3000/ or  `open http://localhost:3000/`

## How to test
Tests are using Jest

`npm test`

## Still in development


#set up Apple Push Notification cert
follow steps at
https://github.com/argon/node-apn/wiki/Preparing-Certificates

Then put cert.pem and key.pem in the root directory

Set .env file APN_KEY_SECRET=[you passphrase]