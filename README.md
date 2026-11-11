# Mini Dashboard Meteo/Utenti – XMLHttpRequest

Piccola web app che usa **AJAX con XMLHttpRequest** per caricare dati da API pubbliche senza ricaricare la pagina.

## Funzionalità
- **Meteo**: si cerca una città, l'app la trova con l'API di geocoding di Open-Meteo e mostra il meteo attuale e i prossimi 5 giorni.
- **Utenti**: ricerca per nome tra gli utenti di JSONPlaceholder.
- **JSON e XML**: carica gli stessi dati da `studenti.json` (con `responseText` + `JSON.parse`) e da `studenti.xml` (con `responseXML`).
- Gestione errori: status HTTP, errori di rete (`onerror`) e timeout (`ontimeout`).
- Nella cartella `esercizi/` ci sono gli esercizi 1–4; le risposte alle domande sono in `RISPOSTE.md`.

## Tecnologie
HTML, CSS, JavaScript (XMLHttpRequest), API Open-Meteo e JSONPlaceholder, Git/GitHub, Vercel.

## Come avviare in locale
Non aprire `index.html` con doppio clic (`file://`): le richieste XHR vengono bloccate. Serve un server locale:

```bash
python -m http.server 8000
```
poi aprire http://localhost:8000 (in alternativa `npx serve` o Live Server di VS Code).

## Struttura
```
progetto-xhr/
├── index.html
├── style.css
├── app.js
├── data/            studenti.json, studenti.xml
├── esercizi/        es1–es4
├── RISPOSTE.md
├── README.md
└── .gitignore
```

## Autori
mattia belleri, classe 5ª
