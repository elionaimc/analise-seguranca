# Análise de Métricas de Segurança

![image](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) &nbsp; &nbsp; &nbsp; 
![image](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white) &nbsp; &nbsp; &nbsp; 
![image](https://img.shields.io/badge/MIT-green?style=for-the-badge)

Ferramenta voltada a times de engenharia, AppSec e gestores técnicos para transformar relatórios exportados (.csv) de scanners SAST, SCA e Web em indicadores objetivos de risco, eficiência e maturidade técnica para auxiliar na tomada de decisões e governança.

Implementada em Node.js e TypeScript, o script processa dados de **vulnerabilidades** para extrair KPIs operacionais e de conformidade em ambientes de micro-serviços.

![Dados de Exemplo](./img/exemplo-dados.png)

## Como Instalar e Rodar

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org) instalado (versão 18 ou superior).

### 2. Preparação do Ambiente
Abra o terminal na pasta do projeto e execute:

```bash
# Instalar dependências
npm install
```

### 3. Configuração
Crie um arquivo .env na raiz do projeto e preencha com os dados do seu ambiente:

```bash
CSV_FILE_NAME="sample-data/vulnerabilidades.csv"
LEGACY_ASSETS="user-service,legacy-auth"
NEW_ASSETS="order-service"
ANALYSIS_YEAR="2025"
```

### 4. Execução
Para gerar o dashboard de métricas no terminal, rode:

```bash
# Executar script
npx tsx metrics.ts
```

### Estrutura mínima do arquivo .csv

```bash
# colunas obrigatórias para funcionar
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
```

## Entendendo as Métricas

O script processa os dados excluindo automaticamente os *falsos positivos* para garantir que a análise reflita apenas o risco real.

### Pipeline de Resolução por Ativo

- Resolvidas/Resolvendo: Soma de itens em fix_accepted e awaiting_validation. Mostra o volume de trabalho entregue ou em fase final.

- Em Aberto (Identified): Itens que ainda não entraram no fluxo de correção.

- Insight: Ideal para identificar gargalos. Se um ativo possui muitas vulnerabilidades mas poucas em "Resolvendo", há um bloqueio de priorização naquele projeto.

### MTTR Geral (Mean Time To Remediation)

- O que é: O tempo médio (em dias) que a equipe leva para resolver uma vulnerabilidade real.

- Interpretação: Um MTTR decrescente indica maior agilidade da equipe. A filtragem de falsos positivos nesta métrica é crucial para revelar o tempo de trabalho real da engenharia, sem o "ruído" de triagens rápidas.

### MTTR por Severidade e Categoria

- Visão Estratégica: Separa os ativos entre LEGADO e NOVO.

- Severidade (High/Med/Low): Visa demostrar que a engenharia prioriza riscos críticos. O esperado é que o MTTR de itens HIGH seja menor que o de itens LOW.

### Ciclo de Vida de Dependências (SCA)

- Foco: Atualização de bibliotecas vulneráveis (ex: npm packages).
- Importância: Essencial para auditorias de conformidade (Compliance). Mostra quão rápido a empresa responde a vulnerabilidades de terceiros (Supply Chain Security).

Esse tipo de relatório é usado em análises reais de maturidade técnica e priorização de risco. Se isso te ajudou a entender melhor seus relatórios de segurança, o projeto cumpriu seu papel.

# Sobre mim

[![Linkedin Badge](https://img.shields.io/badge/-linkedin-blue?style=for-the-badge&logo=Linkedin&logoColor=white&link=https://www.linkedin.com/in/elionai)](https://www.linkedin.com/in/elionai) &nbsp; &nbsp; &nbsp; [![Gmail Badge](https://img.shields.io/badge/-gmail-c14438?style=for-the-badge&logo=Gmail&logoColor=white&link=mailto:elionai@embits.digital)](mailto:elionai@embits.digital)

Meu nome é Elionai Moura Cordeiro. Sou engenheiro de software senior especializado em desenvolvimento frontend e arquitetura de aplicações web, com vasta experiência na construção e manutenção de sistemas de grande escala. Sólida experiência em Angular (v10+), TypeScript, RxJS e integrações baseadas em REST, atuando em ambientes corporativos e terceirizados.

Experiência em contextos regulamentados e sensíveis à conformidade, com ênfase em confiabilidade, desempenho, manutenibilidade e entrega previsível.