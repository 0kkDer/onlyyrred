# yrred creator profile

Social links are shown in this order: TikTok, YouTube, Instagram, and Discord. YouTube stats are refreshed every six hours by GitHub Actions. TikTok, Instagram, and Discord figures are editable in app.js.

## Connect YouTube stats

1. Revoke any API key that was uploaded to the public repository. Create a new key in Google Cloud and restrict it to the YouTube Data API v3.
2. In GitHub, open Settings > Secrets and variables > Actions and add a repository secret named YOUTUBE_API_KEY with the new key. Never commit the key or paste it into chat.
3. Run the Refresh YouTube stats workflow once from the Actions tab. It will refresh the snapshot every six hours afterward.
4. GitHub Pages serves youtube-stats.json with the site. The page shows the snapshot update time; it does not call the YouTube API from the browser.

The workflow uses the API key only on GitHub's servers and commits the public channel stats snapshot to the Pages branch. If the key is missing or invalid, the workflow fails and the page keeps the last successful snapshot.

## Edit social stats

Change values under each platform in the channels array in app.js. Only the YouTube row is replaced by the generated snapshot.
