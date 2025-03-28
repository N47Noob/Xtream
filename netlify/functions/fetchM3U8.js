const fetch = require('node-fetch'); // Use node-fetch for HTTP requests

module.exports = async (req, res) => {
    // Get the `id` parameter from the URL
    const { id } = req.query;
    if (!id) {
        return res.status(400).send("Error: Missing 'id' parameter.");
    }

    // Construct M3U8 URL dynamically based on ID
    const m3u8Url = `http://ktv.im:8080/live/353356645634/878998764490/${id}.m3u8`;

    try {
        const response = await fetch(m3u8Url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 15; 23106RN0DA Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch M3U8 file.');
        }

        const playlistContent = await response.text();
        const finalUrl = response.url;

        // Extract base URL with port
        const url = new URL(finalUrl);
        const baseUrl = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;

        // Fix segment URLs
        const fixedPlaylist = fixSegmentUrls(playlistContent, baseUrl);

        res.setHeader('Content-Type', 'text/plain');
        res.send(fixedPlaylist);
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

// Function to fix relative segment URLs to absolute
function fixSegmentUrls(playlist, baseUrl) {
    const lines = playlist.split('\n');
    const fixedPlaylist = [];

    lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            // Convert relative URLs to absolute
            try {
                new URL(line); // Check if it's already a full URL
            } catch (_) {
                // It's a relative URL, so fix it
                line = new URL(line, baseUrl).href;
            }
        }
        fixedPlaylist.push(line);
    });

    return fixedPlaylist.join('\n');
}
