import { jogo, salvarJogo, carregarJogo, calcularHpMaximo, calcularRecompensa, resetarJogo, executarAscensao, exportarProgressoFisico, importarProgressoFisico } from './state.js';
import { darTiroGacha } from './gacha.js';
import { desenhar, textosFlutuantes, animacao, mostrarNotificacao, desenharPortrait, ativarJuice } from './render.js';

// --- CHIP DE SOM 8-BIT (SINTETIZADOR) ---
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
// Navegadores exigem interação do usuário para liberar o áudio
window.addEventListener('mousedown', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

window.tocarSom = function(tipo) {
    if (!audioCtx) return;
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

const custosAlmasBase = [1, 2, 1, 2, 5];

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
                            DPS (+1)<br><small>Nvl: <span id="nivelDps_${index}">${heroi.nivelDps}</span> | Custo: <span id="custoUpgrade_${index}">${heroi.custoDps}</span></small>
                        </button>
                        <button id="btnCrit_${index}" class="btn-upgrade btn-crit" onclick="comprarCritico(${index})">
                            Crítico +5%<br><small>Nvl: <span id="nivelCritico_${index}">${heroi.nivelCritico}</span> | Custo: <span id="custoCritico_${index}">${heroi.custoCritico}</span></small>
                        </button>
                    </div>
                    ${heroi.skills ? heroi.skills.map((skill, sIdx) => {
                        let descUpgrade = skill.multiplicadorDanoInstantaneo !== undefined ? "+5 Mult. Burst" : "+1 Mult. Dano";
                        return `
                            <div class="skill-upgrade-block" style="margin-top: 10px; border-top: 1px dashed rgba(92,58,33,0.3); padding-top: 10px;">
                                <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #a04000;">Melhorar ${skill.nome}</h4>
                                <p style="font-style: italic; font-size: 12px; color: #5c3a21; margin: 2px 0 10px 0;">${skill.descricao}</p>
                                <button id="btnUpgradeSkill_${index}_${sIdx}" class="btn-upgrade" style="background: #c0392b; color: white; width: 100%;" onclick="comprarUpgradeSkill(${index}, ${sIdx})">
                                    ${descUpgrade}<br><small>Nvl: <span id="nivelSkill_${index}_${sIdx}">${skill.nivel || 1}</span> | Custo: <span id=\"custoSkill_${index}_${sIdx}\">${skill.custoUpgrade || 100}</span></small>
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
                btnHTML = `<button class="btn-upgrade" style="background: ${ehPrincipal ? '#7f8c8d' : '#e74c3c'}; color: white;" onclick="alternarHeroiNoTime(${index})" ${ehPrincipal ? 'disabled' : ''}>${ehPrincipal ? 'Obrigatório' : 'Remover'}</button>`;
            } else {
                btnHTML = `<button class="btn-upgrade" style="background: #2ecc71; color: white;" onclick="alternarHeroiNoTime(${index})" ${!podeEscalar ? 'disabled' : ''}>Escalar</button>`;
            }

            painel.innerHTML += `
                <div class="heroi-card" style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 400px; text-align: left; margin: 0 auto 5px auto;">
                    <div>
                        <h3 style="margin: 0; color: #f1c40f; font-size: 15px;">${heroi.nome}</h3>
                    </div>
                    ${btnHTML}
                </div>
            `;
        }
    });
}

export function renderizarListaPremiosGacha() {
    const painel = document.getElementById("listaPremiosGacha");
    if (!painel) return;

    painel.innerHTML = "";
    const funcoes = ["", "Burst", "Atacante", "Suporte Passivo"];

    for (let i = 1; i < jogo.herois.length; i++) {
        let heroi = jogo.herois[i];
        let funcao = funcoes[i] || "Herói";
        painel.innerHTML += `
            <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; border-left: 4px solid #8e44ad;">
                <strong style="color: #2c1d11; font-size: 14px;">${heroi.nome} ${'⭐'.repeat(heroi.estrelas || 1)}</strong>
                <span style="font-size: 11px; background: #8e44ad; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 5px; box-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${funcao}</span>
                <p style="margin: 5px 0; font-style: italic; color: #5c3a21; line-height: 1.4;">${heroi.descricao}</p>
                <p style="margin: 0; font-size: 11px; color: #a04000;"><strong>🎯 Probabilidade:</strong> 5% Personagem / 25% Fragmentos | Pity garantido aos 50 Tiros.</p>
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
        "Conjurador Automático: Ativa habilidades automaticamente"
    ];

    const podeAscender = jogo.nivel >= 30;

    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #9b59b6; margin-bottom: 10px;">✨ Almas Poligonais Disponíveis: ${jogo.almasPoligonais || 0}</h3>
            <button id="btnAscensão" class="btn-upgrade" style="background: #9b59b6; max-width: 300px; width: 100%; margin: 0 auto;" onclick="ascender()" ${podeAscender ? "" : "disabled"}>
                ${podeAscender ? "Realizar Ascensão Cósmica" : "Bloqueado (Chegue ao Nível 30)"}
            </button>
        </div>
    `;
    html += `<div class="painel-upgrades">`;

    for (let i = 0; i < 5; i++) {
        let nivel = jogo.upgradesAlmas[i] || 0;
        let custo = i === 4 ? 5 : custosAlmasBase[i] * Math.pow(2, nivel); // Custo dobra a cada nível comprado, exceto auto-cast
        let maxNivel = i === 4 && nivel >= 1;
        let podeComprar = (jogo.almasPoligonais || 0) >= custo && !maxNivel;
        let podeInteragir = podeComprar || (i === 4 && maxNivel);
        
        let textBotao;
        let corBotao;
        if (i === 4 && maxNivel) {
            let ligado = jogo.autoCastAtivo !== false;
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

    let html = "";

    const temManopla = jogo.artefatos.manoplaOrc;
    const podeForjarManopla = jogo.inventario.couroOrc >= 3 && !temManopla;
    let textoBtnManopla = temManopla ? "Equipado" : "Forjar (3x Couro de Orc)";
    let corBtnManopla = temManopla ? "#7f8c8d" : (podeForjarManopla ? "#d35400" : "#7f8c8d");

    html += `
        <div class="heroi-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <h4 style="margin: 0; color: #f1c40f; font-size: 15px;">🧤 Manopla Feroz do Orc</h4>
            <p style="margin: 0; font-size: 13px; color: #5c3a21; font-style: italic;">Efeito: +2s na duração de todas as habilidades.</p>
            <button class="btn-upgrade" style="background: ${corBtnManopla}; width: 100%; margin-top: auto;" onclick="forjarArtefato('manoplaOrc')" ${temManopla || !podeForjarManopla ? 'disabled' : ''}>
                ${textoBtnManopla}
            </button>
        </div>
    `;

    const temGlandula = jogo.artefatos.glandulaHidra;
    const podeForjarGlandula = jogo.inventario.escamasHidra >= 3 && !temGlandula;
    let textoBtnGlandula = temGlandula ? "Equipado" : "Forjar (3x Escama de Hidra)";
    let corBtnGlandula = temGlandula ? "#7f8c8d" : (podeForjarGlandula ? "#8e44ad" : "#7f8c8d");

    html += `
        <div class="heroi-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <h4 style="margin: 0; color: #f1c40f; font-size: 15px;">🧪 Glândula Tóxica da Hidra</h4>
            <p style="margin: 0; font-size: 13px; color: #5c3a21; font-style: italic;">Efeito: -2s de Cooldown Máximo nas habilidades.</p>
            <button class="btn-upgrade" style="background: ${corBtnGlandula}; width: 100%; margin-top: auto;" onclick="forjarArtefato('glandulaHidra')" ${temGlandula || !podeForjarGlandula ? 'disabled' : ''}>
                ${textoBtnGlandula}
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
        if (heroi.skills) {
            heroi.skills.forEach((skill, sIdx) => {
                const spanNivelSkill = document.getElementById(`nivelSkill_${index}_${sIdx}`);
                if (spanNivelSkill) {
                    spanNivelSkill.innerText = skill.nivel || 1;
                    document.getElementById(`custoSkill_${index}_${sIdx}`).innerText = skill.custoUpgrade || 100;
                    document.getElementById(`btnUpgradeSkill_${index}_${sIdx}`).disabled = jogo.pontos < (skill.custoUpgrade || 100);
                }
            });
        }
    });

    const prefixos = ["🔥", "🏹", "🔮", "⚙️", "☠️"];

    for (let index = 0; index < 5; index++) {
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
    
    const elCouro = document.getElementById("qtdCouro");
    if (elCouro) elCouro.innerText = jogo.inventario.couroOrc || 0;
    const elEscama = document.getElementById("qtdEscama");
    if (elEscama) elEscama.innerText = jogo.inventario.escamasHidra || 0;

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
    
    let custo = upgradeId === 4 ? 5 : custosAlmasBase[upgradeId] * Math.pow(2, nivelAtual);
    
    if ((jogo.almasPoligonais || 0) >= custo && (upgradeId !== 4 || nivelAtual < 1)) {
        jogo.almasPoligonais -= custo;
        jogo.upgradesAlmas[upgradeId] = nivelAtual + 1;
        if (upgradeId === 4) jogo.autoCastAtivo = true;
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
        if (!jogo.desbloqueios) jogo.desbloqueios = { equipe: false, santuario: false, pantheon: false, frestas: false };
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

        // 2. Desbloquear Santuário (Nível 31)
        if (!jogo.desbloqueios.santuario && jogo.nivel >= 31) {
            jogo.desbloqueios.santuario = true;
            window.mostrarTutorial("santuario", "✨ Santuário", "O Santuário foi revelado! Aqui você canaliza Almas Poligonais para buffs globais.");
            mudou = true;
        }

        // 3. Desbloquear Panteão e Frestas (Primeira Ascensão)
        if (!jogo.desbloqueios.pantheon && jogo.multiplicadorAscensao > 1) {
            jogo.desbloqueios.pantheon = true;
            jogo.desbloqueios.frestas = true;
            window.mostrarTutorial("pantheon", "🏛️ Panteão", "Os deuses notaram sua ascensão! O Panteão e as Frestas estão abertos.");
            mudou = true;
        }

        if (mudou) atualizarInterface();
    };

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
    
    if (window.tocarSom) window.tocarSom('ataque'); 
};

window.darTiroGacha = darTiroGacha;
window.resetarJogo = resetarJogo;
window.ascender = executarAscensao;
window.exportarSaveFisico = exportarProgressoFisico;
window.importarSaveFisico = importarProgressoFisico;
window.renderizarForja = renderizarForja;
window.renderizarGuilda = renderizarGuilda;

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
        let cooldownBuff = jogo.artefatos.glandulaHidra ? 2 : 0;
        skill.cooldownAtual = Math.max(1, skill.cooldownMax - cooldownBuff);
        window.progredirContrato("skills");
        
        if (skill.multiplicadorDanoInstantaneo !== undefined) {
            let buffAres = 1 + ((jogo.reliquiasPantheon[0] || 0) * 0.01);
            let buffPassivoCavaleiro = 1.0;
            if (jogo.timeAtivo.includes(3) && jogo.herois[3] && (jogo.herois[3].desbloqueada || jogo.herois[3].nivelDps > 0)) {
                buffPassivoCavaleiro = 1.05 + ((jogo.herois[3].nivelDps || 0) * 0.01);
            }
            let buffAtivoCavaleiro = (jogo.timeAtivo.includes(3) && jogo.herois[3].skills && jogo.herois[3].skills[0].ativa) ? 1.5 : 1.0;
            
            let dpsTotalBuffado = heroi.dps * buffAres * buffPassivoCavaleiro * buffAtivoCavaleiro;
            let danoBurst = dpsTotalBuffado * skill.multiplicadorDanoInstantaneo;
            
            if (heroiIndex === 4) { // Ladra de Presas consome as pilhas
                let acumulos = jogo.monstroLodoToxico || 1;
                danoBurst *= acumulos;
                jogo.monstroLodoToxico = 0; 
            }

            let isCrit = Math.random() < heroi.chanceCritico;
            if (isCrit) danoBurst *= 3;
            let tipoBurst = heroiIndex === 1 ? 'burstElfa' : (heroiIndex === 4 ? 'burstLadra' : 'normal');
            atacar(danoBurst, isCrit, 45, tipoBurst);
        } else {
            skill.ativa = true;
            let durationBuff = jogo.artefatos.manoplaOrc ? 2 : 0;
            skill.duracaoAtual = skill.duracaoMax + durationBuff;
        }
        
        atualizarInterface();
    }
};

