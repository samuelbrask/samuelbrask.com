/* ============================================================
   Spørgsmål og facit
   ------------------------------------------------------------
   Denne fil hentes KUN af host.html. Deltagernes side får
   spørgsmål og svarmuligheder sendt uden facit, så der ikke
   er noget at finde i kildekoden på telefonen.

   Sadan retter du:
   - "correct" er nummeret på det rigtige svar, 0 = første.
   - "seconds" er svartiden. Udelad den, så bruges 20.
   - Slet eller tilføj frit. Runderne behøver ikke være lige lange.
   ============================================================ */

window.QUIZ_ROUNDS = [
  {
    title: "Runde 1 · Maskinen",
    subtitle: "Hvad er det egentlig, den gør",
    questions: [
      {
        q: "Hvad står LLM for?",
        a: ["Large Language Model", "Logical Learning Machine", "Linked Layer Memory", "Live Language Mapping"],
        correct: 0,
        seconds: 20
      },
      {
        q: "Hvordan bestemmer en sprogmodel det næste ord?",
        a: ["Den slår op i en database", "Den beregner hvad der er mest sandsynligt", "Den søger på nettet hver gang", "Den følger regler skrevet af udviklere"],
        correct: 1,
        seconds: 20
      },
      {
        q: "Hvad er forskellen på automatisering og AI?",
        a: ["Ingen, det er samme ting", "Automatisering følger faste regler, AI vurderer", "AI er hurtigere", "Automatisering kræver internet"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Hvorfor kan to ens prompts give to forskellige svar?",
        a: ["Serveren er overbelastet", "Der er tilfældighed indbygget i modellen", "Den husker forrige samtale", "Det kan den ikke"],
        correct: 1,
        seconds: 20
      },
      {
        q: "Hvad kalder man det, når modellen finder på noget, der lyder rigtigt?",
        a: ["En fejl 404", "En hallucination", "Et bias", "En timeout"],
        correct: 1,
        seconds: 15
      },
      {
        q: "Hvad betyder det, at en model har en videnscutoff?",
        a: ["Den stopper efter et antal ord", "Den kender ikke noget efter en bestemt dato", "Den lukker ned om natten", "Den kan kun svare på dansk"],
        correct: 1,
        seconds: 20
      }
    ]
  },
  {
    title: "Runde 2 · Kvalitetssikring",
    subtitle: "Hvordan du får noget brugbart ud",
    questions: [
      {
        q: "Hvad gælder oftest for en god prompt?",
        a: ["Den er kort og åben", "Den giver rolle, opgave, kontekst og ønsket format", "Den er skrevet på engelsk", "Den indeholder mange spørgsmålstegn"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Modellen giver et svar, du er i tvivl om. Hvad er første skridt?",
        a: ["Bed den om at tvivle på sig selv og begrunde", "Stil samme spørgsmål igen", "Prøv et andet værktøj", "Accepter det, den er trænet på meget data"],
        correct: 0,
        seconds: 25
      },
      {
        q: "Hvad er det sværeste at opdage i et AI-svar?",
        a: ["Stavefejl", "Det, der er udeladt", "Forkert formatering", "For lang tekst"],
        correct: 1,
        seconds: 20
      },
      {
        q: "Du beder om et kundebrev og får noget stift og generisk. Hvad virker bedst?",
        a: ["Skriv det selv", "Giv den et eksempel på et brev, du selv er glad for", "Bed den skrive kortere", "Bed den være mere kreativ"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Hvornår bør du IKKE bruge et AI-svar direkte?",
        a: ["Når det skal videre til en kunde uden at du har læst det", "Når du brainstormer", "Når du oversætter til dig selv", "Når du opsummerer dine egne noter"],
        correct: 0,
        seconds: 20
      },
      {
        q: "Hvad gør mest for kvaliteten af svaret?",
        a: ["At vælge den dyreste model", "At give den den kontekst, kun du har", "At skrive med store bogstaver", "At stille spørgsmålet på engelsk"],
        correct: 1,
        seconds: 20
      }
    ]
  },
  {
    title: "Runde 3 · Ansvar og data",
    subtitle: "Grænserne, vi arbejder indenfor",
    questions: [
      {
        q: "Må du indsætte kundedata i et AI-værktøj?",
        a: ["Ja, hvis du sletter det bagefter", "Kun i værktøjer, Intega har godkendt", "Ja, hvis det er anonymiseret nok", "Aldrig under nogen omstændigheder"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Du finder et nyt AI-værktøj, der løser en opgave perfekt. Hvad gør du?",
        a: ["Tager det i brug og fortæller det videre", "Spørger, før du bruger det til noget med data", "Bruger det kun til private opgaver", "Venter til nogen spørger"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Hvad kræver EU AI Act artikel 4 af os?",
        a: ["At vi registrerer alle prompts", "At medarbejdere har tilstrækkelig AI-kompetence", "At AI kun bruges af IT", "At al AI-brug godkendes af ledelsen"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Hvem er ansvarlig for det, du sender ud med hjælp fra AI?",
        a: ["Leverandøren af værktøjet", "Dig", "Compliance", "Den, der modtager det"],
        correct: 1,
        seconds: 15
      },
      {
        q: "Hvad bør du altid vide om et værktøj, før du skriver noget ind i det?",
        a: ["Hvad det koster", "Om det gemmer det, du skriver", "Hvem der har lavet det", "Hvor mange der bruger det"],
        correct: 1,
        seconds: 20
      },
      {
        q: "Er du i tvivl om, hvorvidt noget er i orden. Hvad er reglen i dag?",
        a: ["Prøv og se", "Spørg en gang for meget frem for en gang for lidt", "Spørg din nærmeste kollega", "Lad være med at bruge AI"],
        correct: 1,
        seconds: 20
      }
    ]
  },
  {
    title: "Runde 4 · Dagen i dag",
    subtitle: "Det, vi lige har været igennem",
    questions: [
      {
        q: "Hvad er en Gem bedst til?",
        a: ["At gemme filer", "At genbruge den samme opgave med fast opsætning", "At søge på nettet", "At dele samtaler med kolleger"],
        correct: 1,
        seconds: 20
      },
      {
        q: "Hvornår giver Deep Research mest mening?",
        a: ["Når du skal have et hurtigt svar", "Når du skal have flere kilder samlet og vurderet", "Når du skriver en mail", "Når du oversætter"],
        correct: 1,
        seconds: 20
      },
      {
        q: "Hvad er det første, du bør gøre, når du vil bruge AI på en opgave?",
        a: ["Åbne værktøjet", "Være skarp på, hvad et godt resultat ser ud som", "Finde den rigtige model", "Spørge en kollega"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Hvilken opgavetype egner sig dårligst til AI lige nu?",
        a: ["Første udkast til en tekst", "Beslutninger, hvor ansvaret ikke kan placeres", "Opsummering af et møde", "Oversættelse"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Hvad er det bedste mål for, om AI hjælper dig?",
        a: ["Hvor mange prompts du sender", "Om du kommer hurtigere til noget, du selv står inde for", "Hvor lange svar du får", "Hvor mange værktøjer du bruger"],
        correct: 1,
        seconds: 25
      },
      {
        q: "Hvad sker der efter i dag?",
        a: ["Ingenting, det var det", "Build Day og Show and Tell", "Et nyt webinar", "En test I skal bestå"],
        correct: 1,
        seconds: 15
      }
    ]
  }
];
