// ==========================================
// UX NEGÓCIOS (Empresa, Clientes, Estoque e Vendas)
// ==========================================

// ------------------------------------------
// 1. MÓDULO: NEGÓCIO (Dados da Empresa)
// ------------------------------------------
function carregarModuloNegocio() {
    // Placeholder para futura implementação
    // Aqui será feita a leitura da gaveta 'dados_empresa'
    console.log("Módulo Negócio acessado.");
}

function salvarDadosEmpresa() {
    // Placeholder para futura implementação
    // Aqui será feita a gravação na gaveta 'dados_empresa'
}

// ------------------------------------------
// 2. MÓDULO: CLIENTES (CRM)
// ------------------------------------------
function carregarModuloClientes() {
    // Placeholder para futura implementação
    // Aqui será feita a leitura da gaveta 'dados_clientes'
    console.log("Módulo Clientes acessado.");
}

function salvarCliente() {
    // Placeholder para futura implementação
    // Aqui será feita a gravação na gaveta 'dados_clientes'
}

// ------------------------------------------
// 3. MÓDULO: ESTOQUE (Catálogo de Produtos)
// ------------------------------------------
function carregarModuloEstoque() {
    // Placeholder para futura implementação
    // Aqui será feita a leitura da gaveta 'dados_produtos'
    console.log("Módulo Estoque acessado.");
}

function salvarProduto() {
    // Placeholder para futura implementação
    // Aqui será feita a gravação na gaveta 'dados_produtos'
}

// ------------------------------------------
// 4. MÓDULO: VENDAS (Frente de Caixa / PDV)
// ------------------------------------------
function carregarModuloVendas() {
    // Placeholder para futura implementação
    // Aqui será feita a leitura da gaveta 'dados_vendas'
    console.log("Módulo Vendas acessado.");
}

function registrarVenda() {
    // Placeholder para futura implementação
    // Aqui será feita a gravação na gaveta 'dados_vendas'
    // E possivelmente uma integração com a gaveta 'financas_pessoais' (ou financas_empresa no futuro)
}

// ==========================================
// INTERCEPTADORES DE NAVEGAÇÃO
// ==========================================
// Adicionando escutas para carregar os dados automaticamente quando a tela for aberta
document.addEventListener('click', (e) => {
    // Verifica se o clique foi em um ícone de aplicativo
    const appIcon = e.target.closest('.app-icon');
    if (!appIcon) return;

    // Pega a função onclick do elemento como string para descobrir qual tela está sendo aberta
    const onclickAttr = appIcon.getAttribute('onclick');
    if (!onclickAttr) return;

    if (onclickAttr.includes("abrirApp('view-negocio')")) {
        setTimeout(carregarModuloNegocio, 250);
    } else if (onclickAttr.includes("abrirApp('view-clientes')")) {
        setTimeout(carregarModuloClientes, 250);
    } else if (onclickAttr.includes("abrirApp('view-estoque')")) {
        setTimeout(carregarModuloEstoque, 250);
    } else if (onclickAttr.includes("abrirApp('view-vendas')")) {
        setTimeout(carregarModuloVendas, 250);
    }
});