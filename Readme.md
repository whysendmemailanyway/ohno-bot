### Install:

```
cd xfchatlib
npm install
cd ..
npm install
```

### Configure:

1. Create a `.env` file in the project directory
1. Define the following environment variables in your `.env` file:
```
FLIST_USERNAME=yourflistaccountnamehere
FLIST_PASSWORD=yourflistpasswordhere
FLIST_BOT_CHARACTER=your bot character's name here
FLIST_MASTER_CHARACTER=the name of your character who is responsible for the bot
FLIST_ROOM_ID=adh-yourroomcodehere
CLIENT_NAME=the name of this project basically
CLIENT_VERSION=this project's version number, e.g 1.0.0
```

Make sure `.env` is listed in your `.gitignore` file if you plan on sharing the repository with anyone. Keep your account name and password secret!

### Run:

```
npm start
```

### Credits: 

AelithBlanchett saved me a ton of work with their fchatlib package! https://www.npmjs.com/package/fchatlib

kadamwhite saved me another significant chunk of time with his card-deck package: https://www.npmjs.com/package/card-deck

Dad jokes courtesy of: https://icanhazdadjoke.com/

Other jokes courtesy of: https://sv443.net/jokeapi/v2

Drink recipes courtesy of: https://www.thecocktaildb.com/