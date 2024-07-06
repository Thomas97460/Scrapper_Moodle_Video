const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec); // Version promisifiée de exec

// Get the command-line arguments
const args = process.argv.slice(2);

const arguments = args.reduce((obj, arg) => {
  const [key, value] = arg.split('=');
  obj[key.replace('-', '')] = value;
  return obj;
}, {});

// Chemin vers le fichier à lire
const fichier = arguments.file;

// Créer une interface de lecture
const rl = readline.createInterface({
  input: fs.createReadStream(fichier),
  output: process.stdout,
  terminal: false
});

const liste = [];

// Écouter chaque ligne du fichier
rl.on('line', (ligne) => {
    // Diviser la ligne en utilisant '|' comme séparateur
    const elements = ligne.split(' | ');
    
    // Vérifier si la ligne contient bien un séparateur '|'
    if (elements.length >= 2) {
      liste.push([elements[0], elements[1]]);
    }
});
  
// Écouter la fin de la lecture du fichier
rl.on('close', async () => { // Transformez cette fonction en asynchrone
    for (const element of liste) {
      const url = element[0];
      const folder = element[1];
      const command = `node screener.js -url="${url}" -folder=${folder} -session=${arguments.session} -id=${arguments.id} -timeout=${arguments.timeout}`;
      console.log(`Commande à exécuter: ${command}`);
      try {
        const { stdout, stderr } = await execAsync(command); // Attendre la fin de l'exécution
        console.log(`Sortie: ${stdout}`);
        if (stderr) {
          console.error(`Erreur: ${stderr}`);
        }
      } catch (error) {
        console.error(`Erreur d'exécution: ${error}`);
      }
    }
  });