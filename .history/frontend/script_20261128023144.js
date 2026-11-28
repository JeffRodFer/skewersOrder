// ===================================================
// 1. CONFIGURAÇÃO GLOBAL E ESTADO DA APLICAÇÃO
// ===================================================
const ID_CLIENTE = 2;
const BACKEND_URL = 'https://skewers-order-backend.vercel.app';
const CARDAPIO_URL = `${BACKEND_URL}/api/cardapio?usuario=${ID_CLIENTE}`;
const FALLBACK_WHATSAPP = '5581920036280';

let credenciaisAdmin = { user: '', pass: '' };
let listaGlobalProdutos = [];
let comidas = [];
let bebidas = [];
let carrinho = {};
let dadosCliente = {};
let numeroZap = '';
let chefeLogado = false;
let meuGraficoVendas = null;
let textoZapResumo = '';
let textoZapCompleto = '';

// ===================================================
// 2. RELÓGIO E CARREGAMENTO DO CARDÁPIO
// ===================================================
function atualizarRelogio() {
  const elRelogio = document.getElementById('relogio');
  if (!elRelogio) return;

  const opcoes = {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium'
  };

  elRelogio.innerText = new Intl.DateTimeFormat('pt-BR', opcoes).format(new Date());
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();

async function carregarCardapio() {
  try {
    const resposta = await fetch(CARDAPIO_URL);
    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status} ao buscar cardápio`);
    }

    const dadosDoServidor = await resposta.json();
    const produtosBrutos = Array.isArray(dadosDoServidor.produtos)
      ? dadosDoServidor.produtos
      : Array.isArray(dadosDoServidor)
        ? dadosDoServidor
        : [];

    listaGlobalProdutos = produtosBrutos;
    console.log('Meus espetinhos:', listaGlobalProdutos);

    if (dadosDoServidor.whatsapp) {
      numeroZap = String(dadosDoServidor.whatsapp);
      const linkHeader = document.getElementById('link-whatsapp-header');
      if (linkHeader) {
        linkHeader.href = `https://wa.me/${numeroZap}`;
      }
    }

    const produtosProntos = produtosBrutos.map((item) => ({
      id: item.id,
      nome: item.nome,
      preco: parseFloat(item.preco) || 0,
      disponivel: Boolean(item.disponivel),
      categoria: String(item.categoria || '').toLowerCase()
    }));

    comidas = produtosProntos.filter((item) => item.categoria === 'comida');
    bebidas = produtosProntos.filter((item) => item.categoria === 'bebida');

    renderizarLista(comidas, 'lista-carnes', 'item-carne');
    renderizarLista(bebidas, 'lista-bebidas', 'item-bebida');
  } catch (erro) {
    console.error('Erro ao buscar cardápio:', erro);
  }
}

function renderizarLista(itens, idContainer, classeCor) {
  const container = document.getElementById(idContainer);
  if (!container) {
    console.error(`Erro: Não encontrei a div id="${idContainer}" no HTML.`);
    return;
  }

  container.innerHTML = '';

  itens.forEach((item) => {
    if (!item.disponivel) return;

    carrinho[item.id] = 0;
    const precoFormatado = item.preco.toFixed(2).replace('.', ',');

    const div = document.createElement('div');
    div.className = `item-lista ${classeCor}`;
    div.innerHTML = `
      <div>
        <strong>${item.nome}</strong><br>
        <small>R$ ${precoFormatado}</small>
      </div>
      <div class="controles">
        <button type="button" class="btn-qtd" onclick="alterarQtd('${item.id}', -1)">-</button>
        <span id="qtd-${item.id}">0</span>
        <button type="button" class="btn-qtd" onclick="alterarQtd('${item.id}', 1)">+</button>
      </div>
    `;

    container.appendChild(div);
  });
}

carregarCardapio();

// ===================================================
// 3. INTERAÇÃO DO CLIENTE, CARRINHO E RESUMO
// ===================================================
function alterarQtd(id, valor) {
  const atual = Number(carrinho[id]) || 0;
  const proximo = atual + valor;
  if (proximo >= 0) {
    carrinho[id] = proximo;
    const span = document.getElementById(`qtd-${id}`);
    if (span) span.innerText = proximo;
  }
}

