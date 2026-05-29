export let jogo = {
    pontos: 0,
    gemas: 0,
    tirosGacha: 0,
    ultimoAcesso: Date.now(),
    nivel: 1,
    monstroHp: 10,
    monstroHpMax: 10,
    cliquesTotais: 0,
    monstrosMortos: 0,
    conquistas: { cliques100: false, monstros50: false },
    inventario: { couroOrc: 0, escamasHidra: 0 },
    artefatos: { manoplaOrc: false, glandulaHidra: false },
    almasPoligonais: 0,
    upgradesAlmas: [0, 0, 0, 0, 0],
    guilda: {
        ultimaRenovacao: new Date().toDateString(),
        contratos: [
            { id: 'cliques', desc: 'Dedo Nervoso: 200 Cliques', atual: 0, meta: 200, resgatado: false, premioGemas: 30 },
            { id: 'mortes', desc: 'Caçador: Derrotar 20 Monstros', atual: 0, meta: 20, resgatado: false, premioGemas: 50 }
        ],
        expedicao: { ativa: false, heroiIndex: null, tempoFim: 0 }
    },
    timeAtivo: [0],
    herois: [
        {
            nome: "Herói Principal",
            descricao: "O pilar do reino. Seus cliques manuais causam dano massivo na tela.",
            dps: 1,
            nivelDps: 0,
            custoDps: 10,
            chanceCritico: 0,
            nivelCritico: 0,
            custoCritico: 50,
            multCusto: 1.5,
            fragmentos: 0,
            estrelas: 1,
            skills: [
                {
                    nome: "🔥 Lâmina Incandescente",
                    descricao: "Incendeia a espada por 3s, multiplicando o dano do clique em 5x com chance de crítico. Causa DEGRADAÇÃO POLIGONAL (3x dano) contra o Boss.",
                    multiplicadorDano: 5,
                    cooldownMax: 10, // segundos
                    cooldownAtual: 0,
                    duracaoMax: 3, // segundos que o fogo fica ativo na espada
                    duracaoAtual: 0,
                    ativa: false,
                    desbloqueada: true,
                    nivel: 1,
                    custoUpgrade: 100,
                    multCusto: 1.8
                }
            ]
        },
        {
            nome: "🏹 Elfa Arqueira (Gacha)",
            descricao: "Atiradora de elite ágil. Dispara flechas diagonais teleguiadas em cadência constante.",
            dps: 0,
            nivelDps: 0,
            custoDps: 150,
            chanceCritico: 0.10,
            nivelCritico: 0,
            custoCritico: 300,
            multCusto: 1.7,
            fragmentos: 0,
            estrelas: 1,
            skills: [
                {
                    nome: "🏹 Rajada de Glifos",
                    descricao: "Dispara 4 flechas mágicas de Glintstone simultâneas causando 25x de dano de burst. Se o Boss estiver queimando, causa DERRETIMENTO DE PIXELS (2x dano extra).",
                    multiplicadorDanoInstantaneo: 25, // Dá 25x o dano base dela de uma vez só!
                    cooldownMax: 15, // 15 segundos de recarga
                    cooldownAtual: 0,
                    duracaoMax: 1, // Duração curtíssima, apenas o tempo do disparo
                    duracaoAtual: 0,
                    ativa: false,
                    desbloqueada: true,
                    nivel: 1,
                    custoUpgrade: 200,
                    multCusto: 1.9
                }
            ]
        },
        {
            nome: "🔮 Mago de Glintstone (Gacha)",
            descricao: "Conjurador místico. Seus ataques básicos são esferas de energia que perseguem os alvos.",
            dps: 0,
            nivelDps: 0,
            custoDps: 250,
            chanceCritico: 0.05,
            nivelCritico: 0,
            custoCritico: 400,
            multCusto: 1.6,
            fragmentos: 0,
            estrelas: 1,
            skills: [
                {
                    nome: "🔮 Comet Azur",
                    descricao: "Canaliza um feixe colossal de energia néon por 3s. Causa dano contínuo multi-hit frame a frame enquanto ativo.",
                    multiplicadorDanoMultiHit: 3,
                    cooldownMax: 15,
                    cooldownAtual: 0,
                    duracaoMax: 3,
                    duracaoAtual: 0,
                    ativa: false,
                    desbloqueada: true,
                    nivel: 1,
                    custoUpgrade: 250,
                    multCusto: 1.8
                }
            ]
        },
        {
            nome: "🛡️ Cavaleiro de Ferro (Gacha)",
            descricao: "O escudo vivo da equipe. Não ataca, mas concede +15% de DPS passivo global para o time inteiro enquanto estiver escalado.",
            dps: 0,
            nivelDps: 0,
            custoDps: 400,
            chanceCritico: 0.15,
            nivelCritico: 0,
            custoCritico: 500,
            multCusto: 1.8,
            fragmentos: 0,
            estrelas: 1,
            buffPassivoDpsTime: 0.15,
            skills: [
                {
                    nome: "⚙️ Baluarte Vetorial",
                    descricao: "Ergue uma barreira dourada por 6s, dobrando o dano dos cliques do jogador e dando +50% de DPS ativo para todos os aliados em campo.",
                    multiplicadorDanoClique: 2.0,
                    multiplicadorDpsAtivo: 1.5,
                    cooldownMax: 20,
                    cooldownAtual: 0,
                    duracaoMax: 6,
                    duracaoAtual: 0,
                    ativa: false,
                    desbloqueada: true,
                    nivel: 1,
                    custoUpgrade: 300,
                    multCusto: 1.9
                }
            ]
        }
    ]
};

