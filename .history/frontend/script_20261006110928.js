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

// Dados extraídos da imagem (Em ordem alfabética)
const comidas = [
    { id: 'c1', nome: 'Asinha', preco: 8.00, disponivel: true },
    { id: 'c2', nome: 'Calabresa', preco: 10.00, disponivel: true },
    { id: 'c3', nome: 'Carne', preco: 11.00, disponivel: true },
    { id: 'c4', nome: 'Carne c/ Bacon', preco: 14.00, disponivel: true },
    { id: 'c5', nome: 'Carne de Sol c/ Queijo', preco: 14.00, disponivel: true },
    { id: 'c6', nome: 'Coração', preco: 12.00, disponivel: true },
    { id: 'c7', nome: 'Costela Suína', preco: 12.00, disponivel: true },
    { id: 'c8', nome: 'Cupim', preco: 13.00, disponivel: true },
    { id: 'c9', nome: 'Embalagem p/ Viagem', preco: 2.00, disponivel: true },
    { id: 'c10', nome: 'Frango', preco: 12.00, disponivel: true },
    { id: 'c11', nome: 'Frango c/ Bacon', preco: 14.00, disponivel: true },
    { id: 'c12', nome: 'Frango c/ Queijo', preco: 14.00, disponivel: true },
    { id: 'c13', nome: 'Linguiças', preco: 10.00, disponivel: true },
    { id: 'c14', nome: 'Maminha', preco: 13.00, disponivel: true },
    { id: 'c15', nome: 'Misto Especial', preco: 12.00, disponivel: true },
    { id: 'c16', nome: 'Pão de Alho Tradicional', preco: 8.00, disponivel: true },
    { id: 'c17', nome: 'Picanha Nacional', preco: 16.00, disponivel: true },
    { id: 'c18', nome: 'Queijo Coalho', preco: 10.00, disponivel: true },
    { id: 'c19', nome: 'Salsichão', preco: 6.00, disponivel: true },
    { id: 'c20', nome: 'Toscana de Frango', preco: 8.00, disponivel: true },
    { id: 'c21', nome: 'Toscana de Porco', preco: 8.00, disponivel: true }
];

const bebidas = [
    { id: 'b1', nome: 'Água Mineral (c/ gás)', preco: 4.00, disponivel: true },
    { id: 'b2', nome: 'Água Mineral (s/ gás)', preco: 3.00, disponivel: true },
    { id: 'b3', nome: 'Cerv. (Long Neck)', preco: 10.00, disponivel: true },
    { id: 'b4', nome: 'Cerveja Latão', preco: 8.00, disponivel: true },
    { id: 'b5', nome: 'Coca-Cola (Lata)', preco: 6.00, disponivel: true },
    { id: 'b6', nome: 'Energético', preco: 10.00, disponivel: true },
    { id: 'b7', nome: 'H2O', preco: 6.00, disponivel: true },
    { id: 'b8', nome: 'Heineken (Long Neck)', preco: 10.00, disponivel: true },
    { id: 'b9', nome: 'Heineken (Zero)', preco: 10.00, disponivel: true },
    { id: 'b10', nome: 'Ice', preco: 10.00, disponivel: true },
    { id: 'b11', nome: 'Refrigerante Lata', preco: 6.00, disponivel: true },
    { id: 'b12', nome: 'Suco Garrafa', preco: 5.00, disponivel: true }
];

let carrinho = {};
let dadosCliente = {};

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

// Inicializa a renderização
renderizarLista(comidas, 'lista-comidas', 'item-carne');
renderizarLista(bebidas, 'lista-bebidas', 'item-bebida');

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
        return alert("Por favor, preencha seu nome!");
    }
    
    fecharModal('modalCadastro');
    alert("Cadastro salvo! Escolha seus espetinhos.");
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
  // 1. Captura os dados básicos do modal
  const texto = document.getElementById(
    'conteudo-resumo'
  ).innerText;
  
  const total = document.getElementById(
    'valor-total'
  ).innerText;
  
  // 2. Captura as opções marcadas nos botões de rádio
  const querFarofa = document.querySelector(
    'input[name="farofa"]:checked'
  ).value;
  
  const querVinagrete = document.querySelector(
    'input[name="vinagrete"]:checked'
  ).value;
  
  // 3. Captura o texto digitado na observação
  const obs = document.getElementById('obs-pedido').value;
  
  // 4. Monta o bloco de acompanhamentos
  let extras = `\n*Acompanhamentos:*\n`;
  extras += `- Farofa: ${querFarofa}\n`;
  extras += `- Vinagrete: ${querVinagrete}\n`;
  
  // Adiciona as observações apenas se o cliente digitou algo
  if (obs.trim() !== "") {
    extras += `\n*Observações:*\n${obs}\n`;
  }
  
  // 5. Constrói a mensagem final unindo todas as partes
  let msg = `*Novo Pedido - Espetinho do Chefe*\n\n`;
  msg += `${texto}\n`;
  msg += `${extras}\n`;
  msg += `*${total}*`;
  
  let numeroAdmin = "5581995386267"; 
  
  // 6. Codifica o texto para o formato de link e abre a janela
  let url = `https://wa.me/${numeroAdmin}?text=` + 
            encodeURIComponent(msg);
            
  window.open(url, '_blank');
}