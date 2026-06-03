# Guia do Programador e Economia de Tokens — VukaPay

Este guia contém boas práticas para poupar tokens do Antigravity (IA) durante o desenvolvimento e comandos rápidos para facilitar o seu trabalho.

---

## 💡 Como Poupar Tokens no Antigravity

Cada mensagem que envia para a IA inclui o histórico da conversa e os ficheiros que tem abertos no editor. Para gastar o mínimo possível:

1. **Inicie novas conversas para novas tarefas:** 
   O histórico longo de mensagens é o que mais consome tokens. Quando terminar uma tarefa (como esta dos ícones), feche o chat atual e abra um novo para a próxima funcionalidade.
2. **Feche ficheiros desnecessários no editor:** 
   Deixe aberto apenas o ficheiro em que está a trabalhar no momento. Ter 5 ou 10 ficheiros abertos envia todos esses códigos repetidamente em cada pergunta.
3. **Seja específico nas instruções:** 
   Dizer exatamente o que quer (ex: "atualiza o arquivo X com a nova versão Y") gasta muito menos do que pedir explicações gerais ou conceitos abertos.
4. **Use comandos locais:** 
   Consulte este guia para rodar comandos rotineiros no terminal em vez de pedir à IA para os executar.

---

## 🛠️ Atalhos e Comandos Úteis

### 1. Iniciar Ambiente de Desenvolvimento
Roda a aplicação localmente para testar alterações:
```powershell
npm run tauri dev
```

### 2. Gerar Nova Versão Local (Apenas Windows)
Usa as suas chaves e compila o executável na sua máquina:
```powershell
.\build-release.ps1
```

### 3. Publicar Nova Versão Multi-plataforma (GitHub Actions)
Depois de atualizar as versões nos ficheiros (ou usar o script `.\bump-version.ps1`):
```powershell
# 1. Crie a tag com a versão (ex: v1.0.10)
git tag v1.0.10

# 2. Envie a tag para o GitHub (isso ativa o build automático na nuvem)
git push origin v1.0.10
```

---

## 🤖 Automação Local: Script de Versão (`bump-version.ps1`)
Criámos o script [bump-version.ps1](file:///c:/Users/narci/Pictures/sistema/sistema-de-controle-financeiro-pessoal-financer/bump-version.ps1) na raiz do projeto. Ele atualiza automaticamente as versões no `package.json` e `tauri.conf.json` com um único comando.
