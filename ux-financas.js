// ==========================================
// UX FINANÇAS (Registros, Diário, Dossiê e Gráficos)
// ==========================================

// 1. TELA DE REGISTROS (Formulário)
let tipoForm = 'receita'; 
function setTipoForm(tipo) { 
    tipoForm = tipo; 
    document.getElementById('form-tipo-receita').classList.remove('active', 'receita'); 
    document.getElementById('form-tipo-despesa').classList.remove('active', 'despesa'); 
    document.getElementById(`form-tipo-${tipo}`).classList.add('active', tipo); 
}

function toggleRecorrenciaForm() { 
    const chk = document.getElementById('form-recorrente').checked; 
    document.getElementById('bloco-recorrencia').style.display = chk ? 'block' : 'none'; 
    document.getElementById('grp-data-limite').style.display = chk ? 'block' : 'none'; 
    ajustarLabelsData(); 
}

function ajustarLabelsData() { 
    const chk = document.getElementById('form-recorrente').checked; 
    const f = document.getElementById('form-frequencia').value; 
    const lbl = document.getElementById('lbl-data-inicial'); 
    if(!chk) { lbl.innerText = "DATA DO REGISTRO:"; return; } 
    if(f === 'diario') lbl.innerText = "DATA DE INÍCIO:"; 
    if(f === 'semanal') lbl.innerText = "1º REGISTRO:"; 
    if(f === 'mensal') lbl.innerText = "DATA BASE:"; 
}

function capturarEMandarProBanco() {
    const nome = document.getElementById('form-nome').value.trim().toUpperCase(); 
    const dIni = document.getElementById('form-data-inicio').value; 
    const dLim = document.getElementById('form-data-limite').value; 
    const val = parseFloat(document.getElementById('form-valor').value); 
    const rec = document.getElementById('form-recorrente').checked; 
    const freq = document.getElementById('form-frequencia').value;
    
    if(!nome || !dIni || isNaN(val) || val <= 0) { alert("Por favor, preencha os dados do registro em conformidade."); return; }
    
    const t = db.transaction(['financas_pessoais'], "readwrite"); 
    const s = t.objectStore('financas_pessoais'); 
    const loteId = "LOTE-" + Date.now();
    
    if (!rec) { 
        s.add({ id: `${dIni.replace(/-/g,'')}-${nome}-${Date.now()}`, lote: loteId, data: dIni, nome: nome, valor: val, tipo: tipoForm }); 
    } else {
        if(!dLim) { alert("A definição de data limite é obrigatória."); return; }
        let dAtual = new Date(dIni + 'T00:00:00'); 
        let dFim = new Date(dLim + 'T00:00:00'); 
        let diaOriginal = dAtual.getDate();
        
        while(dAtual <= dFim) {
            let dFmt = dAtual.toISOString().split('T')[0]; 
            s.add({ id: `${dFmt.replace(/-/g,'')}-${nome}-${Math.random().toString(36).substr(2, 5)}`, lote: loteId, data: dFmt, nome: nome, valor: val, tipo: tipoForm });
            if(freq === 'diario') dAtual.setDate(dAtual.getDate() + 1); 
            else if(freq === 'semanal') dAtual.setDate(dAtual.getDate() + 7);
            else if(freq === 'mensal') { 
                let mesOrig = dAtual.getMonth(); 
                dAtual.setMonth(dAtual.getMonth() + 1); 
                dAtual.setDate(diaOriginal); 
                if (dAtual.getMonth() !== (mesOrig + 1) % 12) dAtual.setDate(0); 
            }
        }
    }
    t.oncomplete = () => { 
        alert("Transação armazenada com sucesso."); 
        document.getElementById('form-nome').value = ''; 
        document.getElementById('form-valor').value = ''; 
        carregarDatalistSugestoes(); 
    };
}

function carregarDatalistSugestoes() { 
    const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); 
    const n = new Set(); 
    s.openCursor().onsuccess = (e) => { 
        let c = e.target.result; 
        if(c) { n.add(c.value.nome); c.continue(); } 
        else { 
            const dl = document.getElementById('lista-contas'); 
            dl.innerHTML = ''; 
            n.forEach(x => dl.innerHTML += `<option value="${x}">`); 
        } 
    }; 
}

