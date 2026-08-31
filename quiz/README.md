# Intega Quiz

Storskærm på projektoren, deltagerne svarer på deres egen skærm, og pointene løber sammen på tværs af alle dagens runder. Bygget til fire kursusdage, hvor hver dag holdes adskilt.

## Filerne

| Fil | Hvad den gør |
|---|---|
| `index.html` | Deltagernes side. Den de åbner på computer eller telefon. |
| `host.html` | Værtsskærmen. Den du viser på projektoren og styrer fra. |
| `questions.js` | Alle spørgsmål og facit. **Hentes kun af værtsskærmen.** |
| `config.js` | Dine to Supabase-nøgler, adressen til QR-koden og listen over dage. |
| `style.css` | Farver og typografi. Brandfarverne står øverst. |
| `supabase-setup.sql` | Køres én gang i Supabase for at oprette tabellerne. |
| `qr.html` | Værktøj til at lave QR-koder til slides, med Intega-mærket i midten. |

Facit ligger kun i `questions.js`, som deltagernes side aldrig henter. Spørgsmål og svarmuligheder sendes uden det rigtige svar, så der er intet at finde i kildekoden.

---

## Opsætning

Regn med 20 minutter første gang.

### 1. Supabase

1. Opret en gratis konto på supabase.com og lav et nyt projekt.
2. **Vælg region: EU (Frankfurt).** Data bliver i EU, hvilket er værd at kunne sige højt netop den dag.
3. Gå til **SQL Editor → New query**, indsæt hele `supabase-setup.sql` og tryk **Run**.
4. Gå til **Project Settings → API** og kopiér Project URL og `anon` `public` nøglen. **Ikke** `service_role`.

### 2. config.js

Indsæt de to værdier. Ret listen `DAYS`, hvis dagene skal hedde noget andet.

### 3. GitHub Pages

```bash
git init
git add .
git commit -m "Intega quiz"
git branch -M main
git remote add origin https://github.com/<dit-brugernavn>/intega-quiz.git
git push -u origin main
```

I repoet: **Settings → Pages → Source: Deploy from a branch → main / (root)**.

### 4. Domænet

`CNAME` ligger allerede i mappen med `samuelbrask.com/quiz`. Hos din DNS-udbyder opretter du en CNAME-record fra `quiz` til `<dit-brugernavn>.github.io`. I **Settings → Pages** sætter du Custom domain og slår **Enforce HTTPS** til.

DNS kan tage timer. Gør det et par dage før, ikke om morgenen.

---

## Sådan kører du dagen

Åbn `host.html` på maskinen ved projektoren. Første gang den dag vælger du dagen i listen. Der oprettes en firetegnskode, som står stort på storskærmen sammen med QR-koden.

Deltagerne går ind på adressen, skriver koden og vælger et kaldenavn. De skal kun gøre det én gang. **Bed dem lade fanen stå åben resten af dagen.** Så er de med i alle runder uden at gøre noget.

| Tast | Gør |
|---|---|
| `Mellemrum` | Videre. Vis facit, næste spørgsmål |
| `S` | Vis den samlede stilling |
| `Esc` | Tilbage til lobbyen |

Facit vises automatisk, når tiden løber ud, eller når alle har svaret. Du kan altid vise det før tid.

**Mellem runderne** trykker du `Esc` og vælger næste runde, når I er klar. Runder, I har kørt, får et flueben.

---

## Hvis noget går galt

**Din maskine crasher, eller browseren lukker.** Åbn `host.html` igen og tryk **Fortsæt hvor I slap**. Deltagere og point ligger i databasen, ikke i browseren. Du fortsætter bare.

**En deltager lukker sin fane.** De åbner adressen igen og er automatisk tilbage med deres point. De skal ikke skrive kode og navn igen.

**Nettet svigter helt.** Åbn `host.html?offline=1`. Så kører quizzen som ren storskærmsquiz med håndsoprækning. Ingen point, men dagen falder ikke fra hinanden.

**Prikken nede i venstre hjørne** er grøn, når forbindelsen er oppe.

---

## Før første kursusdag

- Supabase lukker gratis projekter ned efter en uge uden aktivitet. **Åbn kontrolpanelet dagen før hver kursusdag** og se, at projektet er vågent.
- Kør en prøvetur med dagen "Test" i dagslisten, så du ikke bruger en rigtig dag på at øve.
- Tjek at `questions.js` matcher det, I rent faktisk når igennem. Runde 3 skal stemme med Daniellas compliance-slides.

## Efter kurserne

Stillingen kan hentes som fil med **Gem stillingen som fil** på stillingsskærmen. Nederst i `supabase-setup.sql` står en linje, du kan køre for at slette gamle dage inklusive deltagere og svar.


---

## Nyt i denne version

**Dagsoversigt som forside.** Værtsskærmen åbner nu på en oversigt over alle dage. Hver dag viser sin kode og hvor mange der er kommet ind. Du kan starte, fortsætte eller nulstille hver dag for sig.

**Skift dag.** Knappen oppe til højre, eller tasten `Q`, fører dig tilbage til oversigten uden at slette noget.

**Fortryd.** Under en runde ruller `←` det viste spørgsmål tilbage. På facitskærmen hedder den "Kør om" og nulstiller pointene for det spørgsmål, så I kan tage det igen. På et spørgsmål hedder den "Forrige" og går et spørgsmål tilbage. Deltagernes telefoner følger med og låser op igen.

**Nulstil dagen.** På oversigten. Sletter alle deltagere og alle point for netop den dag. Koden bliver den samme, så QR-koden på slidet stadig virker. De andre dage røres ikke.

**Tiden er gået.** Svarer en deltager ikke inden for tiden, låses knapperne, og de får besked i stedet for at kunne trykke forgæves.

**Testdag.** Ligger for sig selv nederst på oversigten, så du ikke kommer til at åbne en rigtig kursusdag, når du øver dig.


---

## QR-koder til slides

Åbn `qr.html`, eller klik kortet på værtsskærmens forside.

Vælg dagen, skriv dagens kode, og hent PNG'en. QR-koden peger direkte på dagens quiz, så deltagerne slipper for at taste koden og går lige til kaldenavnet.

**Lås koderne fast, før du bygger slides.** På hvert dagskort er der en knap, der hedder "Skift kode". Sæt fx `LEDR`, `AALB`, `CBY1` og `CBY2`. Så kender du koderne på forhånd og kan lave alle fire QR-koder i ét hug, uden at have kørt en eneste dag.

Koden overlever nulstilling, så QR-koden på slidet virker stadig, efter du har testet.

Både logo- og kodevarianten er afkodet og virker ned til 250 pixel. Scan alligevel selv én gang, når den sidder i præsentationen. Sæt den ind mindst 5 cm bred på et slide.
