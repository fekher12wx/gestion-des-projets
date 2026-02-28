/**
 * Import ALL Excel data from "Suivi études AR (1).xlsx" into the database.
 * 
 * - VUE GLOBAL sheet → suivi_etudes table (secteur summary rows)
 * - ALL data sheets → dossier_etudes table (individual dossiers)
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

function excelDateToString(v: any): string | null {
    if (!v) return null;
    if (typeof v === 'number') {
        try {
            const d = XLSX.SSF.parse_date_code(v);
            if (d) {
                const dd = String(d.d).padStart(2, '0');
                const mm = String(d.m).padStart(2, '0');
                const yyyy = d.y;
                return `${dd}/${mm}/${yyyy}`;
            }
        } catch { /* not a date */ }
    }
    return String(v);
}

const DEFAULT_COLUMNS = [
    { key: 'Code OEIE', label: 'Code OEIE', type: 'text', required: true },
    { key: 'DRE', label: 'DRE', type: 'date', required: false },
    { key: 'ETAT', label: 'ETAT', type: 'text', required: false },
    { key: 'POI', label: 'POI', type: 'text', required: false },
    { key: 'SJ', label: 'SJ', type: 'text', required: false },
    { key: 'CAFF', label: 'CAFF', type: 'text', required: false },
    { key: 'Mémo Chaf', label: 'Mémo Chaf', type: 'text', required: false },
    { key: 'VILLE', label: 'Ville', type: 'text', required: false },
    { key: 'ADRESSE', label: 'Adresse', type: 'text', required: false },
    { key: 'DATE VT', label: 'Date VT', type: 'date', required: false },
    { key: 'COMMENTAIRES', label: 'Commentaires', type: 'textarea', required: false },
    { key: 'CTC', label: 'CTC', type: 'text', required: false },
];

// Skip these rows in VUE GLOBAL
const VUE_GLOBAL_SKIP = ['TOTAL', 'GLOBAL', 'SECTEUR', 'TAUX', 'DOSSIER MAIN'];

async function importVueGlobal(wb: XLSX.WorkBook) {
    const ws = wb.Sheets['VUE GLOBAL'];
    if (!ws) { console.log('⚠ VUE GLOBAL sheet not found'); return; }

    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    // Clear existing suivi_etudes
    await prisma.suiviEtude.deleteMany();
    console.log('🗑 Cleared existing suivi_etudes');

    let imported = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (!row || !row[0] || typeof row[0] !== 'string') continue;

        const secteur = row[0].trim();
        if (!secteur) continue;
        if (VUE_GLOBAL_SKIP.some(s => secteur.toUpperCase().includes(s))) continue;

        await prisma.suiviEtude.create({
            data: {
                secteur,
                nbDossiers: parseInt(row[1]) || 0,
                dreKo: parseInt(row[2]) || 0,
                vtAFaire: parseInt(row[3]) || 0,
                aRemonter: parseInt(row[4]) || 0,
                retourVt: parseInt(row[5]) || 0,
                dossAReprendre: parseInt(row[6]) || 0,
                dossAMonter: parseInt(row[7]) || 0,
                attInfosCafRef: parseInt(row[8]) || 0,
                attDevisOrangeRip: parseInt(row[9]) || 0,
                attDevisClient: parseInt(row[10]) || 0,
                attTravauxClient: parseInt(row[11]) || 0,
                attPv: parseInt(row[12]) || 0,
                attDta: parseInt(row[13]) || 0,
                attComacCafft: parseInt(row[14]) || 0,
                attMajSi: parseInt(row[15]) || 0,
                poiEnTravaux: parseInt(row[16]) || 0,
                atRetourDoe: parseInt(row[17]) || 0,
                etat5: parseInt(row[19]) || 0,
                columnConfig: DEFAULT_COLUMNS,
            },
        });
        imported++;
        console.log(`  ✅ ${secteur}: ${row[1] || 0} dossiers`);
    }
    console.log(`📊 Imported ${imported} secteurs into VUE GLOBAL`);

    // Second pass: read DOSSIER MAIN BE / CHAFF section (rows after "DOSSIER MAIN BE" header)
    let beChaffHeaderIdx = -1;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (row && row[0] && typeof row[0] === 'string' && row[0].includes('DOSSIER MAIN BE')) {
            beChaffHeaderIdx = i;
            break;
        }
    }

    if (beChaffHeaderIdx >= 0) {
        console.log(`\n📋 Found DOSSIER MAIN BE/CHAFF section at row ${beChaffHeaderIdx}`);
        for (let i = beChaffHeaderIdx + 1; i < rows.length; i++) {
            const row = rows[i] as any[];
            if (!row || row.length < 3) continue;
            const be = parseInt(row[0]) || 0;
            const chaff = parseInt(row[1]) || 0;
            const secteur = typeof row[2] === 'string' ? row[2].trim() : null;
            if (!secteur) continue;

            try {
                await prisma.suiviEtude.update({
                    where: { secteur },
                    data: { dossierMainBe: be, dossierMainChaff: chaff },
                });
                console.log(`  ✅ ${secteur}: BE=${be}, CHAFF=${chaff}`);
            } catch {
                console.log(`  ⚠ Secteur "${secteur}" not found for BE/CHAFF update`);
            }
        }
    }

    console.log('');
}

