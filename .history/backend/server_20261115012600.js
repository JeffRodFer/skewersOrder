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


// ROTA 2: Salvar o novo pedido no banco com UUID gerado no Node
app.post('/api/pedidos', async (req, res) => {
  // 1. Pegamos os dados que vieram do carrinho (frontend)
  const { tenantId, clienteNome, total, tipoEntrega } = req.body;

  // 2. Geramos o ID único do pedido (O "CPF" do pedido)
  const idDoNovoPedido = crypto.randomUUID();

  // 3. Montamos a query SQL
  const querySql = `
    INSERT INTO pedidos 
    (id, tenant_id, cliente_nome, total, tipo_entrega) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  // 4. Valores na ordem exata dos $1, $2, $3...
  const valores = [
    idDoNovoPedido,
    tenantId, // ID do restaurante (ID_CLIENTE)
    clienteNome,
    total,
    tipoEntrega
  ];

  try {
    // 5. Salva no banco Neon
    const resultado = await pool.query(querySql, valores);

    // 6. Devolve o pedido salvo (com o UUID) para o frontend
    return res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error("Erro ao salvar pedido:", erro);
    return res.status(500).json({ erro: "Erro ao criar pedido" });
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