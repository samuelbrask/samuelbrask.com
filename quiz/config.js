/* ============================================================
   Opsætning
   ------------------------------------------------------------
   SUPABASE_ANON_KEY er offentlig og må godt ligge i koden.
   Brug ALDRIG service_role-nøglen her.
   ============================================================ */

window.QUIZ_CONFIG = {
  SUPABASE_URL: "https://gpislmuplscrdvmghlth.supabase.co",        
  SUPABASE_ANON_KEY: "sb_publishable_HKSP6OfhglmzH_V65EkA2Q_5Y6K2WeX",

  // Adressen deltagerne skal på. Bruges til QR-koden på storskærmen.
  JOIN_URL: "https://samuelbrask.com/quiz",

  // Vises i bunden af deltagernes skærm
  EVENT_NAME: "AI-fundamentet i Intega",

  // Hvor mange spørgsmål der køres pr. runde. questions.js indeholder 8,
  // så du kan skrue op og ned uden at slette noget. Sæt 0 for alle.
  // Filen indeholder 6 pr. runde, altså 24 i alt, ca. 15 min ren kørsel.
  QUESTIONS_PER_ROUND: 6,

  // Dagene. Værten vælger en, første gang quizzen åbnes den dag.
  // Carlsbergbyen er ÉN dag i quizzen, selvom den holdes to gange.
  // Samme kode begge gange betyder, at deltagerne kommer tilbage som sig
  // selv den 11., og at pointene fra den 9. tæller med. Nulstil den IKKE
  // mellem de to datoer.
  DAYS: [
    "Lederdag 3. september",
    "Aalborg 7. september",
    "Carlsbergbyen 9. + 11. september",
    "Test"
  ]
};
