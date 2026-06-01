# Vibe Game: Incremental AFK & Gacha RPG ⚔️

Um jogo incremental (clicker/idle) épico e expansivo construído inteiramente em JavaScript modular utilizando a API HTML5 Canvas para renderização visual avançada. O jogo combina combate ativo, gerenciamento de equipe, invocações via Gacha e múltiplos sistemas de progressão de longo prazo.

## 🌟 Funcionalidades Principais

* **Combate Misto:** Progrida clicando ativamente para causar dano massivo ou escale heróis para dizimar os inimigos passivamente com DPS.
* **Gerenciamento de Equipe Tático:** Escale até **3 Heróis simultâneos** no campo de batalha. Combine sinergias de habilidades ativas, buffs passivos e danos elementais.
* **Ciclo Dia/Noite e Biomas:** Cenários gerados processualmente que alternam entre **Floresta** e **Pântano**, com transição dinâmica de iluminação (Manhã, Tarde, Noite, Madrugada) e fases da Lua.
* **Inimigos Únicos e Chefes:** Enfrente hordas de monstros e Chefes colossais a cada 5 níveis, como Orcs Furiosos, Goblins, Slimes Gigantes e a temível Hidra de 3 Cabeças com animações procedurais.
* **Responsividade Mobile:** A interface e a câmera da engine (Canvas) se adaptam dinamicamente a telas verticais (smartphones), reposicionando heróis, HUD e painéis através de CSS Grid e Matemática de offsets para a melhor experiência em qualquer dispositivo.
* **Áudio Procedural 8-bit:** Sintetizador sonoro construído do zero usando a Web Audio API, gerando ondas sonoras matemáticas sem necessidade de arquivos `.mp3`.

## 🎲 Heróis e Classes (Sistema Gacha)

Invoque novos aliados no Altar usando **Gemas**, com um sistema justo de *Pity* (herói garantido a cada 50 tiros). Obter cópias repetidas concede Fragmentos para evoluir os heróis até **5 Estrelas (Despertar Máximo)**, desbloqueando auras visuais exclusivas e dobrando o poder base.

* **⚔️ Guerreiro Principal:** O líder do grupo. Seu dano provém inteiramente dos seus cliques.
  * *Skill:* **🔥 Lâmina Incandescente** (Multiplica o dano de clique, incendeia a espada e aplica *Degradação Poligonal* em Chefes).
* **🏹 Elfa Arqueira:** Atiradora focada em dano passivo à distância com alto poder de *burst*.
  * *Skill:* **🏹 Rajada de Glifos** (Dispara múltiplas flechas mágicas que causam dano instantâneo estrondoso).
* **🔮 Mago de Glintstone:** Conjurador cujos ataques básicos perseguem os inimigos.
  * *Skill:* **🔮 Comet Azur** (Canaliza um feixe colossal contínuo de dano multi-hit que derrete o HP do inimigo. Utiliza um *Throttle* matemático otimizado para não gargalar a engine).
* **🛡️ Cavaleiro de Ferro:** O suporte definitivo. Não ataca, mas oferece buffs massivos para a equipe.
  * *Skill:* **⚙️ Baluarte Vetorial** (Ergue um escudo que amplifica temporariamente todo o DPS e dano de clique do time).
* **🐍 Ladra de Presas:** Assassina ágil que acumula pilhas de veneno contínuo nos adversários.
  * *Skill:* **☠️ Adagas de Glifos** (Realiza um Dash/Blink ultra-rápido, consome todo o lodo tóxico acumulado com um Corte Duplo em 'X' devastador e retorna com um Backdash inercial).

## ⚔️ Mecânicas Avançadas de Combate

* **Sinergias Elementais:** 
  * *Degradação Poligonal:* Usar a espada de fogo contra Chefes triplica o dano.
  * *Derretimento de Pixels:* Atingir um Chefe em chamas com a Rajada de Glifos da Elfa dobra o dano da habilidade.
* **Game Feel (Juice):**
  * **Hit Stop & Screen Shake:** Ataques críticos e habilidades supremas congelam a tela por milissegundos e geram tremores de câmera para passar a sensação de peso e impacto.
  * **Números de Dano:** Textos saltitantes e dinâmicos com cores diferentes baseadas no tipo de elemento ou se foi um acerto Crítico.

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
Abra portais para enfrentar inimigos sob forte pressão de tempo. Você tem apenas **30 segundos** por andar, e o HP dos monstros aumenta exponencialmente (`50% a mais por nível`). Em compensação, suas habilidades recarregam **2x mais rápido**. Atingir andares altos recompensa você com grandes quantidades de Fragmentos Universais.

