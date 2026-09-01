// api/newsletter.js
// Nimmt die Newsletter-Anmeldung vom Formular entgegen und legt den Kontakt
// in systeme.io an. Der API-Key liegt sicher in der Vercel-Umgebungsvariable
// SYSTEME_IO_API_KEY (nie im Code oder im Frontend).
//
// WICHTIG (Stand 29.08.2026): Der genaue Feld-Schluessel fuer Vorname/Nachname
// ("fields": [{ slug: ... }]) konnte nicht 100% ueber die offizielle Doku
// verifiziert werden (developer.systeme.io/reference war per robots.txt fuer
// automatisierten Abruf gesperrt). Endpoint + Auth-Header (X-API-Key) sind
// aus mehreren unabhaengigen Quellen bestaetigt. Bitte beim ersten Test genau
// pruefen, ob Vorname/Nachname korrekt in systeme.io ankommen - falls nicht,
// muss nur der "fields"-Teil unten angepasst werden, der Rest bleibt gleich.
//
// SPAM-BREMSE (ergaenzt 31.08.2026):
// - Honeypot-Feld "site": bei Menschen immer leer, Bots fuellen es meist aus.
// - Zeitfalle "ts": Formular in unter 3 Sekunden abgeschickt = verdaechtig.
//   Beides wird mit 200 OK aber ohne echten Systeme.io-Eintrag beantwortet,
//   damit ein Bot keinen Fehler sieht und es erneut versucht.
// - Rate-Limit pro IP: einfache In-Memory-Zaehlung. WICHTIG: Vercel-Funktionen
//   sind zustandslos und koennen ueber mehrere Instanzen laufen - das ist eine
//   Bremse, keine Garantie. Fuer dieses Projektvolumen reicht das; bei mehr
//   Traffic braeuchte es einen externen Speicher (z.B. Vercel KV).

const NEWSLETTER_LIMIT = 3;               // max. Anmeldungen
const NEWSLETTER_WINDOW_MS = 60 * 60 * 1000; // pro Stunde
const requestLog = new Map(); // ip -> [Zeitstempel, ...]

function istZuSchnell(ip) {
  const jetzt = Date.now();
  const bisherige = (requestLog.get(ip) || []).filter((t) => jetzt - t < NEWSLETTER_WINDOW_MS);
  bisherige.push(jetzt);
  requestLog.set(ip, bisherige);
  return bisherige.length > NEWSLETTER_LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const { prenom, nom, email, telephone, site, ts } = req.body || {};

  // Honeypot: nur Bots fuellen dieses unsichtbare Feld aus.
  if (site) {
    return res.status(200).json({ ok: true });
  }

  // Zeitfalle: ein Mensch braucht mehr als 3 Sekunden fuer das Formular.
  if (typeof ts === 'number' && ts < 3000) {
    return res.status(200).json({ ok: true });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unbekannt';
  if (istZuSchnell(ip)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessaie plus tard.' });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }

  const apiKey = process.env.SYSTEME_IO_API_KEY;
  if (!apiKey) {
    console.error('SYSTEME_IO_API_KEY fehlt in den Vercel-Umgebungsvariablen.');
    return res.status(500).json({ error: 'Configuration serveur incomplète.' });
  }

  try {
    const response = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        email: email.trim(),
        // systeme.io lehnt leere Werte in "fields" ab (Fehler "should not be
        // blank"), deshalb werden nur tatsaechlich ausgefuellte Felder
        // mitgeschickt - Nom und Telephone sind im Formular facultatif.
        fields: [
          { slug: 'first_name', value: (prenom || '').trim() },
          { slug: 'surname', value: (nom || '').trim() },
          { slug: 'phone_number', value: (telephone || '').trim() },
        ].filter((field) => field.value !== ''),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('systeme.io hat die Anfrage abgelehnt:', response.status, data);
      return res.status(502).json({ error: 'systeme.io a refusé la demande.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fehler beim Newsletter-Handler:', err);
    return res.status(500).json({ error: 'Erreur serveur, réessaie plus tard.' });
  }
}
