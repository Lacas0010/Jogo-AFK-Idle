export let jogo = {
    estado: 'menu', // Começa na tela de início
    pontos: 0,
    gemas: 0,
    tirosGacha: 0,
    totalTirosGacha: 0,
    ultimoAcesso: Date.now(),
    nivel: 1,
    nivelMaximo: 1,
    monstroHp: 10,
    monstroHpMax: 10,
    cliquesTotais: 0,
    monstrosMortos: 0,
    marcos: { cliques: 0, mortes: 0, nivel: 0, gacha: 0 },
    inventario: { couroOrc: 0, escamasHidra: 0, denteDragao: 0 },
    artefatos: { manoplaOrc: false, glandulaHidra: false, cristalDragao: false },
    multiplicadorAscensao: 1,
    desbloqueios: { equipe: false, gacha: false, forja: false, marcos: false, guilda: false, santuario: false, pantheon: false, frestas: false },
    tutoriaisVistos: { abaUpgrades: false, abaEquipe: false, abaGacha: false, abaForja: false, abaSantuario: false, abaGuilda: false, abaMarcos: false, abaPantheon: false, abaFrestas: false },
    almasPoligonais: 0,
    upgradesAlmas: [0, 0, 0, 0, 0],
    autoCastAtivo: true,
    guilda: {
        ultimaRenovacao: new Date().toDateString(),
        contratos: [
            { id: 'cliques', desc: 'Dedo Nervoso: 200 Cliques', atual: 0, meta: 200, resgatado: false, premioGemas: 30 },
            { id: 'mortes', desc: 'Caçador: Derrotar 20 Monstros', atual: 0, meta: 20, resgatado: false, premioGemas: 50 }
        ],
        expedicao: { ativa: false, heroiIndex: null, tempoFim: 0 }
    },
    timeAtivo: [0],
    fragmentosUniversais: 0,
    reliquiasPantheon: [0, 0, 0],
    frestaDesafio: { andarAtual: 1, tempoRestante: 30, ativa: false, hpOriginalMonstro: 0 },
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
                    descricao: "Dispara 4 flechas mágicas de Éter simultâneas causando 25x de dano de burst. Se o Boss estiver queimando, causa DERRETIMENTO DE PIXELS (2x dano extra).",
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
            nome: "🔮 Conjurador de Éter (Gacha)",
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
                        nome: "🔮 Torrente Prismática",
                        descricao: "Canaliza um feixe colossal de energia pura por 3s. Causa dano contínuo multi-hit frame a frame enquanto ativo.",
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
            nome: "🛡️ Cavaleiro de Ferro",
            descricao: "[Aura Tática]: Cada nível de DPS aumenta o dano de todo o time em +1%. [Esmagar]: Sua Chance de Crítico dita a probabilidade de dar uma Escudada no chefe a cada segundo.",
            dps: 0, nivelDps: 0, custoDps: 15, multCusto: 1.15,
            chanceCritico: 0.05, nivelCritico: 0, custoCritico: 100, multCustoCritico: 1.4, fragmentos: 0, estrelas: 1,
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
        },
        {
            nome: "🐍 Ladra de Presas (Gacha)",
            descricao: "Assassina do pântano. Seus golpes acumulam veneno corrosivo de efeito contínuo no alvo.",
            dps: 0, nivelDps: 0, custoDps: 600, chanceCritico: 0.25, nivelCritico: 0, custoCritico: 700, multCusto: 1.9, fragmentos: 0, estrelas: 1,
            skills: [{
                nome: "🔮 Adagas de Glifos",
                descricao: "Consome instantaneamente todo o lodo tóxico do monstro, descarregando um estouro de 40x de dano baseado nos acúmulos.",
                multiplicadorDanoInstantaneo: 40, cooldownMax: 12, cooldownAtual: 0, duracaoMax: 1, duracaoAtual: 0, ativa: false, desbloqueada: true, nivel: 1, custoUpgrade: 400, multCusto: 2.0
            }]
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
    const salvo = localStorage.getItem("meuJogoAFK"); // Restaurando a chave correta
    if (!salvo) return 0;
    
    const dadosSalvos = JSON.parse(salvo);
    const tempoFora = dadosSalvos.ultimoAcesso ? Math.max(0, Math.floor((Date.now() - dadosSalvos.ultimoAcesso) / 1000)) : 0;
    
    // Mescla profunda para garantir que novos desbloqueios existam em saves velhos
    if (dadosSalvos.desbloqueios) {
        jogo.desbloqueios = { ...jogo.desbloqueios, ...dadosSalvos.desbloqueios };
    }
    
    jogo.tutoriaisVistos = dadosSalvos.tutoriaisVistos || { abaUpgrades: false, abaEquipe: false, abaGacha: false, abaForja: false, abaSantuario: false, abaGuilda: false, abaMarcos: false, abaPantheon: false, abaFrestas: false };
    
    // Migração de heróis mantida como no original
    if (dadosSalvos.herois) {
        jogo.herois.forEach((hBase, i) => {
            if (dadosSalvos.herois[i]) {
                jogo.herois[i] = dadosSalvos.herois[i];
                jogo.herois[i].multCusto = jogo.herois[i].multCusto || hBase.multCusto;
                jogo.herois[i].fragmentos = jogo.herois[i].fragmentos || 0;
                jogo.herois[i].estrelas = Math.min(jogo.herois[i].estrelas || 1, 5);
                jogo.herois[i].descricao = hBase.descricao;
                
                if (hBase.skills) {
                    if (!jogo.herois[i].skills || jogo.herois[i].skills.length === 0) {
                        jogo.herois[i].skills = JSON.parse(JSON.stringify(hBase.skills));
                    } else {
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
                                if (baseSkill.multiplicadorDanoMultiHit) {
                                    skill.multiplicadorDanoMultiHit = skill.multiplicadorDanoMultiHit || baseSkill.multiplicadorDanoMultiHit;
                                }
                                if (baseSkill.multiplicadorDano) {
                                    skill.multiplicadorDano = skill.multiplicadorDano || baseSkill.multiplicadorDano;
                                }
                                if (baseSkill.multiplicadorDanoClique) {
                                    skill.multiplicadorDanoClique = skill.multiplicadorDanoClique || baseSkill.multiplicadorDanoClique;
                                }
                                if (baseSkill.multiplicadorDpsAtivo) {
                                    skill.multiplicadorDpsAtivo = skill.multiplicadorDpsAtivo || baseSkill.multiplicadorDpsAtivo;
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
    jogo.totalTirosGacha = dadosSalvos.totalTirosGacha || dadosSalvos.tirosGacha || 0;
    jogo.nivelMaximo = dadosSalvos.nivelMaximo || dadosSalvos.nivel || 1;
    jogo.pontos = dadosSalvos.pontos || 0;
    jogo.cliquesTotais = dadosSalvos.cliquesTotais || 0;
    jogo.monstrosMortos = dadosSalvos.monstrosMortos || 0;
    jogo.marcos = dadosSalvos.marcos || { cliques: 0, mortes: 0, nivel: 0, gacha: 0 };
    jogo.inventario = dadosSalvos.inventario || { couroOrc: 0, escamasHidra: 0, denteDragao: 0 };
    if (dadosSalvos.inventario && jogo.inventario.denteDragao === undefined) jogo.inventario.denteDragao = 0;
    
    jogo.artefatos = dadosSalvos.artefatos || { manoplaOrc: false, glandulaHidra: false, cristalDragao: false };
    if (dadosSalvos.artefatos && jogo.artefatos.cristalDragao === undefined) jogo.artefatos.cristalDragao = false;
    jogo.multiplicadorAscensao = dadosSalvos.multiplicadorAscensao || 1;
    jogo.almasPoligonais = dadosSalvos.almasPoligonais || 0;
    jogo.upgradesAlmas = dadosSalvos.upgradesAlmas || [0, 0, 0, 0, 0];
    jogo.autoCastAtivo = dadosSalvos.autoCastAtivo !== undefined ? dadosSalvos.autoCastAtivo : true;
    jogo.timeAtivo = dadosSalvos.timeAtivo || [0];
    jogo.fragmentosUniversais = dadosSalvos.fragmentosUniversais || 0;
    jogo.reliquiasPantheon = dadosSalvos.reliquiasPantheon || [0, 0, 0];
    jogo.frestaDesafio = dadosSalvos.frestaDesafio || { andarAtual: 1, tempoRestante: 30, ativa: false, hpOriginalMonstro: 0 };

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
        
        const poolContratos = [
            { id: 'cliques', desc: 'Dedo Nervoso: 200 Cliques', atual: 0, meta: 200, resgatado: false, premioGemas: 30 },
            { id: 'mortes', desc: 'Caçador: Derrotar 20 Monstros', atual: 0, meta: 20, resgatado: false, premioGemas: 40 },
            { id: 'criticos', desc: 'Golpe Fatal: 50 Críticos', atual: 0, meta: 50, resgatado: false, premioGemas: 40 },
            { id: 'chefes', desc: 'Matador: Derrotar 2 Chefes', atual: 0, meta: 2, resgatado: false, premioGemas: 60 },
            { id: 'skills', desc: 'Conjurador: Ativar 10 Skills', atual: 0, meta: 10, resgatado: false, premioGemas: 40 }
        ];

        jogo.guilda.contratos = poolContratos.sort(() => 0.5 - Math.random()).slice(0, 2);
    }

    return tempoFora; // Retorna o tempo para o Relatório Offline funcionar!
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
        
        if (window.verificarDesbloqueios) window.verificarDesbloqueios();

        jogo.pontos = 0;
        jogo.nivel = 1;
        jogo.monstroHp = 10;
        jogo.monstroHpMax = 10;

        jogo.frestaDesafio.ativa = false;
        jogo.guilda.expedicao.ativa = false;
        jogo.guilda.expedicao.heroiIndex = null;
        jogo.guilda.expedicao.tempoFim = 0;
        jogo.monstroLodoToxico = 0;

        jogo.herois.forEach((heroi, index) => {
            let estavaDesbloqueado = index === 0 || heroi.desbloqueada || heroi.nivelDps > 0;
            
            heroi.nivelDps = index === 0 ? 0 : (estavaDesbloqueado ? 1 : 0);
            heroi.custoDps = index === 0 ? 10 : (index === 1 ? 150 : (index === 2 ? 250 : (index === 3 ? 15 : 600)));
            heroi.multCusto = index === 0 ? 1.5 : (index === 1 ? 1.7 : (index === 2 ? 1.6 : (index === 3 ? 1.15 : 1.9)));
            heroi.chanceCritico = index === 0 ? 0 : (index === 1 ? 0.10 : (index === 2 ? 0.05 : (index === 3 ? 0.05 : 0.25)));
            heroi.nivelCritico = 0;
            heroi.custoCritico = index === 0 ? 50 : (index === 1 ? 300 : (index === 2 ? 400 : (index === 3 ? 100 : 700)));
            if (index === 3) heroi.multCustoCritico = 1.4;
            
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
                    } else if (skill.nome === "🔮 Torrente Prismática") {
                        skill.custoUpgrade = 250;
                        skill.multiplicadorDanoMultiHit = 3;
                        skill.duracaoMax = 3;
                    } else if (skill.nome === "⚙️ Baluarte Vetorial") {
                        skill.custoUpgrade = 300;
                        skill.multiplicadorDanoClique = 2.0;
                        skill.multiplicadorDpsAtivo = 1.5;
                        skill.duracaoMax = 6;
                    } else if (skill.nome === "🔮 Adagas de Glifos") {
                        skill.custoUpgrade = 400;
                        skill.multiplicadorDanoInstantaneo = 40;
                        skill.duracaoMax = 1;
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