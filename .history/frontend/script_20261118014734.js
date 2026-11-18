// === 1. IDENTIDADE DO CLIENTE 2 ===
const ID_CLIENTE = 2;

// ATENÇÃO: Esta linha deve ficar solta no topo do arquivo script.js!
let credenciaisAdmin = { user: '', pass: '' };
let listaGlobalProdutos = [];
let meuGraficoVendas = null;

// === 2. APONTAR PARA O BACKEND CENTRAL ===
const API_URL = `https://skewers-order-backend.vercel.app/api/cardapio?usuario=${ID_CLIENTE}`;
const url = `https://skewers-order-backend.vercel.app/api/cardapio?usuario=${ID_CLIENTE}`;

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

// (As variáveis antigas foram apagadas daqui!)

fetch(url)
  .then(resposta => resposta.json())
  .then(dados => {
    console.log("Meus espetinhos:", dados.produtos);
    listaGlobalProdutos = dados.produtos;
  })
  .catch(erro => console.error("Erro:", erro));

let comidas = [];
let bebidas = [];
let carrinho = {};
let dadosCliente = {};

// CORREÇÃO: A gaveta do WhatsApp foi criada aqui
let numeroZap = "";

async function carregarCardapio() {
  try {
    const API_URL = 'https://skewers-order-backend.vercel.app';
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
    tipo: document.getElementById('cli-tipo').value, // 'retirar' ou 'entregar'
    endereco: document.getElementById('cli-endereco').value
  };

  // 1. Trava de segurança: Nome
  if (!dadosCliente.nome) {
    return alert("Por favor, preencha o seu nome!");
  }

  // 2. Trava de segurança: Endereço obrigatório SE for entrega
  if (dadosCliente.tipo === 'entregar' && !dadosCliente.endereco) {
    return alert("Para entrega, precisamos que preencha o endereço completo!");
  }

  // 3. Tudo certo! Fecha a tela e libera o cardápio
  fecharModal('modalCadastro'); // Ou a função que você usa para fechar
  alert("Cadastro salvo! Escolha os seus espetinhos.");
}

// NOVA FUNÇÃO DO BOTÃO VOLTAR (Colocada logo abaixo)
function fecharModalCadastro() {
  const janelaCadastro = document.getElementById('modalCadastro');

  if (janelaCadastro) {
    janelaCadastro.style.display = 'none';
  }
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

  // === NOVO BLOCO: DAR BAIXA AUTOMÁTICA NO ESTOQUE ===
  const itensComprados = [];
  const todosItens = [...comidas, ...bebidas];

  todosItens.forEach(item => {
    let qtd = carrinho[item.id];
    if (qtd > 0) {
      itensComprados.push({ id: item.id, quantidade: qtd });
    }
  });

  if (itensComprados.length > 0) {
    fetch('https://skewers-order-backend.vercel.app/api/registrar-venda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itensCarrinho: itensComprados })
    }).catch(erro => console.error("Erro ao abater estoque:", erro));
  }
  // === FIM DO NOVO BLOCO ===

  window.open(url, '_blank');

  // CORREÇÃO: Recarrega a página após 2 segundos
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// ==========================================
// 5. FAXINA DO MODAL DE RESUMO (NOVA FUNÇÃO)
// ==========================================
function fecharEResetarResumo() {
  document.querySelector('input[name="farofa"][value="Sim"]').checked = true;
  document.querySelector('input[name="vinagrete"][value="Sim"]').checked = true;
  document.getElementById('obs-pedido').value = '';

  const divContador = document.getElementById('contador-obs');
  divContador.innerText = '0/90 caracteres';
  divContador.style.color = '#666666';
  divContador.style.fontWeight = 'normal';

  fecharModal('modalResumo');
}



// ===================================================
// ÁREA DE ADMINISTRAÇÃO E GESTÃO DE ESTOQUE
// ===================================================