function abrirModalCadastro() {
  const modal = document.getElementById('modalCadastro');
  if (modal) modal.style.display = 'block';
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function fecharModalCadastro() {
  fecharModal('modalCadastro');
}

function abrirModalAdmin() {
  const modal = document.getElementById('modalAdmin');
  if (modal) modal.style.display = 'block';
}

function verificarEntrega() {
  const tipo = document.getElementById('cli-tipo')?.value;
  const divEnd = document.getElementById('div-endereco');
  const campoEnd = document.getElementById('cli-endereco');
  if (!divEnd) return;

  if (tipo === 'entregar') {
    divEnd.style.display = 'block';
  } else {
    divEnd.style.display = 'none';
    if (campoEnd) campoEnd.value = '';
  }
}

function salvarCadastro() {
  const nome = document.getElementById('cli-nome')?.value.trim() || '';
  const telefone = document.getElementById('cli-telefone')?.value.trim() || '';
  const tipo = document.getElementById('cli-tipo')?.value || 'retirar';
  const endereco = document.getElementById('cli-endereco')?.value.trim() || '';

  if (!nome) {
    alert('Por favor, preencha o seu nome!');
    return;
  }

  if (tipo === 'entregar' && !endereco) {
    alert('Para entrega, precisamos que preencha o endereço completo!');
    return;
  }

  dadosCliente = { nome, telefone, tipo, endereco };
  fecharModal('modalCadastro');
  alert('Cadastro salvo! Escolha os seus espetinhos.');
}

function abrirResumo() {
  if (!dadosCliente.nome) {
    alert('Clique em INICIAR PEDIDO primeiro para se identificar.');
    abrirModalCadastro();
    return;
  }

  const ehEntrega = dadosCliente.tipo === 'entregar' || dadosCliente.tipo === 'entrega';
  const tipoTxt = ehEntrega
    ? `Entrega (${dadosCliente.endereco})`
    : 'Retirada no local (Taxa isenta)';

  let html = `<strong>Cliente:</strong> ${dadosCliente.nome}<br>`;
  html += `<strong>Tipo:</strong> ${tipoTxt}<br><br>`;
  html += `<strong>Itens Escolhidos:</strong><br>`;

  let subtotal = 0;
  let temItem = false;
  const todosItens = [...comidas, ...bebidas];

  todosItens.forEach((item) => {
    const qtd = Number(carrinho[item.id]) || 0;
    if (qtd > 0) {
      temItem = true;
      const itemSubtotal = qtd * item.preco;
      subtotal += itemSubtotal;
      const subFormatado = itemSubtotal.toFixed(2).replace('.', ',');
      html += `${qtd}x ${item.nome} - R$ ${subFormatado}<br>`;
    }
  });

  if (!temItem) {
    alert('Por favor, escolha pelo menos um item antes de encerrar o pedido!');
    return;
  }

  const taxa = ehEntrega ? 5.0 : 0.0;
  const totalGeral = subtotal + taxa;

  if (ehEntrega) {
    html += `<br><small>Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}</small>`;
    html += `<br><small>Taxa de entrega: R$ ${taxa.toFixed(2).replace('.', ',')}</small>`;
  }

  const elResumo = document.getElementById('conteudo-resumo');
  const elTotal = document.getElementById('valor-total');
  const modalResumo = document.getElementById('modalResumo');

  if (elResumo) elResumo.innerHTML = html;
  if (elTotal) elTotal.innerText = `Total: R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
  if (modalResumo) modalResumo.style.display = 'block';
}

function fecharEResetarResumo() {
  const farofaSim = document.querySelector('input[name="farofa"][value="Sim"]');
  const vinagreteSim = document.querySelector('input[name="vinagrete"][value="Sim"]');
  const obsInput = document.getElementById('obs-pedido');
  const divContador = document.getElementById('contador-obs');

  if (farofaSim) farofaSim.checked = true;
  if (vinagreteSim) vinagreteSim.checked = true;
  if (obsInput) obsInput.value = '';

  if (divContador) {
    divContador.innerText = '0/90 caracteres';
    divContador.style.color = '#666666';
    divContador.style.fontWeight = 'normal';
  }

  fecharModal('modalResumo');
}

const campoObs = document.getElementById('obs-pedido');
if (campoObs) {
  campoObs.addEventListener('input', function () {
    const qtdDigitada = this.value.length;
    const divContador = document.getElementById('contador-obs');
    if (!divContador) return;

    divContador.innerText = `${qtdDigitada}/90 caracteres`;
    if (qtdDigitada >= 90) {
      divContador.style.color = 'red';
      divContador.style.fontWeight = 'bold';
    } else {
      divContador.style.color = '#666666';
      divContador.style.fontWeight = 'normal';
    }
  });
}

// ===================================================
// 4. FLUXO UNIFICADO DE PEDIDO + WHATSAPP + PIX
// ===================================================
async function finalizarPedido() {
  if (!dadosCliente || !dadosCliente.nome) {
    alert('Por favor, preencha seus dados em INICIAR PEDIDO antes de enviar.');
    abrirModalCadastro();
    return;
  }

  const totalItens = Object.values(carrinho || {}).reduce(
    (soma, qtd) => soma + (Number(qtd) || 0),
    0
  );
  if (totalItens === 0) {
    alert('Seu carrinho está vazio! Escolha alguns espetinhos primeiro.');
    return;
  }

  const btnEnviar = document.querySelector('.btn-whatsapp');
  const textoOriginal = btnEnviar ? btnEnviar.innerText : 'Enviar Pedido (WhatsApp)';

  if (btnEnviar) {
    btnEnviar.innerText = 'Enviando... Aguarde ⏳';
    btnEnviar.disabled = true;
    btnEnviar.style.opacity = '0.6';
  }

  const farofaEscolhida = document.querySelector('input[name="farofa"]:checked')?.value || 'Não';
  const vinagreteEscolhido = document.querySelector('input[name="vinagrete"]:checked')?.value || 'Não';
  const obsDigitadas = (document.getElementById('obs-pedido')?.value || '').slice(0, 90);
  const formaPagamentoEscolhida = document.querySelector('input[name="pagamento"]:checked')?.value || 'Pix / Combinar';

  const listaParaBackend = [];
  const catalogoBase = listaGlobalProdutos.length > 0 ? listaGlobalProdutos : [...comidas, ...bebidas];
  let subtotal = 0;

  for (const idProduto in carrinho) {
    const qtd = Number(carrinho[idProduto]) || 0;
    if (qtd > 0) {
      const prod = catalogoBase.find((p) => String(p.id) === String(idProduto));
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

  const tipoNormalizado = String(dadosCliente.tipo || '').toLowerCase();
  const ehEntrega = tipoNormalizado === 'entregar' || tipoNormalizado === 'entrega';
  const taxaDeEntrega = ehEntrega ? 5.0 : 0.0;
  const totalGeral = subtotal + taxaDeEntrega;

  const pacoteDeDados = {
    tenantId: ID_CLIENTE,
    clienteNome: dadosCliente.nome,
    clienteTelefone: dadosCliente.telefone || '',
    endereco: ehEntrega ? dadosCliente.endereco : '',
    total: totalGeral,
    tipoEntrega: ehEntrega ? 'Entrega' : 'Retira',
    formaPagamento: formaPagamentoEscolhida,
    carrinho: listaParaBackend,
    farofa: farofaEscolhida,
    vinagrete: vinagreteEscolhido,
    observacoes: obsDigitadas
  };

  try {
    const resposta = await fetch(`${BACKEND_URL}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pacoteDeDados)
    });

    if (!resposta.ok) {
      throw new Error(`Falha no servidor ao registrar o pedido (HTTP ${resposta.status}).`);
    }

    const pedidoSalvo = await resposta.json();
    console.log('Pedido salvo no banco. ID/UUID:', pedidoSalvo.id);

    let configLoja = {};
    try {
      const respConfig = await fetch(`${BACKEND_URL}/api/config-pedido`);
      if (respConfig.ok) {
        configLoja = await respConfig.json();
      }
    } catch (erroConfig) {
      console.warn('Não foi possível obter /api/config-pedido, usando fallback:', erroConfig);
    }

    enviarMensagemWhatsApp(pedidoSalvo, pacoteDeDados, taxaDeEntrega, configLoja);
  } catch (erro) {
    console.error('Erro no fechamento do pedido:', erro);
    alert('Ops! Houve uma falha de conexão ao registrar seu pedido. Tente novamente.');

    if (btnEnviar) {
      btnEnviar.innerText = textoOriginal;
      btnEnviar.disabled = false;
      btnEnviar.style.opacity = '1';
    }
  }
}

