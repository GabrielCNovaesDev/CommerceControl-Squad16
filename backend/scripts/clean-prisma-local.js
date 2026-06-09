const fs = require('fs');
const path = require('path');

const clientLocalDir = path.join(__dirname, '..', 'node_modules', '.prisma', 'client-local');

if (!fs.existsSync(clientLocalDir)) {
  console.log('.prisma/client-local não existe, nada a limpar.');
  process.exit(0);
}

try {
  fs.rmSync(clientLocalDir, { recursive: true, force: true });
  console.log('✓ Diretório .prisma/client-local removido.');
} catch (err) {
  // No Windows, a .dll.node pode estar travada por outro processo Node.
  // Tenta remover tudo exceto o arquivo travado — o prisma generate vai sobrescrevê-lo.
  if (err.code === 'EPERM') {
    console.log('⚠ Não foi possível remover query_engine (arquivo em uso por outro processo).');
    console.log('  Removendo demais arquivos para forçar regeneração...');
    const files = fs.readdirSync(clientLocalDir);
    for (const file of files) {
      if (file.includes('query_engine')) continue;
      try {
        fs.rmSync(path.join(clientLocalDir, file), { recursive: true, force: true });
      } catch (_) { /* ignora */ }
    }
    console.log('✓ Limpeza parcial concluída. O prisma generate vai regenerar o client.');
  } else {
    throw err;
  }
}
