// --- CONFIGURAÇÃO GLOBAL E API ---
const TOKEN = "rhwoawpasjrgK2eTM2MqS1";

// --- INDICADORES MANUAIS (Altere aqui para atualizar o site todo) ---
const INDICADORES = {
    bitcoin: 354333.90,
    ipca: 0.0426, // 4.26% ao ano (usado no Poder de Compra e FIRE)
    cdi: 0.1490   // 14.90% ao ano (usado como base de comparação)
};

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
            notaDolar.innerText = `* Câmbio: US$ 1 = R$ ${cotacaoDolar.toFixed(2)} | BTC: R$ ${INDICADORES.bitcoin.toLocaleString('pt-BR')}`;
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

        const valorBTC = meusAtivos.cripto.BTC * INDICADORES.bitcoin;
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
        
        // Atualiza Patrimônio Total
        const totalEl = document.getElementById('valor-patrimonio-total');
        if(totalEl) totalEl.innerText = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Atualiza Ganho Acumulado (Corrigido)
        const ganhoEl = document.getElementById('valor-ganho-acumulado');
        if(ganhoEl) ganhoEl.innerText = meusAtivos.ganhoManual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        atualizarCard('perc-rf', totalRF, totalGeral);
        atualizarCard('perc-fii', totalFiis, totalGeral);
        atualizarCard('perc-acoes', totalAcoes, totalGeral);
        atualizarCard('perc-internacional', totalInternacional, totalGeral);
        atualizarCard('perc-cripto', totalCripto, totalGeral);

    } catch (error) { console.error("Erro na carteira:", error); }
}

function atualizarCard(id, parcial, total) {
    const el = document.getElementById(id);
    if(el && total > 0) el.innerText = ((parcial / total) * 100).toFixed(1) + "%";
}

// --- NAVEGAÇÃO ---
window.switchTab = function(event, tabId) {
    document.querySelectorAll(".tab-content").forEach(c => { c.classList.remove("active"); c.style.display = "none"; });
    document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
    const activeTab = document.getElementById(tabId);
    if (activeTab) { activeTab.classList.add("active"); activeTab.style.display = "block"; }
    if(event) event.currentTarget.classList.add("active");
    if(tabId === 'tab-sobre') atualizarCarteiraReal();
};

window.abrirCategoria = function(catId, btn) {
    document.querySelectorAll('.pagina-artigo').forEach(art => { art.classList.remove('active'); art.style.display = 'none'; });
    btn.parentElement.querySelectorAll('.btn-tema').forEach(b => b.classList.remove('active'));
    const alvo = document.getElementById(catId);
    if(alvo) { alvo.classList.add('active'); alvo.style.display = 'block'; }
    btn.classList.add('active');
};

window.abrirSubConteudo = function(subId, btn) {
    const containerPai = btn.closest('.artigo-completo') || btn.closest('.container-extra') || btn.closest('#tab-sobre');
    containerPai.querySelectorAll('.sub-artigo-content, .sub-renda, .sub-sobre-content, .pagina-artigo').forEach(div => {
        div.style.display = 'none'; div.classList.remove('active');
    });
    btn.parentElement.querySelectorAll('.btn-tema, .tab-link').forEach(b => b.classList.remove('active'));
    const alvo = document.getElementById(subId);
    if(alvo) { alvo.style.display = 'block'; alvo.classList.add('active'); }
    btn.classList.add('active');
    if(subId === 'sobre-carteira' || subId === 'tab-carteira') atualizarCarteiraReal();
};

window.abrirSubSobre = function(subId, btn) { abrirSubConteudo(subId, btn); };

