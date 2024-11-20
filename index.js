const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const express = require('express');
const cors = require('cors');
 
const app = express();
 
// Puppeteer setup
puppeteer.use(StealthPlugin());
 
// Middleware to parse JSON and enable CORS
app.use(cors());
app.use(express.json());
 
// Main route to handle incoming requests
app.post('/', async (req, res) => {
    const { text } = req.body; // Input text from the client
    console.log('Received text:', text);
 
    if (!text) {
        return res.status(400).json({ error: 'No text provided.' });
    }
 
    try {
        // Call Puppeteer function
        const analysis = await analyzeTextWithPuppeteer(text);
        res.json({ analysis }); // Send analysis as the response
    } catch (error) {
        console.error('Error during Puppeteer processing:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
 
// Puppeteer function to analyze text
async function analyzeTextWithPuppeteer(inputText) {
    const browser = await puppeteer.launch({
        headless: true, // Run in headless mode for servers
        args: [
            '--no-sandbox', // Required for Render
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        executablePath: process.env.CHROMIUM_PATH || undefined // Use Render's Chromium or system default
    });
 
    const page = await browser.newPage();
 
    try {
        // Go to ChatGPT
        await page.goto('https://chat.openai.com/chat', { waitUntil: 'networkidle2' });
 
        // Simulate user input and send the request
        await page.type('div#prompt-textarea', inputText);
        await page.click('button[data-testid="send-button"]');
        // Wait for and extract the response
        const copyBtn = 'button[data-testid="copy-turn-action-button"]';
        await page.waitForSelector(copyBtn, { timeout: 30000 });
 
        const response = await page.evaluate(() => {
            const responseElement = document.querySelector('div[data-message-author-role="assistant"] .markdown.prose');
            return responseElement ? responseElement.textContent : 'No response received.';
        });
 
        await browser.close();
        return response; // Return the response
    } catch (error) {
        await browser.close();
        console.error('Puppeteer error:', error);
        throw error;
    }
}
 
// Bind the server to the Render-provided port
const PORT = process.env.PORT || 3000; // Use Render's PORT or default to 3000 locally
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});