window.forjarArtefato = function(idArtefato) {
    if (idArtefato === 'manoplaOrc' && jogo.inventario.couroOrc >= 3 && !jogo.artefatos.manoplaOrc) {
        jogo.inventario.couroOrc -= 3;
        jogo.artefatos.manoplaOrc = true;
        atualizarInterface();
        if (window.renderizarForja) window.renderizarForja();
        salvarJogo();
    } else if (idArtefato === 'glandulaHidra' && jogo.inventario.escamasHidra >= 3 && !jogo.artefatos.glandulaHidra) {
        jogo.inventario.escamasHidra -= 3;
        jogo.artefatos.glandulaHidra = true;
        atualizarInterface();
        if (window.renderizarForja) window.renderizarForja();
        salvarJogo();
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
            abaFrestas:  { t: "🌌 Frestas Dimensionais", d: "Uma fenda no espaço-tempo. Você terá apenas 30 segundos e Cooldowns 2x mais rápidos para abater um chefe de HP exponencial e extrair moedas míticas!" }
        };

        const tutorial = resumosTutoriais[abaId];
        if (tutorial && window.mostrarTutorial) {
            // Utiliza o layout de pergaminho estilizado que já criamos
            window.mostrarTutorial(abaId, tutorial.t, tutorial.d);
        }
    }
};

