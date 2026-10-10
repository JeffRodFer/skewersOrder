// Relógio Sincronizado (Horário de Brasília)
function atualizarRelogio() {
  const opcoes = {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium'
  };

  const relogio = new Intl.DateTimeFormat('pt-BR', opcoes);
  const dataFormatada = relogio.format(new Date());

  document.getElementById('relogio').innerText = dataFormatada;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// ---------------------------------------------------
// COMUNICAÇÃO COM O SERVIDOR
// ---------------------------------------------------

// DICA: Use localhost enquanto estiver programando. 
// Troque para o Render apenas quando for publicar o site.
const API_URL = 'http://localhost:3000';

// ARQUIVO: script.js
const url = 'http://localhost:3000/api/cardapio';

fetch(url)
  .then(resposta => resposta.json())
  .then(dados => {
    // Vamos ver os dados chegando no painel do navegador!
    console.log("Meus espetinhos:", dados.produtos);
  })
  .catch(erro => console.error("Erro:", erro));

let comidas = [];
let bebidas = [];
let carrinho = {};
let dadosCliente = {};
let credenciaisAdmin = { user: "", pass: "" };

// CORREÇÃO: A gaveta do WhatsApp foi criada aqui
let numeroZap = "";

async function carregarCardapio() {
  try {
    const url = `${API_URL}/api/cardapio`;
    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error("Erro na API");
    }

    const dadosDoServidor = await resposta.json();
    numeroZap = dadosDoServidor.whatsapp;

    // 1. Abre a "caixa grande" e prepara os produtos
    const produtosProntos = dadosDoServidor.produtos.map(item => {
      return {
        id: item.id,
        nome: item.nome,
        preco: parseFloat(item.preco),
        disponivel: item.disponivel,
        categoria: item.categoria
      };
    });

    // 2. Separa as "Comidas" e "Bebidas"
    comidas = produtosProntos.filter(item =>
      item.categoria.toLowerCase() === 'comida'
    );

    bebidas = produtosProntos.filter(item =>
      item.categoria.toLowerCase() === 'bebida'
    );

    // 3. Coloca os itens na "vitrine" da página
    renderizarLista(comidas, 'lista-carnes', 'item-carne');
    renderizarLista(bebidas, 'lista-bebidas', 'item-bebida');

  } catch (erro) {
    console.error("Erro ao buscar cardápio:", erro);
  }
}


// ---------------------------------------------------
// FUNÇÕES DE INTERFACE VISUAL E CARRINHO
// ---------------------------------------------------

