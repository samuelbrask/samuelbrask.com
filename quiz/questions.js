/* ============================================================
   Spørgsmål og facit
   ------------------------------------------------------------
   Bygget på webinaret "AI Fundamentals — forstå, vurder og brug
   AI ansvarligt". Alle svar kan findes i Samuels del af dækket.
   Compliance-delen er bevidst holdt ude: intet spørgsmål her
   afhænger af, hvad Intega har besluttet.

   Denne fil hentes KUN af host.html. Deltagernes side får
   spørgsmål og svarmuligheder sendt uden facit, så der ikke er
   noget at finde i kildekoden på telefonen.

   Sådan retter du:
   - "correct" er nummeret på det rigtige svar, 0 = første.
   - "seconds" er svartiden. Udelad den, så bruges 20.
   - Slet eller tilføj frit. Runderne behøver ikke være lige lange.
   ============================================================ */

window.QUIZ_ROUNDS = [
  {
    title: "Runde 1 · Maskinen",
    subtitle: "Sådan finder den sit svar",
    questions: [
      {
        q: "Hvad står LLM for?",
        a: ["Large Language Model", "Logical Learning Machine", "Linked Layer Memory", "Live Language Mapping"],
        correct: 0, seconds: 15
      },
      {
        q: "Hvad blev en sprogmodel sammenlignet med på webinaret?",
        a: ["Et opslagsværk", "En avanceret autocomplete", "En lommeregner", "En søgemaskine"],
        correct: 1, seconds: 20
      },
      {
        q: "Hvordan finder modellen det næste stykke tekst?",
        a: ["Den slår op i en database", "Den vælger det mest sandsynlige næste stykke", "Den søger på nettet hver gang", "Den følger regler skrevet af udviklere"],
        correct: 1, seconds: 20
      },
      {
        q: "Hvad gemmer modellen fra sin træning?",
        a: ["Selve dokumenterne", "Mønstre i teksten", "En liste over kilder", "Billeder af siderne"],
        correct: 1, seconds: 20
      },
      {
        // Bedste gæt. Står ikke på slides, men forklarer en fejl alle har set.
        q: "Bedste gæt: du beder en model tælle bogstaver i et ord. Hvorfor tager den ofte fejl?",
        a: ["Den kan ikke tælle", "Den ser teksten i stumper, ikke som enkelte bogstaver", "Ordet er for langt", "Den gætter altid på fem"],
        correct: 1, seconds: 30
      },
      {
        q: "Hvad betyder en models skæringsdato?",
        a: ["Den lukker ned efter et antal svar", "Den kender ikke noget efter en bestemt dato", "Den kan kun svare i arbejdstiden", "Den glemmer samtalen efter et døgn"],
        correct: 1, seconds: 20
      },
      {
        q: "Hvorfor kan det samme spørgsmål give to forskellige svar?",
        a: ["Serveren er overbelastet", "Den planlægger ikke svaret, men finder det undervejs", "Den husker den forrige samtale", "Det kan det ikke"],
        correct: 1, seconds: 25
      },
      {
        // Bedste gæt. Forklarer hvorfor svar bliver ringere i lange samtaler.
        q: "Bedste gæt: hvorfor bliver svarene tit ringere i en meget lang samtale?",
        a: ["Modellen bliver træt", "Der er grænser for, hvor meget den kan holde i hovedet ad gangen", "Internettet bliver langsommere", "Den skifter til en dårligere model"],
        correct: 1, seconds: 30
      }
    ]
  },
  {
    title: "Runde 2 · Fejlene",
    subtitle: "Det du skal kunne genkende",
    questions: [
      {
        q: "Hvor sikker lyder modellen, når den tager fejl?",
        a: ["Tydeligt mere usikker", "Præcis lige så sikker som når den har ret", "Den siger selv fra", "Den skriver kortere svar"],
        correct: 1, seconds: 20
      },
      {
        q: "Hvilken af de fem fejltyper blev kaldt den farligste hos os?",
        a: ["Hallucination", "Plausibelt men forkert", "Ja-hat", "Skråsikker regnefejl"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvad er en ja-hat?",
        a: ["Et svar der er for langt", "Den bekræfter din antagelse, fordi du spurgte ledende", "Et opdigtet citat", "En forældet sats"],
        correct: 1, seconds: 20
      },
      {
        // Bedste gæt. Ja-hatten sat på spidsen, og et selvtjek folk kan lave i pausen.
        q: "Bedste gæt: modellen har ret, men du skriver \"det er forkert\". Hvad sker der oftest?",
        a: ["Den holder fast i sit svar", "Den giver efter og ændrer svaret", "Den beder om en kilde", "Den svarer ikke"],
        correct: 1, seconds: 30
      },
      {
        q: "I ferieberegner-eksemplet henviste svaret til Ferielovens § 47b. Hvad var problemet?",
        a: ["Paragraffen var forældet", "Paragraffen findes ikke", "Den stod i den forkerte lov", "Der manglede et stykke-nummer"],
        correct: 1, seconds: 25
      },
      {
        q: "En BBC-journalist fik chatbots til at kalde ham verdensmester i hotdog-spisning. Hvorfor hoppede de på?",
        a: ["Han hackede systemet", "Hans egen side var den eneste kilde om emnet", "Han betalte for placeringen", "Han skrev det på mange sprog"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvilken af de tre usynlige fejl handler om det, der IKKE står i svaret?",
        a: ["Bias", "Tone", "Det udeladte", "Hallucination"],
        correct: 2, seconds: 20
      },
      {
        // Bedste gæt. Hvorfor danske svar er svagere end engelske.
        q: "Bedste gæt: hvilket sprog er de store modeller trænet mest på?",
        a: ["Engelsk", "Kinesisk", "Spansk", "Det er ligeligt fordelt"],
        correct: 0, seconds: 25
      }
    ]
  },
  {
    title: "Runde 3 · Kvalitetssikring",
    subtitle: "Sådan vurderer du et svar",
    questions: [
      {
        q: "Hvad er en sprogmodel god til, og hvad skal altid tjekkes?",
        a: ["God til fakta, tjek sproget", "God til sprog, tjek fakta", "God til begge dele", "Hverken eller"],
        correct: 1, seconds: 20
      },
      {
        q: "De to spørgsmål i risikomodellen er: hvad koster det, hvis det er forkert, og hvad mere?",
        a: ["Hvor lang tid har jeg?", "Kan jeg selv vurdere det?", "Hvilket værktøj brugte jeg?", "Hvor mange har læst det?"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvornår skal du stoppe og få en ekspert ind over?",
        a: ["Når svaret er meget langt", "Når konsekvensen er høj, og du ikke selv kan gennemskue det", "Hver eneste gang", "Når du bruger et nyt værktøj"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvad blev der advaret mod, når man vil kvalitetssikre et svar?",
        a: ["At læse det højt", "At bede modellen tjekke sit eget svar", "At bede om mellemregninger", "At spørge på dansk"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvilken sætning virker mod skråsikre regnefejl?",
        a: ["Skriv det kortere", "Vis dine mellemregninger trin for trin", "Vær mere kreativ", "Svar kun med tal"],
        correct: 1, seconds: 20
      },
      {
        // Bedste gæt. Den vigtigste vane: giv den det, kun du ved.
        q: "Bedste gæt: hvad løfter kvaliteten af et svar mest?",
        a: ["At vælge den dyreste model", "At give den den baggrund, kun du kender", "At skrive på engelsk", "At stille spørgsmålet flere gange"],
        correct: 1, seconds: 30
      },
      {
        q: "Hvem står med ansvaret for et AI-genereret svar, der bliver sendt videre?",
        a: ["Leverandøren af værktøjet", "Den der sender det", "Modtageren", "Ingen, det var AI'en"],
        correct: 1, seconds: 15
      },
      {
        // Bedste gæt. Viser at den ikke er tilfældig, men gengiver mønstre.
        q: "Bedste gæt: du beder om et tilfældigt tal mellem 1 og 100. Hvad sker der?",
        a: ["Den vælger helt tilfældigt", "Den lander på de samme få tal igen og igen", "Den nægter", "Den vælger altid 1 eller 100"],
        correct: 1, seconds: 30
      }
    ]
  },
  {
    title: "Runde 4 · AI eller automatisering",
    subtitle: "Hvornår AI slet ikke er svaret",
    questions: [
      {
        q: "Opgaven følger faste regler, som en kollega kunne følge uden at tænke. Hvad er den?",
        a: ["AI", "Automatisering", "Begge dele", "Kan ikke afgøres"],
        correct: 1, seconds: 20
      },
      {
        q: "I månedsrapport-casen med fire trin: hvor mange af trinene skulle slet ikke bruge AI?",
        a: ["Ingen", "Ét", "To", "Alle fire"],
        correct: 2, seconds: 25
      },
      {
        q: "Svaret skal være præcis ens hver gang. Hvad vælger du?",
        a: ["AI, den er hurtigere", "Reglen, for AI giver ikke identiske svar", "AI med en fast prompt", "Det er lige meget"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvad er tommelfingerreglen for, om en opgave egner sig til AI?",
        a: ["Om den tager lang tid", "Om en medarbejder ville skulle tænke for at løse den", "Om den gentages hver måned", "Om den findes i et system"],
        correct: 1, seconds: 25
      },
      {
        q: "Både AI og en regel kan løse trinnet. Hvad blev anbefalet?",
        a: ["AI, det er mere fleksibelt", "Reglen, for den fejler ikke", "Kast terning", "Byg begge dele"],
        correct: 1, seconds: 20
      },
      {
        // Bedste gæt. Sætter tempoet i perspektiv, uden at være trivia.
        q: "Bedste gæt: hvor lang tid tog det ChatGPT at nå 100 millioner brugere?",
        a: ["Cirka to måneder", "Cirka et år", "Cirka tre år", "Cirka fem år"],
        correct: 0, seconds: 25
      },
      {
        q: "Hvad er det rigtige første spørgsmål, når man overvejer AI til en opgave?",
        a: ["Kan AI klare det her?", "Hvad bør det her egentlig være?", "Hvilken model er bedst?", "Hvad koster det?"],
        correct: 1, seconds: 25
      },
      {
        // Bedste gæt. Den dyreste fejl er ikke den, man kan se.
        q: "Bedste gæt: hvad er den dyreste AI-fejl i en virksomhed?",
        a: ["At bruge AI, hvor en regel var nok", "At overse, hvor AI kunne have flyttet noget", "At vælge det forkerte værktøj", "At betale for mange licenser"],
        correct: 1, seconds: 30
      }
    ]
  }
];