export function atacar(dano, isCritico = false, duracaoAnimacao = 15, tipo = 'normal') {
    // Flag para evitar poluição visual do Raio Arcino
    let suprimirTextos = (tipo === 'burstMago');

    // Se a animação atual é o burst da elfa, não interrompe ela visualmente se houver um ataque ou clique normal!
    if (!(animacao.ativa && animacao.tipo === 'burstElfa' && tipo === 'normal')) {
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
    }

    let danoFinal = dano * multiplicadorElemental * (jogo.multiplicadorAscensao || 1);

    if (!suprimirTextos) {
        textosFlutuantes.push({
            texto: textoAtaque + `-${Math.floor(danoFinal)}`,
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

        if (jogo.frestaDesafio && jogo.frestaDesafio.ativa) {
            jogo.frestaDesafio.andarAtual++;
            jogo.frestaDesafio.tempoRestante = 30; // Reseta o tempo
            // O HP sofre um aumento exponencial de 50% por andar
            jogo.monstroHpMax = Math.floor(calcularHpMaximo(jogo.nivel) * Math.pow(1.5, jogo.frestaDesafio.andarAtual));
            jogo.monstroHp = jogo.monstroHpMax;
            
            let recompensaFresta = calcularRecompensa(jogo.nivel) * jogo.frestaDesafio.andarAtual;
            if (Math.random() < ((jogo.reliquiasPantheon[2] || 0) * 0.01)) recompensaFresta *= 2; // Bênção de Midas
            jogo.pontos += recompensaFresta;
            textosFlutuantes.push({ texto: `+${recompensaFresta} pts`, x: 400 + (Math.random() * 60 - 30), y: 80, alpha: 1, duracao: 60, cor: "241, 196, 15" });
            
            atualizarInterface();
            return; // Impede que o nível normal da campanha avance
        }

        const recompensa = calcularRecompensa(jogo.nivel);
        let ganhoPontos = recompensa;
        if (Math.random() < ((jogo.reliquiasPantheon[2] || 0) * 0.01)) ganhoPontos *= 2; // Bênção de Midas
        jogo.pontos += ganhoPontos;
        
        jogo.monstrosMortos++;
        window.progredirContrato("mortes");

        if (jogo.nivel % 5 === 0) {
            window.progredirContrato("chefes");
            let gemasGanhos = 5 + (jogo.upgradesAlmas[2] || 0);
            jogo.gemas += gemasGanhos;
            textosFlutuantes.push({ texto: `+${gemasGanhos} Gemas`, x: 400 + (Math.random() * 60 - 30), y: 60, alpha: 1, duracao: 80, cor: "155, 89, 182", tamanho: "bold 18px sans-serif" });

            const isPantano = Math.floor((jogo.nivel - 1) / 15) % 2 === 1;
            if (isPantano) {
                jogo.inventario.escamasHidra += 1;
                textosFlutuantes.push({ texto: "+1 Escama de Hidra", x: 400 + (Math.random() * 60 - 30), y: 40, alpha: 1, duracao: 100, cor: "46, 204, 113", tamanho: "bold 16px sans-serif" });
            } else {
                jogo.inventario.couroOrc += 1;
                textosFlutuantes.push({ texto: "+1 Couro de Orc", x: 400 + (Math.random() * 60 - 30), y: 40, alpha: 1, duracao: 100, cor: "139, 69, 19", tamanho: "bold 16px sans-serif" });
            }
        }
        textosFlutuantes.push({ texto: `+${recompensa} pts`, x: 400 + (Math.random() * 60 - 30), y: 80, alpha: 1, duracao: 60, cor: "241, 196, 15" });

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

// Boot do Sistema e Bindings de Evento
window.addEventListener('DOMContentLoaded', () => {
    regularResolucaoCanvas();
    window.addEventListener("resize", regularResolucaoCanvas);

    const canvas = document.getElementById("jogoCanvas");
    if (canvas) {
        canvas.addEventListener("mousedown", () => {
            jogo.cliquesTotais++;
            window.progredirContrato("cliques");

            let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
            let heroi = jogo.herois[0];
            let dano = heroi.dps + Math.floor(dpsTotal * 0.10);
            
            // Buff 0: Poder Primordial (+10% dano de clique)
            dano *= (1 + ((jogo.upgradesAlmas[0] || 0) * 0.10));

            let skillFogo = heroi.skills && heroi.skills[0];
            if (skillFogo && skillFogo.ativa) {
                dano *= skillFogo.multiplicadorDano;
            }

            // Buff 1: Visão Letal (+2% crit global)
            let chanceCritFinal = heroi.chanceCritico + ((jogo.upgradesAlmas[1] || 0) * 0.02);
            let isCrit = Math.random() < chanceCritFinal;
            if (isCrit) dano *= 3;
            
            let buffAres = 1 + ((jogo.reliquiasPantheon[0] || 0) * 0.01);
            let buffCavaleiroClique = (jogo.timeAtivo.includes(3) && jogo.herois[3].skills && jogo.herois[3].skills[0].ativa) ? 2.0 : 1.0;
            dano *= buffAres * buffCavaleiroClique;

            atacar(dano, isCrit);
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
            let pontosOffline = Math.floor(tempoBuffado * (dpsTotal * buffPassivoCavaleiro * buffAres * buffPrimordial));
            
            if(pontosOffline > 0) {
                jogo.pontos += pontosOffline;
                let estimativaMonstros = Math.floor(pontosOffline / 10);
                
                // SALVA OS DADOS PARA ABRIR SÓ QUANDO DER O START!
                window.dadosOfflinePendente = { tempo: tempoFora, monstros: estimativaMonstros, pontos: pontosOffline };
            }
        }

    setInterval(() => {
        verificarMarcos();

        // Lógica de Tempo do Desafio das Frestas
        if (jogo.frestaDesafio && jogo.frestaDesafio.ativa) {
            jogo.frestaDesafio.tempoRestante--;
            if (window.renderizarFrestas) window.renderizarFrestas();

            if (jogo.frestaDesafio.tempoRestante <= 0) { // O tempo acabou!
                jogo.frestaDesafio.ativa = false;
                let premio = jogo.frestaDesafio.andarAtual * 2;
                jogo.fragmentosUniversais = (jogo.fragmentosUniversais || 0) + premio;
                
                // Reverte o monstro para a dificuldade da campanha normal
                jogo.monstroHpMax = calcularHpMaximo(jogo.nivel);
                jogo.monstroHp = jogo.monstroHpMax;
                
                mostrarNotificacao(`🌌 Fresta Colapsou!\nVocê chegou ao Andar ${jogo.frestaDesafio.andarAtual}\nPrêmio: +${premio} Fragmentos Universais`);
                if (window.renderizarFrestas) window.renderizarFrestas();
            }
        }

        // Sistema de Veneno (Ladra de Presas)
        if (jogo.timeAtivo.includes(4) && jogo.herois[4] && jogo.herois[4].nivelDps > 0) {
            let danoPoison = Math.floor(jogo.herois[4].dps * 0.5);
            if (danoPoison > 0) {
                atacar(danoPoison, false, 10, "lodoToxico");
                jogo.monstroLodoToxico = (jogo.monstroLodoToxico || 0) + 1;
            }
        }

        // Upgrade 4: Conjurador Automático (Auto-Cast)
        if ((jogo.upgradesAlmas[4] || 0) >= 1 && jogo.autoCastAtivo !== false) {
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
                    if (jogo.frestaDesafio.ativa) aceleracao *= 2; // Regra exclusiva do Desafio
                    skill.cooldownAtual = Math.max(0, skill.cooldownAtual - aceleracao);
                    }
                });
            }
        });

        // Lógica de Buffs do Cavaleiro de Ferro
        let buffPassivoCavaleiro = 1.0;
        let buffAtivoCavaleiro = 1.0;
        if (jogo.timeAtivo.includes(3) && jogo.herois[3] && (jogo.herois[3].desbloqueada || jogo.herois[3].nivelDps > 0)) {
            buffPassivoCavaleiro = 1.05 + ((jogo.herois[3].nivelDps || 0) * 0.01);
            if (jogo.herois[3].skills && jogo.herois[3].skills[0] && jogo.herois[3].skills[0].ativa) {
                buffAtivoCavaleiro = 1.5; // +50% de DPS ativo
            }
        }

        // --- PASSIVA DO CAVALEIRO: Esmagamento de Escudo ---
        if (jogo.timeAtivo.includes(3) && jogo.herois[3] && (jogo.herois[3].desbloqueada || jogo.herois[3].nivelDps > 0)) {
            let cavaleiro = jogo.herois[3];
            if (Math.random() < cavaleiro.chanceCritico) {
                let multCrit = 2.0 + ((cavaleiro.nivelCritico || 0) * 0.1);
                // O dano da escudada escala com o DPS dele + Dano Crítico
                let danoEscudada = (cavaleiro.dps || 1) * 5 * multCrit * buffPassivoCavaleiro;
                atacar(danoEscudada, true, 25, 'shieldBash');
            }
        }

        jogo.timeAtivo.forEach(index => {
            let heroi = jogo.herois[index];
            if (index === 0 || heroi.desbloqueada || heroi.nivelDps > 0) { // Verificação de segurança adicional
                // Mago de Glintstone (Índice 2): Multi-hit ativo não ataca por bloco (será delegado ao loop de renderização visual)
                if (index === 2 && heroi.skills && heroi.skills[0] && heroi.skills[0].ativa) {
                    return; 
                }

                // Buff 1: Visão Letal (+2% crit global)
                let chanceCritFinal = heroi.chanceCritico + ((jogo.upgradesAlmas[1] || 0) * 0.02);
                let isCrit = Math.random() < chanceCritFinal;
                let danoHeroi = isCrit ? heroi.dps * 3 : heroi.dps;
                
                if (heroi.skills && heroi.skills[0] && heroi.skills[0].ativa && heroi.skills[0].multiplicadorDano) {
                    danoHeroi *= heroi.skills[0].multiplicadorDano;
                }
                
                // Aplica os buffs provenientes do Cavaleiro e do Panteão (Ares)
                let buffAres = 1 + ((jogo.reliquiasPantheon[0] || 0) * 0.01);
                danoHeroi *= buffPassivoCavaleiro * buffAtivoCavaleiro * buffAres;
                
                let tipo = index === 1 ? 'dpsPassivoElfa' : (index === 2 ? 'passivoMago' : (index === 3 ? 'passivoCavaleiro' : 'normal'));
                if (danoHeroi > 0) atacar(danoHeroi, isCrit, 15, tipo); // Ignora 0 DPS natural do Cavaleiro de Ferro
            }
        });

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
        
        // Inicia o desafio dobrando o HP atual do nível base
        jogo.monstroHpMax = calcularHpMaximo(jogo.nivel) * 2;
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