// Criamos uma "memória" para o site saber que o chefe entrou
let chefeLogado = false;

async function loginAdmin(event) {
  if (event) event.preventDefault();

  const userDigitado = document.getElementById('admin-user').value;
  const senhaDigitada = document.getElementById('admin-pass').value;

  const dadosDoLogin = {
    usuario: userDigitado,
    senha: senhaDigitada
  };

  console.log("O que estou enviando:", dadosDoLogin);

  try {
    // Nova URL da Vercel apontando para a verificação de Login
    const url = 'https://skewers-order-backend.vercel.app/admin/login';

    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'content-Type': 'application/json' },
      body: JSON.stringify(dadosDoLogin)
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      alert("Acesso Liberado, Chefe!");
      chefeLogado = true;

      // ==========================================
      // A MÁGICA ACONTECE AQUI:
      // Guarda os dados digitados na memória do site
      credenciaisAdmin.user = userDigitado;
      credenciaisAdmin.pass = senhaDigitada;
      // ==========================================

      fecharModal('modalAdmin');
      abrirPainelAdmin();

    } else {
      alert("Ops! " + resultado.erro);
    }

  } catch (erro) {
    console.error("Erro na comunicação:", erro);
  }
}

// ==========================================
// 1. ABRE O PAINEL E GUARDA NA MEMÓRIA
// ==========================================
async function abrirPainelAdmin() {
  const cabecalho = document.querySelector('header');
  if (cabecalho) cabecalho.style.display = 'none';

  const principal = document.querySelector('main');
  if (principal) principal.style.display = 'none';

  const rodape = document.querySelector('footer');
  if (rodape) rodape.style.display = 'none';

  const painel = document.getElementById('painel-admin');
  if (painel) {
    painel.style.display = 'block';
  } else {
    console.error("FALTA NO HTML: Não achei a div id='painel-admin'");
  }

  // Nova URL da Vercel para puxar a lista de produtos no Painel Admin
  const url = `https://skewers-order-backend.vercel.app/api/cardapio?usuario=${ID_CLIENTE}`;
  const resposta = await fetch(url);
  const dados = await resposta.json();

  // A MEMÓRIA: Guarda tudo aqui em vez de desenhar direto
  listaGlobalProdutos = dados.produtos ? dados.produtos : dados;

  desenharPainel();

  // ==========================================
  // INICIA O GRÁFICO ASSIM QUE O PAINEL ABRE
  // ==========================================
  carregarGraficoVendas();
}


// ==========================================
// 2. CONSTRÓI A TELA BASEADA NA MEMÓRIA (Com Estoque)
// ==========================================
function desenharPainel() {
  const divLista = document.getElementById('lista-admin');
  divLista.innerHTML = ''; // Limpa a tela

  // O Botão Mestre que salva o "Carrinho"
  divLista.innerHTML += `
    <button onclick="salvarTudoNoBanco()" 
      style="background-color: #007bff; color: white; padding: 15px; 
      width: 100%; border: none; border-radius: 5px; cursor: pointer; 
      font-weight: bold; font-size: 16px; margin-bottom: 20px;">
      💾 Salvar Todas as Alterações
    </button>
  `;

  const comidas = listaGlobalProdutos.filter(item => item.categoria === 'comida');
  const bebidas = listaGlobalProdutos.filter(item => item.categoria === 'bebida');

  function desenharCaixinha(item) {
    const corBotao = item.disponivel ? '#ff4d4d' : '#00cc66';
    const textoBotao = item.disponivel ? 'Desativar' : 'Ativar';

    const div = document.createElement('div');
    div.className = 'item-lista';
    div.style = 'display: flex; flex-direction: column; gap: 10px; border-bottom: 1px solid #444; padding-bottom: 15px; margin-bottom: 10px;';

    div.innerHTML = `
      <div style="color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${item.nome}</strong><br>
          <small>R$ ${parseFloat(item.preco).toFixed(2)} - ${item.categoria}</small>
        </div>
        <button onclick="alternarStatusLocal(${item.id})" 
          style="background-color: ${corBotao}; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">
          ${textoBotao}
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #222; padding: 10px; border-radius: 5px;">
        <div>
          <label style="color: white; font-size: 14px;">Estoque Atual:</label>
          <input type="number" id="estoque_${item.id}" value="${item.estoque || 0}" 
            onchange="atualizarEstoqueLocal(${item.id}, this.value)"
            style="width: 60px; padding: 5px; margin-left: 5px; border-radius: 3px; border: 1px solid #ccc; text-align: center;">
        </div>
        
        <button onclick="solicitarEstorno(${item.id}, '${item.nome}')" 
          style="background-color: #ff9800; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 13px;">
          ↩️ Estornar
        </button>
      </div>
    `;
    divLista.appendChild(div);
  }

  // Desenhando os títulos e as caixas agrupadas
  divLista.innerHTML += '<h2 style="color: white; margin-top: 15px;">🍖 Carnes</h2>';
  comidas.forEach(desenharCaixinha);

  divLista.innerHTML += '<h2 style="color: white; margin-top: 30px;">🥤 Bebidas</h2>';
  bebidas.forEach(desenharCaixinha);
}


