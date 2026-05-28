import { jogo } from './state.js';

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

    // Gera as partículas de labaredas se a habilidade estiver ativa
    if (skillFogo && skillFogo.ativa) {
        for (let i = 0; i < 2; i++) { // Cria 2 partículas por frame
            const coresFogo = ["#e74c3c", "#e67e22", "#f1c40f"]; // Vermelho, Laranja, Amarelo
            particulasFogo.push({
                x: -6 + Math.random() * 12, // Largura local da lâmina
                y: -74 + Math.random() * 70, // Altura local da lâmina
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

    const balancoVento = Math.sin(cicloTempo * 4) * 0.05; // Movimento contínuo do vento

    // Árvore 1 balançando
    ctx.fillStyle = "#8b4513"; 
    ctx.fillRect(40, 115, 16, 75);
    ctx.save();
    ctx.translate(48, 115); // Eixo de rotação no topo do tronco
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
        ctx.beginPath();
        ctx.moveTo(g[0], g[1]);
        ctx.lineTo(g[0] - 4, g[1] - 8);
        ctx.lineTo(g[0] + 2, g[1] - 2);
        ctx.lineTo(g[0] + 6, g[1] - 10);
        ctx.lineTo(g[0] + 10, g[1]);
        ctx.fill();
    });

    const isBoss = jogo.nivel % 5 === 0;
    
    ctx.save();
    if (animacao.ativa && animacao.frameAtual < marcoAtaque) { // Tremer a tela apenas no impacto inicial
        const forcaShake = animacao.critico ? 16 : 8; 
        ctx.translate((Math.random() - 0.5) * forcaShake, (Math.random() - 0.5) * forcaShake);
    }
    ctx.translate(0, flutuarMonstro); // Aplica a flutuação em tudo do monstro

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
        ctx.fillStyle = "#8b4513"; 
        ctx.fillRect(450, 130, 15, 90);
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(360, 140, 80, 80);
        ctx.beginPath();
        ctx.moveTo(370, 110); ctx.lineTo(310, 90); ctx.lineTo(370, 130);
        ctx.moveTo(430, 110); ctx.lineTo(490, 90); ctx.lineTo(430, 130);
        ctx.fill();
        ctx.beginPath(); ctx.arc(400, 110, 35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(385, 105, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(415, 105, 5, 0, Math.PI * 2); ctx.fill();
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

    // GERADOR DE SANGUE GEOMÉTRICO (No impacto do ataque geral)
    if (animacao.ativa && animacao.frameAtual === 1) {
        for (let i = 0; i < 10; i++) {
            particulasSangue.push({
                x: 400 + (Math.random() - 0.5) * 40,
                y: 130 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 2, // Ligeiro impulso para cima inicial
                tamanho: 4 + Math.random() * 4,
                alpha: 1,
                cor: isBoss ? "#8e44ad" : "#2ecc71", // Roxo ou Verde
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
        
        if (p.alpha <= 0 || p.tamanho <= 0) {
            particulasExplosao.splice(i, 1);
        } else {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.cor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
            ctx.fill();
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

    ctx.save();
    ctx.translate(488, 329); 
    if (animacao.ativa) {
        ctx.beginPath();
        ctx.arc(0, 0, 74, -Math.PI / 2, -Math.PI / 2 + (Math.PI / 4), false);
        if (skillFogo && skillFogo.ativa) {
            ctx.strokeStyle = `rgba(230, 126, 34, ${1 - (animacao.frameAtual / animacao.duracao)})`; // Laranja flamejante
        } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - (animacao.frameAtual / animacao.duracao)})`;
        }
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
        const angulo = Math.sin((animacao.frameAtual / animacao.duracao) * Math.PI) * (Math.PI / 4);
        ctx.rotate(angulo);
    }
    ctx.fillStyle = (skillFogo && skillFogo.ativa) ? "#e74c3c" : "#bdc3c7"; // Vermelho ou Prata
    ctx.fillRect(-6, -74, 12, 70); 
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(-16, -4, 32, 8); 

    // Renderiza as partículas de fogo atreladas à espada
    for (let i = particulasFogo.length - 1; i >= 0; i--) {
        let p = particulasFogo[i];
        p.x += p.vx;
        p.y += p.vy; // Como o Y local é negativo, a partícula corre para a ponta da espada
        p.alpha -= 0.02;     // Vai sumindo
        p.tamanho -= 0.05;   // Vai diminuindo o tamanho

        if (p.alpha <= 0 || p.tamanho <= 0) {
            particulasFogo.splice(i, 1);
        } else {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.cor;
            ctx.fillRect(p.x, p.y, p.tamanho, p.tamanho);
        }
    }
    ctx.globalAlpha = 1; // Reseta a opacidade global

    ctx.restore(); 

    const offsetYHeroi = 75 * (1 - escalaBreathe);

    ctx.fillStyle = `hsl(200, 100%, ${Math.min(40 + jogo.herois[0].dps * 5, 80)}%)`;
    ctx.fillRect(420, 300 + offsetYHeroi, 60, 75 * escalaBreathe);
    ctx.fillStyle = "#ffcc99";
    ctx.beginPath(); ctx.arc(450, 280 + offsetYHeroi, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5c3a21";
    ctx.beginPath(); ctx.arc(450, 280 + offsetYHeroi, 23, Math.PI, 0); ctx.fill(); 
    ctx.fillRect(430, 280 + offsetYHeroi, 40, 20); 

    if (jogo.herois.length > 1 && jogo.herois[1].nivelDps > 0) {
        ctx.fillStyle = "#1abc9c"; 
        ctx.fillRect(290, 300 + offsetYHeroi, 40, 75 * escalaBreathe);
        ctx.fillStyle = "#ffcc99";
        ctx.beginPath(); ctx.arc(310, 280 + offsetYHeroi, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(295, 280 + offsetYHeroi); ctx.lineTo(275, 270 + offsetYHeroi); ctx.lineTo(292, 287 + offsetYHeroi); 
        ctx.moveTo(325, 280 + offsetYHeroi); ctx.lineTo(345, 270 + offsetYHeroi); ctx.lineTo(328, 287 + offsetYHeroi); 
        ctx.fill();
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath(); ctx.arc(310, 280 + offsetYHeroi, 21, Math.PI, 0); ctx.fill(); 
        ctx.fillRect(292, 280 + offsetYHeroi, 36, 45); 
        
        ctx.save();
        ctx.translate(325, 315 + offsetYHeroi); 
        ctx.rotate(Math.atan2(-155, 75));
        if (animacao.ativa && animacao.frameAtual < marcoAtaque) ctx.translate(-5, 0);
        
        const skillElfaAtiva = animacao.ativa && animacao.tipo === 'burstElfa' && jogo.herois[1]?.skills?.some(s => s.nome === "🏹 Rajada de Glifos");

        ctx.strokeStyle = skillElfaAtiva ? "#00ffff" : "#f39c12"; 
        ctx.lineWidth = skillElfaAtiva ? 8 : 4;
        ctx.beginPath(); 
        ctx.arc(10, 0, skillElfaAtiva ? 60 : 25, -Math.PI/2 + 0.2, Math.PI/2 - 0.2); 
        ctx.stroke();
        
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 1;
        const cordaY = skillElfaAtiva ? 58 : 24; // A corda acompanha o tamanho do arco
        ctx.beginPath(); ctx.moveTo(10, -cordaY);
        const cordaX = (animacao.ativa && animacao.frameAtual >= marcoAtaque) ? 10 : (skillElfaAtiva ? -15 : 0); // Puxa a corda mais para trás se o arco for gigante
        ctx.lineTo(cordaX, 0); ctx.lineTo(10, cordaY); ctx.stroke();
        
        if (!animacao.ativa || animacao.frameAtual < marcoAtaque) {
            ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 3; ctx.beginPath();
            ctx.moveTo(cordaX, 0); ctx.lineTo(35, 0); ctx.stroke();
        } else {
            const progressoVoo = (animacao.frameAtual - marcoAtaque) / (animacao.duracao - marcoAtaque);
            const distanciaVoo = progressoVoo * 150;
            
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