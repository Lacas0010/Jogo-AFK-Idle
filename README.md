# Vibe Game: Incremental AFK & Gacha RPG ⚔️

Um jogo incremental (clicker/idle) épico e expansivo construído inteiramente em JavaScript modular utilizando a API HTML5 Canvas para renderização visual avançada. O jogo combina combate ativo, gerenciamento de equipe tático, invocações via Gacha e múltiplos sistemas de progressão de longo prazo.

## 🌟 Funcionalidades Principais

* **Combate Misto e Quebra de Escudos:** Progrida clicando ativamente para causar dano massivo ou escale heróis para dizimar inimigos passivamente. Destrua barreiras táticas de chefes para ativar atordoamentos devastadores.
* **Gerenciamento de Equipe:** Escale até **3 Heróis simultâneos** no campo de batalha. Combine sinergias de habilidades ativas, buffs passivos e danos elementais.
* **Progressão Automatizada de Biomas:** O mundo evolui graficamente conforme a sua faixa de nível, transitando desde florestas pacíficas até cumes vulcânicos e cavernas abissais.
* **Responsividade Mobile:** A interface e a câmera da engine (Canvas) se adaptam dinamicamente a telas verticais (smartphones), reposicionando heróis, HUD e painéis através de CSS Grid e Matemática de offsets.
* **Áudio Procedural 8-bit Maestro:** Sintetizador sonoro e sequenciador construído do zero usando a Web Audio API, gerando músicas matemáticas e efeitos sem necessidade de arquivos `.mp3`.

## 🎲 Heróis e Classes (Sistema Gacha)

Invoque novos aliados no Altar usando **Gemas**, com um sistema justo de *Pity* (herói garantido a cada 50 tiros) e balanceamento padrão da indústria:
* **🏆 2% de Chance:** Drop Dourado Lendário (Herói Inédito ou 10 Fragmentos).
* **🟣 38% de Chance:** Drop Roxo (1 ou 2 Fragmentos aleatórios – drop rate nerfado de forma justa para cadenciar o ritmo do grind).
* **🔵 60% de Chance:** Drop Azul (Pontos de Glintstone massivos baseados no seu DPS atual).

*Feedback Visual Inteligente:* Personagens recém-desbloqueados disparam uma animação cinematográfica em tela cheia coroada com a etiqueta **"✨ NOVO!"**. Tirar cópias repetidas exibe dinamicamente a tag **"🧩 +10 Fragmentos"**, permitindo evoluir heróis até **5 Estrelas (Despertar Máximo)**, dobrando o poder base e liberando auras visuais.

* **⚔️ Guerreiro Principal:** O líder do grupo. Seu dano provém inteiramente dos seus cliques.
  * *Skill:* **🔥 Lâmina Incandescente** (Multiplica o dano de clique, incendeia a espada e aplica *Degradação Poligonal* em Chefes).
* **🏹 Elfa Arqueira:** Atiradora focada em dano passivo à distância com alto poder de *burst*.
  * *Skill:* **🏹 Rajada de Glifos** (Dispara múltiplas flechas mágicas que causam dano instantâneo estrondoso).
* **🔮 Mago de Glintstone:** Conjurador cujos ataques básicos perseguem os inimigos.
  * *Skill:* **🔮 Comet Azur** (Canaliza um feixe colossal contínuo de dano multi-hit que derrete o HP do inimigo).
* **🛡️ Cavaleiro de Ferro:** Suporte tático e defensivo. Aumenta o dano global da equipe permanentemente e possui o bônus tático exclusivo de **+50% de Dano focado na Quebra de Escudo**.
  * *Skill:* **⚙️ Baluarte Vetorial** (Ergue uma barreira dourada por 6s que dobra o dano de clique do jogador e concede +50% de DPS ativo para toda a equipe em campo).
* ** Ladra de Presas:** Assassina ágil que acumula pilhas de veneno contínuo nos adversários.
  * *Skill:* **🔮 Adagas de Glifos** (Consome todo o lodo tóxico com um corte duplo massivo em formato de 'X').

## ⚔️ Mecânicas Avançadas de Combate

* **Sistema de Shield Break (Quebra de Escudo Tática):** 
  * A cada 5 níveis, Chefes colossais surgem envelopados por uma barreira de força equivalente a **40% do seu HP Máximo**.
  * O escudo mitiga agressivamente **80% de todo o dano direto** recebido.
  * Ao zerar a durabilidade da barreira, atinge-se o **Stun Break (Atordoamento)**: A tela do jogo sofre um *Screen Shake* violento, o letreiro indicativo **"💥 QUEBRADO! 💥"** pisca insistentemente na tela, e o chefe fica neutralizado por 5 segundos (300 frames). Durante este colapso, o monstro sofre um brutal **multiplicador de 3x em todos os danos recebidos**.
* **Sinergias Elementais:** *Degradação Poligonal* (fogo vs boss) e *Derretimento de Pixels* (magia vs fogo).
* **Game Feel (Juice):**
  * **Hit Stop & Screen Shake:** Ataques críticos e habilidades supremas congelam a tela por milissegundos e geram tremores de câmera para passar a sensação de peso e impacto.
  * **Números de Dano:** Textos saltitantes e dinâmicos com cores diferentes baseadas no tipo de elemento ou se foi um acerto Crítico.

