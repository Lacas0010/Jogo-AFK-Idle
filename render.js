import { jogo } from './state.js';
import { atacar } from './engine.js';

export let textosFlutuantes = [];
export let animacao = { ativa: false, frameAtual: 0, duracao: 15, critico: false, tipo: 'normal' };

let canvas;
let ctx;
let particulasFogo = [];
let particulasExplosao = [];
let particulasSangue = [];
let tempoAnimacao = 0;

let cicloTempo = 0; // Cronômetro geral para o céu
let noitesPassadas = 0; // Para calcular a fase da Lua
let foiNoite = false; // Flag para detectar quando a noite vira dia
let nivelAnterior = null; // Rastreador de mortes
let frameMorte = 0; // Temporizador para esconder o monstro

export function mostrarNotificacao(mensagem) {
    const linhas = mensagem.split('\n').filter(l => l.trim() !== '');
    textosFlutuantes.push({
        linhas: linhas, // Passa o array completo de texto
        x: canvas.width / 2,
        y: 150,
        alpha: 1,
        duracao: 180, 
        cor: "236, 240, 241", 
        tamanho: "bold 16px sans-serif",
        isNotificacao: true // Tag especial para desenhar o fundo
    });
}

export function desenhar() {
    if (!canvas) {
        canvas = document.getElementById("jogoCanvas");
        if (canvas) ctx = canvas.getContext("2d");
    }
    if (!ctx) {
        requestAnimationFrame(desenhar);
        return;
    }

    // SISTEMA DE MORTE E FEEDBACK VISUAL
    if (nivelAnterior === null) nivelAnterior = jogo.nivel;

    if (nivelAnterior !== jogo.nivel) {
        frameMorte = 15; // Esconde o monstro por 15 frames (~0.25s) para dar a sensação de morte
        const isPantanoAtual = Math.floor((nivelAnterior - 1) / 15) % 2 === 1;
        const isBossAtual = nivelAnterior % 5 === 0;
        let corMorte = isPantanoAtual ? (isBossAtual ? "#1e8449" : "rgba(142, 68, 173, 0.8)") : (isBossAtual ? "#196f3d" : "#27ae60");
        
        for (let i = 0; i < 40; i++) { // Explosão enorme de sangue/lodo
            particulasSangue.push({
                x: 400 + (Math.random() - 0.5) * 80,
                y: 150 + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16 - 4,
                tamanho: 6 + Math.random() * 10,
                alpha: 1.2,
                cor: corMorte,
                gravidade: 0.4
            });
        }
        nivelAnterior = jogo.nivel;
    }

    tempoAnimacao += 0.05;
    const escalaBreathe = 1 + Math.sin(tempoAnimacao * 2) * 0.02;
    const flutuarMonstro = Math.sin(tempoAnimacao * 1.5) * 5;

    // PROGRESSÃO DO TEMPO, SOL E LUA
    cicloTempo += 0.00175; // Aproximadamente 60 segundos por ciclo (60 fps)
    const angulo = cicloTempo;
    
    const solX = canvas.width / 2 + Math.cos(angulo) * 380;
    const solY = 180 + Math.sin(angulo) * 150;
    
    const luaX = canvas.width / 2 + Math.cos(angulo + Math.PI) * 380;
    const luaY = 180 + Math.sin(angulo + Math.PI) * 150;

    if (luaY < 180) foiNoite = true;
    else if (luaY >= 180 && foiNoite) {
        foiNoite = false;
        noitesPassadas++;
    }
    const faseLua = noitesPassadas % 4; // 0: Cheia, 1: Minguante, 2: Nova, 3: Crescente

    const marcoAtaque = animacao.duracao / 3; // Dinâmico (5 p/ ataque normal, 15 p/ a Elfa)

    const skillFogo = jogo.herois[0].skills?.find(s => s.nome === "🔥 Lâmina Incandescente");
    const skillMago = jogo.herois[2]?.skills?.find(s => s.nome === "🔮 Comet Azur");
    const skillCavaleiro = jogo.herois[3]?.skills?.find(s => s.nome === "⚙️ Baluarte Vetorial");

    // Gera as partículas de labaredas se a habilidade estiver ativa
    if (skillFogo && skillFogo.ativa) {
        for (let i = 0; i < 2; i++) { // Cria 2 partículas por frame
            const coresFogo = ["#e74c3c", "#e67e22", "#f1c40f"]; // Vermelho, Laranja, Amarelo
            particulasFogo.push({
                x: -6 + Math.random() * 12, // Largura local da lâmina
                y: -86 + Math.random() * 82, // Altura local da lâmina (ajustado para a ponta)
                vx: (Math.random() - 0.5) * 2, // Velocidade X lateral caótica
                vy: -Math.random() * 2 - 1,    // Velocidade Y sempre para cima
                tamanho: 3 + Math.random() * 4,
                alpha: 1,
                cor: coresFogo[Math.floor(Math.random() * coresFogo.length)]
            });
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (animacao.ativa) {
        animacao.frameAtual++;
        if (animacao.frameAtual >= animacao.duracao) animacao.ativa = false;
    }

    // COR DO CÉU DINÂMICA (Linear Gradient)
    let gradientCeu = ctx.createLinearGradient(0, 0, 0, 180);
    if (solY < 140) { // Dia alto
        gradientCeu.addColorStop(0, "#4a90e2");
        gradientCeu.addColorStop(1, "#87ceeb");
    } else if (solY >= 140 && solY < 180) { // Pôr do sol / Amanhecer
        gradientCeu.addColorStop(0, "#2c3e50");
        gradientCeu.addColorStop(1, "#e74c3c");
    } else { // Noite / Madrugada
        gradientCeu.addColorStop(0, "#010a15");
        gradientCeu.addColorStop(1, "#0b1d3a");
    }
    ctx.fillStyle = gradientCeu;
    ctx.fillRect(0, 0, canvas.width, 180);

    // DESENHO DO SOL
    if (solY < 210) {
        ctx.fillStyle = "#FFD700"; 
        ctx.beginPath(); ctx.arc(solX, solY, 25, 0, Math.PI * 2); ctx.fill();
    }

    // DESENHO DA LUA (Com as 4 Fases)
    if (luaY < 210) {
        ctx.beginPath(); ctx.arc(luaX, luaY, 20, 0, Math.PI * 2);
        if (faseLua === 0) { // Lua Cheia
            ctx.fillStyle = "#ecf0f1"; ctx.fill();
        } else if (faseLua === 1) { // Lua Minguante
            ctx.fillStyle = "#ecf0f1"; ctx.fill();
            ctx.fillStyle = gradientCeu; // Sombreamento usando a própria cor do céu
            ctx.beginPath(); ctx.arc(luaX + 8, luaY, 20, 0, Math.PI * 2); ctx.fill();
        } else if (faseLua === 2) { // Lua Nova (Silhueta escura)
            ctx.fillStyle = "#111"; ctx.fill();
        } else if (faseLua === 3) { // Lua Crescente
            ctx.fillStyle = "#ecf0f1"; ctx.fill();
            ctx.fillStyle = gradientCeu; 
            ctx.beginPath(); ctx.arc(luaX - 8, luaY, 20, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(120, 50, 20, 0, Math.PI * 2); ctx.arc(150, 50, 30, 0, Math.PI * 2); ctx.arc(180, 50, 20, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(600, 80, 18, 0, Math.PI * 2); ctx.arc(630, 80, 25, 0, Math.PI * 2); ctx.arc(660, 80, 18, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#2ecc71"; 
    ctx.fillRect(0, 180, canvas.width, canvas.height - 180);

    const isPantano = Math.floor((jogo.nivel - 1) / 15) % 2 === 1;
    const balancoVento = Math.sin(cicloTempo * 4) * 0.05; // Movimento contínuo do vento

    if (!isPantano) {
        // Bioma Floresta
        ctx.fillStyle = "#2ecc71"; 
        ctx.fillRect(0, 180, canvas.width, canvas.height - 180);

        // Árvore 1 balançando
        ctx.fillStyle = "#8b4513"; 
        ctx.fillRect(40, 115, 16, 75);
        ctx.save();
        ctx.translate(48, 115);
        ctx.rotate(balancoVento);
        ctx.fillStyle = "#27ae60"; 
        ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-18, -20, 25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(17, -20, 25, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Árvore 2 balançando
        ctx.fillStyle = "#8b4513"; 
        ctx.fillRect(720, 125, 14, 65);
        ctx.save();
        ctx.translate(727, 125);
        ctx.rotate(balancoVento);
        ctx.fillStyle = "#27ae60"; 
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-17, -20, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(18, -15, 20, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#229954"; 
        const gramas = [
            [50, 220], [120, 280], [280, 210], [350, 300], [80, 320], [310, 260], [20, 270], [200, 195], 
            [60, 390], [180, 410], [320, 380], [260, 420], [450, 200], [520, 270], [600, 215], [710, 310], 
            [550, 390], [680, 410], [750, 350], [410, 250]];
        gramas.forEach(g => {
            const ventoGrama = Math.sin(cicloTempo * 4 + g[0] * 0.01) * 3;
            ctx.beginPath();
            ctx.moveTo(g[0], g[1]); // Base esquerda fica fixa
            ctx.lineTo(g[0] - 4 + ventoGrama, g[1] - 8); // Ponta esquerda balança com o vento
            ctx.lineTo(g[0] + 2 + (ventoGrama * 0.2), g[1] - 2); // Meio da grama dobra levemente
            ctx.lineTo(g[0] + 6 + ventoGrama, g[1] - 10); // Ponta direita balança com o vento
            ctx.lineTo(g[0] + 10, g[1]); // Base direita fica fixa
            ctx.fill();
        });
    } else {
        // Bioma Pântano
        ctx.fillStyle = "#2c3e20"; // Chão lodo escuro
        ctx.fillRect(0, 180, canvas.width, canvas.height - 180);

        // Poças de água tóxica
        ctx.fillStyle = "#808000"; // Verde oliva
        ctx.beginPath(); ctx.ellipse(120, 230, 50, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(650, 310, 60, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#4b0082"; // Roxo escuro
        ctx.beginPath(); ctx.ellipse(350, 280, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(100, 370, 70, 18, 0, 0, Math.PI * 2); ctx.fill();

        // Árvores Mortas
        ctx.save();
        ctx.fillStyle = "#4a3b2c";
        ctx.strokeStyle = "#4a3b2c";
        ctx.lineCap = "round";
        ctx.lineWidth = 4;

        // Árvore Morta 1
        ctx.fillRect(40, 115, 16, 75);
        ctx.beginPath();
        ctx.moveTo(48, 115); ctx.lineTo(20, 80);
        ctx.moveTo(48, 115); ctx.lineTo(75, 85);
        ctx.moveTo(32, 95); ctx.lineTo(15, 105);
        ctx.moveTo(60, 95); ctx.lineTo(85, 110);
        ctx.stroke();

        // Árvore Morta 2
        ctx.fillRect(720, 125, 14, 65);
        ctx.beginPath();
        ctx.moveTo(727, 125); ctx.lineTo(690, 85);
        ctx.moveTo(727, 125); ctx.lineTo(765, 95);
        ctx.moveTo(710, 100); ctx.lineTo(680, 115);
        ctx.stroke();
        ctx.restore();

        // Neblina baixa
        const gradientNeblina = ctx.createLinearGradient(0, 160, 0, 260);
        gradientNeblina.addColorStop(0, "rgba(220, 220, 220, 0)");
        gradientNeblina.addColorStop(0.5, "rgba(220, 220, 220, 0.35)");
        gradientNeblina.addColorStop(1, "rgba(220, 220, 220, 0)");
        
        ctx.fillStyle = gradientNeblina;
        ctx.fillRect(0, 160, canvas.width, 100);
    }

    const isBoss = jogo.nivel % 5 === 0;
    
    ctx.save();
    if (animacao.ativa && animacao.frameAtual < marcoAtaque) { // Tremer a tela apenas no impacto inicial
        const forcaShake = animacao.critico ? 16 : 8; 
        ctx.translate((Math.random() - 0.5) * forcaShake, (Math.random() - 0.5) * forcaShake);
    }
    ctx.translate(0, flutuarMonstro); // Aplica a flutuação em tudo do monstro

    if (frameMorte > 0) {
        frameMorte--;
    } else {
        if (!isPantano) {
            if (isBoss) {
            // Machado Gigante (Arma do Chefe)
            ctx.fillStyle = "#5c3a21"; // Cabo
            ctx.fillRect(470, 70, 15, 120);
            ctx.fillStyle = "#95a5a6"; // Lâmina de ferro
            ctx.beginPath();
            ctx.moveTo(485, 90); ctx.lineTo(540, 60); ctx.lineTo(550, 110);
            ctx.lineTo(510, 130); ctx.lineTo(485, 120); ctx.fill();

            // Braços (Mais robustos que os do Goblin)
            ctx.fillStyle = "#196f3d"; // Verde escuro musculoso
            ctx.fillRect(315, 130, 25, 60); // Esquerdo
            ctx.fillRect(460, 130, 25, 60); // Direito

            // Corpo do Orc
            ctx.fillRect(340, 120, 120, 100);

            // Armadura / Calças do Orc
            ctx.fillStyle = "#2c3e50"; 
            ctx.fillRect(340, 180, 120, 40);
            ctx.fillStyle = "#f1c40f"; // Fivela do Cinto
            ctx.fillRect(390, 175, 20, 15);

            // Orelhas e Cabeça do Orc
            ctx.fillStyle = "#196f3d";
            ctx.beginPath();
            ctx.moveTo(360, 95); ctx.lineTo(325, 85); ctx.lineTo(355, 120); // Esquerda
            ctx.moveTo(440, 95); ctx.lineTo(475, 85); ctx.lineTo(445, 120); // Direita
            ctx.fill();
            ctx.beginPath(); ctx.arc(400, 95, 40, 0, Math.PI * 2); ctx.fill();

            // Olhos Furiosos e Sobrancelhas
            ctx.fillStyle = "#e74c3c"; 
            ctx.beginPath(); ctx.arc(380, 85, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(420, 85, 6, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#000"; ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(365, 75); ctx.lineTo(390, 85); // Sobrancelha Esquerda
            ctx.moveTo(435, 75); ctx.lineTo(410, 85); // Sobrancelha Direita
            ctx.stroke();

            // Boca e Presas (Dentes de Javali)
            ctx.beginPath(); ctx.moveTo(385, 115); ctx.lineTo(415, 115); ctx.stroke();
            ctx.fillStyle = "#ecf0f1"; 
            ctx.beginPath(); ctx.moveTo(385, 115); ctx.lineTo(390, 100); ctx.lineTo(395, 115); ctx.fill();
            ctx.beginPath(); ctx.moveTo(405, 115); ctx.lineTo(410, 100); ctx.lineTo(415, 115); ctx.fill();
        } else {
            // Goblin Detalhado
            
            // Arma: Clava com Espinhos
            ctx.fillStyle = "#5c3a21"; // Cabo
            ctx.fillRect(438, 140, 10, 70);
            ctx.fillStyle = "#4a2e1b"; // Cabeça da clava
            ctx.beginPath(); ctx.ellipse(443, 135, 12, 25, 0, 0, Math.PI * 2); ctx.fill();
            // Espinhos da clava
            ctx.fillStyle = "#bdc3c7";
            [[433, 125], [453, 125], [431, 140], [455, 140], [443, 110]].forEach(p => {
                ctx.beginPath(); ctx.moveTo(p[0]-3, p[1]); ctx.lineTo(p[0]+3, p[1]); ctx.lineTo(p[0], p[1]-8); ctx.fill();
            });

            // Braço Direito (Atrás da arma)
            ctx.fillStyle = "#27ae60"; 
            ctx.fillRect(425, 165, 25, 12);
            ctx.fillRect(432, 165, 12, 25);

            // Pernas e Pés
            ctx.fillStyle = "#1e8449"; // Sombra da perna
            ctx.fillRect(380, 210, 12, 20);
            ctx.fillRect(408, 210, 12, 20);
            ctx.fillStyle = "#4a3b2c"; // Sapatos de trapos
            ctx.beginPath(); ctx.ellipse(385, 228, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(415, 228, 12, 8, 0, 0, Math.PI * 2); ctx.fill();

            // Corpo/Tronco (Corcunda)
            ctx.fillStyle = "#27ae60";
            ctx.beginPath(); ctx.ellipse(400, 185, 28, 30, 0, 0, Math.PI * 2); ctx.fill();

            // Roupas: Tanga/Colete rasgado de couro
            ctx.fillStyle = "#8b4513";
            ctx.beginPath(); ctx.moveTo(375, 175); ctx.lineTo(425, 175); ctx.lineTo(415, 215); ctx.lineTo(385, 215); ctx.fill();
            // Cinto e Fivela
            ctx.fillStyle = "#2c3e50"; ctx.fillRect(372, 178, 56, 8);
            ctx.fillStyle = "#f1c40f"; ctx.fillRect(392, 176, 16, 12);
            ctx.fillStyle = "#2c3e50"; ctx.fillRect(395, 179, 10, 6);

            // Braço Esquerdo (Frente)
            ctx.fillStyle = "#27ae60"; 
            ctx.beginPath(); ctx.ellipse(365, 180, 8, 20, Math.PI/6, 0, Math.PI * 2); ctx.fill();

            // Orelhas
            ctx.fillStyle = "#27ae60";
            ctx.beginPath(); ctx.moveTo(380, 138); ctx.lineTo(330, 120); ctx.lineTo(375, 150); ctx.fill(); // Esquerda
            ctx.beginPath(); ctx.moveTo(420, 138); ctx.lineTo(470, 120); ctx.lineTo(425, 150); ctx.fill(); // Direita
            // Interior das Orelhas (Sombra)
            ctx.fillStyle = "#1e8449";
            ctx.beginPath(); ctx.moveTo(375, 138); ctx.lineTo(340, 125); ctx.lineTo(372, 145); ctx.fill();
            ctx.beginPath(); ctx.moveTo(425, 138); ctx.lineTo(460, 125); ctx.lineTo(428, 145); ctx.fill();

            // Cabeça
            ctx.fillStyle = "#27ae60";
            ctx.beginPath(); ctx.arc(400, 135, 26, 0, Math.PI * 2); ctx.fill();

            // Rosto Detalhado
            // Olhos de Fera (Amarelos com pupila vermelha)
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath(); ctx.ellipse(390, 130, 6, 4, Math.PI/8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(410, 130, 6, 4, -Math.PI/8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#e74c3c";
            ctx.beginPath(); ctx.arc(390, 130, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(410, 130, 2, 0, Math.PI * 2); ctx.fill();

            // Sobrancelhas (Bravas)
            ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(380, 122); ctx.lineTo(395, 127); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(420, 122); ctx.lineTo(405, 127); ctx.stroke();

            // Nariz adunco
            ctx.fillStyle = "#1e8449";
            ctx.beginPath(); ctx.moveTo(400, 132); ctx.lineTo(395, 144); ctx.lineTo(405, 144); ctx.fill();

            // Sorriso maléfico e torto
            ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(386, 148); ctx.quadraticCurveTo(400, 156, 414, 146); ctx.stroke();
            
            // Presas irregulares
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.moveTo(390, 150); ctx.lineTo(394, 144); ctx.lineTo(394, 152); ctx.fill();
            ctx.beginPath(); ctx.moveTo(410, 148); ctx.lineTo(406, 142); ctx.lineTo(406, 150); ctx.fill();
        }
    } else {
        if (isBoss) {
            // Hidra de 3 Cabeças Detalhada
            const t = tempoAnimacao;

            // Patas Traseiras (Escuras)
            ctx.fillStyle = "#145a32"; 
            ctx.beginPath(); ctx.ellipse(360, 185, 12, 22, -Math.PI/6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(440, 185, 12, 22, Math.PI/6, 0, Math.PI * 2); ctx.fill();

            // Patas Dianteiras
            ctx.fillStyle = "#1e8449"; 
            ctx.beginPath(); ctx.ellipse(375, 195, 15, 25, -Math.PI/8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(425, 195, 15, 25, Math.PI/8, 0, Math.PI * 2); ctx.fill();
            
            // Garras
            ctx.fillStyle = "#e74c3c";
            [367, 374, 381, 417, 424, 431].forEach(x => {
                ctx.beginPath(); ctx.moveTo(x, 215); ctx.lineTo(x + 2, 225); ctx.lineTo(x + 4, 215); ctx.fill();
            });

            // Corpo
            ctx.fillStyle = "#1e8449";
            ctx.beginPath(); ctx.ellipse(400, 160, 55, 45, 0, 0, Math.PI * 2); ctx.fill();
            
            // Barriga (Escamas do corpo)
            ctx.fillStyle = "#145a32";
            ctx.beginPath(); ctx.arc(400, 175, 25, Math.PI, 0); ctx.fill();

            // Configuração dos Pescoços Animados usando Curvas Bezier
            const offsets = [
                { base: [370, 150], ctrl1: [350 + Math.sin(t*2)*15, 120], ctrl2: [330 + Math.cos(t*1.5)*15, 90], head: [320 + Math.sin(t*2)*15, 75 + Math.cos(t*2)*10] },
                { base: [400, 140], ctrl1: [400 + Math.cos(t*1.8)*20, 110], ctrl2: [400 - Math.sin(t*2.2)*20, 80], head: [400 + Math.cos(t*1.8)*20, 60 + Math.sin(t*1.8)*10] },
                { base: [430, 150], ctrl1: [450 + Math.sin(t*2.1)*15, 120], ctrl2: [470 + Math.cos(t*1.6)*15, 90], head: [480 + Math.sin(t*2.1)*15, 75 + Math.cos(t*2.1)*10] }
            ];

            ctx.lineCap = "round";
            
            offsets.forEach((n) => {
                // Desenha a base do pescoço (Grosso)
                ctx.lineWidth = 16;
                ctx.strokeStyle = "#1e8449";
                ctx.beginPath();
                ctx.moveTo(n.base[0], n.base[1]);
                ctx.bezierCurveTo(n.ctrl1[0], n.ctrl1[1], n.ctrl2[0], n.ctrl2[1], n.head[0], n.head[1]);
                ctx.stroke();

                // Segmentos/Escamas ao longo do pescoço
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#145a32";
                for(let j = 0.15; j < 0.9; j += 0.15) {
                    const u = 1 - j;
                    const px = u*u*u*n.base[0] + 3*u*u*j*n.ctrl1[0] + 3*u*j*j*n.ctrl2[0] + j*j*j*n.head[0];
                    const py = u*u*u*n.base[1] + 3*u*u*j*n.ctrl1[1] + 3*u*j*j*n.ctrl2[1] + j*j*j*n.head[1];
                    
                    // Desenha um 'V' invertido simulando a separação do segmento
                    ctx.beginPath();
                    ctx.moveTo(px - 7, py);
                    ctx.lineTo(px, py + 6);
                    ctx.lineTo(px + 7, py);
                    ctx.stroke();
                }
            });

            // Cabeças Detalhadas
            offsets.forEach(n => {
                const cx = n.head[0];
                const cy = n.head[1];

                // Chifres Traseiros
                ctx.fillStyle = "#f1c40f"; 
                ctx.beginPath(); ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx - 18, cy - 30); ctx.lineTo(cx - 4, cy - 15); ctx.fill();
                ctx.beginPath(); ctx.moveTo(cx + 10, cy - 10); ctx.lineTo(cx + 18, cy - 30); ctx.lineTo(cx + 4, cy - 15); ctx.fill();

                // Cranio base
                ctx.fillStyle = "#145a32";
                ctx.beginPath(); ctx.arc(cx, cy - 5, 16, 0, Math.PI * 2); ctx.fill();

                // Mandíbula Inferior (Aberta levemente)
                ctx.fillStyle = "#145a32";
                ctx.beginPath();
                ctx.moveTo(cx - 10, cy + 10); ctx.lineTo(cx - 6, cy + 32); ctx.lineTo(cx + 6, cy + 32); ctx.lineTo(cx + 10, cy + 10); ctx.fill();

                // Língua de Serpente
                ctx.strokeStyle = "#8e44ad";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy + 25); ctx.lineTo(cx, cy + 38); ctx.lineTo(cx - 4, cy + 42);
                ctx.moveTo(cx, cy + 38); ctx.lineTo(cx + 4, cy + 42);
                ctx.stroke();

                // Focinho Superior
                ctx.fillStyle = "#1e8449";
                ctx.beginPath();
                ctx.moveTo(cx - 15, cy - 2); ctx.lineTo(cx - 10, cy + 22); ctx.lineTo(cx + 10, cy + 22); ctx.lineTo(cx + 15, cy - 2); ctx.fill();

                // Narinas
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.arc(cx - 4, cy + 18, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + 4, cy + 18, 1.5, 0, Math.PI * 2); ctx.fill();

                // Dentes (Cima e Baixo)
                ctx.fillStyle = "#fff";
                [-7, -2, 3, 8].forEach(dx => {
                    // Cima
                    ctx.beginPath(); ctx.moveTo(cx + dx, cy + 22); ctx.lineTo(cx + dx + 2, cy + 26); ctx.lineTo(cx + dx + 4, cy + 22); ctx.fill();
                    // Baixo
                    ctx.beginPath(); ctx.moveTo(cx + dx, cy + 32); ctx.lineTo(cx + dx + 2, cy + 28); ctx.lineTo(cx + dx + 4, cy + 32); ctx.fill();
                });

                // Olhos de Fera (Amarelos com pupila fendida)
                ctx.fillStyle = "#f1c40f";
                ctx.beginPath(); ctx.ellipse(cx - 8, cy - 2, 4, 2.5, Math.PI/6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(cx + 8, cy - 2, 4, 2.5, -Math.PI/6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#000"; // Pupila fendida
                ctx.beginPath(); ctx.ellipse(cx - 8, cy - 2, 1, 2.5, Math.PI/6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(cx + 8, cy - 2, 1, 2.5, -Math.PI/6, 0, Math.PI * 2); ctx.fill();
            });
        } else {
            // Slime Gigante
            ctx.fillStyle = "rgba(142, 68, 173, 0.8)";
            ctx.beginPath(); ctx.ellipse(400, 210, 60, 45, 0, Math.PI, Math.PI * 2); ctx.fill();
            
            // Núcleo pulsante interno
            ctx.fillStyle = "#4a235a";
            ctx.beginPath(); ctx.arc(400, 185 + Math.sin(tempoAnimacao * 3) * 5, 15, 0, Math.PI * 2); ctx.fill();

            // Olhos brancos
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.ellipse(380, 190, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(420, 190, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
    }
    }
    ctx.restore();

    // EXPLOSÃO AZUL DA ELFA
    if (animacao.ativa && animacao.tipo === 'burstElfa' && animacao.frameAtual === animacao.duracao - 1) {
        const fogoAtivo = jogo.herois[0].skills?.find(s => s.nome === "🔥 Lâmina Incandescente")?.ativa;
        const numParticulas = fogoAtivo ? 45 : 30;
        const velMult = fogoAtivo ? 20 : 12;
        const cores = fogoAtivo 
            ? ["#00ffff", "#00bfff", "#e0ffff", "#87cefa", "#e67e22", "#e74c3c"] 
            : ["#00ffff", "#00bfff", "#e0ffff", "#87cefa"];
            
        for (let i = 0; i < numParticulas; i++) {
            particulasExplosao.push({
                x: 400 + (Math.random() - 0.5) * 40,
                y: 110 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * velMult,
                vy: (Math.random() - 0.5) * velMult,
                tamanho: 4 + Math.random() * 8,
                alpha: 1,
                cor: cores[Math.floor(Math.random() * cores.length)]
            });
        }
    }

    // EXPLOSÃO DE FOGO DA ESPADA (No impacto do ataque)
    if (animacao.ativa && animacao.tipo === 'normal' && animacao.frameAtual === 1 && skillFogo && skillFogo.ativa) {
        for (let i = 0; i < 25; i++) {
            particulasExplosao.push({
                x: 400 + (Math.random() - 0.5) * 50,
                y: 130 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14,
                tamanho: 3 + Math.random() * 6,
                alpha: 1,
                cor: ["#e74c3c", "#e67e22", "#f1c40f", "#ffffff"][Math.floor(Math.random() * 4)]
            });
        }
    }

    // IMPACTO MAGO (Gera partículas de cubos rodando)
    if (animacao.ativa && animacao.tipo === 'passivoMago' && animacao.frameAtual === 1) {
        for (let i = 0; i < 15; i++) {
            particulasExplosao.push({
                x: 400 + (Math.random() - 0.5) * 60,
                y: 120 + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                tamanho: 6 + Math.random() * 6,
                alpha: 1,
                cor: ["#9b59b6", "#8e44ad", "#3498db"][Math.floor(Math.random() * 3)],
                tipo: "cubo",
                rotacao: Math.random() * Math.PI,
                vRotacao: (Math.random() - 0.5) * 0.5
            });
        }
    }

    // IMPACTO CAVALEIRO (Gera partículas de impacto prateado)
    if (animacao.ativa && animacao.tipo === 'passivoCavaleiro' && animacao.frameAtual === 1) {
        for (let i = 0; i < 20; i++) {
            particulasExplosao.push({
                x: 400 + (Math.random() - 0.5) * 80,
                y: 120 + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                tamanho: 3 + Math.random() * 5,
                alpha: 1,
                cor: ["#7f8c8d", "#bdc3c7", "#f39c12"][Math.floor(Math.random() * 3)],
                tipo: "faisca"
            });
        }
    }

    // GERADOR DE SANGUE GEOMÉTRICO (No impacto do ataque geral)
    if (animacao.ativa && animacao.frameAtual === 1) {
        let corSangue = isPantano ? (isBoss ? "#7cfc00" : "#8e44ad") : (isBoss ? "#8e44ad" : "#2ecc71");
        for (let i = 0; i < 10; i++) {
            particulasSangue.push({
                x: 400 + (Math.random() - 0.5) * 40,
                y: 130 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 2, // Ligeiro impulso para cima inicial
                tamanho: 4 + Math.random() * 4,
                alpha: 1,
                cor: corSangue,
                gravidade: 0.4
            });
        }
    }

    ctx.save();
    for (let i = particulasExplosao.length - 1; i >= 0; i--) {
        let p = particulasExplosao[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        p.tamanho -= 0.1;
        if (p.rotacao !== undefined) p.rotacao += p.vRotacao; // Usado pelos cubos
        
        if (p.alpha <= 0 || p.tamanho <= 0) {
            particulasExplosao.splice(i, 1);
        } else {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.cor;
            if (p.tipo === "cubo") {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotacao);
                ctx.fillRect(-p.tamanho/2, -p.tamanho/2, p.tamanho, p.tamanho);
                ctx.restore();
            } else if (p.tipo === "faisca") {
                ctx.fillRect(p.x, p.y, p.tamanho, p.tamanho / 2);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // RENDERIZAÇÃO DO SANGUE COM GRAVIDADE
    for (let i = particulasSangue.length - 1; i >= 0; i--) {
        let p = particulasSangue[i];
        p.x += p.vx;
        p.vy += p.gravidade; // Física
        p.y += p.vy;
        p.alpha -= 0.02;
        
        if (p.alpha <= 0 || p.y > canvas.height) {
            particulasSangue.splice(i, 1);
        } else {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.cor;
            ctx.fillRect(p.x, p.y, p.tamanho, p.tamanho); // Partículas quadradas (geométricas)
        }
    }
    ctx.restore();

    const offsetYHeroi = 75 * (1 - escalaBreathe);

    const numHerois = jogo.timeAtivo.length;
    let posicoesX = [];
    if (numHerois === 1) posicoesX = [420];
    else if (numHerois === 2) posicoesX = [310, 490];
    else if (numHerois === 3) posicoesX = [260, 420, 560];

    const buffCavaleiroAtivo = skillCavaleiro && skillCavaleiro.ativa && jogo.timeAtivo.includes(3);

    jogo.timeAtivo.forEach((heroiIndex, i) => {
        const baseX = posicoesX[i];

        const isMaxStar = jogo.herois[heroiIndex].estrelas >= 5;

        if (isMaxStar) {
            ctx.save();
            if (heroiIndex === 0) {
                // Guerreiro: Círculos solares dourados pulsantes
                ctx.strokeStyle = `rgba(241, 196, 15, ${0.3 + Math.sin(tempoAnimacao * 5) * 0.2})`;
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(baseX + 30, 320 + offsetYHeroi, 55 + Math.sin(tempoAnimacao * 3) * 5, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(baseX + 30, 320 + offsetYHeroi, 40 - Math.sin(tempoAnimacao * 3) * 5, 0, Math.PI * 2); ctx.stroke();
            } else if (heroiIndex === 1) {
                // Elfa: Folhas/Triângulos orbitando
                ctx.fillStyle = "#2ecc71";
                for (let f = 0; f < 3; f++) {
                    let anguloOrbita = tempoAnimacao * 2 + (f * (Math.PI * 2 / 3));
                    let orbX = baseX + 20 + Math.cos(anguloOrbita) * 45;
                    let orbY = 320 + offsetYHeroi + Math.sin(anguloOrbita) * 20;
                    ctx.beginPath(); ctx.moveTo(orbX, orbY - 5); ctx.lineTo(orbX - 4, orbY + 4); ctx.lineTo(orbX + 4, orbY + 4); ctx.fill();
                }
            } else if (heroiIndex === 2) {
                // Mago: Grande losango mágico girando lentamente
                ctx.translate(baseX + 25, 310 + offsetYHeroi);
                ctx.rotate(tempoAnimacao);
                ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
                ctx.lineWidth = 3;
                ctx.strokeRect(-35, -35, 70, 70);
                ctx.translate(-(baseX + 25), -(310 + offsetYHeroi)); // Desfaz a translação
            } else if (heroiIndex === 3) {
                // Cavaleiro: Escudos hexagonais flutuando nas laterais
                ctx.fillStyle = "rgba(189, 195, 199, 0.5)";
                let flutuoEscudo = Math.sin(tempoAnimacao * 4) * 10;
                ctx.fillRect(baseX - 25, 290 + offsetYHeroi + flutuoEscudo, 10, 30);
                ctx.fillRect(baseX + 65, 290 + offsetYHeroi - flutuoEscudo, 10, 30);
            }
            ctx.restore();
        }

        // Barreira Dourada do Cavaleiro ao redor de todos os heróis escalados
        if (buffCavaleiroAtivo) {
            ctx.save();
            ctx.strokeStyle = `rgba(241, 196, 15, ${0.4 + Math.sin(tempoAnimacao * 5) * 0.4})`; // Dourado pulsante
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(baseX + 25, 310 + offsetYHeroi, 50, 75, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(241, 196, 15, 0.15)`;
            ctx.fill();
            ctx.restore();
        }

        if (heroiIndex === 0) {
            ctx.save();
            ctx.translate(baseX + 68, 329); 
            if (animacao.ativa) {
                ctx.beginPath();
                ctx.arc(0, 0, 88, -Math.PI / 2, -Math.PI / 2 + (Math.PI / 4), false);
                if (skillFogo && skillFogo.ativa) {
                    ctx.strokeStyle = `rgba(230, 126, 34, ${1 - (animacao.frameAtual / animacao.duracao)})`;
                } else {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${1 - (animacao.frameAtual / animacao.duracao)})`;
                }
                ctx.lineWidth = 4;
                ctx.lineCap = "round";
                ctx.stroke();
                const angulo = Math.sin((animacao.frameAtual / animacao.duracao) * Math.PI) * (Math.PI / 4);
                ctx.rotate(angulo);
            }
            // Lâmina
            ctx.fillStyle = (skillFogo && skillFogo.ativa) ? "#e74c3c" : "#bdc3c7"; 
            ctx.fillRect(-6, -74, 12, 70); 
            // Ponta da lâmina (Triângulo)
            ctx.beginPath();
            ctx.moveTo(-6, -74);
            ctx.lineTo(0, -88); // Bico da espada
            ctx.lineTo(6, -74);
            ctx.fill();
            // Guarda da espada
            ctx.fillStyle = "#f39c12";
            ctx.fillRect(-20, -8, 40, 6); 
            // Cabo e Pomo
            ctx.fillStyle = "#8b4513";
            ctx.fillRect(-4, -2, 8, 15);
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath(); ctx.arc(0, 15, 5, 0, Math.PI*2); ctx.fill();

            for (let j = particulasFogo.length - 1; j >= 0; j--) {
                let p = particulasFogo[j];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.02;     
                p.tamanho -= 0.05;   

                if (p.alpha <= 0 || p.tamanho <= 0) {
                    particulasFogo.splice(j, 1);
                } else {
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.fillStyle = p.cor;
                    ctx.fillRect(p.x, p.y, p.tamanho, p.tamanho);
                }
            }
            ctx.globalAlpha = 1; 
            ctx.restore(); 

            // Túnica base
            ctx.fillStyle = `hsl(200, 100%, ${Math.min(40 + jogo.herois[0].dps * 5, 80)}%)`;
            ctx.fillRect(baseX, 300 + offsetYHeroi, 60, 75 * escalaBreathe);
            
            // Armadura de Placas (Peitoral e Ombreiras)
            ctx.fillStyle = "#bdc3c7";
            ctx.fillRect(baseX + 5, 305 + offsetYHeroi, 50, 35 * escalaBreathe);
            ctx.beginPath(); ctx.arc(baseX + 5, 310 + offsetYHeroi, 12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(baseX + 55, 310 + offsetYHeroi, 12, 0, Math.PI * 2); ctx.fill();
            
            // Botas de metal
            ctx.fillStyle = "#7f8c8d";
            ctx.fillRect(baseX, 355 + offsetYHeroi, 25, 20 * escalaBreathe);
            ctx.fillRect(baseX + 35, 355 + offsetYHeroi, 25, 20 * escalaBreathe);

            // Capa vermelha nas costas (Por cima da armadura)
            ctx.fillStyle = "#c0392b";
            ctx.beginPath();
            ctx.moveTo(baseX + 10, 305 + offsetYHeroi);
            ctx.lineTo(baseX - 15, 380 + offsetYHeroi);
            ctx.lineTo(baseX + 75, 380 + offsetYHeroi);
            ctx.lineTo(baseX + 50, 305 + offsetYHeroi);
            ctx.fill();

            // Cabelo volumoso laranja (Visto de trás, cobrindo a nuca)
            ctx.fillStyle = "#d35400";
            ctx.beginPath(); ctx.arc(baseX + 30, 280 + offsetYHeroi, 23, 0, Math.PI * 2); ctx.fill(); 
            ctx.beginPath(); ctx.arc(baseX + 15, 270 + offsetYHeroi, 12, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(baseX + 25, 260 + offsetYHeroi, 14, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(baseX + 38, 262 + offsetYHeroi, 12, 0, Math.PI*2); ctx.fill();
        } 
        else if (heroiIndex === 1) {
            // Corpo e Túnica Verde
            ctx.fillStyle = "#1abc9c"; 
            ctx.fillRect(baseX, 300 + offsetYHeroi, 40, 75 * escalaBreathe);
            
            // Aljava nas costas
            ctx.fillStyle = "#8b4513"; 
            ctx.fillRect(baseX + 5, 310 + offsetYHeroi, 30, 40); 
            ctx.fillStyle = "#ecf0f1";
            ctx.beginPath(); ctx.moveTo(baseX + 10, 310 + offsetYHeroi); ctx.lineTo(baseX + 5, 295 + offsetYHeroi); ctx.lineTo(baseX + 15, 300 + offsetYHeroi); ctx.fill();
            ctx.beginPath(); ctx.moveTo(baseX + 25, 310 + offsetYHeroi); ctx.lineTo(baseX + 25, 290 + offsetYHeroi); ctx.lineTo(baseX + 35, 300 + offsetYHeroi); ctx.fill();

            // Cinto marrom
            ctx.fillStyle = "#8b4513"; 
            ctx.fillRect(baseX, 345 + offsetYHeroi, 40, 8); 

            // Orelhas pontudas
            ctx.fillStyle = "#ffcc99";
            ctx.beginPath();
            ctx.moveTo(baseX + 5, 280 + offsetYHeroi); ctx.lineTo(baseX - 15, 270 + offsetYHeroi); ctx.lineTo(baseX + 2, 287 + offsetYHeroi); 
            ctx.moveTo(baseX + 35, 280 + offsetYHeroi); ctx.lineTo(baseX + 55, 270 + offsetYHeroi); ctx.lineTo(baseX + 38, 287 + offsetYHeroi); 
            ctx.fill();
            
            // Cabelo caindo nas costas
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath(); ctx.arc(baseX + 20, 280 + offsetYHeroi, 21, 0, Math.PI * 2); ctx.fill(); 
            ctx.fillRect(baseX + 5, 280 + offsetYHeroi, 30, 50); 
            
            ctx.save();
            const origemX = baseX + 50;
            const origemY = 315 + offsetYHeroi;
            ctx.translate(origemX, origemY); 
            
            const alvoX = 400;
            const alvoY = 130 + flutuarMonstro;
            const dx = alvoX - origemX;
            const dy = alvoY - origemY;
            ctx.rotate(Math.atan2(dy, dx));
            if (animacao.ativa && animacao.frameAtual < marcoAtaque) ctx.translate(-5, 0);
            
            const skillElfaAtiva = animacao.ativa && animacao.tipo === 'burstElfa' && jogo.herois[1]?.skills?.some(s => s.nome === "🏹 Rajada de Glifos");

            ctx.strokeStyle = skillElfaAtiva ? "#00ffff" : "#f39c12"; 
            ctx.lineWidth = skillElfaAtiva ? 8 : 4;
            ctx.beginPath(); 
            ctx.arc(10, 0, skillElfaAtiva ? 60 : 25, -Math.PI/2 + 0.2, Math.PI/2 - 0.2); 
            ctx.stroke();
            
            const cordaY = skillElfaAtiva ? 58 : 24; 
            
            // Pontas decorativas em dourado no arco
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath(); ctx.arc(10, -cordaY, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, cordaY, 4, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(10, -cordaY);
            const cordaX = (animacao.ativa && animacao.frameAtual >= marcoAtaque) ? 10 : (skillElfaAtiva ? -15 : 0); 
            ctx.lineTo(cordaX, 0); ctx.lineTo(10, cordaY); ctx.stroke();
            
            if (!animacao.ativa || animacao.frameAtual < marcoAtaque) {
                ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 3; ctx.beginPath();
                ctx.moveTo(cordaX, 0); ctx.lineTo(35, 0); ctx.stroke();
            } else {
                const progressoVoo = (animacao.frameAtual - marcoAtaque) / (animacao.duracao - marcoAtaque);
                const distanciaTotal = Math.sqrt(dx * dx + dy * dy);
                const distanciaVoo = progressoVoo * distanciaTotal;
                
                if (skillElfaAtiva) {
                    ctx.strokeStyle = "#00ffff"; 
                    ctx.lineWidth = 4;
                    [-15, -5, 5, 15].forEach(yOffset => {
                        ctx.beginPath();
                        ctx.moveTo(distanciaVoo, yOffset);
                        ctx.lineTo(distanciaVoo + 35, yOffset);
                        ctx.stroke();
                    });
                } else {
                    ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 3; ctx.beginPath();
                    ctx.moveTo(distanciaVoo, 0); ctx.lineTo(distanciaVoo + 35, 0); ctx.stroke();
                }
            }
            ctx.restore();
        }
        else if (heroiIndex === 2) {
            // Corpo e Túnica
            ctx.fillStyle = "#9b59b6"; 
            ctx.fillRect(baseX, 300 + offsetYHeroi, 50, 75 * escalaBreathe);
            
            // Detalhe nas costas
            ctx.fillStyle = "#8e44ad";
            ctx.fillRect(baseX + 15, 300 + offsetYHeroi, 20, 75 * escalaBreathe);

            // Cabelo branco cobrindo a nuca
            ctx.fillStyle = "#ecf0f1";
            ctx.beginPath(); ctx.arc(baseX + 25, 280 + offsetYHeroi, 20, 0, Math.PI * 2); ctx.fill();
            
            // Chapéu cônico azul escuro (Inclinado para frente/reto, visto de trás)
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(baseX - 10, 265 + offsetYHeroi, 70, 10); // Aba
            ctx.beginPath();
            ctx.moveTo(baseX + 5, 265 + offsetYHeroi);
            ctx.lineTo(baseX + 45, 265 + offsetYHeroi);
            ctx.lineTo(baseX + 25, 185 + offsetYHeroi); // Ponta
            ctx.fill();
            
            // Cajado roxo
            ctx.fillStyle = "#8e44ad";
            ctx.fillRect(baseX + 40, 290 + offsetYHeroi, 8, 90);

            // Pequenas faíscas azuis estáticas soltas do cajado/mãos
            ctx.fillStyle = "#00ffff";
            ctx.fillRect(baseX + 35 + Math.random()*15, 285 + offsetYHeroi + Math.random()*20, 2, 2);
            ctx.fillRect(baseX + 35 + Math.random()*15, 285 + offsetYHeroi + Math.random()*20, 2, 2);

            // Animação do Ataque Básico: Esferas ciano brilhantes
            if (animacao.ativa && animacao.tipo === 'passivoMago') {
                const progresso = animacao.frameAtual / animacao.duracao;
                const esferaX = baseX + 44 + (400 - (baseX + 44)) * progresso;
                const esferaY = 290 + offsetYHeroi + (130 - (290 + offsetYHeroi)) * progresso;
                
                ctx.save();
                ctx.fillStyle = "#00ffff";
                ctx.beginPath(); ctx.arc(esferaX, esferaY, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "rgba(0, 255, 255, 0.4)";
                ctx.beginPath(); ctx.arc(esferaX, esferaY, 16, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            // Skill: 🔮 Comet Azur (Raio Colossal Contínuo)
            if (skillMago && skillMago.ativa) {
                const raioX = baseX + 44;
                const raioY = 290 + offsetYHeroi;
                const alvoX = 400;
                const alvoY = 130 + flutuarMonstro; // Acompanha o monstro flutuando

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(raioX, raioY);
                ctx.lineTo(alvoX, alvoY);
                ctx.strokeStyle = Math.random() > 0.5 ? "#00ffff" : "#e0ffff"; // Pisca caótico
                ctx.lineWidth = 15 + Math.random() * 10;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(raioX, raioY);
                ctx.lineTo(alvoX, alvoY);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 8 + Math.random() * 4; // Núcleo brilhante
                ctx.stroke();
                
                // Partículas caóticas do laser
                for (let j = 0; j < 3; j++) {
                    particulasExplosao.push({
                        x: raioX + (alvoX - raioX) * Math.random(),
                        y: raioY + (alvoY - raioY) * Math.random() + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        tamanho: 2 + Math.random() * 5,
                        alpha: 1,
                        cor: ["#00ffff", "#e0ffff", "#00bfff", "#ffffff"][Math.floor(Math.random() * 4)]
                    });
                }
                ctx.restore();

                // Multi-Hit no Canvas (Derretendo o Boss a ~60 frames por segundo)
                if (jogo.herois[2].dps > 0) {
                    let danoTick = jogo.herois[2].dps * (skillMago.multiplicadorDanoMultiHit || 3);
                    
                    // Considera também os multiplicadores providos pelo Cavaleiro
                    let buffPassivo = 1.0;
                    let buffAtivo = 1.0;
                    if (jogo.timeAtivo.includes(3) && jogo.herois[3]) {
                        buffPassivo = 1.15;
                        if (jogo.herois[3].skills && jogo.herois[3].skills[0] && jogo.herois[3].skills[0].ativa) {
                            buffAtivo = 1.5;
                        }
                    }
                    danoTick *= buffPassivo * buffAtivo;
                    
                    let isCrit = Math.random() < jogo.herois[2].chanceCritico;
                    
                    // Chama a engine diretamente com um "tipo" exclusivo
                    // Isso cria o caos visual de números vermelhos saltando de forma desenfreada na tela!
                    atacar(danoTick, isCrit, 10, 'multiHitCometAzur'); 
                }
            }
        }
        else if (heroiIndex === 3) {
            // Corpo blindado metálico
            ctx.fillStyle = "#34495e"; 
            ctx.fillRect(baseX - 5, 300 + offsetYHeroi, 70, 75 * escalaBreathe);
            
            // Rebites nas costas
            ctx.fillStyle = "#111";
            ctx.beginPath(); ctx.arc(baseX, 305 + offsetYHeroi, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(baseX + 60, 305 + offsetYHeroi, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(baseX, 365 + offsetYHeroi, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(baseX + 60, 365 + offsetYHeroi, 2, 0, Math.PI*2); ctx.fill();

            // Elmo (Visto de trás, sem fresta)
            ctx.fillStyle = "#7f8c8d";
            ctx.fillRect(baseX + 10, 255 + offsetYHeroi, 40, 45);
            ctx.beginPath(); ctx.arc(baseX + 30, 255 + offsetYHeroi, 20, 0, Math.PI * 2); ctx.fill();
            
            // Escudo Quadrado do Cavaleiro com reforço em bronze
            ctx.fillStyle = "#95a5a6";
            ctx.fillRect(baseX - 25, 295 + offsetYHeroi, 40, 60);
            ctx.strokeStyle = "#8b6508"; ctx.lineWidth = 4;
            ctx.strokeRect(baseX - 25, 295 + offsetYHeroi, 40, 60);
            
            // Cruz no escudo
            ctx.fillStyle = "#cd7f32";
            ctx.fillRect(baseX - 10, 305 + offsetYHeroi, 10, 40);
            ctx.fillRect(baseX - 20, 320 + offsetYHeroi, 30, 10);
            
            // Lança/Arma Secundária
            ctx.fillStyle = "#bdc3c7";
            ctx.fillRect(baseX + 55, 280 + offsetYHeroi, 12, 100);
        }
    });

    ctx.font = "bold 14px sans-serif";
    const textoNivel = isBoss ? `Nível ${jogo.nivel} (CHEFE)` : `Nível ${jogo.nivel}`;
    ctx.lineWidth = 3; ctx.strokeStyle = "#000";
    ctx.strokeText(textoNivel, 400 - (ctx.measureText(textoNivel).width / 2), 25);
    ctx.fillStyle = "#fff";
    ctx.fillText(textoNivel, 400 - (ctx.measureText(textoNivel).width / 2), 25);

    ctx.fillStyle = "#333"; ctx.fillRect(250, 40, 300, 12);
    ctx.fillStyle = isBoss ? "#8e44ad" : "#e74c3c"; 
    const hpPercent = Math.max(0, jogo.monstroHp / jogo.monstroHpMax);
    ctx.fillRect(250, 40, 300 * hpPercent, 12);

    for (let i = textosFlutuantes.length - 1; i >= 0; i--) {
        let flutuante = textosFlutuantes[i];
        ctx.font = flutuante.tamanho || "bold 18px sans-serif";
        
        if (flutuante.isNotificacao && flutuante.linhas) {
            ctx.textAlign = "center";
            
            // Mede a largura da maior linha para definir o tamanho da caixa
            let maxWidth = 0;
            flutuante.linhas.forEach(linha => {
                let largura = ctx.measureText(linha).width;
                if (largura > maxWidth) maxWidth = largura;
            });
            
            const espacamento = 25;
            const boxWidth = maxWidth + 40; // 20px de padding de cada lado
            const boxHeight = (flutuante.linhas.length * espacamento) + 15;
            const boxX = flutuante.x - (boxWidth / 2);
            const boxY = flutuante.y - 20;
            
            // Fundo da notificação (Preto com no máximo 80% de opacidade)
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(flutuante.alpha, 0.8)})`;
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            
            // Borda roxa da notificação
            ctx.strokeStyle = `rgba(155, 89, 182, ${flutuante.alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

            // Textos da notificação
            ctx.fillStyle = `rgba(${flutuante.cor}, ${flutuante.alpha})`;
            flutuante.linhas.forEach((linha, index) => {
                ctx.fillText(linha, flutuante.x, flutuante.y + (index * espacamento));
            });
            
            ctx.textAlign = "start"; // Volta pro alinhamento padrão do canvas
        } else {
            // Renderização padrão para os outros textos (ex: dano de clique)
            ctx.fillStyle = `rgba(${flutuante.cor}, ${flutuante.alpha})`; 
            if (flutuante.centralizado) ctx.textAlign = "center";
            ctx.fillText(flutuante.texto, flutuante.x, flutuante.y);
            if (flutuante.centralizado) ctx.textAlign = "start";
        }

        flutuante.y -= 0.6; 
        flutuante.alpha -= 1 / flutuante.duracao; 
        if (flutuante.alpha <= 0) textosFlutuantes.splice(i, 1);
    }

    requestAnimationFrame(desenhar);
}

export function desenharPortrait(canvasId, heroiIndex) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = 45;
    const cy = 50;

    if (heroiIndex === 0) {
        // Guerreiro
        // Armadura
        ctx.fillStyle = "#bdc3c7";
        ctx.fillRect(cx - 30, cy + 20, 60, 30);
        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath(); ctx.arc(cx - 20, cy + 30, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 20, cy + 30, 10, 0, Math.PI * 2); ctx.fill();
        
        // Rosto
        ctx.fillStyle = "#ffcc99";
        ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.fill();
        
        // Olhos
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(cx - 8, cy - 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, cy - 5, 4, 0, Math.PI * 2); ctx.fill();

        // Cabelo Laranja Espetado
        ctx.fillStyle = "#d35400";
        ctx.beginPath(); ctx.arc(cx, cy - 5, 27, Math.PI, 0); ctx.fill(); 
        ctx.beginPath(); ctx.arc(cx - 20, cy - 15, 15, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy - 25, 18, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 15, cy - 20, 15, 0, Math.PI*2); ctx.fill();
    } else if (heroiIndex === 1) {
        // Elfa
        // Roupa/Couro
        ctx.fillStyle = "#1abc9c"; 
        ctx.fillRect(cx - 25, cy + 20, 50, 30);
        ctx.fillStyle = "#a0522d"; 
        ctx.fillRect(cx - 20, cy + 20, 10, 30); 
        ctx.fillRect(cx + 10, cy + 20, 10, 30);

        // Orelhas pontudas
        ctx.fillStyle = "#ffcc99";
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy); ctx.lineTo(cx - 40, cy - 15); ctx.lineTo(cx - 20, cy + 10); ctx.fill();
        ctx.moveTo(cx + 15, cy); ctx.lineTo(cx + 40, cy - 15); ctx.lineTo(cx + 20, cy + 10); ctx.fill();

        // Rosto
        ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();

        // Olhos Expressivos (Verdes)
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath(); ctx.ellipse(cx - 8, cy - 2, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 8, cy - 2, 4, 6, 0, 0, Math.PI * 2); ctx.fill();

        // Cabelo
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath(); ctx.arc(cx, cy, 23, Math.PI, 0); ctx.fill(); 
        ctx.beginPath(); ctx.moveTo(cx - 22, cy); ctx.lineTo(cx - 10, cy + 15); ctx.lineTo(cx, cy - 5); ctx.fill();
        ctx.fillRect(cx - 23, cy, 12, 40);
    } else if (heroiIndex === 2) {
        // Mago
        // Túnica
        ctx.fillStyle = "#9b59b6";
        ctx.fillRect(cx - 25, cy + 20, 50, 30);

        // Rosto
        ctx.fillStyle = "#ffcc99";
        ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();

        // Olhos
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(cx - 8, cy - 5, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, cy - 5, 4, 0, Math.PI*2); ctx.fill();

        // Barba branca
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath(); 
        ctx.moveTo(cx - 22, cy + 5); 
        ctx.lineTo(cx + 22, cy + 5); 
        ctx.lineTo(cx, cy + 35); 
        ctx.fill();

        // Chapéu Cônico
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(cx - 35, cy - 20, 70, 8); // Aba
        ctx.beginPath();
        ctx.moveTo(cx - 25, cy - 20);
        ctx.lineTo(cx + 25, cy - 20);
        ctx.lineTo(cx, cy - 80);
        ctx.fill();
        
        // Joia do chapéu
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(cx - 4, cy - 65, 8, 8);
    } else if (heroiIndex === 3) {
        // Cavaleiro
        // Armadura Base
        ctx.fillStyle = "#34495e"; 
        ctx.fillRect(cx - 35, cy - 25, 70, 65);
        
        // Rebites
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(cx - 25, cy - 15, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 25, cy - 15, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx - 25, cy + 25, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 25, cy + 25, 3, 0, Math.PI*2); ctx.fill();

        // Fresta de visão
        ctx.fillStyle = "#111"; 
        ctx.fillRect(cx - 25, cy, 50, 12);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(cx - 15, cy + 2, 30, 8);
    }
}