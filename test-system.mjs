import https from 'https';

const apiKey = "REMOVED_GOOGLE_API_KEY";
const model = "gemini-2.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const data = JSON.stringify({
    system_instruction: { parts: [{ text: "Eres un asistente cofrade." }] },
    contents: [{ parts: [{ text: "Hola" }] }]
});

const req = https.request(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log("Response Status:", res.statusCode);
        console.log("Response Body:", body);
    });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
