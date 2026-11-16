const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // <-- ADICIONE ESTA LINHA AQUI
const app = express();

// ==========================================
// 1. CONFIGURAÇÕES GERAIS
// ==========================================
// Permite comunicação do seu Front-end com o Back-end
app.use(cors());

// Permite o servidor entender JSON (O "óleo no motor")
app.use(express.json());


// ROTA 2: Salvar o pedido E os itens do carrinho (Com Transação)
app.post('/api/pedidos', async (req, res) => {

  // 1. Agora também recebemos o 'carrinho' (que é um Array de itens)
  const { tenantId, clienteNome, total, tipoEntrega, carrinho } = req.body;

  // 2. Geramos o CPF do Pedido
  const idDoNovoPedido = crypto.randomUUID();

  // 3. Pegamos um "cliente" exclusivo para a transação isolada
  const client = await pool.connect();

  try {
    // 4. Inicia a Trava de Segurança
    await client.query('BEGIN');

    // 5. Salva a Capa do Pedido
    const queryPedido = `
      INSERT INTO pedidos 
      (id, tenant_id, cliente_nome, total, tipo_entrega) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const valPedido = [idDoNovoPedido, tenantId, clienteNome, total, tipoEntrega];
    const resultadoPedido = await client.query(queryPedido, valPedido);

    // 6. Loop (For) para salvar cada espetinho do carrinho
    const queryItem = `
      INSERT INTO itens_pedido 
      (pedido_id, produto_id, quantidade, preco_unitario) 
      VALUES ($1, $2, $3, $4)
    `;

    for (let item of carrinho) {
      // O item.id é o ID do produto (ex: Espetinho de Carne)
      const valItem = [idDoNovoPedido, item.id, item.quantidade, item.preco];
      await client.query(queryItem, valItem);
    }

    // 7. Se chegou até aqui sem erros, grava pra valer!
    await client.query('COMMIT');

    // Devolve para o Frontend o pedido pronto com o UUID
    return res.status(201).json({
      mensagem: "Pedido e Itens salvos com sucesso!",
      id: idDoNovoPedido,
      pedido: resultadoPedido.rows[0]
    });

  } catch (erro) {
    // Se deu erro em QUALQUER etapa, desfaz tudo!
    await client.query('ROLLBACK');
    console.error("Erro na transação. Tudo desfeito:", erro);
    return res.status(500).json({ erro: "Falha ao gravar pedido completo" });

  } finally {
    // 8. Libera a conexão do banco
    client.release();
  }
});


// ==========================================
// 3. ROTAS DE ADMINISTRAÇÃO (Gerente)
// ==========================================

// Diagnóstico do login (Aparece apenas no terminal do VS Code)
console.log('Diagnóstico do login:', {
  adminUserConfigurado: Boolean(process.env.ADMIN_USER),
  adminPassConfigurada: Boolean(process.env.ADMIN_PASS)
});


// 2. ROTA (Note a palavra 'async' adicionada antes do req, res)
app.post('/admin/login', async (req, res) => {

  const { usuario, senha } = req.body;

  const userCerto = process.env.ADMIN_USER;
  const hashCerto = process.env.ADMIN_PASS_HASH;

  // ADICIONE ESTES DOIS CONSOLE.LOG AQUI:
  console.log("1. Senha que chegou do site:", senha);
  console.log("2. Hash lido do arquivo .env:", hashCerto);

  // Passo 1: Verifica o usuário. Se estiver errado, já barra aqui.
  if (usuario !== userCerto) {
    return res.status(401).json({
      erro: 'Usuário incorreto'
    });
  }

  // Passo 2: Verifica a senha usando o bcrypt
  try {
    //
    const senhaValida = await bcrypt.compare(senha, hashCerto);

    if (senhaValida === true) {
      return res.json({ mensagem: 'Acesso liberado!' });
    } else {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }

  } catch (erro) {
    console.error('Erro na verificação do Hash:', erro);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// ==========================================
// ROTA PARA O RELATÓRIO DO GRÁFICO (TOP 5) - PASSO 2 ATUALIZADO
// ==========================================
app.get('/api/relatorios/top5/:tenantId', async (req, res) => {
  const { tenantId } = req.params;

  try {
    // Usamos um JOIN para cruzar os itens vendidos com o nome do produto no cardápio
    const query = `
      SELECT p.nome as nome, SUM(i.quantidade) as total_vendido
      FROM itens_pedido i
      JOIN produtos p ON i.produto_id = p.id
      WHERE p.tenant_id = $1
      GROUP BY p.nome
      ORDER BY total_vendido DESC
      LIMIT 5;
    `;

    const { rows } = await pool.query(query, [tenantId]);
    res.json(rows);

  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: 'Erro ao buscar dados do gráfico' });
  }
});

// ROTA 2: Atualizar disponibilidade
app.post('/admin/atualizar', async (req, res) => {
  const { usuario, senha, idProduto, disponivel } = req.body;

  // ADICIONE ESTA LINHA:
  console.log("O botão enviou:", usuario, senha);

  const userCerto = process.env.ADMIN_USER;
  const hashCerto = process.env.ADMIN_PASS_HASH;

  // 1. Verifica se o usuário está correto
  if (usuario !== userCerto) {
    return res.status(401).json({ erro: 'Usuário incorreto!' });
  }

  try {
    // 2. O bcrypt cruza a senha digitada com o Hash do .env
    const senhaValida = await bcrypt.compare(senha, hashCerto);

    // Se a senha não bater, bloqueia
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta!' });
    }

    // 3. Acesso liberado! Altera o item no banco de dados
    const query = `
      UPDATE produtos 
      SET disponivel = $1 
      WHERE id = $2
    `;
    await pool.query(query, [disponivel, idProduto]);

    return res.json({ mensagem: 'Atualizado com sucesso!' });

  } catch (erro) {
    console.error('Erro na atualização:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar item' });
  }
});

// NOVA ROTA: Salvar várias alterações de uma vez
app.post('/admin/atualizar-lote', async (req, res) => {
  // Agora recebemos a lista inteira do carrinho!
  const { usuario, senha, listaProdutos } = req.body;

  const userCerto = process.env.ADMIN_USER;
  const hashCerto = process.env.ADMIN_PASS_HASH;

  if (usuario !== userCerto) {
    return res.status(401).json({ erro: 'Usuário incorreto!' });
  }

  try {
    const senhaValida = await bcrypt.compare(senha, hashCerto);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta!' });
    }

    // O Caixa do Supermercado: atualiza item por item no banco
    for (let item of listaProdutos) {
      const query = `
        UPDATE produtos 
        SET disponivel = $1 
        WHERE id = $2
      `;
      await pool.query(query, [item.disponivel, item.id]);
    }

    return res.json({ mensagem: 'Cardápio salvo com sucesso!' });

  } catch (erro) {
    console.error('Erro ao salvar lote:', erro);
    return res.status(500).json({ erro: 'Erro ao salvar alterações' });
  }
});


// ==========================================
// 4. LIGANDO O SERVIDOR
// ==========================================
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
  console.log(`✅ Servidor rodando lindamente na porta ${PORTA}`);
});