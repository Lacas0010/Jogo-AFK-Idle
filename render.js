import { jogo } from './state.js';

export let textosFlutuantes = [];
export let animacao = { ativa: false, frameAtual: 0, duracao: 15, critico: false };

let canvas;
let ctx;

export function desenhar() {
    if (!canvas) {
        canvas = document.getElementById("jogoCanvas");
        if (canvas) ctx = canvas.getContext("2d");
    }
    if (!ctx) {
        requestAnimationFrame(desenhar);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (animacao.ativa) {
        animacao.frameAtual++;
        if (animacao.frameAtual >= animacao.duracao) animacao.ativa = false;
    }

    ctx.fillStyle = "#87ceeb"; 
    ctx.fillRect(0, 0, canvas.width, 140);

    ctx.fillStyle = "#FFD700"; 
    ctx.beginPath(); ctx.arc(340, 50, 25, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(60, 40, 15, 0, Math.PI * 2); ctx.arc(80, 40, 22, 0, Math.PI * 2); ctx.arc(100, 40, 15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(260, 70, 12, 0, Math.PI * 2); ctx.arc(280, 70, 18, 0, Math.PI * 2); ctx.arc(300, 70, 12, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#2ecc71"; 
    ctx.fillRect(0, 140, canvas.width, canvas.height - 140);

    ctx.fillStyle = "#8b4513"; 
    ctx.fillRect(25, 80, 16, 70);
    ctx.fillStyle = "#27ae60"; 
    ctx.beginPath(); ctx.arc(33, 70, 35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 50, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(50, 50, 25, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#8b4513"; 
    ctx.fillRect(350, 90, 14, 60);
    ctx.fillStyle = "#27ae60"; 
    ctx.beginPath(); ctx.arc(357, 80, 30, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(340, 60, 20, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(375, 65, 20, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#229954"; 
    const gramas = [[50, 180], [120, 240], [280, 170], [350, 260], [80, 280], [310, 220], [20, 230], [200, 155], [60, 350], [180, 370], [320, 340], [260, 380]];
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
    if (animacao.ativa) {
        const forcaShake = animacao.critico ? 16 : 8; 
        ctx.translate((Math.random() - 0.5) * forcaShake, (Math.random() - 0.5) * forcaShake);
    }

    if (isBoss) {
        ctx.fillStyle = "#2c3e50"; 
        ctx.fillRect(150, 120, 100, 100);
        ctx.fillStyle = "#e74c3c"; 
        ctx.beginPath(); ctx.arc(180, 150, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(220, 150, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ecf0f1"; 
        ctx.fillRect(175, 190, 10, 15);
        ctx.fillRect(215, 190, 10, 15);
    } else {
        ctx.fillStyle = "#8b4513"; 
        ctx.fillRect(250, 130, 15, 90);
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(160, 140, 80, 80);
        ctx.beginPath();
        ctx.moveTo(170, 110); ctx.lineTo(110, 90); ctx.lineTo(170, 130);
        ctx.moveTo(230, 110); ctx.lineTo(290, 90); ctx.lineTo(230, 130);
        ctx.fill();
        ctx.beginPath(); ctx.arc(200, 110, 35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(185, 105, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(215, 105, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(238, 294); 
    if (animacao.ativa) {
        ctx.beginPath();
        ctx.arc(0, 0, 74, -Math.PI / 2, -Math.PI / 2 + (Math.PI / 4), false);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - (animacao.frameAtual / animacao.duracao)})`;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
        const angulo = Math.sin((animacao.frameAtual / animacao.duracao) * Math.PI) * (Math.PI / 4);
        ctx.rotate(angulo);
    }
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(-6, -74, 12, 70); 
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(-16, -4, 32, 8); 
    ctx.restore(); 

    ctx.fillStyle = `hsl(200, 100%, ${Math.min(40 + jogo.herois[0].dps * 5, 80)}%)`;
    ctx.fillRect(170, 265, 60, 75);
    ctx.fillStyle = "#ffcc99";
    ctx.beginPath(); ctx.arc(200, 245, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5c3a21";
    ctx.beginPath(); ctx.arc(200, 245, 23, Math.PI, 0); ctx.fill(); 
    ctx.fillRect(180, 245, 40, 20); 

    if (jogo.herois.length > 1 && jogo.herois[1].nivelDps > 0) {
        ctx.fillStyle = "#1abc9c"; 
        ctx.fillRect(90, 265, 40, 75);
        ctx.fillStyle = "#ffcc99";
        ctx.beginPath(); ctx.arc(110, 245, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(95, 245); ctx.lineTo(75, 235); ctx.lineTo(92, 252); 
        ctx.moveTo(125, 245); ctx.lineTo(145, 235); ctx.lineTo(128, 252); 
        ctx.fill();
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath(); ctx.arc(110, 245, 21, Math.PI, 0); ctx.fill(); 
        ctx.fillRect(92, 245, 36, 45); 
        
        ctx.save();
        ctx.translate(125, 280); 
        ctx.rotate(Math.atan2(-130, 75));
        if (animacao.ativa && animacao.frameAtual < 5) ctx.translate(-5, 0);
        
        ctx.strokeStyle = "#f39c12"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(10, 0, 25, -Math.PI/2 + 0.2, Math.PI/2 - 0.2); ctx.stroke();
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(10, -24);
        const cordaX = (animacao.ativa && animacao.frameAtual >= 5) ? 10 : 0; 
        ctx.lineTo(cordaX, 0); ctx.lineTo(10, 24); ctx.stroke();
        
        ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 3; ctx.beginPath();
        if (!animacao.ativa || animacao.frameAtual < 5) {
            ctx.moveTo(cordaX, 0); ctx.lineTo(35, 0); ctx.stroke();
        } else {
            const progressoVoo = (animacao.frameAtual - 5) / (animacao.duracao - 5);
            const distanciaVoo = progressoVoo * 150;
            ctx.moveTo(distanciaVoo, 0); ctx.lineTo(distanciaVoo + 35, 0); ctx.stroke();
        }
        ctx.restore();
    }

    ctx.font = "bold 14px sans-serif";
    const textoNivel = isBoss ? `Nível ${jogo.nivel} (CHEFE)` : `Nível ${jogo.nivel}`;
    ctx.lineWidth = 3; ctx.strokeStyle = "#000";
    ctx.strokeText(textoNivel, 200 - (ctx.measureText(textoNivel).width / 2), 15);
    ctx.fillStyle = "#fff";
    ctx.fillText(textoNivel, 200 - (ctx.measureText(textoNivel).width / 2), 15);

    ctx.fillStyle = "#333"; ctx.fillRect(125, 25, 150, 10);
    ctx.fillStyle = isBoss ? "#8e44ad" : "#e74c3c"; 
    const hpPercent = Math.max(0, jogo.monstroHp / jogo.monstroHpMax);
    ctx.fillRect(125, 25, 150 * hpPercent, 10);

    for (let i = textosFlutuantes.length - 1; i >= 0; i--) {
        let flutuante = textosFlutuantes[i];
        ctx.fillStyle = `rgba(${flutuante.cor}, ${flutuante.alpha})`; 
        ctx.font = flutuante.tamanho || "bold 18px sans-serif";
        ctx.fillText(flutuante.texto, flutuante.x, flutuante.y);
        flutuante.y -= 0.6; 
        flutuante.alpha -= 1 / flutuante.duracao; 
        if (flutuante.alpha <= 0) textosFlutuantes.splice(i, 1);
    }

    requestAnimationFrame(desenhar);
}