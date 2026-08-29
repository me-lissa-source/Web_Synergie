# Schriften self-hosted einbinden (DSGVO)

Aktuell laden Newsreader und Outfit noch von fonts.googleapis.com. Vor dem Deploy ersetzen:

1. gwfh.mranftl.com (Google Webfonts Helper) öffnen.
2. Familie "Newsreader" wählen, Styles: 300, 400, 500 + italic 300/400. Format: woff2 (modern browsers).
3. Familie "Outfit" wählen, Styles: 300, 400, 500, 600. Format: woff2.
4. Alle .woff2-Dateien in diesen Ordner legen (Dateinamen nur a-z, 0-9, Bindestrich).
5. In index.html den <link href="https://fonts.googleapis.com...">-Tag löschen und stattdessen im <style>-Block einfügen:

@font-face { font-family: 'Newsreader'; font-style: normal; font-weight: 300; font-display: swap; src: url('assets/fonts/newsreader-v-latin-300.woff2') format('woff2'); }
@font-face { font-family: 'Newsreader'; font-style: normal; font-weight: 400; font-display: swap; src: url('assets/fonts/newsreader-v-latin-400.woff2') format('woff2'); }
@font-face { font-family: 'Newsreader'; font-style: italic; font-weight: 400; font-display: swap; src: url('assets/fonts/newsreader-v-latin-400italic.woff2') format('woff2'); }
@font-face { font-family: 'Outfit'; font-style: normal; font-weight: 300; font-display: swap; src: url('assets/fonts/outfit-v-latin-300.woff2') format('woff2'); }
@font-face { font-family: 'Outfit'; font-style: normal; font-weight: 400; font-display: swap; src: url('assets/fonts/outfit-v-latin-400.woff2') format('woff2'); }
@font-face { font-family: 'Outfit'; font-style: normal; font-weight: 500; font-display: swap; src: url('assets/fonts/outfit-v-latin-500.woff2') format('woff2'); }

6. Die beiden <link rel="preconnect">-Tags zu Google ebenfalls entfernen.
7. Gleiches in mentions-legales.html und confidentialite.html.
