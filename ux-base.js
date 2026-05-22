// ==========================================
// UX BASE (Navegação, Modais e Gatilhos)
// ==========================================

// 1. GATILHO TÁTIL (Atraso de 250ms para animação do botão)
function acaoBotao(callback) {
    setTimeout(callback, 250);
}

// 2. NAVEGADOR DE TELAS
function abrirApp(id) { 
    // Esconde todas as telas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); 
    // Mostra a tela solicitada
    document.getElementById(id).classList.add('active'); 
    
    // Regras específicas ao abrir certas telas
    if(id === 'view-dossie') { 
        document.getElementById('dossie-resumo').style.display = 'none'; 
        document.getElementById('btn-visualizar-impressao').style.display = 'none';
        document.getElementById('lista-dossie').innerHTML = '<p style="text-align: center; color: var(--cor-primaria); margin-top: 30px; font-size: 0.8rem; font-weight:bold;">[ Especifique o intervalo cronológico para compilar os dados ]</p>'; 
    } 
    if(id === 'view-diario') { carregarDiario(); } 
    if(id === 'view-eu') { carregarModuloEu(); }
    if(id === 'view-print-preview') { ajustarEscalaPreview(); }
    if(id === 'view-radar') { atualizarPainelContas(); }
}

// 3. CONTROLADOR DE MODAIS
function fecharModais() { 
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); 
}

function abrirModalDoacao() { 
    fecharModais(); 
    document.getElementById('modal-doacao').style.display = 'flex'; 
}

function abrirModalAjudaGlobal() {
    fecharModais();
    document.getElementById('modal-ajuda-global').style.display = 'flex';
}

function abrirAjudaImpressao() {
    document.getElementById('texto-ajuda-dinamico').innerHTML = `
        <strong>🖨️ VISUALIZAÇÃO DE IMPRESSÃO:</strong><br><br>
        Confirme o enquadramento estrutural dos dados na folha física. O sistema reduz automaticamente a escala da fonte caso localize um grande número de colunas, prevenindo cortes nas margens.<br><br>
        Use o botão de rotação (🔄) para ajustar a orientação do papel na sua tela (Retrato/Paisagem).<br><br>
        <strong>Atenção:</strong> Na tela da impressora do seu aparelho, você deve certificar que a opção Paisagem/Retrato esteja igual à selecionada no aplicativo.
    `;
    document.getElementById('modal-ajuda-global').style.display = 'flex';
}

// 4. ENCERRAMENTO SEGURO (Aciona o Motor de Backup e tranca a tela)
function executarEncerramentoSeguro() {
    if(confirm("Deseja realizar o encerramento seguro da sessão? Um backup completo em .json será gerado e baixado automaticamente.")) {
        document.getElementById('loading-pdf').style.display = 'flex';
        
        // Aciona o Motor de Backup (que está no motor-recursos.js)
        exportarBackup('tudo');
        
        // Inutilização instantânea do Viewport (Tranca a tela)
        setTimeout(() => {
            document.getElementById('app-container').innerHTML = `
                <div style="background: var(--cor-primaria); color: var(--cor-secundaria); height: 100dvh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px;">
                    <div style="font-size: 5rem; margin-bottom: 20px;">🔒</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 15px; font-weight: bold; text-transform: uppercase; letter-spacing:1px;">Sessão Encerrada</h2>
                    <p style="font-size: 1rem; color: #fff; line-height: 1.5; max-width: 320px; font-weight:bold;">O arquivo de backup de segurança foi gerado e enviado ao armazenamento do dispositivo de forma isolada.<br><br>Arraste a tela para cima ou feche a aba para sair do aplicativo.</p>
                </div>
            `;
            document.getElementById('loading-pdf').style.display = 'none';
        }, 1500); // Pequeno delay para garantir que o download inicie antes de trancar a tela
    }
}

// 5. INICIALIZAÇÃO DA INTERFACE
// Quando o Motor de Dados avisa que o banco está pronto, a Interface prepara a tela
window.addEventListener('bancoCarregado', () => {
    inicializarMotores(); // Injeta os campos de data
    definingDatasPadrao(); // Preenche com a data de hoje
    carregarTemaSalvo(); // Aplica a cor escolhida pelo usuário
});

// Quando o Motor de Backup avisa que restaurou dados, a Interface recarrega as telas
window.addEventListener('dadosRestaurados', () => {
    carregarDatalistSugestoes(); 
    carregarModuloEu();
});