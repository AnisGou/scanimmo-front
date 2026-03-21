/**
 * Script de test - Génération PDF
 * Usage: node test-pdf.js
 */

require('dotenv').config({ path: '.env.local' });

async function testPDFGeneration() {
  console.log("🧪 Test de génération PDF\n");

  try {
    // Import dynamique car on utilise TypeScript
    const { generatePlaceholderPDF } = require('./lib/generate-pdf.ts');

    // Données de test (remplacer par un vrai matricule de votre DB)
    const testData = {
      matricule: "2423571001430001084", // Remplacer par un matricule réel
      tier: "complet",
      adresse: "Test Address",
      municipalite: "Québec"
    };

    console.log("📋 Données de test:", testData);
    console.log("\n⏳ Génération en cours...\n");

    const pdfBuffer = await generatePlaceholderPDF(testData);

    // Vérifier que c'est un vrai PDF (commence par %PDF)
    const pdfHeader = pdfBuffer.toString('ascii', 0, 4);

    if (pdfHeader === '%PDF') {
      console.log("✅ PDF VALIDE !");
      console.log(`📦 Taille: ${pdfBuffer.length} bytes (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
      console.log(`🔍 Header: ${pdfHeader}`);

      // Sauvegarder pour inspection manuelle
      const fs = require('fs');
      const outputPath = './test-output.pdf';
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`\n💾 PDF sauvegardé: ${outputPath}`);
      console.log("👉 Ouvrez ce fichier avec Adobe Acrobat pour vérifier");
    } else {
      console.error("❌ ERREUR: Le fichier n'est pas un PDF valide");
      console.error(`Header trouvé: ${pdfHeader}`);
      console.error("Contenu (premiers 100 caractères):");
      console.error(pdfBuffer.toString('utf-8', 0, 100));
    }

  } catch (error) {
    console.error("\n❌ ERREUR:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testPDFGeneration();
