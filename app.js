// REGISTRO GLOBAL DO PLUGIN DE DATALABELS
Chart.register(ChartDataLabels);

let db; const dbName = "FinancasDB"; 
function initDB() { 
    try {
        const req = indexedDB.open(dbName, 3); 
        req.onsuccess = (e) => { 
            db = e.target.result; 
            carregarDatalistSugestoes(); 
            inicializarMotores(); // Chama a injeção de datas
            definingDatasPadrao(); 
        }; 
        req.onupgradeneeded = (e) => { 
            let d = e.target.result; 
            if (!d.objectStoreNames.contains('financas_pessoais')) d.createObjectStore('financas_pessoais', { keyPath: "id" }); 
            if (!d.objectStoreNames.contains('dados_usuario')) d.createObjectStore('dados_usuario', { keyPath: "id" }); 
            if (!d.objectStoreNames.contains('dados_empresa')) d.createObjectStore('dados_empresa', { keyPath: "id" }); 
            if (!d.objectStoreNames.contains('dados_clientes')) d.createObjectStore('dados_clientes', { keyPath: "id" }); 
            if (!d.objectStoreNames.contains('dados_produtos')) d.createObjectStore('dados_produtos', { keyPath: "id" }); 
            if (!d.objectStoreNames.contains('dados_vendas')) d.createObjectStore('dados_vendas', { keyPath: "id" }); 
        }; 
    } catch(err) {
        console.error("Erro na inicialização do banco:", err);
        alert("Falha ao iniciar o banco de dados. Verifique as permissões do navegador.");
    }
}

// ==========================================
// MOTOR DE DATA UNIVERSAL (ARMÁRIO DE RECURSOS)
// ==========================================
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

function dispararAcaoData(prefixo) {
    if(prefixo === 'radar') atualizarPainelContas();
}

function inicializarMotores() {
    injetarMotorDeData('motor-data-diario', 'diario');
    injetarMotorDeData('motor-data-dossie', 'dossie');
    injetarMotorDeData('motor-data-radar', 'radar');
}

// FUNÇÃO DE NAVEGAÇÃO COM DELAY TÁTIL (250ms)
function acaoBotao(callback) {
    setTimeout(callback, 250);
}

function abrirApp(id) { 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    if(id === 'view-dossie') { 
        document.getElementById('dossie-resumo').style.display = 'none'; 
        document.getElementById('btn-visualizar-impressao').style.display = 'none';
        document.getElementById('lista-dossie').innerHTML = '<p style="text-align: center; color: #1b5e20; margin-top: 30px; font-size: 0.8rem; font-weight:bold;">[ Especifique o intervalo cronológico para compilar os dados ]</p>'; 
    } 
    if(id === 'view-diario') { carregarDiario(); } 
    if(id === 'view-eu') { carregarModuloEu(); }
    if(id === 'view-print-preview') { ajustarEscalaPreview(); }
    if(id === 'view-radar') { atualizarPainelContas(); }
}

function abrirGraficoEspecifico(tipo) {
    document.getElementById('radar-tipo-grafico').value = tipo;
    
    const titulos = {
        'radar': 'RADAR',
        'pie': 'PIZZA',
        'line': 'LINHA',
        'bar': 'BARRAS'
    };
    document.getElementById('titulo-grafico-atual').innerText = titulos[tipo];
    
    abrirApp('view-radar');
}

function formatarMoeda(valor) { return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }); }
function formatarDataBR(dataStr) { if(!dataStr) return ""; const p = dataStr.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }

function abrirModalDoacao() { fecharModais(); document.getElementById('modal-doacao').style.display = 'flex'; }
function fecharModais() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); }

function abrirModalAjudaGlobal() {
    fecharModais();
    document.getElementById('modal-ajuda-global').style.display = 'flex';
}

function abrirAjudaImpressao() {
    document.getElementById('texto-ajuda-dinamico').innerHTML = `
        <strong>🖨️ VISUALIZAÇÃO DE IMPRESSÃO:</strong><br><br>
        Confirme o enquadramento estrutural dos dados na folha física. O sistema reduz automaticamente a escala da fonte caso localize um grande número de colunas, prevenindo cortes nas margens.<br><br>
        Use o botão de rotação (🔄) para ajustar a orientation do papel na sua tela (Retrato/Paisagem).<br><br>
        <strong>Atenção:</strong> Na tela da impressora do seu aparelho, você deve certificar que a opção Paisagem/Retrato esteja igual à selecionada no aplicativo.
    `;
    document.getElementById('modal-ajuda-global').style.display = 'flex';
}

function forcarAtualizacao() {
    if(confirm("Confirma a verificação de atualizações no servidor?")) {
        window.location.reload(true);
    }
}

function copiarPixDoacao() {
    const pixKey = "182edc11-4ace-46c1-ad6f-ad3dec83eb32";
    navigator.clipboard.writeText(pixKey).then(() => { alert("Chave Pix de suporte copiada com sucesso."); }).catch(err => { alert("Recurso bloqueado pelo navegador."); });
}