// ==========================================
// 3. MUDA A COR NO CLIQUE (NA MEMÓRIA)
// ==========================================
function alternarStatusLocal(idProduto) {
  const produto = listaGlobalProdutos.find(item => item.id === idProduto);
  if (produto) {
    produto.disponivel = !produto.disponivel; // Inverte o valor
    desenharPainel(); // Redesenha a tela instantaneamente com a nova cor
  }
}

// ==========================================
// 3.5 FUNÇÕES DE ESTOQUE LOCAL
// ==========================================
function atualizarEstoqueLocal(idProduto, novoValor) {
  const produto = listaGlobalProdutos.find(item => item.id === idProduto);
  if (produto) {
    produto.estoque = parseInt(novoValor); // Guarda o valor na memória para salvar depois
  }
}

async function solicitarEstorno(idProduto, nomeProduto) {
  const qtdDevolvida = prompt(`Quantos espetinhos de "${nomeProduto}" foram devolvidos pelo motoboy?`);

  if (!qtdDevolvida || isNaN(qtdDevolvida) || Number(qtdDevolvida) <= 0) {
    return; // Cancela se o gestor não digitar um número válido
  }

  try {
    const url = 'https://skewers-order-backend.vercel.app/admin/estornar';
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: credenciaisAdmin.user,
        senha: credenciaisAdmin.pass,
        itensEstorno: [{ id: idProduto, quantidade: Number(qtdDevolvida) }]
      })
    });

    if (resposta.ok) {
      alert(`${qtdDevolvida} unidade(s) devolvida(s) ao estoque com sucesso!`);
      // Recarrega o painel para puxar o novo estoque atualizado do banco
      abrirPainelAdmin();
    } else {
      alert("Erro ao processar devolução.");
    }
  } catch (erro) {
    console.error("Erro no estorno:", erro);
  }
}

