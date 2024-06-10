package scrapper

import (
	"io/ioutil"
	"net/http"
)

func SendRequest(targetUrl string, cookieValue string) (string, error) {
	// Créer une nouvelle requête HTTP
	req, err := http.NewRequest("GET", targetUrl, nil)
	if err != nil {
		return "", err
	}

	// Créer un nouveau cookie
	cookie := &http.Cookie{
		Name:  "MoodleSession",
		Value: cookieValue,
	}

	// Ajouter le cookie à la requête
	req.AddCookie(cookie)

	// Envoyer la requête
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Lire le corps de la réponse
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}
