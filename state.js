export let jogo = {
    estado: 'menu', // Começa na tela de início
    pontos: 0,
    gemas: 0,
    configAudio: { bgmMudo: false, sfxMudo: false },
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
    artefatos: { manoplaOrc: 0, glandulaHidra: 0, cristalDragao: 0 },
    multiplicadorAscensao: 1,
    desbloqueios: { equipe: false, gacha: false, forja: false, marcos: false, guilda: false, santuario: false, pantheon: false, frestas: false, mascotes: false, torre: false, taverna: false },
    tutoriaisVistos: { abaUpgrades: false, abaEquipe: false, abaGacha: false, abaForja: false, abaSantuario: false, abaGuilda: false, abaMarcos: false, abaPantheon: false, abaFrestas: false, abaMascotes: false, abaTorre: false, abaTaverna: false },
    almasPoligonais: 0,
    upgradesAlmas: [0, 0, 0, 0, 0, 0, 0],
    autoCastAtivo: true,
    autoClickerAtivo: true,
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
    clima: 'limpo',
    torreAbismo: { andarAtual: 1, ativa: false },
    taverna: { energia: 5, energiaMaxima: 5, ultimaRecarga: Date.now(), hpPedra: 100 },
    mascotes: [
        { id: 'fada', nome: 'Fada de Luz', desbloqueado: false, ativo: false, aura: 'Acelera Cooldowns em 10%' },
        { id: 'slime', nome: 'Slime Tóxico', desbloqueado: false, ativo: false, aura: 'Dano Passivo Constante' },
        { id: 'dragao', nome: 'Mini Dragão', desbloqueado: false, ativo: false, aura: '+20% Chance de Crítico' }
    ],
    frestaDesafio: { andarAtual: 1, tempoRestante: 30, ativa: false, hpOriginalMonstro: 0, tipoInimigo: 0 },
    ataqueChefe: {
        carregando: false,
        tempoRestante: 0,
        tempoMax: 3.5,
        cliquesNecessarios: 5,
        cliquesAtuais: 0,
        nomeAtaque: "Terremoto Poligonal",
        atordoado: 0
    },
    eventoVolante: {
        ativo: false,
        x: -60,
        y: 120,
        raio: 22,
        tipo: 'fada',
        velocidade: 2.2,
        duracao: 0
    },
    buffsAtivos: {
        frenesiOuro: 0,
        fluxoVeloz: 0,
        hidromel: 0
    },
    equipamentos: {
        inventario: [],
        equipados: { arma: null, armadura: null, amuleto: null },
        poDeForja: 0
    },
    dpsEmTempoReal: 0,
    dpsBuffer: 0,
    timeAtordoado: 0,
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
            talento: null,
            especializacoes: {
                A: { nome: "⚔️ Paladino Vingador", desc: "+100% dano de clique e cada clique reduz recarga das skills em 0.1s." },
                B: { nome: "🗡️ Mestre das Lâminas", desc: "+25% chance de crítico nos cliques e críticos geram +50% de ouro extra." }
            },
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
            talento: null,
            especializacoes: {
                A: { nome: "🏹 Caçadora dos Ventos", desc: "Dobra a cadência de disparo de flechas (+100% DPS passivo da Elfa)." },
                B: { nome: "🎯 Franco-Atiradora", desc: "+150% de dano na Rajada de Glifos e perfuração pesada em Chefes." }
            },
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
            talento: null,
            especializacoes: {
                A: { nome: "🌌 Arquimago do Vazio", desc: "Comet Azur causa 50% mais ticks acelerados e aplica chamas astrais contínuas." },
                B: { nome: "⏳ Senhor do Tempo", desc: "Reduz o tempo de recarga base de todas as habilidades do time em 25%." }
            },
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
            talento: null,
            especializacoes: {
                A: { nome: "🏰 Fortaleza Inabalável", desc: "Baluarte dura +4s extras e dobra o bônus passivo de dano da patrulha." },
                B: { nome: "🔨 Colosso Esmagador", desc: "Escudada aciona 2x mais rápido e atordoa o Chefe por 1s." }
            },
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
            talento: null,
            especializacoes: {
                A: { nome: "🧪 Alquimista Tóxica", desc: "O veneno nunca expira e acumula até 30 cargas de lodo tóxico no monstro." },
                B: { nome: "👤 Sombra Fatal", desc: "+40% Dano Crítico e desfere acertos de execução (+100% dano) em monstros sob 35% HP." }
            },
            skills: [{
                nome: "🔮 Adagas de Glifos",
                descricao: "Consome instantaneamente todo o lodo tóxico do monstro, descarregando um estouro de 40x de dano baseado nos acúmulos.",
                multiplicadorDanoInstantaneo: 40, cooldownMax: 12, cooldownAtual: 0, duracaoMax: 1, duracaoAtual: 0, ativa: false, desbloqueada: true, nivel: 1, custoUpgrade: 400, multCusto: 2.0
            }]
        },
        {
            nome: "✨ Clérigo da Luz (Gacha)",
            descricao: "Guardião celestial do sol. Sua presença reduz em 50% o atordoamento do time e inflige +30% de dano sagrado contra Chefes.",
            dps: 0, nivelDps: 0, custoDps: 1000, chanceCritico: 0.15, nivelCritico: 0, custoCritico: 1200, multCusto: 1.85, fragmentos: 0, estrelas: 1,
            talento: null,
            especializacoes: {
                A: { nome: "☀️ Inquisidor Solar", desc: "Julgamento Divino queima o Chefe com Fogo Sagrado contínuo (+100% dano contra Chefes)." },
                B: { nome: "🕊️ Bispo da Alvorada", desc: "Purifica atordoamentos instantaneamente e gera bênção de ouro (+25% de ouro de todas as fontes)." }
            },
            skills: [{
                nome: "🌟 Julgamento Divino",
                descricao: "Invoca colunas de luz divina causando 35x dano de burst instantâneo, purifica atordoamentos do grupo e banha os heróis em Bênção Solar (+100% de dano do time por 5s).",
                multiplicadorDanoInstantaneo: 35, cooldownMax: 18, cooldownAtual: 0, duracaoMax: 5, duracaoAtual: 0, ativa: false, desbloqueada: true, nivel: 1, custoUpgrade: 450, multCusto: 2.0
            }]
        },
        {
            nome: "🪓 Bárbaro Furioso (Gacha)",
            descricao: "Guerreiro indomável. Conforme o monstro perde HP, entra em Frenesi Sangrento (até +150% de DPS extra) e desfere talhos duplos violentos.",
            dps: 0, nivelDps: 0, custoDps: 1500, chanceCritico: 0.30, nivelCritico: 0, custoCritico: 1800, multCusto: 1.9, fragmentos: 0, estrelas: 1,
            talento: null,
            especializacoes: {
                A: { nome: "🩸 Fúria Carniceira", desc: "O frenesi de baixa vida escala até +250% de dano e concede +20% de Chance Crítica." },
                B: { nome: "💥 Esmagador de Crânios", desc: "Ataques do Bárbaro causam Guarda Quebrada constante (+50% de dano recebido) no monstro." }
            },
            skills: [{
                nome: "🩸 Fúria Implacável",
                descricao: "Gira seus machados em um redemoinho devastador de 50x dano e entra em Frenesi por 6s (todos os ataques tornam-se Críticos garantidos).",
                multiplicadorDanoInstantaneo: 50, cooldownMax: 20, cooldownAtual: 0, duracaoMax: 6, duracaoAtual: 0, ativa: false, desbloqueada: true, nivel: 1, custoUpgrade: 500, multCusto: 2.1
            }]
        }
    ]
};

