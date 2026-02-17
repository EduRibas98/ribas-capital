// --- CONFIGURAÇÃO GLOBAL E API ---
const TOKEN = "rhwoawpasjrgK2eTM2MqS1";

// --- COTAÇÃO DO BITCOIN ---
const COTACAO_BITCOIN_BRL = 360494.90; 

const meusAtivos = {
    acoes: {
        "LEVE3": 45, "ITSA3": 81, "WEGE3": 31, "EGIE3": 48, 
        "JHSF3": 124, "MDIA3": 41, "BBDC3": 80, "AUVP11": 15
    },
    fiis: {
        "KNRI11": 2, "HGBS11": 27, "TVRI11": 5, "HGLG11": 2
    },
    internacional: {
        "BRK.B": 0.17804802, "GOOGL": 0.3531, "JPM": 0.4465, "KO": 0.9565
    },
    cripto: {
        "BTC": 0.00037339 
    },
    imoveisFisicos: 28637.25, 
    rendaFixa: 1000.00,
    ganhoManual: 15450.75 
};

let meuGrafico = null;

async function atualizarCarteiraReal() {
    const tickersNacionais = [...Object.keys(meusAtivos.acoes), ...Object.keys(meusAtivos.fiis)].join(',');
    const tickersInternacionais = [...Object.keys(meusAtivos.internacional)].join(',');
    
    try {
        const url = `https://brapi.dev/api/quote/${tickersNacionais},${tickersInternacionais},USDBRL?token=${TOKEN}`;
        const response = await fetch(url);
        const data = await response.json();
        
        const usdData = data.results.find(res => res.symbol === "USDBRL");
        const cotacaoDolar = usdData ? usdData.regularMarketPrice : 5.22; 

        const notaDolar = document.getElementById('nota-dolar');
        if(notaDolar) {
            notaDolar.innerText = `* Câmbio: US$ 1 = R$ ${cotacaoDolar.toFixed(2)} | BTC: R$ ${COTACAO_BITCOIN_BRL.toLocaleString('pt-BR')}`;
        }

        let totalAcoes = 0, totalFiis = 0, totalInternacional = 0, totalCripto = 0, totalRF = meusAtivos.rendaFixa;
        let listaAtivos = [];

        data.results.forEach(ativo => {
            const ticker = ativo.symbol;
            const preco = ativo.regularMarketPrice || 0;
            let valorBRL = 0;
            let classe = "";

            if(meusAtivos.acoes[ticker]) {
                valorBRL = preco * meusAtivos.acoes[ticker];
                totalAcoes += valorBRL;
                classe = "Empresas BR";
            } 
            else if(meusAtivos.fiis[ticker]) {
                valorBRL = preco * meusAtivos.fiis[ticker];
                totalFiis += valorBRL;
                classe = "FIIs";
            }
            else if(meusAtivos.internacional[ticker]) {
                valorBRL = (preco * cotacaoDolar) * meusAtivos.internacional[ticker];
                totalInternacional += valorBRL;
                classe = "Empresas EUA";
            }

            if(classe !== "") {
                listaAtivos.push({ classe, ticker, valorBRL });
            }
        });

        const valorBTC = meusAtivos.cripto.BTC * COTACAO_BITCOIN_BRL;
        totalCripto = valorBTC;
        listaAtivos.push({ classe: "Cripto", ticker: "BITCOIN", valorBRL: valorBTC });
        
        listaAtivos.push({ classe: "Imóvel", ticker: "TERRENO", valorBRL: meusAtivos.imoveisFisicos });
        totalFiis += meusAtivos.imoveisFisicos; 

        listaAtivos.push({ classe: "Renda Fixa", ticker: "IPCA", valorBRL: meusAtivos.rendaFixa });

        listaAtivos.sort((a, b) => b.valorBRL - a.valorBRL);

        const corpoTabela = document.getElementById('corpo-tabela-carteira');
        if (corpoTabela) {
            corpoTabela.innerHTML = "";
            listaAtivos.forEach(item => {
                corpoTabela.innerHTML += `
                    <tr>
                        <td>${item.classe}</td>
                        <td><strong>${item.ticker}</strong></td>
                        <td>R$ ${item.valorBRL.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>`;
            });
        }

        const totalGeral = totalAcoes + totalFiis + totalInternacional + totalCripto + totalRF;
        
        const totalEl = document.getElementById('valor-patrimonio-total');
        if(totalEl) totalEl.innerText = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const ganhoEl = document.getElementById('valor-ganho-acumulado');
        if(ganhoEl) ganhoEl.innerText = meusAtivos.ganhoManual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        atualizarCard('perc-rf', totalRF, totalGeral);
        atualizarCard('perc-fii', totalFiis, totalGeral);
        atualizarCard('perc-acoes', totalAcoes, totalGeral);
        atualizarCard('perc-internacional', totalInternacional, totalGeral);
        atualizarCard('perc-cripto', totalCripto, totalGeral);

    } catch (error) {
        console.error("Erro na carteira:", error);
    }
}

function atualizarCard(id, parcial, total) {
    const el = document.getElementById(id);
    if(el && total > 0) {
        el.innerText = ((parcial / total) * 100).toFixed(1) + "%";
    }
}

