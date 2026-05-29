# Jogo Incremental AFK & Gacha ⚔️

Um jogo incremental (clicker/idle) construído em JavaScript modular utilizando a API HTML5 Canvas para renderização. O jogo apresenta progressão por níveis, sistema de Gacha, habilidades ativas e ciclo dinâmico de tempo.

## 🌟 Funcionalidades

* **Combate Incremental:** Clique ativamente para atacar monstros ou dependa do DPS passivo da sua equipe.
* **Gerenciamento de Equipe:** Escale até 3 heróis simultâneos no seu time ativo, combinando sinergias de DPS passivo e habilidades em combate.
* **Sistema de Upgrades & Estrelas:** Utilize pontos para aprimorar Dano e Crítico. Colete fragmentos repetidos no Gacha para evoluir heróis até **5 Estrelas (Despertar Máximo)**, ganhando grandes bônus de multiplicadores e auras visuais únicas.
* **Sistema de Gacha Aprimorado:** Gaste "Gemas" para invocar heróis com sistema de *Pity* garantido aos 50 tiros.
* **Heróis & Habilidades Especiais Visuais:**
  * ⚔️ *Guerreiro Principal:* 🔥 Lâmina Incandescente (Multiplicador massivo de dano e chamas contínuas).
  * 🏹 *Elfa Arqueira:* 🏹 Rajada de Glifos (Burst damage formidável de Glintstone).
  * 🔮 *Mago de Glintstone:* 🔮 Comet Azur (Raio multi-hit frame-a-frame que derrete inimigos).
  * 🛡️ *Cavaleiro de Ferro:* ⚙️ Baluarte Vetorial (Suporte focado em aumentar o DPS e clique de todo o time).
* **Biomas & Novos Chefes:** Enfrente Bosses a cada 5 níveis (Orcs, Goblins, Hidras e Slimes) enquanto viaja por transições dinâmicas entre os biomas de **Floresta** e **Pântano**.
* **Inventário & Forja:** Derrote chefes para obter *Couro de Orc* e *Escamas de Hidra*. Utilize-os na Forja para criar Artefatos poderosos (como Manopla Orc e Glândula Hidra) que alteram tempo de recarga e duração das habilidades globais.
* **Guilda dos Aventureiros:** Cumpra Contratos Diários para ganhar Gemas extras e envie seus heróis inativos em **Expedições** em busca de tesouros com duração de tempo real (1 hora).
* **Ascensão & Santuário:** Ao atingir o nível 30, realize uma "Ascensão Cósmica" e obtenha *Almas Poligonais*. Troque as Almas no Santuário por melhorias permanentes (Poder Primordial, Fluxo Temporal, e até Conjurador Automático de Habilidades).
* **Ciclo Dia/Noite:** Céu e ambiente totalmente desenhados em Canvas que transitam entre dia, pôr do sol e fases da lua.
* **Save Local e Progresso Offline:** O jogo salva automaticamente no seu navegador (`localStorage`) e calcula os ataques passivos que ocorreram enquanto você estava fora.
* **Exportação/Importação Física:** Baixe um arquivo local (`.dat`) contendo o save completo para garantir que nunca perderá seu progresso e possa jogá-lo em outros dispositivos.

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
* **CSS3**
