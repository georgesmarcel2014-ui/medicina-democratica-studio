# Executar o estúdio no Windows

O estúdio usa o processador e o disco do próprio PC. O formulário fica em `http://127.0.0.1:8787` enquanto o Docker está aberto. A licença do Docker Desktop inclui uso pessoal e pequenas empresas elegíveis. [Instalar o Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/) · [Licença](https://docs.docker.com/subscription-billing/desktop-license/)

1. Abra o Docker Desktop com Linux containers. No Google AI Studio, crie uma chave de um projeto marcado **Free Tier**, com faturamento desativado. [Gerenciar chaves](https://aistudio.google.com/apikey) · [Cota e faturamento da API](https://ai.google.dev/gemini-api/docs/billing/)
2. Abra o PowerShell na pasta do repositório atualizado e execute:

   ```powershell
   powershell -NoProfile -ExecutionPolicy RemoteSigned -File .\deploy\start-studio.ps1
   ```

3. Cole a chave Gemini quando o terminal pedir. O campo mascara o valor e o Windows o cifra para o seu perfil. Para produzir a partir de um WAV do Google AI Studio, pressione Enter no cadastro inicial. A primeira execução baixa o navegador e o modelo de legendas.
4. O inicializador abre o formulário e mostra uma chave de acesso separada no PowerShell. Cole essa chave no formulário, informe o roteiro aprovado e clique em **Produzir vídeo**. Depois do render, baixe o MP4, o SRT e o WAV.

Os trabalhos ficam no volume local do Docker. Use o comando abaixo na pasta do repositório para parar o estúdio entre produções.

```powershell
docker --context desktop-linux compose stop
```

Para atualizar a chave do Google, rode o inicializador com `-TrocarChave` entre produções. A chave é lida como segredo do contêiner. O Google 2.5 Flash Preview TTS usa a cota do projeto escolhido e retorna um erro se ela estiver esgotada. Você ainda pode anexar um WAV e usar as legendas e o render locais. [Preços e níveis do Gemini](https://ai.google.dev/gemini-api/docs/pricing)
