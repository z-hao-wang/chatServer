# Nodejs bases Chat server

## tech stack
* Mongodb (for all storage)
* Redis (for scale node servers)
* websocket (for all network communication between client and server)

## How to start

first set .env file

```
MONGODB_URL=mongodb://[username]:[password]@[host]:[port]/[db_name]
REDISCLOUD_URL=redis://[username]:[password]@[host]:[port]
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


##set up Apple Push Notification cert (required)

You must have an apple ios developer account in order to set up.

Set up APN in Apple developer portal. Follow step 1 and step 2 at

https://github.com/ParsePlatform/PushTutorial/tree/master/iOS

Generate APN cert and private key. follow steps at

https://github.com/argon/node-apn/wiki/Preparing-Certificates

Then put cert.pem and key.pem in the root directory

Set .env file APN_KEY_SECRET=[your passphrase]

