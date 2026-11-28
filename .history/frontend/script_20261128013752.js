// === 1. IDENTIDADE DO CLIENTE 2 ===
const ID_CLIENTE = 2;

let textoZapResumo = '';
let textoZapCompleto = '';

// ATENÇÃO: Esta linha deve ficar solta no topo do arquivo script.js!
let credenciaisAdmin = { user: '', pass: '' };
let listaGlobalProdutos = [];

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
  let url = "https://wa.me/5581920036280?text=" + encodeURIComponent(msg);
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

  carregarGraficoVendas();
  carregarVendasDiarias();

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
  const totalItens = Object.values(carrinho || {}).reduce((soma, qtd) => soma + qtd, 0);
  if (totalItens === 0) {
    return alert("Seu carrinho está vazio! Escolha alguns espetinhos primeiro.");
  }

  const btnEnviar = document.querySelector('.btn-whatsapp');
  const textoOriginal = btnEnviar.innerText;

  btnEnviar.innerText = "Enviando... Aguarde ⏳";
  btnEnviar.disabled = true;
  btnEnviar.style.opacity = "0.6";

  const farofaEscolhida = document.querySelector('input[name="farofa"]:checked')?.value || "Não";
  const vinagreteEscolhido = document.querySelector('input[name="vinagrete"]:checked')?.value || "Não";
  const obsDigitadas = (document.getElementById('obs-pedido')?.value || "").slice(0, 90);
  const formaPagamentoEscolhida = document.querySelector('input[name="pagamento"]:checked')?.value || "Não informado";

  const listaParaBackend = [];
  let subtotal = 0;

  for (const idProduto in carrinho) {
    const qtd = Number(carrinho[idProduto]) || 0;
    if (qtd > 0) {
      const prod = listaGlobalProdutos.find(p => String(p.id) === String(idProduto));
      if (prod) {
        const precoUnit = parseFloat(prod.preco) || 0;
        subtotal += precoUnit * qtd;
        listaParaBackend.push({
          id: prod.id,
          quantidade: qtd,
          preco: precoUnit,
          nome: prod.nome
        });
      }
    }
  }

  const tipoNormalizado = String(dadosCliente.tipo || "").toLowerCase();
  const ehEntrega = tipoNormalizado === "entregar" || tipoNormalizado === "entrega";
  const taxaDeEntrega = ehEntrega ? 5.00 : 0.00;
  const totalGeral = subtotal + taxaDeEntrega;

  const pacoteDeDados = {
    tenantId: ID_CLIENTE,
    clienteNome: dadosCliente.nome,
    total: totalGeral,
    tipoEntrega: ehEntrega ? "Entrega" : "Retira",
    formaPagamento: formaPagamentoEscolhida,
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

    const respConfig = await fetch('https://skewers-order-backend.vercel.app/api/config-pedido');
    const configLoja = respConfig.ok ? await respConfig.json() : {};

    enviarMensagemWhatsApp(pedidoSalvo, pacoteDeDados, taxaDeEntrega, configLoja);
  } catch (erro) {
    console.error("Erro no fechamento do pedido:", erro);
    alert("Ops! Houve uma falha de conexão. Tente novamente.");

    btnEnviar.innerText = textoOriginal;
    btnEnviar.disabled = false;
    btnEnviar.style.opacity = "1";
  }

  // ==========================================
  // 3. A IMPRESSORA DA COZINHA (WHATSAPP)
  // ==========================================
  function enviarMensagemWhatsApp(pedidoSalvo, pacoteDeDados, taxaDeEntrega, configLoja = {}) {
    const idTexto = pedidoSalvo && pedidoSalvo.id ? String(pedidoSalvo.id) : '';
    const protocolo = idTexto ? idTexto.substring(0, 6).toUpperCase() : 'NOVO';

    let texto = `*NOVO PEDIDO - #${protocolo}*\n\n`;
    texto += `*Cliente:* ${pacoteDeDados.clienteNome}\n`;

    if (pacoteDeDados.tipoEntrega === 'entregar' || pacoteDeDados.tipoEntrega === 'Entrega') {
      texto += `*Tipo:* Entrega 🛵\n`;
      if (typeof dadosCliente !== 'undefined' && dadosCliente.endereco) {
        texto += `*Endereço:* ${dadosCliente.endereco}\n`;
      }
    } else {
      texto += `*Tipo:* Retirada no Local 🏪\n`;
    }

    texto += `\n*🛒 Itens do Pedido:*\n`;

    pacoteDeDados.carrinho.forEach(item => {
      const subtotalItem = Number(item.quantidade) * Number(item.preco);
      const valorFormatado = subtotalItem.toFixed(2).replace('.', ',');
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
      const subtotalPuro = Number(pacoteDeDados.total) - Number(taxaDeEntrega);
      texto += `Subtotal: R$ ${subtotalPuro.toFixed(2).replace('.', ',')}\n`;
      texto += `Taxa de Entrega: R$ ${Number(taxaDeEntrega).toFixed(2).replace('.', ',')}\n`;
    }

    const totalFormatado = Number(pacoteDeDados.total).toFixed(2).replace('.', ',');
    texto += `*💰 TOTAL GERAL: R$ ${totalFormatado}*\n`;

    if (configLoja.pixKey) {
      texto += `\n*🔑 Chave Pix:* ${configLoja.pixKey}\n`;
    }

    texto += `\n`;

    const numeroDestino = configLoja.whatsappNumber || "5581920036280";
    const textoCodificado = encodeURIComponent(texto);
    const urlZap = `https://wa.me/${numeroDestino}?text=${textoCodificado}`;
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

  // 1. Declare a variável fora da função para guardar a memória do gráfico
  let meuGraficoVendas = null;

  function renderizarGrafico(nomesProdutos, quantidadesVendidas) {
    const ctx = document.getElementById('graficoVendas').getContext('2d');

    // 2. Apaga o gráfico antigo se ele existir
    if (meuGraficoVendas !== null) {
      meuGraficoVendas.destroy();
    }

    // 3. Atribui a criação do gráfico à variável (HORIZONTAL)
    meuGraficoVendas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: nomesProdutos,
        datasets: [{
          label: 'Unidades Vendidas',
          data: quantidadesVendidas,
          backgroundColor: '#00cc66',
          borderRadius: 5
        }]
      },
      options: {
        indexAxis: 'y', // Deita o gráfico
        responsive: true,
        plugins: {
          legend: {
            labels: { color: 'white' }
          }
        },
        scales: {
          x: {
            ticks: { color: 'white' },
            beginAtZero: true
          },
          y: {
            ticks: {
              color: 'white',
              autoSkip: false // Mostra os 7 nomes
            }
          }
        }
      }
    });
  }



  async function carregarGraficoVendas() {
    const canvas = document.getElementById('graficoVendas');
    if (!canvas || typeof renderizarGrafico !== 'function') return;

    try {
      const resp = await fetch(
        `https://skewers-order-backend.vercel.app/api/relatorios/top5/${ID_CLIENTE}`
      );
      if (!resp.ok) {
        renderizarGrafico([], []);
        return;
      }

      const dados = await resp.json();
      const lista = Array.isArray(dados) ? dados : [];
      const nomesProdutos = lista.map(
        item => item.produto_nome || item.nome || 'Item'
      );
      const quantidadesVendidas = lista.map(
        item => Number(item.total_vendido || item.quantidade || 0)
      );

      renderizarGrafico(nomesProdutos, quantidadesVendidas);
      
    } catch (erro) {
      console.error('Erro ao carregar dados do gráfico:', erro);
      renderizarGrafico([], []);
    }
  }

  // 1. Função para buscar e exibir o faturamento diário
  async function carregarVendasDiarias() {
    try {
      // CORREÇÃO: Trocado de 'usuario_id_da_loja' para 'ID_CLIENTE'
      const resposta = await fetch(`https://skewers-order-backend.vercel.app/api/relatorios/vendas-diarias/${ID_CLIENTE}`);
      if (!resposta.ok) throw new Error('Erro ao buscar faturamento');

      const dados = await resposta.json();
      const lista = document.getElementById('listaVendasDiarias');
      lista.innerHTML = '';

      if (dados.length === 0) {
        lista.innerHTML = '<li>Nenhuma venda registrada ainda.</li>';
        return;
      }

      dados.forEach(dia => {
        // Converte a data para o padrão do Brasil
        const dataFormatada = new Date(dia.data_venda).toLocaleDateString('pt-BR');
        // Converte o número para formato de dinheiro (R$)
        const valorFormatado = Number(dia.total_arrecadado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const item = document.createElement('li');
        item.style.marginBottom = '10px';
        item.innerHTML = `<strong>${dataFormatada}</strong>: <span style="color: #00cc66;">${valorFormatado}</span>`;
        lista.appendChild(item);
      });
    } catch (erro) {
      console.error("Erro:", erro);
    }
  }

  // 2. Função acionada pelo botão vermelho (com dupla trava)
  async function zerarVendas() {
    const textoDigitado = prompt('Digite ZERAR para apagar o histórico de vendas:');
    if (textoDigitado !== 'ZERAR') {
      alert('Ação cancelada.');
      return;
    }

    try {
      const base = 'https://skewers-order-backend.vercel.app';
      const url = `${base}/api/relatorios/zerar/${ID_CLIENTE}`;

      const resposta = await fetch(url, {
        method: 'DELETE'
      });

      if (!resposta.ok) {
        throw new Error(`Servidor respondeu com HTTP ${resposta.status}`);
      }

      await resposta.json().catch(() => ({}));

      alert('Histórico zerado com sucesso!');

      if (typeof carregarGrafico === 'function') {
        await carregarGrafico();
      }
      if (typeof carregarVendas === 'function') {
        await carregarVendas();
      }
      if (typeof buscarVendas === 'function') {
        await buscarVendas();
      }
    } catch (erro) {
      console.error('Erro detalhado ao zerar vendas:', erro);
      alert(`Falha ao concluir a limpeza: ${erro.message}`);
    }
  }

  function alternarPainel() {
    const painel = document.getElementById('painel-operacional');
    const botao = document.getElementById('btn-gestor');
    const estaOculto = painel.style.display === 'none';

    if (estaOculto) {
      painel.style.display = 'block';
      botao.innerText = '🔼 Ocultar Resumo Operacional';

      // Dia operacional (vira às 03:00 da manhã)
      const tresHoras = 3 * 60 * 60 * 1000;
      const hojeOp = new Date(Date.now() - tresHoras)
        .toLocaleDateString('en-CA');

      const inputIni = document.getElementById('filtro-inicio');
      const inputFim = document.getElementById('filtro-fim');

      if (!inputIni.value) inputIni.value = hojeOp;
      if (!inputFim.value) inputFim.value = hojeOp;

      buscarVendasPorData();
      verificarEstoqueCritico(listaGlobalProdutos);
      painel.scrollIntoView({ behavior: 'smooth' });
    } else {
      painel.style.display = 'none';
      botao.innerText = '📊 Ver Resumo Operacional e Vendas';
    }
  }

  let textoFechamentoZap = '';

  async function buscarVendasPorData() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;
    const lista = document.getElementById('listaVendasDiarias');
    const listaDet = document.getElementById('listaPedidosDetalhados');
    const btnRes = document.getElementById('btn-zap-resumo');
    const btnComp = document.getElementById('btn-zap-completo');

    if (!inicio || !fim) return;

    if (inicio > fim) {
      lista.innerHTML = '<li>Data inicial maior que a final.</li>';
      if (listaDet) listaDet.innerHTML = '';
      if (btnRes) btnRes.style.display = 'none';
      if (btnComp) btnComp.style.display = 'none';
      textoZapResumo = '';
      textoZapCompleto = '';
      return;
    }

    lista.innerHTML = '<li>Carregando...</li>';
    if (btnRes) btnRes.style.display = 'none';
    if (btnComp) btnComp.style.display = 'none';
    buscarPedidosDetalhados(inicio, fim);

    try {
      const base = 'https://skewers-order-backend.vercel.app';
      const rota = `/api/relatorios/periodo/${ID_CLIENTE}`;
      const url = `${base}${rota}?inicio=${inicio}&fim=${fim}`;

      const resp = await fetch(url);
      const dados = await resp.json();

      if (!Array.isArray(dados) || dados.length === 0) {
        lista.innerHTML = '<li>Nenhuma venda neste período.</li>';
        textoZapResumo = '';
        textoZapCompleto = '';
        return;
      }

      let totalGeral = 0;
      let totalPedidos = 0;
      let html = '';
      let linhasZap = '';

      dados.forEach((linha) => {
        const valor = Number(linha.faturamento) || 0;
        const qtd = Number(linha.total_pedidos) || 0;
        totalGeral += valor;
        totalPedidos += qtd;

        html += `
        <li>
          ${linha.tipo_entrega}: ${qtd} ped.
          — R$ ${valor.toFixed(2)}
        </li>
      `;
        linhasZap += `• ${linha.tipo_entrega}: `;
        linhasZap += `${qtd} ped. (R$ ${valor.toFixed(2)})\n`;
      });

      const ticket = totalPedidos > 0
        ? totalGeral / totalPedidos
        : 0;

      html += `
      <li style="margin-top: 12px; color: #38bdf8;">
        <strong>Total: R$ ${totalGeral.toFixed(2)}</strong>
        (${totalPedidos} pedidos)
      </li>
      <li style="color: #fbbf24; font-size: 16px;">
        Ticket Médio: R$ ${ticket.toFixed(2)}
      </li>
    `;

      lista.innerHTML = html;

      const iniBR = inicio.split('-').reverse().join('/');
      const fimBR = fim.split('-').reverse().join('/');
      const titulo = inicio === fim
        ? `FECHAMENTO (${iniBR})`
        : `FECHAMENTO (${iniBR} a ${fimBR})`;

      textoZapResumo =
        `📊 *${titulo} — RESUMO*\n\n` +
        `${linhasZap}\n` +
        `📦 *Pedidos:* ${totalPedidos}\n` +
        `🎯 *Ticket Médio:* R$ ${ticket.toFixed(2)}\n` +
        `💰 *TOTAL:* R$ ${totalGeral.toFixed(2)}`;

      if (btnRes) btnRes.style.display = 'inline-block';
      if (btnComp) btnComp.style.display = 'inline-block';
    } catch (erro) {
      console.error('Erro ao buscar período:', erro);
      lista.innerHTML = '<li>Erro ao carregar dados.</li>';
    }
  }

  function enviarFechamentoZap(tipo = 'resumo') {
    const texto = tipo === 'completo'
      ? textoZapCompleto
      : textoZapResumo;

    if (!texto) {
      alert('Relatório ainda não carregou.');
      return;
    }

    const msg = encodeURIComponent(texto);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function verificarEstoqueCritico(listaProdutos) {
    const caixa = document.getElementById('alerta-estoque');
    const ul = document.getElementById('lista-estoque-critico');
    if (!caixa || !ul || !Array.isArray(listaProdutos)) return;

    // Filtra produtos com estoque <= 5
    const criticos = listaProdutos
      .filter((p) => {
        const qtd = Number(p.estoque ?? p.quantidade ?? 99);
        return qtd <= 5;
      })
      .sort((a, b) => {
        const qa = Number(a.estoque ?? a.quantidade ?? 0);
        const qb = Number(b.estoque ?? b.quantidade ?? 0);
        return qa - qb;
      });

    if (criticos.length === 0) {
      caixa.style.display = 'none';
      return;
    }

    let html = '';
    criticos.forEach((p) => {
      const qtd = Number(p.estoque ?? p.quantidade ?? 0);
      const nome = p.nome || p.titulo || 'Produto';

      if (qtd <= 0) {
        html += `
        <li style="margin-bottom: 6px; color: #ff4444;">
          🔴 <strong>${nome}</strong> — ESGOTADO (0)
        </li>`;
      } else {
        html += `
        <li style="margin-bottom: 6px; color: #fbbf24;">
          🟡 <strong>${nome}</strong> — restam ${qtd} un.
        </li>`;
      }
    });

    ul.innerHTML = html;
    caixa.style.display = 'block';
  }

  async function buscarPedidosDetalhados(inicio, fim) {
    const ul = document.getElementById('listaPedidosDetalhados');
    if (!ul) return;

    ul.innerHTML = '<li>Carregando pedidos...</li>';

    try {
      const base = 'https://skewers-order-backend.vercel.app';
      const rota = `/api/relatorios/pedidos/${ID_CLIENTE}`;
      const url = `${base}${rota}?inicio=${inicio}&fim=${fim}`;

      const resp = await fetch(url);
      const pedidos = await resp.json();

      if (!Array.isArray(pedidos) || pedidos.length === 0) {
        ul.innerHTML = '<li>Nenhum pedido detalhado.</li>';
        textoZapCompleto = '';
        return;
      }

      ul.innerHTML = pedidos
        .map((p) => {
          const valor = Number(p.total || 0).toFixed(2);
          const nome = p.cliente_nome || 'Cliente';
          const tipo = p.tipo_entrega || 'Pedido';
          const hora = p.hora_local
            ? new Date(p.hora_local).toLocaleTimeString(
              'pt-BR',
              { hour: '2-digit', minute: '2-digit' }
            )
            : '--:--';

          const extras = [];
          if (p.farofa === 'Sim') extras.push('Farofa');
          if (p.vinagrete === 'Sim') extras.push('Vinagrete');
          const txtExtras = extras.length > 0
            ? ` (${extras.join(' + ')})`
            : '';

          const obs = p.observacoes
            ? `<br><small style="color: #fbbf24;">Obs: ${p.observacoes}</small>`
            : '';

          return `
          <li style="padding: 10px; border-bottom: 1px solid #444;">
            <strong>${hora}</strong> — ${nome}
            <span style="color: #38bdf8;">[${tipo}]</span>
            <strong style="float: right; color: #4ade80;">
              R$ ${valor}
            </strong>
            <br>
            <small style="color: #aaa;">
              Acompanhamentos:${txtExtras || ' Nenhum'}
            </small>
            ${obs}
          </li>
        `;
        })
        .join('');

      let blocoPedidos = '\n\n🧾 *PEDIDOS DETALHADOS:*\n';

      pedidos.forEach((p) => {
        const valor = Number(p.total || 0).toFixed(2);
        const nome = p.cliente_nome || 'Cliente';
        const tipo = p.tipo_entrega || 'Pedido';
        const hora = p.hora_local
          ? new Date(p.hora_local).toLocaleTimeString(
            'pt-BR',
            { hour: '2-digit', minute: '2-digit' }
          )
          : '--:--';

        const extras = [];
        if (p.farofa === 'Sim') extras.push('Farofa');
        if (p.vinagrete === 'Sim') extras.push('Vinagrete');
        const extraTxt = extras.length
          ? ` | ${extras.join(' + ')}`
          : '';

        const obsTxt = p.observacoes
          ? `\n   _Obs: ${p.observacoes}_`
          : '';

        blocoPedidos +=
          `\n• *${hora}* — ${nome} (${tipo})${extraTxt}` +
          `\n  *Valor:* R$ ${valor}${obsTxt}`;
      });

      textoZapCompleto = `${textoZapResumo}${blocoPedidos}`;
    } catch (erro) {
      console.error('Erro ao carregar pedidos:', erro);
      ul.innerHTML = '<li>Erro ao carregar pedidos.</li>';
    }
  }

}