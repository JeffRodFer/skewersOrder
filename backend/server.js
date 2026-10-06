const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

// Permite que o Front-end (Vercel) converse com o Back-end
app.use(cors());
// Permite que o servidor entenda dados no formato JSON
app.use(express.json());

// ROTA 1: Enviar o cardápio para o cliente
app.get('/cardapio', async (req, res) => {
  try {
    // Busca os produtos e já entrega em ordem alfabética
    const query = 'SELECT * FROM produtos ORDER BY nome ASC';
    const resultado = await pool.query(query);
    
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao buscar itens:', erro);
    res.status(500).json({ erro: 'Falha no banco de dados' });
  }
});

// ROTA 2: Atualizar disponibilidade (Área do Gerente)
app.post('/admin/atualizar', async (req, res) => {
  const { usuario, senha, idProduto, disponivel } = req.body;

  // Verifica se quem está acessando tem a senha correta
  const userCerto = process.env.ADMIN_USER;
  const passCerto = process.env.ADMIN_PASS;

  if (usuario !== userCerto || senha !== passCerto) {
    return res.status(401).json({ erro: 'Acesso negado!' });
  }

  try {
    // Se a senha estiver correta, atualiza no banco Neon
    const query = 'UPDATE produtos SET disponivel = $1 WHERE id = $2';
    await pool.query(query, [disponivel, idProduto]);
    
    res.json({ mensagem: 'Item atualizado com sucesso!' });
  } catch (erro) {
    console.error('Erro na atualização:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar item' });
  }
});

// Liga o servidor
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
});