// 2. TELA DE DIÁRIO
function carregarDiario() {
    const de = document.getElementById('diario-data-de').value; 
    const ate = document.getElementById('diario-data-ate').value; 
    const verRec = document.getElementById('chk-diario-receita').checked; 
    const verDes = document.getElementById('chk-diario-despesa').checked;
    
    if(!de || !ate) return; 
    
    const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); 
    let reg = [];
    
    s.openCursor().onsuccess = (e) => {
        let c = e.target.result; 
        if(c) { 
            let r = c.value; 
            if(r.data >= de && r.data <= ate) { 
                if((verRec && r.tipo === 'receita') || (verDes && r.tipo === 'despesa')) { reg.push(r); } 
            } 
            c.continue(); 
        } else { 
            reg.sort((a,b) => a.data.localeCompare(b.data)); 
            renderizarHTMLDiario(reg); 
        }
    };
}

function renderizarHTMLDiario(reg) {
    const lista = document.getElementById('diario-lista'); 
    if(reg.length === 0) { 
        lista.innerHTML = `<p style="text-align: center; color: var(--cor-primaria); margin-top: 30px; font-weight:bold;">[ Base limpa. Sem registros no escopo ]</p>`; 
        return; 
    }
    let html = ''; 
    reg.forEach(r => { 
        let corV = r.tipo === 'receita' ? '#2e7d32' : '#c62828'; 
        let sinal = r.tipo === 'despesa' ? '- ' : '';
        html += `<div class="diario-item ${r.tipo}"><div class="diario-info"><div class="diario-data">${formatarDataBR(r.data)}</div><div class="diario-nome">${r.nome}</div><div class="diario-valor" style="color: ${corV};">${sinal}${formatarMoeda(r.valor)}</div></div><div class="diario-acoes"><button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="abrirModalEditarDiario('${r.id}')">✏️</button><button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="apagarLancamentoDiario('${r.id}')">🗑️</button></div></div>`; 
    }); 
    lista.innerHTML = html;
}

function apagarLancamentoDiario(id) { 
    if(confirm("Confirmar a remoção definitiva do lançamento do diário?")) { 
        const t = db.transaction(['financas_pessoais'], "readwrite"); 
        t.objectStore('financas_pessoais').delete(id); 
        t.oncomplete = () => { carregarDiario(); carregarDatalistSugestoes(); }; 
    } 
}

function abrirModalEditarDiario(id) {
    const t = db.transaction(['financas_pessoais'], "readonly"); 
    const req = t.objectStore('financas_pessoais').get(id);
    req.onsuccess = () => {
        const r = req.result; if(!r) return;
        document.getElementById('edit-id').value = r.id; 
        document.getElementById('edit-tipo').value = r.tipo; 
        document.getElementById('edit-lote').value = r.lote || '';
        document.getElementById('edit-data').value = r.data; 
        document.getElementById('edit-nome').value = r.nome; 
        document.getElementById('edit-valor').value = r.valor;
        document.getElementById('modal-editar-diario').style.display = 'flex';
    };
}

function salvarEdicaoDiario() {
    const id = document.getElementById('edit-id').value; 
    const tipo = document.getElementById('edit-tipo').value; 
    const lote = document.getElementById('edit-lote').value; 
    const data = document.getElementById('edit-data').value; 
    const nome = document.getElementById('edit-nome').value.trim().toUpperCase(); 
    const valor = parseFloat(document.getElementById('edit-valor').value);
    
    if(!nome || !data || isNaN(valor) || valor <= 0) { alert("Valores inconsistentes."); return; }
    
    const t = db.transaction(['financas_pessoais'], "readwrite"); 
    t.objectStore('financas_pessoais').put({ id: id, lote: lote, data: data, nome: nome, valor: valor, tipo: tipo }); 
    t.oncomplete = () => { fecharModais(); carregarDiario(); carregarDatalistSugestoes(); };
}

// 3. TELA DE RELATÓRIOS (Dossiê)
let htmlDossieAtual = '';
function gerarRelatorioDossie() {
    const de = document.getElementById('dossie-data-de').value; 
    const ate = document.getElementById('dossie-data-ate').value; 
    const tipo = document.getElementById('dossie-tipo').value;
    
    if(!de || !ate) return; 
    
    const s = db.transaction(['financas_pessoais'], "readonly").objectStore('financas_pessoais'); 
    let reg = []; let tR = 0; let tD = 0;
    
    s.openCursor().onsuccess = (e) => {
        let c = e.target.result; 
        if(c) { 
            let r = c.value; 
            if(r.data >= de && r.data <= ate && (tipo === 'todos' || r.tipo === tipo)) { 
                reg.push(r); 
                if(r.tipo === 'receita') tR += r.valor; 
                if(r.tipo === 'despesa') tD += r.valor; 
            } 
            c.continue(); 
        } else { 
            renderHTMLDossie(reg, tR, tD, de, ate); 
        }
    };
}

