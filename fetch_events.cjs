const fs = require('fs');
const https = require('https');

const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2EzNmM4NzAwZTZlMjQyODc5ZGIyNGUzNzdiZjk2ZWIyEgsSBxDG9c3UnAcYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDE1MDA5NDQzMTc5NzI5MTA1NQ&filename=&opi=96797242";
const dest = "C:\\Users\\Kshitij Parkhe\\.gemini\\antigravity\\brain\\21bd44d4-fd40-42c7-927c-e4e378c063bf\\stitch_events.html";

https.get(url, (res) => {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log("Stitch Events HTML downloaded successfully to: " + dest);
    });
}).on('error', (err) => {
    console.error("Error downloading file:", err.message);
});