// ALL sheets to import as dossiers: sheetName → secteurName
const SHEETS_TO_IMPORT: Record<string, string> = {
    'MEN-ROD': 'MEN-ROD',
    'QPR-CRO': 'QPR-CRO',
    'GDP AQ': 'GDP AQ',
    'SPI AQ': 'SPI AQ',
    'SPI Bretagne': 'SPI Bretagne',
    'BEIN': 'BEIN',
    'COMAC CAPFT': 'COMAC CAPFT',
    'TP SWAN': 'TP SWAN',
    'DEMANDE DT': 'DEMANDE DT',
};

// Known header identifiers for different sheets
const HEADER_MARKERS = [
    'Code OEIE', 'ETAT', 'COG', 'POI', 'Act', 'DEPT',
    'Département', 'COMMUNE', 'Référence',
];

function findHeaderRow(allRows: any[][], maxSearch = 5): number {
    for (let i = 0; i < Math.min(allRows.length, maxSearch); i++) {
        const row = allRows[i] as any[];
        if (!row) continue;
        const stringCells = row.filter((c: any) => typeof c === 'string');
        // A header row should have multiple string cells
        if (stringCells.length >= 3) {
            // Check if any cell matches a known header marker
            const hasMarker = stringCells.some((c: string) =>
                HEADER_MARKERS.some(m => c.trim() === m || c.trim().includes(m))
            );
            if (hasMarker) return i;
        }
    }
    return -1;
}

async function importDossiers(wb: XLSX.WorkBook) {
    // Clear existing dossiers
    await prisma.dossierEtude.deleteMany();
    console.log('🗑 Cleared existing dossier_etudes');

    let totalImported = 0;

    for (const [sheetName, secteur] of Object.entries(SHEETS_TO_IMPORT)) {
        const ws = wb.Sheets[sheetName];
        if (!ws) { console.log(`⚠ Sheet "${sheetName}" not found, skipping`); continue; }

        const allRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (allRows.length < 2) { console.log(`⚠ Sheet "${sheetName}" has < 2 rows, skipping`); continue; }

        let headerIdx = findHeaderRow(allRows);

        // Special handling for DEMANDE DT which has a merged header row
        if (headerIdx < 0 && sheetName === 'DEMANDE DT') {
            // Row 0 is "INFORMATIONS GENERAL" / "CONCESSIONAIRE", Row 1 is actual headers
            if (allRows.length > 1) headerIdx = 1;
        }

        if (headerIdx < 0) {
            console.log(`⚠ No header row found in "${sheetName}"`);
            continue;
        }

        const headers = (allRows[headerIdx] as any[]).map((h: any) => h ? String(h).trim() : '');
        const nonEmptyHeaders = headers.filter(Boolean);
        console.log(`📄 ${sheetName} → ${secteur}: ${allRows.length - headerIdx - 1} rows (cols: ${nonEmptyHeaders.join(', ')})`);

        // Also ensure the secteur exists in suivi_etudes
        const existingSecteur = await prisma.suiviEtude.findUnique({ where: { secteur } });
        if (!existingSecteur) {
            // Create a placeholder secteur row for sheets not in VUE GLOBAL
            await prisma.suiviEtude.create({
                data: {
                    secteur,
                    columnConfig: nonEmptyHeaders.map((h, idx) => ({
                        key: `col${idx}`,
                        label: h,
                        type: h.toLowerCase().includes('date') ? 'date' : 'text',
                        required: idx === 0,
                    })),
                },
            });
            console.log(`  📌 Created secteur row for "${secteur}" (not in VUE GLOBAL)`);
        }

        let sheetImported = 0;
        for (let i = headerIdx + 1; i < allRows.length; i++) {
            const row = allRows[i] as any[];
            if (!row || row.every((c: any) => c === null || c === undefined || c === '')) continue;

            const dossierData: Record<string, any> = {};
            for (let j = 0; j < headers.length; j++) {
                const header = headers[j];
                if (!header) continue;
                let value = row[j];
                if (value === undefined || value === null) continue;

                // Convert Excel date numbers to readable strings
                const lowerHeader = header.toLowerCase();
                if (lowerHeader.includes('date') || header === 'DRE' ||
                    lowerHeader.includes('relance') || lowerHeader.includes('création')) {
                    value = excelDateToString(value);
                } else {
                    value = String(value);
                }
                dossierData[header] = value;
            }

            if (Object.keys(dossierData).length > 0) {
                await prisma.dossierEtude.create({
                    data: {
                        secteur,
                        data: dossierData,
                    },
                });
                sheetImported++;
            }
        }
        console.log(`  ✅ Imported ${sheetImported} dossiers for ${secteur}`);
        totalImported += sheetImported;
    }

    console.log(`\n📁 Total: ${totalImported} dossiers imported across all secteurs`);
}

async function main() {
    console.log('🚀 Starting FULL Excel data import...\n');

    const excelPath = path.resolve(__dirname, '../../Suivi études AR (1).xlsx');
    console.log(`📂 Reading: ${excelPath}\n`);

    const wb = XLSX.readFile(excelPath);
    console.log(`📋 Sheets found: ${wb.SheetNames.join(', ')}\n`);

    // 1. Import VUE GLOBAL (secteur summary)
    await importVueGlobal(wb);

    // 2. Import ALL dossiers from all data sheets
    await importDossiers(wb);

    console.log('\n🎉 FULL Excel import completed successfully!');
}

main()
    .catch((err) => {
        console.error('❌ Import failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
