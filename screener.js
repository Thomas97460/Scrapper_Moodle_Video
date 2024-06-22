const puppeteer = require('puppeteer');
// const fs = require('fs').promises;
let fetch;
import('node-fetch').then(module => {
    fetch = module.default;
});
const path = require('path');
const fs = require('fs/promises');

// Get the command-line arguments
const args = process.argv.slice(2);

const arguments = args.reduce((obj, arg) => {
  const [key, value] = arg.split('=');
  obj[key.replace('-', '')] = value;
  return obj;
}, {});

// Préparation requêtes pour télécharger audio
const cookies = `MoodleSession=${arguments.session}; MOODLEID1_=${arguments.id}`;
const base_audio_url = arguments.url.replace('index.html', '');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Set the arguments
  await page.setCookie({
    name: 'MoodleSession',
    value: arguments.session,
    domain: 'moodle.univ-tlse3.fr',
  });
  await page.setCookie({
    name: 'MOODLEID1_',
    value: arguments.id,
    domain: 'moodle.univ-tlse3.fr',
  });

  // Avant de prendre une capture d'écran, assurez-vous que le dossier existe
  const folderPath = `${arguments.folder}`; // Assurez-vous que `arguments.folder` contient le chemin correct
  await fs.mkdir(folderPath, { recursive: true });

  await page.goto(arguments.url, { waitUntil: 'networkidle0' }); // Wait until network is idle

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

  let i = 0;
  let isDisabled = false;
  while(!isDisabled) {
    i++;
    // Trouver le bouton "Next"
    const nextButton = await page.$('.universal-control-panel__button_next:not([disabled])');

    if (nextButton) {
      // Attendre que le contenu se charge
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Prendre une capture d'écran de la zone de contenu
      const contentArea = await page.$('.content-area');
      if (contentArea) {
        await fs.mkdir(`${folderPath}/${i}`, { recursive: true });
      
        await page.setViewport({ width: 1920, height: 1080 });
      
        await contentArea.screenshot({ path: `${folderPath}/${i}/screenshot.jpg`, quality: 100, type: 'jpeg'});
        console.log(`Capture d'écran ${i}`);
      } else {
        console.log(`Échec de la capture d'écran ${i} : zone de contenu non trouvée.`);
      }

    // Création d'un AbortController pour gérer le timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // Définir un timeout de 30 secondes

    try {
      console.log(`Téléchargement de l'audio ${i}...`);
      const audioUrl = `${base_audio_url}data/sound${i}.mp3`;
      console.log(audioUrl);

      // Passer le signal d'annulation à fetch
      const response = await fetch(audioUrl, {
        headers: {
          'Cookie': cookies
        },
        signal: controller.signal
      });

      if (response.ok) {
        console.log(`Audio ${i} en cours de téléchargement...`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const audioFilePath = `${folderPath}/${i}/sound${i}.mp3`;
        await fs.writeFile(audioFilePath, buffer);
        console.log(`Audio ${i} téléchargé avec succès.`);
      } else {
        console.log(`Échec du téléchargement de l'audio ${i}.`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Téléchargement de l'audio ${i} annulé car il a dépassé 30 secondes.`);
      } else {
        console.log(`Échec du téléchargement de l'audio ${i} en raison d'une erreur: ${error.message}`);
      }
    } finally {
      clearTimeout(timeout); // Nettoyer le timeout pour éviter les fuites de mémoire
    }

    await new Promise(resolve => setTimeout(resolve, arguments.timeout));

    // Alternative : Utiliser Puppeteer pour télécharger le fichier audio
    // const audioUrl = `${base_audio_url}data/sound${i}.mp3`;
    // const audioResponse = await page.goto(audioUrl, {
    //   waitUntil: 'networkidle2'
    // });
    // if (audioResponse.ok()) {
    //   const buffer = await audioResponse.buffer();
    //   const audioFilePath = path.join(folderPath, `${i}`, `sound${i}.mp3`);
    //   await fs.promises.writeFile(audioFilePath, buffer);
    //   console.log(`Audio ${i} téléchargé avec succès.`);
    // } else {
    //   console.log(`Échec du téléchargement de l'audio ${i}.`);
    // }

      // Cliquer sur le bouton "Next"
      await nextButton.click();

      // Vérifier à nouveau si le bouton "Next" est désactivé
      isDisabled = !(await page.$('.universal-control-panel__button_next:not([disabled])'));
      console.log("\n");
    } else {
      isDisabled = true;
    }
  } 

  // Fermer le navigateur
  await browser.close();
})();