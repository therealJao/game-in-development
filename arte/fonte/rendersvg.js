const { chromium } = require('playwright');
(async () => {
  const [svg, png, w, h] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  await p.goto('file://' + process.cwd() + '/' + svg);
  await p.waitForTimeout(900);
  await p.screenshot({ path: png });
  await b.close();
})();
