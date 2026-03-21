/**
 * Script de test - Génération directe d'un rapport
 * Usage: node --loader ts-node/esm test-generate-report.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function generateReport() {
  console.log("🚀 Démarrage du test de génération PDF\n");

  try {
    // Import dynamique des modules TypeScript
    const { generatePlaceholderPDF } = await import('./lib/generate-pdf.ts');

    // Données de test
    const testData = {
      matricule: "855500470300020006",
      tier: "promoteur",
      adresse: "Test Address",
      municipalite: "Québec"
    };

    console.log("📋 Données du rapport:");
    console.log("  - Matricule:", testData.matricule);
    console.log("  - Tier:", testData.tier);
    console.log("  - Adresse:", testData.adresse);
    console.log("\n⏳ Génération en cours...\n");

    // Génération du PDF
    const startTime = Date.now();
    const pdfBuffer = await generatePlaceholderPDF(testData);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Vérifier que c'est un vrai PDF
    const pdfHeader = pdfBuffer.toString('ascii', 0, 4);

    if (pdfHeader !== '%PDF') {
      throw new Error(`❌ Le fichier généré n'est pas un PDF valide. Header: ${pdfHeader}`);
    }

    console.log("✅ PDF généré avec succès !");
    console.log(`📦 Taille: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`⏱️  Durée: ${duration}s`);
    console.log(`🔍 Header: ${pdfHeader}`);

    // Sauvegarder le PDF
    const outputPath = path.join(__dirname, 'test-report-promoteur.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`\n💾 PDF sauvegardé: ${outputPath}`);
    console.log("👉 Ouvrez ce fichier avec Adobe Acrobat pour vérifier le contenu\n");

    // Instructions suivantes
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ SUCCÈS - Le PDF a été généré correctement");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📝 Prochaines étapes:");
    console.log("  1. Ouvrez test-report-promoteur.pdf");
    console.log("  2. Vérifiez que les données s'affichent correctement");
    console.log("  3. Vérifiez que les caractères français sont corrects");
    console.log("  4. Si tout est OK, le webhook Stripe pourra générer les PDFs\n");

    process.exit(0);

  } catch (error) {
    console.error("\n❌ ERREUR lors de la génération:", error.message);
    console.error("\n📋 Stack trace:");
    console.error(error);

    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ ÉCHEC - Diagnostic:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (error.message.includes('Propriété')) {
      console.error("🔍 Le matricule n'existe pas dans Supabase");
      console.error("   → Vérifiez que le matricule 855500470300020006 existe");
      console.error("   → Ou utilisez un autre matricule de test");
    } else if (error.message.includes('puppeteer') || error.message.includes('browser')) {
      console.error("🔍 Problème avec Puppeteer/Chromium");
      console.error("   → Vérifiez que Chromium est installé");
      console.error("   → Essayez: npm install puppeteer");
    } else if (error.message.includes('Supabase') || error.message.includes('SUPABASE')) {
      console.error("🔍 Problème de connexion Supabase");
      console.error("   → Vérifiez .env.local (SUPABASE_SERVICE_ROLE_KEY)");
    }

    console.error("\n");
    process.exit(1);
  }
}

// Lancer le test
generateReport();