/* ENCERRAMENTO SEGURO COM AUTO-BACKUP INJETADO */
function executarEncerramentoSeguro() {
    if(confirm("Deseja realizar o encerramento seguro da sessão? Um backup completo em .json será gerado e baixado automaticamente.")) {
        document.getElementById('loading-pdf').style.display = 'flex';
        const stores = ['financas_pessoais', 'dados_usuario', 'dados_clientes', 'dados_produtos', 'dados_vendas', 'dados_empresa'];
        let cofreFull = {}; let exportadas = 0;
        stores.forEach(st => {
            const tx = db.transaction([st], "readonly");
            tx.objectStore(st).getAll().onsuccess = (e) => {
                cofreFull[st] = e.target.result; exportadas++;
                if(exportadas === stores.length) {
                    const dataStr = JSON.stringify(cofreFull, null, 2); 
                    const blob = new Blob([dataStr], {type: "application/json"}); 
                    const url = URL.createObjectURL(blob); 
                    const a = document.createElement('a'); 
                    a.href = url; a.download = gerarNomeArquivo('backup-tudo', 'json'); 
                    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                    
                    // Inutilização instantânea do Viewport
                    document.getElementById('app-container').innerHTML = `
                        <div style="background: #1b5e20; color: #FFD600; height: 100dvh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px;">
                            <div style="font-size: 5rem; margin-bottom: 20px;">🔒</div>
                            <h2 style="font-size: 1.5rem; margin-bottom: 15px; font-weight: bold; text-transform: uppercase; letter-spacing:1px;">Sessão Encerrada</h2>
                            <p style="font-size: 1rem; color: #fff; line-height: 1.5; max-width: 320px; font-weight:bold;">O arquivo de backup de segurança foi gerado e enviado ao armazenamento do dispositivo de forma isolada.<br><br>Arraste a tela para cima ou feche a aba para sair do aplicativo.</p>
                        </div>
                    `;
                    document.getElementById('loading-pdf').style.display = 'none';
                }
            };
        });
    }
}

let tipoForm = 'receita'; function setTipoForm(tipo) { tipoForm = tipo; document.getElementById('form-tipo-receita').classList.remove('active', 'receita'); document.getElementById('form-tipo-despesa').classList.remove('active', 'despesa'); document.getElementById(`form-tipo-${tipo}`).classList.add('active', tipo); }
function toggleRecorrenciaForm() { const chk = document.getElementById('form-recorrente').checked; document.getElementById('bloco-recorrencia').style.display = chk ? 'block' : 'none'; document.getElementById('grp-data-limite').style.display = chk ? 'block' : 'none'; ajustarLabelsData(); }
function ajustarLabelsData() { const chk = document.getElementById('form-recorrente').checked; const f = document.getElementById('form-frequencia').value; const lbl = document.getElementById('lbl-data-inicial'); if(!chk) { lbl.innerText = "DATA DO REGISTRO:"; return; } if(f === 'diario') lbl.innerText = "DATA DE INÍCIO:"; if(f === 'semanal') lbl.innerText = "1º REGISTRO:"; if(f === 'mensal') lbl.innerText = "DATA BASE:"; }
function definingDatasPadrao() { 
    const hoje = new Date().toISOString().split('T')[0]; 
    document.getElementById('form-data-inicio').value = hoje; 
    
    // Atualiza os inputs gerados pelo motor
    if(document.getElementById('diario-data-de')) {
        document.getElementById('diario-data-de').value = hoje; 
        document.getElementById('diario-data-ate').value = "2026-12-31"; 
    }
    if(document.getElementById('dossie-data-de')) {
        document.getElementById('dossie-data-de').value = hoje; 
        document.getElementById('dossie-data-ate').value = "2026-12-31"; 
    }
    if(document.getElementById('radar-data-de')) {
        document.getElementById('radar-data-de').value = hoje; 
        document.getElementById('radar-data-ate').value = "2026-12-31"; 
    }
}

