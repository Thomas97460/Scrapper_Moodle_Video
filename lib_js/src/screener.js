const puppeteer = require('puppeteer');

// Get the command-line arguments
const args = process.argv.slice(2);

const cookies = args.reduce((obj, arg) => {
  const [key, value] = arg.split('=');
  obj[key.replace('-', '')] = value;
  return obj;
}, {});

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
  await page.screenshot({ path: 'screenshot.png' });

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

    // // Sélectionner à nouveau tous les éléments de la barre latérale
    // const sidebarItems = await page.$$('.slide-item-view');

    // // Trouver le aria-label maximum
    // for (let item of sidebarItems) {
    //   const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), item);
    //   console.log(ariaLabel)
    //   const ariaLabelNumber = Number(ariaLabel);
    //   if (ariaLabelNumber > maxAriaLabel) {
    //     maxAriaLabel = ariaLabelNumber;
    //   }
    //   console.log(maxAriaLabel);
    // }
    // Sélectionner tous les éléments avec la classe "progressbar__label"
    const progressBars = await page.$$('.progressbar__label');

    let maxNumber = 0;

    for (let progressBar of progressBars) {
      // Récupérer la valeur de l'attribut aria-label
      const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), progressBar);

      // Utiliser une expression régulière pour extraire les chiffres
      const match = ariaLabel.match(/(\d+) \/ (\d+)/);

      if (match) {
        const currentNumber = Number(match[1]);
        const totalNumber = Number(match[2]);

        // Mettre à jour le nombre maximum si nécessaire
        if (totalNumber > maxNumber) {
          maxNumber = totalNumber;
        }
      }
      maxAriaLabel = maxNumber;
    }

    console.log(`Nombre de slides : ${maxNumber}`);
  }
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  let item_used = {};
  // Parcourir chaque élément
  for (let i = 0; i <= maxAriaLabel; i++) {
    // Récupérer la liste des éléments à chaque itération
    const elements = await page.$$('.slide-item-view__title');

    // Sélectionner l'élément avec le aria-label correspondant
    const item = await Promise.all(elements.map(async element => {
      const ariaLabel = await element.evaluate(el => el.getAttribute('aria-label'));
      const testResult = new RegExp(`^${i+1}\.`).test(ariaLabel);      
      console.log(`aria-label: ${ariaLabel}, test result: ${testResult}`);
      return testResult ? element : null;
    })).then(results => results.find(result => result !== null));

    // console.log(item);
    if (item && !item_used[i]) {
      // Cliquer sur l'élément
      await item.click();

      // Attendre un peu pour que la page se charge
      await new Promise(resolve => setTimeout(resolve, 500));

      // Sélectionner l'élément avec la classe content-area
      const contentAreas = await page.$$('.content-area');
      if (contentAreas.length > 0) {
        const contentArea = contentAreas[0];

        // Faire une capture d'écran de l'élément
        await page.setViewport({ width: 1920, height: 1080 });
        await contentArea.screenshot({ path: `screenshot${i}.jpg`, quality: 100, type: 'jpeg'});
        item_used[i] = true;
      }
    }
    await page.evaluate(() => {
      const container = document.querySelector('div[style*="padding-top"]');
      let paddingTop = parseInt(container.dataset.paddingTop || container.style.paddingTop, 10);
      console.log(`Avant: ${paddingTop}`);
      paddingTop += 71; // Ajustez le nombre au besoin
      container.style.paddingTop = `${paddingTop}px`;
      container.dataset.paddingTop = paddingTop;
      console.log(`Après: ${container.style.paddingTop}`);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("\n");
  }

  // Fermer le navigateur
  await browser.close();
})();