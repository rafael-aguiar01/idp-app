const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Serviço ${{ values.repoName }} rodando com sucesso!' });
});

app.listen(port, () => {
  console.log(`Serviço escutando na porta ${port}`);
});