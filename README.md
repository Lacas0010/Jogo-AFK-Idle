# Jogo Incremental AFK & Gacha ⚔️

Um jogo incremental (clicker/idle) construído em JavaScript modular utilizando a API HTML5 Canvas para renderização. O jogo apresenta progressão por níveis, sistema de Gacha, habilidades ativas e ciclo dinâmico de tempo.

## 🌟 Funcionalidades

* **Combate Incremental:** Clique ativamente para atacar monstros ou dependa do DPS passivo da sua equipe.
* **Sistema de Upgrades:** Utilize pontos para aprimorar Dano, Chance de Crítico e subir o nível das Habilidades Ativas.
* **Sistema de Gacha:** Gaste "Gemas" para invocar novos heróis (como a *Elfa Arqueira*) ou coletar fragmentos para aumentar suas estrelas (com sistema de *Pity* garantido aos 50 tiros).
* **Habilidades Especiais Visuais:**
  * 🔥 *Lâmina Incandescente* (Herói Principal)
  * 🏹 *Rajada de Glifos* (Elfa Arqueira - Burst Damage)
* **Lutas contra Chefes:** A cada 5 níveis enfrente um Orc Chefe para ganhar bônus significativos de gemas e pontos.
* **Ciclo Dia/Noite:** Céu e ambiente totalmente desenhados em Canvas que transitam entre dia, pôr do sol e fases da lua.
* **Ascensão:** Ao atingir o nível 30, realize uma "Ascensão Cósmica", sacrificando seu progresso atual para ganhar multiplicadores de dano permanentes.
* **Save Local e Progresso Offline:** O jogo salva automaticamente no seu navegador (`localStorage`) e calcula os ataques passivos que ocorreram enquanto você estava fora.

## 📁 Estrutura de Arquivos

O jogo foi modularizado para melhor manutenção do código:

* `state.js` - Gerencia a persistência (Salvar/Carregar), o objeto principal do jogo (`jogo`), a matemática de status e a mecânica de reset (Ascensão).
* `engine.js` - O motor principal do jogo. Faz a ponte (bind) das funções para a interface HTML, processa loops em tempo real (DPS, Cooldown de skills) e cuida das lógicas de combate.
* `render.js` - Cuida exclusivamente dos visuais e animações (Cenário, monstros, sistema de partículas e textos flutuantes de dano/notificação) usando HTML5 Canvas.
* `gacha.js` - Controla toda a roleta de heróis, porcentagens de queda (drop rates), conversão de duplicatas em fragmentos e evolução por estrelas.

## 🚀 Como Executar

Como o projeto utiliza `ES6 Modules` (com as declarações de `import` e `export`), ele precisa rodar através de um servidor web local por conta das políticas de segurança de navegadores (CORS).

1. Abra a pasta do projeto no VS Code (ou sua IDE favorita).
2. Utilize uma extensão como **Live Server**.
3. Inicie o servidor, o jogo abrirá através do seu arquivo `index.html`.
4. Clique na tela, melhore seus personagens e divirta-se!

## 🛠️ Tecnologias Utilizadas

* **Vanilla JavaScript (ES6+)**
* **HTML5 Canvas Context 2D**
* **CSS3** (Presumido para estilização da interface dos menus)