// ==========================================
// MÓDULO EU
// ==========================================
let perfilAtual = null;
function carregarModuloEu() {
    const t = db.transaction(['dados_usuario'], "readonly"); const s = t.objectStore('dados_usuario');
    s.get('perfil').onsuccess = (e) => {
        perfilAtual = e.target.result;
        if(perfilAtual) {
            document.getElementById('bloco-sem-perfil').style.display = 'none'; document.getElementById('bloco-com-perfil').style.display = 'block';
            document.getElementById('txt-nome-completo').innerText = `${perfilAtual.nome} ${perfilAtual.sobrenome}`.toUpperCase();
            document.getElementById('txt-cpf').innerText = perfilAtual.cpf || 'Não informado'; document.getElementById('txt-nasc').innerText = formatarDataBR(perfilAtual.nasc) || 'Não informado';
        } else { document.getElementById('bloco-sem-perfil').style.display = 'block'; document.getElementById('bloco-com-perfil').style.display = 'none'; }
    };
    let bancos = []; s.openCursor().onsuccess = (e) => { let c = e.target.result; if(c) { if(c.value.id.startsWith('banco-')) bancos.push(c.value); c.continue(); } else { renderizarBancosEu(bancos); } };
}
function abrirModalPerfil(editar = false) {
    if(editar && perfilAtual) { document.getElementById('perfil-nome').value = perfilAtual.nome; document.getElementById('perfil-sobrenome').value = perfilAtual.sobrenome; document.getElementById('perfil-cpf').value = perfilAtual.cpf; document.getElementById('perfil-nasc').value = perfilAtual.nasc; }
    else { document.getElementById('perfil-nome').value = ''; document.getElementById('perfil-sobrenome').value = ''; document.getElementById('perfil-cpf').value = ''; document.getElementById('perfil-nasc').value = ''; }
    document.getElementById('modal-perfil').style.display = 'flex';
}
function salvarPerfil() {
    const nome = document.getElementById('perfil-nome').value.trim(); const sobrenome = document.getElementById('perfil-sobrenome').value.trim(); const cpf = document.getElementById('perfil-cpf').value.trim(); const nasc = document.getElementById('perfil-nasc').value;
    if(!nome || !sobrenome) { alert("Os campos de identificação nominal são obrigatórios."); return; }
    const t = db.transaction(['dados_usuario'], "readwrite"); t.objectStore('dados_usuario').put({ id: 'perfil', nome, sobrenome, cpf, nasc }); t.oncomplete = () => { fecharModais(); carregarModuloEu(); };
}
function apagarPerfil() { if(confirm("Deseja remover as informações base de perfil?")) { const t = db.transaction(['dados_usuario'], "readwrite"); t.objectStore('dados_usuario').delete('perfil'); t.oncomplete = () => { carregarModuloEu(); }; } }
function abrirModalBanco(idBanco = null) {
    if(idBanco) {
        db.transaction(['dados_usuario'], "readonly").objectStore('dados_usuario').get(idBanco).onsuccess = (e) => {
            let b = e.target.result; document.getElementById('banco-id').value = b.id; document.getElementById('banco-nome').value = b.banco;
            document.getElementById('banco-ag').value = b.agencia; document.getElementById('banco-cc').value = b.conta; document.getElementById('banco-pix').value = b.pix;
            document.getElementById('modal-banco').style.display = 'flex';
        };
    } else { document.getElementById('banco-id').value = ''; document.getElementById('banco-nome').value = ''; document.getElementById('banco-ag').value = ''; document.getElementById('banco-cc').value = ''; document.getElementById('banco-pix').value = ''; document.getElementById('modal-banco').style.display = 'flex'; }
}
function salvarBanco() {
    let id = document.getElementById('banco-id').value; if(!id) id = 'banco-' + Date.now();
    const banco = document.getElementById('banco-nome').value.trim().toUpperCase(); const agencia = document.getElementById('banco-ag').value.trim(); const conta = document.getElementById('banco-cc').value.trim(); const pix = document.getElementById('banco-pix').value.trim();
    if(!banco || !pix) { alert("Os campos Banco e Chave Pix são obrigatórios."); return; }
    const t = db.transaction(['dados_usuario'], "readwrite"); t.objectStore('dados_usuario').put({ id, banco, agencia, conta, pix }); t.oncomplete = () => { fecharModais(); carregarModuloEu(); };
}
function renderizarBancosEu(bancos) {
    const lista = document.getElementById('lista-bancos-eu'); if(bancos.length === 0) { lista.innerHTML = `<p style="color:#1b5e20; font-size:0.85rem; font-weight:bold;">Nenhuma instituição financeira catalogada.</p>`; return; }
    let html = ''; bancos.forEach(b => {
        html += `<div class="dados-box" style="padding: 12px; margin-bottom: 10px; border-color:#1b5e20;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                <strong style="color: #1b5e20;">🏦 ${b.banco}</strong>
                <div style="display: flex; gap: 10px;">
                    <button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="copiarDadosBanco('${b.id}')">📋</button>
                    <button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="abrirModalBanco('${b.id}')">✏️</button>
                    <button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="apagarBanco('${b.id}')">🗑️</button>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: #333;">
                <p>Ag: ${b.agencia || '-'} | CC: ${b.conta || '-'}</p><p style="color: #2e7d32; font-weight: bold; margin-top: 3px;">PIX: ${b.pix}</p>
            </div></div>`;
    }); lista.innerHTML = html;
}
function apagarBanco(id) { if(confirm("Confirmar a exclusão dos parâmetros desta conta?")) { const t = db.transaction(['dados_usuario'], "readwrite"); t.objectStore('dados_usuario').delete(id); t.oncomplete = () => { carregarModuloEu(); }; } }
function copiarDadosBanco(idBanco) {
    if(!perfilAtual) { alert("Cadastre os dados de perfil base antes de gerar cópias."); return; }
    db.transaction(['dados_usuario'], "readonly").objectStore('dados_usuario').get(idBanco).onsuccess = (e) => {
        let b = e.target.result; if(!b) return;
        let texto = `*DADOS DE TRANSFERÊNCIA COMPLETO*\nTitular: ${perfilAtual.nome} ${perfilAtual.sobrenome}\nBanco: ${b.banco}\n`;
        if(b.agencia) texto += `Agência: ${b.agencia}\n`; if(b.conta) texto += `Conta: ${b.conta}\n`; texto += `*Chave Pix: ${b.pix}*`;
        navigator.clipboard.writeText(texto).then(() => { alert("Estrutura de transferência enviada para a área de transferência."); }).catch(err => { alert("Acesso bloqueado."); });
    };
}

