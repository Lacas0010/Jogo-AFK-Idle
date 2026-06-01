# Vibe Game: Incremental AFK & Gacha RPG ⚔️

Um jogo incremental (clicker/idle) épico e expansivo construído inteiramente em JavaScript modular utilizando a API HTML5 Canvas para renderização visual avançada. O jogo combina combate ativo, gerenciamento de equipe, invocações via Gacha e múltiplos sistemas de progressão de longo prazo.

## 🌟 Funcionalidades Principais

* **Combate Misto:** Progrida clicando ativamente para causar dano massivo ou escale heróis para dizimar os inimigos passivamente com DPS.
* **Gerenciamento de Equipe Tático:** Escale até **3 Heróis simultâneos** no campo de batalha. Combine sinergias de habilidades ativas, buffs passivos e danos elementais.
* **Ciclo Dia/Noite e Biomas:** Cenários gerados processualmente que alternam entre **Floresta** e **Pântano**, com transição dinâmica de iluminação (Manhã, Tarde, Noite, Madrugada) e fases da Lua.
* **Inimigos Únicos e Chefes:** Enfrente hordas de monstros e Chefes colossais a cada 5 níveis, como Orcs Furiosos, Goblins, Slimes Gigantes e a temível Hidra de 3 Cabeças com animações procedurais.
* **Responsividade Mobile:** A interface e a câmera da engine (Canvas) se adaptam dinamicamente a telas verticais (smartphones), reposicionando heróis, HUD e painéis através de CSS Grid e Matemática de offsets para a melhor experiência em qualquer dispositivo.

##  Heróis e Classes (Sistema Gacha)

Invoque novos aliados no Altar usando **Gemas**, com um sistema justo de *Pity* (herói garantido a cada 50 tiros). Obter cópias repetidas concede Fragmentos para evoluir os heróis até **5 Estrelas (Despertar Máximo)**, desbloqueando auras visuais exclusivas e dobrando o poder base.

* **⚔️ Guerreiro Principal:** O líder do grupo. Seu dano provém inteiramente dos seus cliques.
  * *Skill:* **🔥 Lâmina Incandescente** (Multiplica o dano de clique e incendeia a espada).
* **🏹 Elfa Arqueira:** Atiradora focada em dano passivo à distância com alto poder de *burst*.
  * *Skill:* **🏹 Rajada de Glifos** (Dispara múltiplas flechas mágicas que causam dano instantâneo estrondoso).
* **🔮 Mago de Glintstone:** Conjurador cujos ataques básicos perseguem os inimigos.
  * *Skill:* **🔮 Comet Azur** (Canaliza um feixe colossal contínuo de dano multi-hit que derrete o HP do inimigo. Utiliza um *Throttle* matemático otimizado para não gargalar a engine).
* **🛡️ Cavaleiro de Ferro:** O suporte definitivo. Não ataca, mas oferece buffs massivos para a equipe.
  * *Skill:* **⚙️ Baluarte Vetorial** (Ergue um escudo que amplifica temporariamente todo o DPS e dano de clique do time).
* **🐍 Ladra de Presas:** Assassina ágil que acumula pilhas de veneno contínuo nos adversários.
  * *Skill:* **🔮 Adagas de Glifos** (Realiza um Dash/Blink ultra-rápido, consome todo o lodo tóxico com um Corte Duplo em 'X' devastador e retorna com um Backdash inercial).

## ⚔️ Mecânicas Avançadas de Combate

* **Sinergias Elementais:** 
  * *Degradação Poligonal:* Usar a espada de fogo contra Chefes triplica o dano.
  * *Derretimento de Pixels:* Atingir um Chefe em chamas com a Rajada de Glifos da Elfa dobra o dano da habilidade.
* **Feedback Visual:** Números de dano saltitantes, indicação de acertos Críticos e efeitos de tela tremendo durante impactos pesados.

## ⚙️ Sistemas de Progressão e Meta-Jogo

### 🏛️ Santuário & Ascensão Cósmica
Ao atingir o Nível 30, reinicie sua jornada através da Ascensão para obter **Almas Poligonais**. Troque essas almas na Árvore de Upgrades do Santuário por melhorias permanentes:
* Aumento de Dano de Clique e Chance de Crítico Global.
* Bônus de Gemas ao derrotar Chefes.
* Aceleração na recarga de habilidades (Cooldown).
* **Conjurador Automático:** Uma melhoria suprema que ativa as habilidades da sua equipe automaticamente assim que estiverem prontas.

