const puppeteer = require('puppeteer');

// Get the command-line arguments
const args = process.argv.slice(2);

const cookies = args.reduce((obj, arg) => {
  const [key, value] = arg.split('=');
  obj[key.replace('-', '')] = value;
  return obj;
}, {});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the cookies
  await page.setCookie({
    name: 'MoodleSession',
    value: cookies.session,
    domain: 'moodle.univ-tlse3.fr',
  });
  await page.setCookie({
    name: 'MOODLEID1_',
    value: cookies.id,
    domain: 'moodle.univ-tlse3.fr',
  });

  await page.goto(cookies.url, { waitUntil: 'networkidle0' }); // Wait until network is idle

  // Check if the popup exists
  const popupSelector = '.message-box';
  if (await page.$(popupSelector) !== null) {
    // Click the "No" button in the popup
    const noButtonSelector = '.message-box-buttons-panel__buttons button:nth-child(2)';
    await page.click(noButtonSelector);

    // Wait for the popup to disappear
    await page.waitForSelector(popupSelector, { hidden: true });

    // Check again if the popup exists
    if (await page.$(popupSelector) !== null) {
      console.log('The popup is still open.');
    } else {
      console.log('The popup is closed.');
    }
  }

  // Suppose que le bouton de lecture a la classe "launch-screen-button"
  const playButtonSelector = ".launch-screen-button";

  // Clique sur le bouton de lecture
  await page.click(playButtonSelector);

  let lastAriaLabel = -1;
  let maxAriaLabel = 0;

  // Faire défiler la barre latérale jusqu'à ce qu'il n'y ait plus de nouveaux éléments à charger
  while (maxAriaLabel > lastAriaLabel) {
    lastAriaLabel = maxAriaLabel;

    // Faire défiler la barre latérale
    await page.evaluate(() => {
      let sidePanel = document.querySelector('.universal-side-panel__outline-container');
      sidePanel.scrollTop = sidePanel.scrollHeight;
    });

    // Attendre un peu pour que les nouveaux éléments se chargent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Sélectionner à nouveau tous les éléments de la barre latérale
    const sidebarItems = await page.$$('.slide-item-view');

    // Trouver le aria-label maximum
    for (let item of sidebarItems) {
      const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), item);
      const ariaLabelNumber = Number(ariaLabel);
      if (ariaLabelNumber > maxAriaLabel) {
        maxAriaLabel = ariaLabelNumber;
      }
    }
  }

  // Parcourir chaque élément
  for (let i = 0; i <= maxAriaLabel; i++) {
    // Sélectionner l'élément avec le aria-label correspondant
    const item = await page.$(`.slide-item-view[aria-label="${i}"]`);

    if (item) {
      // Cliquer sur l'élément
      await item.click();

      // Attendre un peu pour que la page se charge
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sélectionner l'élément avec la classe content-area
      const contentAreas = await page.$$('.content-area');
      if (contentAreas.length > 0) {
        const contentArea = contentAreas[0];

        // Faire une capture d'écran de l'élément
        await page.setViewport({ width: 1920, height: 1080 });
        await contentArea.screenshot({ path: `screenshot${i}.jpg`, quality: 100, type: 'jpeg'});
      } else {
        console.log('No elements with the class .content-area were found.');
      }
    }
  }

  // Fermer le navigateur
  await browser.close();
})();