// --- NAVEGAÇÃO PRINCIPAL ---
window.switchTab = function(event, tabId) {
    document.querySelectorAll(".tab-content").forEach(c => { 
        c.classList.remove("active"); 
        c.style.display = "none"; 
    });
    document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) { 
        activeTab.classList.add("active"); 
        activeTab.style.display = "block"; 
    }
    if(event) event.currentTarget.classList.add("active");

    // CORREÇÃO AQUI: Se entrar na aba 'Sobre' ou se a subaba da carteira estiver aberta, ele atualiza
    if(tabId === 'tab-sobre' || document.getElementById('sobre-carteira')?.style.display === 'block') {
        atualizarCarteiraReal();
    }
};

// --- NAVEGAÇÃO DE CATEGORIAS (Educação) ---
window.abrirCategoria = function(catId, btn) {
    document.querySelectorAll('.pagina-artigo').forEach(art => art.classList.remove('active'));
    // Remove active apenas dos botões do menu principal da aba educação
    btn.parentElement.querySelectorAll('.btn-tema').forEach(b => b.classList.remove('active'));
    
    document.getElementById(catId).classList.add('active');
    btn.classList.add('active');
};

// --- CORREÇÃO: FUNÇÃO DE SUB-ABAS (Educação e Renda Extra) ---
window.abrirSubConteudo = function(subId, btn) {
    // 1. Identifica o container principal (seja da Educação, Renda Extra ou Sobre)
    const containerPai = btn.closest('.artigo-completo') || 
                         btn.closest('.container-extra') || 
                         btn.closest('#tab-sobre');
    
    // 2. Esconde TODOS os conteúdos internos possíveis para evitar sobreposição
    const seletoresGerais = '.sub-artigo-content, .sub-renda, .sub-sobre-content, .pagina-artigo';
    const conteudos = containerPai.querySelectorAll(seletoresGerais);
    
    conteudos.forEach(div => {
        div.style.display = 'none';
        div.classList.remove('active');
    });

    // 3. Remove o 'active' dos botões do menu onde o clique aconteceu
    btn.parentElement.querySelectorAll('.btn-tema, .tab-link').forEach(b => b.classList.remove('active'));

    // 4. Mostra o conteúdo alvo
    const alvo = document.getElementById(subId);
    if(alvo) {
        alvo.style.display = 'block';
        alvo.classList.add('active');
    }
    
    // 5. Marca o botão como ativo
    btn.classList.add('active');

    // 6. Se for a carteira, atualiza os dados da API
    if(subId === 'sobre-carteira' || subId === 'tab-carteira') {
        atualizarCarteiraReal();
    }
};

// Mantemos essa "ponte" para garantir que botões antigos funcionem
window.abrirSubSobre = function(subId, btn) {
    abrirSubConteudo(subId, btn);
};

// --- SIMULADOR ---
function renderizarGrafico(labels, valoresRibas, valoresComp, nomeComp) {
    const ctx = document.getElementById('grafico').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Ribas Capital', data: valoresRibas, borderColor: '#00b386', backgroundColor: 'rgba(0, 179, 134, 0.1)', fill: true, tension: 0.3 },
                { label: nomeComp, data: valoresComp, borderColor: '#94a3b8', borderDash: [5, 5], tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

window.calcular = function() {
    const vIni = parseFloat(document.getElementById("valorInicial").value) || 0;
    const aMen = parseFloat(document.getElementById("aporteMensal").value) || 0;
    const taxa = (parseFloat(document.getElementById("taxa").value) || 0) / 100;
    const tempo = parseInt(document.getElementById("tempo").value) || 0;
    const tComp = parseFloat(document.getElementById("comparador").value);
    const nComp = document.getElementById("comparador").options[document.getElementById("comparador").selectedIndex].text;
    
    let m = vIni, mC = vIni, tI = vIni;
    let vR = [vIni], vC = [vIni], labs = ["Início"], html = "";

    for (let i = 1; i <= tempo; i++) {
        let j = m * taxa; 
        m = m + j + aMen; 
        mC = mC * (1 + tComp) + aMen; 
        tI += aMen;
        vR.push(m); vC.push(mC); labs.push(`Mês ${i}`);
        
        if (tempo <= 20 || i % 12 === 0 || i === tempo) {
            html += `<tr><td>Mês ${i}</td><td>R$ ${tI.toLocaleString('pt-BR')}</td><td>R$ ${j.toLocaleString('pt-BR')}</td><td>R$ ${m.toLocaleString('pt-BR')}</td></tr>`;
        }
    }
    document.getElementById("corpo-tabela").innerHTML = html;
    document.getElementById("cards-resumo").innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><span>TOTAL ACUMULADO</span><strong>R$ ${m.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong></div>
            <div class="stat-card"><span>RENDIMENTO FINAL</span><strong>R$ ${(m * taxa).toLocaleString('pt-BR', {minimumFractionDigits: 2})}/mês</strong></div>
        </div>`;
    document.getElementById("tabela-evolucao-container").style.display = "block";
    document.getElementById("btn-exportar-pdf").style.display = "inline-block";
    renderizarGrafico(labs, vR, vC, nComp);
};

window.exportarPDF = () => { html2pdf().from(document.getElementById('area-simulador')).save(); };
window.limpar = () => { location.reload(); };

// Carrega os dados assim que a página termina de ler o script
document.addEventListener('DOMContentLoaded', () => {
    atualizarCarteiraReal();
});

// Direciona as chamadas antigas de 'abrirSubSobre' para a nova função unificada
window.abrirSubSobre = function(subId, btn) {
    // Chama a função nova que já corrigimos
    abrirSubConteudo(subId, btn);
    
    // Se for a sub-aba da carteira, aproveita para atualizar os dados da API
    if(subId === 'sobre-carteira' || subId === 'tab-carteira') {
        atualizarCarteiraReal();
    }
};
