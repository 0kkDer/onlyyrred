# yrred creator profile

Social links are shown in this order: TikTok, YouTube, Instagram, and Discord. YouTube stats are live. TikTok, Instagram, and Discord figures are editable in `app.js`.

## Connect YouTube stats

1. Revoke the API key that was pasted into chat. Create a new key in Google Cloud and restrict it to the YouTube Data API v3. [MISALNYA KENA BOCOR API NYA]
2. Open `.env` in this folder and replace `paste_your_new_key_here` with your new key. Do not paste the key into `app.js`, `index.html`, or chat. `.env` is excluded from Git and blocked by the local web server.
3. Stop the server with Ctrl+C, then run `python server.py` from this folder.
4. Open `http://127.0.0.1:8000`.

YouTube subscriber count, total views, video count, and the latest public upload are requested from the YouTube Data API. The server caches results for five minutes, so updates are periodic rather than instant. If the API key is missing or invalid, the page marks YouTube data as unavailable.

## Edit social stats

Change the values under each platform in the `channels` array in `app.js`. Only the YouTube row is replaced by live API results.