// --- SIMULADORES (USANDO INDICADORES GLOBAIS) ---

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
            <p>Meta baseada na Regra dos 4%. Você saca R$ ${gasto.toLocaleString('pt-BR')} e reinveste o excedente para manter o poder de compra (Inflação: ${(INDICADORES.ipca * 100).toFixed(1)}% a.a.).</p>
        </div>`;
}

function calcInflacaoNova() {
    let valorTexto = document.getElementById('valorInflacao').value;
    let valorFuturo = parseInt(valorTexto.replace(/\D/g, ""));
    let anos = parseInt(document.getElementById('anosInflacao').value);
    if (!valorFuturo || !anos) return alert("Preencha os campos.");

    // Usa o IPCA definido no topo
    let poderDeCompraHoje = valorFuturo / Math.pow((1 + INDICADORES.ipca), anos);
    
    document.getElementById('res-inflacao-novo').innerHTML = `
        <div style="background:#fff1f2; padding:20px; border-radius:12px; border-left:5px solid #e11d48;">
            <p>Em ${anos} anos, R$ ${valorFuturo.toLocaleString('pt-BR')} terão o poder de compra de:</p>
            <h2 style="color: #e11d48;">${poderDeCompraHoje.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h2>
            <small>*Considerando IPCA manual de ${(INDICADORES.ipca * 100).toFixed(1)}% ao ano.</small>
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
            <p>Equivalente a LCI de ${lci}% (CDI atual: ${(INDICADORES.cdi * 100).toFixed(2)}%)</p>
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
    
    // Taxa digitada considerada ao MÊS (Ex: 1 = 1% am)
    const taxaMensalDigitada = (parseFloat(document.getElementById("taxa").value) || 0) / 100;

    const tempo = parseInt(document.getElementById("tempo").value) || 0;
    const selectComp = document.getElementById("comparador");
    const valorSelect = selectComp.value.toLowerCase();
    const nComp = selectComp.options[selectComp.selectedIndex].text;

    // Pega Inflação/CDI do topo (Anual) e converte para Mensal
    let taxaCompAnual = 0;
    if (valorSelect.includes("ipca") || nComp.toLowerCase().includes("inflação")) {
        taxaCompAnual = INDICADORES.ipca;
    } else if (valorSelect.includes("cdi") || nComp.toLowerCase().includes("cdi")) {
        taxaCompAnual = INDICADORES.cdi;
    } else {
        taxaCompAnual = parseFloat(valorSelect) / 100 || 0;
    }

    const taxaCompMensal = Math.pow(1 + taxaCompAnual, 1/12) - 1;
    
    if (tempo <= 0) return alert("Insira um tempo maior que 0.");

    let m = vIni;      
    let mC = vIni;     
    let tI = vIni;     
    let vR = [vIni];   
    let vC = [vIni];   
    let labs = ["Início"];
    let html = "";

    for (let i = 1; i <= tempo; i++) {
        let jurosDoMes = m * taxaMensalDigitada; 
        m = m + jurosDoMes + aMen; 

        let jurosCompMes = mC * taxaCompMensal;
        mC = mC + jurosCompMes + aMen; 
        
        tI += aMen;

        vR.push(parseFloat(m.toFixed(2))); 
        vC.push(parseFloat(mC.toFixed(2)));
        labs.push(`Mês ${i}`);
        
        // --- TABELA FORMATADA COM 2 CASAS DECIMAIS ---
        if (tempo <= 20 || i % 12 === 0 || i === tempo) {
            html += `
                <tr>
                    <td>Mês ${i}</td>
                    <td>R$ ${tI.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>R$ ${jurosDoMes.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>R$ ${m.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>`;
        }
    }

    document.getElementById("corpo-tabela").innerHTML = html;
    
    // Cards de Resumo também formatados
    document.getElementById("cards-resumo").innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <span>TOTAL ACUMULADO</span>
                <strong>${m.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</strong>
            </div>
            <div class="stat-card">
                <span>RENDIMENTO MENSAL FINAL</span>
                <strong>${(m * taxaMensalDigitada).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</strong>
            </div>
        </div>`;

    document.getElementById("tabela-evolucao-container").style.display = "block";
    setTimeout(() => { renderizarGrafico(labs, vR, vC, nComp); }, 50);
};window.calcularReverso = function() {
    const objetivo = parseFloat(document.getElementById("objetivoFinal").value) || 0;
    const taxaMensal = (parseFloat(document.getElementById("taxaReverso").value) || 0) / 100;
    const meses = parseInt(document.getElementById("tempoReverso").value) || 0;
    let aporte = taxaMensal > 0 ? (objetivo * taxaMensal) / (Math.pow(1 + taxaMensal, meses) - 1) : objetivo / meses;
    document.getElementById("resultado-reverso").innerHTML = `<div class="stat-card"><strong>${aporte.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</strong></div>`;
};

document.addEventListener('DOMContentLoaded', () => { atualizarCarteiraReal(); });