// ==========================================
// FLUXO DE REGISTROS E DIÁRIO
// ==========================================
function capturarEMandarProBanco() {
    const nome = document.getElementById('form-nome').value.trim().toUpperCase(); const dIni = document.getElementById('form-data-inicio').value; const dLim = document.getElementById('form-data-limite').value; const val = parseFloat(document.getElementById('form-valor').value); const rec = document.getElementById('form-recorrente').checked; const freq = document.getElementById('form-frequencia').value;
    if(!nome || !dIni || isNaN(val) || val <= 0) { alert("Por favor, preencha os dados do registro em conformidade."); return; }
    const t = db.transaction(['financas_pessoais'], "readwrite"); const s = t.objectStore('financas_pessoais'); const loteId = "LOTE-" + Date.now();
    if (!rec) { s.add({ id: `${dIni.replace(/-/g,'')}-${nome}-${Date.now()}`, lote: loteId, data: dIni, nome: nome, valor: val, tipo: tipoForm }); } 
    else {
        if(!dLim) { alert("A definição de data limite é obrigatória."); return; }
        let dAtual = new Date(dIni + 'T00:00:00'); let dFim = new Date(dLim + 'T00:00:00'); let diaOriginal = dAtual.getDate();
        while(dAtual <= dFim) {
            let dFmt = dAtual.toISOString().split('T')[0]; s.add({ id: `${dFmt.replace(/-/g,'')}-${nome}-${Math.random().toString(36).substr(2, 5)}`, lote: loteId, data: dFmt, nome: nome, valor: val, tipo: tipoForm });
            if(freq === 'diario') dAtual.setDate(dAtual.getDate() + 1); else if(freq === 'semanal') dAtual.setDate(dAtual.getDate() + 7);
            else if(freq === 'mensal') { let mesOrig = dAtual.getMonth(); dAtual.setMonth(dAtual.getMonth() + 1); dAtual.setDate(diaOriginal); if (dAtual.getMonth() !== (mesOrig + 1) % 12) dAtual.setDate(0); }
        }
    }
    t.oncomplete = () => { alert("Transação armazenada com sucesso."); document.getElementById('form-nome').value = ''; document.getElementById('form-valor').value = ''; carregarDatalistSugestoes(); };
}
function carregarDatalistSugestoes() { const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); const n = new Set(); s.openCursor().onsuccess = (e) => { let c = e.target.result; if(c) { n.add(c.value.nome); c.continue(); } else { const dl = document.getElementById('lista-contas'); dl.innerHTML = ''; n.forEach(x => dl.innerHTML += `<option value="${x}">`); } }; }

function carregarDiario() {
    const de = document.getElementById('diario-data-de').value; const ate = document.getElementById('diario-data-ate').value; const verRec = document.getElementById('chk-diario-receita').checked; const verDes = document.getElementById('chk-diario-despesa').checked;
    if(!de || !ate) return; const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); let reg = [];
    s.openCursor().onsuccess = (e) => {
        let c = e.target.result; if(c) { let r = c.value; if(r.data >= de && r.data <= ate) { if((verRec && r.tipo === 'receita') || (verDes && r.tipo === 'despesa')) { reg.push(r); } } c.continue(); }
        else { reg.sort((a,b) => a.data.localeCompare(b.data)); renderizarHTMLDiario(reg); }
    };
}
function renderizarHTMLDiario(reg) {
    const lista = document.getElementById('diario-lista'); if(reg.length === 0) { lista.innerHTML = `<p style="text-align: center; color: #1b5e20; margin-top: 30px; font-weight:bold;">[ Base limpa. Sem registros no escopo ]</p>`; return; }
    let html = ''; reg.forEach(r => { 
        let corV = r.tipo === 'receita' ? '#2e7d32' : '#c62828'; 
        let sinal = r.tipo === 'despesa' ? '- ' : '';
        html += `<div class="diario-item ${r.tipo}"><div class="diario-info"><div class="diario-data">${formatarDataBR(r.data)}</div><div class="diario-nome">${r.nome}</div><div class="diario-valor" style="color: ${corV};">${sinal}${formatarMoeda(r.valor)}</div></div><div class="diario-acoes"><button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="abrirModalEditarDiario('${r.id}')">✏️</button><button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="apagarLancamentoDiario('${r.id}')">🗑️</button></div></div>`; 
    }); lista.innerHTML = html;
}
function apagarLancamentoDiario(id) { if(confirm("Confirmar a remoção definitiva do lançamento do diário?")) { const t = db.transaction(['financas_pessoais'], "readwrite"); t.objectStore('financas_pessoais').delete(id); t.oncomplete = () => { carregarDiario(); carregarDatalistSugestoes(); }; } }
function abrirModalEditarDiario(id) {
    const t = db.transaction(['financas_pessoais'], "readonly"); const req = t.objectStore('financas_pessoais').get(id);
    req.onsuccess = () => {
        const r = req.result; if(!r) return;
        document.getElementById('edit-id').value = r.id; document.getElementById('edit-tipo').value = r.tipo; document.getElementById('edit-lote').value = r.lote || '';
        document.getElementById('edit-data').value = r.data; document.getElementById('edit-nome').value = r.nome; document.getElementById('edit-valor').value = r.valor;
        document.getElementById('modal-editar-diario').style.display = 'flex';
    };
}
function salvarEdicaoDiario() {
    const id = document.getElementById('edit-id').value; const tipo = document.getElementById('edit-tipo').value; const lote = document.getElementById('edit-lote').value; const data = document.getElementById('edit-data').value; const nome = document.getElementById('edit-nome').value.trim().toUpperCase(); const valor = parseFloat(document.getElementById('edit-valor').value);
    if(!nome || !data || isNaN(valor) || valor <= 0) { alert("Valores inconsistentes."); return; }
    const t = db.transaction(['financas_pessoais'], "readwrite"); t.objectStore('financas_pessoais').put({ id: id, lote: lote, data: data, nome: nome, valor: valor, tipo: tipo }); t.oncomplete = () => { fecharModais(); carregarDiario(); carregarDatalistSugestoes(); };
}