function enviarMensagemWhatsApp(pedidoSalvo, pacoteDeDados, taxaDeEntrega, configLoja = {}) {
  const idTexto = pedidoSalvo && pedidoSalvo.id ? String(pedidoSalvo.id) : '';
  const protocolo = idTexto ? idTexto.substring(0, 6).toUpperCase() : 'NOVO';

  let texto = `*NOVO PEDIDO - #${protocolo}*\n\n`;
  texto += `*Cliente:* ${pacoteDeDados.clienteNome}\n`;

  if (pacoteDeDados.clienteTelefone) {
    texto += `*Telefone:* ${pacoteDeDados.clienteTelefone}\n`;
  }

  if (pacoteDeDados.tipoEntrega === 'Entrega' || pacoteDeDados.tipoEntrega === 'entregar') {
    texto += `*Tipo:* Entrega 🛵\n`;
    if (pacoteDeDados.endereco) {
      texto += `*Endereço:* ${pacoteDeDados.endereco}\n`;
    }
  } else {
    texto += `*Tipo:* Retirada no Local 🏪\n`;
  }

  texto += `\n*🛒 Itens do Pedido:*\n`;
  pacoteDeDados.carrinho.forEach((item) => {
    const subtotalItem = Number(item.quantidade) * Number(item.preco);
    const valorFormatado = subtotalItem.toFixed(2).replace('.', ',');
    texto += `▪️ ${item.quantidade}x ${item.nome} - R$ ${valorFormatado}\n`;
  });

  texto += `\n*🍽️ Acompanhamentos e Extras:*\n`;
  texto += `Farofa: ${pacoteDeDados.farofa}\n`;
  texto += `Vinagrete: ${pacoteDeDados.vinagrete}\n`;

  if (pacoteDeDados.observacoes && pacoteDeDados.observacoes.trim() !== '') {
    texto += `*Obs:* ${pacoteDeDados.observacoes}\n`;
  }

  texto += `\n*📊 Resumo dos Valores:*\n`;
  if (taxaDeEntrega > 0) {
    const subtotalPuro = Number(pacoteDeDados.total) - Number(taxaDeEntrega);
    texto += `Subtotal: R$ ${subtotalPuro.toFixed(2).replace('.', ',')}\n`;
    texto += `Taxa de Entrega: R$ ${Number(taxaDeEntrega).toFixed(2).replace('.', ',')}\n`;
  } else {
    texto += `Taxa de Entrega: Isenta (Retirada)\n`;
  }

  const totalFormatado = Number(pacoteDeDados.total).toFixed(2).replace('.', ',');
  texto += `*💰 TOTAL GERAL: R$ ${totalFormatado}*\n`;

  const chavePix =
    (configLoja && (configLoja.pixKey || configLoja.pix_key || configLoja.chavePix)) ||
    '';

  if (chavePix) {
    texto += `\n*🔑 Chave Pix:* ${chavePix}\n`;
  }

  const numeroDestino =
    (configLoja && configLoja.whatsappNumber) ||
    numeroZap ||
    FALLBACK_WHATSAPP;

  const urlZap = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(texto)}`;
  window.open(urlZap, '_blank', 'noopener,noreferrer');

  alert(`Pedido enviado com sucesso!\nAnote o seu protocolo: ${protocolo}`);
  setTimeout(() => {
    window.location.reload();
  }, 800);
}

// ===================================================
// 5. LOGIN ADMIN E GESTÃO DE ESTOQUE
// ===================================================
async function loginAdmin(event) {
  if (event) event.preventDefault();

  const userDigitado = document.getElementById('admin-user')?.value || '';
  const senhaDigitada = document.getElementById('admin-pass')?.value || '';

  try {
    const resposta = await fetch(`${BACKEND_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: userDigitado, senha: senhaDigitada })
    });

    const resultado = await resposta.json().catch(() => ({}));

    if (resposta.ok) {
      alert('Acesso Liberado, Chefe!');
      chefeLogado = true;
      credenciaisAdmin.user = userDigitado;
      credenciaisAdmin.pass = senhaDigitada;
      fecharModal('modalAdmin');
      await abrirPainelAdmin();
    } else {
      alert('Ops! ' + (resultado.erro || 'Credenciais inválidas.'));
    }
  } catch (erro) {
    console.error('Erro na comunicação no login:', erro);
    alert('Erro ao tentar autenticar no servidor.');
  }
}

