# Jeopardy – samuelbrask.com/jeopardy

Tre skærme: tavlen på tv'et (`tavle.html`), dit værtspanel (`vaert.html`) og holdenes summere på telefonen (`hold.html`, via QR-kode). Spørgsmål laves i `editor.html`. Forsiden (`index.html`) viser alle quizzer.

## 1. Supabase (5 min)
1. Brug samme projekt som quizzen. Vågn det op, hvis det er pauset.
2. SQL Editor → New query → indsæt hele `setup.sql` → Run. Kør den kun én gang.
3. Indsæt Project URL og anon public key i `config.js` (samme værdier som i `quiz/`).

## 2. Spotify (10 min, kræver Premium)
1. Gå til developer.spotify.com/dashboard → Create app.
2. Redirect URI: `https://samuelbrask.com/jeopardy/tavle.html` (præcis sådan).
3. Sæt flueben ved **Web API** og **Web Playback SDK**. Gem.
4. Kopiér Client ID ind i `config.js`.
5. Får du fejl 403, så tilføj din egen Spotify-mail under Settings → User Management.

## 3. Læg det online
Kopiér mappen `jeopardy/` ind i repoet `samuelbrask.com` (ved siden af `quiz/`), commit og push. Efter et minut ligger den på samuelbrask.com/jeopardy.

## 4. Lav spørgsmålene
Forsiden → Lav en ny quiz. I editoren vælger du 4–8 kategorier og 3–7 spørgsmål pr. kategori. Klik på et felt for at skrive spørgsmål og svar, vælge Tekst/Billede/Musik og markere bonus.

Musik: Spotify-appen → nummeret → Del → Kopiér link til sang. Sæt evt. "Start ved" (fx 0:45) for at springe introen over. Længden er standard 30 sek.; 0 betyder spil indtil du stopper.

Har Claude lavet spørgsmål til dig, så brug **Indsæt spørgsmål (JSON)**.

## 5. Selve aftenen
1. Computer på tv'et: åbn tavlen, klik **Start tavlen**, tryk F for fuld skærm.
2. Klik på det lille ♪ i hjørnet → Log ind med Spotify (første gang). Grøn prik = klar.
3. Åbn værtspanelet på telefonen eller i et andet vindue på computeren. Kun ét sted ad gangen.
4. Holdene scanner QR-koden. Når alle er med: **Start spillet**.

Flow pr. spørgsmål: vælg felt → læs op → **Åbn summerne** (eller **Spil musik og åbn summerne**) → første tryk vinder → **Rigtigt/Forkert**. Ved forkert åbner summerne igen for de andre hold, og musikken fortsætter. Trykker et hold, før du har åbnet, er de låst ude i et sekund.

## Musikken vises ingen steder
Tavle-siden er selv Spotify-afspilleren, så Spotify-appen åbner ikke. Hold browseren i fuld skærm, og hav ikke Spotify-appen synlig på tv'et. Vil du hellere spille fra telefonen eller en højttaler: åbn Spotify på den, klik ♪ på tavlen og vælg den under "Afspil på". Din egen telefon viser nummeret, så hold den for dig selv.

## Test inden turen
Test med to telefoner og musik et par dage før. Husk at vække Supabase-projektet, hvis det har sovet.

## Sikkerhed
Databasereglerne er helt åbne, så alle med linket kan ændre spillet. Fint til en privat aften, men slet tabellerne bagefter, hvis du vil rydde op: `drop table jp_buzzes, jp_teams, jp_games;`
