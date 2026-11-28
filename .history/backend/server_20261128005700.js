const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();




// ==========================================
// 1. CONFIGURAÇÕES GERAIS
// ==========================================
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());

// ==========================================
// 2. CARDÁPIO E PEDIDOS
// ==========================================
app.get('/api/cardapio', async (req, res) => {
  const tenantId = req.query.usuario;

  try {
    const query = `
      SELECT *
      FROM produtos
      WHERE tenant_id = $1
      ORDER BY categoria, id;
    `;
    const { rows } = await pool.query(query, [tenantId]);
    return res.json({ produtos: rows });
  } catch (error) {
    console.error('Erro ao buscar cardápio:', error);
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  const {
    tenantId,
    clienteNome,
    total,
    tipoEntrega,
    farofa,
    vinagrete,
    observacoes,
    formaPagamento,
    carrinho
  } = req.body;

  if (!tenantId || !clienteNome || !Array.isArray(carrinho) || carrinho.length === 0) {
    return res.status(400).json({
      erro: 'Informe loja (tenantId), nome do cliente e pelo menos um item no carrinho.'
    });
  }

  const idDoNovoPedido = crypto.randomUUID();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const queryPedido = `
      INSERT INTO pedidos (
        id,
        tenant_id,
        cliente_nome,
        total,
        tipo_entrega,
        farofa,
        vinagrete,
        observacoes,
        forma_pagamento
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const valoresPedido = [
      idDoNovoPedido,
      Number(tenantId),
      String(clienteNome).trim(),
      Number(total) || 0,
      tipoEntrega || 'Entrega',
      farofa || 'Não',
      vinagrete || 'Não',
      observacoes || '',
      formaPagamento || 'Não informado'
    ];

    const resultadoPedido = await client.query(queryPedido, valoresPedido);

    const queryItem = `
      INSERT INTO pedido_itens (
        tenant_id,
        pedido_id,
        produto_nome,
        quantidade,
        preco_unitario
      )
      VALUES ($1, $2, $3, $4, $5);
    `;

    const queryBaixaEstoque = `
      UPDATE produtos
      SET estoque = GREATEST(estoque - $1, 0)
      WHERE id = $2 AND tenant_id = $3;
    `;

    for (const item of carrinho) {
      const quantidade = Number(item.quantidade) || 1;
      const precoUnitario = Number(item.preco ?? item.preco_unitario) || 0;
      const nomeProduto = item.nome || item.produto_nome || 'Item';

      await client.query(queryItem, [
        Number(tenantId),
        idDoNovoPedido,
        nomeProduto,
        quantidade,
        precoUnitario
      ]);

      if (item.id) {
        await client.query(queryBaixaEstoque, [
          quantidade,
          item.id,
          Number(tenantId)
        ]);
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      mensagem: 'Pedido salvo com sucesso!',
      id: idDoNovoPedido,
      pedido: resultadoPedido.rows[0]
    });
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error('Erro na transação ao salvar pedido:', erro);
    return res.status(500).json({
      erro: 'Falha ao gravar pedido completo.'
    });
  } finally {
    client.release();
  }
});

// ==========================================
// 3. ADMINISTRAÇÃO E RELATÓRIOS
// ==========================================
console.log('Diagnóstico do login:', {
  adminUserConfigurado: Boolean(process.env.ADMIN_USER),
  adminPassHashConfigurado: Boolean(process.env.ADMIN_PASS_HASH)
});

app.post('/admin/login', async (req, res) => {
  const { usuario, senha } = req.body;
  const userCerto = process.env.ADMIN_USER;
  const hashCerto = process.env.ADMIN_PASS_HASH;

  if (usuario !== userCerto) {
    return res.status(401).json({ erro: 'Usuário incorreto' });
  }

  try {
    const senhaValida = await bcrypt.compare(senha, hashCerto);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }
    return res.json({ mensagem: 'Acesso liberado!' });
  } catch (erro) {
    console.error('Erro na verificação do Hash:', erro);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

app.post('/admin/atualizar', async (req, res) => {
  const { usuario, senha, idProduto, disponivel } = req.body;
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

    await pool.query(
      'UPDATE produtos SET disponivel = $1 WHERE id = $2;',
      [disponivel, idProduto]
    );

    return res.json({ mensagem: 'Atualizado com sucesso!' });
  } catch (erro) {
    console.error('Erro na atualização:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar item' });
  }
});

app.post('/admin/atualizar-lote', async (req, res) => {
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

    for (const item of listaProdutos || []) {
      await pool.query(
        'UPDATE produtos SET disponivel = $1 WHERE id = $2;',
        [item.disponivel, item.id]
      );
    }

    return res.json({ mensagem: 'Cardápio salvo com sucesso!' });
  } catch (erro) {
    console.error('Erro ao salvar lote:', erro);
    return res.status(500).json({ erro: 'Erro ao salvar alterações' });
  }
});

app.get('/api/relatorios/top5/:tenantId', async (req, res) => {
  const { tenantId } = req.params;

  try {
    const query = `
      SELECT p.nome AS nome, SUM(i.quantidade) AS total_vendido
      FROM itens_pedido i
      JOIN produtos p ON i.produto_id = p.id
      WHERE p.tenant_id = $1
      GROUP BY p.nome
      ORDER BY total_vendido DESC
      LIMIT 7;
    `;
    const { rows } = await pool.query(query, [tenantId]);
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do gráfico' });
  }
});

app.delete('/api/relatorios/zerar/:tenantId', async (req, res) => {
  const { tenantId } = req.params;

  try {
    // Troque tenant_id por usuario_id se esse for o nome da coluna na tabela pedidos
    await pool.query(
      'DELETE FROM pedidos WHERE tenant_id = $1;',
      [tenantId]
    );

    return res.json({ mensagem: 'Histórico zerado com sucesso!' });
  } catch (erro) {
    console.error('Erro ao zerar histórico:', erro);
    return res.status(500).json({ erro: 'Erro interno ao zerar vendas.' });
  }
});

// ==========================================
// 4. SERVIDOR
// ==========================================
const PORTA = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
  });
}

module.exports = app;