// ==========================================
// MOTOR DE NOMENCLATURA UNIVERSAL
// ==========================================
function obterTimestamp() {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function gerarNomeArquivo(solicitacao, extensao) {
    return `webfin-${obterTimestamp()}-${solicitacao}.${extensao}`;
}

// ==========================================
// MOTOR PDF FANTASMA (O ARMÁRIO DE RECURSOS)
// ==========================================
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
        <body>
            ${htmlConteudo}
        </body>
        </html>
    `);
    doc.close();
    
    setTimeout(() => {
        document.getElementById('loading-pdf').style.display = 'none';
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 500);
}

// ==========================================
// RELATÓRIOS (DOSSIÊ)
// ==========================================
let htmlDossieAtual = '';
function gerarRelatorioDossie() {
    const de = document.getElementById('dossie-data-de').value; const ate = document.getElementById('dossie-data-ate').value; const tipo = document.getElementById('dossie-tipo').value;
    if(!de || !ate) return; const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); let reg = []; let tR = 0; let tD = 0;
    s.openCursor().onsuccess = (e) => {
        let c = e.target.result; if(c) { let r = c.value; if(r.data >= de && r.data <= ate && (tipo === 'todos' || r.tipo === tipo)) { reg.push(r); if(r.tipo === 'receita') tR += r.valor; if(r.tipo === 'despesa') tD += r.valor; } c.continue(); }
        else { renderizarHTMLDossie(reg, tR, tD, de, ate); }
    };
}
function gerarHTMLTabelaDinamica(reg, corBorda, corTextoBase) {
    if(reg.length === 0) return `<p style="text-align: center; color: #1b5e20; margin-top: 20px; font-weight:bold;">[ Sem movimentações registradas ]</p>`;
    let datas = [...new Set(reg.map(r => r.data))].sort((a,b) => a.localeCompare(b)); let contas = [...new Set(reg.map(r => r.nome))].sort();
    let headerBg = (corTextoBase === '#000000') ? '#f2f2f2' : 'rgba(255,255,255,0.1)';
    
    let fontScale = '0.85rem';
    if(contas.length > 3) fontScale = '0.7rem'; if(contas.length > 5) fontScale = '0.55rem'; if(contas.length > 7) fontScale = '0.45rem';

    let table = `<table style="width: 100%; border-collapse: collapse; font-size: ${fontScale}; text-align: center; color: ${corTextoBase};">`;
    table += `<thead><tr style="background: ${headerBg};"><th style="padding: 6px; border: 1px solid ${corBorda};">DATA</th>`;
    contas.forEach(c => table += `<th style="padding: 6px; border: 1px solid ${corBorda};">${c}</th>`); table += `</tr></thead><tbody>`;
    datas.forEach(d => {
        table += `<tr><td style="padding: 6px; border: 1px solid ${corBorda}; white-space: nowrap;">${formatarDataBR(d)}</td>`;
        contas.forEach(c => {
            let sum = reg.filter(r => r.data === d && r.nome === c).reduce((acc, curr) => acc + curr.valor, 0); 
            let tipo = reg.find(r => r.nome === c)?.tipo; 
            let sinal = tipo === 'despesa' ? '- ' : '';
            let valStr = sum > 0 ? sinal + formatarMoeda(sum) : '-';
            
            let color = sum > 0 ? (tipo === 'receita' ? '#2e7d32' : '#c62828') : corTextoBase;
            if(corTextoBase === '#000000') color = '#000000'; // Força preto na impressão
            
            table += `<td style="padding: 6px; border: 1px solid ${corBorda}; color: ${color}; font-weight: bold;">${valStr}</td>`;
        }); table += `</tr>`;
    }); table += `</tbody></table>`; 
    
    if(corTextoBase !== '#000000') { return `<div style="width: 100%; overflow-x: auto;">${table}</div>`; }
    return table;
}

function renderizarHTMLDossie(reg, tR, tD, de, ate) {
    document.getElementById('dossie-resumo').style.display = 'grid'; 
    document.getElementById('resumo-receitas').innerText = formatarMoeda(tR); 
    document.getElementById('resumo-despesas').innerText = '- ' + formatarMoeda(tD);
    let s = tR - tD; let pS = document.getElementById('resumo-saldo'); pS.innerText = formatarMoeda(s);
    pS.classList.remove('text-green', 'text-red', 'text-white'); if(s > 0) pS.classList.add('text-green'); else if(s < 0) pS.classList.add('text-red'); else pS.classList.add('text-white');
    document.getElementById('lista-dossie').innerHTML = gerarHTMLTabelaDinamica(reg, '#1b5e20', '#121212');
    if(reg.length > 0) {
        document.getElementById('btn-visualizar-impressao').style.display = 'block';
        htmlDossieAtual = `
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #000; padding-bottom: 12px;">
                <h2 style="font-size: 1.6rem; letter-spacing:1px; margin-bottom: 5px;">DEMONSTRATIVO FINANCEIRO CONSOLIDADO</h2>
                <p style="font-size:0.9rem; font-weight:bold; color: #000;">Intervalo de Competência: ${formatarDataBR(de)} até ${formatarDataBR(ate)}</p>
            </div>
            <table style="width: 100%; margin-bottom: 25px; text-align: center; border-collapse: collapse; font-weight: bold; font-size: 0.9rem;">
                <tr>
                    <td style="border: 1px solid #000; padding: 12px; background: #e8f5e9;">BALANÇO POSITIVO (CREDITADO)<br><span style="color: #000; font-size:1.1rem;">${formatarMoeda(tR)}</span></td>
                    <td style="border: 1px solid #000; padding: 12px; background: #ffebee;">BALANÇO NEGATIVO (DEBITADO)<br><span style="color: #000; font-size:1.1rem;">- ${formatarMoeda(tD)}</span></td>
                    <td style="border: 1px solid #000; padding: 12px; background: #f5f5f5;">SALDO LÍQUIDO ATUARIAL<br><span style="color: #000; font-size:1.1rem;">${(tR-tD) < 0 ? '- ' : ''}${formatarMoeda(Math.abs(tR-tD))}</span></td>
                </tr>
            </table>
            ${gerarHTMLTabelaDinamica(reg, '#000000', '#000000')}
        `;
    } else { document.getElementById('btn-visualizar-impressao').style.display = 'none'; }
}

let isLandscape = false;
function ajustarEscalaPreview() {
    const wrapper = document.getElementById('preview-wrapper');
    const papel = document.getElementById('print-preview-content');
    const isLand = papel.classList.contains('landscape');
    const targetWidth = isLand ? 1123 : 794;
    
    const containerWidth = Math.min(window.innerWidth, 400);
    let scale = (containerWidth - 40) / targetWidth;
    if(scale > 1) scale = 1;
    
    wrapper.style.transform = `scale(${scale})`;
    const targetHeight = isLand ? 794 : 1123;
    wrapper.style.height = `${targetHeight * scale}px`;
    wrapper.style.width = `${targetWidth * scale}px`;
}

function abrirPreviewImpressao() { 
    if(!htmlDossieAtual) return; 
    isLandscape = false; 
    document.getElementById('btn-orientacao').innerText = 'PAISAGEM';
    document.getElementById('style-orientacao').innerHTML = `@page { size: portrait; margin: 10mm; }`; 
    const papel = document.getElementById('print-preview-content');
    papel.classList.remove('landscape'); 
    papel.innerHTML = htmlDossieAtual; 
    abrirApp('view-print-preview'); 
}

function toggleOrientacao() { 
    isLandscape = !isLandscape; 
    document.getElementById('btn-orientacao').innerText = isLandscape ? 'RETRATO' : 'PAISAGEM'; 
    document.getElementById('style-orientacao').innerHTML = `@page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 10mm; }`; 
    const papel = document.getElementById('print-preview-content');
    if(isLandscape) { papel.classList.add('landscape'); } else { papel.classList.remove('landscape'); } 
    ajustarEscalaPreview();
}

// ==========================================
// ENGRENAGENS DE GRÁFICOS (NOVO FILTRO)
// ==========================================
let filtrosGrafico = { receita: true, despesa: true };

function toggleFiltroGrafico(tipo) {
    filtrosGrafico[tipo] = !filtrosGrafico[tipo];
    const btn = document.getElementById(`btn-filtro-${tipo}`);
    if(filtrosGrafico[tipo]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    renderizarGraficoAvancado();
}

function verificarTravaGrafico() { 
    const g = document.getElementById('radar-agrupamento').value; 
    const s = document.getElementById('radar-tipo-grafico'); 
    if(g !== 'geral') { 
        document.getElementById('opt-radar').disabled = true; 
        document.getElementById('opt-pie').disabled = true; 
        if(s.value === 'radar' || s.value === 'doughnut') s.value = 'line'; 
    } else { 
        document.getElementById('opt-radar').disabled = false; 
        document.getElementById('opt-pie').disabled = false; 
    } 
    renderizarGraficoAvancado();
}

let chartInstance = null; 
function obterSegunda(dStr) { let d=new Date(dStr+'T00:00:00'); let dia=d.getDay(); let diff=d.getDate()-dia+(dia==0?-6:1); return new Date(d.setDate(diff)).toISOString().split('T')[0]; }

function atualizarPainelContas() {
    const de = document.getElementById('radar-data-de').value; 
    const ate = document.getElementById('radar-data-ate').value; 
    if(!de || !ate) return;
    
    const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); 
    let conjReceitas = new Set();
    let conjDespesas = new Set();
    
    s.openCursor().onsuccess = (e) => {
        let c = e.target.result; 
        if(c) { 
            if(c.value.data >= de && c.value.data <= ate) {
                if(c.value.tipo === 'receita') conjReceitas.add(c.value.nome);
                else conjDespesas.add(c.value.nome);
            }
            c.continue(); 
        } else { 
            const pRec = document.getElementById('painel-receitas'); 
            const pDes = document.getElementById('painel-despesas'); 
            pRec.innerHTML = ''; pDes.innerHTML = '';
            
            Array.from(conjReceitas).sort().forEach(n => { 
                pRec.innerHTML += `<label class="cb-item" style="background:#e8f5e9; border:1px solid #2e7d32; color:#2e7d32; font-weight:bold;"><input type="checkbox" class="radar-cb-conta receita" value="${n}" checked> ${n}</label>`; 
            });
            if(conjReceitas.size === 0) pRec.innerHTML = '<span style="font-size:0.7rem; color:#666;">Sem receitas no período.</span>';

            Array.from(conjDespesas).sort().forEach(n => { 
                pDes.innerHTML += `<label class="cb-item" style="background:#ffebee; border:1px solid #c62828; color:#c62828; font-weight:bold;"><input type="checkbox" class="radar-cb-conta despesa" value="${n}" checked> ${n}</label>`; 
            });
            if(conjDespesas.size === 0) pDes.innerHTML = '<span style="font-size:0.7rem; color:#666;">Sem despesas no período.</span>';
        }
    };
}

function marcarTodos(tipo, estado) {
    document.querySelectorAll(`.radar-cb-conta.${tipo}`).forEach(cb => cb.checked = estado);
}

function renderizarGraficoAvancado() {
    const de = document.getElementById('radar-data-de').value; 
    const ate = document.getElementById('radar-data-ate').value; 
    const agp = document.getElementById('radar-agrupamento').value; 
    const mod = document.getElementById('radar-tipo-grafico').value;
    
    let contasSelecionadas = [];
    document.querySelectorAll('.radar-cb-conta:checked').forEach(cb => contasSelecionadas.push(cb.value));

    const ctx = document.getElementById('canvasRadar').getContext('2d'); 
    if(chartInstance) chartInstance.destroy(); 
    
    if(contasSelecionadas.length === 0) { 
        ctx.clearRect(0,0,400,400); 
        document.getElementById('btn-pdf-grafico').style.display = 'none';
        return; 
    }
    
    const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); 
    let reg = [];
    s.openCursor().onsuccess = (e) => {
        let c = e.target.result; 
        if(c) { 
            if(c.value.data >= de && c.value.data <= ate && contasSelecionadas.includes(c.value.nome)) {
                reg.push(c.value); 
            }
            c.continue(); 
        } else { 
            if(reg.length > 0) {
                document.getElementById('btn-pdf-grafico').style.display = 'block';
            } else {
                document.getElementById('btn-pdf-grafico').style.display = 'none';
            }

            let chartData = compilarDadosGrafico(agp, contasSelecionadas, reg, mod); 
            
            chartInstance = new Chart(ctx, { 
                type: mod, 
                data: chartData.data, 
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    layout: { padding: { top: 30, bottom: 10, left: 10, right: 10 } },
                    plugins: chartData.plugins, 
                    scales: chartData.scales 
                },
                plugins: [ChartDataLabels] 
            }); 
        }
    };
}

function compilarDadosGrafico(agp, contas, reg, tipoGrafico) {
    let isCircular = (tipoGrafico === 'radar' || tipoGrafico === 'doughnut' || tipoGrafico === 'pie');

    let tipoContaMap = {};
    reg.forEach(r => tipoContaMap[r.nome] = r.tipo);

    let pluginsObj = { 
        legend: { 
            position: 'bottom',
            labels: { color: '#1b5e20', font: {family: 'Courier New', weight: 'bold', size: 10}, padding: 15 } 
        }, 
        tooltip: { enabled: false }, 
        datalabels: { 
            display: true, 
            color: isCircular ? '#ffffff' : '#1b5e20', 
            anchor: isCircular ? 'center' : 'end', 
            align: isCircular ? 'center' : 'top', 
            offset: isCircular ? 0 : 6,
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
    
    const gerarCor = (index) => {
        let hue = (index * 137.5) % 360;
        if (hue > 330 || hue < 20) hue = (hue + 100) % 360; 
        return `hsl(${hue}, 75%, 45%)`; 
    };
    const gerarCorBg = (index) => {
        let hue = (index * 137.5) % 360;
        if (hue > 330 || hue < 20) hue = (hue + 100) % 360;
        return `hsla(${hue}, 75%, 45%, 0.7)`;
    };

    if(agp === 'geral') {
        let tot = {}; 
        contas.forEach(c => tot[c] = 0);
        reg.forEach(r => tot[r.nome] += r.valor);
        
        let labels = contas;
        let data = contas.map(c => tot[c]);
        let bgColors = contas.map((c, i) => gerarCorBg(i));
        let borderColors = contas.map((c, i) => gerarCor(i));

        return { 
            data: { 
                labels: labels, 
                datasets: [{ 
                    data: data, 
                    backgroundColor: bgColors, 
                    borderColor: borderColors, 
                    borderWidth: 2 
                }] 
            }, 
            scales: isCircular ? {} : { x: { display: false }, y: { display: false } }, 
            plugins: pluginsObj 
        };
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
                label: c, 
                data: lbls.map(pCh => reg.filter(r => r.nome === c && r.p === pCh).reduce((s,curr)=>s+curr.valor,0)), 
                borderColor: gerarCor(i), 
                backgroundColor: isCircular ? gerarCorBg(i) : (tipoGrafico === 'line' ? 'transparent' : gerarCorBg(i)), 
                tension: 0.3,
                borderWidth: 2,
                pointBackgroundColor: gerarCor(i),
                pointRadius: 3
            }; 
        });
        
        return { 
            data: { labels: lbls, datasets: dts }, 
            scales: isCircular ? {} : { 
                x: { grid: { color: '#e0e0e0' }, ticks: { color: '#1b5e20', font: {family: 'Courier New', weight: 'bold', size: 9} } }, 
                y: { grid: { color: '#e0e0e0' }, ticks: { color: '#1b5e20', font: {family: 'Courier New', weight: 'bold', size: 9} } } 
            }, 
            plugins: pluginsObj 
        };
    }
}

function abrirModalPdfRadar() {
    document.getElementById('modal-radar-pdf').style.display = 'flex';
}

function dispararPdfRadar() {
    fecharModais();
    const orientacao = document.querySelector('input[name="rad-pdf-orientacao"]:checked').value;
    
    // Pega a imagem do canvas atual
    const canvas = document.getElementById('canvasRadar');
    const imgB64 = canvas.toDataURL('image/png');
    
    const de = document.getElementById('radar-data-de').value; 
    const ate = document.getElementById('radar-data-ate').value;

    let printHtml = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
            <h1>GRÁFICO FINANCEIRO</h1>
            <p>Período: ${formatarDataBR(de)} a ${formatarDataBR(ate)}</p>
        </div>
        <div style="display: flex; justify-content: center; margin-top: 30px;">
            <img src="${imgB64}" style="max-width: 100%; height: auto;">
        </div>
    `;
    
    acionarMotorPDF(printHtml, orientacao, 'graficos-analise');
}

