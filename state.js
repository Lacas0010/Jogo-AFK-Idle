export let jogo = {
    pontos: 0,
    gemas: 0,
    tirosGacha: 0,
    ultimoAcesso: Date.now(),
    nivel: 1,
    monstroHp: 10,
    monstroHpMax: 10,
    herois: [
        {
            nome: "Herói Principal",
            dps: 1,
            nivelDps: 0,
            custoDps: 10,
            chanceCritico: 0,
            nivelCritico: 0,
            custoCritico: 50,
            multCusto: 1.5,
            fragmentos: 0,
            estrelas: 1
        },
        {
            nome: "🏹 Elfa Arqueira (Gacha)",
            dps: 0,
            nivelDps: 0,
            custoDps: 150,
            chanceCritico: 0.10,
            nivelCritico: 0,
            custoCritico: 300,
            multCusto: 1.7,
            fragmentos: 0,
            estrelas: 1
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
                jogo.herois[i].estrelas = jogo.herois[i].estrelas || 1;
            }
        });
    }
    
    jogo.nivel = dadosSalvos.nivel || 1;
    jogo.monstroHpMax = dadosSalvos.monstroHpMax || 10;
    jogo.monstroHp = dadosSalvos.monstroHp || 10;
    jogo.gemas = Number(dadosSalvos.gemas) || 0;
    jogo.tirosGacha = Number(dadosSalvos.tirosGacha) || 0;
    jogo.pontos = dadosSalvos.pontos;
}

export function resetarJogo() {
    if (confirm("Tem certeza que deseja apagar todo o seu progresso?")) {
        localStorage.removeItem("meuJogoAFK");
        isResetando = true;
        window.location.reload();
    }
}