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
                corpoTabela.innerHTML += `<tr><td>${item.classe}</td><td><strong>${item.ticker}</strong></td><td>R$ ${item.valorBRL.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td></tr>`;
            });
        }

       const totalGeral = totalAcoes + totalFiis + totalInternacional + totalCripto + totalRF;
        
        // Atualiza o Patrimônio Total
        const totalEl = document.getElementById('valor-patrimonio-total');
        if(totalEl) totalEl.innerText = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // --- AQUI ESTAVA O ERRO: Adicionando o Ganho Acumulado ---
        const ganhoEl = document.getElementById('valor-ganho-acumulado');
        if(ganhoEl) {
            ganhoEl.innerText = meusAtivos.ganhoManual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        // -------------------------------------------------------

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
    if(el && total > 0) el.innerText = ((parcial / total) * 100).toFixed(1) + "%";
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
    if(tabId === 'tab-sobre') atualizarCarteiraReal();
};

// --- NAVEGAÇÃO DE CATEGORIAS (Aprenda a Investir) ---
window.abrirCategoria = function(catId, btn) {
    document.querySelectorAll('.pagina-artigo').forEach(art => {
        art.classList.remove('active');
        art.style.display = 'none';
    });
    btn.parentElement.querySelectorAll('.btn-tema').forEach(b => b.classList.remove('active'));
    
    const alvo = document.getElementById(catId);
    if(alvo) {
        alvo.classList.add('active');
        alvo.style.display = 'block';
    }
    btn.classList.add('active');
};

// --- NAVEGAÇÃO DE SUB-CONTEÚDO (Ferramentas, Renda Extra, Sobre) ---
window.abrirSubConteudo = function(subId, btn) {
    const containerPai = btn.closest('.artigo-completo') || 
                         btn.closest('.container-extra') || 
                         btn.closest('#tab-sobre');
    
    const seletoresGerais = '.sub-artigo-content, .sub-renda, .sub-sobre-content, .pagina-artigo';
    containerPai.querySelectorAll(seletoresGerais).forEach(div => {
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

    if(subId === 'sobre-carteira' || subId === 'tab-carteira') atualizarCarteiraReal();
};

window.abrirSubSobre = function(subId, btn) { abrirSubConteudo(subId, btn); };

// --- SIMULADORES ---
function mascaraMoedaSimples(i) {
    let v = i.value.replace(/\D/g, ''); 
    if (v === '') { i.value = ''; return; }
    v = parseInt(v).toLocaleString('pt-BR');
    i.value = 'R$ ' + v;
}

function calcFireNovo() {
    let valorTexto = document.getElementById('gastoFire').value;
    let gasto = parseInt(valorTexto.replace(/\D/g, ""));
    if (!gasto || gasto <= 0) return alert("Insira o gasto mensal.");

    let metaPatrimonio = (gasto * 12) / 0.04;
    document.getElementById('res-fire-novo').innerHTML = `
        <div style="background:#f0fdf4; padding:20px; border-radius:12px; border-left:5px solid #00b386;">
            <h2 style="color: #00b386;">${metaPatrimonio.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0})}</h2>
            <p>Meta considerando saque de R$ ${gasto.toLocaleString('pt-BR')} e reinvestimento para cobrir inflação.</p>
        </div>`;
}

function calcInflacaoNova() {
    let valorTexto = document.getElementById('valorInflacao').value;
    let valorFuturo = parseInt(valorTexto.replace(/\D/g, ""));
    let anos = parseInt(document.getElementById('anosInflacao').value);
    if (!valorFuturo || !anos) return alert("Preencha os campos.");

    let taxa = 0.045;
    let poderDeCompraHoje = valorFuturo / Math.pow((1 + taxa), anos);
    document.getElementById('res-inflacao-novo').innerHTML = `
        <div style="background:#fff1f2; padding:20px; border-radius:12px; border-left:5px solid #e11d48;">
            <p>Daqui a ${anos} anos, seus R$ ${valorFuturo.toLocaleString('pt-BR')} valerão o mesmo que:</p>
            <h2 style="color: #e11d48;">${poderDeCompraHoje.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h2>
        </div>`;
}

function calcFixaInversa() {
    let lci = parseFloat(document.getElementById('rentLciNovo').value);
    let ir = parseFloat(document.getElementById('prazoCdbNovo').value);
    if (!lci) return alert("Insira a rentabilidade.");
    let cdbEquivalente = lci / (1 - ir);
    document.getElementById('res-fixa-novo').innerHTML = `
        <div style="background:#f8fafc; padding:20px; border-radius:10px; border-left:5px solid #1e293b;">
            <h2 style="color: #00b386;">CDB de ${cdbEquivalente.toFixed(2)}% do CDI</h2>
            <p>Equivalente a LCI/LCA de ${lci}% (IR ${(ir*100).toFixed(1)}%)</p>
        </div>`;
}

// --- JUROS COMPOSTOS ORIGINAL ---
function renderizarGrafico(labels, valoresRibas, valoresComp, nomeComp) {
    const canvas = document.getElementById('grafico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Ribas Capital', data: valoresRibas, borderColor: '#00b386', fill: true, tension: 0.3 },
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
        let jurosMensal = m * taxa; m = m + jurosMensal + aMen; mC = mC * (1 + tComp) + aMen; tI += aMen;
        vR.push(m); vC.push(mC); labs.push(`Mês ${i}`);
        if (tempo <= 20 || i % 12 === 0 || i === tempo) {
            html += `<tr><td>Mês ${i}</td><td>R$ ${tI.toLocaleString('pt-BR')}</td><td>R$ ${jurosMensal.toLocaleString('pt-BR')}</td><td>R$ ${m.toLocaleString('pt-BR')}</td></tr>`;
        }
    }
    document.getElementById("corpo-tabela").innerHTML = html;
    document.getElementById("cards-resumo").innerHTML = `<div class="stats-grid"><div class="stat-card"><span>TOTAL</span><strong>${m.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</strong></div></div>`;
    document.getElementById("tabela-evolucao-container").style.display = "block";
    setTimeout(() => renderizarGrafico(labs, vR, vC, nComp), 50);
};

window.calcularReverso = function() {
    const objetivo = parseFloat(document.getElementById("objetivoFinal").value) || 0;
    const taxaMensal = (parseFloat(document.getElementById("taxaReverso").value) || 0) / 100;
    const meses = parseInt(document.getElementById("tempoReverso").value) || 0;
    let aporte = taxaMensal > 0 ? (objetivo * taxaMensal) / (Math.pow(1 + taxaMensal, meses) - 1) : objetivo / meses;
    document.getElementById("resultado-reverso").innerHTML = `<div class="stat-card"><strong>${aporte.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</strong></div>`;
};

document.addEventListener('DOMContentLoaded', () => { atualizarCarteiraReal(); });
