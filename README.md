# playtime-discord-bot

This is a Discord bot which tracks the total time spent on games (and only games) for all users of the server based on their presence.

> ...but why?

There are some games which don't track the time you've spent on it. This is a neat feature Steam has, but what if your game is not from Steam but has it's own launcher? In my case this was for ZZZ, but it could also be applied for League of Legends for instance.

> Well, you could add the game to your Steam library as a non-steam game, start it from Steam and there you'd be tracking the time!

Depends. Some games which have their own launcher sadly do not work with that solution. You have to add the launcher as the non-steam game, so when you launch it from Steam, you're just opening the launcher, not the game itself. When the game starts, the launcher is closed, so Steam thinks you've stopped playing.

## Commands

### timers

When called, returns a text which contains all the games the user who called it has registered. One line per game, which tells the game name and the total time spent playing it. Might change the name to something else, but for now it is what it is. It is paged as there might be too many games.

### search

You can input whatever on the query so it will try to find an activity registered on you.

### tracking

Toggles whether the bot should track your game time or not. When tracking is disabled, the bot will not record any game time for you. This is useful if you want to temporarily stop tracking your playtime without having to leave the server.

## Setup

You will need to add a `config.json` file on the root of the project. Check out the Discord.js documentation for it: https://discordjs.guide/creating-your-bot/#using-config-json. You will need to setup your token and client ID.

To create a Discord bot, again I strongly recommend following their guide: https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot

## How does it work

### Discord.js

As you can tell, this Discord bot uses NodeJS with vanilla ES5 JS. I wanted to get straight to the point and not fiddle with other things which honestly to me take between 5 to 10 hours to set up by hand when I know it's a quick project.

I **strongly** encourage anyone who wants to do a Discord bot with NodeJS to read their official guide: https://discordjs.guide/#before-you-begin. It's really great, and I usually do not think docs are.

The documentation is not that good, though: https://discord.js.org/docs/packages/discord.js/14.15.3.

The bot only has one command right now, which is to check the total playtime for all games. Although it would be helpful, it doesn't really need other commands to function as desired. Thanks to Discordjs, the bot is able to listen to presence updates for all users in a server. If someone starts playing a game, it will store when it started playing with a timestamp. When the update says that they stopped playing a game, it will search for the game and the timestamp. If found, it will calculate the difference between now and the original timestamp, thus knowing the time it has passed using [moment](https://momentjs.com/docs).

### Firebase

We have to store the total playtime for each user somewhere. Since I have been working with Firebase for some other quick projects before, I decided to also do that here using Firestore.

We have just one collection, which is the `users` collection. There, we have one document per user, where we just store their ID. Within the document, we have another collection called `games`. The `games` collection has one document per game, storing the ID, name and total playtime. That's it! we don't need anything else.

### Docker

Just to make the deployment somewhat easier, I decided to dockerize the NodeJS app.

### Google Cloud

For me, the difficulty always come with the deployment to a VM because of the authentication. I had to authenticate through gcloud to be able to use Firebase, and I really do not like playing with nginx. I started checking Google Cloud as an option, since I've always have wanted to fiddle around and have a somewhat demo project to test things out, so this was the perfect opportunity.

I had to activate sooo many things to make this project work, but once I was able to launch the VM, it was easy peasy to deploy the container. No login was necessary as I was already using the Google infrastructure.

Because of this, I also decided to start using the Google Cloud logging system.

## Roadmap

I don't really have plans to keep messing with this repository, but if I do, here are some ideas on what it'd be done:

- Command to track activities even if they are not games.