function gerarHTMLTabelaDinamica(reg, corBorda, corTextoBase) {
    if(reg.length === 0) return `<p style="text-align: center; color: var(--cor-primaria); margin-top: 20px; font-weight:bold;">[ Sem movimentações registradas ]</p>`;
    let datas = [...new Set(reg.map(r => r.data))].sort((a,b) => a.localeCompare(b)); 
    let contas = [...new Set(reg.map(r => r.nome))].sort();
    let headerBg = (corTextoBase === '#000000') ? '#f2f2f2' : 'rgba(255,255,255,0.1)';
    
    let fontScale = '0.85rem';
    if(contas.length > 3) fontScale = '0.7rem'; 
    if(contas.length > 5) fontScale = '0.55rem'; 
    if(contas.length > 7) fontScale = '0.45rem';

    let table = `<table style="width: 100%; border-collapse: collapse; font-size: ${fontScale}; text-align: center; color: ${corTextoBase};">`;
    table += `<thead><tr style="background: ${headerBg};"><th style="padding: 6px; border: 1px solid ${corBorda};">DATA</th>`;
    contas.forEach(c => table += `<th style="padding: 6px; border: 1px solid ${corBorda};">${c}</th>`); 
    table += `</tr></thead><tbody>`;
    
    datas.forEach(d => {
        table += `<tr><td style="padding: 6px; border: 1px solid ${corBorda}; white-space: nowrap;">${formatarDataBR(d)}</td>`;
        contas.forEach(c => {
            let sum = reg.filter(r => r.data === d && r.nome === c).reduce((acc, curr) => acc + curr.valor, 0); 
            let tipo = reg.find(r => r.nome === c)?.tipo; 
            let sinal = tipo === 'despesa' ? '- ' : '';
            let valStr = sum > 0 ? sinal + formatarMoeda(sum) : '-';
            
            let color = sum > 0 ? (tipo === 'receita' ? '#2e7d32' : '#c62828') : corTextoBase;
            if(corTextoBase === '#000000') color = '#000000'; 
            
            table += `<td style="padding: 6px; border: 1px solid ${corBorda}; color: ${color}; font-weight: bold;">${valStr}</td>`;
        }); 
        table += `</tr>`;
    }); 
    table += `</tbody></table>`; 
    
    if(corTextoBase !== '#000000') { return `<div style="width: 100%; overflow-x: auto;">${table}</div>`; }
    return table;
}

function renderHTMLDossie(reg, tR, tD, de, ate) {
    document.getElementById('dossie-resumo').style.display = 'grid'; 
    document.getElementById('resumo-receitas').innerText = formatarMoeda(tR); 
    document.getElementById('resumo-despesas').innerText = '- ' + formatarMoeda(tD);
    
    let s = tR - tD; 
    let pS = document.getElementById('resumo-saldo'); 
    pS.innerText = formatarMoeda(s);
    pS.classList.remove('text-green', 'text-red', 'text-white'); 
    if(s > 0) pS.classList.add('text-green'); 
    else if(s < 0) pS.classList.add('text-red'); 
    else pS.classList.add('text-white');
    
    document.getElementById('lista-dossie').innerHTML = gerarHTMLTabelaDinamica(reg, 'var(--cor-primaria)', '#121212');
    
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
    } else { 
        document.getElementById('btn-visualizar-impressao').style.display = 'none'; 
    }
}

function abrirModalPdfDossie() {
    document.getElementById('modal-dossie-pdf').style.display = 'flex';
}

function dispararPdfDossie() {
    fecharModais();
    const orientacao = document.querySelector('input[name="rad-pdf-orientacao-dossie"]:checked').value;
    acionarMotorPDF(htmlDossieAtual, orientacao, 'relatorio-dossie');
}

// 4. TELA DE GRÁFICOS (Radar)
function abrirModalPdfRadar() {
    document.getElementById('modal-radar-pdf').style.display = 'flex';
}

function dispararPdfRadar() {
    fecharModais();
    const orientacao = document.querySelector('input[name="rad-pdf-orientacao"]:checked').value;
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

            // Chama o Motor de Gráficos (motor-recursos.js)
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