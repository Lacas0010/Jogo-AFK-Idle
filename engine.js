import { jogo, salvarJogo, carregarJogo, calcularHpMaximo, calcularRecompensa, resetarJogo, executarAscensao, exportarProgressoFisico, importarProgressoFisico } from './state.js';
import { darTiroGacha } from './gacha.js';
import { desenhar, textosFlutuantes, animacao, mostrarNotificacao, desenharPortrait } from './render.js';

const custosAlmasBase = [1, 2, 1, 2, 5];

export function renderizarBotoesUpgrades() {
    const painel = document.getElementById("painelUpgrades");
    if (!painel) return;
    painel.innerHTML = "";
    jogo.herois.forEach((heroi, index) => {
        if (jogo.timeAtivo.includes(index) && (index === 0 || heroi.nivelDps > 0)) {
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
    
    const podeAscender = jogo.nivel >= 30;
    painel.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3>✨ Almas Poligonais: ${jogo.almasPoligonais}</h3>
            <button id="btnAscensão" class="btn-upgrade" style="background: #9b59b6; margin-bottom: 15px;" onclick="ascender()" ${podeAscender ? "" : "disabled"}>
                ${podeAscender ? "Realizar Ascensão Cósmica" : "Bloqueado (Chegue ao Nível 30)"}
            </button>
        </div>
    `;
    
    jogo.herois.forEach((heroi, index) => {
        if (jogo.timeAtivo.includes(index) && (index === 0 || heroi.nivelDps > 0)) {
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
        if (jogo.timeAtivo.includes(index) && (index === 0 || heroi.nivelDps > 0)) {
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
        if (index === 0 || heroi.nivelDps > 0) {
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

    let html = `<h3 style="color: #9b59b6; text-align: center; margin-bottom: 20px;">✨ Almas Poligonais Disponíveis: ${jogo.almasPoligonais || 0}</h3>`;
    html += `<div class="painel-upgrades">`;

    for (let i = 0; i < 5; i++) {
        let nivel = jogo.upgradesAlmas[i] || 0;
        let custo = i === 4 ? 5 : custosAlmasBase[i] * Math.pow(2, nivel); // Custo dobra a cada nível comprado, exceto auto-cast
        let maxNivel = i === 4 && nivel >= 1;
        let podeComprar = (jogo.almasPoligonais || 0) >= custo && !maxNivel;

        let textBotao = maxNivel 
            ? "🤖 ATIVADO (MÁX)" 
            : `Melhorar (Nvl ${nivel})<br><small>Custo: ✨ ${custo}</small>`;

        html += `
            <div class="heroi-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 8px; border-color: #9b59b6;">
                <h4 style="margin: 0; color: #f1c40f; font-size: 14px;">${descricoes[i].split(':')[0]}</h4>
                <p style="margin: 0; font-size: 12px; color: #5c3a21; font-style: italic;">${descricoes[i].split(':')[1]}</p>
                <button class="btn-upgrade" style="background: ${podeComprar ? '#9b59b6' : '#7f8c8d'}; width: 100%; margin-top: auto;" onclick="comprarUpgradeAlma(${i})" ${!podeComprar ? 'disabled' : ''}>
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
            if ((i === 0 || heroi.nivelDps > 0) && !jogo.timeAtivo.includes(i)) {
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

    const prefixos = ["🔥", "🏹", "🔮", "⚙️"];

    for (let index = 0; index < 4; index++) {
        const btnSkill = document.getElementById(`btnSkill_${index}_0`);
        if (btnSkill) {
            if (jogo.timeAtivo.includes(index) && jogo.herois[index] && (index === 0 || jogo.herois[index].nivelDps > 0) && jogo.herois[index].skills && jogo.herois[index].skills[0]) {
                btnSkill.style.display = "inline-block";
                let skill = jogo.herois[index].skills[0];
                let icone = prefixos[index];
                
                if (skill.ativa) {
                    btnSkill.innerText = `${icone} ATIVA (${skill.duracaoAtual}s)`;
                    btnSkill.disabled = true;
                } else if (skill.cooldownAtual > 0) {
                    btnSkill.innerText = `⏳ Aguarde (${skill.cooldownAtual}s)`;
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
    let custo = upgradeId === 4 ? 5 : custosAlmasBase[upgradeId] * Math.pow(2, nivelAtual);
    
    if ((jogo.almasPoligonais || 0) >= custo && (upgradeId !== 4 || nivelAtual < 1)) {
        jogo.almasPoligonais -= custo;
        jogo.upgradesAlmas[upgradeId] = nivelAtual + 1;
        atualizarInterface();
        salvarJogo();
    }
};

window.darTiroGacha = darTiroGacha;
window.resetarJogo = resetarJogo;
window.ascender = executarAscensao;
window.exportarSaveFisico = exportarProgressoFisico;
window.importarSaveFisico = importarProgressoFisico;
window.renderizarForja = renderizarForja;
window.renderizarGuilda = renderizarGuilda;

window.alternarHeroiNoTime = function(heroiIndex) {
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
        
        if (skill.multiplicadorDanoInstantaneo !== undefined) {
            let danoBurst = heroi.dps * skill.multiplicadorDanoInstantaneo;
            let isCrit = Math.random() < heroi.chanceCritico;
            if (isCrit) danoBurst *= 3;
            atacar(danoBurst, isCrit, 45, heroiIndex === 1 ? 'burstElfa' : 'normal'); // Dá à skill da Elfa uma animação mais longa e cinemática
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
};

export function atacar(dano, isCritico = false, duracaoAnimacao = 15, tipo = 'normal') {
    // Se a animação atual é o burst da elfa, não interrompe ela visualmente se houver um ataque ou clique normal!
    if (!(animacao.ativa && animacao.tipo === 'burstElfa' && tipo === 'normal')) {
        animacao.ativa = true;
        animacao.frameAtual = 0;
        animacao.critico = isCritico;
        animacao.duracao = duracaoAnimacao; 
        animacao.tipo = tipo;
    }
    
    const isBoss = (jogo.nivel % 5 === 0);
    const espadaFogoAtiva = jogo.herois[0].skills[0].ativa;

    let multiplicadorElemental = 1.0;
    let corTexto = isCritico ? "243, 156, 18" : "231, 76, 60";
    let textoAtaque = isCritico ? "CRÍTICO! " : "";

    if (tipo === 'normal' && espadaFogoAtiva) {
        if (isBoss) {
            multiplicadorElemental = 3.0;
            corTexto = "255, 102, 0";
            textoAtaque = "🔥 DEGRADAÇÃO POLIGONAL! ";
        }
    } else if (tipo === 'burstElfa') {
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
    }

    let danoFinal = dano * multiplicadorElemental * jogo.multiplicadorAscensao;

    textosFlutuantes.push({
        texto: `${textoAtaque}-${danoFinal}`, 
        x: 180 + (Math.random() * 40) - (isCritico ? 30 : 0),
        y: 60 + (Math.random() * 15),
        alpha: 1, duracao: isCritico ? 60 : 45,
        cor: corTexto,
        tamanho: isCritico ? "bold 22px sans-serif" : "bold 18px sans-serif"
    });

    jogo.monstroHp -= danoFinal;
    if (jogo.monstroHp <= 0) {
        const recompensa = calcularRecompensa(jogo.nivel);
        jogo.pontos += recompensa;
        
        jogo.monstrosMortos++;
        if (jogo.guilda.contratos[1].atual < jogo.guilda.contratos[1].meta) jogo.guilda.contratos[1].atual++;
        if (jogo.monstrosMortos >= 50 && !jogo.conquistas.monstros50) {
            jogo.conquistas.monstros50 = true;
            jogo.gemas += 50;
            mostrarNotificacao("🏆 Conquista Desbloqueada!\nCaçador de Polígonos (+50 Gemas!)");
        }

        if (jogo.nivel % 5 === 0) {
            let gemasGanhos = 5 + (jogo.upgradesAlmas[2] || 0);
            jogo.gemas += gemasGanhos;
            textosFlutuantes.push({ texto: `+${gemasGanhos} Gemas`, x: 170 + (Math.random() * 20), y: 60, alpha: 1, duracao: 80, cor: "155, 89, 182", tamanho: "bold 18px sans-serif" });

            const isPantano = Math.floor((jogo.nivel - 1) / 15) % 2 === 1;
            if (isPantano) {
                jogo.inventario.escamasHidra += 1;
                textosFlutuantes.push({ texto: "+1 Escama de Hidra", x: 170 + (Math.random() * 20), y: 40, alpha: 1, duracao: 100, cor: "46, 204, 113", tamanho: "bold 16px sans-serif" });
            } else {
                jogo.inventario.couroOrc += 1;
                textosFlutuantes.push({ texto: "+1 Couro de Orc", x: 170 + (Math.random() * 20), y: 40, alpha: 1, duracao: 100, cor: "139, 69, 19", tamanho: "bold 16px sans-serif" });
            }
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
            jogo.cliquesTotais++;
            if (jogo.guilda.contratos[0].atual < jogo.guilda.contratos[0].meta) jogo.guilda.contratos[0].atual++;
            if (jogo.cliquesTotais >= 100 && !jogo.conquistas.cliques100) {
                jogo.conquistas.cliques100 = true;
                jogo.gemas += 50;
                atualizarInterface();
                mostrarNotificacao("🏆 Conquista Desbloqueada!\nDedo Nervoso (+50 Gemas!)");
            }

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
            atacar(dano, isCrit);
        });
    }

    // Processamento de Tempo Offline (foi movido para cá na migração)
    const tempoFora = jogo.ultimoAcesso ? Math.floor((Date.now() - jogo.ultimoAcesso) / 1000) : 0;
    carregarJogo();
    if (tempoFora > 0 && jogo.pontos > 0) { // Lógica básica de retroalimentação
        let dpsTotal = jogo.timeAtivo.reduce((acc, idx) => acc + jogo.herois[idx].dps, 0);
        let danoOffline = tempoFora * dpsTotal;
        if(danoOffline > 0) mostrarNotificacao(`Você ficou fora por ${tempoFora}s.\nSeu time progrediu!`);
    }

    setInterval(() => {
        // Upgrade 4: Conjurador Automático (Auto-Cast)
        if ((jogo.upgradesAlmas[4] || 0) >= 1) {
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
                    skill.cooldownAtual = Math.max(0, skill.cooldownAtual - aceleracao);
                    }
                });
            }
        });

        // Lógica de Buffs do Cavaleiro de Ferro
        let buffPassivoCavaleiro = 1.0;
        let buffAtivoCavaleiro = 1.0;
        if (jogo.timeAtivo.includes(3) && jogo.herois[3]) {
            buffPassivoCavaleiro = 1.15; // +15% de DPS passivo para todos
            if (jogo.herois[3].skills && jogo.herois[3].skills[0] && jogo.herois[3].skills[0].ativa) {
                buffAtivoCavaleiro = 1.5; // +50% de DPS ativo
            }
        }

        jogo.timeAtivo.forEach(index => {
            let heroi = jogo.herois[index];
            if (index === 0 || heroi.nivelDps > 0) { // Verificação de segurança adicional
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
                
                // Aplica os buffs provenientes do Cavaleiro em todo DPS gerado
                danoHeroi *= buffPassivoCavaleiro * buffAtivoCavaleiro;
                
                // Buff 4: Aura Poligonal (+10% DPS Passivo)
                danoHeroi *= (1 + ((jogo.upgradesAlmas[4] || 0) * 0.10));

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