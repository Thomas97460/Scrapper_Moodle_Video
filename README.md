# Scrapper_Moodle_Video
## Introduction
Ce projet utilise Puppeteer et Node.js pour automatiser la capture d'écran et le téléchargement d'audio à partir de pages web spécifiques hébergées sur Moodle. Deux scripts principaux sont fournis :

screener.js : Capture des captures d'écran et télécharge des fichiers audio à partir d'une URL spécifique.
loop_screener.js : Lit un fichier de configuration contenant des URL et des dossiers de destination, puis exécute screener.js pour chaque entrée du fichier.
Prérequis
Node.js v16 ou supérieur
npm (gestionnaire de paquets de Node.js)
Accès à une instance Moodle avec les cookies de session nécessaires

## Installation
Clonez ce dépôt sur votre machine locale.
Installez les dépendances nécessaires en exécutant la commande suivante dans le répertoire du projet :
```bash
npm install
```

## Utilisation
### Exécution de screener.js
screener.js prend des arguments en ligne de commande pour définir l'URL cible, le dossier de destination, les cookies de session, et le délai d'attente entre les captures d'écran. Voici un exemple d'utilisation :

```bash
node screener.js -url="http://example.com/index.html" -folder="captures" -session="votre_session_cookie" -id="votre_id_cookie" -timeout=4000
```

### Exécution de loop_screener.js
loop_screener.js lit un fichier de configuration et exécute screener.js pour chaque entrée du fichier. Voici un exemple d'utilisation :

```bash
node loop_screener.js -file="config.txt" -session="votre_session_cookie" -id="votre_id_cookie" -timeout=4000
```

## Fonctionnement des scripts
### screener.js
Lance un navigateur avec Puppeteer.
Ouvre une nouvelle page et définit les cookies de session.
Se rend à l'URL spécifiée et attend que le réseau soit inactif.
Gère les popups éventuels et clique sur le bouton de lecture.
Capture des captures d'écran de la zone de contenu et télécharge les fichiers audio associés.
Répète le processus jusqu'à ce que le bouton "Next" soit désactivé.

### loop_screener.js
Lit un fichier de configuration ligne par ligne.
Pour chaque ligne, extrait l'URL et le dossier de destination.
Exécute screener.js avec les paramètres extraits.

## Paramètres des scripts
### Paramètres de screener.js
-url : URL de la page à capturer.
-folder : Dossier de destination pour les captures d'écran et les fichiers audio.
-session : Cookie de session pour l'authentification Moodle.
-id : Cookie d'identification pour Moodle.
-timeout : Délai d'attente entre chaque capture d'écran (en millisecondes).
### Paramètres de loop_screener.js
-file : Chemin vers le fichier de configuration contenant les URL et les dossiers de destination.
-session : Cookie de session pour l'authentification Moodle.
-id : Cookie d'identification pour Moodle.
-timeout : Délai d'attente entre chaque capture d'écran (en millisecondes).

Le fichier de configuration pour loop_screener.js doit avoir le format suivant :
http://example.com/index.html | captures1
http://example.com/other.html | captures2
Chaque ligne contient une URL et un dossier de destination séparés par |.