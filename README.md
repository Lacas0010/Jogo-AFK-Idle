# Polygonal Echoes: Idle RPG ⚔️

Um jogo incremental (clicker/idle) épico e expansivo construído inteiramente em JavaScript modular utilizando a API HTML5 Canvas para renderização visual procedural avançada. O jogo combina combate ativo, gerenciamento tático de equipe, invocações via Gacha e múltiplos sistemas de progressão e crônicas incrementais.

## 🌟 Identidade Visual e Experiência Premium

Logo ao entrar no jogo, o jogador é recebido por um Menu Inicial com uma identidade visual majestosa construída puramente via código em um sistema de **Parallax de 5 Camadas**, criando uma profundidade imersiva de *Golden Hour*:
1. **Céu em Pôr do Sol**: Gradientes suaves e quentes de fim de tarde.
2. **Colinas Suaves**: Relevo pacífico banhado por uma neblina atmosférica.
3. **O Grande Castelo Branco**: Estrutura imponente com telhados em terracota e iluminação baseada na direção do sol.
4. **Vila Acolhedora**: Casinhas aglomeradas com texturas de sombra e luz.
5. **Floresta Fluffy**: Tufos de folhas sobrepostos em primeiro plano balançando dinamicamente.

## 🌍 Rotação Automática de Biomas no Canvas

Todo o mundo do jogo é renderizado proceduralmente e evolui graficamente conforme a sua faixa de nível:

* **🌲 Níveis 1 a 15: Bioma Floresta** - Campos verdes com árvores balançando dinamicamente, macieiras detalhadas, nuvens e grama responsiva ao vetor de vento da engine.
* **☠️ Níveis 16 a 30: Bioma Pântano** - Céu púrpura opressor com uma estética morta, poças de lodo com bolhas tóxicas animadas que estouram, densa névoa baixa e cipós pendulantes.
* **🦇 Níveis 31 a 45: Bioma Caverna** - Exploração profunda contendo rachaduras nas rochas, estalactites e estalagmites, cristais preciosos pulsando magicamente e um sistema de iluminação dinâmica gerada por tochas cravadas nas paredes.

## 🎲 Heróis e Classes (Sistema Gacha)

Invoque novos aliados no Altar Criptado usando **Gemas**, contando com um sistema justo de *Pity* a cada 50 tiros e um balanceamento rigoroso (Conformidade de Pool):

| Raridade | Probabilidade | Recompensa do Drop |
| :--- | :--- | :--- |
| 👑 **Lendário (Dourado)** | **2%** | Desbloqueio de Herói Inédito ou 10 Fragmentos diretos. |
| 🟣 **Fragmentos (Roxo)** | **38%** | 1 a 2 Fragmentos aleatórios (Balanceado para cadenciar a progressão). |
| 🔵 **Moedas (Azul)** | **60%** | Pontos de Glintstone massivos baseados no DPS global da sua equipe atual. |

> **Tags Inteligentes:** Invocações de personagens inéditos disparam uma cinemática com a insígnia **"✨ NOVO!"**. Cópias repetidas dropam **"🧩 +10 Fragmentos"**, fundamentais para realizar o Despertar do herói até **5 Estrelas (Despertar Máximo)**, dobrando permanentemente o *scaling* de base e liberando auras estéticas e visuais exclusivas no Canvas!

### ⚔️ O Time de Combate

* **⚔️ Herói Principal:** O pilar do reino. Focado completamente em cliques manuais na tela.
  * *Skill: 🔥 Lâmina Incandescente* - Multiplica o dano de clique em 5x por 3s. Aplica *Degradação Poligonal* (3x Dano Extra) contra Chefes.
* **🏹 Elfa Arqueira:** Atiradora de elite focada em dano constante à distância.
  * *Skill: 🏹 Rajada de Glifos* - Dispara flechas de éter gerando um burst instantâneo e explosivo de 25x o dano base.
* **🔮 Conjurador de Éter:** Conjurador místico cujos ataques básicos viajam de forma teleguiada.
  * *Skill: 🔮 Torrente Prismática* - Canaliza um feixe contínuo multi-hit massivo. (*Nota técnica: Otimizado matematicamente na engine via throttle de 4 hits lógicos por segundo, reduzindo stress da CPU e garantindo os 60 FPS lisos no mobile*).
* **🛡️ Cavaleiro de Ferro:** Blindagem e suporte tático. Sua passiva aumenta o dano global em +1% por nível de DPS. Possui um contra-ataque de Escudada (*shieldBash*) gerando ondas de choque visuais no chão.
  * *Skill: ⚙️ Baluarte Vetorial* - Ergue uma barreira defensiva dourada que dobra o dano dos seus cliques manuais e concede +50% de DPS ativo para toda a equipe em campo.
