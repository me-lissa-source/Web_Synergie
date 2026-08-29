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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const { prenom, nom, email, telephone } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
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
        fields: [
          { slug: 'first_name', value: (prenom || '').trim() },
          { slug: 'surname', value: (nom || '').trim() },
          { slug: 'phone_number', value: (telephone || '').trim() },
        ],
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