// ==========================================
// 4. ENVIA O LOTE PARA O BANCO DE DADOS
// ==========================================
async function salvarTudoNoBanco() {
  try {
    const url = 'https://skewers-order-backend.vercel.app/admin/atualizar-lote';

    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: credenciaisAdmin.user,
        senha: credenciaisAdmin.pass,
        produtos: listaGlobalProdutos // <-- Atenção à mudança de nome aqui
      })
    });

    if (resposta.ok) {
      alert("Cardápio e Estoque salvos definitivamente no banco de dados!");
    } else {
      const resultado = await resposta.json();
      alert("Erro ao salvar: " + resultado.erro);
    }
  } catch (erro) {
    console.error("Falha na comunicação:", erro);
  }
}
// ==========================================
// 5. FECHAR O PAINEL E VOLTAR PARA A LOJA
// ==========================================
function fecharPainelAdmin() {
  // 1. Esconde o painel do gerente
  const painel = document.getElementById('painel-admin');
  if (painel) painel.style.display = 'none';

  // 2. Mostra a loja dos clientes novamente
  const cabecalho = document.querySelector('header');
  if (cabecalho) cabecalho.style.display = 'block';

  const principal = document.querySelector('main');
  if (principal) principal.style.display = 'block';

  const rodape = document.querySelector('footer');
  if (rodape) rodape.style.display = 'block';

  // 3. Limpa a memória por segurança (faz "logout")
  credenciaisAdmin = { user: '', pass: '' };

  // 4. Recarrega o cardápio da tela inicial para mostrar as alterações
  if (typeof carregarCardapio === 'function') {
    carregarCardapio();
  }
}

// Função para enviar os dados para a API salvar no banco
async function salvarPedidoNoBanco(dadosCliente, total, tipoEntrega) {

  // 1. A URL que acabamos de criar no backend
  const urlAPI = 'https://skewers-order-backend.vercel.app/api/pedidos';

  // 2. O pacote JSON que vamos enviar
  // Note que usamos o ID_CLIENTE que você já tem no topo do arquivo
  const pacoteDeDados = {
    tenantId: ID_CLIENTE,
    clienteNome: dadosCliente.nome,
    total: total,
    tipoEntrega: tipoEntrega
  };

  try {
    // 3. O Fetch faz a requisição do tipo POST
    const resposta = await fetch(urlAPI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Avisa que é JSON
      },
      body: JSON.stringify(pacoteDeDados) // Transforma o objeto em texto
    });

    // 4. Verificação de segurança
    if (!resposta.ok) {
      throw new Error("Erro de comunicação com o servidor.");
    }

    // 5. Recebemos de volta o pedido que o backend salvou, 
    // AGORA JÁ COM O UUID GERADO LÁ NO NODE.JS!
    const pedidoSalvo = await resposta.json();

    console.log("Sucesso! UUID do banco:", pedidoSalvo.id);

    // Retornamos o pedido para usar o UUID no fluxo do WhatsApp
    return pedidoSalvo;

  } catch (erro) {
    console.error("Erro ao salvar no banco:", erro);
    alert("Ops! Houve um problema ao registrar seu pedido.");
    return null; // Retorna nulo se der errado
  }
}

// ==========================================
// 1. REGRA VISUAL DO ENDEREÇO
// ==========================================
function verificarEntrega() {
  const tipoEscolhido = document.getElementById('cli-tipo').value;
  const divEndereco = document.getElementById('div-endereco');

  if (tipoEscolhido === 'entregar') {
    divEndereco.style.display = 'block';
  } else {
    divEndereco.style.display = 'none';
    document.getElementById('cli-endereco').value = '';
  }
}

