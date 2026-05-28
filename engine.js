import { jogo, salvarJogo, carregarJogo, calcularHpMaximo, calcularRecompensa, resetarJogo } from './state.js';
import { darTiroGacha, darGemasTeste } from './gacha.js';
import { desenhar, textosFlutuantes, animacao } from './render.js';

export function renderizarBotoesUpgrades() {
    const painel = document.getElementById("painelUpgrades");
    if (!painel) return;
    painel.innerHTML = "";
    jogo.herois.forEach((heroi, index) => {
        if (index === 0 || heroi.nivelDps > 0) {
            const starsHTML = '⭐'.repeat(heroi.estrelas || 1);
            painel.innerHTML += `
                <div class="heroi-card">
                    <p class="heroi-stars">${starsHTML}</p>
                    <h3 class="heroi-title">${heroi.nome} <small>(${heroi.fragmentos || 0}/10)</small></h3>
                    <div class="heroi-actions">
                        <button id="btnDps_${index}" class="btn-upgrade" onclick="comprarUpgrade(${index})">
                            DPS (+1)<br><small>Nvl: <span id="nivelDps_${index}">${heroi.nivelDps}</span> | Custo: <span id="custoUpgrade_${index}">${heroi.custoDps}</span></small>
                        </button>
                        <button id="btnCrit_${index}" class="btn-upgrade btn-crit" onclick="comprarCritico(${index})">
                            Crítico +5%<br><small>Nvl: <span id="nivelCritico_${index}">${heroi.nivelCritico}</span> | Custo: <span id="custoCritico_${index}">${heroi.custoCritico}</span></small>
                        </button>
                    </div>
                </div>
            `;
        }
    });
}

export function atualizarInterface() {
    const elPontos = document.getElementById("pontos");
    if (elPontos) elPontos.innerText = Math.floor(jogo.pontos);
    
    const elGemas = document.getElementById("gemas");
    if (elGemas) elGemas.innerText = jogo.gemas;
    const elPity = document.getElementById("pityGacha");
    if (elPity) elPity.innerText = jogo.tirosGacha;
    const btnGacha = document.getElementById("btnGacha");
    if (btnGacha) btnGacha.disabled = jogo.gemas < 10;
    const btnGacha10 = document.getElementById("btnGacha10");
    if (btnGacha10) btnGacha10.disabled = jogo.gemas < 100;
    
    jogo.herois.forEach((heroi, index) => {
        const spanNivelDps = document.getElementById(`nivelDps_${index}`);
        if (spanNivelDps) {
            spanNivelDps.innerText = heroi.nivelDps;
            document.getElementById(`custoUpgrade_${index}`).innerText = heroi.custoDps;
            document.getElementById(`nivelCritico_${index}`).innerText = heroi.nivelCritico;
            document.getElementById(`custoCritico_${index}`).innerText = heroi.custoCritico;
            
            document.getElementById(`btnDps_${index}`).disabled = jogo.pontos < heroi.custoDps;
            document.getElementById(`btnCrit_${index}`).disabled = jogo.pontos < heroi.custoCritico;
        }
    });
}

// Expondo métodos na window pois módulos criam um escopo fechado e quebram os 'onclick' do HTML
window.comprarUpgrade = function(heroiIndex) {
    let heroi = jogo.herois[heroiIndex];
    if (jogo.pontos >= heroi.custoDps) {
        jogo.pontos -= heroi.custoDps;
        heroi.dps += 1;
        heroi.nivelDps += 1;
        heroi.custoDps = Math.floor(heroi.custoDps * (heroi.multCusto || 1.5));
        atualizarInterface();
        salvarJogo();
    }
};

window.comprarCritico = function(heroiIndex) {
    let heroi = jogo.herois[heroiIndex];
    if (jogo.pontos >= heroi.custoCritico) {
        jogo.pontos -= heroi.custoCritico;
        heroi.chanceCritico += 0.05;
        heroi.nivelCritico += 1;
        heroi.custoCritico = Math.floor(heroi.custoCritico * ((heroi.multCusto || 1.5) + 1.0));
        atualizarInterface();
        salvarJogo();
    }
};

window.darTiroGacha = darTiroGacha;
window.darGemasTeste = darGemasTeste;
window.resetarJogo = resetarJogo;

export function atacar(dano, isCritico = false) {
    animacao.ativa = true;
    animacao.frameAtual = 0;
    animacao.critico = isCritico;
    
    textosFlutuantes.push({
        texto: isCritico ? `CRÍTICO! -${dano}` : `-${dano}`, 
        x: 180 + (Math.random() * 40) - (isCritico ? 30 : 0),
        y: 60 + (Math.random() * 15),
        alpha: 1, duracao: isCritico ? 60 : 45,
        cor: isCritico ? "243, 156, 18" : "231, 76, 60",
        tamanho: isCritico ? "bold 22px sans-serif" : "bold 18px sans-serif"
    });

    jogo.monstroHp -= dano;
    if (jogo.monstroHp <= 0) {
        const recompensa = calcularRecompensa(jogo.nivel);
        jogo.pontos += recompensa;
        
        if (jogo.nivel % 5 === 0) {
            jogo.gemas += 5;
            textosFlutuantes.push({ texto: `+5 Gemas`, x: 170 + (Math.random() * 20), y: 60, alpha: 1, duracao: 80, cor: "155, 89, 182", tamanho: "bold 18px sans-serif" });
        }
        textosFlutuantes.push({ texto: `+${recompensa} pts`, x: 170 + (Math.random() * 20), y: 80, alpha: 1, duracao: 60, cor: "241, 196, 15" });

        jogo.nivel++;
        jogo.monstroHpMax = calcularHpMaximo(jogo.nivel);
        jogo.monstroHp = jogo.monstroHpMax;
    }
    atualizarInterface();
}

// Boot do Sistema e Bindings de Evento
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("jogoCanvas");
    if (canvas) {
        canvas.addEventListener("mousedown", () => {
            let heroi = jogo.herois[0];
            let dano = heroi.dps;
            let isCrit = Math.random() < heroi.chanceCritico;
            if (isCrit) dano *= 3;
            atacar(dano, isCrit);
        });
    }

    // Processamento de Tempo Offline (foi movido para cá na migração)
    const tempoFora = jogo.ultimoAcesso ? Math.floor((Date.now() - jogo.ultimoAcesso) / 1000) : 0;
    carregarJogo();
    if (tempoFora > 0 && jogo.pontos > 0) { // Lógica básica de retroalimentação
        let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
        let danoOffline = tempoFora * dpsTotal;
        if(danoOffline > 0) alert(`Você ficou fora por ${tempoFora} segundos e seu time progrediu!`);
    }

    setInterval(() => {
        let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
        let isCrit = Math.random() < jogo.herois[0].chanceCritico;
        let danoFinal = isCrit ? dpsTotal * 3 : dpsTotal;
        
        atacar(danoFinal, isCrit);
        salvarJogo();
    }, 1000);

    renderizarBotoesUpgrades();
    atualizarInterface();
    desenhar();
});