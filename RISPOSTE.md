# Risposte alle domande

## Esercizio 1

**Cosa significa `readyState === 4`?**
È lo stato `DONE`: l'operazione è terminata e la risposta è stata ricevuta tutta. Non dice però se è andata bene: anche una risposta 404 arriva a readyState 4.

**Perché serve `status === 200`?**
Perché `status` contiene il codice HTTP con cui il server ha risposto. 200 significa "OK", cioè il file esiste ed è stato restituito. Senza questo controllo mostreremmo anche le pagine di errore (es. 404 Not Found, 500).

**Cosa succede se metto `false` come terzo parametro di `open()`?**
La richiesta diventa sincrona: `send()` blocca il browser finché non arriva la risposta, la pagina si "congela" e dopo `send()` `responseText` è già pieno. È deprecato e i browser mostrano un avviso in console; va usato sempre `true`.

## Esercizio 4 – Perché `send()` deve stare dopo `open()`?
`open()` configura la richiesta (metodo, URL, modalità) e porta `readyState` a 1 (OPENED). `send()` può partire solo da quello stato: se lo chiamo prima, l'oggetto non sa dove né come inviare e il browser lancia un'eccezione `InvalidStateError`. Per lo stesso motivo `setRequestHeader()` va tra `open()` e `send()`.

## Autoverifica (Sezione 5.7 della dispensa)

1. **Perché `responseXML` può essere null anche se il file è XML valido?**
   Perché il server lo invia con un `Content-Type` non XML (es. `text/plain`): il browser allora non lo analizza. Si risolve con `DOMParser` su `responseText`.
2. **Cosa restituisce `responseText` se il server risponde con JSON?**
   Una stringa con il testo del JSON. Per ottenere un oggetto bisogna usare `JSON.parse()`.
3. **Differenza tra `readyState === 4` e `status === 200`?**
   `readyState` dice a che punto è la richiesta (4 = finita); `status` dice com'è andata secondo il server (200 = OK). Servono entrambe.
4. **Cosa succede se chiamo `send()` prima di `open()`?**
   Viene lanciata un'eccezione (`InvalidStateError`) e la richiesta non parte.
5. **Come si invia un POST con body JSON?**
   `open('POST', url, true)`, poi `setRequestHeader('Content-Type', 'application/json')`, poi `send(JSON.stringify(oggetto))`.