async function abrirPainelAdmin() {
  const cabecalho = document.querySelector('header');
  const principal = document.querySelector('main');
  const rodape = document.querySelector('footer');
  const painel = document.getElementById('painel-admin');

  if (cabecalho) cabecalho.style.display = 'none';
  if (principal) principal.style.display = 'none';
  if (rodape) rodape.style.display = 'none';

  if (painel) {
    painel.style.display = 'block';
  } else {
    console.error("FALTA NO HTML: Não achei a div id='painel-admin'");
    return;
  }

  try {
    const resposta = await fetch(CARDAPIO_URL);
    const dados = await resposta.json();
    listaGlobalProdutos = Array.isArray(dados.produtos)
      ? dados.produtos
      : Array.isArray(dados)
        ? dados
        : [];
  } catch (erro) {
    console.error('Erro ao carregar produtos no painel admin:', erro);
  }

  desenharPainel();
  await carregarGraficoVendas();
  await carregarVendasDiarias();
}

function desenharPainel() {
  const divLista = document.getElementById('lista-admin');
  if (!divLista) return;

  divLista.innerHTML = `
    <button type="button" onclick="salvarTudoNoBanco()"
      style="background-color: #007bff; color: white; padding: 15px;
      width: 100%; border: none; border-radius: 5px; cursor: pointer;
      font-weight: bold; font-size: 16px; margin-bottom: 20px;">
      💾 Salvar Todas as Alterações
    </button>
  `;

  const comidasAdmin = listaGlobalProdutos.filter((item) => String(item.categoria).toLowerCase() === 'comida');
  const bebidasAdmin = listaGlobalProdutos.filter((item) => String(item.categoria).toLowerCase() === 'bebida');

  function desenharCaixinha(item) {
    const corBotao = item.disponivel ? '#ff4d4d' : '#00cc66';
    const textoBotao = item.disponivel ? 'Desativar' : 'Ativar';
    const nomeEscapado = String(item.nome || '').replace(/'/g, "\\'");

    const div = document.createElement('div');
    div.className = 'item-lista';
    div.style.cssText =
      'display: flex; flex-direction: column; gap: 10px; border-bottom: 1px solid #444; padding-bottom: 15px; margin-bottom: 10px;';

    div.innerHTML = `
      <div style="color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${item.nome}</strong><br>
          <small>R$ ${parseFloat(item.preco || 0).toFixed(2)} - ${item.categoria}</small>
        </div>
        <button type="button" onclick="alternarStatusLocal(${item.id})"
          style="background-color: ${corBotao}; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">
          ${textoBotao}
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #222; padding: 10px; border-radius: 5px;">
        <div>
          <label style="color: white; font-size: 14px;">Estoque Atual:</label>
          <input type="number" id="estoque_${item.id}" value="${item.estoque ?? 0}"
            onchange="atualizarEstoqueLocal(${item.id}, this.value)"
            style="width: 60px; padding: 5px; margin-left: 5px; border-radius: 3px; border: 1px solid #ccc; text-align: center;">
        </div>

        <button type="button" onclick="solicitarEstorno(${item.id}, '${nomeEscapado}')"
          style="background-color: #ff9800; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 13px;">
          ↩️ Estornar
        </button>
      </div>
    `;

    divLista.appendChild(div);
  }

  divLista.innerHTML += '<h2 style="color: white; margin-top: 15px;">🍖 Carnes</h2>';
  comidasAdmin.forEach(desenharCaixinha);

  divLista.innerHTML += '<h2 style="color: white; margin-top: 30px;">🥤 Bebidas</h2>';
  bebidasAdmin.forEach(desenharCaixinha);
}

function alternarStatusLocal(idProduto) {
  const produto = listaGlobalProdutos.find((item) => item.id === idProduto);
  if (produto) {
    produto.disponivel = !produto.disponivel;
    desenharPainel();
  }
}

function atualizarEstoqueLocal(idProduto, novoValor) {
  const produto = listaGlobalProdutos.find((item) => item.id === idProduto);
  if (produto) {
    produto.estoque = parseInt(novoValor, 10) || 0;
  }
}

async function solicitarEstorno(idProduto, nomeProduto) {
  const qtdDevolvida = prompt(
    `Quantos espetinhos de "${nomeProduto}" foram devolvidos pelo motoboy?`
  );

  if (!qtdDevolvida || isNaN(qtdDevolvida) || Number(qtdDevolvida) <= 0) {
    return;
  }

  try {
    const resposta = await fetch(`${BACKEND_URL}/admin/estornar`, {
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
      await abrirPainelAdmin();
    } else {
      alert('Erro ao processar devolução.');
    }
  } catch (erro) {
    console.error('Erro no estorno:', erro);
  }
}

async function salvarTudoNoBanco() {
  try {
    const resposta = await fetch(`${BACKEND_URL}/admin/atualizar-lote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: credenciaisAdmin.user,
        senha: credenciaisAdmin.pass,
        produtos: listaGlobalProdutos
      })
    });

    if (resposta.ok) {
      alert('Cardápio e Estoque salvos definitivamente no banco de dados!');
    } else {
      const resultado = await resposta.json().catch(() => ({}));
      alert('Erro ao salvar: ' + (resultado.erro || `HTTP ${resposta.status}`));
    }
  } catch (erro) {
    console.error('Falha na comunicação ao salvar lote:', erro);
  }
}

function fecharPainelAdmin() {
  const painel = document.getElementById('painel-admin');
  const cabecalho = document.querySelector('header');
  const principal = document.querySelector('main');
  const rodape = document.querySelector('footer');

  if (painel) painel.style.display = 'none';
  if (cabecalho) cabecalho.style.display = 'block';
  if (principal) principal.style.display = 'block';
  if (rodape) rodape.style.display = 'block';

  credenciaisAdmin = { user: '', pass: '' };
  chefeLogado = false;

  if (typeof carregarCardapio === 'function') {
    carregarCardapio();
  }
}

// ===================================================
// 6. RELATÓRIOS, GRÁFICO E RESUMO OPERACIONAL
// ===================================================
function renderizarGrafico(nomesProdutos, quantidadesVendidas) {
  const canvas = document.getElementById('graficoVendas');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  if (meuGraficoVendas !== null) {
    meuGraficoVendas.destroy();
  }

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
      indexAxis: 'y',
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
            autoSkip: false
          }
        }
      }
    }
  });
}

async function carregarGraficoVendas() {
  const canvas = document.getElementById('graficoVendas');
  if (!canvas) return;

  try {
    const resp = await fetch(`${BACKEND_URL}/api/relatorios/top5/${ID_CLIENTE}`);
    if (!resp.ok) {
      renderizarGrafico([], []);
      return;
    }

    const dados = await resp.json();
    const lista = Array.isArray(dados) ? dados : [];
    const nomesProdutos = lista.map((item) => item.produto_nome || item.nome || 'Item');
    const quantidadesVendidas = lista.map((item) => Number(item.total_vendido || item.quantidade || 0));

    renderizarGrafico(nomesProdutos, quantidadesVendidas);
  } catch (erro) {
    console.error('Erro ao carregar dados do gráfico:', erro);
    renderizarGrafico([], []);
  }
}

async function carregarVendasDiarias() {
  const lista = document.getElementById('listaVendasDiarias');
  if (!lista) return;

  try {
    const resposta = await fetch(`${BACKEND_URL}/api/relatorios/vendas-diarias/${ID_CLIENTE}`);
    if (!resposta.ok) throw new Error('Erro ao buscar faturamento');

    const dados = await resposta.json();
    lista.innerHTML = '';

    if (!Array.isArray(dados) || dados.length === 0) {
      lista.innerHTML = '<li>Nenhuma venda registrada ainda.</li>';
      return;
    }

    dados.forEach((dia) => {
      const dataFormatada = new Date(dia.data_venda).toLocaleDateString('pt-BR');
      const valorFormatado = Number(dia.total_arrecadado).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

      const item = document.createElement('li');
      item.style.marginBottom = '10px';
      item.innerHTML = `<strong>${dataFormatada}</strong>: <span style="color: #00cc66;">${valorFormatado}</span>`;
      lista.appendChild(item);
    });
  } catch (erro) {
    console.error('Erro ao carregar vendas diárias:', erro);
  }
}

async function zerarVendas() {
  const textoDigitado = prompt('Digite ZERAR para apagar o histórico de vendas:');
  if (textoDigitado !== 'ZERAR') {
    alert('Ação cancelada.');
    return;
  }

  try {
    const resposta = await fetch(`${BACKEND_URL}/api/relatorios/zerar/${ID_CLIENTE}`, {
      method: 'DELETE'
    });

    if (!resposta.ok) {
      throw new Error(`Servidor respondeu com HTTP ${resposta.status}`);
    }

    await resposta.json().catch(() => ({}));
    alert('Histórico zerado com sucesso!');

    await carregarGraficoVendas();
    await carregarVendasDiarias();
    await buscarVendasPorData();
  } catch (erro) {
    console.error('Erro detalhado ao zerar vendas:', erro);
    alert(`Falha ao concluir a limpeza: ${erro.message}`);
  }
}

async function alternarPainel() {
  const painel = document.getElementById('painel-operacional');
  const botao = document.getElementById('btn-gestor');
  if (!painel || !botao) return;

  const estaOculto = painel.style.display === 'none' || painel.style.display === '';

  if (estaOculto) {
    painel.style.display = 'block';
    botao.innerText = '🔼 Ocultar Resumo Operacional';

    const tresHoras = 3 * 60 * 60 * 1000;
    const hojeOp = new Date(Date.now() - tresHoras).toLocaleDateString('en-CA');

    const inputIni = document.getElementById('filtro-inicio');
    const inputFim = document.getElementById('filtro-fim');

    if (inputIni && !inputIni.value) inputIni.value = hojeOp;
    if (inputFim && !inputFim.value) inputFim.value = hojeOp;

    await buscarVendasPorData();
    await carregarGraficoVendas();
    verificarEstoqueCritico(listaGlobalProdutos);
    painel.scrollIntoView({ behavior: 'smooth' });
  } else {
    painel.style.display = 'none';
    botao.innerText = '📊 Ver Resumo Operacional e Vendas';
  }
}

async function buscarVendasPorData() {
  const inicio = document.getElementById('filtro-inicio')?.value;
  const fim = document.getElementById('filtro-fim')?.value;
  const lista = document.getElementById('listaVendasDiarias');
  const listaDet = document.getElementById('listaPedidosDetalhados');
  const btnRes = document.getElementById('btn-zap-resumo');
  const btnComp = document.getElementById('btn-zap-completo');

  if (!inicio || !fim || !lista) return;

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

  await buscarPedidosDetalhados(inicio, fim);

  try {
    const urlPer = `${BACKEND_URL}/api/relatorios/periodo/${ID_CLIENTE}?inicio=${inicio}&fim=${fim}`;
    const resp = await fetch(urlPer);
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

      html += `<li>${linha.tipo_entrega}: ${qtd} ped. — R$ ${valor.toFixed(2)}</li>`;
      linhasZap += `• ${linha.tipo_entrega}: ${qtd} ped. (R$ ${valor.toFixed(2)})\n`;
    });

    const ticket = totalPedidos > 0 ? totalGeral / totalPedidos : 0;

    html += `
      <li style="margin-top: 12px; color: #38bdf8;">
        <strong>Total: R$ ${totalGeral.toFixed(2)}</strong> (${totalPedidos} pedidos)
      </li>
      <li style="color: #fbbf24; font-size: 16px;">
        Ticket Médio: R$ ${ticket.toFixed(2)}
      </li>
    `;

    lista.innerHTML = html;

    const iniBR = inicio.split('-').reverse().join('/');
    const fimBR = fim.split('-').reverse().join('/');
    const titulo = inicio === fim ? `FECHAMENTO (${iniBR})` : `FECHAMENTO (${iniBR} a ${fimBR})`;

    textoZapResumo =
      `📊 *${titulo} — RESUMO*\n\n` +
      `${linhasZap}\n` +
      `📦 *Pedidos:* ${totalPedidos}\n` +
      `🎯 *Ticket Médio:* R$ ${ticket.toFixed(2)}\n` +
      `💰 *TOTAL:* R$ ${totalGeral.toFixed(2)}`;

    if (btnRes) btnRes.style.display = 'inline-block';
    if (btnComp) btnComp.style.display = textoZapCompleto ? 'inline-block' : 'none';
  } catch (erro) {
    console.error('Erro ao buscar período:', erro);
    lista.innerHTML = '<li>Erro ao carregar dados.</li>';
  }
}

async function buscarPedidosDetalhados(inicio, fim) {
  const ul = document.getElementById('listaPedidosDetalhados');
  if (!ul) return;

  ul.innerHTML = '<li>Carregando pedidos...</li>';

  try {
    const urlPed = `${BACKEND_URL}/api/relatorios/pedidos/${ID_CLIENTE}?inicio=${inicio}&fim=${fim}`;
    const resp = await fetch(urlPed);
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
          ? new Date(p.hora_local).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : '--:--';

        const extras = [];
        if (p.farofa === 'Sim') extras.push('Farofa');
        if (p.vinagrete === 'Sim') extras.push('Vinagrete');
        const txtExtras = extras.length > 0 ? ` (${extras.join(' + ')})` : '';

        const obs = p.observacoes
          ? `<br><small style="color: #fbbf24;">Obs: ${p.observacoes}</small>`
          : '';

        return `
          <li style="padding: 10px; border-bottom: 1px solid #444;">
            <strong>${hora}</strong> — ${nome}
            <span style="color: #38bdf8;">[${tipo}]</span>
            <strong style="float: right; color: #4ade80;">R$ ${valor}</strong>
            <br>
            <small style="color: #aaa;">Acompanhamentos:${txtExtras || ' Nenhum'}</small>
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
        ? new Date(p.hora_local).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '--:--';

      const extras = [];
      if (p.farofa === 'Sim') extras.push('Farofa');
      if (p.vinagrete === 'Sim') extras.push('Vinagrete');
      const extraTxt = extras.length ? ` | ${extras.join(' + ')}` : '';
      const obsTxt = p.observacoes ? `\n   _Obs: ${p.observacoes}_` : '';

      blocoPedidos += `\n• *${hora}* — ${nome} (${tipo})${extraTxt}\n  *Valor:* R$ ${valor}${obsTxt}`;
    });

    textoZapCompleto = `${textoZapResumo}${blocoPedidos}`;
  } catch (erro) {
    console.error('Erro ao carregar pedidos detalhados:', erro);
    ul.innerHTML = '<li>Erro ao carregar pedidos.</li>';
  }
}

function enviarFechamentoZap(tipo = 'resumo') {
  const texto = tipo === 'completo' ? textoZapCompleto : textoZapResumo;
  if (!texto) {
    alert('Relatório ainda não carregou.');
    return;
  }

  const msg = encodeURIComponent(texto);
  window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
}

function verificarEstoqueCritico(listaProdutos) {
  const caixa = document.getElementById('alerta-estoque');
  const ul = document.getElementById('lista-estoque-critico');
  if (!caixa || !ul || !Array.isArray(listaProdutos)) return;

  const criticos = listaProdutos
    .filter((p) => Number(p.estoque ?? p.quantidade ?? 99) <= 5)
    .sort((a, b) => Number(a.estoque ?? a.quantidade ?? 0) - Number(b.estoque ?? b.quantidade ?? 0));

  if (criticos.length === 0) {
    caixa.style.display = 'none';
    return;
  }

  let html = '';
  criticos.forEach((p) => {
    const qtd = Number(p.estoque ?? p.quantidade ?? 0);
    const nome = p.nome || p.titulo || 'Produto';

    if (qtd <= 0) {
      html += `<li style="margin-bottom: 6px; color: #ff4444;">🔴 <strong>${nome}</strong> — ESGOTADO (0)</li>`;
    } else {
      html += `<li style="margin-bottom: 6px; color: #fbbf24;">🟡 <strong>${nome}</strong> — restam ${qtd} un.</li>`;
    }
  });

  ul.innerHTML = html;
  caixa.style.display = 'block';
}