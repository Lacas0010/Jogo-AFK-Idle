import { jogo, salvarJogo, carregarJogo, calcularHpMaximo, calcularRecompensa, resetarJogo, executarAscensao } from './state.js';
import { darTiroGacha, darGemasTeste } from './gacha.js';
import { desenhar, textosFlutuantes, animacao, mostrarNotificacao } from './render.js';

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
                    ${heroi.skills ? heroi.skills.map((skill, sIdx) => {
                        let descUpgrade = skill.multiplicadorDanoInstantaneo !== undefined ? "+5 Mult. Burst" : "+1 Mult. Dano";
                        return `
                            <div style="margin-top: 10px; border-top: 1px solid #444; padding-top: 10px;">
                                <h4 style="margin: 0 0 5px 0; font-size: 13px; color: #e74c3c;">Melhorar ${skill.nome}</h4>
                                <button id="btnUpgradeSkill_${index}_${sIdx}" class="btn-upgrade" style="background: #c0392b; color: white;" onclick="comprarUpgradeSkill(${index}, ${sIdx})">
                                    ${descUpgrade}<br><small>Nvl: <span id="nivelSkill_${index}_${sIdx}">${skill.nivel || 1}</span> | Custo: <span id="custoSkill_${index}_${sIdx}">${skill.custoUpgrade || 100}</span></small>
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
            <h3>✨ Multiplicador de Ascensão Atual: ${jogo.multiplicadorAscensao}x</h3>
            <button id="btnAscensão" class="btn-upgrade" style="background: #9b59b6; margin-bottom: 15px;" onclick="ascender()" ${podeAscender ? "" : "disabled"}>
                ${podeAscender ? "Realizar Ascensão Cósmica" : "Bloqueado (Chegue ao Nível 30)"}
            </button>
        </div>
    `;
    
    jogo.herois.forEach((heroi, index) => {
        if (index === 0 || heroi.nivelDps > 0) {
            const chanceCrit = Math.round(heroi.chanceCritico * 100);
            painel.innerHTML += `
                <div class="heroi-card" style="margin-bottom: 10px; text-align: left;">
                    <h3 class="heroi-title" style="color: #f1c40f;">${heroi.nome} ${'⭐'.repeat(heroi.estrelas || 1)}</h3>
                    <p style="margin: 2px 0; font-size: 14px;"><strong>DPS Base:</strong> ${heroi.dps}</p>
                    <p style="margin: 2px 0; font-size: 14px;"><strong>Chance de Crítico:</strong> ${chanceCrit}%</p>
                    <p style="margin: 2px 0; font-size: 14px;"><strong>Nível DPS:</strong> ${heroi.nivelDps}</p>
                    <p style="margin: 2px 0; font-size: 14px;"><strong>Nível Crítico:</strong> ${heroi.nivelCritico}</p>
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

    const btnSkill = document.getElementById("btnSkill_0_0");
    if (btnSkill && jogo.herois[0] && jogo.herois[0].skills && jogo.herois[0].skills[0]) {
        let skill = jogo.herois[0].skills[0];
        if (skill.ativa) {
            btnSkill.innerText = `🔥 ATIVA (${skill.duracaoAtual}s)`;
            btnSkill.disabled = true;
        } else if (skill.cooldownAtual > 0) {
            btnSkill.innerText = `⏳ Aguarde (${skill.cooldownAtual}s)`;
            btnSkill.disabled = true;
        } else {
            btnSkill.innerText = "🔥 Lâmina Incandescente";
            btnSkill.disabled = false;
        }
    }

    const btnSkillElfa = document.getElementById("btnSkill_1_0");
    if (btnSkillElfa) {
        if (jogo.herois[1] && jogo.herois[1].nivelDps > 0 && jogo.herois[1].skills && jogo.herois[1].skills[0]) {
            btnSkillElfa.style.display = "inline-block";
            let skill = jogo.herois[1].skills[0];
            if (skill.ativa) {
                btnSkillElfa.innerText = `🏹 ATIVA (${skill.duracaoAtual}s)`;
                btnSkillElfa.disabled = true;
            } else if (skill.cooldownAtual > 0) {
                btnSkillElfa.innerText = `⏳ Aguarde (${skill.cooldownAtual}s)`;
                btnSkillElfa.disabled = true;
            } else {
                btnSkillElfa.innerText = "🏹 Rajada de Glifos";
                btnSkillElfa.disabled = false;
            }
        } else {
            btnSkillElfa.style.display = "none";
        }
    }

    const abaStatus = document.getElementById("abaStatus");
    if (abaStatus && abaStatus.classList.contains("active")) {
        renderizarStatusHerois();
    }
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

window.darTiroGacha = darTiroGacha;
window.darGemasTeste = darGemasTeste;
window.resetarJogo = resetarJogo;
window.ascender = executarAscensao;

window.ativarSkill = function(heroiIndex, skillIndex) {
    let heroi = jogo.herois[heroiIndex];
    let skill = heroi.skills[skillIndex];
    if (skill && skill.cooldownAtual <= 0 && !skill.ativa) {
        skill.cooldownAtual = skill.cooldownMax;
        
        if (skill.multiplicadorDanoInstantaneo !== undefined) {
            let danoBurst = heroi.dps * skill.multiplicadorDanoInstantaneo;
            let isCrit = Math.random() < heroi.chanceCritico;
            if (isCrit) danoBurst *= 3;
            atacar(danoBurst, isCrit, 45, heroiIndex === 1 ? 'burstElfa' : 'normal'); // Dá à skill da Elfa uma animação mais longa e cinemática
        } else {
            skill.ativa = true;
            skill.duracaoAtual = skill.duracaoMax;
        }
        
        atualizarInterface();
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
            multiplicadorElemental = 3.0; // 2.0 Vantagem + Combo de Combustão
            corTexto = "255, 102, 0"; // Laranja vivo
            textoAtaque = "🔥 DEGRADAÇÃO POLIGONAL! ";
        }
    } else if (tipo === 'burstElfa') {
        if (espadaFogoAtiva) {
            multiplicadorElemental = 2.0; // Combo de Vaporização
            corTexto = "191, 0, 255"; // Roxo neon
            textoAtaque = "💥 DERRETIMENTO DE PIXELS! ";
        } else if (isBoss) {
            multiplicadorElemental = 0.5; // Desvantagem Glintstone vs Natureza (Boss)
            textoAtaque = "🔷 FRACTAL MÁGICO ";
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
        if (jogo.monstrosMortos >= 50 && !jogo.conquistas.monstros50) {
            jogo.conquistas.monstros50 = true;
            jogo.gemas += 50;
            mostrarNotificacao("🏆 Conquista Desbloqueada!\nCaçador de Polígonos (+50 Gemas!)");
        }

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
            jogo.cliquesTotais++;
            if (jogo.cliquesTotais >= 100 && !jogo.conquistas.cliques100) {
                jogo.conquistas.cliques100 = true;
                jogo.gemas += 50;
                atualizarInterface();
                mostrarNotificacao("🏆 Conquista Desbloqueada!\nDedo Nervoso (+50 Gemas!)");
            }

            let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
            let heroi = jogo.herois[0];
            let dano = heroi.dps + Math.floor(dpsTotal * 0.10);
            
            let skillFogo = heroi.skills && heroi.skills[0];
            if (skillFogo && skillFogo.ativa) {
                dano *= skillFogo.multiplicadorDano;
            }

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
        if(danoOffline > 0) mostrarNotificacao(`Você ficou fora por ${tempoFora}s.\nSeu time progrediu!`);
    }

    setInterval(() => {
        // Loop para gerenciar as Habilidades Ativas e Cooldowns
        jogo.herois.forEach(heroi => {
            if (heroi.skills) {
                heroi.skills.forEach(skill => {
                    if (skill.ativa) {
                        skill.duracaoAtual--;
                        if (skill.duracaoAtual <= 0) skill.ativa = false;
                    }
                    if (skill.cooldownAtual > 0) {
                        skill.cooldownAtual--;
                    }
                });
            }
        });

        let dpsTotal = jogo.herois.reduce((acc, h) => acc + h.dps, 0);
        let isCrit = Math.random() < jogo.herois[0].chanceCritico;
        let danoFinal = isCrit ? dpsTotal * 3 : dpsTotal;
        
        atacar(danoFinal, isCrit);
        salvarJogo();
        atualizarInterface();
    }, 1000);

    renderizarBotoesUpgrades();
    atualizarInterface();
    desenhar();
});