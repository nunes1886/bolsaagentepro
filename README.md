📈 BolsaAgente.PRO
BolsaAgente.PRO é um terminal financeiro em tempo real desenvolvido para monitoramento de ativos da B3. O projeto oferece uma interface intuitiva, rápida e totalmente responsiva, permitindo que investidores acompanhem cotações e gráficos diretamente do navegador ou dispositivo móvel.

🚀 Funcionalidades
Monitoramento em Tempo Real: Atualização automática de cotações através de integração com APIs financeiras.

Gráficos Interativos: Visualização de histórico de preços com uma interface limpa e técnica.

Watchlist Personalizada: Sincronização de uma lista de ativos favoritos via banco de dados (Google Sheets/n8n).

Ticker Tape Dinâmico: Barra superior com os principais índices e moedas, apresentando variação percentual.

Design Responsivo: Otimizado para Desktop e Mobile, garantindo a mesma experiência em qualquer tela.

Alertas de Preço: Sistema preparado para integração de notificações via e-mail.

🛠️ Tecnologias Utilizadas
O projeto utiliza o que há de mais moderno no ecossistema de desenvolvimento web:

Frontend: React (Vite) para uma interface reativa e rápida.

Estilização: Tailwind CSS para um design moderno e utilitário.

Ícones: Lucide React para uma identidade visual consistente.

Gráficos: Implementação de componentes gráficos customizados para análise técnica.

Integração: Axios para consumo de Webhooks e APIs.

Orquestração de Dados: n8n para automação de fluxos entre a API financeira e o banco de dados.

🏗️ Arquitetura do Sistema
O sistema opera em uma arquitetura moderna de microsserviços e automação:

O Frontend solicita dados através de Webhooks.

O n8n atua como o cérebro, buscando dados na Brapi API e gerenciando a persistência no Google Sheets.

O DevTunnels permite a comunicação segura entre o ambiente local e a nuvem durante o desenvolvimento.

📦 Como rodar o projeto
Clone o repositório:

Bash
git clone https://github.com/nunes1886/bolsaagentepro.git
Instale as dependências:

Bash
npm install
Configure as variáveis de ambiente no arquivo .env (URL do seu servidor de integração).

Inicie o servidor de desenvolvimento:

Bash
npm run dev
✒️ Autor
Desenvolvido por Gledson Nunes — Estudante de Análise e Desenvolvimento de Sistemas.

GitHub: @nunes1886

LinkedIn: https://www.linkedin.com/in/gledson-nunes-23b5531b5/

📝 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE] para mais detalhes.