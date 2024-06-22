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

  // Un ensemble pour stocker les aria-label déjà traités
  let processedAriaLabels = new Set();

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
    console.log("Selecting sidebar items...");
    const sidebarItems = await page.$$('.slide-item-view');
    console.log(`Found ${sidebarItems.length} sidebar items.`);

    // Trouver le aria-label maximum et traiter les nouveaux éléments
    for (let item of sidebarItems) {
      const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), item);
      console.log(`Processing item with ariaLabel: ${ariaLabel}`);
      const ariaLabelNumber = Number(ariaLabel);
      if (ariaLabelNumber > maxAriaLabel) {
        maxAriaLabel = ariaLabelNumber;
        console.log(`New maxAriaLabel found: ${maxAriaLabel}`);
      }

      // Si l'élément n'a pas encore été traité, le traiter
      if (!processedAriaLabels.has(ariaLabel)) {
        console.log(`Processing new ariaLabel: ${ariaLabel}`);
        processedAriaLabels.add(ariaLabel);

        // Get the current content of the .content-area element
        const oldContent = await page.evaluate(() => {
          const contentArea = document.querySelector('.content-area');
          return contentArea ? contentArea.innerHTML : '';
        });
        console.log("Old content fetched.");

        // Cliquer sur l'élément
        console.log("Clicking on item...");
        await item.click();

        // Attendre que le contenu de l'élément .content-area change
        console.log("Waiting for content area to update...");
        await page.waitForFunction(
          (oldContent) => {
            const contentArea = document.querySelector('.content-area');
            return contentArea && contentArea.innerHTML !== oldContent;
          },
          {},
          oldContent
        );
        console.log("Content area updated.");
      } else {
        console.log(`ariaLabel ${ariaLabel} has already been processed.`);
      }
    }
  }

  // Fermer le navigateur
  await browser.close();
})();