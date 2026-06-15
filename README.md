# Minutes Manager

A tool for balancing player minutes across teams. Drag a player's slider and the time is automatically pulled from or pushed to the other unlocked players, so your court time always adds up. Supports Basketball, Soccer, AFL, Netball, and Volleyball, with multiple saved teams.

Everything saves automatically to your browser. No account, no server, nothing leaves your device.

## Run it locally

You need Node.js installed (https://nodejs.org, the LTS version is fine).

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## Put it online (free)

1. Create a free account at https://github.com and make a new empty repository.
2. In this folder, run:
   ```bash
   git init
   git add .
   git commit -m "Minutes Manager"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to https://vercel.com, sign in with GitHub, click "Add New Project", and pick your repo. Vercel detects Vite automatically. Click Deploy.
4. You'll get a live URL like `your-app.vercel.app`. Every time you `git push`, it redeploys.

Netlify (https://netlify.com) works the same way if you prefer.

## Add it to a phone home screen

Open the live URL in the phone browser.
- iPhone (Safari): Share button, then "Add to Home Screen".
- Android (Chrome): menu, then "Install app" or "Add to Home Screen".

It launches full screen like a native app.

## How the minutes math works

- **On court** is how many players are on the field/court at once.
- **Player-minutes to fill** = match length x on-court count. That's the total time you're distributing.
- The balance bar tells you if you're balanced, short, or over.
- **Lock** a player to pin their minutes so they don't move when you adjust others. Good for locking your starters, then spreading remaining time across the bench.
- **Even split** divides remaining time equally across unlocked players.
