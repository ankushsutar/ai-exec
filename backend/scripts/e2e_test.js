const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:4200';
const PROMPTS = [
  'What is the total revenue for last month?',
  'top 5 devices by revenue',
  'Show me transactions for device BOX_123 yesterday',
  'average signal strength for each operator'
];

async function runE2E() {
  console.log('Starting E2E Verification via Puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true if you don't want to see the browser
    slowMo: 50 // Adds a slight delay so you can see the typing
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2' });

    for (let i = 0; i < PROMPTS.length; i++) {
      const prompt = PROMPTS[i];
      console.log(`[${i + 1}/${PROMPTS.length}] Testing: "${prompt}"`);

      // 1. Enter prompt
      const inputSelector = 'footer input[type="text"]';
      await page.waitForSelector(inputSelector);
      await page.click(inputSelector);
      
      // Clear existing text (Select all + Backspace)
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      
      await page.type(inputSelector, prompt);

      // 2. Submit
      const submitSelector = 'footer button.absolute.right-1\\.5'; // Note: dot in class needs escape in some contexts, but usually just .right-1.5 works
      await page.waitForSelector(submitSelector);
      await page.click(submitSelector);

      // 3. Wait for result (Loading spinner disappears)
      console.log('    Waitng for AI response...');
      await page.waitForSelector('app-loading-spinner', { visible: true });
      await page.waitForSelector('app-loading-spinner', { hidden: true, timeout: 60000 });

      // 4. Verification Check
      const lastMessage = await page.$('main > div:last-of-type');
      if (lastMessage) {
        console.log('    ✅ Response received.');
      }

      // Take a screenshot
      const screenPath = path.join(__dirname, `test_result_${i + 1}.png`);
      await page.screenshot({ path: screenPath });
      console.log(`    📸 Screenshot saved to: ${screenPath}\n`);

      // Small delay between tests
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('All E2E tests completed successfully!');
  } catch (error) {
    console.error('E2E Test Failed:', error.message);
  } finally {
    console.log('Closing browser in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
}

runE2E();
