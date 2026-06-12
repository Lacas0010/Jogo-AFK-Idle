import { jogo } from './state.js';
import { atacar } from './engine.js';

export let textosFlutuantes = [];
export let animacao = { ativa: false, frameAtual: 0, duracao: 15, critico: false, tipo: 'normal' };
export let animacaoGacha = { ativa: false, tick: 0, raridade: 'azul', heroiIndex: null, msg: "", isNovo: false };

export let efeitosJuice = { shake: 0, hitStop: 0 };

export function ativarJuice(shakeIntensidade, hitStopFrames) {
    efeitosJuice.shake = shakeIntensidade;
    efeitosJuice.hitStop = hitStopFrames;
}

let canvas;
let ctx;
let particulasFogo = [];
let particulasExplosao = [];
let particulasSangue = [];
let estrelas = [];
let tempoAnimacao = 0;
let frameCount = 0;

let cicloTempo = 0; // Cronômetro geral para o céu
let noitesPassadas = 0; // Para calcular a fase da Lua
let foiNoite = false; // Flag para detectar quando a noite vira dia
let nivelAnterior = null; // Rastreador de mortes
let frameMorte = 0; // Temporizador para esconder o monstro

export function dispararAnimacaoGacha(raridade, heroiIndex, msg, isNovo = false) {
    animacaoGacha.ativa = true;
    animacaoGacha.tick = 0;
    animacaoGacha.raridade = raridade;
    animacaoGacha.heroiIndex = heroiIndex;
    animacaoGacha.msg = msg;
    animacaoGacha.isNovo = isNovo;
}

