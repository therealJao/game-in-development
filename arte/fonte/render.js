const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  for (const [svg, png] of [['blinder_icon.svg','blinder_icon_1024.png'],['blinder_icon_notext.svg','blinder_icon_notext_1024.png']]) {
    await p.goto('file://' + process.cwd() + '/' + svg);
    await p.waitForTimeout(600);
    await p.screenshot({ path: png, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  }
  await b.close();
})();
