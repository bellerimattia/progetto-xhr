/*
 * Mini Dashboard Meteo/Utenti
 * Tutte le chiamate al server usano XMLHttpRequest (niente fetch, niente librerie).
 */

/* ------------------------------------------------------------------
 * Funzione riutilizzabile: una richiesta GET con callback.
 * - Crea un NUOVO oggetto XHR a ogni chiamata (Sezione 2.2 della dispensa)
 * - onSuccesso riceve la risposta, onErrore riceve un messaggio
 * ------------------------------------------------------------------ */
function richiestaGET(url, onSuccesso, onErrore) {
  // 1. Creazione dell'oggetto
  const xhr = new XMLHttpRequest();

  // 2. Definizione delle callback
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      onSuccesso(xhr);               // passo l'oggetto: chi chiama sceglie responseText o responseXML
    } else if (xhr.status === 404) {
      onErrore('Risorsa non trovata (404).');
    } else {
      onErrore('Errore HTTP ' + xhr.status + ' ' + xhr.statusText);
    }
  };
  xhr.onerror = function () {
    onErrore('Errore di rete: controlla la connessione.');
  };
  xhr.ontimeout = function () {
    onErrore('Il server non ha risposto entro 8 secondi.');
  };

  // 3. Apertura della connessione (asincrona)
  xhr.open('GET', url, true);
  xhr.timeout = 8000;

  // 4. Invio (GET → nessun body)
  xhr.send();
}

/* Scorciatoia per le API JSON: responseText + JSON.parse */
function richiestaJSON(url, onSuccesso, onErrore) {
  richiestaGET(url, function (xhr) {
    let dati;
    try {
      dati = JSON.parse(xhr.responseText);
    } catch (e) {
      onErrore('La risposta non è un JSON valido.');
      return;
    }
    onSuccesso(dati);
  }, onErrore);
}

/* Piccolo aiuto per scrivere nel box di stato */
function mostraStato(id, messaggio, eErrore) {
  const box = document.getElementById(id);
  box.textContent = messaggio;
  box.classList.toggle('errore', Boolean(eErrore));
}

/* ------------------------------------------------------------------
 * SCHEDE
 * ------------------------------------------------------------------ */
document.querySelectorAll('.scheda').forEach(function (scheda) {
  scheda.addEventListener('click', function () {
    document.querySelectorAll('.scheda').forEach(s => s.classList.remove('attiva'));
    document.querySelectorAll('.pannello').forEach(p => p.classList.remove('attivo'));
    scheda.classList.add('attiva');
    document.getElementById(scheda.dataset.pannello).classList.add('attivo');
  });
});

/* ------------------------------------------------------------------
 * METEO (Open-Meteo, nessuna API key)
 * Passo 1: cerco la città  → geocoding
 * Passo 2: chiedo il meteo → forecast con latitudine/longitudine
 * ------------------------------------------------------------------ */
const DESCRIZIONI_METEO = {
  0: 'Sereno', 1: 'Poco nuvoloso', 2: 'Parzialmente nuvoloso', 3: 'Coperto',
  45: 'Nebbia', 48: 'Nebbia con brina',
  51: 'Pioviggine leggera', 53: 'Pioviggine', 55: 'Pioviggine intensa',
  61: 'Pioggia leggera', 63: 'Pioggia', 65: 'Pioggia forte',
  71: 'Neve leggera', 73: 'Neve', 75: 'Neve forte', 77: 'Granelli di neve',
  80: 'Rovesci leggeri', 81: 'Rovesci', 82: 'Rovesci violenti',
  85: 'Rovesci di neve', 86: 'Forti rovesci di neve',
  95: 'Temporale', 96: 'Temporale con grandine', 99: 'Temporale forte con grandine'
};

function descrivi(codice) {
  return DESCRIZIONI_METEO[codice] || 'Codice meteo ' + codice;
}

document.getElementById('form-meteo').addEventListener('submit', function (evento) {
  evento.preventDefault();               // niente ricaricamento della pagina
  const citta = document.getElementById('citta').value.trim();
  if (citta === '') return;

  document.getElementById('lista-citta').innerHTML = '';
  document.getElementById('risultato-meteo').innerHTML = '';
  mostraStato('stato-meteo', 'Cerco "' + citta + '"…');

  // Parametri in query string: encodeURIComponent evita problemi con spazi e accenti
  const url = 'https://geocoding-api.open-meteo.com/v1/search'
    + '?name=' + encodeURIComponent(citta)
    + '&count=5&language=it&format=json';

  richiestaJSON(url, function (dati) {
    if (!dati.results || dati.results.length === 0) {
      mostraStato('stato-meteo', 'Nessuna città trovata con questo nome.', true);
      return;
    }
    mostraStato('stato-meteo', '');
    mostraCitta(dati.results);
    caricaMeteo(dati.results[0]);        // di default mostro la prima
  }, function (errore) {
    mostraStato('stato-meteo', errore, true);
  });
});

