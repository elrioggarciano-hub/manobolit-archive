const puppeteer = require('puppeteer-core');
const path = require('path');
const crypto = require('crypto');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, '..', 'public', 'manual', 'screenshots');

const secret = 'a18d6b5e3c06cdf8c74d14daac809efe84b1ac5b5524213d23c7b7100bd69180';
const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
const signature = crypto.createHmac('sha256', secret).update(String(expiresAt)).digest('hex');
const token = `${expiresAt}.${signature}`;

async function run() {
  console.log('Launching browser with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 850 }
  });

  const page = await browser.newPage();

  // Set the admin session cookie
  await page.setCookie({
    name: 'admin_session',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  });

  console.log('Navigating to http://localhost:3000/admin ...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  const adminEntriesPath = path.join(OUT_DIR, 'fig8_admin_entries.png');
  await page.screenshot({ path: adminEntriesPath });
  console.log('Saved fig8_admin_entries.png');

  console.log('Navigating to http://localhost:3000/admin/new ...');
  await page.goto('http://localhost:3000/admin/new', { waitUntil: 'networkidle2' });
  const adminNewPath = path.join(OUT_DIR, 'fig9_admin_new.png');
  await page.screenshot({ path: adminNewPath });
  console.log('Saved fig9_admin_new.png');

  await browser.close();
  console.log('Done capturing admin pages!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

