package main

import (
	"flag"
	"fmt"

	"github.com/fatih/color"

	"github.com/Thomas97460/Scrapper_Moodle_Video/pkg/scrapper"
)

const URL_MOODLE = "https://moodle.univ-tlse3.fr"

func main() {
	// Définition des paramètres
	url := flag.String("url", "", "URL to scrape")
	cookie_moodle_session := flag.String("session", "", "Cookie Moodle to use")
	cookie_moodle_id := flag.String("id", "", "Cookie to use")
	flag.Parse()

	// Récupérer le corps de la réponse
	body, err := scrapper.SendRequest(URL_MOODLE, *cookie_moodle_session, *cookie_moodle_id)
	if err != nil {
		panic(err)
	}

	// Afficher le nom de l'utilisateur et son statut de connexion
	color.New(color.FgHiMagenta).Println("Début du scrapping : " + *url)
	to_print := "Status de la connexion :"
	nom, err := scrapper.GetName(body)
	if scrapper.IsConnected(body) && err == nil {
		fmt.Println(to_print + " Connecté en tant que " + color.New(color.FgHiGreen).Sprint(nom))
	} else {
		fmt.Println(to_print + " " + color.New(color.FgHiRed).Sprint("Non connecté"))
		return
	}

	// Récupérer les liens des vidéos

}