let isResetando = false;

export function calcularHpMaximo(nivel) {
    let hpBase = 10 * Math.pow(1.4, nivel - 1);
    return (nivel % 5 === 0) ? Math.floor(hpBase * 3) : Math.floor(hpBase);
}

export function calcularRecompensa(nivel) {
    let recompensaBase = 5 * Math.pow(1.4, nivel - 1);
    return (nivel % 5 === 0) ? Math.floor(recompensaBase * 10) : Math.floor(recompensaBase);
}

export function salvarJogo() {
    if (isResetando) return; // Impede que o loop re-grave antes do reload
    jogo.ultimoAcesso = Date.now();
    localStorage.setItem("meuJogoAFK", JSON.stringify(jogo));
}

export function carregarJogo() {
    const salvo = localStorage.getItem("meuJogoAFK");
    if (!salvo) return;
    
    const dadosSalvos = JSON.parse(salvo);
    const tempoFora = Math.floor((Date.now() - dadosSalvos.ultimoAcesso) / 1000);
    
    // Migração de heróis mantida como no original
    if (dadosSalvos.herois) {
        jogo.herois.forEach((hBase, i) => {
            if (dadosSalvos.herois[i]) {
                jogo.herois[i] = dadosSalvos.herois[i];
                jogo.herois[i].multCusto = jogo.herois[i].multCusto || hBase.multCusto;
                jogo.herois[i].fragmentos = jogo.herois[i].fragmentos || 0;
                jogo.herois[i].estrelas = Math.min(jogo.herois[i].estrelas || 1, 5); // Limita as estrelas de saves antigos a 5
                jogo.herois[i].descricao = hBase.descricao;
                
                if (hBase.skills) {
                    // Se o save antigo tinha um array vazio, puxa os dados base completos
                    if (!jogo.herois[i].skills || jogo.herois[i].skills.length === 0) {
                        jogo.herois[i].skills = JSON.parse(JSON.stringify(hBase.skills));
                    } else {
                        // Se já existiam skills, atualiza e preenche campos faltantes
                        hBase.skills.forEach((baseSkill, sIdx) => {
                            if (!jogo.herois[i].skills[sIdx]) {
                                jogo.herois[i].skills[sIdx] = JSON.parse(JSON.stringify(baseSkill));
                            } else {
                                let skill = jogo.herois[i].skills[sIdx];
                                skill.nome = baseSkill.nome;
                                skill.descricao = baseSkill.descricao;
                                skill.nivel = skill.nivel || 1;
                                skill.custoUpgrade = skill.custoUpgrade || baseSkill.custoUpgrade;
                                skill.multCusto = skill.multCusto || baseSkill.multCusto;
                                if (baseSkill.multiplicadorDanoInstantaneo) {
                                    skill.multiplicadorDanoInstantaneo = skill.multiplicadorDanoInstantaneo || baseSkill.multiplicadorDanoInstantaneo;
                                }
                            }
                        });
                    }
                }
            }
        });
    }
    
    jogo.nivel = dadosSalvos.nivel || 1;
    jogo.monstroHpMax = dadosSalvos.monstroHpMax || 10;
    jogo.monstroHp = dadosSalvos.monstroHp || 10;
    jogo.gemas = Number(dadosSalvos.gemas) || 0;
    jogo.tirosGacha = Number(dadosSalvos.tirosGacha) || 0;
    jogo.pontos = dadosSalvos.pontos;
    jogo.cliquesTotais = dadosSalvos.cliquesTotais || 0;
    jogo.monstrosMortos = dadosSalvos.monstrosMortos || 0;
    jogo.conquistas = dadosSalvos.conquistas || { cliques100: false, monstros50: false };
    jogo.inventario = dadosSalvos.inventario || { couroOrc: 0, escamasHidra: 0 };
    jogo.artefatos = dadosSalvos.artefatos || { manoplaOrc: false, glandulaHidra: false };
    jogo.multiplicadorAscensao = dadosSalvos.multiplicadorAscensao || 1;
    jogo.almasPoligonais = dadosSalvos.almasPoligonais || 0;
    jogo.upgradesAlmas = dadosSalvos.upgradesAlmas || [0, 0, 0, 0, 0];

    jogo.guilda = dadosSalvos.guilda || {
        ultimaRenovacao: new Date().toDateString(),
        contratos: [
            { id: 'cliques', desc: 'Dedo Nervoso: 200 Cliques', atual: 0, meta: 200, resgatado: false, premioGemas: 30 },
            { id: 'mortes', desc: 'Caçador: Derrotar 20 Monstros', atual: 0, meta: 20, resgatado: false, premioGemas: 50 }
        ],
        expedicao: { ativa: false, heroiIndex: null, tempoFim: 0 }
    };

    const hoje = new Date().toDateString();
    if (jogo.guilda.ultimaRenovacao !== hoje) {
        jogo.guilda.ultimaRenovacao = hoje;
        jogo.guilda.contratos[0].atual = 0; jogo.guilda.contratos[0].resgatado = false;
        jogo.guilda.contratos[1].atual = 0; jogo.guilda.contratos[1].resgatado = false;
    }
}

