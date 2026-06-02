import { jogo, salvarJogo } from './state.js';
import { textosFlutuantes, mostrarNotificacao, dispararAnimacaoGacha } from './render.js';
import { atualizarInterface, renderizarBotoesUpgrades } from './engine.js';

export function adicionarFragmentos(heroiIndex, quantidade) {
    let heroi = jogo.herois[heroiIndex];
    heroi.fragmentos += quantidade;
    let gemasReembolsadas = 0;
    while (heroi.fragmentos >= 10) {
        heroi.fragmentos -= 10;
        if (heroi.estrelas < 5) {
            heroi.estrelas += 1;
            if (heroi.estrelas === 5) {
                mostrarNotificacao(`🌟 DESPERTAR MÁXIMO!\n${heroi.nome} alcançou 5 Estrelas!`);
            }
            heroi.dps = Math.max(1, Math.ceil(heroi.dps * 2.0)); // Novo scaling dobrado
        } else {
            jogo.gemas += 10; // Converte a estrela excedente em 10 gemas
            gemasReembolsadas += 10;
        }
    }
    return gemasReembolsadas;
}

export function darTiroGacha(quantidade = 1) {
    let custoTotal = quantidade * 10;
    if (jogo.gemas >= custoTotal) {
        jogo.gemas -= custoTotal;
        
        let totalPontosGacha = 0;
        let fragmentos10Ganhos = {}; // Para cópias Douradas Lendárias
        let fragmentosRoxosGanhos = {}; // Para drops Roxos (1 ou 2 frags)
        let heroisDesbloqueados = [];
        let totalGemasReembolso = 0;
        
        let highestRarity = 'azul'; 
        let bestHeroIndex = null;
        let bestIsNovo = false; // Rastreia se o melhor tiro foi inédito

        // Filtra a pool de fragmentos para heróis que o jogador já possui
        let heroisDesbloqueadosPool = [];
        jogo.herois.forEach((h, idx) => {
            if (idx === 0 || h.desbloqueada) heroisDesbloqueadosPool.push(idx);
        });
        if (heroisDesbloqueadosPool.length === 0) heroisDesbloqueadosPool.push(0);

        for (let i = 0; i < quantidade; i++) {
            jogo.tirosGacha++;
            if (jogo.totalTirosGacha === undefined) jogo.totalTirosGacha = 0;
            jogo.totalTirosGacha++;

            let roll = Math.random();
            let isPity = jogo.tirosGacha >= 50;

            // 👑 5% Chance ou Pity - Dourado Lendário
            if (isPity || roll < 0.05) { 
                jogo.tirosGacha = 0; // Reseta o Pity
                let heroIndex = Math.floor(Math.random() * jogo.herois.length);
                let heroi = jogo.herois[heroIndex];
                
                let isNovoThisRoll = false;
                if (heroi.estrelas === 0 || !heroi.desbloqueada) {
                    heroi.estrelas = 1; heroi.desbloqueada = true;
                    heroisDesbloqueados.push(heroi.nome);
                    if (!heroisDesbloqueadosPool.includes(heroIndex)) heroisDesbloqueadosPool.push(heroIndex);
                    isNovoThisRoll = true;
                } else {
                    totalGemasReembolso += adicionarFragmentos(heroIndex, 10); // Cópia repetida dá 10 Frags
                    fragmentos10Ganhos[heroi.nome] = (fragmentos10Ganhos[heroi.nome] || 0) + 1;
                }
                
                // Prioriza exibir a Splash Art de personagens NOVOS se vierem múltiplos no x10
                if (highestRarity !== 'dourado' || isNovoThisRoll) {
                    highestRarity = 'dourado';
                    bestHeroIndex = heroIndex;
                    bestIsNovo = isNovoThisRoll; 
                }
                
            // 🌟 55% Chance (25% + 30% somados) - Fragmentos Roxos (Nerfados para 1 ou 2)
            } else if (roll < 0.60) { 
                let heroIndex = heroisDesbloqueadosPool[Math.floor(Math.random() * heroisDesbloqueadosPool.length)];
                let heroi = jogo.herois[heroIndex];
                let qtdDrop = Math.random() < 0.5 ? 2 : 1; // Sorteia 1 ou 2 fragmentos
                
                totalGemasReembolso += adicionarFragmentos(heroIndex, qtdDrop);
                fragmentosRoxosGanhos[heroi.nome] = (fragmentosRoxosGanhos[heroi.nome] || 0) + qtdDrop;
                if (highestRarity === 'azul') highestRarity = 'roxo';
                
            // 💰 40% Chance - Pontos de Glintstone (Azul)
            } else { 
                let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
                let ganho = (dpsTotal > 0 ? dpsTotal : 1) * 60;
                jogo.pontos += ganho;
                totalPontosGacha += ganho;
            }
        }

        let msg = quantidade === 1 ? "" : `--- Resultados de ${quantidade} Tiros ---\n`;
        if (heroisDesbloqueados.length > 0) msg += `🎉 Desbloqueados: ${heroisDesbloqueados.join(", ")}\n`;
        for (let h in fragmentos10Ganhos) msg += `👑 10 Frag. Lendários para ${h} (${fragmentos10Ganhos[h]}x)\n`;
        for (let h in fragmentosRoxosGanhos) msg += `🧩 Fragmentos para ${h} (+${fragmentosRoxosGanhos[h]})\n`;
        if (totalPontosGacha > 0) msg += `💰 ${totalPontosGacha} Pontos de Glintstone\n`;
        if (totalGemasReembolso > 0) msg += `💎 +${totalGemasReembolso} Gemas Reembolsadas!\n`;

        salvarJogo();
        atualizarInterface();
        renderizarBotoesUpgrades();
        if (window.verificarDesbloqueios) window.verificarDesbloqueios();

        const sb = document.getElementById("sidebarAbas");
        if (sb) sb.classList.add("fechada");

        // Passamos o parâmetro bestIsNovo para a engine visual
        dispararAnimacaoGacha(highestRarity, bestHeroIndex, msg, bestIsNovo);
    } else {
        mostrarNotificacao("❌ Gemas Insuficientes!");
    }
}