let isResetando = false;

export function formatarNumero(num) {
    if (num === null || num === undefined || isNaN(num)) return "0";
    let valorAbsoluto = Math.abs(num);
    if (valorAbsoluto < 1000) return Math.floor(num).toLocaleString('pt-BR');
    
    const sufixos = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const exp = Math.floor(Math.log10(valorAbsoluto) / 3);
    if (exp >= sufixos.length) return num.toExponential(2);
    
    const escalado = num / Math.pow(10, exp * 3);
    const dec = Math.abs(escalado) >= 100 ? 0 : (Math.abs(escalado) >= 10 ? 1 : 2);
    return escalado.toFixed(dec) + ' ' + sufixos[exp];
}

if (typeof window !== 'undefined') {
    window.formatarNumero = formatarNumero;
}

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
    
    if (dadosSalvos.configAudio) {
        jogo.configAudio = { ...jogo.configAudio, ...dadosSalvos.configAudio };
    }

    // Mescla profunda para garantir que novos desbloqueios existam em saves velhos
    if (dadosSalvos.desbloqueios) {
        jogo.desbloqueios = { ...jogo.desbloqueios, ...dadosSalvos.desbloqueios };
    }
    
    jogo.tutoriaisVistos = dadosSalvos.tutoriaisVistos || { abaUpgrades: false, abaEquipe: false, abaGacha: false, abaForja: false, abaSantuario: false, abaGuilda: false, abaMarcos: false, abaPantheon: false, abaFrestas: false, abaMascotes: false, abaTorre: false, abaTaverna: false };
    
    // Migração de heróis mantida como no original
    if (dadosSalvos.herois) {
        jogo.herois.forEach((hBase, i) => {
            if (dadosSalvos.herois[i]) {
                jogo.herois[i] = dadosSalvos.herois[i];
                jogo.herois[i].multCusto = jogo.herois[i].multCusto || hBase.multCusto;
                jogo.herois[i].fragmentos = jogo.herois[i].fragmentos || 0;
                jogo.herois[i].estrelas = Math.min(jogo.herois[i].estrelas || 1, 5);
                jogo.herois[i].descricao = hBase.descricao;
                jogo.herois[i].talento = dadosSalvos.herois[i].talento || null;
                jogo.herois[i].especializacoes = hBase.especializacoes;
                
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
    
    jogo.artefatos = dadosSalvos.artefatos || { manoplaOrc: 0, glandulaHidra: 0, cristalDragao: 0 };
    if (jogo.artefatos.manoplaOrc === false) jogo.artefatos.manoplaOrc = 0;
    if (jogo.artefatos.manoplaOrc === true) jogo.artefatos.manoplaOrc = 1;
    if (jogo.artefatos.glandulaHidra === false) jogo.artefatos.glandulaHidra = 0;
    if (jogo.artefatos.glandulaHidra === true) jogo.artefatos.glandulaHidra = 1;
    if (jogo.artefatos.cristalDragao === false || jogo.artefatos.cristalDragao === undefined) jogo.artefatos.cristalDragao = 0;
    if (jogo.artefatos.cristalDragao === true) jogo.artefatos.cristalDragao = 1;
    jogo.multiplicadorAscensao = dadosSalvos.multiplicadorAscensao || 1;
    jogo.almasPoligonais = dadosSalvos.almasPoligonais || 0;
    jogo.upgradesAlmas = dadosSalvos.upgradesAlmas || [0, 0, 0, 0, 0, 0, 0];
    jogo.autoCastAtivo = dadosSalvos.autoCastAtivo !== undefined ? dadosSalvos.autoCastAtivo : true;
    jogo.autoClickerAtivo = dadosSalvos.autoClickerAtivo !== undefined ? dadosSalvos.autoClickerAtivo : true;
    jogo.timeAtivo = dadosSalvos.timeAtivo || [0];
    jogo.fragmentosUniversais = dadosSalvos.fragmentosUniversais || 0;
    jogo.reliquiasPantheon = dadosSalvos.reliquiasPantheon || [0, 0, 0];
    jogo.clima = dadosSalvos.clima || 'limpo';
    jogo.torreAbismo = dadosSalvos.torreAbismo || { andarAtual: 1, ativa: false };
    jogo.taverna = dadosSalvos.taverna || { energia: 5, energiaMaxima: 5, ultimaRecarga: Date.now(), hpPedra: 100 };
    jogo.mascotes = dadosSalvos.mascotes || [
        { id: 'fada', nome: 'Fada de Luz', desbloqueado: false, ativo: false, aura: 'Acelera Cooldowns em 10%' },
        { id: 'slime', nome: 'Slime Tóxico', desbloqueado: false, ativo: false, aura: 'Dano Passivo Constante' },
        { id: 'dragao', nome: 'Mini Dragão', desbloqueado: false, ativo: false, aura: '+20% Chance de Crítico' }
    ];
    jogo.frestaDesafio = dadosSalvos.frestaDesafio || { andarAtual: 1, tempoRestante: 30, ativa: false, hpOriginalMonstro: 0, tipoInimigo: 0 };
    jogo.buffsAtivos = dadosSalvos.buffsAtivos || { frenesiOuro: 0, fluxoVeloz: 0, hidromel: 0 };
    if (jogo.buffsAtivos.hidromel === undefined) jogo.buffsAtivos.hidromel = 0;
    jogo.dpsEmTempoReal = 0;
    jogo.dpsBuffer = 0;
    jogo.timeAtordoado = 0;

    jogo.eventoVolante = dadosSalvos.eventoVolante || { ativo: false, x: -60, y: 120, raio: 22, tipo: 'fada', velocidade: 2.2, duracao: 0 };
    if (!jogo.eventoVolante.raio) jogo.eventoVolante.raio = 22;

    jogo.equipamentos = dadosSalvos.equipamentos || {
        inventario: [],
        equipados: { arma: null, armadura: null, amuleto: null },
        poDeForja: 0
    };
    if (!jogo.equipamentos.equipados) jogo.equipamentos.equipados = { arma: null, armadura: null, amuleto: null };
    if (!jogo.equipamentos.inventario) jogo.equipamentos.inventario = [];
    if (jogo.equipamentos.poDeForja === undefined) jogo.equipamentos.poDeForja = 0;

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
    // Se a função for ativada por um clique de botão comum (sem o arquivo anexado)
    if (!event || !event.target || !event.target.files) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dat,.json,application/json';
        input.onchange = (e) => importarProgressoFisico(e);
        input.click(); // Abre a janela para escolher o arquivo
        return;
    }

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
        jogo.torreAbismo.ativa = false;
        jogo.guilda.expedicao.ativa = false;
        jogo.guilda.expedicao.heroiIndex = null;
        jogo.guilda.expedicao.tempoFim = 0;
        jogo.monstroLodoToxico = 0;

        jogo.herois.forEach((heroi, index) => {
            let estavaDesbloqueado = index === 0 || heroi.desbloqueada || heroi.nivelDps > 0;
            
            heroi.nivelDps = index === 0 ? 0 : (estavaDesbloqueado ? 1 : 0);
            heroi.custoDps = index === 0 ? 10 : (index === 1 ? 150 : (index === 2 ? 250 : (index === 3 ? 15 : (index === 4 ? 600 : (index === 5 ? 1000 : 1500)))));
            heroi.multCusto = index === 0 ? 1.5 : (index === 1 ? 1.7 : (index === 2 ? 1.6 : (index === 3 ? 1.15 : (index === 4 ? 1.9 : (index === 5 ? 1.85 : 1.9)))));
            heroi.chanceCritico = index === 0 ? 0 : (index === 1 ? 0.10 : (index === 2 ? 0.05 : (index === 3 ? 0.05 : (index === 4 ? 0.25 : (index === 5 ? 0.15 : 0.30)))));
            heroi.nivelCritico = 0;
            heroi.custoCritico = index === 0 ? 50 : (index === 1 ? 300 : (index === 2 ? 400 : (index === 3 ? 100 : (index === 4 ? 700 : (index === 5 ? 1200 : 1800)))));
            if (index === 3) heroi.multCustoCritico = 1.4;
            
            // Reseta o DPS para o nível Base, mantendo os multiplicadores por Estrela do Gacha
            let dpsBase = index === 0 ? 1 : (estavaDesbloqueado ? (index === 1 ? 2 : (index === 3 ? 0 : (index === 5 ? 3 : (index === 6 ? 4 : 1)))) : 0);
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
                    } else if (skill.nome === "🌟 Julgamento Divino") {
                        skill.custoUpgrade = 450;
                        skill.multiplicadorDanoInstantaneo = 35;
                        skill.duracaoMax = 5;
                    } else if (skill.nome === "🩸 Fúria Implacável") {
                        skill.custoUpgrade = 500;
                        skill.multiplicadorDanoInstantaneo = 50;
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

// --- SISTEMA DE LOOT & EQUIPAMENTOS ---
export function gerarItemLoot(nivel = 1) {
    const slots = [
        { tipo: "arma", nomes: ["Espada", "Lâmina", "Machado", "Arco", "Cajado", "Adaga", "Lança"], icone: "⚔️" },
        { tipo: "armadura", nomes: ["Cota de Malha", "Armadura", "Manto", "Couraça", "Túnica", "Guarda-Peito"], icone: "🛡️" },
        { tipo: "amuleto", nomes: ["Amuleto", "Pingente", "Talismã", "Anel", "Relíquia", "Gema"], icone: "💍" }
    ];

    const sufixos = [
        "do Titã", "da Aurora", "do Vazio", "da Tempestade", "Ígneo", "Glacial", "Sombrio", "Ancestral", "do Dragão", "Estelar"
    ];

    let roll = Math.random();
    let raridade = "comum";
    if (roll < 0.05 + (nivel * 0.002)) raridade = "lendario";
    else if (roll < 0.22 + (nivel * 0.004)) raridade = "epico";
    else if (roll < 0.55 + (nivel * 0.006)) raridade = "raro";

    const slotObj = slots[Math.floor(Math.random() * slots.length)];
    const nomeBase = slotObj.nomes[Math.floor(Math.random() * slotObj.nomes.length)];
    const sufixo = sufixos[Math.floor(Math.random() * sufixos.length)];
    const nome = `${nomeBase} ${sufixo}`;

    const numAfixos = raridade === "comum" ? 1 : (raridade === "raro" ? 2 : (raridade === "epico" ? 3 : 4));

    const poolAfixos = [
        { tipo: "dpsBonus", baseMin: 12, baseMax: 28, unit: "%", label: "DPS da Equipe" },
        { tipo: "danoClique", baseMin: 18, baseMax: 40, unit: "%", label: "Dano de Clique" },
        { tipo: "critChance", baseMin: 3, baseMax: 8, unit: "%", label: "Chance Crítica" },
        { tipo: "critDano", baseMin: 25, baseMax: 65, unit: "%", label: "Dano Crítico" },
        { tipo: "ouroBonus", baseMin: 20, baseMax: 50, unit: "%", label: "Ouro Saqueado" },
        { tipo: "reducaoCd", baseMin: 6, baseMax: 16, unit: "%", label: "Aceleração de Cooldown" }
    ];

    let multRaridade = raridade === "comum" ? 1 : (raridade === "raro" ? 1.4 : (raridade === "epico" ? 2.1 : 3.2));
    let fatorNivel = 1 + (nivel * 0.04);

    let embaralhado = [...poolAfixos].sort(() => 0.5 - Math.random());
    let afixos = [];
    for (let i = 0; i < numAfixos; i++) {
        let af = embaralhado[i];
        let valBase = af.baseMin + Math.random() * (af.baseMax - af.baseMin);
        let valFinal = Math.round(valBase * multRaridade * fatorNivel);
        afixos.push({
            tipo: af.tipo,
            valor: valFinal,
            desc: `+${valFinal}${af.unit} ${af.label}`
        });
    }

    let passivaLendaria = null;
    if (raridade === "lendario") {
        const passivas = [
            "Fúria do Titã: +100% de dano contra Chefes",
            "Toque de Midas: +150% de ouro de monstros e eventos",
            "Eco Arcano: 15% de chance de zerar cooldowns ao usar habilidade",
            "Coração de Dragão: +50% de dano crítico e golpes causam fogo"
        ];
        passivaLendaria = passivas[Math.floor(Math.random() * passivas.length)];
    }

    return {
        id: "eq_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        nome,
        tipo: slotObj.tipo,
        raridade,
        icone: slotObj.icone,
        nivelItem: nivel,
        nivelUpgrade: 0,
        afixos,
        passivaLendaria
    };
}

export function calcularBonusEquipamentos() {
    let bonus = {
        dpsBonus: 0,
        danoClique: 0,
        critChance: 0,
        critDano: 0,
        ouroBonus: 0,
        reducaoCd: 0,
        danoChefe: 1,
        passivas: []
    };

    if (!jogo.equipamentos || !jogo.equipamentos.equipados) return bonus;

    ['arma', 'armadura', 'amuleto'].forEach(slot => {
        let item = jogo.equipamentos.equipados[slot];
        if (item && item.afixos) {
            let multUp = 1 + ((item.nivelUpgrade || 0) * 0.15); // +15% nos afixos por nível de forja
            item.afixos.forEach(af => {
                let v = af.valor * multUp;
                if (af.tipo === 'dpsBonus') bonus.dpsBonus += v;
                else if (af.tipo === 'danoClique') bonus.danoClique += v;
                else if (af.tipo === 'critChance') bonus.critChance += (v / 100);
                else if (af.tipo === 'critDano') bonus.critDano += (v / 100);
                else if (af.tipo === 'ouroBonus') bonus.ouroBonus += (v / 100);
                else if (af.tipo === 'reducaoCd') bonus.reducaoCd += (v / 100);
            });
            if (item.passivaLendaria) {
                bonus.passivas.push(item.passivaLendaria);
                if (item.passivaLendaria.includes("Fúria do Titã")) bonus.danoChefe *= 2.0;
                if (item.passivaLendaria.includes("Toque de Midas")) bonus.ouroBonus += 1.5;
                if (item.passivaLendaria.includes("Coração de Dragão")) bonus.critDano += 0.50;
            }
        }
    });

    return bonus;
}

if (typeof window !== 'undefined') {
    window.jogo = jogo;
    window.formatarNumero = formatarNumero;
    window.gerarItemLoot = gerarItemLoot;
    window.calcularBonusEquipamentos = calcularBonusEquipamentos;
}