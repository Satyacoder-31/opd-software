const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const csvPath = 'C:\\Users\\krish\\.gemini\\antigravity\\brain\\6e33fb39-7993-4f6e-8d2f-b5729050b5f7\\scratch\\updated_indian_medicine_data.csv';
const CLINIC_ID = '65f39693-49a6-46a4-8293-4c6a75d27680';
const BATCH_SIZE = 1500;

function normalizeDrugName(name) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function detectCategoryAndDefaults(name, packLabel) {
  const lower = (name + ' ' + (packLabel || '')).toLowerCase();

  if (lower.includes('tablet') || lower.includes('tab') || lower.includes('caplet')) {
    return {
      category: 'Tablet',
      route: 'Oral',
      dosage: '1 tablet',
      frequency: '1-0-1 or Twice daily',
      duration: '5 days',
      instructions: 'After meals'
    };
  }
  if (lower.includes('capsule') || lower.includes('cap')) {
    return {
      category: 'Capsule',
      route: 'Oral',
      dosage: '1 capsule',
      frequency: '1-0-1 or Twice daily',
      duration: '5 days',
      instructions: 'After meals'
    };
  }
  if (lower.includes('syrup') || lower.includes('suspension') || lower.includes('liquid') || lower.includes('elixir') || lower.includes('solution')) {
    return {
      category: 'Syrup',
      route: 'Oral',
      dosage: '5 ml',
      frequency: '1-1-1 or Three times daily',
      duration: '5 days',
      instructions: 'After meals'
    };
  }
  if (lower.includes('injection') || lower.includes('inj') || lower.includes('infusion') || lower.includes('vial') || lower.includes('ampoule')) {
    return {
      category: 'Injection',
      route: 'Intramuscular / IV',
      dosage: '1 vial / ampoule',
      frequency: 'Once daily or As directed',
      duration: '1 day',
      instructions: 'Administer under sterile medical supervision'
    };
  }
  if (lower.includes('gel') || lower.includes('ointment') || lower.includes('cream') || lower.includes('emulgel') || lower.includes('liniment') || lower.includes('lotion')) {
    return {
      category: 'Gel / Ointment',
      route: 'Topical',
      dosage: 'Apply gently to affected area',
      frequency: '2 to 3 times daily',
      duration: '7 days',
      instructions: 'Apply gently on clean dry skin; wash hands after application'
    };
  }
  if (lower.includes('drop') || lower.includes('drops') || lower.includes('eye drop') || lower.includes('ear drop') || lower.includes('nasal drop') || lower.includes('spray')) {
    return {
      category: 'Drops',
      route: 'Topical / Instillation',
      dosage: '1-2 drops',
      frequency: 'Twice daily',
      duration: '5 days',
      instructions: 'Instill into affected eye/ear/nostril'
    };
  }
  if (lower.includes('inhaler') || lower.includes('rotacap') || lower.includes('respule') || lower.includes('inhalation')) {
    return {
      category: 'Inhaler',
      route: 'Inhalation',
      dosage: '1-2 puffs / respule',
      frequency: 'Twice daily',
      duration: '30 days',
      instructions: 'Rinse mouth with water after inhalation'
    };
  }
  if (lower.includes('sachet') || lower.includes('powder') || lower.includes('granules')) {
    return {
      category: 'Sachet',
      route: 'Oral',
      dosage: '1 sachet in water',
      frequency: 'Once daily',
      duration: '5 days',
      instructions: 'Dissolve completely in a glass of water before drinking'
    };
  }
  return {
    category: 'Oral Formulation',
    route: 'Oral',
    dosage: '1 unit',
    frequency: 'As directed',
    duration: '5 days',
    instructions: 'After food'
  };
}

function extractStrength(name) {
  const m = name.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|iu|ml|%|w\/v|w\/w))/i) || name.match(/\b(\d{2,4})\b/);
  return m ? m[1].trim() : null;
}

async function runImport() {
  console.log('Starting Indian Medicine Catalog Import for Clinic:', CLINIC_ID);
  const startTime = Date.now();

  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath),
    crlfDelay: Infinity
  });

  const seenNormalized = new Set();
  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;
  let lineIndex = 0;

  for await (const line of rl) {
    lineIndex++;
    if (lineIndex === 1) continue; // Skip CSV header

    const cols = parseCsvLine(line);
    const rawName = cols[1]?.trim();
    if (!rawName || rawName.length < 2) continue;

    // Filter out discontinued rows if marked TRUE
    const isDiscontinued = cols[3]?.trim().toUpperCase() === 'TRUE';
    if (isDiscontinued) continue;

    const name = rawName.slice(0, 190);
    const normalizedName = normalizeDrugName(name);
    if (!normalizedName || seenNormalized.has(normalizedName)) continue;
    seenNormalized.add(normalizedName);

    const rawPrice = parseFloat(cols[2]);
    const unitPrice = !isNaN(rawPrice) && rawPrice > 0 && rawPrice < 9999999 ? Math.round(rawPrice * 100) / 100 : null;
    const manufacturer = cols[4]?.trim()?.slice(0, 140) || null;
    const pack = cols[6]?.trim() || null;
    const genericName = (cols[9]?.trim() || cols[7]?.trim() || '')?.slice(0, 390) || null;
    const defaults = detectCategoryAndDefaults(name, pack);
    const strength = extractStrength(name);

    batch.push({
      clinicId: CLINIC_ID,
      name,
      normalizedName,
      genericName,
      category: defaults.category,
      strength,
      manufacturer,
      unitPrice,
      dosage: defaults.dosage,
      route: defaults.route,
      frequency: defaults.frequency,
      duration: defaults.duration,
      instructions: defaults.instructions,
      stockQuantity: 999,
      reorderLevel: 10,
      isActive: true,
      usageCount: 0
    });

    totalProcessed++;

    if (batch.length >= BATCH_SIZE) {
      try {
        const res = await prisma.drugCatalogItem.createMany({
          data: batch,
          skipDuplicates: true
        });
        totalInserted += res.count;
      } catch (err) {
        console.error('Batch insert error at line', lineIndex, err.message);
      }
      batch = [];

      if (totalProcessed % 15000 === 0) {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (totalProcessed / (elapsedSec || 1)).toFixed(0);
        console.log(`Processed: ${totalProcessed} | Inserted: ${totalInserted} | Time: ${elapsedSec}s (${rate} items/sec)`);
      }
    }
  }

  // Final remaining batch
  if (batch.length > 0) {
    try {
      const res = await prisma.drugCatalogItem.createMany({
        data: batch,
        skipDuplicates: true
      });
      totalInserted += res.count;
    } catch (err) {
      console.error('Final batch insert error:', err.message);
    }
    batch = [];
  }

  const finalDurationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nImport Complete!`);
  console.log(`Total rows processed: ${totalProcessed}`);
  console.log(`Total new medicines inserted into DB: ${totalInserted}`);
  console.log(`Total time taken: ${finalDurationSec} seconds`);

  const finalCount = await prisma.drugCatalogItem.count({ where: { clinicId: CLINIC_ID } });
  console.log(`Total medicines now available for clinic: ${finalCount}`);

  await prisma.$disconnect();
}

runImport().catch((e) => {
  console.error('Import failed:', e);
  process.exit(1);
});
