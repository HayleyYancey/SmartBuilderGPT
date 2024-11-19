async function askChatGPT(studentText) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    });
 
    const page = await browser.newPage();
 
    const analysisCriteria = `
    Please analyze the following text. Use the format below in your response:
 
    Redundant Phrases:
    - [list redundant phrases]
 
    Suggestions for Conciseness:
    - [list suggestions]
 
    Clarity Issues:
    - [list unclear sentences]
 
    Here is the text: `;
 
    const fullPrompt = `${analysisCriteria}\n\n${studentText}`;
 
    try {
        await page.goto('https://chat.openai.com/chat', { waitUntil: 'networkidle2', timeout: 90000 });
 
        // Wait for the ChatGPT input box
        await page.waitForSelector('textarea[placeholder="Message ChatGPT"]', { timeout: 60000 });
 
        // Set the prompt
        await page.evaluate((promptText) => {
            const textarea = document.querySelector('textarea[placeholder="Message ChatGPT"]');
            textarea.value = promptText;
            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);
        }, fullPrompt);
 
        // Click the send button
        await page.click('button[data-testid="fruitjuice-send-button"]');
 
        // Wait for ChatGPT's response
        const responseSelector = 'div[data-message-author-role="assistant"] .markdown.prose';
        await page.waitForSelector(responseSelector, { timeout: 300000 });
 
        // Get the response text
        const response = await page.evaluate(() => {
            const responseElement = document.querySelector('div[data-message-author-role="assistant"] .markdown.prose');
            return responseElement ? responseElement.innerText : 'No response found.';
        });
 
        await browser.close();
        return { analysis: response };
    } catch (error) {
        console.error('Error in Puppeteer script:', error);
        await browser.close();
        return { error: error.message, input: studentText };
    }
}
 
module.exports = { askChatGPT };