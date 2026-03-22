import fs from 'fs';
const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M5YTcxMGUxN2MwYzQ4NzdhYWZmM2VmNjlkZjJiYTZiEgsSBxDG9c3UnAcYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDE1MDA5NDQzMTc5NzI5MTA1NQ&filename=&opi=96797242";
const response = await fetch(url);
const html = await response.text();
fs.writeFileSync("C:\\Users\\Kshitij Parkhe\\.gemini\\antigravity\\brain\\21bd44d4-fd40-42c7-927c-e4e378c063bf\\stitch_dashboard.html", html);
