from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "8000"))
CACHE_TTL_SECONDS = 300
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

_cache: dict[str, object] = {"expires_at": 0.0, "data": None}


def load_local_env() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        value = value.strip().strip("\"'")
        os.environ.setdefault(name.strip(), value)


def youtube_api_get(resource: str, **params: str) -> dict:
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not api_key or api_key == "paste_your_new_key_here":
        raise MissingAPIKey

    query = urlencode({**params, "key": api_key})
    request = Request(
        f"{YOUTUBE_API_BASE}/{resource}?{query}",
        headers={"User-Agent": "yrred-creator-profile/1.0"},
    )
    with urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if "error" in payload:
        raise YouTubeAPIError
    return payload


def fetch_youtube_stats() -> dict:
    channel_response = youtube_api_get(
        "channels",
        part="snippet,statistics,contentDetails",
        forHandle="@onlyyrred",
    )
    channels = channel_response.get("items", [])
    if not channels:
        raise ChannelNotFound

    channel = channels[0]
    statistics = channel.get("statistics", {})
    thumbnails = channel.get("snippet", {}).get("thumbnails", {})
    profile_image = (
        thumbnails.get("high", {}).get("url")
        or thumbnails.get("medium", {}).get("url")
        or thumbnails.get("default", {}).get("url")
    )
    uploads_playlist = channel.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
    latest_upload = None

    if uploads_playlist:
        uploads_response = youtube_api_get(
            "playlistItems",
            part="snippet",
            playlistId=uploads_playlist,
            maxResults="1",
        )
        uploads = uploads_response.get("items", [])
        if uploads:
            snippet = uploads[0].get("snippet", {})
            video_id = snippet.get("resourceId", {}).get("videoId")
            if video_id:
                latest_upload = {
                    "title": snippet.get("title", "Latest upload"),
                    "publishedAt": snippet.get("publishedAt"),
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnailUrl": (
                        snippet.get("thumbnails", {}).get("high", {}).get("url")
                        or snippet.get("thumbnails", {}).get("medium", {}).get("url")
                        or snippet.get("thumbnails", {}).get("default", {}).get("url")
                    ),
                }

    return {
        "subscribers": statistics.get("subscriberCount"),
        "views": statistics.get("viewCount"),
        "videos": statistics.get("videoCount"),
        "profileImage": profile_image,
        "latestUpload": latest_upload,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


class MissingAPIKey(Exception):
    pass


class ChannelNotFound(Exception):
    pass


class YouTubeAPIError(Exception):
    pass


class CreatorHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        decoded_path = unquote(urlsplit(path).path).replace("\\", "/")
        if any(part.startswith(".") for part in decoded_path.split("/")):
            return str(ROOT / "__blocked_static_file__")

        resolved_path = Path(super().translate_path(path)).resolve()
        try:
            resolved_path.relative_to(ROOT)
        except ValueError:
            return str(ROOT / "__blocked_static_file__")
        return str(resolved_path)

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/youtube/stats":
            self.handle_youtube_stats()
            return
        super().do_GET()

    def handle_youtube_stats(self) -> None:
        now = time.monotonic()
        if _cache["data"] is not None and now < _cache["expires_at"]:
            self.send_json(200, _cache["data"])
            return

        try:
            data = fetch_youtube_stats()
        except MissingAPIKey:
            self.send_json(503, {"error": "Add YOUTUBE_API_KEY to your local .env file."})
            return
        except ChannelNotFound:
            self.send_json(404, {"error": "YouTube channel @onlyyrred was not found."})
            return
        except (HTTPError, URLError, TimeoutError, YouTubeAPIError, ValueError) as error:
            self.log_error("YouTube API request failed: %s", error)
            self.send_json(502, {"error": "YouTube stats are unavailable. Check the API key, API access, and quota."})
            return

        _cache["data"] = data
        _cache["expires_at"] = now + CACHE_TTL_SECONDS
        self.send_json(200, data)


    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    load_local_env()
    handler = partial(CreatorHandler, directory=str(ROOT))
    with ThreadingHTTPServer((HOST, PORT), handler) as server:
        print(f"yrred profile running at http://{HOST}:{PORT}")
        print("YouTube API key is read from the local environment and is never sent to the browser.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
