import { test, expect } from '@playwright/test';

test('product cards visual test', async ({ page }) => {
  await page.goto('http://localhost:8080/test-cards.html');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of product cards
  await page.screenshot({ 
    path: 'product-cards-current.png',
    fullPage: true
  });
  
  // Get product card dimensions
  const cards = await page.locator('.vect-product-card').all();
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const box = await card.boundingBox();
    console.log(`Card ${i + 1} dimensions: ${box.width}x${box.height}`);
  }
});