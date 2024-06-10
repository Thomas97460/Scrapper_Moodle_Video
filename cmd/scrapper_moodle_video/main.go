package main

import (
	"flag"

	"github.com/Thomas97460/Scrapper_Moodle_Video/pkg/scrapper"
)

func main() {
	// Définition des paramètres
	url := flag.String("url", "", "URL to scrape")
	cookie := flag.String("cookie", "", "Cookie to use")
	flag.Parse()

	body, err := scrapper.SendRequest(*url, *cookie)
	if err != nil {
		panic(err)
	}
	println(body)
}
