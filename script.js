// --- CONFIGURAÇÃO GLOBAL DO GRÁFICO ---
let meuGrafico = null;

function renderizarGrafico(labels, valoresRibas, valoresComp, nomeComp) {
    const ctx = document.getElementById('grafico').getContext('2d');
    
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
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        }
                    }
                }
            }
        }
    });
}

// --- FUNÇÃO PARA EXPORTAR PDF ---
window.exportarPDF = function() {
    const elemento = document.getElementById('area-simulador');
    const btnPdf = document.getElementById('btn-exportar-pdf');
    
    btnPdf.style.display = 'none';

    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Planejamento_Ribas_Capital.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(elemento).save().then(() => {
        btnPdf.style.display = 'inline-block';
    });
};

// --- NAVEGAÇÃO PRINCIPAL (ABAS) ---
window.switchTab = function(event, tabId) {
    // Esconder todas as abas
    const contents = document.querySelectorAll(".tab-content");
    contents.forEach(c => {
        c.classList.remove("active");
        c.style.display = "none";
    });

    // Remover active dos botões
    const links = document.querySelectorAll(".tab-link");
    links.forEach(l => l.classList.remove("active"));

    // Mostrar aba clicada
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add("active");
        activeTab.style.display = "block";
    }
    
    event.currentTarget.classList.add("active");
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- NAVEGAÇÃO PORTAL EDUCAÇÃO (CATEGORIAS) ---
window.abrirCategoria = function(catId, btn) {
    // Resetar botões
    const botoes = document.querySelectorAll('.btn-tema');
    botoes.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Resetar menus e páginas
    document.getElementById('menu-rf').style.display = 'none';
    document.getElementById('menu-rv').style.display = 'none';

    const paginas = document.querySelectorAll('.pagina-artigo');
    paginas.forEach(p => p.style.display = 'none');

    // Lógica de exibição
    if (catId === 'cat-intro') {
        document.getElementById('pg-intro').style.display = 'block';
    } else if (catId === 'cat-rendafixa') {
        document.getElementById('menu-rf').style.display = 'flex';
        document.getElementById('pg-tesouro').style.display = 'block'; // Abre o primeiro conteúdo por padrão
    } else if (catId === 'cat-rendavariavel') {
        document.getElementById('menu-rv').style.display = 'flex';
        document.getElementById('pg-acoes').style.display = 'block'; // Abre o primeiro conteúdo por padrão
    }
};

window.mostrarPagina = function(pgId) {
    const paginas = document.querySelectorAll('.pagina-artigo');
    paginas.forEach(p => p.style.display = 'none');
    
    const target = document.getElementById(pgId);
    if (target) {
        target.style.display = 'block';
    }
};

// --- CÁLCULO DO SIMULADOR ---
window.calcular = function() {
    const valorInicial = parseFloat(document.getElementById("valorInicial").value) || 0;
    const aporteMensal = parseFloat(document.getElementById("aporteMensal").value) || 0;
    const taxaInput = parseFloat(document.getElementById("taxa").value) || 0;
    const taxaMensal = taxaInput / 100;
    const tempoMeses = parseInt(document.getElementById("tempo").value) || 0;
    const taxaComp = parseFloat(document.getElementById("comparador").value);
    const nomeComp = document.getElementById("comparador").options[document.getElementById("comparador").selectedIndex].text;

    if (tempoMeses <= 0) {
        alert("Por favor, insira um tempo válido.");
        return;
    }

    let montante = valorInicial;
    let montanteComp = valorInicial;
    let totalInvestido = valorInicial;
    
    let valoresRibas = [valorInicial];
    let valoresComp = [valorInicial];
    let labelsMeses = ["Início"];
    
    let linhasTabela = ""; // Usar string para performance
    const formatarBR = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    for (let i = 1; i <= tempoMeses; i++) {
        let jurosMes = montante * taxaMensal;
        montante = montante + jurosMes + aporteMensal;
        montanteComp = montanteComp * (1 + taxaComp) + aporteMensal;
        totalInvestido += aporteMensal;

        labelsMeses.push(`Mês ${i}`);
        valoresRibas.push(parseFloat(montante.toFixed(2)));
        valoresComp.push(parseFloat(montanteComp.toFixed(2)));

        if (i <= 360) { // Limite de 30 anos na tabela para não travar
            linhasTabela += `
                <tr>
                    <td>${i}</td>
                    <td>${formatarBR(totalInvestido)}</td>
                    <td>${formatarBR(jurosMes)}</td>
                    <td>${formatarBR(montante)}</td>
                </tr>
            `;
        }
    }

    document.getElementById("corpo-tabela").innerHTML = linhasTabela;

    const lucroExtra = montante - montanteComp;
    const rendaPassiva = montante * taxaMensal;
    const linkWhats = `https://wa.me/5511999999999?text=Simulação Ribas: Total de ${formatarBR(montante)}`;

    document.getElementById("cards-resumo").innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><span>TOTAL ACUMULADO</span><strong style="color: #00b386;">${formatarBR(montante)}</strong></div>
            <div class="stat-card"><span>RENDA ESTIMADA</span><strong style="color: #007bff;">${formatarBR(rendaPassiva)}/mês</strong></div>
            <div class="stat-card"><span>GANHO VS ${nomeComp.toUpperCase()}</span><strong style="color: #f59e0b;">${formatarBR(lucroExtra)}</strong></div>
        </div>
        <div style="margin: 20px 0;">
            <a href="${linkWhats}" target="_blank" class="btn-whatsapp">Consultar Especialista</a>
        </div>
    `;

    document.getElementById("tabela-evolucao-container").style.display = "block";
    document.getElementById("btn-exportar-pdf").style.display = "inline-block";
    
    renderizarGrafico(labelsMeses, valoresRibas, valoresComp, nomeComp);
};

// --- META REVERSA ---
window.calcularMetaReversa = function() {
    const objetivo = parseFloat(document.getElementById("objetivoFinal").value);
    const meses = parseInt(document.getElementById("tempoMeta").value);
    const taxa = (parseFloat(document.getElementById("taxaMeta").value) / 100);

    if (!objetivo || !meses || !taxa) {
        alert("Preencha todos os campos da meta.");
        return;
    }

    const aporteNecessario = (objetivo * taxa) / (Math.pow(1 + taxa, meses) - 1);

    document.getElementById("resultado-meta").innerHTML = `
        <p>Aporte Mensal Necessário: <br>
        <span style="font-size: 1.8rem;">${aporteNecessario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
    `;
};

window.limpar = function() { 
    if(confirm("Deseja limpar todos os dados da simulação?")) {
        location.reload(); 
    }
};