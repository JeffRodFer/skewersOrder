// Relógio Sincronizado (Horário de Brasília)
function atualizarRelogio() {
    const opcoes = { 
        timeZone: 'America/Sao_Paulo', 
        dateStyle: 'short', 
        timeStyle: 'medium' 
    };
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', opcoes).format(new Date());
    document.getElementById('relogio').innerText = dataFormatada;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// ---------------------------------------------------
// COMUNICAÇÃO COM O SERVIDOR (NODE.JS / NEON)
// ---------------------------------------------------
const API_URL = 'https://skewersorder.onrender.com';

let comidas = [];
let bebidas = [];
let carrinho = {};
let dadosCliente = {};

// Nova função que busca os itens diretamente do banco de dados
async function carregarCardapio() {
    try {
        const resposta = await fetch(`${API_URL}/cardapio`);
        const produtosBrutos = await resposta.json();

        // Converte o preço de "texto" para "número matemático"
        const produtosProntos = produtosBrutos.map(item => {
            return {
                id: item.id,
                nome: item.nome,
                preco: parseFloat(item.preco), 
                disponivel: item.disponivel,
                categoria: item.categoria
            };
        });

        // Separa o que é comida e bebida para as listas corretas
        comidas = produtosProntos.filter(item => item.categoria === 'comida');
        bebidas = produtosProntos.filter(item => item.categoria === 'bebida');

        // Chama a função visual
        renderizarLista(comidas, 'lista-comidas', 'item-carne');
        renderizarLista(bebidas, 'lista-bebidas', 'item-bebida');

    } catch (erro) {
        console.error("Erro:", erro);
        alert("Falha ao carregar o cardápio do servidor.");
    }
}

// ---------------------------------------------------
// FUNÇÕES DE INTERFACE VISUAL E CARRINHO
// ---------------------------------------------------

// Renderizar Produtos na Tela
function renderizarLista(itens, idContainer, classeCor) {
    const container = document.getElementById(idContainer);
    container.innerHTML = '';
    
    itens.forEach(item => {
        if(!item.disponivel) return;

        carrinho[item.id] = 0; 
        
        const div = document.createElement('div');
        div.className = `produto ${classeCor}`;
        
        let precoFormatado = item.preco.toFixed(2).replace('.', ',');
        
        div.innerHTML = `
            <div>
                <strong>${item.nome}</strong><br>
                <small>R$ ${precoFormatado}</small>
            </div>
            <div class="controles">
                <button class="btn-qtd" 
                        onclick="alterarQtd('${item.id}', -1)">-</button>
                <span id="qtd-${item.id}">0</span>
                <button class="btn-qtd" 
                        onclick="alterarQtd('${item.id}', 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Inicializa o processo buscando os dados ao abrir a página
carregarCardapio();

// Funções de Interação e Modais
function alterarQtd(id, valor) {
    if(carrinho[id] + valor >= 0) {
        carrinho[id] += valor;
        document.getElementById(`qtd-${id}`).innerText = carrinho[id];
    }
}

function abrirModalCadastro() { 
    document.getElementById('modalCadastro').style.display = 'block'; 
}

function fecharModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

function abrirModalAdmin() { 
    document.getElementById('modalAdmin').style.display = 'block'; 
}

function verificarEntrega() {
    const tipo = document.getElementById('cli-tipo').value;
    const divEnd = document.getElementById('div-endereco');
    divEnd.style.display = (tipo === 'entregar') ? 'block' : 'none';
}

function salvarCadastro() {
    dadosCliente = {
        nome: document.getElementById('cli-nome').value,
        telefone: document.getElementById('cli-telefone').value,
        tipo: document.getElementById('cli-tipo').value,
        endereco: document.getElementById('cli-endereco').value
    };
    
    if(!dadosCliente.nome) {
        return alert("Por favor, preencha o seu nome!");
    }
    
    fecharModal('modalCadastro');
    alert("Cadastro salvo! Escolha os seus espetinhos.");
}

function abrirResumo() {
    if(!dadosCliente.nome) {
        alert("Clique em INICIAR PEDIDO primeiro para se identificar.");
        return abrirModalCadastro();
    }

    let tipoTxt = dadosCliente.tipo === 'entregar' 
        ? `Entrega (${dadosCliente.endereco})` 
        : 'Retirada no local';
        
    let html = `<strong>Cliente:</strong> ${dadosCliente.nome}<br>`;
    html += `<strong>Tipo:</strong> ${tipoTxt}<br><br>`;
    
    let total = 0;
    const todosItens = [...comidas, ...bebidas];
    
    html += `<strong>Itens Escolhidos:</strong><br>`;
    
    todosItens.forEach(item => {
        let qtd = carrinho[item.id];
        if(qtd > 0) {
            let subtotal = qtd * item.preco;
            total += subtotal;
            let subFormatado = subtotal.toFixed(2).replace('.', ',');
            html += `${qtd}x ${item.nome} - R$ ${subFormatado}<br>`;
        }
    });

    if(dadosCliente.tipo === 'entregar') {
        html += `<br><small>* Taxa de entrega a combinar.</small>`;
    }

    document.getElementById('conteudo-resumo').innerHTML = html;
    let totalFormatado = total.toFixed(2).replace('.', ',');
    document.getElementById('valor-total').innerText = `Total: R$ ${totalFormatado}`;
    
    document.getElementById('modalResumo').style.display = 'block';
}

function enviarPedidoWhatsApp() {
  const texto = document.getElementById('conteudo-resumo').innerText;
  const total = document.getElementById('valor-total').innerText;
  
  const querFarofa = document.querySelector('input[name="farofa"]:checked').value;
  const querVinagrete = document.querySelector('input[name="vinagrete"]:checked').value;
  
  const obs = document.getElementById('obs-pedido').value;
  
  let extras = `\n*Acompanhamentos:*\n`;
  extras += `- Farofa: ${querFarofa}\n`;
  extras += `- Vinagrete: ${querVinagrete}\n`;
  
  if (obs.trim() !== "") {
    extras += `\n*Observações:*\n${obs}\n`;
  }
  
  let msg = `*Novo Pedido - Espetinho do Chefe*\n\n`;
  msg += `${texto}\n`;
  msg += `${extras}\n`;
  msg += `*${total}*`;
  
  let numeroAdmin = "5581920036280"; 
  
  let url = `https://wa.me/${numeroAdmin}?text=` + encodeURIComponent(msg);
            
  window.open(url, '_blank');
}
