/* ============================================================
   Spørgsmål og facit
   ------------------------------------------------------------
   24 spørgsmål, seks pr. runde. Bygget på webinaret
   "AI Fundamentals — forstå, vurder og brug AI ansvarligt".
   Intet spørgsmål afhænger af, hvad Intega har besluttet.

   Denne fil hentes KUN af host.html. Deltagernes side får
   spørgsmål og svarmuligheder uden facit.

   Facit er fordelt jævnt over de fire farver: seks gange på
   hver. Flytter du rundt på svarene, så hold øje med den
   balance, ellers lærer folk at gætte på én farve.

   Sådan retter du:
   - "correct" er nummeret på det rigtige svar, 0 = første.
   - 0 = trekant/orange, 1 = rombe/grøn, 2 = cirkel/blå, 3 = firkant/rød
   - "seconds" er svartiden. Udelad den, så bruges 20.
   ============================================================ */

window.QUIZ_ROUNDS = [
  {
    title: "Runde 1 · Maskinen",
    subtitle: "Sådan finder den sit svar",
    questions: [
      {
        q: "Hvad står LLM for?",
        a: ["Logical Learning Machine", "Large Language Model", "Linked Layer Memory", "Live Language Mapping"],
        correct: 1, seconds: 15
      },
      {
        q: "Hvad blev en sprogmodel sammenlignet med på webinaret?",
        a: ["Et opslagsværk", "En søgemaskine", "En lommeregner", "En avanceret autocomplete"],
        correct: 3, seconds: 20
      },
      {
        q: "Hvordan finder modellen det næste stykke tekst?",
        a: ["Den vælger det mest sandsynlige næste stykke", "Den slår op i en database", "Den søger på nettet hver gang", "Den følger regler skrevet af udviklere"],
        correct: 0, seconds: 20
      },
      {
        q: "Bedste gæt: du beder en model tælle bogstaver i et ord. Hvorfor tager den ofte fejl?",
        a: ["Den kan ikke tælle", "Ordet er for langt", "Den ser teksten i stumper, ikke som enkelte bogstaver", "Den gætter altid på fem"],
        correct: 2, seconds: 30
      },
      {
        q: "Hvad betyder en models skæringsdato?",
        a: ["Den lukker ned efter et antal svar", "Den kender ikke noget efter en bestemt dato", "Den kan kun svare i arbejdstiden", "Den glemmer samtalen efter et døgn"],
        correct: 1, seconds: 20
      },
      {
        q: "Bedste gæt: hvorfor bliver svarene tit ringere i en meget lang samtale?",
        a: ["Der er grænser for, hvor meget den kan holde i hovedet ad gangen", "Modellen bliver træt", "Internettet bliver langsommere", "Den skifter til en dårligere model"],
        correct: 0, seconds: 30
      }
    ]
  },
  {
    title: "Runde 2 · Fejlene",
    subtitle: "Det du skal kunne genkende",
    questions: [
      {
        q: "Hvor sikker lyder modellen, når den tager fejl?",
        a: ["Tydeligt mere usikker", "Den siger selv fra", "Præcis lige så sikker som når den har ret", "Den skriver kortere svar"],
        correct: 2, seconds: 20
      },
      {
        q: "Hvad er en ja-hat?",
        a: ["Den bekræfter din antagelse, fordi du spurgte ledende", "Et svar der er for langt", "Et opdigtet citat", "En forældet sats"],
        correct: 0, seconds: 20
      },
      {
        q: "Bedste gæt: modellen har ret, men du skriver \"det er forkert\". Hvad sker der oftest?",
        a: ["Den holder fast i sit svar", "Den svarer ikke", "Den beder om en kilde", "Den giver efter og ændrer svaret"],
        correct: 3, seconds: 30
      },
      {
        q: "I ferieberegner-eksemplet henviste svaret til Ferielovens § 47b. Hvad var problemet?",
        a: ["Paragraffen var forældet", "Paragraffen findes ikke", "Den stod i den forkerte lov", "Der manglede et stykke-nummer"],
        correct: 1, seconds: 25
      },
      {
        q: "En BBC-journalist fik chatbots til at kalde ham verdensmester i hotdog-spisning. Hvorfor hoppede de på?",
        a: ["Han hackede systemet", "Han skrev det på mange sprog", "Han betalte for placeringen", "Hans egen side var den eneste kilde om emnet"],
        correct: 3, seconds: 25
      },
      {
        q: "Bedste gæt: hvilket sprog er de store modeller trænet mest på?",
        a: ["Spansk", "Kinesisk", "Engelsk", "Det er ligeligt fordelt"],
        correct: 2, seconds: 25
      }
    ]
  },
  {
    title: "Runde 3 · Kvalitetssikring",
    subtitle: "Sådan vurderer du et svar",
    questions: [
      {
        q: "Hvad er en sprogmodel god til, og hvad skal altid tjekkes?",
        a: ["God til sprog, tjek fakta", "God til fakta, tjek sproget", "God til begge dele", "Hverken eller"],
        correct: 0, seconds: 20
      },
      {
        q: "Hvornår skal du stoppe og få en ekspert ind over?",
        a: ["Når svaret er meget langt", "Hver eneste gang", "Når konsekvensen er høj, og du ikke selv kan gennemskue det", "Når du bruger et nyt værktøj"],
        correct: 2, seconds: 25
      },
      {
        q: "Hvad blev der advaret mod, når man vil kvalitetssikre et svar?",
        a: ["At læse det højt", "At bede modellen tjekke sit eget svar", "At bede om mellemregninger", "At spørge på dansk"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvilken sætning virker mod skråsikre regnefejl?",
        a: ["Skriv det kortere", "Svar kun med tal", "Vær mere kreativ", "Vis dine mellemregninger trin for trin"],
        correct: 3, seconds: 20
      },
      {
        q: "Bedste gæt: hvad løfter kvaliteten af et svar mest?",
        a: ["At give den den baggrund, kun du kender", "At vælge den dyreste model", "At skrive på engelsk", "At stille spørgsmålet flere gange"],
        correct: 0, seconds: 30
      },
      {
        q: "Hvem står med ansvaret for et AI-genereret svar, der bliver sendt videre?",
        a: ["Leverandøren af værktøjet", "Ingen, det var AI'en", "Modtageren", "Den der sender det"],
        correct: 3, seconds: 15
      }
    ]
  },
  {
    title: "Runde 4 · AI eller automatisering",
    subtitle: "Hvornår AI slet ikke er svaret",
    questions: [
      {
        q: "Opgaven følger faste regler, som en kollega kunne følge uden at tænke. Hvad er den?",
        a: ["AI", "Kan ikke afgøres", "Begge dele", "Automatisering"],
        correct: 3, seconds: 20
      },
      {
        q: "Svaret skal være præcis ens hver gang. Hvad vælger du?",
        a: ["AI, den er hurtigere", "Reglen, for AI giver ikke identiske svar", "AI med en fast prompt", "Det er lige meget"],
        correct: 1, seconds: 25
      },
      {
        q: "Hvad er tommelfingerreglen for, om en opgave egner sig til AI?",
        a: ["Om den tager lang tid", "Om den gentages hver måned", "Om en medarbejder ville skulle tænke for at løse den", "Om den findes i et system"],
        correct: 2, seconds: 25
      },
      {
        q: "Bedste gæt: hvor lang tid tog det ChatGPT at nå 100 millioner brugere?",
        a: ["Cirka to måneder", "Cirka et år", "Cirka tre år", "Cirka fem år"],
        correct: 0, seconds: 25
      },
      {
        q: "Hvad er det rigtige første spørgsmål, når man overvejer AI til en opgave?",
        a: ["Kan AI klare det her?", "Hvilken model er bedst?", "Hvad bør det her egentlig være?", "Hvad koster det?"],
        correct: 2, seconds: 25
      },
      {
        q: "Bedste gæt: hvad er den dyreste AI-fejl i en virksomhed?",
        a: ["At bruge AI, hvor en regel var nok", "At overse, hvor AI kunne have flyttet noget", "At vælge det forkerte værktøj", "At betale for mange licenser"],
        correct: 1, seconds: 30
      }
    ]
  }
];