// Renderizar Produtos na Tela
function renderizarLista(itens, idContainer, classeCor) {
  const container = document.getElementById(idContainer);

  // Dica de Especialista (Nível Médio): Essa trava de segurança evita que 
  // o seu site quebre caso alguém apague a div do HTML sem querer.
  if (!container) {
    console.error(`Erro: Não encontrei a div id="${idContainer}" no HTML.`);
    return;
  }

  container.innerHTML = '';

  itens.forEach(item => {
    // Se o item foi desativado no painel gerencial, ele é pulado e não aparece
    if (!item.disponivel) return;

    // Inicia a quantidade desse item no carrinho como Zero
    carrinho[item.id] = 0;

    const div = document.createElement('div');
    div.className = `item-lista ${classeCor}`; // Adicionei 'item-lista' para manter o CSS que fizemos

    // ... aqui você continua com o restante do seu código (os botões de + e -)

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

// ===================================================
// FUNÇÕES DE INTERAÇÃO E MODAIS
// ===================================================

function alterarQtd(id, valor) {
  if (carrinho[id] + valor >= 0) {
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

  if (!dadosCliente.nome) {
    return alert("Por favor, preencha o seu nome!");
  }

  fecharModal('modalCadastro');
  alert("Cadastro salvo! Escolha os seus espetinhos.");
}

function abrirResumo() {
  if (!dadosCliente.nome) {
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

  // Variável para verificar se escolheu algo
  let temItem = false;

  html += `<strong>Itens Escolhidos:</strong><br>`;

  todosItens.forEach(item => {
    let qtd = carrinho[item.id];
    if (qtd > 0) {
      temItem = true;
      let subtotal = qtd * item.preco;
      total += subtotal;
      let subFormatado = subtotal.toFixed(2).replace('.', ',');
      html += `${qtd}x ${item.nome} - R$ ${subFormatado}<br>`;
    }
  });

  // Trava: se não escolheu nada, avisa e não abre o resumo
  if (!temItem) {
    return alert("Por favor, escolha pelo menos um item antes de encerrar o pedido!");
  }

  if (dadosCliente.tipo === 'entregar') {
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

  // CORREÇÃO: Usa o número de WhatsApp que veio do seu servidor (.env)
  let url = `https://wa.me/${numeroZap}?text=` + encodeURIComponent(msg);

  window.open(url, '_blank');

  // CORREÇÃO: Recarrega a página após 2 segundos
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// ===================================================
// ÁREA DE ADMINISTRAÇÃO E GESTÃO DE ESTOQUE
// ===================================================

// Recebemos o 'event' aqui nos parênteses
async function loginAdmin(event) {

  // 1. A MÁGICA: Bloqueia o recarregamento automático da página
  if (event) {
    event.preventDefault();
  }

  // 2. Pegamos o que você digitou
  const userDigitado = document.getElementById('admin-user').value;
  const senhaDigitada = document.getElementById('inputSenha').value;

  // 3. Montamos a "mochila"
  const dadosDoLogin = {
    usuario: userDigitado,
    senha: senhaDigitada
  };

  try {
    const url = 'http://localhost:3000/admin/login';
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosDoLogin)
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      alert("Acesso Liberado, Chefe!");
      // Aqui o código continuaria para mostrar o painel
    } else {
      alert("Ops! " + resultado.erro);
    }

  } catch (erro) {
    console.error("Erro na comunicação:", erro);
  }
}
async function abrirPainelAdmin() {
  // 1. Esconde a Loja (cabeçalho, listas, rodapé)
  document.querySelector('header').style.display = 'none';
  document.querySelector('main').style.display = 'none';
  document.querySelector('footer').style.display = 'none';

  // 2. Mostra o Painel
  document.getElementById('painel-admin').style.display = 'block';

  // 3. Busca a lista fresca do banco de dados
  const resposta = await fetch(`${API_URL}/api/cardapio`);
  const dados = await resposta.json();
  const todosProdutos = dados.produtos;

  const divLista = document.getElementById('lista-admin');
  divLista.innerHTML = ''; // Limpa a tela antes de desenhar

  // 4. Desenha a lista de gerenciamento
  todosProdutos.forEach(item => {
    // Se o item estiver disponível, o botão fica vermelho (para desativar)
    // Se estiver indisponível, o botão fica verde (para ativar)
    const corBotao = item.disponivel ? '#ff4d4d' : '#00cc66';
    const textoBotao = item.disponivel ? 'Desativar' : 'Ativar';

    const div = document.createElement('div');
    div.className = 'item-lista';
    div.innerHTML = `
      <div style="color: white;">
        <strong>${item.nome}</strong><br>
        <small>R$ ${parseFloat(item.preco).toFixed(2)} - ${item.categoria}</small>
      </div>
      <div>
        <button onclick="mudarStatusProduto(${item.id}, ${!item.disponivel})" 
                style="background-color: ${corBotao}; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold;">
          ${textoBotao}
        </button>
      </div>
    `;
    divLista.appendChild(div);
  });
}

async function mudarStatusProduto(idProduto, novoStatus) {
  try {
    // 1. Endereço completo apontando para o seu Back-end local
    const url = 'http://localhost:3000/admin/atualizar';

    // 2. O Garçom (fetch) faz o pedido POST
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuario: credenciaisAdmin.user,
        senha: credenciaisAdmin.pass,
        idProduto: idProduto,
        disponivel: novoStatus
      })
    });

    // 3. Captura a resposta do Back-end
    const resultado = await resposta.json();

    if (resposta.ok) {
      console.log("Sucesso:", resultado.mensagem);
      alert("Status alterado com sucesso!");
    } else {
      console.error("Erro:", resultado.erro);
      alert("Acesso Negado: " + resultado.erro);
    }

  } catch (erro) {
    console.error("Falha na comunicação:", erro);
  }
}

function fecharPainelAdmin() {
  // Dá um F5 na página inteira. 
  // Isso limpa as senhas da memória e volta para a tela de cliente perfeitamente segura.
  window.location.reload();
}