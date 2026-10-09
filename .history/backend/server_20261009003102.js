const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

// Permite comunicação Vercel <-> Render
app.use(cors());
// Permite entender JSON
app.use(express.json());

// Rota de Health Check
app.get('/', (req, res) => {
  res.send("O motor do Espetinho do Chefe está Online!");
});

// ROTA 1: Enviar o cardápio real e o WhatsApp
app.get('/api/cardapio', async (req, res) => {
  try {
    const query = 'SELECT * FROM produtos ORDER BY nome ASC';
    const resultado = await pool.query(query);

    // Entregamos o WhatsApp (do .env) e os produtos (do banco)
    res.json({
      whatsapp: process.env.WHATSAPP_NUMBER,
      produtos: resultado.rows
    });
    
  } catch (erro) {
    console.error('Erro ao buscar itens:', erro);
    res.status(500).json({ erro: 'Falha no banco de dados' });
  }
});



// ROTA 2: Atualizar disponibilidade (Área do Gerente)
app.post('/admin/atualizar', async (req, res) => {
  const { 
    usuario, 
    senha, 
    idProduto, 
    disponivel 
  } = req.body;

  const userCerto = process.env.ADMIN_USER;
  const passCerto = process.env.ADMIN_PASS;

  // Verifica as credenciais do .env
  if (usuario !== userCerto || senha !== passCerto) {
    return res.status(401).json({ erro: 'Acesso negado!' });
  }

  try {
    const query = `
      UPDATE produtos 
      SET disponivel = $1 
      WHERE id = $2
    `;
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