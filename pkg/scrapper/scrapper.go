package scrapper

import (
	"io"
	"net/http"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

func SendRequest(target_url string, cookie_moodle_session string, cookie_moodle_id string) (string, error) {
	// Créer une nouvelle requête HTTP
	req, err := http.NewRequest("GET", target_url, nil)
	if err != nil {
		return "", err
	}

	// Créer 2 nouveaux cookies
	cookie1 := &http.Cookie{
		Name:  "MoodleSession",
		Value: cookie_moodle_session,
	}
	cookie2 := &http.Cookie{
		Name:  "MOODLEID1_",
		Value: cookie_moodle_id,
	}

	// Ajouter les cookies à la requête
	req.AddCookie(cookie1)
	req.AddCookie(cookie2)

	// Envoyer la requête
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Lire le corps de la réponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func IsConnected(body string) bool {
	return strings.Contains(body, "Déconnexion")
}

func GetName(body string) (string, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(body))

	if err != nil {
		panic(err)
	}
	var name string
	doc.Find(".logininfo a:first-child").Each(func(i int, s *goquery.Selection) {
		name = s.Text()
	})
	return name, nil
}