/* Se ci sono più città con lo stesso nome, le mostro come pulsanti */
function mostraCitta(elenco) {
  const ul = document.getElementById('lista-citta');
  ul.innerHTML = '';
  if (elenco.length < 2) return;

  elenco.forEach(function (luogo, indice) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = luogo.name + (luogo.admin1 ? ', ' + luogo.admin1 : '') + ' (' + luogo.country_code + ')';
    if (indice === 0) btn.classList.add('scelta');
    btn.addEventListener('click', function () {
      ul.querySelectorAll('button').forEach(b => b.classList.remove('scelta'));
      btn.classList.add('scelta');
      caricaMeteo(luogo);
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function caricaMeteo(luogo) {
  mostraStato('stato-meteo', 'Carico il meteo di ' + luogo.name + '…');

  const url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + luogo.latitude
    + '&longitude=' + luogo.longitude
    + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min'
    + '&forecast_days=5&timezone=auto';

  richiestaJSON(url, function (meteo) {
    mostraStato('stato-meteo', '');
    disegnaMeteo(luogo, meteo);
  }, function (errore) {
    mostraStato('stato-meteo', errore, true);
  });
}

function disegnaMeteo(luogo, meteo) {
  const box = document.getElementById('risultato-meteo');
  box.innerHTML = '';
  const c = meteo.current;

  // Blocco "adesso" (creato con createElement + textContent: niente rischio XSS)
  const adesso = document.createElement('div');
  adesso.className = 'adesso';

  const temp = document.createElement('div');
  temp.className = 'temperatura';
  temp.textContent = Math.round(c.temperature_2m);
  const gradi = document.createElement('sup');
  gradi.textContent = '°C';
  temp.appendChild(gradi);

  const info = document.createElement('div');
  const titolo = document.createElement('h2');
  titolo.textContent = luogo.name + (luogo.country ? ', ' + luogo.country : '');
  const descr = document.createElement('p');
  descr.textContent = descrivi(c.weather_code)
    + ' · percepita ' + Math.round(c.apparent_temperature) + '°'
    + ' · vento ' + Math.round(c.wind_speed_10m) + ' km/h'
    + ' · umidità ' + c.relative_humidity_2m + '%';
  info.append(titolo, descr);

  adesso.append(temp, info);
  box.appendChild(adesso);

  // Prossimi giorni
  const ul = document.createElement('ul');
  ul.className = 'giorni';
  const d = meteo.daily;
  for (let i = 0; i < d.time.length; i++) {
    const li = document.createElement('li');
    const giorno = document.createElement('span');
    giorno.textContent = i === 0 ? 'Oggi'
      : new Date(d.time[i]).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' });
    const cielo = document.createElement('span');
    cielo.textContent = descrivi(d.weather_code[i]);
    const t = document.createElement('span');
    const max = document.createElement('span');
    max.className = 'max';
    max.textContent = Math.round(d.temperature_2m_max[i]) + '°';
    const min = document.createElement('span');
    min.className = 'min';
    min.textContent = Math.round(d.temperature_2m_min[i]) + '°';
    t.append(max, min);
    li.append(giorno, cielo, t);
    ul.appendChild(li);
  }
  box.appendChild(ul);
}

/* ------------------------------------------------------------------
 * UTENTI (JSONPlaceholder)
 * Uso la query string "?_limit=10" e poi filtro per nome lato client.
 * ------------------------------------------------------------------ */
document.getElementById('form-utenti').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const cercato = document.getElementById('nome-utente').value.trim().toLowerCase();
  const ul = document.getElementById('lista-utenti');
  ul.innerHTML = '';
  mostraStato('stato-utenti', 'Carico gli utenti…');

  richiestaJSON('https://jsonplaceholder.typicode.com/users?_limit=10', function (utenti) {
    const trovati = utenti.filter(u => u.name.toLowerCase().includes(cercato));

    if (trovati.length === 0) {
      mostraStato('stato-utenti', 'Nessun utente con "' + cercato + '" nel nome.', true);
      return;
    }
    mostraStato('stato-utenti', trovati.length + ' utenti trovati.');

    trovati.forEach(function (u) {
      const li = document.createElement('li');
      const nome = document.createElement('strong');
      nome.textContent = u.name;
      const email = document.createElement('span');
      email.textContent = u.email + ' · ' + u.phone;
      const citta = document.createElement('span');
      citta.textContent = u.address.city + ' · ' + u.company.name;
      li.append(nome, email, citta);
      ul.appendChild(li);
    });
  }, function (errore) {
    mostraStato('stato-utenti', errore, true);
  });
});

/* ------------------------------------------------------------------
 * JSON vs XML: stessi dati, due proprietà diverse
 * ------------------------------------------------------------------ */
document.getElementById('btn-formati').addEventListener('click', function () {
  const outJson = document.getElementById('out-json');
  const outXml = document.getElementById('out-xml');
  outJson.innerHTML = '';
  outXml.innerHTML = '';

  // JSON → responseText + JSON.parse
  richiestaGET('data/studenti.json', function (xhr) {
    const studenti = JSON.parse(xhr.responseText);
    studenti.forEach(function (s) {
      const li = document.createElement('li');
      li.textContent = s.nome + ': ' + s.voto;
      outJson.appendChild(li);
    });
  }, function (errore) {
    outJson.textContent = errore;
  });

  // XML → responseXML (con DOMParser come riserva se il server sbaglia il Content-Type)
  richiestaGET('data/studenti.xml', function (xhr) {
    let doc = xhr.responseXML;
    if (doc === null) {
      doc = new DOMParser().parseFromString(xhr.responseText, 'application/xml');
    }
    doc.querySelectorAll('studente').forEach(function (s) {
      const li = document.createElement('li');
      li.textContent = s.querySelector('nome').textContent + ': ' + s.querySelector('voto').textContent;
      outXml.appendChild(li);
    });
  }, function (errore) {
    outXml.textContent = errore;
  });
});
