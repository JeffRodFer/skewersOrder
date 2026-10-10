const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt')
const app = express();

// ==========================================
// 1. CONFIGURAÇÕES GERAIS
// ==========================================
// Permite comunicação do seu Front-end com o Back-end
app.use(cors());

// Permite o servidor entender JSON (O "óleo no motor")
app.use(express.json());


// ==========================================
// 2. ROTAS PÚBLICAS (Cliente)
// ==========================================

// Rota de Health Check (Para ver se está online)
app.get('/', (req, res) => {
  res.send("O motor do Espetinho do Chefe está Online!");
});

// ROTA 1: Enviar o cardápio real e o WhatsApp
app.get('/api/cardapio', async (req, res) => {
  try {
    const query = 'SELECT * FROM produtos ORDER BY nome ASC';
    const resultado = await pool.query(query);

    // Entrega o WhatsApp (do .env) e os produtos (do banco)
    return res.json({
      whatsapp: process.env.WHATSAPP_NUMBER,
      produtos: resultado.rows
    });

  } catch (erro) {
    console.error('Erro ao buscar itens:', erro);
    return res.status(500).json({ erro: 'Falha no banco de dados' });
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




// ==========================================
// 4. LIGANDO O SERVIDOR
// ==========================================
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
  console.log(`✅ Servidor rodando lindamente na porta ${PORTA}`);
});