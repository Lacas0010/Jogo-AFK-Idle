import { jogo, salvarJogo, carregarJogo, calcularHpMaximo, calcularRecompensa, resetarJogo, executarAscensao, exportarProgressoFisico, importarProgressoFisico, formatarNumero, gerarItemLoot, calcularBonusEquipamentos } from './state.js?v=4.2';
import { darTiroGacha } from './gacha.js?v=4.2';
import { desenhar, textosFlutuantes, animacao, mostrarNotificacao, desenharPortrait, ativarJuice } from './render.js?v=4.2';

// --- CHIP DE SOM 8-BIT (SINTETIZADOR) ---
let audioCtx;
let bgmTimer; // Guarda o loop da música atual

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (window.atualizarBotoesAudio) window.atualizarBotoesAudio();
        // Inicia a música correspondente à tela se o BGM não estiver mutado
        if (!(jogo.configAudio && jogo.configAudio.bgmMudo)) {
            window.tocarBGM(jogo.estado === 'menu' ? 'menu' : 'batalha');
        }
    }
}
// Navegadores exigem interação do usuário para liberar o áudio
window.addEventListener('mousedown', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

// --- SEQUENCIADOR MUSICAL (MAESTRO) ---
window.tocarBGM = function(tema) {
    if (!audioCtx) return;
    if (bgmTimer) clearTimeout(bgmTimer); // Interrompe a música anterior
    if (jogo.configAudio && jogo.configAudio.bgmMudo) return;

    // Trilha 1: Bardo na Taverna (Calma, Acordes Arpejados)
    const notasMenu = [
        [220.0, 400], [261.6, 200], [293.7, 200], [329.6, 600],
        [293.7, 200], [261.6, 200], [246.9, 400], [220.0, 600],
        [196.0, 300], [220.0, 150], [246.9, 150], [261.6, 400],
        [246.9, 200], [220.0, 200], [196.0, 800],
        [261.6, 300], [329.6, 300], [392.0, 300], [440.0, 600],
        [392.0, 200], [349.2, 200], [329.6, 400], [293.7, 600],
        [261.6, 200], [293.7, 200], [329.6, 200], [349.2, 200],
        [329.6, 200], [293.7, 200], [261.6, 800],
        [220.0, 300], [246.9, 150], [261.6, 150], [293.7, 400],
        [261.6, 200], [246.9, 200], [220.0, 300],
        [196.0, 200], [220.0, 1000]
    ];

    // Trilha 2: Combate Iminente (Urgente, Staccato, Escala Menor)
    const notasBatalha = [
        [164.8, 100], [196.0, 100], [246.9, 100], [196.0, 100],
        [164.8, 100], [155.6, 100], [164.8, 300],
        [0, 100],
        [246.9, 100], [293.7, 100], [329.6, 100], [293.7, 100],
        [246.9, 200], [220.0, 100], [196.0, 100], [164.8, 300],
        [0, 100],
        [329.6, 100], [329.6, 100], [329.6, 100], [349.2, 100],
        [329.6, 200], [293.7, 100], [261.6, 100],
        [246.9, 100], [196.0, 100], [246.9, 500],
        [0, 100],
        [196.0, 100], [220.0, 100], [246.9, 100], [261.6, 100],
        [293.7, 100], [329.6, 100], [349.2, 100], [392.0, 100],
        [440.0, 100], [392.0, 100], [349.2, 100], [329.6, 100],
        [293.7, 200], [246.9, 200], [220.0, 100], [196.0, 700]
    ];

    let melodia = tema === 'menu' ? notasMenu : notasBatalha;
    let tipoOnda = tema === 'menu' ? 'triangle' : 'square'; // Triangle soa como cordas/alaúde. Square é ríspido.
    let volMax = tema === 'menu' ? 0.08 : 0.04; 
    let index = 0;

    function tocarProximaNota() {
        // Trava de segurança: para a música se a tela mudou subitamente
        if (tema === 'menu' && jogo.estado !== 'menu') return;
        if (tema === 'batalha' && jogo.estado !== 'jogando') return;

        let [freq, dur] = melodia[index];
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();

        osc.type = tipoOnda;
        osc.frequency.value = freq;
        osc.connect(gain); gain.connect(audioCtx.destination);

        let agora = audioCtx.currentTime;
        
        // Envelope Acústico: Como a nota nasce e morre
        gain.gain.setValueAtTime(0, agora);
        gain.gain.linearRampToValueAtTime(volMax, agora + 0.05); // Attack da palhetada
        
        if (tema === 'menu') {
            gain.gain.exponentialRampToValueAtTime(0.001, agora + (dur / 1000) - 0.05); // Deixa o som das cordas morrerem lentamente (Sustain)
        } else {
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.1); // Corta o som agressivamente (Staccato de batalha)
        }

        osc.start(agora); osc.stop(agora + (dur / 1000));

        index = (index + 1) % melodia.length; // Loop infinito
        bgmTimer = setTimeout(tocarProximaNota, dur); // Agenda a próxima nota exatamente no tempo do BPM
    }

    tocarProximaNota();
};

window.tocarSom = function(tipo) {
    if (!audioCtx) return;
    if (jogo.configAudio && jogo.configAudio.sfxMudo) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    let agora = audioCtx.currentTime;
    
    if (tipo === 'ataque') { // Som de corte rápido (Espada/Adaga)
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, agora); osc.frequency.exponentialRampToValueAtTime(50, agora + 0.1);
        gain.gain.setValueAtTime(0.08, agora); gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.1);
        osc.start(agora); osc.stop(agora + 0.1);
    } else if (tipo === 'moeda') { // Som de Plim (Ouro/Morte)
        osc.type = 'sine'; osc.frequency.setValueAtTime(1200, agora); osc.frequency.setValueAtTime(1800, agora + 0.05);
        gain.gain.setValueAtTime(0.05, agora); gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.3);
        osc.start(agora); osc.stop(agora + 0.3);
    } else if (tipo === 'laser') { // Som sci-fi/arcano (Mago)
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(600, agora); osc.frequency.linearRampToValueAtTime(150, agora + 0.2);
        gain.gain.setValueAtTime(0.05, agora); gain.gain.linearRampToValueAtTime(0.01, agora + 0.2);
        osc.start(agora); osc.stop(agora + 0.2);
    } else if (tipo === 'impacto') { // Som pesado (Escudada/Explosão da Ladra)
        osc.type = 'square'; osc.frequency.setValueAtTime(100, agora); osc.frequency.exponentialRampToValueAtTime(20, agora + 0.3);
        gain.gain.setValueAtTime(0.15, agora); gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.3);
        osc.start(agora); osc.stop(agora + 0.3);
    }
};

window.toggleBGM = function() {
    if (!audioCtx) initAudio();
    if (!jogo.configAudio) jogo.configAudio = { bgmMudo: false, sfxMudo: false };
    jogo.configAudio.bgmMudo = !jogo.configAudio.bgmMudo;
    if (jogo.configAudio.bgmMudo) {
        if (bgmTimer) clearTimeout(bgmTimer);
    } else {
        window.tocarBGM(jogo.estado === 'menu' ? 'menu' : 'batalha');
    }
    window.atualizarBotoesAudio();
    salvarJogo();
};

window.toggleSFX = function() {
    if (!audioCtx) initAudio();
    if (!jogo.configAudio) jogo.configAudio = { bgmMudo: false, sfxMudo: false };
    jogo.configAudio.sfxMudo = !jogo.configAudio.sfxMudo;
    window.atualizarBotoesAudio();
    salvarJogo();
};

window.atualizarBotoesAudio = function() {
    const isBgmMudo = jogo.configAudio && jogo.configAudio.bgmMudo;
    const isSfxMudo = jogo.configAudio && jogo.configAudio.sfxMudo;

    const botoesBgm = document.querySelectorAll(".btn-toggle-bgm");
    botoesBgm.forEach(btn => {
        btn.innerText = isBgmMudo ? "🔇 BGM: Off" : "🎵 BGM: On";
        btn.style.opacity = isBgmMudo ? "0.6" : "1";
    });

    const botoesSfx = document.querySelectorAll(".btn-toggle-sfx");
    botoesSfx.forEach(btn => {
        btn.innerText = isSfxMudo ? "🔇 SFX: Off" : "🔊 SFX: On";
        btn.style.opacity = isSfxMudo ? "0.6" : "1";
    });
};

const custosAlmasBase = [1, 2, 1, 2, 5, 2, 1024];

const configMarcos = {
    cliques: { titulo: "Dedo Nervoso", desc: "Cliques Manuais", limites: [100, 500, 1000, 5000, 10000], premioBase: 50, valorAtual: () => jogo.cliquesTotais },
    mortes: { titulo: "Caçador Implacável", desc: "Monstros Derrotados", limites: [50, 200, 500, 2000, 5000], premioBase: 50, valorAtual: () => jogo.monstrosMortos },
    nivel: { titulo: "Aventureiro Audaz", desc: "Nível Alcançado", limites: [10, 30, 50, 100, 200], premioBase: 100, valorAtual: () => jogo.nivelMaximo || jogo.nivel },
    gacha: { titulo: "Sorte Grande", desc: "Tiros no Altar", limites: [10, 50, 100, 500, 1000], premioBase: 50, valorAtual: () => jogo.totalTirosGacha || jogo.tirosGacha }
};

function verificarMarcos() {
    let ganhouGemas = false;
    for (const chave in configMarcos) {
        const conf = configMarcos[chave];
        const tierAtual = jogo.marcos[chave];
        if (tierAtual < conf.limites.length) {
            const meta = conf.limites[tierAtual];
            if (conf.valorAtual() >= meta) {
                const premio = conf.premioBase * (tierAtual + 1);
                jogo.gemas += premio;
                jogo.marcos[chave]++;
                mostrarNotificacao(`🏆 MARCO ATINGIDO!\n${conf.titulo} Nvl ${tierAtual + 1}\n+${premio} Gemas`);
                ganhouGemas = true;
            }
        }
    }
    if (ganhouGemas) {
        atualizarInterface();
        if (window.renderizarMarcos) window.renderizarMarcos();
    }
}

export function renderizarBotoesUpgrades() {
    const painel = document.getElementById("painelUpgrades");
    if (!painel) return;
    painel.innerHTML = "";
    jogo.herois.forEach((heroi, index) => {
        if (jogo.timeAtivo.includes(index) && (index === 0 || heroi.desbloqueada || heroi.nivelDps > 0)) {
            const starsHTML = '⭐'.repeat(heroi.estrelas || 1);
            painel.innerHTML += `
                <div class="heroi-card">
                    <p class="heroi-stars">${starsHTML}</p>
                    <h3 class="heroi-title">${heroi.nome} <small>(${heroi.fragmentos || 0}/10)</small></h3>
                    <p style="font-style: italic; font-size: 12px; color: #5c3a21; margin: 2px 0 10px 0;">${heroi.descricao}</p>
                        <div class="heroi-actions-group" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                        <button id="btnDps_${index}" class="btn-upgrade" onclick="comprarUpgrade(${index})">
                            DPS (+1)<br><small>Nvl: <span id="nivelDps_${index}">${heroi.nivelDps}</span> | Custo: <span id="custoUpgrade_${index}">${formatarNumero(heroi.custoDps)}</span></small>
                        </button>
                        <button id="btnCrit_${index}" class="btn-upgrade btn-crit" onclick="comprarCritico(${index})">
                            Crítico +5%<br><small>Nvl: <span id="nivelCritico_${index}">${heroi.nivelCritico}</span> | Custo: <span id="custoCritico_${index}">${formatarNumero(heroi.custoCritico)}</span></small>
                        </button>
                    </div>
                    ${heroi.skills ? heroi.skills.map((skill, sIdx) => {
                        let descUpgrade = skill.multiplicadorDanoInstantaneo !== undefined ? "+5 Mult. Burst" : (skill.multiplicadorDpsAtivo !== undefined ? "+20% DPS Ativo" : "+1 Mult. Dano");
                        return `
                            <div class="skill-upgrade-block" style="margin-top: 10px; border-top: 1px dashed rgba(92,58,33,0.3); padding-top: 10px;">
                                <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #a04000;">Melhorar ${skill.nome}</h4>
                                <p style="font-style: italic; font-size: 12px; color: #5c3a21; margin: 2px 0 10px 0;">${skill.descricao}</p>
                                <button id="btnUpgradeSkill_${index}_${sIdx}" class="btn-upgrade" style="background: #c0392b; color: white; width: 100%;" onclick="comprarUpgradeSkill(${index}, ${sIdx})">
                                    ${descUpgrade}<br><small>Nvl: <span id="nivelSkill_${index}_${sIdx}">${skill.nivel || 1}</span> | Custo: <span id="custoSkill_${index}_${sIdx}">${formatarNumero(skill.custoUpgrade || 100)}</span></small>
                                </button>
                            </div>
                        `;
                    }).join('') : ''}
                </div>
            `;
        }
    });
}

function renderizarStatusHerois() {
    const painel = document.getElementById("statusHerois");
    if (!painel) return;
    
    painel.innerHTML = "";
    
    jogo.herois.forEach((heroi, index) => {
        if (jogo.timeAtivo.includes(index) && (index === 0 || heroi.desbloqueada || heroi.nivelDps > 0)) {
            const chanceCrit = Math.round(heroi.chanceCritico * 100);
            painel.innerHTML += `
                <div class="heroi-card" style="margin-bottom: 10px; text-align: left;">
                        <canvas id="portrait_${index}" class="portrait-canvas" width="90" height="90"></canvas>
                        <div class="status-info" style="display: flex; flex-direction: column; text-align: left; gap: 4px; flex: 1;">
                            <h3 class="heroi-title" style="margin: 0 0 5px 0;">${heroi.nome} ${'⭐'.repeat(heroi.estrelas || 1)}</h3>
                            <p style="font-style: italic; font-size: 12px; color: #5c3a21; margin: 0;">${heroi.descricao}</p>
                            ${heroi.skills && heroi.skills[0] ? `<p style="font-style: italic; font-size: 12px; color: #5c3a21; margin: 0 0 5px 0;"><strong>Skill:</strong> ${heroi.skills[0].descricao}</p>` : ''}
                            <p style="margin: 2px 0; font-size: 14px;"><strong>DPS Base:</strong> ${heroi.dps}</p>
                            <p style="margin: 2px 0; font-size: 14px;"><strong>Chance de Crítico:</strong> ${chanceCrit}%</p>
                            <p style="margin: 2px 0; font-size: 14px;"><strong>Nível DPS:</strong> ${heroi.nivelDps}</p>
                            <p style="margin: 2px 0; font-size: 14px;"><strong>Nível Crítico:</strong> ${heroi.nivelCritico}</p>
                        </div>
                </div>
            `;
        }
    });

    jogo.herois.forEach((heroi, index) => {
        if (jogo.timeAtivo.includes(index) && (index === 0 || heroi.desbloqueada || heroi.nivelDps > 0)) {
            desenharPortrait(`portrait_${index}`, index);
        }
    });
}

window.escolherTalento = function(heroiIndex, opcao) {
    let heroi = jogo.herois[heroiIndex];
    if (!heroi || !heroi.especializacoes || !heroi.especializacoes[opcao]) return;
    heroi.talento = opcao;
    salvarJogo();
    renderizarPainelEquipe();
    if (window.renderizarBotoesUpgrades) window.renderizarBotoesUpgrades();
    mostrarNotificacao(`🌳 ${heroi.nome}\nEspecialização: ${heroi.especializacoes[opcao].nome}!`);
    if (window.tocarSom) window.tocarSom('ouro');
};

export function renderizarPainelEquipe() {
    const painel = document.getElementById("painelGerenciarEquipe");
    if (!painel) return;

    const spanTamanho = document.getElementById("tamanhoTime");
    if (spanTamanho) spanTamanho.innerText = jogo.timeAtivo.length;

    painel.innerHTML = "";
    jogo.herois.forEach((heroi, index) => {
        if (index === 0 || heroi.desbloqueada || heroi.nivelDps > 0) {
            const noTime = jogo.timeAtivo.includes(index);
            const podeEscalar = jogo.timeAtivo.length < 3;
            const ehPrincipal = index === 0;

            let btnHTML = "";
            if (noTime) {
                btnHTML = `<button class="btn-upgrade" style="background: ${ehPrincipal ? '#7f8c8d' : '#e74c3c'}; color: white; padding: 6px 12px; font-size: 12px;" onclick="alternarHeroiNoTime(${index})" ${ehPrincipal ? 'disabled' : ''}>${ehPrincipal ? 'Obrigatório' : 'Remover'}</button>`;
            } else {
                btnHTML = `<button class="btn-upgrade" style="background: #2ecc71; color: white; padding: 6px 12px; font-size: 12px;" onclick="alternarHeroiNoTime(${index})" ${!podeEscalar ? 'disabled' : ''}>Escalar</button>`;
            }

            let talentosHTML = "";
            if (heroi.especializacoes) {
                const espA = heroi.especializacoes.A;
                const espB = heroi.especializacoes.B;
                const ativoA = heroi.talento === 'A';
                const ativoB = heroi.talento === 'B';

                talentosHTML = `
                    <div class="talentos-container">
                        <div class="talentos-header">
                            <span>🌳 <strong>Especialização de Classe</strong></span>
                            <span style="font-size: 10px; color: ${heroi.talento ? '#2ecc71' : '#f39c12'};">
                                ${heroi.talento ? `Ramo [${heroi.talento}] Ativo` : 'Escolha uma Especialização'}
                            </span>
                        </div>
                        <div class="talentos-grid">
                            <button class="btn-talento ${ativoA ? 'ativo' : ''}" onclick="window.escolherTalento(${index}, 'A')">
                                <span class="talento-nome">${espA.nome} ${ativoA ? '✓' : ''}</span>
                                <span class="talento-desc">${espA.desc}</span>
                            </button>
                            <button class="btn-talento ${ativoB ? 'ativo' : ''}" onclick="window.escolherTalento(${index}, 'B')">
                                <span class="talento-nome">${espB.nome} ${ativoB ? '✓' : ''}</span>
                                <span class="talento-desc">${espB.desc}</span>
                            </button>
                        </div>
                    </div>
                `;
            }

            painel.innerHTML += `
                <div class="heroi-card" style="width: 100%; max-width: 440px; text-align: left; margin: 0 auto 10px auto; padding: 12px; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <div>
                            <h3 style="margin: 0; color: #f1c40f; font-size: 15px;">${heroi.nome}</h3>
                            <small style="color: #bdc3c7;">Nvl DPS: ${heroi.nivelDps} | ${'⭐'.repeat(heroi.estrelas || 1)}</small>
                        </div>
                        ${btnHTML}
                    </div>
                    ${talentosHTML}
                </div>
            `;
        }
    });

    renderizarPainelEquipamentos();
}

