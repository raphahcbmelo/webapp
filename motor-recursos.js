// ==========================================
// ARMÁRIO DE RECURSOS (Motores de Processamento)
// ==========================================

// 1. FORMATADORES UNIVERSAIS
function formatarMoeda(valor) { return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }); }
function formatarDataBR(dataStr) { if(!dataStr) return ""; const p = dataStr.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }

// 2. MOTOR DE NOMENCLATURA UNIVERSAL (Timestamp)
function obterTimestamp() {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function gerarNomeArquivo(solicitacao, extensao) {
    return `webfin-${obterTimestamp()}-${solicitacao}.${extensao}`;
}

// 3. MOTOR DE DATA UNIVERSAL (Injetor de HTML)
function injetarMotorDeData(containerId, prefixo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const html = `
        <div class="dados-box" style="padding: 15px; margin-bottom: 15px;">
            <div class="form-group">
                <label>📅 DATA INICIAL:</label>
                <input type="date" id="${prefixo}-data-de" class="form-control" onchange="dispararAcaoData('${prefixo}')">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>📅 DATA FINAL:</label>
                <input type="date" id="${prefixo}-data-ate" class="form-control" onchange="dispararAcaoData('${prefixo}')">
            </div>
        </div>
    `;
    container.innerHTML = html;
}
function inicializarMotores() {
    injetarMotorDeData('motor-data-diario', 'diario');
    injetarMotorDeData('motor-data-dossie', 'dossie');
    injetarMotorDeData('motor-data-radar', 'radar');
}
function definingDatasPadrao() { 
    const hoje = new Date().toISOString().split('T')[0]; 
    if(document.getElementById('form-data-inicio')) document.getElementById('form-data-inicio').value = hoje; 
    if(document.getElementById('diario-data-de')) { document.getElementById('diario-data-de').value = hoje; document.getElementById('diario-data-ate').value = "2026-12-31"; }
    if(document.getElementById('dossie-data-de')) { document.getElementById('dossie-data-de').value = hoje; document.getElementById('dossie-data-ate').value = "2026-12-31"; }
    if(document.getElementById('radar-data-de')) { document.getElementById('radar-data-de').value = hoje; document.getElementById('radar-data-ate').value = "2026-12-31"; }
}

// 4. MOTOR PDF FANTASMA
function acionarMotorPDF(htmlConteudo, orientacao, nomeSolicitacao) {
    document.getElementById('loading-pdf').style.display = 'flex';
    const iframe = document.getElementById('print-iframe');
    const doc = iframe.contentWindow.document;
    const pageCss = orientacao === 'landscape' ? '@page { size: landscape; margin: 10mm; }' : '@page { size: portrait; margin: 10mm; }';
    
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>${gerarNomeArquivo(nomeSolicitacao, 'pdf')}</title>
            <style>
                ${pageCss}
                body { font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; margin: 0; padding: 0; }
                table { width: 100%; border-collapse: collapse; text-align: center; }
                th, td { border: 1px solid #000; padding: 8px; }
                th { background-color: #f0f0f0; }
            </style>
        </head>
        <body>${htmlConteudo}</body>
        </html>
    `);
    doc.close();
    
    setTimeout(() => {
        document.getElementById('loading-pdf').style.display = 'none';
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 500);
}

// 5. MOTOR DE BACKUP E RESTAURAÇÃO
let alvoRestauracao = 'tudo';
function exportarBackup(alvo) {
    const stores = alvo === 'tudo' ? ['dados_usuario', 'financas_pessoais', 'dados_empresa', 'dados_clientes', 'dados_produtos', 'dados_vendas'] : [alvo];
    let cofre = {}; let lidos = 0;
    stores.forEach(st => {
        db.transaction([st], "readonly").objectStore(st).getAll().onsuccess = (e) => {
            cofre[st] = e.target.result; lidos++;
            if(lidos === stores.length) {
                const dataStr = JSON.stringify(cofre, null, 2);
                const blob = new Blob([dataStr], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = gerarNomeArquivo(`backup-${alvo}`, 'json');
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            }
        };
    });
}
function processarImportacao(event) {
    const file = event.target.files[0]; if(!file) return; 
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if(!confirm(`Aviso: Isso substituirá os dados de [${alvoRestauracao.toUpperCase()}]. Prosseguir?`)) return;
            document.getElementById('loading-pdf').style.display = 'flex';
            const storesToUpdate = alvoRestauracao === 'tudo' ? Object.keys(dados) : [alvoRestauracao];
            const validStores = storesToUpdate.filter(st => db.objectStoreNames.contains(st));
            if(validStores.length === 0) throw new Error("Nenhuma tabela válida encontrada no arquivo.");
            const t = db.transaction(validStores, "readwrite");
            validStores.forEach(st => {
                if(dados[st]) {
                    const s = t.objectStore(st);
                    s.clear().onsuccess = () => { dados[st].forEach(r => s.add(r)); };
                }
            });
            t.oncomplete = () => { 
                document.getElementById('loading-pdf').style.display = 'none'; 
                alert("Restauração concluída."); 
                window.dispatchEvent(new Event('dadosRestaurados')); // Avisa a UX para recarregar as telas
            };
        } catch(err) { 
            alert("Arquivo inválido ou corrompido."); 
            document.getElementById('loading-pdf').style.display = 'none'; 
        }
        document.getElementById('input-importar').value = '';
    }; 
    reader.readAsText(file);
}
function limparBancoGeral() { 
    if(confirm("Aviso de segurança: Tem certeza que deseja apagar permanentemente todas as tabelas?")) { 
        if(confirm("Confirme se realizou uma exportação .json de segurança recente.")) { 
            const stores = ['financas_pessoais', 'dados_usuario', 'dados_clientes', 'dados_produtos', 'dados_vendas', 'dados_empresa']; 
            const t = db.transaction(stores, "readwrite"); 
            stores.forEach(st => t.objectStore(st).clear()); 
            t.oncomplete = () => { 
                alert("Banco de dados limpo."); 
                window.dispatchEvent(new Event('dadosRestaurados')); 
            }; 
        } 
    } 
}

// 6. MOTOR CALCULADORA
function calcInput(val) { const d = document.getElementById('calc-display'); if (d.value === 'Erro') d.value = ''; d.value += val; }
function calcAction(action) {
    const d = document.getElementById('calc-display'); if (d.value === 'Erro') d.value = ''; 
    if (action === 'clear') { d.value = ''; } 
    else if (action === 'back') { d.value = d.value.slice(0, -1); } 
    else if (action === 'eval') {
        try { let exp = d.value.replace(/,/g, '.').replace(/÷/g, '/').replace(/×/g, '*'); if (exp.trim() === '') return; let res = eval(exp); d.value = Number.isInteger(res) ? res : parseFloat(res.toFixed(4)); } catch (e) { d.value = 'Erro'; }
    }
}

// 7. MOTOR GRÁFICOS (Lógica Matemática do Chart.js)
let chartInstance = null; 
function obterSegunda(dStr) { let d=new Date(dStr+'T00:00:00'); let dia=d.getDay(); let diff=d.getDate()-dia+(dia==0?-6:1); return new Date(d.setDate(diff)).toISOString().split('T')[0]; }

function compilarDadosGrafico(agp, contas, reg, tipoGrafico) {
    let isCircular = (tipoGrafico === 'radar' || tipoGrafico === 'doughnut' || tipoGrafico === 'pie');
    let tipoContaMap = {};
    reg.forEach(r => tipoContaMap[r.nome] = r.tipo);

    let pluginsObj = { 
        legend: { position: 'bottom', labels: { color: 'var(--cor-primaria)', font: {family: 'Courier New', weight: 'bold', size: 10}, padding: 15 } }, 
        tooltip: { enabled: false }, 
        datalabels: { 
            display: true, color: isCircular ? '#ffffff' : 'var(--cor-primaria)', anchor: isCircular ? 'center' : 'end', align: isCircular ? 'center' : 'top', offset: isCircular ? 0 : 6,
            font: { size: 11, family: 'Courier New', weight: 'bold' }, 
            formatter: function(v, context) { 
                if(v === 0 || v === null || v === undefined) return '';
                let accountName = agp === 'geral' ? context.chart.data.labels[context.dataIndex] : context.dataset.label;
                let prefix = tipoContaMap[accountName] === 'despesa' ? '- ' : '';
                if(v >= 100000) return prefix + (v/1000).toFixed(0) + 'k';
                return prefix + v.toLocaleString('pt-BR', {minimumFractionDigits: 2}); 
            } 
        } 
    };
    
    const gerarCor = (index) => { let hue = (index * 137.5) % 360; if (hue > 330 || hue < 20) hue = (hue + 100) % 360; return `hsl(${hue}, 75%, 45%)`; };
    const gerarCorBg = (index) => { let hue = (index * 137.5) % 360; if (hue > 330 || hue < 20) hue = (hue + 100) % 360; return `hsla(${hue}, 75%, 45%, 0.7)`; };

    if(agp === 'geral') {
        let tot = {}; contas.forEach(c => tot[c] = 0); reg.forEach(r => tot[r.nome] += r.valor);
        let labels = contas; let data = contas.map(c => tot[c]);
        let bgColors = contas.map((c, i) => gerarCorBg(i)); let borderColors = contas.map((c, i) => gerarCor(i));
        return { data: { labels: labels, datasets: [{ data: data, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 2 }] }, scales: isCircular ? {} : { x: { display: false }, y: { display: false } }, plugins: pluginsObj };
    } else {
        let chaves = new Set(); 
        reg.forEach(r => { 
            if(agp==='diario') r.p = formatarDataBR(r.data).substring(0,5); 
            if(agp==='semanal') r.p = formatarDataBR(obterSegunda(r.data)).substring(0,5); 
            if(agp==='mensal') { let p = r.data.split('-'); r.p = `${p[1]}/${p[0].substring(2,4)}`; } 
            chaves.add(r.p); 
        });
        let lbls = Array.from(chaves).sort(); 
        let dts = contas.map((c, i) => { 
            return { 
                label: c, data: lbls.map(pCh => reg.filter(r => r.nome === c && r.p === pCh).reduce((s,curr)=>s+curr.valor,0)), 
                borderColor: gerarCor(i), backgroundColor: isCircular ? gerarCorBg(i) : (tipoGrafico === 'line' ? 'transparent' : gerarCorBg(i)), 
                tension: 0.3, borderWidth: 2, pointBackgroundColor: gerarCor(i), pointRadius: 3
            }; 
        });
        return { data: { labels: lbls, datasets: dts }, scales: isCircular ? {} : { x: { grid: { color: '#e0e0e0' }, ticks: { color: 'var(--cor-primaria)', font: {family: 'Courier New', weight: 'bold', size: 9} } }, y: { grid: { color: '#e0e0e0' }, ticks: { color: 'var(--cor-primaria)', font: {family: 'Courier New', weight: 'bold', size: 9} } } }, plugins: pluginsObj };
    }
}

// 8. MOTOR AGENDA (Base para o futuro)
const MotorAgenda = {
    processarData: function(data) { return new Date(data); }
};

// 9. MOTOR NOTAS (Base para o futuro)
const MotorNotas = {
    processarTexto: function(texto) { return texto.trim(); }
};