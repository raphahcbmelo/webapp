// ==========================================
// UX PESSOAL (Módulo EU, Notas e Agenda)
// ==========================================

let perfilAtual = null;

// 1. CARREGAMENTO DA TELA "EU"
function carregarModuloEu() {
    const t = db.transaction(['dados_usuario'], "readonly"); 
    const s = t.objectStore('dados_usuario');
    
    // Busca os dados pessoais
    s.get('perfil').onsuccess = (e) => {
        perfilAtual = e.target.result;
        if(perfilAtual) {
            document.getElementById('bloco-sem-perfil').style.display = 'none'; 
            document.getElementById('bloco-com-perfil').style.display = 'block';
            document.getElementById('txt-nome-completo').innerText = `${perfilAtual.nome} ${perfilAtual.sobrenome}`.toUpperCase();
            document.getElementById('txt-cpf').innerText = perfilAtual.cpf || 'Não informado'; 
            document.getElementById('txt-nasc').innerText = formatarDataBR(perfilAtual.nasc) || 'Não informado';
        } else { 
            document.getElementById('bloco-sem-perfil').style.display = 'block'; 
            document.getElementById('bloco-com-perfil').style.display = 'none'; 
        }
    };
    
    // Busca as contas bancárias
    let bancos = []; 
    s.openCursor().onsuccess = (e) => { 
        let c = e.target.result; 
        if(c) { 
            if(c.value.id.startsWith('banco-')) bancos.push(c.value); 
            c.continue(); 
        } else { 
            renderizarBancosEu(bancos); 
        } 
    };
}

// 2. GESTÃO DO PERFIL
function abrirModalPerfil(editar = false) {
    if(editar && perfilAtual) { 
        document.getElementById('perfil-nome').value = perfilAtual.nome; 
        document.getElementById('perfil-sobrenome').value = perfilAtual.sobrenome; 
        document.getElementById('perfil-cpf').value = perfilAtual.cpf; 
        document.getElementById('perfil-nasc').value = perfilAtual.nasc; 
    } else { 
        document.getElementById('perfil-nome').value = ''; 
        document.getElementById('perfil-sobrenome').value = ''; 
        document.getElementById('perfil-cpf').value = ''; 
        document.getElementById('perfil-nasc').value = ''; 
    }
    document.getElementById('modal-perfil').style.display = 'flex';
}

function salvarPerfil() {
    const nome = document.getElementById('perfil-nome').value.trim(); 
    const sobrenome = document.getElementById('perfil-sobrenome').value.trim(); 
    const cpf = document.getElementById('perfil-cpf').value.trim(); 
    const nasc = document.getElementById('perfil-nasc').value;
    
    if(!nome || !sobrenome) { alert("Os campos de identificação nominal são obrigatórios."); return; }
    
    const t = db.transaction(['dados_usuario'], "readwrite"); 
    t.objectStore('dados_usuario').put({ id: 'perfil', nome, sobrenome, cpf, nasc }); 
    t.oncomplete = () => { fecharModais(); carregarModuloEu(); };
}

function apagarPerfil() { 
    if(confirm("Deseja remover as informações base de perfil?")) { 
        const t = db.transaction(['dados_usuario'], "readwrite"); 
        t.objectStore('dados_usuario').delete('perfil'); 
        t.oncomplete = () => { carregarModuloEu(); }; 
    } 
}

// 3. GESTÃO DE CONTAS BANCÁRIAS
function abrirModalBanco(idBanco = null) {
    if(idBanco) {
        db.transaction(['dados_usuario'], "readonly").objectStore('dados_usuario').get(idBanco).onsuccess = (e) => {
            let b = e.target.result; 
            document.getElementById('banco-id').value = b.id; 
            document.getElementById('banco-nome').value = b.banco;
            document.getElementById('banco-ag').value = b.agencia; 
            document.getElementById('banco-cc').value = b.conta; 
            document.getElementById('banco-pix').value = b.pix;
            document.getElementById('modal-banco').style.display = 'flex';
        };
    } else { 
        document.getElementById('banco-id').value = ''; 
        document.getElementById('banco-nome').value = ''; 
        document.getElementById('banco-ag').value = ''; 
        document.getElementById('banco-cc').value = ''; 
        document.getElementById('banco-pix').value = ''; 
        document.getElementById('modal-banco').style.display = 'flex'; 
    }
}

function salvarBanco() {
    let id = document.getElementById('banco-id').value; 
    if(!id) id = 'banco-' + Date.now();
    
    const banco = document.getElementById('banco-nome').value.trim().toUpperCase(); 
    const agencia = document.getElementById('banco-ag').value.trim(); 
    const conta = document.getElementById('banco-cc').value.trim(); 
    const pix = document.getElementById('banco-pix').value.trim();
    
    if(!banco || !pix) { alert("Os campos Banco e Chave Pix são obrigatórios."); return; }
    
    const t = db.transaction(['dados_usuario'], "readwrite"); 
    t.objectStore('dados_usuario').put({ id, banco, agencia, conta, pix }); 
    t.oncomplete = () => { fecharModais(); carregarModuloEu(); };
}

function renderizarBancosEu(bancos) {
    const lista = document.getElementById('lista-bancos-eu'); 
    if(bancos.length === 0) { 
        lista.innerHTML = `<p style="color:var(--cor-primaria); font-size:0.85rem; font-weight:bold;">Nenhuma instituição financeira catalogada.</p>`; 
        return; 
    }
    
    let html = ''; 
    bancos.forEach(b => {
        html += `<div class="dados-box" style="padding: 12px; margin-bottom: 10px; border-color:var(--cor-primaria);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                <strong style="color: var(--cor-primaria);">🏦 ${b.banco}</strong>
                <div style="display: flex; gap: 10px;">
                    <button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="copiarDadosBanco('${b.id}')">📋</button>
                    <button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="abrirModalBanco('${b.id}')">✏️</button>
                    <button style="background:none; border:none; font-size:1.1rem; cursor:pointer;" onclick="apagarBanco('${b.id}')">🗑️</button>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: #333;">
                <p>Ag: ${b.agencia || '-'} | CC: ${b.conta || '-'}</p><p style="color: #2e7d32; font-weight: bold; margin-top: 3px;">PIX: ${b.pix}</p>
            </div></div>`;
    }); 
    lista.innerHTML = html;
}

function apagarBanco(id) { 
    if(confirm("Confirmar a exclusão dos parâmetros desta conta?")) { 
        const t = db.transaction(['dados_usuario'], "readwrite"); 
        t.objectStore('dados_usuario').delete(id); 
        t.oncomplete = () => { carregarModuloEu(); }; 
    } 
}

function copiarDadosBanco(idBanco) {
    if(!perfilAtual) { alert("Cadastre os dados de perfil base antes de gerar cópias."); return; }
    db.transaction(['dados_usuario'], "readonly").objectStore('dados_usuario').get(idBanco).onsuccess = (e) => {
        let b = e.target.result; if(!b) return;
        let texto = `*DADOS DE TRANSFERÊNCIA COMPLETO*\nTitular: ${perfilAtual.nome} ${perfilAtual.sobrenome}\nBanco: ${b.banco}\n`;
        if(b.agencia) texto += `Agência: ${b.agencia}\n`; 
        if(b.conta) texto += `Conta: ${b.conta}\n`; 
        texto += `*Chave Pix: ${b.pix}*`;
        
        navigator.clipboard.writeText(texto).then(() => { 
            alert("Estrutura de transferência enviada para a área de transferência."); 
        }).catch(err => { 
            alert("Acesso bloqueado."); 
        });
    };
}