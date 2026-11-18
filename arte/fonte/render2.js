const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + process.cwd() + '/banner.svg');
  await p.waitForTimeout(1000);
  await p.screenshot({ path: 'blinder_banner_1920x1080.png' });
  await b.close();
})();
