// ==========================================
// UX SISTEMA (Configurações, Temas e Calculadora)
// ==========================================

// 1. ATUALIZAÇÃO DO PWA
function forcarAtualizacao() {
    if(confirm("Confirma a verificação de atualizações no servidor?")) {
        // Envia uma mensagem para o Service Worker apagar o cofre
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({type: 'CLEAR_CACHES'});
        }
        // Recarrega a página forçando a busca na rede
        setTimeout(() => {
            window.location.reload(true);
        }, 500);
    }
}

// 2. COPIAR PIX DE DOAÇÃO
function copiarPixDoacao() {
    const pixKey = "182edc11-4ace-46c1-ad6f-ad3dec83eb32";
    navigator.clipboard.writeText(pixKey).then(() => { 
        alert("Chave Pix de suporte copiada com sucesso."); 
    }).catch(err => { 
        alert("Recurso bloqueado pelo navegador."); 
    });
}

// 3. GESTÃO DE TEMAS (Cores do Aplicativo)
function abrirModalTema() {
    fecharModais();
    document.getElementById('modal-tema').style.display = 'flex';
}

function salvarTema() {
    const temaEscolhido = document.querySelector('input[name="rad-tema"]:checked').value;
    
    // Salva a escolha no Armário de Dados (na gaveta do usuário)
    const t = db.transaction(['dados_usuario'], "readwrite"); 
    t.objectStore('dados_usuario').put({ id: 'config_tema', tema: temaEscolhido }); 
    
    t.oncomplete = () => { 
        aplicarTemaNaTela(temaEscolhido);
        fecharModais(); 
    };
}

function carregarTemaSalvo() {
    const t = db.transaction(['dados_usuario'], "readonly"); 
    const req = t.objectStore('dados_usuario').get('config_tema');
    
    req.onsuccess = (e) => {
        if(e.target.result && e.target.result.tema) {
            aplicarTemaNaTela(e.target.result.tema);
            // Marca o radio button correto no modal
            const radio = document.getElementById(`tema-${e.target.result.tema}`);
            if(radio) radio.checked = true;
        }
    };
}

function aplicarTemaNaTela(tema) {
    // Remove todos os temas anteriores do body
    document.body.className = '';
    
    // Se não for o clássico, adiciona a classe do tema escolhido
    if(tema !== 'classico') {
        document.body.classList.add(`theme-${tema}`);
    }
}

// 4. INTERFACE DA CALCULADORA
// Os botões do HTML chamam as funções calcInput e calcAction que estão no motor-recursos.js

// 5. INTERFACE DE BACKUP
function acionarImportacaoUX(alvo) {
    alvoRestauracao = alvo; // Variável global do motor-recursos.js
    document.getElementById('input-importar').click();
}