export function resetarJogo() {
    if (confirm("Tem certeza que deseja apagar todo o seu progresso?")) {
        localStorage.removeItem("meuJogoAFK");
        isResetando = true;
        window.location.reload();
    }
}

export function exportarProgressoFisico() {
    const dados = JSON.stringify(jogo);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vibe_game_save.dat';
    link.click();
    URL.revokeObjectURL(url); // Limpa a memória
}

export function importarProgressoFisico(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const novosDados = JSON.parse(e.target.result);
            if (novosDados && (novosDados.nivel !== undefined || novosDados.pontos !== undefined)) {
                Object.assign(jogo, novosDados); // Substitui os dados atuais de forma segura
                salvarJogo();
                window.location.reload();
            } else {
                alert("Arquivo de progresso inválido ou corrompido.");
            }
        } catch (error) {
            alert("Erro ao ler o arquivo de progresso.");
        }
    };
    leitor.readAsText(arquivo);
}

export function executarAscensao() {
    if (jogo.nivel <= 30) {
        alert("Você precisa passar do nível 30 para realizar a Ascensão!");
        return;
    }

    if (confirm(`Deseja Ascender? Você ganhará +${jogo.nivel - 30} no seu Multiplicador de Ascensão e +${jogo.nivel - 30} Almas Poligonais!\nTodo o progresso de níveis e upgrades de pontos será resetado.`)) {
        jogo.multiplicadorAscensao += (jogo.nivel - 30);
        if (jogo.almasPoligonais === undefined) jogo.almasPoligonais = 0;
        jogo.almasPoligonais += (jogo.nivel - 30);
        
        jogo.pontos = 0;
        jogo.nivel = 1;
        jogo.monstroHp = 10;
        jogo.monstroHpMax = 10;

        jogo.herois.forEach((heroi, index) => {
            let estavaDesbloqueado = index === 0 || heroi.nivelDps > 0;
            
            heroi.nivelDps = index === 0 ? 0 : (estavaDesbloqueado ? 1 : 0);
            heroi.custoDps = index === 0 ? 10 : (index === 1 ? 150 : (index === 2 ? 250 : 400));
            heroi.chanceCritico = index === 0 ? 0 : (index === 1 ? 0.10 : (index === 2 ? 0.05 : 0.15));
            heroi.nivelCritico = 0;
            heroi.custoCritico = index === 0 ? 50 : (index === 1 ? 300 : (index === 2 ? 400 : 500));
            
            // Reseta o DPS para o nível Base, mantendo os multiplicadores por Estrela do Gacha
            let dpsBase = index === 0 ? 1 : (estavaDesbloqueado ? (index === 1 ? 2 : (index === 3 ? 0 : 1)) : 0);
            for (let s = 1; s < (heroi.estrelas || 1); s++) dpsBase = Math.max(1, Math.ceil(dpsBase * 2.0));
            heroi.dps = dpsBase;
            
            if (heroi.skills) {
                heroi.skills.forEach(skill => {
                    skill.nivel = 1;
                    if (skill.nome === "🏹 Rajada de Glifos") {
                        skill.custoUpgrade = 200;
                        skill.multiplicadorDanoInstantaneo = 25;
                        skill.duracaoMax = 1;
                    } else if (skill.nome === "🔮 Comet Azur") {
                        skill.custoUpgrade = 250;
                        skill.multiplicadorDanoMultiHit = 3;
                        skill.duracaoMax = 3;
                    } else if (skill.nome === "⚙️ Baluarte Vetorial") {
                        skill.custoUpgrade = 300;
                        skill.multiplicadorDanoClique = 2.0;
                        skill.multiplicadorDpsAtivo = 1.5;
                        skill.duracaoMax = 6;
                    } else {
                        skill.custoUpgrade = 100;
                        skill.multiplicadorDano = 5;
                        skill.duracaoMax = 3;
                    }
                });
            }
        });

        salvarJogo();
        isResetando = true; // Impede gravação automática indesejada durante o recarregamento
        window.location.reload();
    }
}