// --- CALCULADORA ---
function calcInput(val) { const d = document.getElementById('calc-display'); if (d.value === 'Erro') d.value = ''; d.value += val; }
function calcAction(action) {
    const d = document.getElementById('calc-display'); if (d.value === 'Erro') d.value = ''; if (action === 'clear') { d.value = ''; } else if (action === 'back') { d.value = d.value.slice(0, -1); } else if (action === 'eval') {
        try { let exp = d.value.replace(/,/g, '.').replace(/÷/g, '/').replace(/×/g, '*'); if (exp.trim() === '') return; let res = eval(exp); d.value = Number.isInteger(res) ? res : parseFloat(res.toFixed(4)); } catch (e) { d.value = 'Erro'; }
    }
}

// --- MANIPULAÇÃO DE COFRE DE DADOS (NOVO MODELO) ---
let alvoRestauracao = 'tudo';

function acionarImportacao(alvo) {
    alvoRestauracao = alvo;
    document.getElementById('input-importar').click();
}

function exportarBackup(alvo) {
    const stores = alvo === 'tudo' ? ['dados_usuario', 'financas_pessoais', 'dados_empresa', 'dados_clientes', 'dados_produtos', 'dados_vendas'] : [alvo];
    let cofre = {};
    let lidos = 0;
    
    stores.forEach(st => {
        db.transaction([st], "readonly").objectStore(st).getAll().onsuccess = (e) => {
            cofre[st] = e.target.result;
            lidos++;
            if(lidos === stores.length) {
                const dataStr = JSON.stringify(cofre, null, 2);
                const blob = new Blob([dataStr], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = gerarNomeArquivo(`backup-${alvo}`, 'json');
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
                carregarDatalistSugestoes(); 
                if(alvoRestauracao === 'tudo' || alvoRestauracao === 'dados_usuario') carregarModuloEu();
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
            const stores = ['financas_pessoais', 'dados_usuario', 'clientes', 'estoque', 'vendas', 'dados_empresa']; 
            const t = db.transaction(stores, "readwrite"); 
            stores.forEach(st => t.objectStore(st).clear()); 
            t.oncomplete = () => { alert("Banco de dados limpo."); carregarDatalistSugestoes(); carregarModuloEu(); }; 
        } 
    } 
}

window.onload = initDB;
window.addEventListener('resize', () => { if(document.getElementById('view-print-preview').classList.contains('active')) ajustarEscalaPreview(); });