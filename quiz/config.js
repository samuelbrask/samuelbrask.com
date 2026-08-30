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

  // Dagene. Værten vælger en, første gang quizzen åbnes den dag.
  DAYS: [
    "Lederdag 3. september",
    "Aalborg 7. september",
    "Carlsbergbyen 9. september",
    "Carlsbergbyen 11. september",
    "Test"
  ]
};
