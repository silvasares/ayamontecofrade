import https from 'https';

const apiKey = "REMOVED_GOOGLE_API_KEY";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log("Available models:", JSON.stringify(JSON.parse(body), null, 2));
    });
}).on('error', (e) => {
    console.error("Error:", e);
});
