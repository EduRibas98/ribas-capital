// --- CONFIGURAÇÃO GLOBAL E API ---
const TOKEN = "rhwoawpasjrgK2eTM2MqS1";

// --- COTAÇÃO DO BITCOIN ---
const COTACAO_BITCOIN_BRL = 354333.90; 

const meusAtivos = {
    acoes: {
        "LEVE3": 45, "ITSA3": 81, "WEGE3": 31, "EGIE3": 48, 
        "JHSF3": 124, "MDIA3": 41, "BBDC3": 80, "AUVP11": 15
    },
    fiis: {
        "KNRI11": 2, "HGBS11": 27, "TVRI11": 5, "HGLG11": 2, "BTLG11": 3, "XPML11": 5
    },
    internacional: {
        "BRK-B": 0.17804802, "GOOGL": 0.3531, "JPM": 0.4465, "KO": 0.9565
    },
    cripto: {
        "BTC": 0.00037339 
    },
    imoveisFisicos: 28637.25, 
    rendaFixa: 1003.60,
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
            let classAtivo = "";

            if(meusAtivos.acoes[ticker]) {
                valorBRL = preco * meusAtivos.acoes[ticker];
                totalAcoes += valorBRL;
                classAtivo = "Empresas BR";
            } 
            else if(meusAtivos.fiis[ticker]) {
                valorBRL = preco * meusAtivos.fiis[ticker];
                totalFiis += valorBRL;
                classAtivo = "FIIs";
            }
            else if(meusAtivos.internacional[ticker]) {
                valorBRL = (preco * cotacaoDolar) * meusAtivos.internacional[ticker];
                totalInternacional += valorBRL;
                classAtivo = "Empresas EUA";
            }

            if(classAtivo !== "") {
                listaAtivos.push({ classe: classAtivo, ticker, valorBRL });
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

    if(tabId === 'tab-sobre' || document.getElementById('sobre-carteira')?.style.display === 'block') {
        atualizarCarteiraReal();
    }
};

// --- NAVEGAÇÃO DE CATEGORIAS (Educação) ---
window.abrirCategoria = function(catId, btn) {
    // Esconde todos primeiro
    document.querySelectorAll('.pagina-artigo').forEach(art => {
        art.classList.remove('active');
        art.style.display = 'none'; // Adicione esta linha
    });
    
    btn.parentElement.querySelectorAll('.btn-tema').forEach(b => b.classList.remove('active'));
    
    // Mostra o selecionado
    const alvo = document.getElementById(catId);
    alvo.classList.add('active');
    alvo.style.display = 'block'; // Adicione esta linha
    btn.classList.add('active');
};

// --- CORREÇÃO: FUNÇÃO DE SUB-ABAS (Educação e Renda Extra) ---
window.abrirSubConteudo = function(subId, btn) {
    const containerPai = btn.closest('.artigo-completo') || 
                         btn.closest('.container-extra') || 
                         btn.closest('#tab-sobre');
    
    const seletoresGerais = '.sub-artigo-content, .sub-renda, .sub-sobre-content, .pagina-artigo';
    const conteudos = containerPai.querySelectorAll(seletoresGerais);
    
    conteudos.forEach(div => {
        div.style.display = 'none';
        div.classList.remove('active');
    });

    btn.parentElement.querySelectorAll('.btn-tema, .tab-link').forEach(b => b.classList.remove('active'));

    const alvo = document.getElementById(subId);
    if(alvo) {
        alvo.style.display = 'block';
        alvo.classList.add('active');
    }
    
    btn.classList.add('active');

    if(subId === 'sobre-carteira' || subId === 'tab-carteira') {
        atualizarCarteiraReal();
    }
};

window.abrirSubSobre = function(subId, btn) {
    abrirSubConteudo(subId, btn);
};

// --- SIMULADOR CORRIGIDO ---

function renderizarGrafico(labels, valoresRibas, valoresComp, nomeComp) {
    const canvas = document.getElementById('grafico');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (meuGrafico) {
        meuGrafico.destroy();
    }

    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: 'Ribas Capital', 
                    data: valoresRibas, 
                    borderColor: '#00b386', 
                    backgroundColor: 'rgba(0, 179, 134, 0.1)', 
                    fill: true, 
                    tension: 0.3,
                    pointRadius: 2
                },
                { 
                    label: nomeComp, 
                    data: valoresComp, 
                    borderColor: '#94a3b8', 
                    borderDash: [5, 5], 
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                    }
                }
            }
        }
    });
}

