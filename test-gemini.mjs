import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "REMOVED_GOOGLE_API_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        console.log("Testing gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hola");
        console.log("Success with 1.5-flash:", result.response.text());
    } catch (e) {
        console.error("Error with 1.5-flash:", e.message);

        try {
            console.log("Testing gemini-pro...");
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hola");
            console.log("Success with gemini-pro:", result.response.text());
        } catch (e2) {
            console.error("Error with gemini-pro:", e2.message);
        }
    }
}

test();