## ⚙️ Sistemas de Progressão e Meta-Jogo

### ⚒️ Loop de Forja & Upgrades de Artefatos Contínuos
Os materiais recolhidos ao aniquilar os Chefes do Reino (`Couro de Orc`, `Escamas de Hidra`, `Dente de Dragão`) agora alimentam um ciclo escalável contínuo de progressão. Em vez de compras únicas, o jogador adquire e **dá Upgrades de nível infinitos** nos Artefatos Forjados, escalando progressivamente seus multiplicadores de dano crítico e bônus táticos sem limites.

### 🏛️ Santuário & Ascensão Cósmica
Ao atingir o Nível 30, reinicie sua jornada através da Ascensão para obter **Almas Poligonais**. Troque essas almas na Árvore de Upgrades do Santuário por melhorias permanentes:
* Aumento de Dano de Clique e Chance de Crítico Global.
* Bônus de Gemas ao derrotar Chefes.
* **Conjurador Automático:** Uma melhoria suprema que ativa as habilidades da sua equipe automaticamente assim que estiverem prontas.

### 🏺 Panteão dos Deuses e Frestas Dimensionais
Abra portais desafiadores com apenas **30 segundos** e inimigos de vida exponencial (`+50% por andar`), mas com tempo de recarga das habilidades acelerado **(2x mais rápido)**. O objetivo é vencer as frestas para arrebatar *Fragmentos Universais* visando fortalecer infinitamente relíquias de Deuses (Ares, Hermes e Midas) para aceleramento de farms *offline* e DPS massivos.

### 📜 Guilda dos Aventureiros
* **Contratos Diários:** Missões geradas processualmente em pools de abates variados diários rendendo montanhas de Gemas puras.
* **Expedições Temporárias:** Envie seu herói inativo que sobrou no Gacha em missões afk puras de 1 hora, colhendo renda massiva de gemas baseada exclusivamente no DPS bruto daquele agente inativo.

## 🎨 Arte, Renderização Dinâmica e Rotação de Biomas

Todo o jogo é desenhado em tempo real utilizando Matemática e Canvas 2D, sem uso de imagens ou *spritesheets* externos!

### 🌍 Sistema de Biomas Automatizados
A Engine alterna o cenário visual e ambiente biológico automaticamente se baseando nas faixas de fase e andares do jogador:
* **🌲 Níveis 1 a 15: Campos de Glintstone** - Floresta iluminada com céu azul e tons verde-esmeralda vibrantes possuindo um estética visual *cozy* com paletas fofas estilo *Tiny Glade*.
* **☠️ Níveis 16 a 30: Pântano Tóxico** - Bioma impiedoso apresentando o céu púrpura/magenta encoberto, poças de solo em formato lodo espesso e um denso efeito de névoa translúcida que cobre o horizonte por inteiro.
* **🦇 Níveis 31 a 45: Caverna de Glintstone** - Exploração focada num vasto ambiente de escuridão com rochas, teto cravado de estalactites profundas, estalagmites emergindo e uma iluminação com Fake *GI (Global Illumination)* dinâmica gerada por tochas tremulantes das paredes.
* **🌋 Níveis 46 ao 60+: O Cume do Reino** - O ápice dos perigos apresentando céus com iluminação dramática num rubro carmesim opressor evidenciando as silhuetas afiadas de um castelo distante acompanhado por brasas de cinzas levadas ao sabor dos ventos ardentes da montanha.

### 🎨 FX & Otimização
Acompanhado de *Splash Arts* majestosas em camadas e Animações Cinematográficas das invocações do Altar baseadas em Sombreamentos (ShadowBlur), cada cálculo de multi-hit oneroso é inteligentemente regrado num padrão *Throttle* rodando exatamente 4 quadros matemáticos por segundo para deixar o layout e UI liso aos 60 FPS nos Celulares.

## 🎵 Arquitetura de Som Procedural (Maestro Sequenciador)
A estrutura baseada pelo `AudioContext` nativa de HTML5 recebeu o grandioso **Maestro/Sequenciador BGM**, gerando progressões e atmosferas mono sem bibliotecas (excluindo `.mp3` e dependências físicas):

* **Trilha do Menu ("O Bardo na Taverna"):** Uma bela composição e progressão dedilhada firmada em **Lá Menor**. Traz uma experiência baseada na onda `triangle` de forma a mimetizar fisicamente o conforto e maciez do bater de cordas de um alaúde medieval acompanhado por um *decay* acolhedor longo e atmosférico.
* **Trilha de Batalha ("Combate Iminente"):** Clima em batida tensa e violenta formulada no Sequenciador através do alto BPM, manipulando as agressivas arestas da onda `square` em formatações de ritmo *staccato*, sendo cortada com exatidão milimétrica nas pausas pontuais de silêncio para simular puro sentimento de urgência.

## 💾 Gerenciamento de Save

* **Salvamento Automático:** Seu progresso é salvo no `localStorage` do navegador instantaneamente a cada ação importante.
* **Progresso Offline:** Fechou o jogo? Seus heróis continuam lutando! Retorne e receba um Relatório Animado computando os acréscimos por Hermes em segundos afk.
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
* **Web Audio API** - Síntese sonora algorítmica.
* **CSS3** - Interface de Usuário (HUD), Layout Flexbox/Grid e Responsividade.
