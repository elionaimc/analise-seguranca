import * as fs from 'fs';
import csv from 'csv-parser';
import 'dotenv/config'; // Inicializa o dotenv

// Constantes de Estilo
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';

// Puxando variáveis do .env
const CSV_PATH = process.env.CSV_FILE_NAME || 'vulnerabilidades.csv';
const LEGACY_LIST = process.env.LEGACY_ASSETS?.split(',') || [];
const NEW_LIST = process.env.NEW_ASSETS?.split(',') || [];
const YEAR = process.env.ANALYSIS_YEAR || '2025'; // Mantido para referência no título

interface VulnerabilityRow {
  'Vulnerability ID': string;
  'Name': string;
  'Asset Name': string;
  'Severity': string;
  'Status': string;
  'Created at': string;
  'Updated_at': string;
  'Last Status Change Date': string; 
  'Type': string;
}

const results: VulnerabilityRow[] = [];

if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Erro: Arquivo ${CSV_PATH} não encontrado. Verifique o seu .env`);
    process.exit(1);
}

fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // FILTRO PRINCIPAL: Remove apenas Falsos Positivos e garante que olhamos MFEs.
    // REMOVIDO FILTRO DE ANO e Status === 'fix_accepted' do bloco principal.
    const activeData = results.filter(v => 
        v['Asset Name']?.toLowerCase().includes('mfe') && 
        v.Status !== 'false_positive'
    );
      
    runSecurityDashboard(activeData);
  });

function calculateDiffDays(startStr: string, endStr: string): number {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

function runSecurityDashboard(data: VulnerabilityRow[]) {
    console.log(`\n${BOLD}${CYAN}=== DASHBOARD INTEGRADO DE SEGURANÇA E PERFORMANCE (${YEAR}) ===${RESET}`);
    
    calculateMTTR(data);
    console.log("\n" + "=".repeat(60) + "\n");
    calculateDefectDensity(data);
    console.log("\n" + "=".repeat(60) + "\n");
    generateSegmentedMetrics(data); // Esta função agora aceita todos os dados ativos
}


// Implementação das funções (MTTR, Densidade, Segmentado) de forma isolada, sem filtros internos duplicados.


function calculateMTTR(data: VulnerabilityRow[]) {
  // Apenas considera itens que JÁ FORAM FECHADOS para medir o tempo médio
  const closedVulnerabilities = data.filter(v => v.Status === 'fix_accepted');

  // ... (lógica de cálculo MTTR permanece a mesma)
  let totalDays = 0;
  let count = 0;
  closedVulnerabilities.forEach(v => {
    const endStr = v['Last Status Change Date'] || v['Updated_at'];
    const startStr = v['Created at'];
    if (endStr && startStr) {
      totalDays += calculateDiffDays(startStr, endStr);
      count++;
    }
  });

  console.log(`Itens Analisados: ${count}`);
  console.log(`MTTR Geral      : ${BOLD}${(totalDays / count).toFixed(2)} dias${RESET}`);
}


function calculateDefectDensity(data: VulnerabilityRow[]) {
  const densityMap = data.reduce((acc, curr) => {
    const assetName = curr['Asset Name'] || 'Desconhecido';
    if (!acc[assetName]) acc[assetName] = { Total: 0, Resolvendo: 0, Aberto: 0 };
    acc[assetName].Total++;
    if (curr.Status === 'identified') acc[assetName].Aberto++;
    else if (curr.Status === 'fix_accepted' || curr.Status === 'awaiting_validation') acc[assetName].Resolvendo++;
    return acc;
  }, {} as Record<string, { Total: number, Resolvendo: number, Aberto: number }>);

  const tableData = Object.entries(densityMap)
    .map(([asset, stats]) => ({
      'Ativo': asset,
      'Total Ativas': stats.Total,
      'Resolvidas/Resolvendo': stats.Resolvendo,
      'Em Aberto (Identified)': stats.Aberto
    }))
    .sort((a, b) => b['Total Ativas'] - a['Total Ativas']);

  console.log(`${BOLD}🏗️  Pipeline de resolução por projeto${RESET}`);
  console.table(tableData);

  if (tableData.length > 0) {
    const top = tableData[0];
    console.log(`\n💡 ${BOLD}O ativo "${top['Ativo']}" concentra o maior risco com ${top['Total Ativas']} vulnerabilidades, das quais ${top['Em Aberto (Identified)']} ainda aguardam início de ação.`);
  }
}


function generateSegmentedMetrics(data: VulnerabilityRow[]) {
    // Para esta tabela, filtramos apenas os que já foram resolvidos para calcular o tempo
    const resolvedData = data.filter(v => v.Status === 'fix_accepted' || v.Status === 'awaiting_validation');
    const assetsFound = [...LEGACY_LIST, ...NEW_LIST].filter(asset => data.some(v => v['Asset Name'] === asset));


    const severityTable = assetsFound.map(asset => {
        const type = NEW_LIST.includes(asset) ? 'NOVO' : 'LEGADO';
        
        const getMTTR = (sev: string) => {
            const subset = resolvedData.filter(v => v['Asset Name'] === asset && v.Severity?.toLowerCase() === sev);
            if (subset.length === 0) return "-";
            const totalDays = subset.reduce((acc, v) => acc + calculateDiffDays(v['Created at'], v['Last Status Change Date']), 0);
            return (totalDays / subset.length).toFixed(1);
        };

        const totalAssetItems = data.filter(v => v['Asset Name'] === asset).length;

        return {
        'Ativo': asset,
        'Tipo': type,
        'High (Dias)': getMTTR('high'),
        'Med (Dias)': getMTTR('medium'),
        'Low (Dias)': getMTTR('low'),
        'Total': totalAssetItems // Este total reflete o total ativo, não apenas o resolvido
        };
    });

    console.log(`${BOLD}📊 MTTR por Severidade e Categoria${RESET}`);
    console.table(severityTable);

    // --- 2. UPDATE DE DEPENDÊNCIAS (SCA) POR ATIVO ---
    const scaTable = assetsFound.map(asset => {
        const scaSubset = resolvedData.filter(v => v['Asset Name'] === asset && v.Type === 'SCAFinding');
        const totalDays = scaSubset.reduce((acc, v) => acc + calculateDiffDays(v['Created at'], v['Last Status Change Date']), 0);

        return {
        'Ativo': asset,
        'Libs Atualizadas': scaSubset.length,
        'Tempo Médio Update': scaSubset.length > 0 ? (totalDays / scaSubset.length).toFixed(1) + " dias" : "N/A"
        };
    });

    console.log(`\n${BOLD}📦 Ciclo de Vida de Dependências (SCA) por Ativo${RESET}`);
    console.table(scaTable);
}