// ==========================================
// 2. O MOTOR PRINCIPAL (FINALIZAR PEDIDO)
// ==========================================
async function finalizarPedido() {

  let totalItens = Object.values(carrinho).reduce((soma, qtd) => soma + qtd, 0);
  if (totalItens === 0) {
    return alert("Seu carrinho está vazio! Escolha alguns espetinhos primeiro.");
  }

  // ====================================================
  // NOVIDADE: TRAVA VISUAL DE DUPLO CLIQUE
  // ====================================================
  const btnEnviar = document.querySelector('.btn-whatsapp');
  const textoOriginal = btnEnviar.innerText; // Guarda o texto "Enviar Pedido"

  btnEnviar.innerText = "Enviando... Aguarde ⏳";
  btnEnviar.disabled = true;       // Impede novos cliques
  btnEnviar.style.opacity = "0.6"; // Deixa o botão meio transparente
  // ====================================================

  const farofaEscolhida = document.querySelector('input[name="farofa"]:checked').value;
  const vinagreteEscolhido = document.querySelector('input[name="vinagrete"]:checked').value;
  const obsDigitadas = document.getElementById('obs-pedido').value;

  let listaParaBackend = [];
  let subtotal = 0;

  for (let idProduto in carrinho) {
    // ... (Mantém o mesmo loop do carrinho) ...
    let qtd = carrinho[idProduto];
    if (qtd > 0) {
      let prod = listaGlobalProdutos.find(p => p.id == idProduto);
      subtotal += parseFloat(prod.preco) * qtd;
      listaParaBackend.push({
        id: prod.id,
        quantidade: qtd,
        preco: parseFloat(prod.preco),
        nome: prod.nome
      });
    }
  }

  let taxaDeEntrega = 0.00;
  if (dadosCliente.tipo === "entregar") {
    taxaDeEntrega = 5.00;
  }
  let totalGeral = subtotal + taxaDeEntrega;

  const pacoteDeDados = {
    tenantId: ID_CLIENTE,
    clienteNome: dadosCliente.nome,
    total: totalGeral,
    tipoEntrega: dadosCliente.tipo,
    carrinho: listaParaBackend,
    farofa: farofaEscolhida,
    vinagrete: vinagreteEscolhido,
    observacoes: obsDigitadas
  };

  try {
    const resposta = await fetch('https://skewers-order-backend.vercel.app/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pacoteDeDados)
    });

    if (!resposta.ok) {
      throw new Error("Falha no servidor ao registrar o pedido.");
    }

    const pedidoSalvo = await resposta.json();
    console.log("Banco de dados OK. UUID gerado:", pedidoSalvo.id);

    // O sucesso recarrega a página no final do zap, então não precisamos destravar o botão aqui.
    enviarMensagemWhatsApp(pedidoSalvo, pacoteDeDados, taxaDeEntrega);

  } catch (erro) {
    console.error("Erro no fechamento do pedido:", erro);
    alert("Ops! Houve uma falha de conexão. Tente novamente.");

    // ====================================================
    // DESTRAVA O BOTÃO EM CASO DE ERRO PARA NOVA TENTATIVA
    // ====================================================
    btnEnviar.innerText = textoOriginal;
    btnEnviar.disabled = false;
    btnEnviar.style.opacity = "1";
  }
}

// ==========================================
// 3. A IMPRESSORA DA COZINHA (WHATSAPP)
// ==========================================
function enviarMensagemWhatsApp(pedidoSalvo, pacoteDeDados, taxaDeEntrega) {

  const protocolo = pedidoSalvo.id.substring(0, 6).toUpperCase();

  let texto = `*NOVO PEDIDO - #${protocolo}*\n\n`;
  texto += `*Cliente:* ${pacoteDeDados.clienteNome}\n`;

  if (pacoteDeDados.tipoEntrega === 'entregar') {
    texto += `*Tipo:* Entrega 🛵\n`;
    texto += `*Endereço:* ${dadosCliente.endereco}\n`;
  } else {
    texto += `*Tipo:* Retirada no Local 🏪\n`;
  }

  texto += `\n*🛒 Itens do Pedido:*\n`;

  pacoteDeDados.carrinho.forEach(item => {
    let subtotalItem = item.quantidade * item.preco;
    let valorFormatado = subtotalItem.toFixed(2).replace('.', ',');
    texto += `▪️ ${item.quantidade}x ${item.nome} - R$ ${valorFormatado}\n`;
  });

  texto += `\n*🍽️ Acompanhamentos e Extras:*\n`;
  texto += `Farofa: ${pacoteDeDados.farofa}\n`;
  texto += `Vinagrete: ${pacoteDeDados.vinagrete}\n`;

  if (pacoteDeDados.observacoes && pacoteDeDados.observacoes.trim() !== "") {
    texto += `*Obs:* ${pacoteDeDados.observacoes}\n`;
  }

  texto += `\n*📊 Resumo dos Valores:*\n`;

  if (taxaDeEntrega > 0) {
    let subtotalPuro = pacoteDeDados.total - taxaDeEntrega;
    texto += `Subtotal: R$ ${subtotalPuro.toFixed(2).replace('.', ',')}\n`;
    texto += `Taxa de Entrega: R$ ${taxaDeEntrega.toFixed(2).replace('.', ',')}\n`;
  }

  let totalFormatado = pacoteDeDados.total.toFixed(2).replace('.', ',');
  texto += `*💰 TOTAL GERAL: R$ ${totalFormatado}*\n\n`;

  const textoCodificado = encodeURIComponent(texto);
  const urlZap = `https://wa.me/55${numeroZap}?text=${textoCodificado}`;

  window.open(urlZap, '_blank');

  alert(`Pedido enviado com sucesso!\nAnote o seu protocolo: ${protocolo}`);
  window.location.reload();
}

