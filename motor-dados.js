// ==========================================
// ARMÁRIO DE DADOS (IndexedDB)
// ==========================================

let db; 
const dbName = "FinancasDB"; 

function initDB() { 
    try {
        const req = indexedDB.open(dbName, 3); 
        
        req.onsuccess = (e) => { 
            db = e.target.result; 
            console.log("📦 Armário de Dados aberto com sucesso.");
            // Dispara um alarme avisando a Interface (UX) que o banco está pronto para uso
            window.dispatchEvent(new Event('bancoCarregado'));
        }; 
        
        req.onupgradeneeded = (e) => { 
            let d = e.target.result; 
            console.log("🔨 Construindo gavetas do banco de dados...");
            
            // Criando as 6 Gavetas Blindadas
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

// Dá a partida no motor de dados assim que o arquivo é lido pelo celular
window.addEventListener('load', initDB);