### 🏺 Panteão dos Deuses
Uma progressão secundária utilizando **Fragmentos Universais**. Melhore relíquias divinas infinitamente:
* **Bênção de Ares:** Multiplicador global de DPS.
* **Bênção de Hermes:** Acelera o ganho de recursos enquanto você estiver offline.
* **Bênção de Midas:** Aumenta a chance de dobrar os pontos recebidos ao derrotar monstros.

### 🌌 Frestas Dimensionais (Desafio de Tempo)
Abra portais para enfrentar inimigos com HP exponencialmente maior. Você tem apenas **30 segundos** para matar o alvo, mas suas habilidades recarregam **2x mais rápido**. Até onde você consegue chegar? A recompensa são preciosos Fragmentos Universais.

### 📜 Guilda dos Aventureiros
* **Contratos Diários:** Cumpra missões variadas (dar X cliques, matar X chefes, dar X críticos) para receber infusões regulares de Gemas.
* **Expedições:** Tem heróis sobrando? Envie aqueles que não estão no time ativo em missões de 1 hora de tempo real para buscar Pontos e Gemas extras (recompensa escala com o DPS do herói enviado).

### 🏆 Sistema de Marcos (Conquistas)
Ganhe recompensas progressivas e massivas de Gemas ao alcançar metas históricas no jogo: Cliques Manuais, Monstros Derrotados, Nível Alcançado e Tiros no Altar do Gacha.

### ⚒️ Forja e Inventário
Chefes derrotados derrubam materiais baseados no bioma atual (*Couro de Orc* na Floresta e *Escamas de Hidra* no Pântano). Reúna materiais para forjar Artefatos Globais que alteram as regras do jogo, como prolongar o tempo de suas habilidades ou reduzir os cooldowns.

## 🎨 Arte e Renderização Dinâmica

Todo o jogo é desenhado em tempo real utilizando Matemática e Canvas 2D, sem uso de imagens ou *spritesheets* externos!
* Retratos (Portraits) desenhados via código para cada aba e painel.
* **Animação Gacha e Splash Arts:** Ao invocar um herói, uma animação cinematográfica em tela cheia é disparada exibindo *Splash Arts* massivas desenhadas proceduralmente usando Camadas, Curvas de Bézier e Sombreamento (ShadowBlur).
* Sistema de Partículas avançado: Fogo, Faíscas, Sangue com gravidade, Cubos rotativos e Explosões arcanas.
* Animações ricas: Árvores balançando ao vento, grama dinâmica, névoa pantanosa e o movimento fluído (Curvas de Bézier) dos pescoços da Hidra.
* **Otimizações de Engine:** Controle inteligente de poluição visual e cálculos de FPS (como o *Throttle* de Raio do Mago) evitando que dispositivos travem durante o *Late Game*.

## 💾 Gerenciamento de Save

* **Salvamento Automático:** Seu progresso é salvo no `localStorage` do navegador instantaneamente a cada ação importante.
* **Progresso Offline:** Fechou o jogo? Seus heróis continuam lutando! Ao retornar, o jogo calcula todo o DPS gerado no período de ausência e recompensa você com os pontos devidos.
* **Exportar/Importar Fisicamente:** Exporte seu save para um arquivo `.dat` e baixe para o seu computador, permitindo backups seguros ou a migração do seu progresso para outro navegador ou dispositivo.

## � Como Executar

Como o projeto utiliza a arquitetura de Módulos do ES6 (`import`/`export`), ele requer um servidor web local devido às políticas de segurança (CORS) dos navegadores.

1. Clone o repositório ou baixe os arquivos.
2. Abra a pasta do projeto no VS Code (ou na sua IDE favorita).
3. Utilize uma extensão como **Live Server** (VS Code) para hospedar a pasta.
4. O jogo será aberto no seu navegador através do arquivo `index.html`.
5. Prepare sua equipe, clique sem parar e boa sorte na caçada!

## 🛠️ Tecnologias Utilizadas

* **JavaScript Vanilla (ES6+)** - Lógica, Física, Motor de Combate.
* **HTML5 Canvas API Context 2D** - Renderização gráfica e animações procedurais.
* **CSS3** - Interface de Usuário (HUD), Layout Flexbox/Grid e Responsividade.
