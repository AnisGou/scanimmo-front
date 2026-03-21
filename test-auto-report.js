/**
 * Script de test - Génération automatique avec matricule de Supabase
 * Usage: node test-auto-report.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Test de génération PDF automatique\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Import des modules
    const { generatePlaceholderPDF } = await import('./lib/generate-pdf.ts');
    const { supabaseAdmin } = await import('./lib/supabase-admin.ts');

    // ========================================================================
    // ÉTAPE 1: Récupérer un matricule aléatoire de Québec
    // ========================================================================
    console.log("🔍 Recherche d'un matricule dans Supabase...");

    const { data: properties, error: fetchError } = await supabaseAdmin
      .from("properties")
      .select("matricule, adresse, code_municipalite, zone_code")
      .eq("code_municipalite", "24") // Ville de Québec
      .not("matricule", "is", null)
      .not("adresse", "is", null)
      .limit(10);

    if (fetchError || !properties || properties.length === 0) {
      console.error("❌ Erreur: Aucune propriété trouvée à Québec");
      console.error("   Erreur Supabase:", fetchError);
      process.exit(1);
    }

    // Prendre le premier matricule
    const property = properties[0];

    console.log("✅ Propriété trouvée:");
    console.log(`   - Matricule: ${property.matricule}`);
    console.log(`   - Adresse: ${property.adresse}`);
    console.log(`   - Zone: ${property.zone_code || 'N/D'}`);
    console.log("");

    // ========================================================================
    // ÉTAPE 2: Générer le rapport
    // ========================================================================
    const reportData = {
      matricule: property.matricule,
      tier: "promoteur", // 149$
      adresse: property.adresse,
      municipalite: "Québec"
    };

    console.log("📄 Génération du rapport Promoteur (149$)...");
    console.log("⏳ Cela peut prendre 5-10 secondes (Puppeteer)...\n");

    const startTime = Date.now();
    const pdfBuffer = await generatePlaceholderPDF(reportData);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // ========================================================================
    // ÉTAPE 3: Vérifier le PDF
    // ========================================================================
    const pdfHeader = pdfBuffer.toString('ascii', 0, 4);

    if (pdfHeader !== '%PDF') {
      throw new Error(`Le fichier n'est pas un PDF valide. Header: ${pdfHeader}`);
    }

    // ========================================================================
    // ÉTAPE 4: Sauvegarder
    // ========================================================================
    const outputPath = path.join(__dirname, `rapport_${property.matricule}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    // ========================================================================
    // RÉSULTATS
    // ========================================================================
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ SUCCÈS - Rapport généré !");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📊 Informations:");
    console.log(`   📦 Taille: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   ⏱️  Durée: ${duration}s`);
    console.log(`   🔍 Format: ${pdfHeader} (PDF valide)`);
    console.log(`   💾 Fichier: ${path.basename(outputPath)}\n`);

    console.log("📝 Prochaines étapes:");
    console.log(`   1. Ouvrez: ${path.basename(outputPath)}`);
    console.log("   2. Vérifiez les données affichées");
    console.log("   3. Vérifiez les caractères français (é, è, à, etc.)");
    console.log("   4. Si OK → Le webhook Stripe fonctionnera !\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);

  } catch (error) {
    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ ERREUR");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.error("Message:", error.message);
    console.error("\nStack:", error.stack);

    // Diagnostic
    console.error("\n🔍 Diagnostic:");
    if (error.message.includes('SUPABASE')) {
      console.error("   → Vérifiez .env.local (NEXT_PUBLIC_SUPABASE_URL)");
      console.error("   → Vérifiez SUPABASE_SERVICE_ROLE_KEY");
    } else if (error.message.includes('puppeteer') || error.message.includes('browser')) {
      console.error("   → Puppeteer ne peut pas lancer Chromium");
      console.error("   → Essayez: npm install puppeteer");
    } else if (error.message.includes('import')) {
      console.error("   → Problème d'import des modules TypeScript");
      console.error("   → Le script doit être lancé depuis le dossier du projet");
    }

    console.error("\n");
    process.exit(1);
  }
}

// Lancer le script
main();