* **🐍 Ladra de Presas:** Assassina ágil que aplica toxina cumulativa de dano contínuo (DoT) a cada golpe básico.
  * *Skill: 🔮 Adagas de Glifos* - Consome ativamente todo o lodo tóxico, descarregando um estouro visual de corte-duplo equivalente a 40x de dano escalado pelos acúmulos da toxina.

## ⚙️ Sistemas de Progressão e Meta-Jogo

### ⚒️ Loop de Forja & Upgrades de Artefatos Contínuos
Os materiais brutos recolhidos ao aniquilar os Chefes do Reino (`Couro de Orc`, `Escamas de Hidra`, `Dente de Dragão`) alimentam o sistema da Forja. Troque esses recursos por **Upgrades de Nível Progressivos** dos Artefatos, com custos escaláveis em Pontos. Isso aprimora infinitamente atributos base da sua *run*, estendendo duração de skills, multiplicadores críticos ou redução de *cooldown*.

### 🏛️ Santuário & Ascensão Cósmica
Reinicie seu progresso brutalmente após o Nível 30 para conquistar **Almas Poligonais** e um multiplicador universal de dano. Em seguida, invista almas na árvore do Santuário para liberar mecânicas QoL (Qualidade de Vida):
* **Conjurador Automático (Auto-Cast):** Dispara automaticamente as Habilidades Especiais (*Skills*) do time ativo quando prontas.
* **Dedo Fantasma (Auto-Clicker):** Adiciona cliques sistemáticos do sistema na taxa de 5 cliques precisos por segundo sem quebrar as restrições da UI.

###  Panteão das Relíquias & Frestas Dimensionais
Conteúdo puro de *endgame*. Abra portais hostis de tempo com exatos **30 segundos** para tentar abater chefes e sub-chefes. Nessas zonas, a recarga de *skills* flui **2x mais rápida**. O sucesso recompensa a moeda mítica *Fragmentos Universais*, utilizada no Panteão para evoluir permanentemente as cobiçadas Bênçãos de Ares, Hermes e Midas.

### 📜 Guilda dos Aventureiros
* **Quadro de Contratos:** Cumpra missões diárias geradas aleatoriamente baseadas em metas operacionais (como aplicar "50 Críticos") e fature montanhas de Gemas.
* **Expedições de Heróis:** Heróis da reserva (*pool* do Gacha inativo) não são inúteis! Envie-os para expedições perigosas *offline* com duração exata de 1 Hora e gere renda massiva em pontos baseada diretamente na estatística de DPS individual do enviado.

##  Arquitetura de Som Procedural (Maestro Sequenciador)
A estrutura baseada pelo `AudioContext` nativa de HTML5 recebeu o grandioso Maestro/Sequenciador BGM, gerando progressões mono sem bibliotecas e excluindo `.mp3`:
* **Menu Inicial ("O Bardo na Taverna"):** Composição pacífica e dedilhada em onda `triangle`, com decay logo, para mimetizar cordas tocadas num alaúde.
* **Batalha ("Combate Iminente"):** Batida de escala menor com onda `square` formata em BPM elevado via *staccato*, cortando bruscamente para injetar adrenalina de urgência nas fases normais ou nas batalhas dos chefes.

## 💾 Gerenciamento de Save
* **Salvamento Automático:** Seu progresso é salvo no `localStorage` do navegador instantaneamente a cada ação importante.
* **Progresso Offline:** Fechou o jogo? Seus heróis continuam lutando! Retorne e receba um Relatório Animado computando os acréscimos por Hermes em segundos afk.
* **Exportar/Importar Fisicamente:** Exporte seu save para um arquivo `.dat` e baixe para o seu computador, permitindo backups seguros ou a migração do seu progresso para outro navegador ou dispositivo.

## 🚀 Como Executar
Como o projeto utiliza a arquitetura de Módulos do ES6 (`import`/`export`), ele requer um servidor web local devido às políticas de segurança (CORS) dos navegadores.

1. Abra a pasta do projeto no VS Code (ou na sua IDE favorita).
2. Utilize uma extensão como **Live Server** (VS Code) para hospedar a pasta localmente.
3. O jogo será aberto no seu navegador através do arquivo `index.html`.

## 🛠️ Tecnologias Utilizadas
* **JavaScript Vanilla (ES6+)** - Lógica, Física, Motor de Combate.
* **HTML5 Canvas API Context 2D** - Renderização gráfica e animações procedurais.
* **Web Audio API** - Síntese sonora algorítmica.
* **CSS3** - Interface de Usuário (HUD), Layout Flexbox/Grid e Responsividade.
