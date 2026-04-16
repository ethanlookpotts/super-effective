const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const dir = '/home/user/super-effective/screenshots';

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  async function seedPage(page) {
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('se_theme');
      const store = {
        playthroughs: [{
          id: 'r1', name: 'Kanto Run', gameId: 'frlg', starter: 'charmander',
          party: [
            { n: 3, name: 'VENUSAUR', types: ['Grass','Poison'], moves: [
              { name: 'Giga Drain', type: 'Grass', cat: 'Special' },
              { name: 'Sludge Bomb', type: 'Poison', cat: 'Physical' },
              { name: 'Sleep Powder', type: 'Grass', cat: 'Status' },
              { name: 'Leech Seed', type: 'Grass', cat: 'Status' }
            ], level: 40 },
            { n: 94, name: 'GENGAR', types: ['Ghost','Poison'], moves: [
              { name: 'Shadow Ball', type: 'Ghost', cat: 'Physical' },
              { name: 'Psychic', type: 'Psychic', cat: 'Special' },
              { name: 'Thunderbolt', type: 'Electric', cat: 'Special' },
              { name: 'Hypnosis', type: 'Psychic', cat: 'Status' }
            ], level: 38 },
            { n: 130, name: 'GYARADOS', types: ['Water','Flying'], moves: [
              { name: 'Surf', type: 'Water', cat: 'Special' },
              { name: 'Dragon Dance', type: 'Dragon', cat: 'Status' },
              { name: 'Earthquake', type: 'Ground', cat: 'Physical' },
              { name: 'Return', type: 'Normal', cat: 'Physical' }
            ], level: 39 },
            { n: 59, name: 'ARCANINE', types: ['Fire'], moves: [
              { name: 'Flamethrower', type: 'Fire', cat: 'Special' },
              { name: 'Extreme Speed', type: 'Normal', cat: 'Physical' },
              { name: 'Crunch', type: 'Dark', cat: 'Special' },
              { name: 'Iron Tail', type: 'Steel', cat: 'Physical' }
            ], level: 40 },
            { n: 65, name: 'ALAKAZAM', types: ['Psychic'], moves: [
              { name: 'Psychic', type: 'Psychic', cat: 'Special' },
              { name: 'Shadow Ball', type: 'Ghost', cat: 'Physical' },
              { name: 'Calm Mind', type: 'Psychic', cat: 'Status' },
              { name: 'Recover', type: 'Normal', cat: 'Status' }
            ], level: 39 },
            { n: 76, name: 'GOLEM', types: ['Rock','Ground'], moves: [
              { name: 'Earthquake', type: 'Ground', cat: 'Physical' },
              { name: 'Rock Slide', type: 'Rock', cat: 'Physical' },
              { name: 'Brick Break', type: 'Fighting', cat: 'Physical' },
              { name: 'Double-Edge', type: 'Normal', cat: 'Physical' }
            ], level: 38 }
          ],
          pc: [],
          recents: [
            {n:121,name:'STARMIE',types:['Water','Psychic']},
            {n:94,name:'GENGAR',types:['Ghost','Poison']},
            {n:3,name:'VENUSAUR',types:['Grass','Poison']}
          ]
        }],
        activePtId: 'r1'
      };
      localStorage.setItem('se_v1', JSON.stringify(store));
    });
    await page.reload();
    await page.waitForTimeout(800);
  }

  const mp = await mobile.newPage();
  await seedPage(mp);

  // 1. Search Starmie → party matchup (README: "search-party-matchup.png")
  await mp.fill('[aria-label="Search Pokémon"]', 'starmie');
  await mp.waitForTimeout(600);
  const starmie = mp.locator('#s-scroll').getByText('STARMIE').first();
  if (await starmie.count() > 0) { await starmie.click(); await mp.waitForTimeout(600); }
  // Scroll to party matchup section
  await mp.evaluate(() => { document.querySelector('#s-scroll').scrollTop = 800; });
  await mp.waitForTimeout(300);
  await mp.screenshot({ path: `${dir}/search-party-matchup.png` });

  // 2. Search Gengar detail (README: "search-gengar-detail.png")
  await mp.evaluate(() => { clearSearch(); });
  await mp.waitForTimeout(200);
  await mp.fill('[aria-label="Search Pokémon"]', 'gengar');
  await mp.waitForTimeout(600);
  const gengar = mp.locator('#s-scroll').getByText('GENGAR').first();
  if (await gengar.count() > 0) { await gengar.click(); await mp.waitForTimeout(600); }
  await mp.screenshot({ path: `${dir}/search-gengar-detail.png` });

  // 3. Gyms page with Misty expanded (README: "gyms-misty-expanded.png")
  await mp.evaluate(() => showPage('gyms'));
  await mp.waitForTimeout(600);
  // Click Misty card
  const misty = mp.getByText('Misty').first();
  if (await misty.count() > 0) { await misty.click(); await mp.waitForTimeout(500); }
  // Scroll so Misty's expanded content is visible
  await mp.evaluate(() => {
    const el = document.querySelector('#gyms-scroll');
    const cards = document.querySelectorAll('.gym-card');
    for (const c of cards) {
      if (c.textContent.includes('Misty')) { el.scrollTop = c.offsetTop - 60; break; }
    }
  });
  await mp.waitForTimeout(300);
  await mp.screenshot({ path: `${dir}/gyms-misty-expanded.png` });

  // 4. Where Am I - Safari Zone (README: "where-am-i-safari.png")
  await mp.evaluate(() => showPage('location'));
  await mp.waitForTimeout(600);
  await mp.fill('#loc-in', 'safari');
  await mp.waitForTimeout(400);
  await mp.screenshot({ path: `${dir}/where-am-i-safari.png` });

  await browser.close();
  console.log('README screenshots done!');
})();