export function mostrarNotificacao(mensagem) {
    if (!canvas) {
        canvas = document.getElementById("jogoCanvas");
        if (canvas) ctx = canvas.getContext("2d");
    }
    const centroX = 400;

    const linhas = mensagem.split('\n').filter(l => l.trim() !== '');
    textosFlutuantes.push({
        linhas: linhas, // Passa o array completo de texto
        x: centroX,
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
        if (canvas) {
            ctx = canvas.getContext("2d");
            for (let i = 0; i < 80; i++) {
                estrelas.push({
                    x: Math.random() * 800,
                    y: Math.random() * 180,
                    tamanho: Math.random() * 1.2 + 0.5,
                    fasePiscar: Math.random() * Math.PI * 2,
                    velocidadePiscar: 0.02 + Math.random() * 0.03
                });
            }
        }
    }
    if (!ctx) {
        requestAnimationFrame(desenhar);
        return;
    }

    // SISTEMA DE MORTE E FEEDBACK VISUAL
    let nivelIndicador = (jogo.frestaDesafio && jogo.frestaDesafio.ativa) ? "rift_" + jogo.frestaDesafio.andarAtual : "campanha_" + jogo.nivel;
    if (nivelAnterior === null) nivelAnterior = nivelIndicador;

    if (nivelAnterior !== nivelIndicador) {
        frameMorte = 15; // Esconde o monstro por 15 frames (~0.25s) para dar a sensação de morte
        
        let inRiftDeath = jogo.frestaDesafio && jogo.frestaDesafio.ativa;
        let isPantanoAtual = Math.floor((jogo.nivel - 1) / 15) % 3 === 1;
        let isCavernaAtual = Math.floor((jogo.nivel - 1) / 15) % 3 === 2;
        let isBossAtual = jogo.nivel % 5 === 0;

        if (inRiftDeath) {
            let andarMorto = jogo.frestaDesafio.andarAtual - 1;
            isBossAtual = andarMorto > 0 && andarMorto % 5 === 0;
            let tipo = jogo.frestaDesafio.tipoInimigo || 0;
            isPantanoAtual = tipo === 1;
            isCavernaAtual = tipo === 2;
        }

        let corMorte = isPantanoAtual ? (isBossAtual ? "#1e8449" : "rgba(142, 68, 173, 0.8)") : 
                       isCavernaAtual ? (isBossAtual ? "#900C3F" : "#a04000") : 
                       (isBossAtual ? "#196f3d" : "#27ae60");
        
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
        nivelAnterior = nivelIndicador;
    }

    tempoAnimacao += 0.05;
    frameCount++;
    const escalaBreathe = 1 + Math.sin(tempoAnimacao * 2) * 0.02;
    const flutuarMonstro = Math.sin(tempoAnimacao * 1.5) * 5;

    // PROGRESSÃO DO TEMPO, SOL E LUA
    cicloTempo += 0.00175; // Aproximadamente 60 segundos por ciclo (60 fps)
    const angulo = cicloTempo;
    
    const solX = 400 + Math.cos(angulo) * 380;
    const solY = 180 + Math.sin(angulo) * 150;
    
    const luaX = 400 + Math.cos(angulo + Math.PI) * 380;
    const luaY = 180 + Math.sin(angulo + Math.PI) * 150;

    if (luaY < 180) foiNoite = true;
    else if (luaY >= 180 && foiNoite) {
        foiNoite = false;
        noitesPassadas++;
    }
    const faseLua = noitesPassadas % 4; // 0: Cheia, 1: Minguante, 2: Nova, 3: Crescente

    const marcoAtaque = animacao.duracao / 3; // Dinâmico (5 p/ ataque normal, 15 p/ a Elfa)

    const skillFogo = jogo.herois[0].skills?.find(s => s.nome === "🔥 Lâmina Incandescente");
    const skillMago = jogo.herois[2]?.skills?.find(s => s.nome === "🔮 Torrente Prismática");
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

    // --- HIT STOP (Congelamento de Impacto) ---
    if (efeitosJuice.hitStop > 0) {
        efeitosJuice.hitStop--;
        requestAnimationFrame(desenhar);
        return; // Aborta o frame, congelando a tela perfeitamente!
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    ctx.save(); // Salva estado global
    
    // Calcula o zoom exato para caber os 800x450 lógicos na tela sem cortar nada importante
    const scale = Math.min(canvas.width / (800 * dpr), canvas.height / (450 * dpr)) * dpr;
    
    // --- INTELIGÊNCIA DE CÂMERA MOBILE ---
    let offsetY = 0;
    // Se a tela for mais alta do que larga (Modo Retrato/Mobile)
    if (window.innerHeight > window.innerWidth) {
        // Sobe a câmera 15% da altura da tela para afastar os heróis do painel de habilidades
        offsetY = -(window.innerHeight * 0.15) * dpr; 
    }
    
    // Aplica as transformações da câmera
    ctx.translate(canvas.width / 2, (canvas.height / 2) + offsetY); 

    // --- DESVIO CINEMATOGRÁFICO DO MENU INICIAL ---
    if (jogo.estado === 'menu') {
        desenharParallaxMenu(scale);
        ctx.restore(); // <--- CORREÇÃO CRÍTICA AQUI: Limpa a câmara antes do próximo frame
        requestAnimationFrame(desenhar);
        return; // Impede a engine de renderizar a interface de combate
    }

    // --- SCREEN SHAKE (Tremor de Câmera) ---
    if (efeitosJuice.shake > 0) {
        let dx = (Math.random() - 0.5) * efeitosJuice.shake;
        let dy = (Math.random() - 0.5) * efeitosJuice.shake;
        ctx.translate(dx, dy);
        efeitosJuice.shake *= 0.85; // O tremor perde força rapidamente
        if (efeitosJuice.shake < 0.5) efeitosJuice.shake = 0;
    }

    ctx.scale(scale, scale); // Aplica Zoom Responsivo
    ctx.translate(-400, -225); // Puxa de volta pra coordenada lógica central

    if (animacao.ativa) {
        animacao.frameAtual++;
        if (animacao.frameAtual >= animacao.duracao) animacao.ativa = false;
    }

    const isPantano = Math.floor((jogo.nivel - 1) / 15) % 3 === 1;
    const isCaverna = Math.floor((jogo.nivel - 1) / 15) % 3 === 2;
    const inRift = jogo.frestaDesafio && jogo.frestaDesafio.ativa;

    if (inRift) {
        // Fundo místico do Portal / Fresta Dimensional
        let riftGrad = ctx.createLinearGradient(0, -200, 0, 450);
        riftGrad.addColorStop(0, "#0b001a");
        riftGrad.addColorStop(0.5, "#2a004d");
        riftGrad.addColorStop(1, "#0a001a");
        ctx.fillStyle = riftGrad;
        ctx.fillRect(-2500, -2500, 5800, 5800);

        // Estrelas místicas flutuantes
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 100; i++) {
            let px = (i * 137 + tempoAnimacao * 10 * (i % 2 === 0 ? 1 : -1)) % 2000 - 600;
            if (px < -600) px += 2000;
            let py = (i * 93 + Math.sin(tempoAnimacao * 0.5 + i) * 30) % 500 - 50;
            let size = 0.5 + (i % 2.5);
            let alpha = 0.3 + Math.sin(tempoAnimacao * 3 + i) * 0.7;
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Chão de energia mística (Malha dimensional)
        ctx.strokeStyle = "rgba(138, 43, 226, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i = -1500; i <= 2500; i += 120) {
            ctx.moveTo(i, 180);
            ctx.lineTo(i + (i - 400) * 3, 800);
        }
        let startY = 180;
        for(let j = 0; j < 15; j++) {
            ctx.moveTo(-2500, startY);
            ctx.lineTo(2500, startY);
            startY += 10 + j * 5;
        }
        ctx.stroke();

        // Portal Gigante ao fundo
        ctx.save();
        ctx.translate(400, 60);
        ctx.rotate(tempoAnimacao * 0.2);
        let holeGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 180);
        holeGrad.addColorStop(0, "#000000");
        holeGrad.addColorStop(0.1, "#000000");
        holeGrad.addColorStop(0.5, "rgba(138, 43, 226, 0.8)");
        holeGrad.addColorStop(1, "rgba(138, 43, 226, 0)");
        ctx.fillStyle = holeGrad;
        ctx.beginPath(); ctx.arc(0, 0, 180, 0, Math.PI*2); ctx.fill();
        
        ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, 0, 120 + Math.sin(tempoAnimacao*2)*10, 120 + Math.cos(tempoAnimacao*2)*10, 0, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
    } else if (isCaverna) {
        let fogoFlicker = Math.sin(tempoAnimacao * 8) * 0.1 + Math.cos(tempoAnimacao * 13) * 0.05;

        // Fundo infinito da caverna com profundidade (Gradiente Radial)
        let caveGrad = ctx.createRadialGradient(400, 90, 100, 400, 90, 800);
        caveGrad.addColorStop(0, "#2a1520");
        caveGrad.addColorStop(1, "#0a0508");
        ctx.fillStyle = caveGrad; 
        ctx.fillRect(-2500, -2500, 5800, 5800); 

        // Texturas de pedra nas paredes (Rachaduras e desníveis)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = -100; i < 900; i += 60) {
            let startX = i;
            let startY = 20 + Math.sin(i) * 30;
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + 20, startY + 30);
            ctx.lineTo(startX + 5, startY + 60);
            ctx.lineTo(startX + 35, startY + 100);
            // Ramificações das rachaduras
            ctx.moveTo(startX + 20, startY + 30);
            ctx.lineTo(startX + 40, startY + 40);
        }
        ctx.stroke();
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        for (let i = -50; i < 900; i += 80) {
            ctx.beginPath(); ctx.ellipse(i, 80 + Math.cos(i) * 40, 55, 30, Math.sin(i), 0, Math.PI*2); ctx.fill();
        }

        // Cristais preciosos cravados nas paredes de fundo
        ctx.save();
        let crystalGlow = Math.abs(Math.sin(tempoAnimacao * 1.5));
        const cristais = [[250, 80], [550, 40], [150, 30], [700, 90], [380, 20]];
        cristais.forEach((c, idx) => {
            let cx = c[0];
            let cy = c[1] + Math.sin(tempoAnimacao + idx) * 3; // Flutuação mágica
            
            // Corpo do cristal
            ctx.fillStyle = `rgba(231, 76, 60, ${0.5 + crystalGlow * 0.3})`;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+8, cy-18); ctx.lineTo(cx+16, cy); ctx.lineTo(cx+8, cy+12); ctx.fill();
            
            // Brilho central (Luz)
            ctx.fillStyle = `rgba(255, 150, 150, ${0.7 + crystalGlow * 0.3})`;
            ctx.beginPath(); ctx.moveTo(cx+8, cy-18); ctx.lineTo(cx+12, cy-4); ctx.lineTo(cx+8, cy+12); ctx.lineTo(cx+4, cy-4); ctx.fill();
            
            // Halo de luz
            let cGlow = ctx.createRadialGradient(cx+8, cy-3, 0, cx+8, cy-3, 35);
            cGlow.addColorStop(0, `rgba(231, 76, 60, ${0.3 + crystalGlow * 0.2})`);
            cGlow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = cGlow;
            ctx.beginPath(); ctx.arc(cx+8, cy-3, 35, 0, Math.PI*2); ctx.fill();
        });
        ctx.restore();

        // Estalactites e Estalagmites (Camada 1: Fundo Escuro)
        ctx.fillStyle = "#11080b";
        for (let i = -100; i < 900; i += 80) { // Estalagmites
            ctx.beginPath(); ctx.moveTo(i, 180); ctx.lineTo(i + 25, 80 + Math.sin(i)*20); ctx.lineTo(i + 50, 180); ctx.fill();
        }
        for (let i = -50; i < 900; i += 90) { // Estalactites
            ctx.beginPath(); ctx.moveTo(i, -100); ctx.lineTo(i + 20, 60 + Math.cos(i)*30); ctx.lineTo(i + 40, -100); ctx.fill();
        }

        // Estalactites e Estalagmites (Camada 2: Frente com curvas e luz)
        ctx.fillStyle = "#1e1116";
        for (let i = -80; i < 900; i += 130) {
            ctx.beginPath(); ctx.moveTo(i, 180); ctx.quadraticCurveTo(i + 35, 120 + Math.cos(i)*20, i + 30, 40 + Math.sin(i)*30); ctx.quadraticCurveTo(i + 50, 120, i + 70, 180); ctx.fill();
        }
        for (let i = -20; i < 900; i += 140) {
            ctx.beginPath(); ctx.moveTo(i, -100); ctx.quadraticCurveTo(i + 25, -20, i + 20, 90 + Math.cos(i)*40); ctx.quadraticCurveTo(i + 50, -20, i + 60, -100); ctx.fill();
        }

        // Chão da caverna com textura orgânica na borda superior
        ctx.fillStyle = "#2a1a21";
        ctx.beginPath();
        ctx.moveTo(-2500, 180);
        for (let i = -100; i <= 900; i += 30) {
            ctx.lineTo(i, 180 + Math.sin(i * 0.1) * 4); // Borda irregular
        }
        ctx.lineTo(2500, 180);
        ctx.lineTo(2500, 4000);
        ctx.lineTo(-2500, 4000);
        ctx.fill();

        // Texturas de rachaduras no chão
        ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = -50; i < 850; i += 70) {
            let px = i + Math.sin(i) * 20;
            let py = 190 + Math.cos(i) * 10;
            ctx.moveTo(px, py);
            ctx.lineTo(px + 12, py + 15);
            ctx.lineTo(px + 8, py + 25);
            ctx.lineTo(px + 25, py + 40);
            // Ramificação
            ctx.moveTo(px + 12, py + 15);
            ctx.lineTo(px - 5, py + 20);
        }
        ctx.stroke();

        // Pedras grandes no chão
        [40, 110, 180, 250, 310, 390, 460, 520, 600, 670, 740].forEach(px => {
            // Base mais escura (Sombra)
            ctx.fillStyle = "#11080b";
            ctx.beginPath(); ctx.arc(px, 184 + Math.sin(px)*5, 12, Math.PI, 0); ctx.fill();
            ctx.beginPath(); ctx.arc(px+16, 186 + Math.cos(px)*3, 8, Math.PI, 0); ctx.fill();
            // Realce da pedra (Luz)
            ctx.fillStyle = "#3a252d";
            ctx.beginPath(); ctx.arc(px-3, 182 + Math.sin(px)*5, 7, Math.PI, 0); ctx.fill();
            ctx.beginPath(); ctx.arc(px+14, 184 + Math.cos(px)*3, 4, Math.PI, 0); ctx.fill();
        });

        // Pedrinhas menores e seixos espalhados
        for (let i = 0; i < 150; i++) {
            let px = (i * 73) % 850;
            let py = 185 + (i * 31) % 150;
            let size = 1.5 + (i % 4);
            ctx.fillStyle = (i % 2 === 0) ? "#11080b" : "#452e37"; // Varia cor escura e clara
            ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI*2); ctx.fill();
        }

        // Fagulhas e poeira flutuante
        ctx.fillStyle = `rgba(243, 156, 18, ${0.5 + fogoFlicker})`;
        for (let i = 0; i < 20; i++) {
            let px = (Math.sin(i * 123) * 400 + 400 + Math.sin(tempoAnimacao + i) * 20); 
            let py = 180 - ((tempoAnimacao * 15 + i * 45) % 180);
            ctx.beginPath(); ctx.arc(px, py, 1.2 + (i % 2), 0, Math.PI * 2); ctx.fill();
        }

        // Tochas nas paredes com iluminação dinâmica (Global Illumination fake)
        let tochas = [[120, 120], [680, 120]];
        tochas.forEach(t => {
            // Suporte de metal
            ctx.fillStyle = "#2c3e50"; ctx.fillRect(t[0]-6, t[1], 12, 4);
            // Cabo da tocha de madeira
            ctx.fillStyle = "#3e2723"; ctx.fillRect(t[0]-4, t[1], 8, 25);
            ctx.fillStyle = "#1e1116"; ctx.fillRect(t[0]+2, t[1], 2, 25); // Sombra do cabo
            
            // Fogo principal
            ctx.fillStyle = `rgba(230, 126, 34, ${0.8 + fogoFlicker})`;
            ctx.beginPath(); ctx.arc(t[0], t[1]-5, 12 + fogoFlicker*8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = `rgba(241, 196, 15, ${0.9 + fogoFlicker})`;
            ctx.beginPath(); ctx.arc(t[0], t[1]-2, 8 + fogoFlicker*4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(t[0], t[1], 4 + fogoFlicker*2, 0, Math.PI*2); ctx.fill();
            
            // Iluminação radiante intensificada
            let gradBrilho = ctx.createRadialGradient(t[0], t[1], 5, t[0], t[1], 220 + fogoFlicker*30);
            gradBrilho.addColorStop(0, `rgba(230, 126, 34, ${0.25 + fogoFlicker*0.05})`);
            gradBrilho.addColorStop(0.4, `rgba(230, 126, 34, ${0.08 + fogoFlicker*0.02})`);
            gradBrilho.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = gradBrilho;
            ctx.beginPath(); ctx.arc(t[0], t[1], 220 + fogoFlicker*30, 0, Math.PI*2); ctx.fill();
        });
    } else {
        // COR DO CÉU DINÂMICA (Linear Gradient)
        let isNoite = false;
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
            isNoite = true;
        }
        ctx.fillStyle = gradientCeu;
        ctx.fillRect(-2500, -2500, 5800, 2680); // O céu preenche todo o topo até a linha de Y=180

        // DESENHO DAS ESTRELAS (Apenas a noite)
        if (isNoite) {
            ctx.fillStyle = "#ffffff";
            estrelas.forEach(estrela => {
                estrela.fasePiscar += estrela.velocidadePiscar;
                ctx.globalAlpha = 0.2 + ((Math.sin(estrela.fasePiscar) + 1) / 2) * 0.8; // Oscila entre 0.2 e 1.0
                ctx.beginPath();
                ctx.arc(estrela.x, estrela.y, estrela.tamanho, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0; // Resetar opacidade para o resto do canvas
        }

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

        const balancoVento = Math.sin(cicloTempo * 4) * 0.05; // Movimento contínuo do vento

        if (!isPantano) {
            // Bioma Floresta
            
            // Montanhas ao fundo (Parallax)
            ctx.fillStyle = "#229954"; 
            for (let i = -1000; i < 2000; i += 300) {
                ctx.beginPath();
                ctx.arc(i + 150, 200, 180, Math.PI, 0);
                ctx.fill();
            }

            // Chão da floresta (Gradiente)
            let gradChao = ctx.createLinearGradient(0, 180, 0, 600);
            gradChao.addColorStop(0, "#2ecc71");
            gradChao.addColorStop(1, "#1e8449");
            ctx.fillStyle = gradChao; 
            ctx.fillRect(-2500, 180, 5800, 4000);

            // Nuvens macias no céu (apenas se for dia ou entardecer)
            if (!isNoite) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                for (let i = 0; i < 5; i++) {
                    let nuvemX = ((cicloTempo * 50 + i * 200) % 1200) - 200;
                    let nuvemY = 40 + (i % 3) * 30;
                    ctx.beginPath(); ctx.arc(nuvemX, nuvemY, 20, 0, Math.PI*2);
                    ctx.arc(nuvemX + 25, nuvemY - 10, 30, 0, Math.PI*2);
                    ctx.arc(nuvemX + 50, nuvemY, 25, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            // Pinheiros distantes para profundidade
            ctx.fillStyle = "#196f3d";
            for (let i = -100; i < 900; i += 120) {
                ctx.fillRect(i, 140, 6, 40); // Tronco
                ctx.beginPath(); ctx.moveTo(i-15, 150); ctx.lineTo(i+3, 100); ctx.lineTo(i+21, 150); ctx.fill();
                ctx.beginPath(); ctx.moveTo(i-20, 170); ctx.lineTo(i+3, 120); ctx.lineTo(i+26, 170); ctx.fill();
            }

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
            // Maçãs detalhadas
            ctx.fillStyle = "#e74c3c";
            [[ -10, -10 ], [ 15, -5 ], [ 0, -25 ]].forEach(pos => {
                ctx.beginPath(); ctx.arc(pos[0], pos[1], 4, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(pos[0], pos[1]-3, 2, 0, Math.PI); ctx.fill(); ctx.fillStyle = "#e74c3c";
            });
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

            // Arbustos redondos
            ctx.fillStyle = "#1e8449";
            [[-20, 190], [150, 185], [680, 195], [820, 180]].forEach(pos => {
                ctx.beginPath(); ctx.arc(pos[0], pos[1], 15, Math.PI, 0); ctx.fill();
                ctx.beginPath(); ctx.arc(pos[0]+12, pos[1]-5, 20, Math.PI, 0); ctx.fill();
                ctx.beginPath(); ctx.arc(pos[0]+25, pos[1], 15, Math.PI, 0); ctx.fill();
            });

            // Vagalumes (apenas de noite) ou Folhas caindo (de dia)
            if (isNoite) {
                for (let i = 0; i < 15; i++) {
                    let px = (Math.sin(i * 123) * 400 + 400 + Math.sin(tempoAnimacao * 0.8 + i) * 40); 
                    let py = 150 + (Math.cos(i * 88) * 60) + Math.sin(tempoAnimacao * 2.5 + i) * 20;
                    let glow = 0.5 + Math.sin(tempoAnimacao * 4 + i) * 0.5;
                    ctx.fillStyle = `rgba(241, 196, 15, ${glow})`;
                    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = `rgba(241, 196, 15, ${glow * 0.3})`;
                    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
                }
            } else {
                ctx.fillStyle = "#27ae60";
                for (let i = 0; i < 15; i++) {
                    let folhaX = ((cicloTempo * 100 + i * 150) % 1000) - 100 + Math.sin(tempoAnimacao + i)*20;
                    let folhaY = 120 + ((tempoAnimacao * 20 + i * 40) % 200);
                    ctx.save();
                    ctx.translate(folhaX, folhaY);
                    ctx.rotate(tempoAnimacao + i);
                    ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI*2); ctx.fill();
                    ctx.restore();
                }
            }

            ctx.fillStyle = "#196f3d"; 
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

            // Chão lodo com gradiente e textura suave
            let gradPantano = ctx.createLinearGradient(0, 180, 0, 600);
            gradPantano.addColorStop(0, "#2c3e20");
            gradPantano.addColorStop(1, "#162010");
            ctx.fillStyle = gradPantano;
            ctx.fillRect(-2500, 180, 5800, 4000);

            // Silhuetas de Árvores Mortas ao Fundo (Profundidade)
            ctx.strokeStyle = "rgba(44, 62, 32, 0.6)"; // Verde musgo bem escuro
            ctx.lineWidth = 8;
            ctx.lineCap = "round";
            for (let i = -100; i < 900; i += 180) {
                ctx.beginPath();
                ctx.moveTo(i, 180); ctx.lineTo(i-10, 100);
                ctx.moveTo(i-5, 140); ctx.lineTo(i-30, 110);
                ctx.moveTo(i-8, 120); ctx.lineTo(i+20, 90);
                ctx.stroke();
            }

            // Teto do Pântano: Galhos e Folhagens densas para ancorar os cipós
            ctx.save();
            // Fundo de folhagem bloqueando o topo
            ctx.fillStyle = "#0d1708";
            ctx.beginPath(); ctx.moveTo(-100, -100);
            for (let i = -100; i <= 900; i += 50) {
                ctx.lineTo(i, 10 + Math.sin(i) * 15);
            }
            ctx.lineTo(900, -100); ctx.fill();

            // Galhos grossos horizontais
            ctx.strokeStyle = "#1a120c"; ctx.lineWidth = 12; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(-100, 5); ctx.quadraticCurveTo(200, 45, 450, -5); ctx.quadraticCurveTo(700, 35, 900, 5); ctx.stroke();

            // Tufos de folhas em primeiro plano
            for (let i = -50; i < 900; i += 70) {
                ctx.fillStyle = (i % 2 === 0) ? "#16260f" : "#1e3315";
                ctx.beginPath(); ctx.ellipse(i, 5, 50 + Math.sin(i)*15, 30 + Math.cos(i)*10, 0, 0, Math.PI*2); ctx.fill();
                
                ctx.fillStyle = (i % 3 === 0) ? "#0d1708" : "#111d0b";
                ctx.beginPath(); ctx.ellipse(i + 35, 15, 35 + Math.cos(i)*20, 20 + Math.sin(i)*10, 0, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();

            // Cipós pantanosos pendurados do topo
            ctx.strokeStyle = "#1e3315";
            ctx.lineWidth = 3;
            for (let i = 20; i < 800; i += 140) {
                ctx.beginPath();
                ctx.moveTo(i, -100);
                ctx.quadraticCurveTo(i - 20 + Math.sin(tempoAnimacao + i)*10, 20, i + 10, 80 + Math.sin(i)*30);
                ctx.stroke();
                // Folhinhas/Musgo nos cipós
                ctx.fillStyle = "#27ae60";
                ctx.beginPath(); ctx.arc(i - 10 + Math.sin(tempoAnimacao + i)*5, 10, 3, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(i + 5, 50, 4, 0, Math.PI*2); ctx.fill();
            }

            // Poças de água com lodo animadas (Pulsando suavemente)
            const pocaoBreathe = Math.sin(tempoAnimacao * 2) * 2;
            
            ctx.fillStyle = "#2e7a68"; // Azul esverdeado claro
            ctx.beginPath(); 
            ctx.ellipse(110, 230, 45 + pocaoBreathe, 10 + pocaoBreathe/2, -0.1, 0, Math.PI * 2); 
            ctx.ellipse(140, 233, 30 + pocaoBreathe, 8 + pocaoBreathe/2, 0.1, 0, Math.PI * 2); 
            ctx.ellipse(125, 226, 25, 6, 0, 0, Math.PI * 2); 
            ctx.fill();

            ctx.beginPath(); 
            ctx.ellipse(630, 310, 55 + pocaoBreathe, 12, -0.05, 0, Math.PI * 2); 
            ctx.ellipse(670, 314, 45, 15 + pocaoBreathe/2, 0.1, 0, Math.PI * 2); 
            ctx.ellipse(660, 304, 30, 8, -0.1, 0, Math.PI * 2); 
            ctx.fill();

            ctx.fillStyle = "#226355"; // Azul esverdeado mais escuro
            ctx.beginPath(); 
            ctx.ellipse(340, 280, 38 + pocaoBreathe, 9, -0.1, 0, Math.PI * 2); 
            ctx.ellipse(370, 282, 25, 8, 0.2, 0, Math.PI * 2); 
            ctx.fill();

            ctx.beginPath(); 
            ctx.ellipse(90, 370, 65, 15 + pocaoBreathe, -0.05, 0, Math.PI * 2); 
            ctx.ellipse(135, 375, 45, 12, 0.15, 0, Math.PI * 2); 
            ctx.ellipse(110, 362, 40, 10, -0.1, 0, Math.PI * 2); 
            ctx.fill();

            // Bolhas tóxicas estourando nas poças
            ctx.fillStyle = "rgba(144, 238, 144, 0.6)";
            for (let i = 0; i < 10; i++) {
                let bx = [110, 130, 640, 660, 350, 100, 120, 650, 360, 620][i];
                let by = [230, 233, 310, 314, 280, 370, 375, 308, 282, 312][i];
                let bSize = ((tempoAnimacao * 6 + i * 13) % 8);
                if (bSize < 7) { // Se a bolha ainda não estourou
                    ctx.beginPath(); ctx.arc(bx, by - bSize, bSize/1.5, 0, Math.PI*2); ctx.fill();
                } else { // Efeito de estouro
                    ctx.strokeStyle = "rgba(144, 238, 144, 0.4)";
                    ctx.beginPath(); ctx.arc(bx, by - bSize, 6, 0, Math.PI*2); ctx.stroke();
                }
            }

            // Fogo Fátuo Pantanoso (Esferas verdes flutuantes)
            for (let i = 0; i < 20; i++) {
                let px = (Math.sin(i * 99) * 400 + 400 + Math.sin(tempoAnimacao * 0.5 + i) * 30); 
                let py = 180 + (Math.cos(i * 77) * 50) + Math.sin(tempoAnimacao * 2 + i) * 15;
                let glow = 0.5 + Math.sin(tempoAnimacao * 3 + i) * 0.5;
                ctx.fillStyle = `rgba(46, 204, 113, ${glow})`;
                ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(46, 204, 113, ${glow * 0.3})`;
                ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
            }

            // Árvores Mortas em Primeiro Plano
            ctx.save();
            ctx.fillStyle = "#3a2f23";
            ctx.strokeStyle = "#3a2f23";
            ctx.lineCap = "round";
            ctx.lineWidth = 6;

            // Árvore Morta 1
            ctx.fillRect(40, 115, 18, 75);
            ctx.beginPath();
            ctx.moveTo(49, 115); ctx.lineTo(15, 75);
            ctx.moveTo(49, 115); ctx.lineTo(80, 80);
            ctx.moveTo(28, 90); ctx.lineTo(10, 100);
            ctx.moveTo(65, 90); ctx.lineTo(95, 110);
            ctx.stroke();

            // Árvore Morta 2
            ctx.fillRect(720, 125, 16, 65);
            ctx.beginPath();
            ctx.moveTo(728, 125); ctx.lineTo(685, 80);
            ctx.moveTo(728, 125); ctx.lineTo(775, 90);
            ctx.moveTo(705, 95); ctx.lineTo(670, 110);
            ctx.stroke();
            ctx.restore();

            // Neblina baixa e misteriosa
            const gradientNeblina = ctx.createLinearGradient(0, 160, 0, 280);
            gradientNeblina.addColorStop(0, "rgba(220, 220, 220, 0)");
            gradientNeblina.addColorStop(0.5, `rgba(180, 220, 190, ${0.35 + Math.sin(tempoAnimacao)*0.1})`);
            gradientNeblina.addColorStop(1, "rgba(220, 220, 220, 0)");
            
            ctx.fillStyle = gradientNeblina;
            ctx.fillRect(-2500, 160, 5800, 120);
        }
    }

    let drawIsBoss = jogo.nivel % 5 === 0;
    let drawCavernaEnemy = isCaverna;
    let drawPantanoEnemy = isPantano;
    let drawForestEnemy = !isCaverna && !isPantano;

    if (inRift) {
        drawIsBoss = jogo.frestaDesafio.andarAtual % 5 === 0;
        let tipo = jogo.frestaDesafio.tipoInimigo || 0;
        drawForestEnemy = tipo === 0;
        drawPantanoEnemy = tipo === 1;
        drawCavernaEnemy = tipo === 2;
    }
    
    ctx.save();
    if (animacao.ativa && animacao.frameAtual < marcoAtaque) { // Tremer a tela apenas no impacto inicial
        const forcaShake = animacao.critico ? 16 : 8; 
        ctx.translate((Math.random() - 0.5) * forcaShake, (Math.random() - 0.5) * forcaShake);
    }
    ctx.translate(0, flutuarMonstro); // Aplica a flutuação em tudo do monstro

    if (frameMorte > 0) {
        frameMorte--;
    } else {
        if (drawCavernaEnemy) {
            if (drawIsBoss) {
                // Dragão Vermelho
                const t = tempoAnimacao;

                // Cauda grossa balançando
                ctx.fillStyle = "#900C3F";
                let tailX = 350 + Math.cos(t * 2) * 40;
                let tailY = 220 + Math.sin(t * 2) * 20;
                ctx.beginPath(); ctx.moveTo(370, 180); ctx.quadraticCurveTo(tailX, tailY, tailX - 50, tailY - 30); ctx.quadraticCurveTo(tailX + 20, tailY + 20, 390, 200); ctx.fill();

                // Asas (Batendo lentamente)
                let wingY = Math.sin(t * 3) * 30;
                ctx.fillStyle = "#641E16"; 
                ctx.beginPath(); ctx.moveTo(380, 130); ctx.quadraticCurveTo(300, 50 + wingY, 250, 80 + wingY); ctx.quadraticCurveTo(320, 120 + wingY/2, 380, 160); ctx.fill();
                ctx.beginPath(); ctx.moveTo(420, 130); ctx.quadraticCurveTo(500, 50 + wingY, 550, 80 + wingY); ctx.quadraticCurveTo(480, 120 + wingY/2, 420, 160); ctx.fill();
                ctx.strokeStyle = "#900C3F"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(380, 130); ctx.lineTo(300, 100 + wingY/1.5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(420, 130); ctx.lineTo(500, 100 + wingY/1.5); ctx.stroke();

                // Patas Traseiras
                ctx.fillStyle = "#7B241C";
                ctx.beginPath(); ctx.ellipse(365, 200, 25, 35, -Math.PI/8, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(435, 200, 25, 35, Math.PI/8, 0, Math.PI*2); ctx.fill();
                // Garras
                ctx.fillStyle = "#F1C40F";
                [345, 355, 365, 435, 445, 455].forEach(gx => {
                    ctx.beginPath(); ctx.moveTo(gx, 230); ctx.lineTo(gx-5, 240); ctx.lineTo(gx+5, 230); ctx.fill();
                });

                // Corpo
                ctx.fillStyle = "#900C3F";
                ctx.beginPath(); ctx.ellipse(400, 160, 50, 65, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#E67E22";
                ctx.beginPath(); ctx.ellipse(400, 170, 35, 50, 0, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = "#D35400"; ctx.lineWidth = 3;
                for(let i=130; i<=210; i+=15) {
                    ctx.beginPath(); ctx.moveTo(375, i); ctx.quadraticCurveTo(400, i+10, 425, i); ctx.stroke();
                }

                // Patas dianteiras
                ctx.fillStyle = "#900C3F";
                ctx.beginPath(); ctx.ellipse(350, 150, 15, 30, Math.PI/4, 0, Math.PI*2); ctx.fill(); 
                ctx.beginPath(); ctx.ellipse(450, 150, 15, 30, -Math.PI/4, 0, Math.PI*2); ctx.fill(); 
                ctx.fillStyle = "#F1C40F";
                ctx.beginPath(); ctx.moveTo(330, 165); ctx.lineTo(320, 175); ctx.lineTo(340, 170); ctx.fill();
                ctx.beginPath(); ctx.moveTo(470, 165); ctx.lineTo(480, 175); ctx.lineTo(460, 170); ctx.fill();

                // Pescoço e Cabeça
                let headY = Math.sin(t * 2) * 10;
                ctx.fillStyle = "#900C3F";
                ctx.beginPath(); ctx.moveTo(380, 110); ctx.quadraticCurveTo(400, 50 + headY, 400, 60 + headY); ctx.quadraticCurveTo(420, 100 + headY, 420, 110); ctx.fill();
                ctx.beginPath(); ctx.arc(400, 60 + headY, 25, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(385, 70 + headY); ctx.lineTo(400, 95 + headY); ctx.lineTo(415, 70 + headY); ctx.fill();

                // Chifres
                ctx.fillStyle = "#F1C40F";
                ctx.beginPath(); ctx.moveTo(385, 45 + headY); ctx.quadraticCurveTo(360, 20 + headY, 350, 10 + headY); ctx.quadraticCurveTo(370, 30 + headY, 395, 40 + headY); ctx.fill();
                ctx.beginPath(); ctx.moveTo(415, 45 + headY); ctx.quadraticCurveTo(440, 20 + headY, 450, 10 + headY); ctx.quadraticCurveTo(430, 30 + headY, 405, 40 + headY); ctx.fill();

                // Olhos
                ctx.fillStyle = "#F1C40F";
                ctx.beginPath(); ctx.ellipse(390, 60 + headY, 6, 4, -Math.PI/6, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(410, 60 + headY, 6, 4, Math.PI/6, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.arc(390, 60 + headY, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(410, 60 + headY, 2, 0, Math.PI*2); ctx.fill();

                // Narinas com fumacinha
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.arc(395, 85 + headY, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(405, 85 + headY, 2, 0, Math.PI*2); ctx.fill();

                if (Math.sin(t * 5) > 0.5) {
                    ctx.fillStyle = "rgba(200, 100, 50, 0.6)";
                    ctx.beginPath(); ctx.arc(395, 95 + headY, 5, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(405, 95 + headY, 5, 0, Math.PI*2); ctx.fill();
                }
            } else {
                // Kobold
                ctx.fillStyle = "#a04000";
                ctx.beginPath(); ctx.moveTo(390, 190); ctx.quadraticCurveTo(340, 220, 320, 180); ctx.lineTo(330, 175); ctx.quadraticCurveTo(350, 210, 390, 180); ctx.fill();

                ctx.fillStyle = "#873600";
                ctx.fillRect(380, 210, 10, 20); ctx.fillRect(410, 210, 10, 20);
                ctx.beginPath(); ctx.moveTo(380, 230); ctx.lineTo(370, 235); ctx.lineTo(390, 230); ctx.fill();
                ctx.beginPath(); ctx.moveTo(410, 230); ctx.lineTo(400, 235); ctx.lineTo(420, 230); ctx.fill();

                ctx.fillStyle = "#a04000";
                ctx.beginPath(); ctx.ellipse(400, 185, 25, 30, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#f39c12";
                ctx.beginPath(); ctx.ellipse(405, 185, 15, 25, 0, 0, Math.PI * 2); ctx.fill();

                ctx.fillStyle = "#873600";
                ctx.fillRect(385, 175, 8, 25);

                ctx.fillStyle = "#5c3a21"; ctx.fillRect(425, 160, 6, 60); 
                ctx.fillStyle = "#7f8c8d"; 
                ctx.beginPath(); ctx.moveTo(405, 170); ctx.quadraticCurveTo(428, 160, 455, 170); ctx.lineTo(450, 175); ctx.quadraticCurveTo(428, 168, 410, 175); ctx.fill(); 

                ctx.fillStyle = "#a04000";
                ctx.beginPath(); ctx.moveTo(410, 175); ctx.lineTo(430, 195); ctx.lineTo(435, 190); ctx.lineTo(415, 170); ctx.fill();

                ctx.fillStyle = "#a04000";
                ctx.beginPath(); ctx.arc(405, 145, 20, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(405, 135); ctx.lineTo(435, 145); ctx.lineTo(405, 155); ctx.fill();
                
                ctx.fillStyle = "#fff";
                ctx.beginPath(); ctx.moveTo(420, 150); ctx.lineTo(423, 155); ctx.lineTo(426, 150); ctx.fill();
                ctx.beginPath(); ctx.moveTo(412, 152); ctx.lineTo(415, 157); ctx.lineTo(418, 152); ctx.fill();

                ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.ellipse(410, 140, 5, 8, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(410, 140, 1, 6, 0, 0, Math.PI*2); ctx.fill();

                ctx.fillStyle = "#e67e22";
                ctx.beginPath(); ctx.moveTo(395, 130); ctx.lineTo(385, 115); ctx.lineTo(405, 125); ctx.fill();
            }
        } else if (drawForestEnemy) {
            if (drawIsBoss) {
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
        if (drawIsBoss) {
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
        let corSangue = drawPantanoEnemy ? (drawIsBoss ? "#7cfc00" : "#8e44ad") : 
                        drawCavernaEnemy ? (drawIsBoss ? "#FF5733" : "#d35400") : 
                        (drawIsBoss ? "#8e44ad" : "#2ecc71");
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
        
        if (p.alpha <= 0 || p.y > 450) {
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
    else if (numHerois === 2) posicoesX = [330, 480];
    else if (numHerois === 3) posicoesX = [290, 420, 520];

    const buffCavaleiroAtivo = skillCavaleiro && skillCavaleiro.ativa && jogo.timeAtivo.includes(3);

    jogo.timeAtivo.forEach((heroiIndex, i) => {
        const baseX = posicoesX[i];
        
        let x = baseX;
        let animX = x;
        let animY = 320;
        let animRotacao = 0; // Permite inclinar os heróis durante o avanço

        if (animacao.ativa && (animacao.tipo === 'normal' || animacao.tipo === 'lodoToxico')) {
            animX += Math.sin(animacao.frameAtual * 0.5) * 20;
            // Dá mais agressividade e um pequeno salto felino para a Ladra nos ataques manuais e automáticos
            if (heroiIndex === 4) {
                animX += Math.sin(animacao.frameAtual * 0.5) * 15; // Avança mais longe
                animY -= Math.sin(animacao.frameAtual * 0.5) * 15; // Salta no ar
                animRotacao = Math.sin(animacao.frameAtual * 0.5) * 0.3; // Inclina o corpo
            }
        } else if (animacao.ativa && animacao.tipo === 'burstElfa' && heroiIndex === 1) {
            animY -= Math.sin((animacao.frameAtual / animacao.duracao) * Math.PI) * 50;
        } else if (animacao.ativa && animacao.tipo === 'burstLadra' && heroiIndex === 4) {
            // Animação de Blink/Dash da Assassina
            if (animacao.frameAtual < 8) { 
                // Avanço extremamente rápido até a cara do monstro
                let prog = animacao.frameAtual / 8;
                animX = x + (320 - x) * prog;
                animY = 320 + (230 - 320) * prog;
                animRotacao = Math.PI / 6; // Inclina para frente (ataque)
            } else if (animacao.frameAtual <= 35) { 
                // Tempo de sustentação no ar durante os cortes
                animX = 320;
                animY = 230;
            } else { 
                // Retorno rápido (Backdash)
                let prog = (animacao.frameAtual - 35) / 10;
                animX = 320 + (x - 320) * prog;
                animY = 230 + (320 - 230) * prog;
                animRotacao = -Math.PI / 6; // Inclina para trás freando
            }
        }

        ctx.save();
        // Compensação aplicada para manter a compatibilidade com o desenho posicional fixo do código atual
        ctx.translate(animX - x, animY - 320); 
        if (animRotacao !== 0) {
            ctx.translate(x, 320);
            ctx.rotate(animRotacao);
            ctx.translate(-x, -320);
        }

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
            } else if (heroiIndex === 4) {
                // Ladra de Presas: Névoas/fumaças quadradas de veneno roxas subindo do chão
                ctx.fillStyle = `rgba(142, 68, 173, ${0.3 + Math.sin(tempoAnimacao * 3) * 0.2})`;
                ctx.fillRect(baseX - 10, 360 + offsetYHeroi - Math.sin(tempoAnimacao * 2) * 15, 15, 15);
                ctx.fillRect(baseX + 35, 350 + offsetYHeroi - Math.cos(tempoAnimacao * 2.5) * 15, 12, 12);
                ctx.fillRect(baseX + 15, 370 + offsetYHeroi - Math.sin(tempoAnimacao * 3.5) * 10, 18, 18);
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

                // --- OTIMIZAÇÃO: Throttle do Comet Azur ---
                // O raio visual contínua liso a 60fps, mas o cálculo matemático pesa apenas 4x por segundo
                if (frameCount % 15 === 0) { 
                    let buffPassivo = jogo.timeAtivo.includes(3) ? 1.15 : 1.0;
                    let buffAtivo = (jogo.timeAtivo.includes(3) && jogo.herois[3].skills && jogo.herois[3].skills[0].ativa) ? 1.5 : 1.0;
                    let buffAres = 1 + ((jogo.reliquiasPantheon && jogo.reliquiasPantheon[0] ? jogo.reliquiasPantheon[0] : 0) * 0.01);
                    
                    // Condensa 15 micro-frames de dano em 1 hit concentrado (dividido por 4 porque ocorre 4x num segundo)
                    let dpsBaseParaSkill = Math.max(1, jogo.herois[2].dps);
                    let danoTick = (dpsBaseParaSkill * skillMago.multiplicadorDanoMultiHit * buffPassivo * buffAtivo * buffAres) / 4;
                    
                    atacar(danoTick, false, 0, 'burstMago'); // O zero desativa o peso das partículas de sangue
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
        else if (heroiIndex === 4) {
            // Túnica preta/roxa
            ctx.fillStyle = "#34263a"; 
            ctx.fillRect(baseX, 300 + offsetYHeroi, 40, 75 * escalaBreathe);
            
            // Adagas de osso cruzadas nas costas (Lâminas verdes)
            ctx.strokeStyle = "#58d68d"; 
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(baseX + 5, 310 + offsetYHeroi); ctx.lineTo(baseX + 35, 340 + offsetYHeroi); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(baseX + 35, 310 + offsetYHeroi); ctx.lineTo(baseX + 5, 340 + offsetYHeroi); ctx.stroke();
            
            // Cinto
            ctx.fillStyle = "#111"; 
            ctx.fillRect(baseX, 345 + offsetYHeroi, 40, 6); 

            // Cabelo curto espetado verde-escuro
            ctx.fillStyle = "#145a32";
            ctx.beginPath(); ctx.arc(baseX + 20, 285 + offsetYHeroi, 18, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(baseX + 20, 290 + offsetYHeroi); ctx.lineTo(baseX - 5, 275 + offsetYHeroi); ctx.lineTo(baseX + 10, 265 + offsetYHeroi); ctx.fill();
            ctx.beginPath(); ctx.moveTo(baseX + 20, 290 + offsetYHeroi); ctx.lineTo(baseX + 45, 275 + offsetYHeroi); ctx.lineTo(baseX + 30, 265 + offsetYHeroi); ctx.fill();

            // --- ANIMAÇÃO DE ATAQUE BÁSICO (Corte de Adagas) ---
            if (animacao.ativa && (animacao.tipo === 'normal' || animacao.tipo === 'lodoToxico') && animacao.frameAtual > 2 && animacao.frameAtual < 12) {
                ctx.save();
                ctx.translate(baseX + 20, 310 + offsetYHeroi); // Posiciona o corte em frente à Assassina
                ctx.shadowBlur = 15;
                ctx.lineWidth = 5; // Lâminas grossas e visíveis
                ctx.lineCap = "round";
                
                // O corte voa agressivamente para a frente
                let slashProg = animacao.frameAtual * 6;
                
                // Corte 1 (Lâmina Verde Tóxica - Cima)
                ctx.shadowColor = "#2ecc71";
                ctx.strokeStyle = "#2ecc71";
                ctx.beginPath();
                ctx.arc(10 + slashProg, 5, 25, -Math.PI/2, Math.PI/4); // 'cy' removido para ancorar no peito
                ctx.stroke();
                
                // Corte 2 (Lâmina Roxa Veneno - Baixo)
                ctx.shadowColor = "#8e44ad";
                ctx.strokeStyle = "#8e44ad";
                ctx.beginPath();
                ctx.arc(5 + slashProg, 15, 22, -Math.PI/4, Math.PI*0.75); // 'cy' removido para ancorar no peito
                ctx.stroke();
                
                ctx.restore();
            }
        }
        
        ctx.restore();
    });

    ctx.font = "bold 14px sans-serif";
    let textoNivel = drawIsBoss ? `Nível ${jogo.nivel} (CHEFE)` : `Nível ${jogo.nivel}`;
    if (jogo.frestaDesafio && jogo.frestaDesafio.ativa) {
        textoNivel = `🌌 FRESTA DIMENSIONAL: Andar ${jogo.frestaDesafio.andarAtual}` + (drawIsBoss ? " (CHEFE)" : "");
    }
    ctx.lineWidth = 3; ctx.strokeStyle = "#000";
    ctx.strokeText(textoNivel, 400 - (ctx.measureText(textoNivel).width / 2), 25);
    ctx.fillStyle = "#fff";
    ctx.fillText(textoNivel, 400 - (ctx.measureText(textoNivel).width / 2), 25);

    ctx.fillStyle = "#333"; ctx.fillRect(250, 40, 300, 12);
    ctx.fillStyle = drawIsBoss ? "#8e44ad" : "#e74c3c"; 
    const hpPercent = Math.max(0, jogo.monstroHp / jogo.monstroHpMax);
    ctx.fillRect(250, 40, 300 * hpPercent, 12);

    if (jogo.monstroLodoToxico > 0) {
        ctx.save();
        ctx.fillStyle = "#8e44ad"; // Roxo veneno
        ctx.font = "bold 16px Georgia";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        // O texto flutua suavemente para cima e para baixo
        let floatPoison = Math.sin(tempoAnimacao * 5) * 4; 
        ctx.fillText(`☠️ Toxina: ${jogo.monstroLodoToxico}x`, 400, 115 + floatPoison);
        ctx.restore();
    }

    // --- EFEITO: CORTE DUPLO DA ASSASSINA (X) ---
    if (animacao.ativa && animacao.tipo === 'burstLadra' && animacao.frameAtual >= 8) {
        let hitFrame = animacao.frameAtual - 8;
        if (hitFrame <= 15) { // O flash do corte dura exatos 15 frames para ser violento e nítido
            let progressoX = hitFrame / 15;
            ctx.save();
            ctx.translate(400, 220); // Centro do corpo do Monstro
            ctx.globalAlpha = Math.max(0, 1 - progressoX); // Vai sumindo aos poucos
            
            // O "X" cresce de tamanho enquanto some
            let escalaX = 1 + (progressoX * 1.5);
            ctx.scale(escalaX, escalaX);
            
            ctx.shadowBlur = 25;
            ctx.lineWidth = 14;
            ctx.lineCap = "round";

            // Lâmina 1 (Corte Tóxico Verde Esmeralda)
            ctx.shadowColor = "#58d68d";
            ctx.strokeStyle = "#58d68d";
            ctx.beginPath(); ctx.moveTo(-60, -60); ctx.lineTo(60, 60); ctx.stroke();

            // Lâmina 2 (Corte Sombrio Roxo Veneno)
            ctx.shadowColor = "#8e44ad";
            ctx.strokeStyle = "#8e44ad";
            ctx.beginPath(); ctx.moveTo(60, -60); ctx.lineTo(-60, 60); ctx.stroke();

            // Núcleo de pura luz no centro do impacto
            ctx.shadowColor = "#fff";
            ctx.fillStyle = "#fff";
            ctx.globalAlpha = (1 - progressoX) * 0.8;
            ctx.beginPath(); ctx.arc(0, 0, 30 * (1 - progressoX), 0, Math.PI*2); ctx.fill();

            ctx.restore();
        }
    }

    // --- EFEITO: SHIELD BASH DO CAVALEIRO (Onda de Choque) ---
    if (animacao.ativa && animacao.tipo === 'shieldBash') {
        let maxFrames = 20; // Animação rápida de explosão
        if (animacao.frameAtual <= maxFrames) {
            let progresso = animacao.frameAtual / maxFrames;
            ctx.save();
            ctx.translate(400, 250); // Posição de impacto no chão perto do chefe
            
            // Círculo de expansão sísmica
            let raioX = 50 + (progresso * 200);
            let raioY = 15 + (progresso * 60); // Achatado para simular o chão em perspectiva 3D
            
            ctx.beginPath();
            ctx.ellipse(0, 0, raioX, raioY, 0, 0, Math.PI * 2);
            ctx.lineWidth = 15 * (1 - progresso);
            ctx.strokeStyle = `rgba(241, 196, 15, ${1 - progresso})`;
            ctx.shadowColor = "#e67e22";
            ctx.shadowBlur = 20;
            ctx.stroke();
            
            // Poço de impacto interno
            ctx.fillStyle = `rgba(192, 57, 43, ${(1 - progresso) * 0.5})`;
            ctx.fill();
            
            ctx.restore();
        }
    }

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

    // --- ANIMAÇÃO DE GACHA TELA CHEIA ---
    if (animacaoGacha.ativa) {
        let cx = 400;
        let cy = 225;
        let tick = animacaoGacha.tick;
        animacaoGacha.tick++;

        let corRaio = "0, 191, 255"; // Comum = Azul
        if (animacaoGacha.raridade === 'roxo') corRaio = "155, 89, 182"; // Épico = Roxo
        if (animacaoGacha.raridade === 'dourado') corRaio = "241, 196, 15"; // Lendário = Dourado

        let alphaFundo = Math.min(0.9, tick / 20);
        ctx.fillStyle = `rgba(0,0,0,${alphaFundo})`;
        ctx.fillRect(-2500, -2500, 5800, 5800);

        if (tick < 40) { // Fase 1: Meteoro Caindo
            let yEstrela = -400 + (tick * 16);
            ctx.fillStyle = `rgb(${corRaio})`;
            ctx.beginPath(); ctx.arc(cx, yEstrela, 8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx, yEstrela); ctx.lineTo(cx - 4, yEstrela - 80); ctx.lineTo(cx + 4, yEstrela - 80); ctx.fill();
        }
        else if (tick < 60) { // Fase 2: Explosão
            let raioExp = (tick - 40) * 40;
            ctx.fillStyle = `rgba(${corRaio}, ${1 - (tick-40)/20})`;
            ctx.beginPath(); ctx.arc(cx, cy, raioExp, 0, Math.PI*2); ctx.fill();
        }
        else if (tick < 260) { // Fase 3: Splash Art
            let popAlpha = Math.min(1, (tick - 60) / 10);
            ctx.globalAlpha = popAlpha;

            // Fundo de Raios Giratórios
            ctx.save();
            ctx.translate(cx, cy - 20);
            ctx.rotate(tick * 0.02);
            ctx.fillStyle = `rgba(${corRaio}, 0.3)`;
            for(let i=0; i<8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-20, 800); ctx.lineTo(20, 800); ctx.fill();
            }
            ctx.restore();

            if (animacaoGacha.heroiIndex !== null) {
                // Desenha a Splash Art apenas uma vez na posição correta
                desenharSplashArt(ctx, cx, cy - 40, animacaoGacha.heroiIndex, tick);
                
                // --- TAG DINÂMICA DE NOVO OU DUPLICATA ---
                if (tick > 130) {
                    ctx.save();
                    let pop = Math.min(1, (tick - 130) / 20); // Animação de pop-up
                    // MUDANÇA: Eixo Y alterado de (cy + 130) para (cy - 180) para ficar no topo da tela!
                    ctx.translate(cx, cy - 180); 
                    ctx.scale(pop, pop);
                    ctx.textAlign = "center";
                    
                    if (animacaoGacha.isNovo) {
                        ctx.font = "bold 50px 'Cinzel', serif";
                        ctx.fillStyle = "#f1c40f";
                        ctx.shadowColor = "#e67e22"; ctx.shadowBlur = 15;
                        ctx.fillText("✨ NOVO!", 0, 0);
                    } else {
                        ctx.font = "bold 35px Arial";
                        ctx.fillStyle = "#fff";
                        ctx.shadowColor = "#8e44ad"; ctx.shadowBlur = 15;
                        ctx.fillText("🧩 +10 Fragmentos", 0, 0);
                    }
                    ctx.restore();
                }
            } else {
                ctx.font = "80px Arial"; ctx.textAlign = "center";
                // Exibe Quebra-cabeça para fragmentos (roxo) e Bolsa de Ouro para pontos (azul)
                let iconeGacha = animacaoGacha.raridade === 'roxo' ? "🧩" : "💰";
                ctx.fillText(iconeGacha, cx, cy - 40);
            }

            // Textos de Resultado
            ctx.fillStyle = "#fff";
            ctx.font = "bold 20px Georgia";
            ctx.textAlign = "center";
            let linhas = animacaoGacha.msg.split('\n');
            linhas.forEach((l, i) => {
                ctx.fillText(l, cx, cy + 80 + (i * 24));
            });

            ctx.globalAlpha = 1.0;
        } else {
            animacaoGacha.ativa = false; // Fim
        }
    }

    ctx.restore();
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
    } else if (heroiIndex === 4) {
        // Ladra de Presas
        // Capuz/Capa preta cobrindo os ombros
        ctx.fillStyle = "#2c3e50"; 
        ctx.fillRect(cx - 30, cy + 15, 60, 35);
        ctx.beginPath(); ctx.arc(cx, cy - 5, 25, Math.PI, 0); ctx.fill();

        // Rosto
        ctx.fillStyle = "#ffcc99";
        ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();

        // Máscara ninja cobrindo a boca
        ctx.fillStyle = "#1c2833";
        ctx.beginPath(); ctx.arc(cx, cy + 5, 20, 0, Math.PI); ctx.fill();
        ctx.fillRect(cx - 20, cy + 5, 40, 15);

        // Olhos amendoados e expressivos brilhando em verde
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath(); ctx.ellipse(cx - 8, cy - 5, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 8, cy - 5, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
}

function desenharSplashArt(ctx, cx, cy, heroiIndex, tick) {
    ctx.save();
    ctx.translate(cx, cy);
    let breath = Math.sin(tick * 0.05);
    ctx.translate(0, breath * 5); // Flutuação suave
    ctx.scale(2.5, 2.5); // Escala épica

    // Sistema de desenho por camadas: Fundo/Capa -> Corpo/Anatomia -> Rosto/Cabelo -> Armas/Efeitos Mágicos

    if (heroiIndex === 0) {
        // ⚔️ GUERREIRO PRINCIPAL (Pose de Salto Ofensivo)
        ctx.shadowBlur = 0;
        
        // Capa Vermelha Esvoaçante (Fundo)
        ctx.fillStyle = "#a10000";
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.bezierCurveTo(-50, 20, -70, -10, -40, 50); ctx.lineTo(-15, 30); ctx.fill();

        // Corpo e Armadura (Prata e Ouro)
        let gradArmadura = ctx.createLinearGradient(0, -20, 0, 30);
        gradArmadura.addColorStop(0, "#ecf0f1"); gradArmadura.addColorStop(1, "#7f8c8d");
        ctx.fillStyle = gradArmadura;
        ctx.beginPath(); ctx.moveTo(-15, 25); ctx.lineTo(15, 20); ctx.lineTo(20, -5); ctx.lineTo(-20, -5); ctx.fill(); // Torso
        ctx.fillStyle = "#e67e22"; ctx.fillRect(-10, -5, 20, 15); // Placa Peitoral de Ouro
        ctx.fillStyle = "#c0392b"; ctx.fillRect(-12, 10, 24, 6); // Cinto Vermelho

        // Braços e Ombreiras Metálicas
        ctx.fillStyle = "#95a5a6";
        ctx.beginPath(); ctx.arc(-22, -2, 10, 0, Math.PI*2); ctx.fill(); // Ombro Esq
        ctx.beginPath(); ctx.arc(22, -2, 10, 0, Math.PI*2); ctx.fill(); // Ombro Dir
        ctx.fillStyle = "#34495e"; ctx.fillRect(-28, -2, 8, 20); // Braço Esq segurando espada

        // Rosto e Cabelo Espetado Laranja
        ctx.fillStyle = "#ffcc99"; ctx.beginPath(); ctx.arc(0, -18, 12, 0, Math.PI*2); ctx.fill(); // Rosto
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-4, -20, 2, 0, Math.PI*2); ctx.arc(5, -21, 2, 0, Math.PI*2); ctx.fill(); // Olhos furiosos
        ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(-2, -22); ctx.moveTo(7, -25); ctx.lineTo(3, -23); ctx.stroke(); // Sobrancelhas
        
        ctx.fillStyle = "#d35400"; // Cabelo Laranja
        ctx.beginPath(); ctx.moveTo(-12, -18); ctx.lineTo(-20, -35); ctx.lineTo(-5, -28); ctx.lineTo(0, -45); ctx.lineTo(8, -28); ctx.lineTo(22, -35); ctx.lineTo(12, -18); ctx.fill();

        // Montante (Espada Gigante Incandescente)
        ctx.save();
        ctx.rotate(-Math.PI / 6);
        ctx.translate(-25, 0);
        let gradEspada = ctx.createLinearGradient(0, -60, 0, 10);
        gradEspada.addColorStop(0, "#fff"); gradEspada.addColorStop(0.3, "#f1c40f"); gradEspada.addColorStop(1, "#c0392b");
        ctx.shadowColor = "#e67e22"; ctx.shadowBlur = 25;
        ctx.fillStyle = gradEspada;
        ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(6, 10); ctx.lineTo(10, -60); ctx.lineTo(0, -85); ctx.lineTo(-10, -60); ctx.fill(); // Lâmina
        ctx.fillStyle = "#f39c12"; ctx.shadowBlur = 5; ctx.fillRect(-18, 10, 36, 6); // Guarda-Mão Ouro
        ctx.fillStyle = "#5c3a21"; ctx.fillRect(-4, 16, 8, 15); // Cabo
        ctx.restore();

    } else if (heroiIndex === 1) {
        // 🏹 ELFA ARQUEIRA (Pose de Puxada de Arco)
        ctx.shadowBlur = 0;
        
        // Cabelo Loiro Flutuando (Fundo)
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath(); ctx.moveTo(0, -15); ctx.quadraticCurveTo(-30, 0, -40, 30); ctx.quadraticCurveTo(-10, 10, 0, -5); ctx.fill();

        // Torso Esmeralda e Cintos de Couro
        ctx.fillStyle = "#1abc9c";
        ctx.beginPath(); ctx.moveTo(-12, 25); ctx.lineTo(12, 25); ctx.lineTo(16, -10); ctx.lineTo(-10, -10); ctx.fill(); // Vestido
        ctx.fillStyle = "#8b4513"; ctx.fillRect(-12, 5, 24, 5); // Cinto
        ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 5); ctx.lineWidth = 3; ctx.strokeStyle = "#8b4513"; ctx.stroke(); // Alça da Aljava

        // Braços Tensionando o Arco
        ctx.fillStyle = "#ffcc99";
        ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(-30, 5); ctx.lineWidth = 6; ctx.strokeStyle = "#1abc9c"; ctx.stroke(); // Braço trás
        ctx.beginPath(); ctx.moveTo(15, -5); ctx.lineTo(35, 0); ctx.lineWidth = 5; ctx.strokeStyle = "#ffcc99"; ctx.stroke(); // Braço frente (Pele)

        // Rosto, Capuz e Orelhas
        ctx.fillStyle = "#ffcc99"; ctx.beginPath(); ctx.arc(0, -18, 11, 0, Math.PI*2); ctx.fill(); // Rosto
        ctx.fillStyle = "#ffcc99"; ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(-25, -25); ctx.lineTo(-8, -12); ctx.fill(); // Orelha Esq
        ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(25, -25); ctx.lineTo(8, -12); ctx.fill(); // Orelha Dir
        ctx.fillStyle = "#2ecc71"; ctx.shadowColor = "#2ecc71"; ctx.shadowBlur = 10; 
        ctx.beginPath(); ctx.ellipse(-4, -18, 3, 4, 0, 0, Math.PI*2); ctx.ellipse(5, -18, 3, 4, 0, 0, Math.PI*2); ctx.fill(); // Olhos Esmeralda Brilhantes Corrigidos
        ctx.fillStyle = "#1e8449"; ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(0, -35); ctx.lineTo(14, -24); ctx.lineTo(0, -15); ctx.fill(); // Capuz

        // Arco de Energia Ciano e Flecha
        ctx.save();
        ctx.translate(35, 0);
        ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 20;
        ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 35, -Math.PI/2.5, Math.PI/2.5); ctx.stroke(); // Corpo do arco
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(Math.cos(-Math.PI/2.5)*35, Math.sin(-Math.PI/2.5)*35); ctx.lineTo(-40, 5); ctx.lineTo(Math.cos(Math.PI/2.5)*35, Math.sin(Math.PI/2.5)*35); ctx.stroke(); // Corda
        // Flecha Brilhante
        ctx.fillStyle = "#fff"; ctx.shadowBlur = 30; ctx.shadowColor = "#fff";
        ctx.beginPath(); ctx.moveTo(-45, 5); ctx.lineTo(15, 0); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(5, -6); ctx.lineTo(5, 6); ctx.fill(); // Ponta
        ctx.restore();
        
    } else if (heroiIndex === 2) {
        // 🔮 MAGO DE GLINTSTONE (Canalizando Feixe)
        ctx.shadowBlur = 0;
        
        // Túnica e Capa Roxa Profunda
        let gradTunica = ctx.createLinearGradient(0, -20, 0, 40);
        gradTunica.addColorStop(0, "#9b59b6"); gradTunica.addColorStop(1, "#4a235a");
        ctx.fillStyle = gradTunica;
        ctx.beginPath(); ctx.moveTo(-25, 40); ctx.lineTo(25, 40); ctx.lineTo(15, -10); ctx.lineTo(-15, -10); ctx.fill(); // Corpo
        ctx.fillStyle = "#8e44ad";
        ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(-35, 20); ctx.lineTo(-20, 30); ctx.fill(); // Manga Esq
        ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(35, 20); ctx.lineTo(20, 30); ctx.fill(); // Manga Dir

        // Rosto e Barba Flutuante
        ctx.fillStyle = "#ffcc99"; ctx.beginPath(); ctx.arc(0, -15, 12, 0, Math.PI*2); ctx.fill(); // Rosto
        ctx.fillStyle = "#ecf0f1"; 
        ctx.beginPath(); ctx.moveTo(-12, -10); ctx.quadraticCurveTo(0, 30 + breath*5, 12, -10); ctx.fill(); // Barba majestosa

        // Chapéu Cônico de Bruxo
        ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.ellipse(0, -22, 25, 6, 0, 0, Math.PI*2); ctx.fill(); // Aba
        ctx.fillStyle = "#34495e"; ctx.beginPath(); ctx.moveTo(-15, -22); ctx.quadraticCurveTo(0, -60, 25, -65); ctx.lineTo(15, -22); ctx.fill(); // Ponta curva
        ctx.fillStyle = "#00ffff"; ctx.shadowColor = "#00ffff"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(23, -63, 4, 0, Math.PI*2); ctx.fill(); // Joia do Chapéu
        
        // Aura Cósmica nas Mãos (Comet Azur Preparando)
        ctx.globalCompositeOperation = "lighter";
        let gradMagia = ctx.createRadialGradient(0, 15, 0, 0, 15, 30);
        gradMagia.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        gradMagia.addColorStop(0.3, "rgba(0, 255, 255, 0.6)");
        gradMagia.addColorStop(1, "transparent");
        ctx.fillStyle = gradMagia;
        ctx.fillRect(-35, -15, 70, 70);
        
        // Glifos ao redor da magia
        ctx.save();
        ctx.translate(0, 15); ctx.rotate(-tick * 0.05);
        ctx.fillStyle = "#00ffff"; ctx.font = "12px Arial"; ctx.fillText("✧", -25, -20); ctx.fillText("✦", 20, 20); ctx.fillText("⟡", 20, -20);
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";

    } else if (heroiIndex === 3) {
        // 🛡️ CAVALEIRO DE FERRO (Defesa Impenetrável)
        ctx.shadowBlur = 0;

        // Corpo Robusto Blindado
        let gradArmadura = ctx.createLinearGradient(0, -20, 0, 30);
        gradArmadura.addColorStop(0, "#7f8c8d"); gradArmadura.addColorStop(1, "#2c3e50");
        ctx.fillStyle = gradArmadura;
        ctx.beginPath(); ctx.moveTo(-25, 30); ctx.lineTo(35, 30); ctx.lineTo(25, -15); ctx.lineTo(-15, -15); ctx.fill(); // Torso Gigante
        ctx.fillStyle = "#34495e"; ctx.beginPath(); ctx.arc(-20, -10, 14, 0, Math.PI*2); ctx.arc(20, -10, 14, 0, Math.PI*2); ctx.fill(); // Ombreiras Redondas

        // Capacete Fechado
        ctx.fillStyle = "#95a5a6"; ctx.beginPath(); ctx.arc(0, -25, 14, 0, Math.PI*2); ctx.fill(); // Base Elmo
        ctx.fillStyle = "#111"; ctx.fillRect(-10, -30, 20, 6); // Fenda Visor
        ctx.fillStyle = "#e74c3c"; ctx.shadowColor = "#e74c3c"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(-3, -27, 2, 0, Math.PI*2); ctx.fill(); // Olho Terminator Brilhando

        // Escudo de Torre (Cobrindo metade do corpo, plantado no chão)
        ctx.save();
        ctx.translate(-15, 5);
        let gradEscudo = ctx.createLinearGradient(-15, -40, 15, 40);
        gradEscudo.addColorStop(0, "#bdc3c7"); gradEscudo.addColorStop(1, "#34495e");
        ctx.shadowColor = "#000"; ctx.shadowBlur = 20;
        ctx.fillStyle = gradEscudo;
        ctx.beginPath(); ctx.moveTo(-20, -35); ctx.lineTo(20, -35); ctx.lineTo(15, 45); ctx.lineTo(0, 55); ctx.lineTo(-15, 45); ctx.fill(); // Forma do Escudo
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 4; ctx.strokeRect(-15, -30, 30, 70); // Borda Sangue
        ctx.fillStyle = "#e67e22"; ctx.fillRect(-5, -20, 10, 50); ctx.fillRect(-15, 0, 30, 10); // Cruz de Ouro
        
        // Impacto no Chão do Escudo
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.beginPath(); ctx.ellipse(0, 55, 30, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();

        // Lança Plantada na Direita
        ctx.fillStyle = "#7f8c8d"; ctx.fillRect(25, -40, 6, 80); // Haste
        ctx.fillStyle = "#bdc3c7"; ctx.beginPath(); ctx.moveTo(28, -60); ctx.lineTo(34, -40); ctx.lineTo(22, -40); ctx.fill(); // Ponta

    } else if (heroiIndex === 4) {
        // ☠️ LADRA DE PRESAS (Pulo Ágil Invertido)
        ctx.shadowBlur = 0;
        
        // Efeito Lodo Tóxico no Fundo (Rastro do pulo)
        ctx.shadowColor = "#2ecc71"; ctx.shadowBlur = 20;
        ctx.fillStyle = "rgba(46, 204, 113, 0.4)";
        ctx.beginPath(); ctx.moveTo(-30, 40); ctx.quadraticCurveTo(0, 0, -15, -20); ctx.lineTo(15, -20); ctx.quadraticCurveTo(30, 0, 10, 40); ctx.fill();

        // Cachecol Ninja (Fluindo agressivamente pra cima)
        ctx.shadowBlur = 5; ctx.shadowColor = "#000";
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(30, -30, 40, -50); ctx.quadraticCurveTo(20, -20, 10, -15); ctx.fill();

        // Traje de Couro Justo
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath(); ctx.moveTo(-12, 20); ctx.lineTo(12, 20); ctx.lineTo(15, -10); ctx.lineTo(-15, -10); ctx.fill(); // Torso
        ctx.fillStyle = "#1c2833"; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-25, 10); ctx.lineTo(-18, 15); ctx.fill(); // Braço Esq
        ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(25, 10); ctx.lineTo(18, 15); ctx.fill(); // Braço Dir

        // Cabeça Mascarada
        ctx.fillStyle = "#ffcc99"; ctx.beginPath(); ctx.arc(0, -18, 11, 0, Math.PI*2); ctx.fill(); // Pele
        ctx.fillStyle = "#1c2833"; ctx.beginPath(); ctx.arc(0, -15, 12, 0, Math.PI); ctx.fill(); ctx.fillRect(-12, -15, 24, 8); // Máscara Inferior
        ctx.fillStyle = "#145a32"; ctx.beginPath(); ctx.arc(0, -22, 12, Math.PI, 0); ctx.fill(); // Cabelo Verde Escuro

        // Olhos Verdes Fatais
        ctx.fillStyle = "#2ecc71"; ctx.shadowColor = "#2ecc71"; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(-3, -16); ctx.lineTo(-9, -17); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8, -20); ctx.lineTo(3, -16); ctx.lineTo(9, -17); ctx.fill();

        // Adagas de Osso Venenosas Cruzadas
        ctx.shadowColor = "#58d68d"; ctx.shadowBlur = 20;
        let gradAdaga = ctx.createLinearGradient(0, 0, -30, 20);
        gradAdaga.addColorStop(0, "#ecf0f1"); gradAdaga.addColorStop(1, "#27ae60");
        ctx.fillStyle = gradAdaga;
        
        // Adaga Esq (Pegada Invertida)
        ctx.beginPath(); ctx.moveTo(-25, 10); ctx.quadraticCurveTo(-45, 0, -30, -30); ctx.quadraticCurveTo(-20, -5, -18, 5); ctx.fill();
        // Adaga Dir (Pegada Invertida)
        ctx.beginPath(); ctx.moveTo(25, 10); ctx.quadraticCurveTo(45, 0, 30, -30); ctx.quadraticCurveTo(20, -5, 18, 5); ctx.fill();
    }

    ctx.restore();
}

function desenharParallaxMenu(scale) {
    let pX = (Date.now() * 0.015); 
    ctx.scale(scale, scale); 
    ctx.translate(-400, -225); 

    // --- CAMADA 1: Céu de Fim de Tarde (Golden Hour) ---
    let grad = ctx.createLinearGradient(0, -500, 0, 300);
    grad.addColorStop(0, "#87CEFA"); // Azul claro lá no alto
    grad.addColorStop(0.5, "#FFB6C1"); // Rosa suave no meio
    grad.addColorStop(1, "#FFDAB9"); // Pêssego dourado no horizonte
    ctx.fillStyle = grad; 
    ctx.fillRect(-2500, -1500, 6000, 4000); // Expansão extrema para matar as bordas

    // Sol suave ao fundo
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath(); ctx.arc(100, 50, 70, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(100, -20, 80, 0, Math.PI * 2); ctx.fill();

    // --- CAMADA 2: Colinas Distantes (Suaves e Arredondadas) ---
    ctx.save();
    ctx.fillStyle = "#A8C3B4"; // Verde-azulado com neblina atmosférica
    for (let i = -2000; i < 5000; i += 250) {
        let hillX = i - (pX * 0.2 % 250);
        ctx.beginPath(); ctx.arc(hillX + 125, 280, 180, Math.PI, 0); ctx.fill();
    }
    ctx.restore();

    // --- CAMADA 3: O Grande Castelo Branco e Telhados Vermelhos ---
    ctx.save();
    let casteloX = 300 - (pX * 0.3 % 800); 
    
    // Sombreamento base (Lado esquerdo mais escuro)
    ctx.fillStyle = "#D7C4B1"; 
    ctx.fillRect(casteloX, 70, 100, 150); // Forte Central Sombra
    ctx.fillRect(casteloX - 40, 100, 45, 120); // Torre Esq Sombra
    ctx.fillRect(casteloX + 95, 80, 45, 140); // Torre Dir Sombra

    // Iluminação (Lado direito banhado de sol)
    ctx.fillStyle = "#F5EAD4"; 
    ctx.fillRect(casteloX + 40, 70, 60, 150); // Forte Central Luz
    ctx.fillRect(casteloX - 15, 100, 20, 120); // Torre Esq Luz
    ctx.fillRect(casteloX + 120, 80, 20, 140); // Torre Dir Luz

    // Telhados Cônicos (Terracota)
    ctx.fillStyle = "#C0392B";
    ctx.beginPath(); ctx.moveTo(casteloX - 15, 70); ctx.lineTo(casteloX + 50, 0); ctx.lineTo(casteloX + 115, 70); ctx.fill(); // Teto Central
    ctx.beginPath(); ctx.moveTo(casteloX - 50, 100); ctx.lineTo(casteloX - 17, 30); ctx.lineTo(casteloX + 15, 100); ctx.fill(); // Teto Esq
    ctx.beginPath(); ctx.moveTo(casteloX + 85, 80); ctx.lineTo(casteloX + 117, 10); ctx.lineTo(casteloX + 150, 80); ctx.fill(); // Teto Dir

    // Janelinhas charmosas de arco
    ctx.fillStyle = "#2C3E50";
    ctx.beginPath(); ctx.arc(casteloX + 50, 100, 12, Math.PI, 0); ctx.fillRect(casteloX + 38, 100, 24, 15); ctx.fill();
    ctx.beginPath(); ctx.arc(casteloX - 17, 130, 8, Math.PI, 0); ctx.fillRect(casteloX - 25, 130, 16, 12); ctx.fill();
    ctx.beginPath(); ctx.arc(casteloX + 117, 110, 8, Math.PI, 0); ctx.fillRect(casteloX + 109, 110, 16, 12); ctx.fill();
    ctx.restore();

    // --- CAMADA 4: Vila Acolhedora (Casinhas Aglomeradas) ---
    ctx.save();
    for (let i = -2000; i < 5000; i += 140) {
        let casaX = i - (pX * 0.6 % 140);
        
        // Casa 1 (Maior)
        ctx.fillStyle = "#EBE1D5"; ctx.fillRect(casaX, 190, 50, 50); // Parede Luz
        ctx.fillStyle = "#D7C4B1"; ctx.fillRect(casaX, 190, 20, 50); // Parede Sombra
        ctx.fillStyle = "#D35400"; // Telhado
        ctx.beginPath(); ctx.moveTo(casaX - 10, 190); ctx.lineTo(casaX + 25, 150); ctx.lineTo(casaX + 60, 190); ctx.fill();
        ctx.fillStyle = "#8B4513"; ctx.fillRect(casaX + 25, 210, 12, 18); // Porta de Madeira
        
        // Casa 2 (Menor, sobreposta à direita)
        ctx.fillStyle = "#F5EAD4"; ctx.fillRect(casaX + 40, 205, 40, 35);
        ctx.fillStyle = "#C0392B"; 
        ctx.beginPath(); ctx.moveTo(casaX + 30, 205); ctx.lineTo(casaX + 60, 175); ctx.lineTo(casaX + 90, 205); ctx.fill();
        ctx.fillStyle = "#8B4513"; ctx.fillRect(casaX + 55, 220, 10, 12); // Janela
    }
    ctx.restore();

    // --- CAMADA 5: Floresta "Fluffy" (Tufos de folhas sobrepostos) ---
    ctx.fillStyle = "#4A7C59"; 
    ctx.fillRect(-2500, 230, 6000, 2000); 
    
    ctx.save();
    for (let i = -2000; i < 5000; i += 90) {
        let arvX = i - (pX * 1.2 % 90);
        
        // Efeito de volume criando vários círculos com tons diferentes de verde
        ctx.fillStyle = "#3E6F4D"; // Sombra
        ctx.beginPath(); ctx.arc(arvX + 20, 240, 35, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = "#558B63"; // Meio-tom
        ctx.beginPath(); ctx.arc(arvX, 250, 40, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(arvX + 45, 255, 30, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#6B9F77"; // Luz/Topo
        ctx.beginPath(); ctx.arc(arvX - 10, 260, 25, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(arvX + 20, 245, 35, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = "#82B092"; // Folhas mais claras na ponta
        ctx.beginPath(); ctx.arc(arvX + 35, 275, 20, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
}