export function renderizarPainelEquipamentos() {
    const el = document.getElementById("painelEquipamentos");
    if (!el) return;

    if (!jogo.equipamentos) {
        jogo.equipamentos = { inventario: [], equipados: { arma: null, armadura: null, amuleto: null }, poDeForja: 0 };
    }
    if (!jogo.equipamentos.equipados) jogo.equipamentos.equipados = { arma: null, armadura: null, amuleto: null };
    if (!jogo.equipamentos.inventario) jogo.equipamentos.inventario = [];
    if (jogo.equipamentos.poDeForja === undefined) jogo.equipamentos.poDeForja = 0;

    let bonus = calcularBonusEquipamentos();

    let html = `
        <div style="background: rgba(0,0,0,0.35); border: 1px solid #5c3a21; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="color: #f1c40f; font-weight: bold; font-size: 13px;">✨ Pó de Forja: <strong>${jogo.equipamentos.poDeForja}</strong></span>
                <span style="font-size: 11px; color: #bdc3c7;">Itens na Mochila: ${jogo.equipamentos.inventario.length}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px 14px; font-size: 11px; color: #2ecc71;">
                ${bonus.dpsBonus > 0 ? `<span>⚔️ +${Math.round(bonus.dpsBonus)}% DPS</span>` : ''}
                ${bonus.danoClique > 0 ? `<span>👆 +${Math.round(bonus.danoClique)}% Clique</span>` : ''}
                ${bonus.critChance > 0 ? `<span>🎯 +${Math.round(bonus.critChance * 100)}% Crítico</span>` : ''}
                ${bonus.critDano > 0 ? `<span>💥 +${Math.round(bonus.critDano * 100)}% Dano Crítico</span>` : ''}
                ${bonus.ouroBonus > 0 ? `<span>💰 +${Math.round(bonus.ouroBonus * 100)}% Ouro</span>` : ''}
                ${bonus.reducaoCd > 0 ? `<span>⏳ +${Math.round(bonus.reducaoCd * 100)}% Recarga Rápida</span>` : ''}
                ${bonus.danoChefe > 1 ? `<span style="color: #f39c12;">👑 x${bonus.danoChefe} vs Chefes</span>` : ''}
                ${bonus.passivas.length > 0 ? `<div style="width: 100%; color: #f1c40f; font-style: italic; margin-top: 4px;">Passivas: ${bonus.passivas.join(' | ')}</div>` : ''}
            </div>
        </div>
    `;

    const slots = [
        { slot: 'arma', label: 'Arma', iconeDef: '⚔️' },
        { slot: 'armadura', label: 'Armadura', iconeDef: '🛡️' },
        { slot: 'amuleto', label: 'Amuleto', iconeDef: '💍' }
    ];

    html += `<div class="equip-slots-container">`;
    slots.forEach(s => {
        let item = jogo.equipamentos.equipados[s.slot];
        if (item) {
            let nvlUp = item.nivelUpgrade || 0;
            let custoUp = 10 * Math.pow(2, nvlUp);
            let podeUp = jogo.equipamentos.poDeForja >= custoUp && nvlUp < 10;
            let afixosHTML = item.afixos.map(a => {
                let valComUp = Math.round(a.valor * (1 + nvlUp * 0.15));
                return `<div class="equip-afixo">• +${valComUp}% ${a.tipo === 'dpsBonus' ? 'DPS' : (a.tipo === 'danoClique' ? 'Clique' : (a.tipo === 'critChance' ? 'Crítico' : (a.tipo === 'critDano' ? 'Dano Crítico' : (a.tipo === 'ouroBonus' ? 'Ouro' : 'Recarga'))))}</div>`;
            }).join('');

            html += `
                <div class="equip-slot raridade-${item.raridade}">
                    <div>
                        <div style="font-size: 26px;">${item.icone}</div>
                        <strong style="font-size: 13px; color: #fff;">${item.nome} ${nvlUp > 0 ? `<span style="color: #f1c40f;">+${nvlUp}</span>` : ''}</strong>
                        <div><span class="tag-raridade ${item.raridade}">${item.raridade}</span></div>
                        <div style="margin: 8px 0; text-align: left;">${afixosHTML}</div>
                        ${item.passivaLendaria ? `<div class="equip-passiva-lendaria">⭐ ${item.passivaLendaria}</div>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 10px;">
                        <button class="btn-upgrade" style="font-size: 10px; padding: 4px 6px; background: ${podeUp ? '#e67e22' : '#7f8c8d'};" onclick="window.aprimorarEquipado('${s.slot}')" ${!podeUp ? 'disabled' : ''}>
                            ${nvlUp >= 10 ? 'Nível Máximo' : `Aprimorar (${custoUp} Pó)`}
                        </button>
                        <button class="btn-crit" style="font-size: 10px; padding: 4px 6px; background: #c0392b;" onclick="window.desequiparItem('${s.slot}')">
                            Desequipar
                        </button>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="equip-slot vazio">
                    <div style="font-size: 28px; opacity: 0.35;">${s.iconeDef}</div>
                    <span style="color: #7f8c8d; font-size: 12px; margin-top: 5px;">${s.label} Vazio</span>
                </div>
            `;
        }
    });
    html += `</div>`;

    html += `<h3 style="color: #f1c40f; margin: 15px 0 10px 0; font-size: 15px;">📦 Mochila de Equipamentos (${jogo.equipamentos.inventario.length})</h3>`;

    if (jogo.equipamentos.inventario.length === 0) {
        html += `<p style="color: #7f8c8d; font-style: italic; font-size: 12px; text-align: center;">Mochila vazia. Derrote Chefes a cada 5 níveis para obter saques preciosos!</p>`;
    } else {
        html += `<div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 5px;">`;
        jogo.equipamentos.inventario.forEach(item => {
            let poReciclar = item.raridade === 'lendario' ? 100 : (item.raridade === 'epico' ? 40 : (item.raridade === 'raro' ? 15 : 5));
            let afixosTxt = item.afixos.map(a => a.desc).join(' | ');

            html += `
                <div class="equip-item-card raridade-${item.raridade}">
                    <div style="font-size: 24px; min-width: 30px; text-align: center;">${item.icone}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <strong style="color: #fff; font-size: 13px;">${item.nome}</strong>
                            <span class="tag-raridade ${item.raridade}">${item.raridade}</span>
                            <span style="color: #bdc3c7; font-size: 10px;">(Nvl ${item.nivelItem})</span>
                        </div>
                        <div style="font-size: 11px; color: #2ecc71; margin-top: 2px;">${afixosTxt}</div>
                        ${item.passivaLendaria ? `<div class="equip-passiva-lendaria">⭐ ${item.passivaLendaria}</div>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; min-width: 90px;">
                        <button class="btn-upgrade" style="font-size: 11px; padding: 4px 8px; background: #27ae60;" onclick="window.equiparItem('${item.id}')">
                            Equipar
                        </button>
                        <button class="btn-crit" style="font-size: 10px; padding: 3px 6px; background: #7f8c8d;" onclick="window.desmantelarItem('${item.id}')">
                            Reciclar (+${poReciclar})
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    el.innerHTML = html;
}

window.equiparItem = function(idItem) {
    if (!jogo.equipamentos) return;
    let idx = jogo.equipamentos.inventario.findIndex(it => it.id === idItem);
    if (idx === -1) return;
    let item = jogo.equipamentos.inventario[idx];

    let itemEquipadoAtual = jogo.equipamentos.equipados[item.tipo];
    if (itemEquipadoAtual) {
        jogo.equipamentos.inventario.push(itemEquipadoAtual);
    }

    jogo.equipamentos.equipados[item.tipo] = item;
    jogo.equipamentos.inventario.splice(idx, 1);

    if (window.tocarSom) window.tocarSom('levelup');
    salvarJogo();
    renderizarPainelEquipamentos();
    atualizarInterface();
};

window.desequiparItem = function(slot) {
    if (!jogo.equipamentos || !jogo.equipamentos.equipados[slot]) return;
    jogo.equipamentos.inventario.push(jogo.equipamentos.equipados[slot]);
    jogo.equipamentos.equipados[slot] = null;
    salvarJogo();
    renderizarPainelEquipamentos();
    atualizarInterface();
};

window.desmantelarItem = function(idItem) {
    if (!jogo.equipamentos) return;
    let idx = jogo.equipamentos.inventario.findIndex(it => it.id === idItem);
    if (idx === -1) return;
    let item = jogo.equipamentos.inventario[idx];
    let poGanho = item.raridade === 'lendario' ? 100 : (item.raridade === 'epico' ? 40 : (item.raridade === 'raro' ? 15 : 5));
    jogo.equipamentos.poDeForja = (jogo.equipamentos.poDeForja || 0) + poGanho;
    jogo.equipamentos.inventario.splice(idx, 1);
    if (window.tocarSom) window.tocarSom('moeda');
    salvarJogo();
    renderizarPainelEquipamentos();
};

window.desmantelarComuns = function() {
    if (!jogo.equipamentos || !jogo.equipamentos.inventario.length) return;
    let comuns = jogo.equipamentos.inventario.filter(it => it.raridade === 'comum');
    if (!comuns.length) {
        mostrarNotificacao("Nenhum item Comum encontrado na mochila.");
        return;
    }
    let poTotal = comuns.length * 5;
    jogo.equipamentos.inventario = jogo.equipamentos.inventario.filter(it => it.raridade !== 'comum');
    jogo.equipamentos.poDeForja = (jogo.equipamentos.poDeForja || 0) + poTotal;
    if (window.tocarSom) window.tocarSom('moeda');
    mostrarNotificacao(`♻️ ${comuns.length} itens Comuns reciclados!\n+${poTotal} Pó de Forja`);
    salvarJogo();
    renderizarPainelEquipamentos();
};

window.aprimorarEquipado = function(slot) {
    if (!jogo.equipamentos || !jogo.equipamentos.equipados[slot]) return;
    let item = jogo.equipamentos.equipados[slot];
    let nvl = item.nivelUpgrade || 0;
    let custo = 10 * Math.pow(2, nvl);
    if (jogo.equipamentos.poDeForja < custo) {
        mostrarNotificacao(`Pó de Forja insuficiente! Necessário: ${custo}`);
        return;
    }
    jogo.equipamentos.poDeForja -= custo;
    item.nivelUpgrade = nvl + 1;
    if (window.tocarSom) window.tocarSom('levelup');
    mostrarNotificacao(`✨ ${item.nome} aprimorado para +${item.nivelUpgrade}!\n+15% em todos os atributos`);
    salvarJogo();
    renderizarPainelEquipamentos();
    atualizarInterface();
};

window.autoEquiparMelhores = function() {
    if (!jogo.equipamentos) return;
    const slots = ['arma', 'armadura', 'amuleto'];
    const pesoRaridade = { comum: 1, raro: 3, epico: 6, lendario: 12 };
    let trocou = false;

    slots.forEach(slot => {
        let candidatos = jogo.equipamentos.inventario.filter(it => it.tipo === slot);
        if (!candidatos.length) return;

        candidatos.sort((a, b) => {
            let scoreA = (pesoRaridade[a.raridade] || 1) * 100 + (a.nivelItem || 1) + (a.nivelUpgrade || 0) * 15;
            let scoreB = (pesoRaridade[b.raridade] || 1) * 100 + (b.nivelItem || 1) + (b.nivelUpgrade || 0) * 15;
            return scoreB - scoreA;
        });

        let melhor = candidatos[0];
        let atual = jogo.equipamentos.equipados[slot];
        let scoreAtual = atual ? (pesoRaridade[atual.raridade] || 1) * 100 + (atual.nivelItem || 1) + (atual.nivelUpgrade || 0) * 15 : 0;
        let scoreMelhor = (pesoRaridade[melhor.raridade] || 1) * 100 + (melhor.nivelItem || 1) + (melhor.nivelUpgrade || 0) * 15;

        if (scoreMelhor > scoreAtual) {
            window.equiparItem(melhor.id);
            trocou = true;
        }
    });

    if (trocou) {
        mostrarNotificacao("⚡ Melhores equipamentos equipados com sucesso!");
    } else {
        mostrarNotificacao("Seus heróis já estão usando os melhores equipamentos da mochila!");
    }
};

export function renderizarListaPremiosGacha() {
    const painel = document.getElementById("listaPremiosGacha");
    if (!painel) return;

    painel.innerHTML = "";
    const funcoes = [
        "",
        "🎯 Burst Rápido",
        "🔮 Conjurador Cósmico",
        "🛡️ Baluarte Tático",
        "☠️ Assassina DoT",
        "✨ Curador & Suporte Solar",
        "🩸 Berserker Executor"
    ];

    for (let i = 1; i < jogo.herois.length; i++) {
        let heroi = jogo.herois[i];
        let funcao = funcoes[i] || "Herói";
        painel.innerHTML += `
            <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; border-left: 4px solid #8e44ad;">
                <strong style="color: #2c1d11; font-size: 14px;">${heroi.nome} ${'⭐'.repeat(heroi.estrelas || 1)}</strong>
                <span style="font-size: 11px; background: #8e44ad; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 5px; box-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${funcao}</span>
                <p style="margin: 5px 0; font-style: italic; color: #5c3a21; line-height: 1.4;">${heroi.descricao}</p>
                <p style="margin: 0; font-size: 11px; color: #a04000;"><strong>🎯 Probabilidade:</strong> 2% Personagem Lendário / 38% Fragmentos | Pity garantido aos 50 Tiros.</p>
            </div>
        `;
    }
}

export function renderizarLojaSantuario() {
    const painel = document.getElementById("painelSantuario"); // Certifique-se que no seu HTML o interior da aba tenha id="painelSantuario"
    if (!painel) return;

    const descricoes = [
        "Poder Primordial: +10% Dano de Clique",
        "Visão Letal: +2% Chance de Crítico Global",
        "Riqueza Abissal: +1 Gema bônus nos Chefes",
        "Fluxo Temporal: Acelera recarga de habilidades",
        "Conjurador Automático: Ativa habilidades automaticamente",
        "Avareza Poligonal: +10% Pontos de Monstros",
        "Dedo Fantasma: Auto-Clicker (5/seg)"
    ];

    const podeAscender = jogo.nivel >= 30;

    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #9b59b6; margin-bottom: 10px;">✨ Almas Poligonais Disponíveis: ${jogo.almasPoligonais || 0}</h3>
            <h4 style="color: #f1c40f; margin-top: 0; margin-bottom: 15px;">🌌 Multiplicador de Ascensão Atual: ${jogo.multiplicadorAscensao || 1}x</h4>
            <button id="btnAscensão" class="btn-upgrade" style="background: #9b59b6; max-width: 300px; width: 100%; margin: 0 auto;" onclick="ascender()" ${podeAscender ? "" : "disabled"}>
                ${podeAscender ? "Realizar Ascensão Cósmica" : "Bloqueado (Chegue ao Nível 30)"}
            </button>
        </div>
    `;
    html += `<div class="painel-upgrades">`;

    for (let i = 0; i < 7; i++) {
        let nivel = jogo.upgradesAlmas[i] || 0;
        let custo = (i === 4 || i === 6) ? custosAlmasBase[i] : custosAlmasBase[i] * Math.pow(2, nivel); // Custo dobra a cada nível comprado, exceto auto-cast e clicker
        let maxNivel = (i === 4 || i === 6) && nivel >= 1;
        let podeComprar = (jogo.almasPoligonais || 0) >= custo && !maxNivel;
        let podeInteragir = podeComprar || ((i === 4 || i === 6) && maxNivel);
        
        let textBotao;
        let corBotao;
        if ((i === 4 || i === 6) && maxNivel) {
            let ligado = i === 4 ? (jogo.autoCastAtivo !== false) : (jogo.autoClickerAtivo !== false);
            textBotao = ligado ? "🤖 LIGADO (Desligar)" : "🤖 DESLIGADO (Ligar)";
            corBotao = ligado ? "#2ecc71" : "#e74c3c";
        } else {
            textBotao = `Melhorar (Nvl ${nivel})<br><small>Custo: ✨ ${custo}</small>`;
            corBotao = podeComprar ? '#9b59b6' : '#7f8c8d';
        }

        html += `
            <div class="heroi-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px; border-color: #9b59b6;">
                <h4 style="margin: 0; color: #f1c40f; font-size: 14px;">${descricoes[i].split(':')[0]}</h4>
                <p style="margin: 0; font-size: 12px; color: #5c3a21; font-style: italic;">${descricoes[i].split(':')[1]}</p>
                <button class="btn-upgrade" style="background: ${corBotao}; width: 100%; margin-top: auto;" onclick="comprarUpgradeAlma(${i})" ${!podeInteragir ? 'disabled' : ''}>
                    ${textBotao}
                </button>
            </div>
        `;
    }
    html += `</div>`;
    painel.innerHTML = html;
}

export function renderizarForja() {
    const painel = document.getElementById("painelForja");
    if (!painel) return;

    let html = `
        <div style="text-align: center; margin-bottom: 20px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px dashed #5c3a21;">
            <h3 style="color: #f1c40f; margin: 0 0 10px 0; font-size: 15px;">Seu Inventário</h3>
            <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 15px; font-size: 13px;">
                <span style="color: #d35400;">📦 Couro de Orc: <strong id="qtdCouroForja">${jogo.inventario.couroOrc || 0}</strong></span>
                <span style="color: #8e44ad;">🧪 Escama de Hidra: <strong id="qtdEscamaForja">${jogo.inventario.escamasHidra || 0}</strong></span>
                <span style="color: #c0392b;">🔥 Dente de Dragão: <strong id="qtdDenteForja">${jogo.inventario.denteDragao || 0}</strong></span>
            </div>
            <p style="color: #f1c40f; font-size: 13px; margin: 10px 0 0 0;">Pontos Atuais: <strong>${Math.floor(jogo.pontos).toLocaleString('pt-BR')}</strong></p>
        </div>
    `;

    let nvlManopla = jogo.artefatos.manoplaOrc || 0;
    let custoItemManopla = 3 + (nvlManopla * 2);
    let custoPontosManopla = 1000 * Math.pow(5, nvlManopla);
    let podeForjarManopla = jogo.inventario.couroOrc >= custoItemManopla && jogo.pontos >= custoPontosManopla;
    let textoBtnManopla = nvlManopla === 0 ? `Forjar (📦 ${custoItemManopla} | 💰 ${custoPontosManopla.toLocaleString('pt-BR')})` : `Melhorar Nvl ${nvlManopla} -> ${nvlManopla + 1} (📦 ${custoItemManopla} | 💰 ${custoPontosManopla.toLocaleString('pt-BR')})`;
    let corBtnManopla = podeForjarManopla ? "#d35400" : "#7f8c8d";

    html += `
        <div class="heroi-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <h4 style="margin: 0; color: #f1c40f; font-size: 15px;">🧤 Manopla Feroz do Orc (Nvl ${nvlManopla})</h4>
            <p style="margin: 0; font-size: 13px; color: #5c3a21; font-style: italic;">Efeito Atual: +${nvlManopla * 2}s na duração das habilidades.<br>Próximo Nível: +${(nvlManopla + 1) * 2}s</p>
            <button class="btn-upgrade" style="background: ${corBtnManopla}; width: 100%; margin-top: auto;" onclick="forjarArtefato('manoplaOrc')" ${!podeForjarManopla ? 'disabled' : ''}>
                ${textoBtnManopla}
            </button>
        </div>
    `;

    let nvlGlandula = jogo.artefatos.glandulaHidra || 0;
    let custoItemGlandula = 3 + (nvlGlandula * 2);
    let custoPontosGlandula = 1000 * Math.pow(5, nvlGlandula);
    let podeForjarGlandula = jogo.inventario.escamasHidra >= custoItemGlandula && jogo.pontos >= custoPontosGlandula;
    let textoBtnGlandula = nvlGlandula === 0 ? `Forjar (🧪 ${custoItemGlandula} | 💰 ${custoPontosGlandula.toLocaleString('pt-BR')})` : `Melhorar Nvl ${nvlGlandula} -> ${nvlGlandula + 1} (🧪 ${custoItemGlandula} | 💰 ${custoPontosGlandula.toLocaleString('pt-BR')})`;
    let corBtnGlandula = podeForjarGlandula ? "#8e44ad" : "#7f8c8d";

    html += `
        <div class="heroi-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <h4 style="margin: 0; color: #f1c40f; font-size: 15px;">🧪 Glândula Tóxica da Hidra (Nvl ${nvlGlandula})</h4>
            <p style="margin: 0; font-size: 13px; color: #5c3a21; font-style: italic;">Efeito Atual: -${nvlGlandula * 2}s de Cooldown nas habilidades.<br>Próximo Nível: -${(nvlGlandula + 1) * 2}s</p>
            <button class="btn-upgrade" style="background: ${corBtnGlandula}; width: 100%; margin-top: auto;" onclick="forjarArtefato('glandulaHidra')" ${!podeForjarGlandula ? 'disabled' : ''}>
                ${textoBtnGlandula}
            </button>
        </div>
    `;

    let nvlCristal = jogo.artefatos.cristalDragao || 0;
    let custoItemCristal = 3 + (nvlCristal * 2);
    let custoPontosCristal = 1000 * Math.pow(5, nvlCristal);
    let podeForjarCristal = jogo.inventario.denteDragao >= custoItemCristal && jogo.pontos >= custoPontosCristal;
    let textoBtnCristal = nvlCristal === 0 ? `Forjar (🔥 ${custoItemCristal} | 💰 ${custoPontosCristal.toLocaleString('pt-BR')})` : `Melhorar Nvl ${nvlCristal} -> ${nvlCristal + 1} (🔥 ${custoItemCristal} | 💰 ${custoPontosCristal.toLocaleString('pt-BR')})`;
    let corBtnCristal = podeForjarCristal ? "#c0392b" : "#7f8c8d";

    html += `
        <div class="heroi-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <h4 style="margin: 0; color: #f1c40f; font-size: 15px;">💎 Cristal Ígneo do Dragão (Nvl ${nvlCristal})</h4>
            <p style="margin: 0; font-size: 13px; color: #5c3a21; font-style: italic;">Efeito Atual: Multiplicador Crítico Base ${3 + nvlCristal}x.<br>Próximo Nível: ${4 + nvlCristal}x</p>
            <button class="btn-upgrade" style="background: ${corBtnCristal}; width: 100%; margin-top: auto;" onclick="forjarArtefato('cristalDragao')" ${!podeForjarCristal ? 'disabled' : ''}>
                ${textoBtnCristal}
            </button>
        </div>
    `;

    painel.innerHTML = html;
}

export function renderizarGuilda() {
    const painel = document.getElementById("painelGuilda");
    if (!painel) return;

    let html = `
        <div style="width: 100%; text-align: left; margin-bottom: 20px;">
            <h3 style="color: #f1c40f; border-bottom: 1px dashed #5c3a21; padding-bottom: 5px;">Contratos Diários</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
    `;

    jogo.guilda.contratos.forEach((contrato, i) => {
        let textBtn, corBtn, disabled, clickAction;
        if (contrato.resgatado) {
            textBtn = "Concluído";
            corBtn = "#7f8c8d";
            disabled = true;
            clickAction = "";
        } else if (contrato.atual >= contrato.meta) {
            textBtn = `Resgatar (${contrato.premioGemas} Gemas)`;
            corBtn = "#2ecc71";
            disabled = false;
            clickAction = `resgatarContrato(${i})`;
        } else {
            textBtn = `${contrato.atual} / ${contrato.meta}`;
            corBtn = "#e67e22";
            disabled = true;
            clickAction = "";
        }

        html += `
            <div class="heroi-card">
                <h4 style="margin: 0; color: #f1c40f;">${contrato.desc}</h4>
                <button class="btn-upgrade" style="background: ${corBtn}; width: 100%; margin-top: 10px;" ${disabled ? 'disabled' : ''} onclick="${clickAction}">
                    ${textBtn}
                </button>
            </div>
        `;
    });

    html += `
            </div>
        </div>
        <div style="width: 100%; text-align: left;">
            <h3 style="color: #f1c40f; border-bottom: 1px dashed #5c3a21; padding-bottom: 5px;">Expedição de Heróis</h3>
            <div class="heroi-card" style="display: flex; flex-direction: column; gap: 10px;">
    `;

    if (!jogo.guilda.expedicao.ativa) {
        let options = "";
        let temDisponivel = false;
        jogo.herois.forEach((heroi, i) => {
            if ((i === 0 || heroi.desbloqueada || heroi.nivelDps > 0) && !jogo.timeAtivo.includes(i)) {
                options += `<option value="${i}">${heroi.nome} (DPS: ${heroi.dps})</option>`;
                temDisponivel = true;
            }
        });

        if (temDisponivel) {
            html += `
                <p style="margin: 0; font-size: 13px; color: #5c3a21;">Envie um herói inativo para buscar tesouros. Recompensa baseada no DPS.</p>
                <select id="selectExpedicao" style="padding: 8px; border-radius: 4px; border: 1px solid #5c3a21; background: #f4eccf; color: #2c1d11; font-family: 'Georgia', serif;">
                    ${options}
                </select>
                <button class="btn-upgrade" style="background: #3498db; width: 100%;" onclick="iniciarExpedicao(parseInt(document.getElementById('selectExpedicao').value))">
                    Enviar Herói (1 Hora)
                </button>
            `;
        } else {
            html += `<p style="margin: 0; font-size: 13px; color: #5c3a21;">Nenhum herói disponível. Desbloqueie mais heróis ou remova alguém do time ativo.</p>`;
        }
    } else {
        let heroi = jogo.herois[jogo.guilda.expedicao.heroiIndex];
        let tempoRestante = Math.max(0, jogo.guilda.expedicao.tempoFim - Date.now());
        
        if (tempoRestante > 0) {
            let min = Math.floor(tempoRestante / 60000);
            let seg = Math.floor((tempoRestante % 60000) / 1000);
            html += `
                <h4 style="margin: 0; color: #3498db;">${heroi.nome} está explorando...</h4>
                <p style="margin: 0; font-size: 14px; color: #e67e22;">Restam: ${min}m ${seg}s</p>
                <button class="btn-upgrade" style="background: #7f8c8d; width: 100%;" disabled>Em andamento...</button>
            `;
        } else {
            html += `
                <h4 style="margin: 0; color: #2ecc71;">A expedição de ${heroi.nome} terminou!</h4>
                <button class="btn-upgrade" style="background: #f1c40f; color: #111; width: 100%;" onclick="resgatarExpedicao()">
                    Resgatar Tesouro
                </button>
            `;
        }
    }

    html += `
            </div>
        </div>
    `;

    painel.innerHTML = html;
}

export function renderizarMascotes() {
    const painel = document.getElementById("painelMascotes");
    if (!painel) return;
    
    let html = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;
    
    jogo.mascotes.forEach((pet, i) => {
        let btnAcao = "";
        if (!pet.desbloqueado) {
            let custo = 100 * (i + 1);
            let podeComprar = jogo.gemas >= custo;
            btnAcao = `<button class="btn-upgrade" style="background: ${podeComprar ? '#9b59b6' : '#7f8c8d'}; width: 100%;" onclick="comprarMascote(${i})" ${!podeComprar ? 'disabled' : ''}>Comprar Ovo (${custo} Gemas)</button>`;
        } else {
            let corBtn = pet.ativo ? "#e74c3c" : "#2ecc71";
            let textoBtn = pet.ativo ? "Recolher" : "Equipar";
            btnAcao = `<button class="btn-upgrade" style="background: ${corBtn}; width: 100%;" onclick="alternarMascote(${i})">${textoBtn}</button>`;
        }
        
        html += `
            <div class="heroi-card" style="border: ${pet.ativo ? '2px solid #2ecc71' : '1px solid #5c3a21'};">
                <h4 style="margin: 0; color: #f1c40f;">${pet.nome}</h4>
                <p style="font-size: 13px; color: #5c3a21; font-style: italic; margin: 5px 0;">${pet.aura}</p>
                ${btnAcao}
            </div>
        `;
    });
    
    html += `</div>`;
    painel.innerHTML = html;
}

export function renderizarTorre() {
    const painel = document.getElementById("painelTorre");
    if (!painel) return;
    
    let isImuneFisico = jogo.torreAbismo.andarAtual % 5 === 0;
    let isImuneMagico = jogo.torreAbismo.andarAtual % 7 === 0;
    
    let html = `
        <div class="heroi-card" style="text-align: center;">
            <h3 style="color: #e74c3c;">Andar Atual: ${jogo.torreAbismo.andarAtual}</h3>
            ${isImuneFisico ? '<p style="color: #c0392b; font-weight: bold;">⚠️ Imunidade a Dano Físico neste andar!</p>' : ''}
            ${isImuneMagico ? '<p style="color: #8e44ad; font-weight: bold;">⚠️ Imunidade a Dano Mágico neste andar!</p>' : ''}
            <button class="btn-upgrade" style="background: ${jogo.torreAbismo.ativa ? '#e74c3c' : '#c0392b'}; width: 100%; font-size: 18px; padding: 15px; margin-top: 15px;" onclick="iniciarTorre()">
                ${jogo.torreAbismo.ativa ? 'Batalha em Andamento...' : 'Desafiar Andar'}
            </button>
            ${jogo.torreAbismo.ativa ? '<button class="btn-upgrade" style="background: #7f8c8d; width: 100%; margin-top: 10px;" onclick="fugirTorre()">Fugir</button>' : ''}
        </div>
    `;
    painel.innerHTML = html;
}

let estadoDadosTaverna = {
    rolando: false,
    dadosJogador: [3, 4],
    dadosAnao: [2, 5],
    ultimoResultado: null
};

export function renderizarTaverna() {
    const painel = document.getElementById("painelTaverna");
    if (!painel) return;

    let dJ1 = estadoDadosTaverna.dadosJogador[0];
    let dJ2 = estadoDadosTaverna.dadosJogador[1];
    let dA1 = estadoDadosTaverna.dadosAnao[0];
    let dA2 = estadoDadosTaverna.dadosAnao[1];
    let totJ = dJ1 + dJ2;
    let totA = dA1 + dA2;

    let resultadoHTML = "";
    if (estadoDadosTaverna.ultimoResultado) {
        let res = estadoDadosTaverna.ultimoResultado;
        let classeBadge = res.tipo === 'jackpot' ? 'resultado-jackpot' : (res.tipo === 'vitoria' ? 'resultado-vitoria' : (res.tipo === 'empate' ? 'resultado-vitoria' : 'resultado-derrota'));
        resultadoHTML = `
            <div class="resultado-dados-badge ${classeBadge}">
                ${res.texto}
            </div>
        `;
    }

    let hidromelInfo = "";
    if (jogo.buffsAtivos && jogo.buffsAtivos.hidromel > 0) {
        hidromelInfo = `<p style="color: #2ecc71; font-weight: bold; font-size: 12px; margin: 5px 0;">🍺 Caneca de Hidromel Ativa: +40% Ouro e +20% Dano (${Math.ceil(jogo.buffsAtivos.hidromel)}s restantes)</p>`;
    }

    let html = `
        <!-- MINA DA TAVERNA -->
        <div class="taverna-card">
            <h3 style="color: #f1c40f; margin: 0 0 5px 0; font-size: 18px;">⛏️ Mina da Taverna</h3>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #ecf0f1;">
                Energia da Taverna: <strong style="color: #f1c40f;">${jogo.taverna.energia}</strong> / ${jogo.taverna.energiaMaxima} 
                <small style="color: #bdc3c7;">(Recarrega 1 a cada 60s)</small>
            </p>
            <div style="width: 100%; height: 18px; background: #2c1d11; border-radius: 9px; margin: 10px 0; overflow: hidden; border: 1px solid #5c3a21;">
                <div style="width: ${jogo.taverna.hpPedra}%; height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); transition: width 0.15s;"></div>
            </div>
            <button class="btn-upgrade" style="background: #2980b9; width: 100%; padding: 14px; font-size: 18px;" onclick="baterPedra()">
                ⛏️ MINERAR ROCHA DE GEMAS!
            </button>
        </div>

        <!-- MESA DE DADOS DOS ANÕES -->
        <div class="taverna-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <h3 style="color: #f1c40f; margin: 0; font-size: 18px;">🎲 Mesa dos Anões (Dwarf Dice)</h3>
                <span style="font-size: 11px; color: #bdc3c7;">Mestre: Balin Barba-de-Ferro</span>
            </div>
            <p style="font-size: 12px; color: #d4af37; margin: 0 0 10px 0;">Role 2 dados contra o anão. Obtenha soma maior para ganhar prêmios. Duplos 6-6 ou 1-1 ativam o JACKPOT!</p>

            <div class="mesa-dados-feltro">
                <div class="dado-lado">
                    <span style="font-size: 12px; font-weight: bold; color: #ecf0f1;">🧙 Sua Rolagem</span>
                    <div class="dado-grupo">
                        <div class="dado-cubo ${estadoDadosTaverna.rolando ? 'dado-animando' : ''}">${dJ1}</div>
                        <div class="dado-cubo ${estadoDadosTaverna.rolando ? 'dado-animando' : ''}">${dJ2}</div>
                    </div>
                    <span style="color: #f1c40f; font-weight: bold; font-size: 13px;">Total: ${totJ}</span>
                </div>

                <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">VS</div>

                <div class="dado-lado">
                    <span style="font-size: 12px; font-weight: bold; color: #ecf0f1;">🧔 Balin (Anão)</span>
                    <div class="dado-grupo">
                        <div class="dado-cubo anao ${estadoDadosTaverna.rolando ? 'dado-animando' : ''}">${dA1}</div>
                        <div class="dado-cubo anao ${estadoDadosTaverna.rolando ? 'dado-animando' : ''}">${dA2}</div>
                    </div>
                    <span style="color: #e67e22; font-weight: bold; font-size: 13px;">Total: ${totA}</span>
                </div>
            </div>

            ${resultadoHTML}

            <div class="botoes-aposta-grid">
                <button class="btn-upgrade" style="background: #27ae60;" onclick="window.jogarDadosAnao('energia')" ${estadoDadosTaverna.rolando ? 'disabled' : ''}>
                    🍺 Aposta Simples<br><small>1 Energia (+15 Gemas / +5 Pó)</small>
                </button>
                <button class="btn-upgrade" style="background: #f39c12; color: #111;" onclick="window.jogarDadosAnao('ouro')" ${estadoDadosTaverna.rolando ? 'disabled' : ''}>
                    💰 Aposta Dourada<br><small>1.000 Ouro (+2.500 Ouro / +2 Gemas)</small>
                </button>
                <button class="btn-upgrade" style="background: #8e44ad;" onclick="window.jogarDadosAnao('gemas')" ${estadoDadosTaverna.rolando ? 'disabled' : ''}>
                    💎 Aposta de Gemas<br><small>10 Gemas (+25 Gemas / +10 Pó)</small>
                </button>
            </div>
        </div>

        <!-- HIDROMEL DA TAVERNA -->
        <div class="taverna-card" style="margin-bottom: 0;">
            <h3 style="color: #f1c40f; margin: 0 0 5px 0; font-size: 18px;">🍺 Barril de Hidromel dos Anões</h3>
            <p style="font-size: 12px; color: #ecf0f1; margin: 0 0 10px 0;">Beba uma caneca artesanal para ganhar +40% de Ouro e +20% de Dano de toda a equipe durante 3 minutos.</p>
            ${hidromelInfo}
            <button class="btn-upgrade" style="background: #e67e22; width: 100%; padding: 10px; font-size: 15px;" onclick="window.beberHidromel()">
                🍺 Beber Caneca de Hidromel (2 Energias da Taverna)
            </button>
        </div>
    `;
    painel.innerHTML = html;
}

window.jogarDadosAnao = function(tipo) {
    if (estadoDadosTaverna.rolando) return;
    
    if (tipo === 'energia') {
        if (jogo.taverna.energia < 1) {
            mostrarNotificacao("❌ Sem Energia da Taverna suficiente!");
            return;
        }
        jogo.taverna.energia--;
    } else if (tipo === 'ouro') {
        if (jogo.pontos < 1000) {
            mostrarNotificacao("❌ Ouro insuficiente (Precisa de 1.000)!");
            return;
        }
        jogo.pontos -= 1000;
    } else if (tipo === 'gemas') {
        if (jogo.gemas < 10) {
            mostrarNotificacao("❌ Gemas insuficientes (Precisa de 10)!");
            return;
        }
        jogo.gemas -= 10;
    }
    
    estadoDadosTaverna.rolando = true;
    if (window.tocarSom) window.tocarSom('impacto');
    renderizarTaverna();
    
    let rolls = 0;
    let animInterval = setInterval(() => {
        estadoDadosTaverna.dadosJogador = [Math.floor(1 + Math.random() * 6), Math.floor(1 + Math.random() * 6)];
        estadoDadosTaverna.dadosAnao = [Math.floor(1 + Math.random() * 6), Math.floor(1 + Math.random() * 6)];
        renderizarTaverna();
        rolls++;
        if (rolls >= 6) {
            clearInterval(animInterval);
            estadoDadosTaverna.rolando = false;
            
            let d1 = Math.floor(1 + Math.random() * 6);
            let d2 = Math.floor(1 + Math.random() * 6);
            let a1 = Math.floor(1 + Math.random() * 6);
            let a2 = Math.floor(1 + Math.random() * 6);
            
            estadoDadosTaverna.dadosJogador = [d1, d2];
            estadoDadosTaverna.dadosAnao = [a1, a2];
            
            let totJ = d1 + d2;
            let totA = a1 + a2;
            
            let isDouble = (d1 === d2) && (d1 === 6 || d1 === 1);
            if (isDouble) {
                jogo.gemas += 50;
                let dropJackpot = gerarItemLoot(Math.max(1, jogo.nivel));
                dropJackpot.raridade = Math.random() < 0.6 ? 'lendario' : 'epico';
                if (!jogo.equipamentos.inventario) jogo.equipamentos.inventario = [];
                jogo.equipamentos.inventario.push(dropJackpot);
                
                estadoDadosTaverna.ultimoResultado = {
                    texto: `👑 JACKPOT DOS ANÕES! Duplos [${d1}-${d2}]! +50 Gemas & ${dropJackpot.nome} (${dropJackpot.raridade})!`,
                    tipo: 'jackpot'
                };
                mostrarNotificacao(`👑 JACKPOT DOS ANÕES!\n50 Gemas e ${dropJackpot.nome}!`);
                if (window.tocarSom) window.tocarSom('ouro');
            } else if (totJ > totA) {
                let recompensaTxt = "";
                if (tipo === 'energia') {
                    jogo.gemas += 15;
                    jogo.equipamentos.poDeForja = (jogo.equipamentos.poDeForja || 0) + 5;
                    recompensaTxt = "+15 Gemas e +5 Pó de Forja";
                } else if (tipo === 'ouro') {
                    jogo.pontos += 2500;
                    jogo.gemas += 2;
                    recompensaTxt = "+2.500 Ouro e +2 Gemas";
                } else if (tipo === 'gemas') {
                    jogo.gemas += 25;
                    jogo.equipamentos.poDeForja = (jogo.equipamentos.poDeForja || 0) + 10;
                    recompensaTxt = "+25 Gemas e +10 Pó de Forja";
                }
                estadoDadosTaverna.ultimoResultado = {
                    texto: `🎉 VITÓRIA! (${totJ} vs ${totA}) Você ganhou ${recompensaTxt}!`,
                    tipo: 'vitoria'
                };
                mostrarNotificacao(`🎉 Vitória nos Dados!\n${recompensaTxt}`);
                if (window.tocarSom) window.tocarSom('ouro');
            } else if (totJ === totA) {
                if (tipo === 'energia') jogo.taverna.energia++;
                else if (tipo === 'ouro') jogo.pontos += 1000;
                else if (tipo === 'gemas') jogo.gemas += 10;
                
                estadoDadosTaverna.ultimoResultado = {
                    texto: `⚖️ EMPATE! (${totJ} vs ${totA}) Aposta devolvida pelo Anão!`,
                    tipo: 'empate'
                };
            } else {
                estadoDadosTaverna.ultimoResultado = {
                    texto: `💀 DERROTA! Balin venceu (${totA} vs ${totJ}). "Beba mais hidromel e tente de novo, viajante!"`,
                    tipo: 'derrota'
                };
            }
            
            salvarJogo();
            atualizarInterface();
            renderizarTaverna();
        }
    }, 80);
};

window.beberHidromel = function() {
    if (jogo.taverna.energia >= 2) {
        jogo.taverna.energia -= 2;
        jogo.buffsAtivos.hidromel = 180;
        mostrarNotificacao("🍺 Caneca de Hidromel Esvaziada!\n+40% de Ouro e +20% de Dano por 3m!");
        if (window.tocarSom) window.tocarSom('ouro');
        salvarJogo();
        atualizarInterface();
        renderizarTaverna();
    } else {
        mostrarNotificacao("❌ Precisa de pelo menos 2 Energias da Taverna!");
    }
};


export function atualizarInterface() {
    const elPontos = document.getElementById("pontos");
    if (elPontos) {
        elPontos.innerText = formatarNumero(jogo.pontos);
        elPontos.title = Math.floor(jogo.pontos).toLocaleString('pt-BR');
    }
    
    const elGemas = document.getElementById("gemas");
    if (elGemas) elGemas.innerText = formatarNumero(jogo.gemas);
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
            const elCustoDps = document.getElementById(`custoUpgrade_${index}`);
            if (elCustoDps) {
                elCustoDps.innerText = formatarNumero(heroi.custoDps);
                elCustoDps.title = Math.floor(heroi.custoDps).toLocaleString('pt-BR');
            }
            document.getElementById(`nivelCritico_${index}`).innerText = heroi.nivelCritico;
            const elCustoCrit = document.getElementById(`custoCritico_${index}`);
            if (elCustoCrit) {
                elCustoCrit.innerText = formatarNumero(heroi.custoCritico);
                elCustoCrit.title = Math.floor(heroi.custoCritico).toLocaleString('pt-BR');
            }
            
            document.getElementById(`btnDps_${index}`).disabled = jogo.pontos < heroi.custoDps;
            document.getElementById(`btnCrit_${index}`).disabled = jogo.pontos < heroi.custoCritico;
        }
        if (heroi.skills) {
            heroi.skills.forEach((skill, sIdx) => {
                const spanNivelSkill = document.getElementById(`nivelSkill_${index}_${sIdx}`);
                if (spanNivelSkill) {
                    spanNivelSkill.innerText = skill.nivel || 1;
                    const elCustoSkill = document.getElementById(`custoSkill_${index}_${sIdx}`);
                    if (elCustoSkill) {
                        elCustoSkill.innerText = formatarNumero(skill.custoUpgrade || 100);
                        elCustoSkill.title = Math.floor(skill.custoUpgrade || 100).toLocaleString('pt-BR');
                    }
                    document.getElementById(`btnUpgradeSkill_${index}_${sIdx}`).disabled = jogo.pontos < (skill.custoUpgrade || 100);
                }
            });
        }
    });

    if (window.atualizarBotoesAudio) window.atualizarBotoesAudio();

    const prefixos = ["🔥", "🏹", "🔮", "⚙️", "☠️", "🌟", "🩸"];

    for (let index = 0; index < jogo.herois.length; index++) {
        const btnSkill = document.getElementById(`btnSkill_${index}_0`);
        if (btnSkill) {
            if (jogo.timeAtivo.includes(index) && jogo.herois[index] && (index === 0 || jogo.herois[index].desbloqueada || jogo.herois[index].nivelDps > 0) && jogo.herois[index].skills && jogo.herois[index].skills[0]) {
                btnSkill.style.display = "inline-block";
                let skill = jogo.herois[index].skills[0];
                let icone = prefixos[index];
                
                if (skill.ativa) {
                    btnSkill.innerText = `${icone} ATIVA (${skill.duracaoAtual}s)`;
                    btnSkill.disabled = true;
                } else if (skill.cooldownAtual > 0) {
                    btnSkill.innerText = `⏳ Aguarde (${Math.ceil(skill.cooldownAtual)}s)`;
                    btnSkill.disabled = true;
                } else {
                    btnSkill.innerText = skill.nome;
                    btnSkill.disabled = false;
                }
            } else {
                btnSkill.style.display = "none";
            }
        }
    }

    const abaStatus = document.getElementById("abaStatus");
    if (abaStatus && abaStatus.classList.contains("active")) {
        renderizarStatusHerois();
    }
    
    const abaSantuario = document.getElementById("abaSantuario");
    if (abaSantuario && abaSantuario.classList.contains("active")) {
        renderizarLojaSantuario();
    }
    
    const abaMascotes = document.getElementById("abaMascotes");
    if (abaMascotes && abaMascotes.classList.contains("active")) {
        renderizarMascotes();
    }
    
    const abaTorre = document.getElementById("abaTorre");
    if (abaTorre && abaTorre.classList.contains("active")) {
        renderizarTorre();
    }

    const abaTaverna = document.getElementById("abaTaverna");
    if (abaTaverna && abaTaverna.classList.contains("active")) {
        renderizarTaverna();
    }
    
    const elCouro = document.getElementById("qtdCouro");
    if (elCouro) elCouro.innerText = jogo.inventario.couroOrc || 0;
    const elEscama = document.getElementById("qtdEscama");
    if (elEscama) elEscama.innerText = jogo.inventario.escamasHidra || 0;
    const elDente = document.getElementById("qtdDente");
    if (elDente) elDente.innerText = jogo.inventario.denteDragao || 0;

    const elCouroForja = document.getElementById("qtdCouroForja");
    if (elCouroForja) elCouroForja.innerText = jogo.inventario.couroOrc || 0;
    const elEscamaForja = document.getElementById("qtdEscamaForja");
    if (elEscamaForja) elEscamaForja.innerText = jogo.inventario.escamasHidra || 0;
    const elDenteForja = document.getElementById("qtdDenteForja");
    if (elDenteForja) elDenteForja.innerText = jogo.inventario.denteDragao || 0;

    // Sincronizar visibilidade das abas
    Object.keys(jogo.desbloqueios).forEach(id => {
        let btn = document.getElementById("btnAba_" + id);
        if (btn) {
            if (jogo.desbloqueios[id]) {
                btn.classList.remove("aba-bloqueada");
                btn.style.display = "block";
            } else {
                btn.style.display = "none";
            }
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

window.comprarUpgradeSkill = function(heroiIndex, skillIndex) {
    let skill = jogo.herois[heroiIndex].skills[skillIndex];
    if (jogo.pontos >= skill.custoUpgrade) {
        jogo.pontos -= skill.custoUpgrade;
        skill.nivel = (skill.nivel || 1) + 1;
        if (skill.multiplicadorDano !== undefined) {
            skill.multiplicadorDano += 1;
        }
        if (skill.multiplicadorDanoInstantaneo !== undefined) {
            skill.multiplicadorDanoInstantaneo += 5;
        }
        if (skill.multiplicadorDanoMultiHit !== undefined) {
            skill.multiplicadorDanoMultiHit += 1;
        }
        if (skill.multiplicadorDpsAtivo !== undefined) {
            skill.multiplicadorDpsAtivo += 0.2; // Aumenta 20% do buff a cada nível
        }
        if (skill.nivel % 5 === 0) skill.duracaoMax += 1; // +1 Segundo a cada 5 níveis
        skill.custoUpgrade = Math.floor((skill.custoUpgrade || 100) * (skill.multCusto || 1.8));
        atualizarInterface();
        salvarJogo();
    }
};

window.comprarUpgradeAlma = function(upgradeId) {
    let nivelAtual = jogo.upgradesAlmas[upgradeId] || 0;
    
    if (upgradeId === 4 && nivelAtual >= 1) {
        jogo.autoCastAtivo = jogo.autoCastAtivo === false ? true : false;
        atualizarInterface();
        salvarJogo();
        return;
    }
    if (upgradeId === 6 && nivelAtual >= 1) {
        jogo.autoClickerAtivo = jogo.autoClickerAtivo === false ? true : false;
        atualizarInterface();
        salvarJogo();
        return;
    }
    
    let custo = (upgradeId === 4 || upgradeId === 6) ? custosAlmasBase[upgradeId] : custosAlmasBase[upgradeId] * Math.pow(2, nivelAtual);
    
    if ((jogo.almasPoligonais || 0) >= custo && (upgradeId !== 4 && upgradeId !== 6 || nivelAtual < 1)) {
        jogo.almasPoligonais -= custo;
        jogo.upgradesAlmas[upgradeId] = nivelAtual + 1;
        if (upgradeId === 4) jogo.autoCastAtivo = true;
        if (upgradeId === 6) jogo.autoClickerAtivo = true;
        atualizarInterface();
        salvarJogo();
    }
};

    // Função helper para o tutorial
    window.mostrarTutorial = function(id, titulo, msg) {
        // Reutilizamos a lógica do Pergaminho que já criamos anteriormente
        let el = document.getElementById("painelOffline");
        if(el) {
            el.innerHTML = `<div class="pergaminho"><h2>${titulo}</h2><p>${msg}</p>
            <button class="btn-upgrade" onclick="window.fecharRelatorioOffline()">Entendido</button></div>`;
            el.classList.remove("escondido");
        }
    };

    window.verificarDesbloqueios = function() {
        // Trava de segurança para Saves Antigos
        if (!jogo.desbloqueios) jogo.desbloqueios = { equipe: false, gacha: false, forja: false, marcos: false, guilda: false, santuario: false, pantheon: false, frestas: false, mascotes: false, torre: false, taverna: false };
        let mudou = false;

        // 0. Desbloquear Básicos (Ao derrotar o 1º Chefe e chegar ao Nível 6)
        if (!jogo.desbloqueios.gacha && jogo.nivel > 5) {
            jogo.desbloqueios.gacha = true;
            jogo.desbloqueios.forja = true;
            jogo.desbloqueios.marcos = true;
            jogo.desbloqueios.guilda = true;
            window.mostrarTutorial("gacha", "🌟 O Mundo se Expande", "O primeiro chefe caiu! O Altar de Gacha, a Forja de itens, a Guilda e os Marcos estão agora abertos para você explorar.");
            mudou = true;
        }

        // 1. Desbloquear Equipe (Ao ter 2 heróis)
        if (!jogo.desbloqueios.equipe && jogo.herois.filter((h, index) => index === 0 || h.desbloqueada).length >= 2) {
            jogo.desbloqueios.equipe = true;
            window.mostrarTutorial("equipe", "🛡️ Equipe", "Agora você pode alternar entre seus heróis para usar habilidades diferentes!");
            mudou = true;
        }

        // 2. Desbloquear Taverna (Nível 15)
        if (!jogo.desbloqueios.taverna && jogo.nivel >= 15) {
            jogo.desbloqueios.taverna = true;
            window.mostrarTutorial("taverna", "🍺 A Taverna da Cidade", "Você descobriu a Taverna! Aqui você pode relaxar e minerar rochas sagradas para extrair Gemas preciosas.");
            mudou = true;
        }

        // 3. Desbloquear Mascotes (Nível 25)
        if (!jogo.desbloqueios.mascotes && jogo.nivel >= 25) {
            jogo.desbloqueios.mascotes = true;
            window.mostrarTutorial("mascotes", "🐾 Santuário de Mascotes", "Criaturas místicas agora podem ser chocadas e acompanhar seus heróis em campo com auras poderosas!");
            mudou = true;
        }

        // 4. Desbloquear Santuário (Nível 31)
        if (!jogo.desbloqueios.santuario && jogo.nivel >= 31) {
            jogo.desbloqueios.santuario = true;
            window.mostrarTutorial("santuario", "✨ Santuário", "O Santuário foi revelado! Aqui você canaliza Almas Poligonais para buffs globais.");
            mudou = true;
        }

        // 5. Desbloquear Panteão, Frestas e Torre do Abismo (Primeira Ascensão ou Nível 35)
        if (!jogo.desbloqueios.pantheon && jogo.multiplicadorAscensao > 1) {
            jogo.desbloqueios.pantheon = true;
            jogo.desbloqueios.frestas = true;
            jogo.desbloqueios.torre = true;
            window.mostrarTutorial("pantheon", "🏛️ Desafios Dimensionais", "Os Deuses notaram sua ascensão! O Panteão, as Frestas e a Torre do Abismo estão abertos para você testar seus limites.");
            mudou = true;
        } else if (!jogo.desbloqueios.torre && (jogo.multiplicadorAscensao > 1 || jogo.nivel >= 35)) {
            jogo.desbloqueios.torre = true;
            mudou = true;
        }

        if (mudou) atualizarInterface();
    };

window.jogo = jogo;

window.iniciarJogo = function() {
    jogo.estado = 'jogando';
    document.getElementById("menuInicial").style.display = "none";
    document.body.classList.remove("tela-inicio");
    
    // Revela a Interface
    const elSkills = document.getElementById("painelSkills");
    if (elSkills) elSkills.style.opacity = "1"; 
    const btnSidebar = document.getElementById("btnToggleSidebar");
    if (btnSidebar) btnSidebar.style.display = ""; 
    
    // Abre o relatório offline pendente, se houver
    if (window.dadosOfflinePendente) {
        window.mostrarRelatorioOffline(window.dadosOfflinePendente.tempo, window.dadosOfflinePendente.monstros, window.dadosOfflinePendente.pontos);
        window.dadosOfflinePendente = null;
    }
    
    window.tocarBGM('batalha'); // Troca a trilha sonora de forma perfeitamente síncrona
    if (window.tocarSom) window.tocarSom('ataque'); 
};

window.darTiroGacha = darTiroGacha;
window.resetarJogo = resetarJogo;
window.ascender = executarAscensao;
window.exportarSaveFisico = exportarProgressoFisico;
window.importarSaveFisico = importarProgressoFisico;
window.carregarJogo = carregarJogo;
window.renderizarForja = renderizarForja;
window.renderizarGuilda = renderizarGuilda;
window.renderizarMascotes = renderizarMascotes;
window.renderizarTorre = renderizarTorre;
window.renderizarTaverna = renderizarTaverna;

window.comprarMascote = function(index) {
    let custo = 100 * (index + 1);
    if (jogo.gemas >= custo && !jogo.mascotes[index].desbloqueado) {
        jogo.gemas -= custo;
        jogo.mascotes[index].desbloqueado = true;
        mostrarNotificacao(`🐣 Mascote Adquirido!\n${jogo.mascotes[index].nome} se juntou ao grupo.`);
        atualizarInterface();
        if (window.renderizarMascotes) window.renderizarMascotes();
        salvarJogo();
    }
};

window.alternarMascote = function(index) {
    if (jogo.mascotes[index].ativo) {
        jogo.mascotes[index].ativo = false;
        mostrarNotificacao(`🐾 ${jogo.mascotes[index].nome} retornou para o descanso.`);
    } else {
        jogo.mascotes.forEach(m => m.ativo = false); // Apenas 1 pet ativo por vez
        jogo.mascotes[index].ativo = true;
        mostrarNotificacao(`✨ ${jogo.mascotes[index].nome} equipado!\nAura ativa: ${jogo.mascotes[index].aura}`);
    }
    atualizarInterface();
    if (window.renderizarMascotes) window.renderizarMascotes();
    salvarJogo();
};

window.iniciarTorre = function() {
    if (!jogo.torreAbismo.ativa) {
        if (jogo.frestaDesafio && jogo.frestaDesafio.ativa) {
            jogo.frestaDesafio.ativa = false;
        }
        jogo.torreAbismo.ativa = true;
        let hpTorre = Math.floor(50 * Math.pow(1.8, jogo.torreAbismo.andarAtual));
        jogo.monstroHpMax = hpTorre;
        jogo.monstroHp = hpTorre;
        atualizarInterface();
        if (window.renderizarTorre) window.renderizarTorre();
        mostrarNotificacao(`🗼 Desafiando o Andar ${jogo.torreAbismo.andarAtual} da Torre do Abismo!`);
        const sb = document.getElementById("sidebarAbas");
        if (sb) sb.classList.add("fechada");
    }
};

window.fugirTorre = function() {
    if (jogo.torreAbismo.ativa) {
        jogo.torreAbismo.ativa = false;
        jogo.monstroHpMax = calcularHpMaximo(jogo.nivel);
        jogo.monstroHp = jogo.monstroHpMax;
        atualizarInterface();
        if (window.renderizarTorre) window.renderizarTorre();
        mostrarNotificacao("🗼 Você recuou da Torre do Abismo.");
    }
};

window.baterPedra = function() {
    if (jogo.taverna.energia > 0) {
        jogo.taverna.energia--;
        let dano = 10 + (Math.random() * 15);
        jogo.taverna.hpPedra -= dano;
        if (jogo.taverna.hpPedra <= 0) {
            let gemasGanhas = Math.floor(2 + Math.random() * 5);
            jogo.gemas += gemasGanhas;
            jogo.taverna.hpPedra = 100;
            mostrarNotificacao(`⛏️ Rocha Quebrada!\n+${gemasGanhas} Gemas`);
        }
        atualizarInterface();
    } else {
        mostrarNotificacao("❌ Sem Energia da Taverna! Aguarde.");
    }
};

window.alternarHeroiNoTime = function(heroiIndex) {
    if (!jogo.timeAtivo.includes(heroiIndex) && jogo.guilda.expedicao.ativa && jogo.guilda.expedicao.heroiIndex === heroiIndex) {
        mostrarNotificacao("❌ Este herói está em uma expedição!");
        return;
    }
    if (heroiIndex === 0) return; // Regra: O Herói Principal (0) não pode ser removido
    const pos = jogo.timeAtivo.indexOf(heroiIndex);
    if (pos > -1) {
        jogo.timeAtivo.splice(pos, 1);
    } else if (jogo.timeAtivo.length < 3) {
        jogo.timeAtivo.push(heroiIndex);
    }
    renderizarPainelEquipe();
    renderizarBotoesUpgrades();
    atualizarInterface();
    salvarJogo();
};

window.ativarSkill = function(heroiIndex, skillIndex) {
    let heroi = jogo.herois[heroiIndex];
    let skill = heroi.skills[skillIndex];
    if (skill && skill.cooldownAtual <= 0 && !skill.ativa) {
        let cooldownBuff = (jogo.artefatos.glandulaHidra || 0) * 2;
        skill.cooldownAtual = Math.max(1, skill.cooldownMax - cooldownBuff);
        window.progredirContrato("skills");
        
        if (skill.multiplicadorDanoInstantaneo !== undefined) {
            let buffAres = 1 + ((jogo.reliquiasPantheon[0] || 0) * 0.01);
            let buffPassivoCavaleiro = 1.0;
            if (jogo.timeAtivo.includes(3) && jogo.herois[3] && (jogo.herois[3].desbloqueada || jogo.herois[3].nivelDps > 0)) {
                buffPassivoCavaleiro = 1.05 + ((jogo.herois[3].nivelDps || 0) * 0.01);
            }
            let buffAtivoCavaleiro = (jogo.timeAtivo.includes(3) && jogo.herois[3].skills && jogo.herois[3].skills[0].ativa) ? 1.5 : 1.0;
            
            let dpsBaseParaSkill = Math.max(1, heroi.dps);
            let dpsTotalBuffado = dpsBaseParaSkill * buffAres * buffPassivoCavaleiro * buffAtivoCavaleiro;
            let danoBurst = dpsTotalBuffado * skill.multiplicadorDanoInstantaneo;
            
            if (heroiIndex === 1 && heroi.talento === 'B') {
                danoBurst *= 2.5; // Franco-Atiradora (+150% dano de burst)
            } else if (heroiIndex === 4) { // Ladra de Presas consome as pilhas
                let acumulos = jogo.monstroLodoToxico || 1;
                danoBurst *= acumulos;
                jogo.monstroLodoToxico = 0; 
            } else if (heroiIndex === 5) { // Clérigo da Luz
                if (heroi.talento === 'A') danoBurst *= 2.0; // Inquisidor Solar
                jogo.timeAtordoado = 0; // Purifica atordoamento do grupo
                skill.ativa = true;
                skill.duracaoAtual = skill.duracaoMax + ((jogo.artefatos.manoplaOrc || 0) * 2);
                if (jogo.ataqueChefe && jogo.ataqueChefe.carregando) {
                    jogo.ataqueChefe.cliquesAtuais = Math.min(jogo.ataqueChefe.cliquesNecessarios, jogo.ataqueChefe.cliquesAtuais + 3);
                }
            } else if (heroiIndex === 6) { // Bárbaro Furioso
                isCrit = true; // Crítico garantido
                skill.ativa = true;
                skill.duracaoAtual = skill.duracaoMax + ((jogo.artefatos.manoplaOrc || 0) * 2);
                if (heroi.talento === 'B' && jogo.ataqueChefe) {
                    jogo.ataqueChefe.atordoado = Math.max(jogo.ataqueChefe.atordoado || 0, 4); // Quebra de guarda imediata
                }
            }

            let isCritFinal = isCrit || (heroiIndex === 6);
            let multCritico = 3 + (jogo.artefatos.cristalDragao || 0);
            if (isCritFinal) danoBurst *= multCritico;
            
            let tipoBurst = 'normal';
            if (heroiIndex === 1) tipoBurst = 'burstElfa';
            else if (heroiIndex === 4) tipoBurst = 'burstLadra';
            else if (heroiIndex === 5) tipoBurst = 'burstClerigo';
            else if (heroiIndex === 6) tipoBurst = 'burstBarbaro';
            
            atacar(danoBurst, isCritFinal, 45, tipoBurst);
        } else {
            skill.ativa = true;
            let durationBuff = (jogo.artefatos.manoplaOrc || 0) * 2;
            let extraTalento = (heroiIndex === 3 && heroi.talento === 'A') ? 4 : 0; // Fortaleza Inabalável +4s
            skill.duracaoAtual = skill.duracaoMax + durationBuff + extraTalento;
        }

        // Se o Cavaleiro de Ferro usar seu Baluarte, ele apara e interrompe ataques do Chefe!
        if (heroiIndex === 3 && typeof interromperAtaqueChefe === 'function') {
            interromperAtaqueChefe();
        }
        
        atualizarInterface();
    }
};

window.forjarArtefato = function(idArtefato) {
    if (idArtefato === 'manoplaOrc') {
        let nvl = jogo.artefatos.manoplaOrc || 0;
        let custoItem = 3 + (nvl * 2);
        let custoPontos = 1000 * Math.pow(5, nvl);
        if (jogo.inventario.couroOrc >= custoItem && jogo.pontos >= custoPontos) {
            jogo.inventario.couroOrc -= custoItem;
            jogo.pontos -= custoPontos;
            jogo.artefatos.manoplaOrc = nvl + 1;
            atualizarInterface();
            if (window.renderizarForja) window.renderizarForja();
            salvarJogo();
        }
    } else if (idArtefato === 'glandulaHidra') {
        let nvl = jogo.artefatos.glandulaHidra || 0;
        let custoItem = 3 + (nvl * 2);
        let custoPontos = 1000 * Math.pow(5, nvl);
        if (jogo.inventario.escamasHidra >= custoItem && jogo.pontos >= custoPontos) {
            jogo.inventario.escamasHidra -= custoItem;
            jogo.pontos -= custoPontos;
            jogo.artefatos.glandulaHidra = nvl + 1;
            atualizarInterface();
            if (window.renderizarForja) window.renderizarForja();
            salvarJogo();
        }
    } else if (idArtefato === 'cristalDragao') {
        let nvl = jogo.artefatos.cristalDragao || 0;
        let custoItem = 3 + (nvl * 2);
        let custoPontos = 1000 * Math.pow(5, nvl);
        if (jogo.inventario.denteDragao >= custoItem && jogo.pontos >= custoPontos) {
            jogo.inventario.denteDragao -= custoItem;
            jogo.pontos -= custoPontos;
            jogo.artefatos.cristalDragao = nvl + 1;
            atualizarInterface();
            if (window.renderizarForja) window.renderizarForja();
            salvarJogo();
        }
    }
};

window.renderizarMarcos = function() {
    const painel = document.getElementById("painelMarcos");
    if (!painel) return;
    let html = "";
    for (const chave in configMarcos) {
        const conf = configMarcos[chave];
        const tierAtual = jogo.marcos[chave];
        const maxTier = conf.limites.length;
        const isMax = tierAtual >= maxTier;
        const meta = isMax ? "MÁXIMO" : conf.limites[tierAtual];
        const atual = isMax ? meta : conf.valorAtual();
        const progresso = isMax ? 100 : Math.min(100, (atual / meta) * 100);
        const premioNext = isMax ? 0 : conf.premioBase * (tierAtual + 1);
        
        html += `
            <div class="heroi-card" style="display: flex; flex-direction: column; gap: 10px;">
                <h4 style="margin: 0; color: #f1c40f;">${conf.titulo} <small style="color: #bdc3c7;">(Tier ${tierAtual}/${maxTier})</small></h4>
                <p style="margin: 0; font-size: 13px; color: #5c3a21;">${conf.desc}</p>
                <div style="background: #111; border-radius: 4px; border: 1px solid #5c3a21; width: 100%; height: 12px; position: relative;">
                    <div style="background: #2ecc71; width: ${progresso}%; height: 100%; border-radius: 4px;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span style="color: #e67e22; font-weight: bold;">${atual} / ${meta}</span>
                    <span style="color: #9b59b6; font-weight: bold;">${isMax ? 'Concluído' : 'Prêmio: ' + premioNext + ' Gemas'}</span>
                </div>
            </div>
        `;
    }
    painel.innerHTML = html;
};

window.renderizarPantheon = function() {
    const painel = document.getElementById("painelPantheon");
    if (!painel) return;
    const nomes = ["⚔️ Bênção de Ares", "⏳ Bênção de Hermes", "💰 Bênção de Midas"];
    const descricoes = ["+1% DPS Global", "+0.5% Velocidade Offline", "+1% Pontos de Monstros"];
    let html = `<p style="color: #00ffff; text-align: center; width: 100%; font-weight: bold; margin-bottom: 20px;">Fragmentos Universais: ${jogo.fragmentosUniversais || 0}</p>`;
    for(let i=0; i<3; i++) {
        let nivel = jogo.reliquiasPantheon[i] || 0;
        let custo = 10 + (nivel * 5);
        let podeComprar = jogo.fragmentosUniversais >= custo;
        html += `
            <div class="heroi-card" style="display: flex; flex-direction: column; gap: 8px;">
                <h4 style="color: #f1c40f; margin: 0;">${nomes[i]} (Nvl ${nivel})</h4>
                <p style="font-size: 13px; color: #5c3a21; margin: 0;">Efeito: ${descricoes[i]} por nível.</p>
                <button class="btn-upgrade" style="width: 100%; background: ${podeComprar ? '#9b59b6' : '#7f8c8d'}; margin-top: auto;" onclick="subirReliquia(${i})" ${!podeComprar ? 'disabled' : ''}>Subir Nível (Custo: 🧩 ${custo})</button>
            </div>
        `;
    }
    painel.innerHTML = html;
};

window.renderizarFrestas = function() {
    const painel = document.getElementById("painelFrestas");
    if (!painel) return;
    if (jogo.frestaDesafio.ativa) {
        painel.innerHTML = `
            <div class="heroi-card" style="text-align: center; width: 100%;">
                <h3 style="color: #e74c3c; margin-top: 0;">Desafio em Andamento!</h3>
                <p style="font-size: 18px;">Andar Atual: <strong>${jogo.frestaDesafio.andarAtual}</strong></p>
                <p style="color: #e67e22; font-weight: bold; font-size: 22px;">Tempo Restante: ${jogo.frestaDesafio.tempoRestante}s</p>
                <button class="btn-upgrade" style="background: #7f8c8d; width: 100%; margin-top: 15px;" disabled>Foque no Combate!</button>
            </div>
        `;
    } else {
        painel.innerHTML = `
            <div class="heroi-card" style="text-align: center; width: 100%;">
                <h3 style="color: #8e44ad; margin-top: 0;">Abrir Portal Dimensional</h3>
                <p style="font-size: 14px; color: #5c3a21;">Inimigos ficam drasticamente mais fortes a cada andar. As habilidades recarregam <strong>2x mais rápido</strong>. Você tem apenas 30s para matar a criatura.</p>
                <button class="btn-upgrade" style="background: #8e44ad; width: 100%; margin-top: 15px;" onclick="iniciarDesafioFresta()">Entrar na Fresta</button>
            </div>
        `;
    }
};

window.alternarAba = function(abaId) {
    document.querySelectorAll('.btn-aba').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(abaId)) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.aba-conteudo').forEach(aba => {
        aba.classList.remove('active');
    });

    document.getElementById(abaId).classList.add('active');

    if (abaId === 'abaStatus') {
        renderizarStatusHerois();
    }
    if (abaId === 'abaEquipe') {
        renderizarPainelEquipe();
    }
    if (abaId === 'abaGacha') {
        renderizarListaPremiosGacha();
    }
    if (abaId === 'abaSantuario') {
        renderizarLojaSantuario();
    }
    if (abaId === 'abaForja') {
        renderizarForja();
    }
    if (abaId === 'abaGuilda') {
        renderizarGuilda();
    }
    if (abaId === 'abaMarcos') {
        window.renderizarMarcos();
    }
    if (abaId === 'abaPantheon') {
        if (window.renderizarPantheon) window.renderizarPantheon();
    }
    if (abaId === 'abaFrestas') {
        if (window.renderizarFrestas) window.renderizarFrestas();
    }
    if (abaId === 'abaMascotes') {
        if (window.renderizarMascotes) window.renderizarMascotes();
    }
    if (abaId === 'abaTorre') {
        if (window.renderizarTorre) window.renderizarTorre();
    }
    if (abaId === 'abaTaverna') {
        if (window.renderizarTaverna) window.renderizarTaverna();
    }

    // --- SISTEMA DE REVELAÇÃO DE TUTORIAL ---
    if (jogo.tutoriaisVistos && !jogo.tutoriaisVistos[abaId]) {
        // Registra que o jogador já viu este resumo
        jogo.tutoriaisVistos[abaId] = true;
        salvarJogo();

        // Dicionário de Textos de Onboarding do Reino
        const resumosTutoriais = {
            abaUpgrades: { t: "⚔️ Central de Upgrades", d: "Aqui você investe moedas de ouro para aumentar permanentemente o DPS dos seus heróis e o seu multiplicador de Dano por Clique manual." },
            abaEquipe:   { t: "🛡️ Gestão de Equipe", d: "Monte sua linha de frente de combate! Você pode escalar até 3 heróis simultâneos no campo para lutarem juntos e combinarem suas auras." },
            abaGacha:    { t: "🔮 Altar de Invocação", d: "Gaste suas Gemas para invocar novos campeões místicos. Tirar cópias repetidas concede fragmentos para elevar as Estrelas e Despertar o poder máximo deles!" },
            abaForja:    { t: "⚒️ Forja de Artefatos", d: "Refine os materiais brutos deixados pelos monstros caídos e chefes. Forjar artefatos garante bônus multiplicadores universais de Atributos." },
            abaSantuario:{ t: "✨ Santuário de Almas", d: "Canalize as Almas Poligonais ganhas de Chefes Importantes. Desbloqueie buffs massivos e ative o 'Auto-Cast' automático das suas habilidades de combate." },
            abaGuilda:   { t: "📜 Guilda dos Aventureiros", d: "Assine Contratos Diários do Reino para coletar Gemas extras de recompensa rápida ou envie heróis da reserva em Expedições de exploração offline." },
            abaMarcos:   { t: "🏆 Salão de Marcos", d: "Uma galeria de glórias passadas. Colete generosas quantias de Gemas grátis sempre que atingir recordes de cliques, abates, níveis ou tiros!" },
            abaPantheon: { t: "🏛️ Panteão das Relíquias", d: "Os Deuses observam sua Ascensão. Entregue os Fragmentos Universais coletados nas Frestas para erguer as Bênçãos Eternas de Ares, Hermes e Midas." },
            abaFrestas:  { t: "🌌 Frestas Dimensionais", d: "Uma fenda no espaço-tempo. Você terá apenas 30 segundos e Cooldowns 2x mais rápidos para abater um chefe de HP exponencial e extrair moedas míticas!" },
            abaMascotes: { t: "🐾 Viveiro de Mascotes", d: "Choque ovos místicos para recrutar companheiros que concedem auras passivas permanentes de dano, velocidade e crítico." },
            abaTorre:    { t: "🗼 Torre do Abismo", d: "Suba andares impiedosos com modificadores de imunidade para acumular Gemas e Fragmentos Universais." },
            abaTaverna:  { t: "🍺 Taverna da Cidade", d: "Relaxe na taverna e gaste sua energia de mineração para quebrar rochas da mina em busca de Gemas valiosas." }
        };

        const tutorial = resumosTutoriais[abaId];
        if (tutorial && window.mostrarTutorial) {
            // Utiliza o layout de pergaminho estilizado que já criamos
            window.mostrarTutorial(abaId, tutorial.t, tutorial.d);
        }
    }
};

export function atacar(dano, isCritico = false, duracaoAnimacao = 15, tipo = 'normal') {
    window.atacar = atacar;
    // Flag para evitar poluição visual do Raio Arcino
    let suprimirTextos = false; // Removido para que o jogador POSSA VER o dano do Mago acontecendo!

    // Se a animação atual é o burst da elfa, não interrompe ela visualmente se houver um ataque ou clique normal!
    if (!(animacao.ativa && animacao.tipo === 'burstElfa' && tipo === 'normal') && tipo !== 'burstMago') {
        animacao.ativa = true;
        animacao.frameAtual = 0;
        animacao.critico = isCritico;
        animacao.duracao = duracaoAnimacao; 
        animacao.tipo = tipo;
    }
    
    if (isCritico) window.progredirContrato("criticos");

    if (isCritico && tipo === 'normal') ativarJuice(5, 2); // Tremorzinho rápido e congelamento de 2 frames

    const isBoss = (jogo.nivel % 5 === 0);
    const espadaFogoAtiva = jogo.herois[0].skills[0].ativa;

    let multiplicadorElemental = 1.0;
    
    let isMagico = tipo === 'burstMago' || tipo === 'passivoMago' || tipo === 'lodoToxico' || tipo === 'burstLadra' || tipo === 'explosaoVeneno' || tipo === 'burstClerigo' || tipo === 'passivoClerigo';
    let isFisico = tipo === 'normal' || tipo === 'dpsPassivoElfa' || tipo === 'burstElfa' || tipo === 'passivoCavaleiro' || tipo === 'shieldBash' || tipo === 'burstBarbaro' || tipo === 'passivoBarbaro';

    if (jogo.torreAbismo && jogo.torreAbismo.ativa) {
        if (jogo.torreAbismo.andarAtual % 5 === 0 && isFisico) dano = 0;
        if (jogo.torreAbismo.andarAtual % 7 === 0 && isMagico) dano = 0;
    }

    if (jogo.clima === 'chuva' || jogo.clima === 'tempestade') {
        if (isMagico) multiplicadorElemental *= 1.2;
        if (tipo === 'normal' && espadaFogoAtiva) multiplicadorElemental *= 0.9;
    } else if (jogo.clima === 'neve') {
        if (isFisico) multiplicadorElemental *= 0.9;
    }

    let corTexto = isCritico ? "243, 156, 18" : "231, 76, 60";
    let textoAtaque = isCritico ? "CRÍTICO! " : "";

    if (tipo === 'normal') if (window.tocarSom) window.tocarSom('ataque');
    if (tipo === 'burstMago') if (window.tocarSom) window.tocarSom('laser');

    if (tipo === 'normal' && espadaFogoAtiva) {
        if (isBoss) {
            multiplicadorElemental = 3.0;
            corTexto = "255, 102, 0";
            textoAtaque = "🔥 DEGRADAÇÃO POLIGONAL! ";
        }
    } else if (tipo === 'burstElfa') {
        ativarJuice(15, 5); // Tremor forte, impacto de 5 frames
        if (espadaFogoAtiva) {
            multiplicadorElemental = 2.0;
            corTexto = "191, 0, 255";
            textoAtaque = "💥 DERRETIMENTO DE PIXELS! ";
        } else if (isBoss) {
            multiplicadorElemental = 0.5;
            textoAtaque = "🔷 FRACTAL MÁGICO ";
        }
    } else if (tipo === 'passivoMago') {
        corTexto = "155, 89, 182"; 
        if (jogo.herois[2] && jogo.herois[2].skills[0].ativa) {
            textoAtaque = isCritico ? "🔮 CRÍTICO CÚBICO! " : "🔮 ";
        } else {
            textoAtaque = isCritico ? "CRÍTICO! " : "";
        }
    } else if (tipo === 'passivoCavaleiro') {
        corTexto = "149, 165, 166"; 
        if (jogo.herois[3] && jogo.herois[3].skills[0].ativa) {
            textoAtaque = isCritico ? "⚙️ IMPACTO ESMAGADOR! " : "⚙️ ";
        } else {
            textoAtaque = isCritico ? "CRÍTICO! " : "";
        }
    } else if (tipo === 'lodoToxico') {
        corTexto = "46, 204, 113";
        textoAtaque = "☠️ ";
    } else if (tipo === 'burstLadra') {
        ativarJuice(25, 8); // Tremor massivo, congelamento violento de 8 frames (estilo anime)
        multiplicadorElemental = 1.5;
        corTexto = "142, 68, 173";
        textoAtaque = "☠️ EXPLOSÃO TÓXICA! ";
        if (window.tocarSom) window.tocarSom('impacto');
    } else if (tipo === 'shieldBash') {
        multiplicadorElemental = 1.0; // Dano físico puro
        corTexto = "241, 196, 15"; // Dourado
        textoAtaque = "🛡️ ESMAGAR! ";
        ativarJuice(12, 3); // Tremor pesado
        if (window.tocarSom) window.tocarSom('impacto');
    } else if (tipo === 'burstMago') {
        corTexto = "0, 255, 255";
        textoAtaque = "☄️ ";
    } else if (tipo === 'explosaoVeneno') {
        corTexto = "155, 89, 182";
        textoAtaque = "🔮 TOXINA MÁGICA! ";
        ativarJuice(8, 2);
    } else if (tipo === 'burstClerigo') {
        ativarJuice(20, 6);
        multiplicadorElemental = 1.6;
        corTexto = "255, 215, 0";
        textoAtaque = "🌟 JULGAMENTO DIVINO! ";
        if (window.tocarSom) window.tocarSom('laser');
    } else if (tipo === 'passivoClerigo') {
        corTexto = "241, 196, 15";
        textoAtaque = isCritico ? "🌟 SAGRADO CRÍTICO! " : "🌟 ";
    } else if (tipo === 'burstBarbaro') {
        ativarJuice(30, 8);
        multiplicadorElemental = 1.8;
        corTexto = "231, 76, 60";
        textoAtaque = "🩸 FÚRIA IMPLACÁVEL! ";
        if (window.tocarSom) window.tocarSom('impacto');
    } else if (tipo === 'passivoBarbaro') {
        corTexto = "192, 57, 43";
        textoAtaque = isCritico ? "🩸 MACHADADA BRUTAL! " : "🪓 ";
    }

    if (jogo.ataqueChefe && jogo.ataqueChefe.atordoado > 0) {
        multiplicadorElemental *= 1.5;
        if (!textoAtaque.includes("CRÍTICO!")) textoAtaque = "💥 VULNERÁVEL! " + textoAtaque;
    }

    // Bênção Solar do Clérigo (Dano do time x2 enquanto skill ativa)
    if (jogo.timeAtivo.includes(5) && jogo.herois[5]?.skills?.[0]?.ativa) {
        dano *= 2.0;
    }
    // Dano sagrado do Clérigo contra Boss
    if (jogo.timeAtivo.includes(5) && isBoss) {
        let bonusClerigo = jogo.herois[5]?.talento === 'A' ? 2.0 : 1.3;
        dano *= bonusClerigo;
    }
    // Buff do Hidromel (+20% dano)
    if (jogo.buffsAtivos && jogo.buffsAtivos.hidromel > 0) {
        dano *= 1.2;
    }

    let bonusEquip = calcularBonusEquipamentos();
    if (tipo === 'normal') {
        dano *= (1 + ((bonusEquip.danoClique || 0) / 100));
    } else {
        dano *= (1 + ((bonusEquip.dpsBonus || 0) / 100));
    }
    if (isBoss) {
        dano *= (bonusEquip.danoChefe || 1);
    }

    let danoFinal = dano * multiplicadorElemental * (jogo.multiplicadorAscensao || 1);
    jogo.dpsBuffer = (jogo.dpsBuffer || 0) + danoFinal;

    if (!suprimirTextos && danoFinal > 0) {
        textosFlutuantes.push({
            texto: textoAtaque + `-${formatarNumero(Math.ceil(danoFinal))}`,
            x: 400 + (Math.random() * 80 - 40),
            y: 220 + (Math.random() * 40 - 20),
            alpha: 1, 
            duracao: 30,
            cor: corTexto,
            tamanho: isCritico ? "bold 28px Georgia" : "bold 20px Georgia"
        });
    }

    jogo.monstroHp -= danoFinal;
    if (jogo.monstroHp <= 0) {
        if (window.tocarSom) window.tocarSom('moeda');
        jogo.monstroLodoToxico = 0;

        if (jogo.torreAbismo && jogo.torreAbismo.ativa) {
            let andarConcluido = jogo.torreAbismo.andarAtual;
            let premioGemas = 3 + Math.floor(andarConcluido * 1.5);
            let premioFrags = 2 + Math.floor(andarConcluido / 2);
            jogo.gemas += premioGemas;
            jogo.fragmentosUniversais = (jogo.fragmentosUniversais || 0) + premioFrags;

            textosFlutuantes.push({
                texto: `🗼 Andar ${andarConcluido} Vencido! +${premioGemas} Gemas +${premioFrags} Frags`,
                x: 400,
                y: 100,
                alpha: 1,
                duracao: 80,
                cor: "241, 196, 15",
                tamanho: "bold 20px Georgia"
            });
            mostrarNotificacao(`🗼 Andar ${andarConcluido} da Torre Superado!\n+${premioGemas} Gemas | +${premioFrags} Fragmentos Universais`);

            jogo.torreAbismo.andarAtual++;
            let hpTorre = Math.floor(50 * Math.pow(1.8, jogo.torreAbismo.andarAtual));
            jogo.monstroHpMax = hpTorre;
            jogo.monstroHp = hpTorre;

            if (window.renderizarTorre) window.renderizarTorre();
            atualizarInterface();
            return;
        }

        if (jogo.frestaDesafio && jogo.frestaDesafio.ativa) {
            jogo.frestaDesafio.andarAtual++;
            jogo.frestaDesafio.tempoRestante = 30; // Reseta o tempo
            jogo.frestaDesafio.tipoInimigo = Math.floor(Math.random() * 3); // Novo inimigo aleatório
            
            // Fixando a dificuldade da Fresta (Endgame) independente da campanha
            const NIVEL_BASE_FRESTA = 41; 
            let hpBaseAtual = calcularHpMaximo(NIVEL_BASE_FRESTA);
            
            let multiplicador = Math.pow(1.5, jogo.frestaDesafio.andarAtual);
            if (jogo.frestaDesafio.andarAtual % 5 === 0) multiplicador *= 3; // Chefe da Fresta!
            
            jogo.monstroHpMax = Math.floor(hpBaseAtual * multiplicador);
            jogo.monstroHp = jogo.monstroHpMax;
            
            let multDinheiro = 1 + ((jogo.upgradesAlmas[5] || 0) * 0.10);
            if (jogo.buffsAtivos && jogo.buffsAtivos.frenesiOuro > 0) multDinheiro *= 2;
            if (jogo.buffsAtivos && jogo.buffsAtivos.hidromel > 0) multDinheiro *= 1.4;
            if (jogo.timeAtivo.includes(5) && jogo.herois[5]?.talento === 'B') multDinheiro *= 1.25;
            let recompensaFresta = Math.floor(calcularRecompensa(NIVEL_BASE_FRESTA) * jogo.frestaDesafio.andarAtual * multDinheiro);
            if (Math.random() < ((jogo.reliquiasPantheon[2] || 0) * 0.01)) recompensaFresta *= 2; // Bênção de Midas
            jogo.pontos += recompensaFresta;
            textosFlutuantes.push({ texto: `+${formatarNumero(recompensaFresta)} pts`, x: 400 + (Math.random() * 60 - 30), y: 80, alpha: 1, duracao: 60, cor: "241, 196, 15" });
            
            atualizarInterface();
            return; // Impede que o nível normal da campanha avance
        }

        const recompensa = calcularRecompensa(jogo.nivel);
        let multDinheiro = 1 + ((jogo.upgradesAlmas[5] || 0) * 0.10);
        if (jogo.buffsAtivos && jogo.buffsAtivos.frenesiOuro > 0) multDinheiro *= 2;
        if (jogo.buffsAtivos && jogo.buffsAtivos.hidromel > 0) multDinheiro *= 1.4;
        if (jogo.timeAtivo.includes(5) && jogo.herois[5]?.talento === 'B') multDinheiro *= 1.25;
        let ganhoPontos = Math.floor(recompensa * multDinheiro);
        if (Math.random() < ((jogo.reliquiasPantheon[2] || 0) * 0.01)) ganhoPontos *= 2; // Bênção de Midas
        jogo.pontos += ganhoPontos;
        
        jogo.monstrosMortos++;
        if (typeof window.progredirContrato === 'function') window.progredirContrato("mortes");

        if (jogo.nivel % 5 === 0) {
            if (typeof window.progredirContrato === 'function') window.progredirContrato("chefes");
            let gemasGanhos = 5 + (jogo.upgradesAlmas[2] || 0);
            jogo.gemas += gemasGanhos;
            textosFlutuantes.push({ texto: `+${gemasGanhos} Gemas`, x: 400 + (Math.random() * 60 - 30), y: 60, alpha: 1, duracao: 80, cor: "155, 89, 182", tamanho: "bold 18px sans-serif" });

            if (!jogo.inventario) jogo.inventario = { couroOrc: 0, escamasHidra: 0, denteDragao: 0 };
            const biomeIndex = Math.floor((jogo.nivel - 1) / 15) % 3;
            if (biomeIndex === 1) {
                jogo.inventario.escamasHidra = (jogo.inventario.escamasHidra || 0) + 1;
                textosFlutuantes.push({ texto: "+1 Escama de Hidra", x: 400 + (Math.random() * 60 - 30), y: 40, alpha: 1, duracao: 100, cor: "46, 204, 113", tamanho: "bold 16px sans-serif" });
            } else if (biomeIndex === 2) {
                jogo.inventario.denteDragao = (jogo.inventario.denteDragao || 0) + 1;
                textosFlutuantes.push({ texto: "+1 Dente de Dragão", x: 400 + (Math.random() * 60 - 30), y: 40, alpha: 1, duracao: 100, cor: "e74c3c", tamanho: "bold 16px sans-serif" });
            } else {
                jogo.inventario.couroOrc = (jogo.inventario.couroOrc || 0) + 1;
                textosFlutuantes.push({ texto: "+1 Couro de Orc", x: 400 + (Math.random() * 60 - 30), y: 40, alpha: 1, duracao: 100, cor: "139, 69, 19", tamanho: "bold 16px sans-serif" });
            }

            // DROP DE EQUIPAMENTO DO CHEFE (Fase 3)
            let itemDrop = gerarItemLoot(jogo.nivel);
            if (!jogo.equipamentos) jogo.equipamentos = { inventario: [], equipados: { arma: null, armadura: null, amuleto: null }, poDeForja: 0 };
            if (!jogo.equipamentos.inventario) jogo.equipamentos.inventario = [];
            jogo.equipamentos.inventario.push(itemDrop);

            let corRaridade = itemDrop.raridade === 'lendario' ? '241, 196, 15' : 
                             (itemDrop.raridade === 'epico' ? '155, 89, 182' : 
                             (itemDrop.raridade === 'raro' ? '52, 152, 219' : '220, 220, 220'));
            textosFlutuantes.push({
                texto: `🎁 ${itemDrop.icone} ${itemDrop.nome} [${itemDrop.raridade.toUpperCase()}]`,
                x: 400,
                y: 20,
                alpha: 1,
                duracao: 110,
                cor: corRaridade,
                tamanho: "bold 15px Georgia"
            });
            if (itemDrop.raridade === 'lendario' || itemDrop.raridade === 'epico') {
                mostrarNotificacao(`🎁 LOOT RARO DE CHEFE!\n${itemDrop.icone} ${itemDrop.nome} (${itemDrop.raridade.toUpperCase()})\n${itemDrop.afixos.map(a => a.desc).join(' | ')}${itemDrop.passivaLendaria ? '\n⭐ ' + itemDrop.passivaLendaria : ''}`);
            }
            if (document.getElementById("abaEquipe")?.classList.contains("active")) {
                renderizarPainelEquipamentos();
            }
        }
        textosFlutuantes.push({ texto: `+${formatarNumero(ganhoPontos)} pts`, x: 400 + (Math.random() * 60 - 30), y: 80, alpha: 1, duracao: 60, cor: "241, 196, 15" });

        jogo.nivel++;
        jogo.monstroHpMax = calcularHpMaximo(jogo.nivel);
        jogo.monstroHp = jogo.monstroHpMax;
        if (jogo.nivel > (jogo.nivelMaximo || 1)) jogo.nivelMaximo = jogo.nivel;
            if (window.verificarDesbloqueios) window.verificarDesbloqueios();
    }
    atualizarInterface();
}

function regularResolucaoCanvas() {
    const canvas = document.getElementById("jogoCanvas");
    if (!canvas) return;
    
    // Captura a resolução real do monitor/celular para nitidez extrema (Retina/4K)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
}

export function converterMouseParaLogico(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(canvas.width / (800 * dpr), canvas.height / (450 * dpr)) * dpr;
    let offsetY = 0;
    if (window.innerHeight > window.innerWidth) {
        offsetY = -(window.innerHeight * 0.15) * dpr;
    }
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const logicalX = ((canvasX - canvas.width / 2) / scale) + 400;
    const logicalY = ((canvasY - (canvas.height / 2 + offsetY)) / scale) + 225;
    return { x: logicalX, y: logicalY };
}

export function interromperAtaqueChefe() {
    if (!jogo.ataqueChefe || !jogo.ataqueChefe.carregando) return;
    jogo.ataqueChefe.carregando = false;
    jogo.ataqueChefe.atordoado = 3;
    ativarJuice(15, 6);
    if (window.tocarSom) window.tocarSom('impacto');
    textosFlutuantes.push({
        texto: "🛡️ GUARDA QUEBRADA! ATORDISSO!",
        x: 400,
        y: 130,
        alpha: 1,
        duracao: 60,
        cor: "241, 196, 15",
        tamanho: "bold 22px Georgia"
    });
    mostrarNotificacao("🛡️ ATAQUE INTERROMPIDO!\nO Chefe ficou atordoado e está vulnerável a +50% de dano!");
}

export function resgatarEventoVolante() {
    if (!jogo.eventoVolante || !jogo.eventoVolante.ativo) return;
    jogo.eventoVolante.ativo = false;
    ativarJuice(12, 3);
    if (window.tocarSom) window.tocarSom('moeda');

    let roll = Math.random();
    if (roll < 0.35) {
        let qtd = Math.floor(10 + Math.random() * 15);
        jogo.gemas += qtd;
        textosFlutuantes.push({
            texto: `✨ CHUVA DE GEMAS! +${qtd} 💎`,
            x: 400,
            y: 120,
            alpha: 1,
            duracao: 80,
            cor: "155, 89, 182",
            tamanho: "bold 20px Georgia"
        });
        mostrarNotificacao(`✨ Criatura Mística Capturada!\nVocê faturou +${qtd} Gemas!`);
    } else if (roll < 0.70) {
        jogo.buffsAtivos.frenesiOuro = 20;
        textosFlutuantes.push({
            texto: "💰 FRENESI DE GLINTSTONE! (2x OURO)",
            x: 400,
            y: 120,
            alpha: 1,
            duracao: 80,
            cor: "241, 196, 15",
            tamanho: "bold 20px Georgia"
        });
        mostrarNotificacao("💰 FRENESI ATIVO!\nOuro dos monstros dobrado por 20 segundos!");
    } else {
        jogo.buffsAtivos.fluxoVeloz = 15;
        textosFlutuantes.push({
            texto: "⚡ FLUXO VELOZ! (RECARGA RÁPIDA)",
            x: 400,
            y: 120,
            alpha: 1,
            duracao: 80,
            cor: "52, 152, 219",
            tamanho: "bold 20px Georgia"
        });
        mostrarNotificacao("⚡ FLUXO VELOZ!\nCooldowns de habilidades acelerados por 15 segundos!");
    }
    salvarJogo();
    atualizarInterface();
}

// Boot do Sistema e Bindings de Evento
window.addEventListener('DOMContentLoaded', () => {
    regularResolucaoCanvas();
    window.addEventListener("resize", regularResolucaoCanvas);

    const canvas = document.getElementById("jogoCanvas");
    window.executarCliqueManual = function(isPlayer = true) {
        if (jogo.timeAtordoado > 0) {
            if (isPlayer) {
                textosFlutuantes.push({
                    texto: "💫 Atordoado!",
                    x: 200 + (Math.random() * 40 - 20),
                    y: 280,
                    alpha: 1,
                    duracao: 25,
                    cor: "241, 196, 15",
                    tamanho: "bold 16px Georgia"
                });
            }
            return;
        }

        if (isPlayer) {
            jogo.cliquesTotais++;
            window.progredirContrato("cliques");

            // Interrupção do golpe do Chefe
            if (jogo.ataqueChefe && jogo.ataqueChefe.carregando) {
                jogo.ataqueChefe.cliquesAtuais++;
                ativarJuice(3, 1);
                if (jogo.ataqueChefe.cliquesAtuais >= jogo.ataqueChefe.cliquesNecessarios) {
                    interromperAtaqueChefe();
                }
            }
        }

        let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
        let heroi = jogo.herois[0];
        let dano = heroi.dps + Math.floor(dpsTotal * 0.10);
        
        // Buff 0: Poder Primordial (+10% dano de clique)
        dano *= (1 + ((jogo.upgradesAlmas[0] || 0) * 0.10));

        // Talento A do Herói Principal: Paladino Vingador (+100% dano e redução de recarga por clique)
        if (heroi.talento === 'A') {
            dano *= 2.0;
            jogo.timeAtivo.forEach(idx => {
                let h = jogo.herois[idx];
                if (h.skills && h.skills[0] && h.skills[0].cooldownAtual > 0) {
                    h.skills[0].cooldownAtual = Math.max(0, h.skills[0].cooldownAtual - 0.1);
                }
            });
        }

        let skillFogo = heroi.skills && heroi.skills[0];
        if (skillFogo && skillFogo.ativa) {
            dano *= skillFogo.multiplicadorDano;
        }

        // Buff 1: Visão Letal (+2% crit global)
        let chanceCritFinal = heroi.chanceCritico + ((jogo.upgradesAlmas[1] || 0) * 0.02);
        // Talento B do Herói Principal: Mestre das Lâminas (+25% chance de crítico)
        if (heroi.talento === 'B') chanceCritFinal += 0.25;

        let isCrit = Math.random() < chanceCritFinal;
        let multCritico = 3 + (jogo.artefatos.cristalDragao || 0);
        if (isCrit) {
            dano *= multCritico;
            if (heroi.talento === 'B') {
                let bonusOuro = Math.max(1, Math.floor(calcularRecompensa(jogo.nivel) * 0.3));
                jogo.pontos += bonusOuro;
            }
        }
        
        let buffAres = 1 + ((jogo.reliquiasPantheon[0] || 0) * 0.01);
        let buffCavaleiroClique = (jogo.timeAtivo.includes(3) && jogo.herois[3].skills && jogo.herois[3].skills[0].ativa) ? 2.0 : 1.0;
        dano *= buffAres * buffCavaleiroClique;

        atacar(dano, isCrit);
    };

    if (canvas) {
        canvas.addEventListener("mousedown", (e) => {
            if (jogo.estado !== 'jogando') return;

            if (jogo.eventoVolante && jogo.eventoVolante.ativo) {
                const pos = converterMouseParaLogico(e, canvas);
                const dist = Math.hypot(pos.x - jogo.eventoVolante.x, pos.y - jogo.eventoVolante.y);
                if (dist <= 40) {
                    resgatarEventoVolante();
                    return;
                }
            }

            window.executarCliqueManual(true);
        });
    }

    // Processamento de Tempo Offline (foi movido para cá na migração)
        const tempoFora = carregarJogo() || 0;
        window.tempoForaCalculado = tempoFora;

        if (jogo.estado === 'menu') {
            document.body.classList.add("tela-inicio");
            const painelSkills = document.getElementById("painelSkills");
            if (painelSkills) painelSkills.style.opacity = "0";
            const btnSidebar = document.getElementById("btnToggleSidebar");
            if (btnSidebar) btnSidebar.style.display = "none"; // Esconde o botão Menu
        } else {
            const menuInicial = document.getElementById("menuInicial");
            if (menuInicial) menuInicial.style.display = "none";
        }

        if (tempoFora > 0) { 
            let dpsTotal = jogo.timeAtivo.reduce((acc, idx) => acc + jogo.herois[idx].dps, 0);
            let buffPassivoCavaleiro = 1.0;
            if (jogo.timeAtivo.includes(3) && jogo.herois[3] && (jogo.herois[3].desbloqueada || jogo.herois[3].nivelDps > 0)) {
                buffPassivoCavaleiro = 1.05 + ((jogo.herois[3].nivelDps || 0) * 0.01);
            }
            let tempoBuffado = tempoFora * (1 + ((jogo.reliquiasPantheon[1] || 0) * 0.005));
            let buffAres = 1 + ((jogo.reliquiasPantheon[0] || 0) * 0.01);
            let buffPrimordial = 1 + ((jogo.upgradesAlmas[0] || 0) * 0.10);
            let buffAvareza = 1 + ((jogo.upgradesAlmas[5] || 0) * 0.10);
            let pontosOffline = Math.floor(tempoBuffado * (dpsTotal * buffPassivoCavaleiro * buffAres * buffPrimordial) * buffAvareza);
            
            if(pontosOffline > 0) {
                jogo.pontos += pontosOffline;
                let estimativaMonstros = Math.floor(pontosOffline / 10);
                
                // SALVA OS DADOS PARA ABRIR SÓ QUANDO DER O START!
                window.dadosOfflinePendente = { tempo: tempoFora, monstros: estimativaMonstros, pontos: pontosOffline };
            }
        }

    setInterval(() => {
        verificarMarcos();

        // Rastreamento de DPS em tempo real
        jogo.dpsEmTempoReal = jogo.dpsBuffer || 0;
        jogo.dpsBuffer = 0;

        // Gerenciamento de Buffs e Efeitos Temporários
        if (jogo.buffsAtivos) {
            if (jogo.buffsAtivos.frenesiOuro > 0) jogo.buffsAtivos.frenesiOuro--;
            if (jogo.buffsAtivos.fluxoVeloz > 0) jogo.buffsAtivos.fluxoVeloz--;
            if (jogo.buffsAtivos.hidromel > 0) jogo.buffsAtivos.hidromel--;
        }
        if (jogo.timeAtordoado > 0) jogo.timeAtordoado--;
        if (jogo.ataqueChefe && jogo.ataqueChefe.atordoado > 0) jogo.ataqueChefe.atordoado--;

        // Sistema de Ataque Telegrafado do Chefe
        const isBossLuta = (jogo.nivel % 5 === 0) || (jogo.frestaDesafio && jogo.frestaDesafio.ativa && jogo.frestaDesafio.andarAtual % 5 === 0);
        if (isBossLuta && jogo.monstroHp > 0) {
            if (jogo.ataqueChefe && jogo.ataqueChefe.carregando) {
                jogo.ataqueChefe.tempoRestante -= 1.0;
                if (jogo.ataqueChefe.tempoRestante <= 0) {
                    jogo.ataqueChefe.carregando = false;
                    ativarJuice(30, 8);
                    if (window.tocarSom) window.tocarSom('impacto');
                    let stunTempo = jogo.timeAtivo.includes(5) ? 1 : 3; // Aura do Clérigo reduz atordoamento
                    jogo.timeAtordoado = stunTempo;
                    textosFlutuantes.push({
                        texto: `💥 ${jogo.ataqueChefe.nomeAtaque}!`,
                        x: 400,
                        y: 150,
                        alpha: 1,
                        duracao: 60,
                        cor: "231, 76, 60",
                        tamanho: "bold 22px Georgia"
                    });
                    mostrarNotificacao(`💥 O Chefe desferiu ${jogo.ataqueChefe.nomeAtaque}!\nSeus heróis foram atordoados por ${stunTempo}s!`);
                }
            } else if (jogo.ataqueChefe && jogo.ataqueChefe.atordoado <= 0 && Math.random() < 0.25) {
                jogo.ataqueChefe.carregando = true;
                jogo.ataqueChefe.tempoMax = 3.5;
                jogo.ataqueChefe.tempoRestante = 3.5;
                jogo.ataqueChefe.cliquesNecessarios = 5;
                jogo.ataqueChefe.cliquesAtuais = 0;
                const golpes = ["🔥 Terremoto Poligonal", "⚡ Carga de Fragmentos", "💥 Esmagamento Brutal", "🌪️ Fúria Dimensional"];
                jogo.ataqueChefe.nomeAtaque = golpes[Math.floor(Math.random() * golpes.length)];
                if (window.tocarSom) window.tocarSom('impacto');
            }
        } else if (jogo.ataqueChefe) {
            jogo.ataqueChefe.carregando = false;
        }

        // Spawn de Criatura Mística Volante (Fada / Slime Dourado)
        if (jogo.eventoVolante && !jogo.eventoVolante.ativo && Math.random() < 0.04) {
            jogo.eventoVolante.ativo = true;
            jogo.eventoVolante.x = -60;
            jogo.eventoVolante.y = 80 + Math.random() * 120;
            jogo.eventoVolante.tipo = Math.random() < 0.5 ? 'fada' : 'slimeDourado';
            jogo.eventoVolante.velocidade = 2.2 + Math.random() * 1.2;
        }

        // Lógica de Tempo do Desafio das Frestas e Torre
        if (jogo.taverna.energia < jogo.taverna.energiaMaxima && (Date.now() - jogo.taverna.ultimaRecarga) >= 60000) {
            jogo.taverna.energia++;
            jogo.taverna.ultimaRecarga = Date.now();
            if (window.renderizarTaverna) window.renderizarTaverna();
        }

        if (Math.random() < 0.03) {
            let climas = ['limpo', 'chuva', 'neve', 'tempestade'];
            let novoClima = climas[Math.floor(Math.random() * climas.length)];
            if (jogo.clima !== novoClima) {
                jogo.clima = novoClima;
                mostrarNotificacao(`🌤️ O clima mudou para: ${jogo.clima.toUpperCase()}`);
            }
        }

        let petAtivo = jogo.mascotes.find(m => m.ativo);
        if (petAtivo && petAtivo.id === 'slime' && jogo.timeAtordoado <= 0) {
            let dpsTotal = jogo.timeAtivo.reduce((acc, idx) => acc + jogo.herois[idx].dps, 0);
            let danoPet = Math.max(1, Math.floor(dpsTotal * 0.10));
            atacar(danoPet, false, 5, "normal"); 
        }

        if (jogo.frestaDesafio && jogo.frestaDesafio.ativa) {
            jogo.frestaDesafio.tempoRestante--;
            if (window.renderizarFrestas) window.renderizarFrestas();

            if (jogo.frestaDesafio.tempoRestante <= 0) { // O tempo acabou!
                jogo.frestaDesafio.ativa = false;
                let premio = jogo.frestaDesafio.andarAtual * 2;
                jogo.fragmentosUniversais = (jogo.fragmentosUniversais || 0) + premio;
                
                jogo.monstroHpMax = calcularHpMaximo(jogo.nivel);
                jogo.monstroHp = jogo.monstroHpMax;
                
                mostrarNotificacao(`🌌 Fresta Colapsou!\nVocê chegou ao Andar ${jogo.frestaDesafio.andarAtual}\nPrêmio: +${premio} Fragmentos Universais`);
                if (window.renderizarFrestas) window.renderizarFrestas();
            }
        }

        // Sistema de Veneno (Ladra de Presas) - Efeito Contínuo (DoT)
        if (jogo.timeAtivo.includes(4) && (jogo.monstroLodoToxico || 0) > 0 && jogo.timeAtordoado <= 0) {
            let danoDoT = Math.max(1, Math.floor(jogo.herois[4].dps * 0.5));
            if (danoDoT > 0) {
                atacar(danoDoT, false, 10, "lodoToxico");
            }
        }

        // Upgrade 4: Conjurador Automático (Auto-Cast)
        if ((jogo.upgradesAlmas[4] || 0) >= 1 && jogo.autoCastAtivo !== false && jogo.timeAtordoado <= 0) {
            jogo.timeAtivo.forEach(idx => {
                let heroi = jogo.herois[idx];
                if (heroi.skills && heroi.skills.length > 0) {
                    let skill = heroi.skills[0];
                    if (!skill.ativa && skill.cooldownAtual === 0) {
                        window.ativarSkill(idx, 0);
                    }
                }
            });
        }

        // Upgrade 6: Dedo Fantasma (Auto-Clicker)
        if ((jogo.upgradesAlmas[6] || 0) >= 1 && jogo.autoClickerAtivo !== false && jogo.timeAtordoado <= 0) {
            window.executarCliqueManual(false); // 1º Clique (0ms)
            setTimeout(() => { if (jogo.estado === 'jogando') window.executarCliqueManual(false); }, 200); // 2º Clique
            setTimeout(() => { if (jogo.estado === 'jogando') window.executarCliqueManual(false); }, 400); // 3º Clique
            setTimeout(() => { if (jogo.estado === 'jogando') window.executarCliqueManual(false); }, 600); // 4º Clique
            setTimeout(() => { if (jogo.estado === 'jogando') window.executarCliqueManual(false); }, 800); // 5º Clique
        }

        // Loop para gerenciar as Habilidades Ativas e Cooldowns
        jogo.timeAtivo.forEach(idx => {
            let heroi = jogo.herois[idx];
            if (heroi.skills) {
                heroi.skills.forEach(skill => {
                    if (skill.ativa) {
                        skill.duracaoAtual--;
                        if (skill.duracaoAtual <= 0) skill.ativa = false;
                    }
                    if (skill.cooldownAtual > 0) {
                        // Buff 3: Fluxo Temporal (Acelera cooldown)
                        let aceleracao = 1 + ((jogo.upgradesAlmas[3] || 0) * 0.10);
                        if (jogo.frestaDesafio.ativa) aceleracao *= 2;
                        if (jogo.buffsAtivos && jogo.buffsAtivos.fluxoVeloz > 0) aceleracao *= 3;
                        if (petAtivo && petAtivo.id === 'fada') aceleracao *= 1.10;
                        if (jogo.timeAtivo.includes(2) && jogo.herois[2]?.talento === 'B') aceleracao *= 1.25; // Senhor do Tempo
                        skill.cooldownAtual = Math.max(0, skill.cooldownAtual - aceleracao);
                    }
                });
            }
        });

        // Lógica de Buffs do Cavaleiro de Ferro
        let buffPassivoCavaleiro = 1.0;
        let buffAtivoCavaleiro = 1.0;
        if (jogo.timeAtivo.includes(3) && jogo.herois[3] && (jogo.herois[3].desbloqueada || jogo.herois[3].nivelDps > 0)) {
            let multPassivo = (jogo.herois[3].talento === 'A') ? 0.02 : 0.01;
            buffPassivoCavaleiro = 1.05 + ((jogo.herois[3].nivelDps || 0) * multPassivo);
            if (jogo.herois[3].skills && jogo.herois[3].skills[0] && jogo.herois[3].skills[0].ativa) {
                buffAtivoCavaleiro = 1.5; // +50% de DPS ativo
            }
        }

        if (jogo.timeAtordoado <= 0) {
            // --- PASSIVA DO CAVALEIRO: Esmagamento de Escudo ---
            if (jogo.timeAtivo.includes(3) && jogo.herois[3] && (jogo.herois[3].desbloqueada || jogo.herois[3].nivelDps > 0)) {
                let cavaleiro = jogo.herois[3];
                let chanceEscudada = cavaleiro.talento === 'B' ? (cavaleiro.chanceCritico * 2) : cavaleiro.chanceCritico;
                if (Math.random() < chanceEscudada) {
                    let baseCrit = 2.0 + (jogo.artefatos.cristalDragao || 0);
                    let multCrit = baseCrit + ((cavaleiro.nivelCritico || 0) * 0.1);
                    let danoEscudada = (cavaleiro.dps || 1) * 5 * multCrit * buffPassivoCavaleiro;
                    if (cavaleiro.talento === 'B' && jogo.ataqueChefe) {
                        jogo.ataqueChefe.atordoado = Math.max(jogo.ataqueChefe.atordoado || 0, 1);
                    }
                    atacar(danoEscudada, true, 25, 'shieldBash');
                }
            }

            // --- SINERGIA: Mago + Ladra ---
            if (jogo.timeAtivo.includes(2) && jogo.timeAtivo.includes(4) && (jogo.monstroLodoToxico || 0) > 0) {
                if (Math.random() < 0.20) { 
                    let danoExplosao = jogo.herois[2].dps * 5; 
                    jogo.monstroLodoToxico = Math.max(0, jogo.monstroLodoToxico - 1);
                    atacar(danoExplosao, true, 20, "explosaoVeneno");
                }
            }

            jogo.timeAtivo.forEach(index => {
                let heroi = jogo.herois[index];
                if (index === 0 || heroi.desbloqueada || heroi.nivelDps > 0) {
                    // Mago (2): Multi-hit ativo delegado ao loop de render
                    if (index === 2 && heroi.skills && heroi.skills[0] && heroi.skills[0].ativa) {
                        return; 
                    }

                    let chanceCritFinal = heroi.chanceCritico + ((jogo.upgradesAlmas[1] || 0) * 0.02);
                    if (petAtivo && petAtivo.id === 'dragao') chanceCritFinal += 0.20;
                    if (index === 6 && heroi.talento === 'A') chanceCritFinal += 0.20; // Bárbaro Fúria Carniceira
                    
                    let isCrit = Math.random() < chanceCritFinal;
                    if (index === 6 && heroi.skills && heroi.skills[0] && heroi.skills[0].ativa) {
                        isCrit = true; // Bárbaro 100% crit em frenzy
                    }

                    let multCritico = 3 + (jogo.artefatos.cristalDragao || 0);
                    if (index === 4 && heroi.talento === 'B') multCritico += 0.40; // Sombra Fatal
                    let danoHeroi = isCrit ? heroi.dps * multCritico : heroi.dps;

                    // Talento A da Elfa (Caçadora dos Ventos): 2x flechas (+100% DPS)
                    if (index === 1 && heroi.talento === 'A') {
                        danoHeroi *= 2.0;
                    }

                    // Talento B da Ladra (Sombra Fatal): Execução em monstros abaixo de 35% HP
                    if (index === 4 && heroi.talento === 'B' && (jogo.monstroHp / jogo.monstroHpMax) <= 0.35) {
                        danoHeroi *= 2.0;
                    }

                    // Bárbaro (6): Mecânica de Frenesi Crescente
                    if (index === 6) {
                        let hpPct = Math.max(0.05, jogo.monstroHp / jogo.monstroHpMax);
                        let maxEscala = heroi.talento === 'A' ? 2.5 : 1.5;
                        let multFrenesi = 1.0 + (1.0 - hpPct) * maxEscala;
                        danoHeroi *= multFrenesi;
                        if (heroi.talento === 'B' && isCrit && Math.random() < 0.25 && jogo.ataqueChefe) {
                            jogo.ataqueChefe.atordoado = Math.max(jogo.ataqueChefe.atordoado || 0, 2);
                        }
                    }
                    
                    if (heroi.skills && heroi.skills[0] && heroi.skills[0].ativa && heroi.skills[0].multiplicadorDano) {
                        danoHeroi *= heroi.skills[0].multiplicadorDano;
                    }
                    
                    let buffAres = 1 + ((jogo.reliquiasPantheon[0] || 0) * 0.01);
                    danoHeroi *= buffPassivoCavaleiro * buffAtivoCavaleiro * buffAres;
                    
                    let tipo = 'normal';
                    if (index === 1) tipo = 'dpsPassivoElfa';
                    else if (index === 2) tipo = 'passivoMago';
                    else if (index === 3) tipo = 'passivoCavaleiro';
                    else if (index === 4) {
                        let maxLodo = heroi.talento === 'A' ? 30 : 15;
                        jogo.monstroLodoToxico = Math.min(maxLodo, (jogo.monstroLodoToxico || 0) + 1);
                    } else if (index === 5) {
                        tipo = 'passivoClerigo';
                    } else if (index === 6) {
                        tipo = 'passivoBarbaro';
                    }

                    if (danoHeroi > 0) atacar(danoHeroi, isCrit, 15, tipo);
                }
            });
        }

        const abaGuilda = document.getElementById("abaGuilda");
        if (abaGuilda && abaGuilda.classList.contains("active") && window.renderizarGuilda) {
            window.renderizarGuilda();
        }
        salvarJogo();
        atualizarInterface();
    }, 1000);

    renderizarBotoesUpgrades();
    atualizarInterface();
    desenhar();
});

// --- FUNÇÕES DO PAINEL DE DEBUG ---
window.alternarPainelDebug = function() {
    const painel = document.getElementById('painelDebugAdmin');
    if (painel) {
        painel.style.display = painel.style.display === 'none' ? 'block' : 'none';
    }
};

window.debugAdicionarPontos = function(qtd) {
    jogo.pontos += qtd;
    atualizarInterface();
    salvarJogo();
};

window.debugAdicionarGemas = function(qtd) {
    jogo.gemas += qtd;
    atualizarInterface();
    salvarJogo();
};

window.debugAdicionarAlmas = function(qtd) {
    if (jogo.almasPoligonais !== undefined) {
        jogo.almasPoligonais += qtd;
    } else {
        jogo.multiplicadorAscensao += qtd;
    }
    atualizarInterface();
    salvarJogo();
};

window.debugAvancarNiveis = function(qtd) {
    jogo.nivel += qtd;
    jogo.monstroHpMax = calcularHpMaximo(jogo.nivel);
    jogo.monstroHp = jogo.monstroHpMax;
    if (jogo.nivel > (jogo.nivelMaximo || 1)) jogo.nivelMaximo = jogo.nivel;
    atualizarInterface();
    salvarJogo();
};

window.debugResetarCooldowns = function() {
    jogo.herois.forEach(heroi => {
        if (heroi.skills) {
            heroi.skills.forEach(skill => {
                skill.cooldownAtual = 0;
                skill.duracaoAtual = 0;
                skill.ativa = false;
            });
        }
    });
    atualizarInterface();
};

window.debugDesbloquearTudo = function() {
    if (!jogo.desbloqueios) jogo.desbloqueios = {};
    for (let k in jogo.desbloqueios) {
        jogo.desbloqueios[k] = true;
    }
    jogo.desbloqueios.equipe = true;
    jogo.desbloqueios.gacha = true;
    jogo.desbloqueios.forja = true;
    jogo.desbloqueios.marcos = true;
    jogo.desbloqueios.guilda = true;
    jogo.desbloqueios.santuario = true;
    jogo.desbloqueios.pantheon = true;
    jogo.desbloqueios.frestas = true;
    jogo.desbloqueios.mascotes = true;
    jogo.desbloqueios.torre = true;
    jogo.desbloqueios.taverna = true;
    atualizarInterface();
    mostrarNotificacao("🔓 Todas as abas foram desbloqueadas!");
    salvarJogo();
};

window.debugDroparEquipamentos = function() {
    let it1 = gerarItemLoot(10);
    let it2 = gerarItemLoot(25);
    let it3 = gerarItemLoot(45);
    if (!jogo.equipamentos) jogo.equipamentos = { inventario: [], equipados: { arma: null, armadura: null, amuleto: null }, poDeForja: 0 };
    if (!jogo.equipamentos.inventario) jogo.equipamentos.inventario = [];
    jogo.equipamentos.inventario.push(it1, it2, it3);
    jogo.equipamentos.poDeForja = (jogo.equipamentos.poDeForja || 0) + 100;
    mostrarNotificacao(`🎁 3 Equipamentos gerados e +100 Pó de Forja adicionados!`);
    salvarJogo();
    if (document.getElementById("abaEquipe")?.classList.contains("active")) {
        renderizarPainelEquipamentos();
    }
};

window.debugDesbloquearHerois = function() {
    if (!jogo.herois) return;
    jogo.herois.forEach((h, idx) => {
        h.desbloqueado = true;
        if (h.nivel < 10) h.nivel = 10;
    });
    // Ensure active party has 5 heroes if available
    for (let i = 0; i < jogo.herois.length; i++) {
        if (!jogo.timeAtivo.includes(i) && jogo.timeAtivo.length < 5) {
            jogo.timeAtivo.push(i);
        }
    }
    mostrarNotificacao("👥 Todos os Heróis (incluindo Clérigo e Bárbaro) Desbloqueados e Nível 10+!");
    atualizarInterface();
    if (document.getElementById("abaEquipe")?.classList.contains("active")) {
        renderizarPainelEquipe();
    }
    salvarJogo();
};

window.debugRolarDadosGratis = function() {
    jogo.taverna.energia = Math.max(jogo.taverna.energia || 0, 5);
    jogo.pontos += 5000;
    jogo.gemas += 50;
    mostrarNotificacao("🎲 Recursos adicionados! Rolando dados dos Anões...");
    if (window.jogarDadosAnao) {
        window.jogarDadosAnao('energia');
    }
};


window.resgatarContrato = function(index) {
    let contrato = jogo.guilda.contratos[index];
    if (contrato && contrato.atual >= contrato.meta && !contrato.resgatado) {
        contrato.resgatado = true;
        jogo.gemas += contrato.premioGemas;
        mostrarNotificacao(`📜 Contrato Resgatado!\n+${contrato.premioGemas} Gemas para a conta!`);
        atualizarInterface();
        if (window.renderizarGuilda) window.renderizarGuilda();
        salvarJogo();
    }
};

window.fecharRelatorioOffline = function() {
    document.getElementById("painelOffline").classList.add("escondido");
    if(window.tocarSom) window.tocarSom('ataque');
};

window.mostrarRelatorioOffline = function(segundos, monstrosMortos, pontosGanhos) {
    let horas = Math.floor(segundos / 3600);
    let mins = Math.floor((segundos % 3600) / 60);
    document.getElementById("offTempo").innerText = `${horas}h ${mins}m`;
    
    let elMonstros = document.getElementById("offMonstros");
    let elOuro = document.getElementById("offOuro");
    
    // Animação de contagem girando rápido
    animarContador(elMonstros, monstrosMortos);
    animarContador(elOuro, pontosGanhos);
    
    document.getElementById("painelOffline").classList.remove("escondido");
    
    // Toca som mágico de vitória
    setTimeout(() => { if(window.tocarSom) window.tocarSom('moeda'); }, 300);
};

function animarContador(elemento, alvo) {
    let atual = 0;
    let incremento = Math.ceil(alvo / 40); // Roda em 40 frames
    let intervalo = setInterval(() => {
        atual += incremento;
        if (atual >= alvo) {
            atual = alvo;
            clearInterval(intervalo);
        }
        elemento.innerText = atual.toLocaleString('pt-BR');
    }, 40);
}

window.toggleSidebar = function() {
    const sb = document.getElementById("sidebarAbas");
    if (sb) sb.classList.toggle("fechada");
};

window.subirReliquia = function(idx) {
    let nivel = jogo.reliquiasPantheon[idx] || 0;
    let custo = 10 + (nivel * 5);
    if (jogo.fragmentosUniversais >= custo) {
        jogo.fragmentosUniversais -= custo;
        jogo.reliquiasPantheon[idx] = nivel + 1;
        salvarJogo();
        if (window.renderizarPantheon) window.renderizarPantheon();
        atualizarInterface();
    } else {
        mostrarNotificacao("❌ Fragmentos Universais Insuficientes!");
    }
};

window.iniciarDesafioFresta = function() {
    if (!jogo.frestaDesafio.ativa) {
        jogo.frestaDesafio.ativa = true;
        jogo.frestaDesafio.andarAtual = 1;
        jogo.frestaDesafio.tempoRestante = 30;
        jogo.frestaDesafio.tipoInimigo = Math.floor(Math.random() * 3);
        
        // Fixando a dificuldade da Fresta (Endgame) independente da campanha
        const NIVEL_BASE_FRESTA = 41; 
        let hpBaseAtual = calcularHpMaximo(NIVEL_BASE_FRESTA);
        
        jogo.monstroHpMax = Math.floor(hpBaseAtual * 2);
        jogo.monstroHp = jogo.monstroHpMax;
        
        salvarJogo();
        if (window.renderizarFrestas) window.renderizarFrestas();
        atualizarInterface();
        
        // Força a UI a esconder a sidebar para o jogador focar na luta
        const sb = document.getElementById("sidebarAbas");
        if (sb) sb.classList.add("fechada");
    }
};

window.progredirContrato = function(idContrato, quantidade = 1) {
    let contrato = jogo.guilda.contratos.find(c => c.id === idContrato);
    if (contrato && contrato.atual < contrato.meta && !contrato.resgatado) {
        contrato.atual = Math.min(contrato.meta, contrato.atual + quantidade);
    }
};

window.iniciarExpedicao = function(heroiIndex) {
    if (!jogo.guilda.expedicao.ativa) {
        jogo.guilda.expedicao.ativa = true;
        jogo.guilda.expedicao.heroiIndex = heroiIndex;
        jogo.guilda.expedicao.tempoFim = Date.now() + 3600000; // 1 hora
        atualizarInterface();
        if (window.renderizarGuilda) window.renderizarGuilda();
        salvarJogo();
    }
};

window.resgatarExpedicao = function() {
    if (jogo.guilda.expedicao.ativa && Date.now() >= jogo.guilda.expedicao.tempoFim) {
        let heroi = jogo.herois[jogo.guilda.expedicao.heroiIndex];
        let premioPontos = Math.max(100, Math.floor(heroi.dps * 3600)); // Pontos baseados no DPS ou 100 no mínimo
        let premioGemas = 20; // Recompensa fixa de gemas
        jogo.pontos += premioPontos;
        jogo.gemas += premioGemas;
        jogo.guilda.expedicao.ativa = false;
        jogo.guilda.expedicao.heroiIndex = null;
        jogo.guilda.expedicao.tempoFim = 0;
        mostrarNotificacao(`🏕️ Expedição Concluída!\nO herói encontrou:\n+${premioPontos} Pontos\n+${premioGemas} Gemas`);
        atualizarInterface();
        if (window.renderizarGuilda) window.renderizarGuilda();
        salvarJogo();
    }
};