window.calcular = function() {
    const vIni = parseFloat(document.getElementById("valorInicial").value) || 0;
    const aMen = parseFloat(document.getElementById("aporteMensal").value) || 0;
    const taxa = (parseFloat(document.getElementById("taxa").value) || 0) / 100;
    const tempo = parseInt(document.getElementById("tempo").value) || 0;
    const tComp = parseFloat(document.getElementById("comparador").value);
    const nComp = document.getElementById("comparador").options[document.getElementById("comparador").selectedIndex].text;
    
    if (tempo <= 0) {
        alert("Por favor, insira um tempo maior que 0 meses.");
        return;
    }

    let m = vIni, mC = vIni, tI = vIni;
    let vR = [parseFloat(vIni.toFixed(2))], vC = [parseFloat(vIni.toFixed(2))], labs = ["Início"], html = "";

    for (let i = 1; i <= tempo; i++) {
        let jurosMensal = m * taxa; 
        m = m + jurosMensal + aMen; 
        mC = mC * (1 + tComp) + aMen; 
        tI += aMen;

        vR.push(parseFloat(m.toFixed(2))); 
        vC.push(parseFloat(mC.toFixed(2)));
        labs.push(`Mês ${i}`);
        
        if (tempo <= 20 || i % 12 === 0 || i === tempo) {
            html += `<tr>
                <td>Mês ${i}</td>
                <td>R$ ${tI.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>R$ ${jurosMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>R$ ${m.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>`;
        }
    }

    document.getElementById("corpo-tabela").innerHTML = html;
    document.getElementById("cards-resumo").innerHTML = `
    <div class="stats-grid">
        <div class="stat-card">
            <span>TOTAL ACUMULADO</span>
            <strong>${m.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        <div class="stat-card">
            <span>RENDIMENTO MENSAL FINAL</span>
            <strong>${(m * taxa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
    </div>`;

    document.getElementById("tabela-evolucao-container").style.display = "block";
    
    setTimeout(() => {
        renderizarGrafico(labs, vR, vC, nComp);
    }, 50);
};

// --- SIMULADOR REVERSO ---
window.calcularReverso = function() {
    const objetivo = parseFloat(document.getElementById("objetivoFinal").value) || 0;
    const taxaMensal = (parseFloat(document.getElementById("taxaReverso").value) || 0) / 100;
    const meses = parseInt(document.getElementById("tempoReverso").value) || 0;

    if (objetivo <= 0 || meses <= 0) {
        alert("Por favor, preencha o objetivo e o tempo.");
        return;
    }

    let aporte = 0;
    if (taxaMensal > 0) {
        aporte = (objetivo * taxaMensal) / (Math.pow(1 + taxaMensal, meses) - 1);
    } else {
        aporte = objetivo / meses;
    }

    const totalInvestido = aporte * meses;
    const totalJuros = objetivo - totalInvestido;

    document.getElementById("resultado-reverso").innerHTML = `
        <div class="stats-grid" style="grid-template-columns: 1fr; margin-bottom: 20px;">
            <div class="stat-card" style="border-top: 4px solid #00b386; background: #f8fafc;">
                <span>APORTE MENSAL NECESSÁRIO</span>
                <strong style="font-size: 2.2rem; color: #1e293b; display: block; margin-top: 10px;">
                    ${aporte.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <span>TOTAL INVESTIDO</span>
                <strong>${totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
            <div class="stat-card">
                <span>TOTAL EM JUROS</span>
                <strong>${totalJuros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
        </div>`;
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarCarteiraReal();
});

window.abrirSubSobre = function(subId, btn) {
    abrirSubConteudo(subId, btn);
    if(subId === 'sobre-carteira' || subId === 'tab-carteira') {
        atualizarCarteiraReal();
    }
};