### 📜 Guilda dos Aventureiros
* **Contratos Diários:** Um "Pool" rotativo sorteia 2 missões variadas todos os dias (dar X cliques, matar X chefes, dar X críticos, usar X skills) para receber infusões regulares de Gemas.
* **Expedições Temporárias:** Tem heróis sobrando? Envie um herói inativo em uma missão de exploração que leva **1 hora de tempo real**. A recompensa em Glintstone escala diretamente com o DPS atual daquele herói, além de trazer Gemas garantidas.

### 🏆 Sistema de Marcos (Conquistas)
Ganhe recompensas progressivas em *Tiers* (Tier 1 a 5) ao alcançar metas históricas no jogo: Cliques Manuais, Monstros Derrotados, Nível Alcançado e Tiros no Altar do Gacha.

### ⚒️ Forja e Inventário
Chefes derrotados derrubam materiais baseados no bioma atual (*Couro de Orc* na Floresta e *Escamas de Hidra* no Pântano). Reúna materiais para forjar Artefatos Globais que alteram as regras do jogo, como prolongar o tempo de suas habilidades ou reduzir os cooldowns.

## 🎨 Arte e Renderização Dinâmica

Todo o jogo é desenhado em tempo real utilizando Matemática e Canvas 2D, sem uso de imagens ou *spritesheets* externos!
* Retratos (Portraits) desenhados via código para cada aba e painel.
* **Animação Gacha e Splash Arts:** Ao invocar um herói, uma animação cinematográfica em tela cheia é disparada exibindo *Splash Arts* massivas desenhadas proceduralmente usando Camadas, Curvas de Bézier e Sombreamento (ShadowBlur).
* Sistema de Partículas avançado: Fogo, Faíscas, Sangue com gravidade, Cubos rotativos e Explosões arcanas.
* Animações ricas e Vivas: Árvores balançando ao vento em loops sinoidais, grama dinâmica, névoa pantanosa translúcida e o movimento independente e fluído (Curvas de Bézier) das 3 cabeças da Hidra.
* **Otimizações de Engine:** Controle inteligente de poluição visual. Cálculos matemáticos caros (como o dano multi-hit do Mago) rodam com "Throttle" (4 vezes por segundo), mantendo os efeitos visuais a 60 FPS lisos sem fritar o CPU do dispositivo.

## 🎵 Sistema de Som 8-Bit
Uma arquitetura sonoplástica construída puramente através do chip de áudio do Navegador (`AudioContext`). O código sintetiza osciladores de onda:
* **Square Wave:** Impactos pesados e explosões.
* **Sawtooth Wave:** Laser arcano e efeitos Sci-Fi.
* **Triangle Wave:** Sons de corte e espada curtos.
* **Sine Wave:** Efeito "Plim" harmonioso de moedas e UI.

## 💾 Gerenciamento de Save

* **Salvamento Automático:** Seu progresso é salvo no `localStorage` do navegador instantaneamente a cada ação importante.
* **Progresso Offline:** Fechou o jogo? Seus heróis continuam lutando! Ao retornar, o jogo calcula o tempo fora considerando todos os bônus passivos (incluindo da árvore do Santuário e Hermes) e exibe um **Relatório Animado em Tela Cheia** com os monstros derrotados e ouro gerado.
* **Exportar/Importar Fisicamente:** Exporte seu save para um arquivo `.dat` e baixe para o seu computador, permitindo backups seguros ou a migração do seu progresso para outro navegador ou dispositivo.

## 🚀 Como Executar

Como o projeto utiliza a arquitetura de Módulos do ES6 (`import`/`export`), ele requer um servidor web local devido às políticas de segurança (CORS) dos navegadores.

1. Abra a pasta do projeto no VS Code (ou na sua IDE favorita).
2. Utilize uma extensão como **Live Server** (VS Code) para hospedar a pasta localmente.
3. O jogo será aberto no seu navegador através do arquivo `index.html`.
4. Prepare sua equipe, clique sem parar e boa sorte na caçada!

## 🛠️ Tecnologias Utilizadas

* **JavaScript Vanilla (ES6+)** - Lógica, Física, Motor de Combate.
* **HTML5 Canvas API Context 2D** - Renderização gráfica e animações procedurais.
* **Web Audio API** - Síntese sonora.
* **CSS3** - Interface de Usuário (HUD), Layout Flexbox/Grid e Responsividade.
