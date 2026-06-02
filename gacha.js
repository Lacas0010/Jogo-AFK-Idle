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
        let fragmentosGanhos = {};
        let fragmentos20Ganhos = {};
        let heroisDesbloqueados = [];
        let totalGemasReembolso = 0;
        
        let highestRarity = 'azul'; 
        let bestHeroIndex = null;

        // --- SOLUÇÃO: Filtra a pool de fragmentos para heróis que o jogador já possui ---
        let heroisDesbloqueadosPool = [];
        jogo.herois.forEach((h, idx) => {
            if (idx === 0 || h.desbloqueada) {
                heroisDesbloqueadosPool.push(idx);
            }
        });
        if (heroisDesbloqueadosPool.length === 0) heroisDesbloqueadosPool.push(0);

        for (let i = 0; i < quantidade; i++) {
            jogo.tirosGacha++;
            if (jogo.totalTirosGacha === undefined) jogo.totalTirosGacha = 0;
            jogo.totalTirosGacha++;

            let roll = Math.random();
            if (jogo.tirosGacha >= 50) { // PITY - Dourado
                jogo.tirosGacha = 0;
                let heroIndex = Math.floor(Math.random() * jogo.herois.length);
                let heroi = jogo.herois[heroIndex];
                if (heroi.estrelas === 0 || !heroi.desbloqueada) {
                    heroi.estrelas = 1; heroi.desbloqueada = true;
                    heroisDesbloqueados.push(heroi.nome);
                    // Adiciona dinamicamente na pool caso venham fragmentos dele nos tiros restantes do mesmo x10
                    if (!heroisDesbloqueadosPool.includes(heroIndex)) heroisDesbloqueadosPool.push(heroIndex);
                } else {
                    totalGemasReembolso += adicionarFragmentos(heroIndex, 20);
                    fragmentos20Ganhos[heroi.nome] = (fragmentos20Ganhos[heroi.nome] || 0) + 1;
                }
                highestRarity = 'dourado';
                bestHeroIndex = heroIndex;
            } else if (roll < 0.05) { // 5% Personagem - Dourado (Reseta o Pity)
                jogo.tirosGacha = 0;
                let heroIndex = Math.floor(Math.random() * jogo.herois.length);
                let heroi = jogo.herois[heroIndex];
                if (heroi.estrelas === 0 || !heroi.desbloqueada) {
                    heroi.estrelas = 1; heroi.desbloqueada = true;
                    heroisDesbloqueados.push(heroi.nome);
                    if (!heroisDesbloqueadosPool.includes(heroIndex)) heroisDesbloqueadosPool.push(heroIndex);
                } else {
                    totalGemasReembolso += adicionarFragmentos(heroIndex, 20);
                    fragmentos20Ganhos[heroi.nome] = (fragmentos20Ganhos[heroi.nome] || 0) + 1;
                }
                highestRarity = 'dourado';
                bestHeroIndex = heroIndex;
            } else if (roll < 0.30) { // 25% Fragmentos Épicos (20 Frags) - Roxo
                // Sorteia o fragmento apenas dentre os heróis que o jogador possui
                let heroIndex = heroisDesbloqueadosPool[Math.floor(Math.random() * heroisDesbloqueadosPool.length)];
                let heroi = jogo.herois[heroIndex];
                totalGemasReembolso += adicionarFragmentos(heroIndex, 20);
                fragmentos20Ganhos[heroi.nome] = (fragmentos20Ganhos[heroi.nome] || 0) + 1;
                if (highestRarity === 'azul') highestRarity = 'roxo';
                // 'bestHeroIndex' removido daqui para não disparar a Splash Art por engano
            } else if (roll < 0.70) { // Pontos - Azul
                let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
                let ganho = (dpsTotal > 0 ? dpsTotal : 1) * 60;
                jogo.pontos += ganho;
                totalPontosGacha += ganho;
            } else { // 30% Chance - 5 Fragmentos - Roxo
                // Sorteia o fragmento apenas dentre os heróis que o jogador possui
                let heroIndex = heroisDesbloqueadosPool[Math.floor(Math.random() * heroisDesbloqueadosPool.length)];
                let heroi = jogo.herois[heroIndex];
                totalGemasReembolso += adicionarFragmentos(heroIndex, 5);
                fragmentosGanhos[heroi.nome] = (fragmentosGanhos[heroi.nome] || 0) + 1;
                if (highestRarity === 'azul') highestRarity = 'roxo';
                // 'bestHeroIndex' removido daqui para não disparar a Splash Art por engano
            }
        }

        let msg = quantidade === 1 ? "" : `--- Resultados de ${quantidade} Tiros ---\n`;
        if (heroisDesbloqueados.length > 0) msg += `🎉 Desbloqueados: ${heroisDesbloqueados.join(", ")}\n`;
        for (let h in fragmentos20Ganhos) msg += `🌟 20 Frag. Épicos para ${h} (${fragmentos20Ganhos[h]}x)\n`;
        for (let h in fragmentosGanhos) msg += `🧩 5 Fragmentos para ${h} (${fragmentosGanhos[h]}x)\n`;
        if (totalPontosGacha > 0) msg += `💰 ${totalPontosGacha} Pontos de Glintstone\n`;
        if (totalGemasReembolso > 0) msg += `💎 +${totalGemasReembolso} Gemas Reembolsadas!\n`;

        salvarJogo();
        atualizarInterface();
        renderizarBotoesUpgrades();
        
        if (window.verificarDesbloqueios) window.verificarDesbloqueios();

        const sb = document.getElementById("sidebarAbas");
        if (sb) sb.classList.add("fechada");

        dispararAnimacaoGacha(highestRarity, bestHeroIndex, msg);
    } else {
        mostrarNotificacao("❌ Gemas Insuficientes!");
    }
}