// ==========================================
// 4. EFEITOS VISUAIS E UX (CONTADOR DE CARACTERES)
// ==========================================

// Usamos o evento 'input' porque ele detecta até se o cliente colar um texto pronto
document.getElementById('obs-pedido').addEventListener('input', function () {

  // 1. Conta quantas letras estão na caixa de texto neste exato milissegundo
  const qtdDigitada = this.value.length;

  // 2. Pega a div do contador
  const divContador = document.getElementById('contador-obs');

  // 3. Atualiza o texto da tela
  divContador.innerText = `${qtdDigitada}/90 caracteres`;

  // Bônus de UX: Muda a cor para vermelho se bater no teto!
  if (qtdDigitada >= 90) {
    divContador.style.color = 'red';
    divContador.style.fontWeight = 'bold';
  } else {
    divContador.style.color = '#666666'; // Cor cinza normal
    divContador.style.fontWeight = 'normal';
  }
});

function renderizarGrafico(nomesProdutos, quantidadesVendidas) {
  const ctx = document.getElementById('graficoVendas').getContext('2d');

  // Adicione estas 3 linhas para apagar o gráfico antigo se ele existir
  if (meuGraficoVendas !== null) {
    meuGraficoVendas.destroy();
  }

  new Chart(ctx, {
    type: 'bar', // Pode mudar para 'pie' (pizza) ou 'line' (linha)
    data: {
      labels: nomesProdutos, // Ex: ['Asinha', 'Calabresa', 'Coração']
      datasets: [{
        label: 'Unidades Vendidas',
        data: quantidadesVendidas, // Ex: [45, 30, 25]
        backgroundColor: '#00cc66', // Cor da barra
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'white' } }
      },
      scales: {
        y: { ticks: { color: 'white' }, beginAtZero: true },
        x: { ticks: { color: 'white' } }
      }
    }
  });
}

// Chame a função com dados fictícios só para testar o visual hoje:
renderizarGrafico(['Asinha', 'Calabresa', 'Pão de Alho', 'Cerveja', 'Coração'], [45, 38, 30, 25, 15]);


// Busca os dados reais no backend e desenha o gráfico
async function carregarGraficoVendas() {
  try {
    // AQUI ESTAVA O ERRO: Agora com a URL completa do seu backend!
    const urlGrafico = `https://skewers-order-backend.vercel.app/api/relatorios/top5/${ID_CLIENTE}`;
    const resposta = await fetch(urlGrafico);
    const dados = await resposta.json();

    // Separa os nomes e as quantidades que vieram do banco
    const nomesProdutos = dados.map(item => item.nome);
    const quantidadesVendidas = dados.map(item => parseInt(item.total_vendido));

    // Renderiza o gráfico com os dados reais
    renderizarGrafico(nomesProdutos, quantidadesVendidas);
    
  } catch (erro) {
    console.error("Erro ao puxar dados do gráfico:", erro);
  }
}

// Chame esta função logo dentro da função abrirPainelAdmin()
// para o gráfico atualizar sempre que o dono abrir a gestão.