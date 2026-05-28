import { jogo, salvarJogo } from './state.js';
import { textosFlutuantes, mostrarNotificacao } from './render.js';
import { atualizarInterface, renderizarBotoesUpgrades } from './engine.js';

export function adicionarFragmentos(heroiIndex, quantidade) {
    let heroi = jogo.herois[heroiIndex];
    heroi.fragmentos += quantidade;
    let estrelasGanhas = 0;
    while (heroi.fragmentos >= 10) {
        heroi.fragmentos -= 10;
        heroi.estrelas += 1;
        heroi.dps = Math.max(1, Math.ceil(heroi.dps * 1.5));
        estrelasGanhas++;
    }
    return estrelasGanhas;
}

export function darTiroGacha(quantidade = 1) {
    let custoTotal = quantidade * 10;
    if (jogo.gemas >= custoTotal) {
        jogo.gemas -= custoTotal;
        document.getElementById("gemas").innerText = jogo.gemas;
        
        let totalPontosGacha = 0;
        let fragmentosGanhos = {};
        let fragmentos20Ganhos = {};
        let heroisDesbloqueados = [];

        for (let i = 0; i < quantidade; i++) {
            jogo.tirosGacha++;
            let roll = Math.random();
            let isPity = jogo.tirosGacha >= 50;

            if (isPity || roll >= 0.95) {
                jogo.tirosGacha = 0; 
                let heroIndex = Math.floor(Math.random() * jogo.herois.length);
                let heroi = jogo.herois[heroIndex];
                
                if (heroi.nivelDps === 0) {
                    heroi.dps = (heroIndex === 1) ? 2 : 1; 
                    heroi.nivelDps = 1;
                    heroisDesbloqueados.push(heroi.nome);
                } else {
                    adicionarFragmentos(heroIndex, 20);
                    fragmentos20Ganhos[heroi.nome] = (fragmentos20Ganhos[heroi.nome] || 0) + 1;
                }
            } else if (roll < 0.70) {
                let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
                let ganho = (dpsTotal > 0 ? dpsTotal : 1) * 60;
                jogo.pontos += ganho;
                totalPontosGacha += ganho;
            } else {
                let heroIndex = Math.floor(Math.random() * jogo.herois.length);
                let heroi = jogo.herois[heroIndex];
                adicionarFragmentos(heroIndex, 5);
                fragmentosGanhos[heroi.nome] = (fragmentosGanhos[heroi.nome] || 0) + 1;
            }
        }

        let msg = quantidade === 1 ? "" : `--- Resultados de ${quantidade} Tiros ---\n`;
        if (heroisDesbloqueados.length > 0) msg += `🎉 Desbloqueados: ${heroisDesbloqueados.join(", ")}\n`;
        for (let h in fragmentos20Ganhos) msg += `🌟 20 Frag. Épicos para ${h} (${fragmentos20Ganhos[h]}x)\n`;
        for (let h in fragmentosGanhos) msg += `🧩 5 Fragmentos para ${h} (${fragmentosGanhos[h]}x)\n`;
        if (totalPontosGacha > 0) msg += `💰 Pontos Ganhos: ${totalPontosGacha}\n`;
        
        if (msg.trim()) mostrarNotificacao(msg.trim());

        renderizarBotoesUpgrades(); 
        atualizarInterface();
        salvarJogo();
    }
}

export function darGemasTeste() {
    if (isNaN(jogo.gemas)) jogo.gemas = 0; 
    jogo.gemas += 100;
    document.getElementById("gemas").innerText = jogo.gemas;
    atualizarInterface();
    salvarJogo();
}