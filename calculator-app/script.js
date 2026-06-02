document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const inputVin = document.getElementById('vin');
    const inputVout = document.getElementById('vout');
    const inputPout = document.getElementById('pout');
    const inputPhases = document.getElementById('phases');
    const inputRipple = document.getElementById('ripple');
    const inputL = document.getElementById('inductance');
    const inputIsat = document.getElementById('isat');

    // Static Outputs
    const resDuty = document.getElementById('res-duty');
    const resIphase = document.getElementById('res-iphase');
    const resRippleAmps = document.getElementById('res-ripple-amps');
    const resFsw = document.getElementById('res-fsw');
    const resIpeak = document.getElementById('res-ipeak');
    const satWarning = document.getElementById('sat-warning');

    // Link sliders to number inputs
    const pairs = [
        { num: inputVin, slider: document.getElementById('vin-slider') },
        { num: inputVout, slider: document.getElementById('vout-slider') },
        { num: inputPout, slider: document.getElementById('pout-slider') },
        { num: inputPhases, slider: document.getElementById('phases-slider') },
        { num: inputRipple, slider: document.getElementById('ripple-slider') },
        { num: inputL, slider: document.getElementById('inductance-slider') },
        { num: inputIsat, slider: document.getElementById('isat-slider') }
    ];

    // Initialize Chart
    const ctx = document.getElementById('tradeoffChart').getContext('2d');
    Chart.defaults.color = '#8b92a5';
    Chart.defaults.font.family = 'Inter';
    
    const tradeoffChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Operating Fsw (Vin)',
                    data: [], // [{x, y}]
                    borderColor: '#00e5ff',
                    backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#00e5ff',
                    showLine: true,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Hidden Best-Case (Unused)',
                    data: [], 
                    showLine: false
                },
                {
                    label: 'Selected Operating Point',
                    data: [], // [{x, y}]
                    backgroundColor: '#ff3366',
                    borderColor: '#fff',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#8b92a5' }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 29, 36, 0.9)',
                    titleColor: '#00e5ff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: L=${context.parsed.x}µH, Fsw=${context.parsed.y}kHz`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Phase Inductance (µH)',
                        color: '#8b92a5'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Switching Frequency (kHz)',
                        color: '#8b92a5'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    suggestedMax: 300,
                    suggestedMin: 0
                }
            }
        }
    });

    function calculate() {
        // Parse inputs
        const vin = parseFloat(inputVin.value) || 0;
        const vout = parseFloat(inputVout.value) || 0;
        const pout = parseFloat(inputPout.value) || 0;
        const phases = parseFloat(inputPhases.value) || 1;
        const targetRipplePct = parseFloat(inputRipple.value) || 1;
        const L_selected = parseFloat(inputL.value) || 1;
        const isat = parseFloat(inputIsat.value) || 1;

        // Base checks
        if (vin <= 0 || vout <= 0 || phases <= 0 || targetRipplePct <= 0 || L_selected <= 0) return;
        if (vout > vin) {
            resDuty.textContent = "Error: Invalid Vin";
            return;
        }

        // 1. Static Calculations
        const duty = vout / vin;
        
        const iout = pout / vout;
        const iphase = iout / phases;
        const targetRippleAmps = iphase * (targetRipplePct / 100);
        
        // Calculate operating point Fsw
        const opFsw = ((vin - vout) * duty) / (targetRippleAmps * L_selected * 1e-3);
        const ipeak = iphase + (targetRippleAmps / 2);

        // Update Static DOM
        resDuty.textContent = `${(duty*100).toFixed(1)}%`;
        resIphase.textContent = `${iphase.toFixed(2)} A`;
        resRippleAmps.textContent = `${targetRippleAmps.toFixed(2)} A`;
        resFsw.textContent = `${opFsw.toFixed(1)} kHz`;
        resIpeak.textContent = `${ipeak.toFixed(2)} A`;

        if (ipeak > isat) {
            resIpeak.style.color = 'var(--alert)';
            satWarning.style.display = 'block';
        } else {
            resIpeak.style.color = 'var(--text-main)';
            satWarning.style.display = 'none';
        }

        // Update Chart Color based on Saturation
        if (ipeak > isat) {
            tradeoffChart.data.datasets[0].borderColor = '#ff3366'; // Alert Red
            tradeoffChart.data.datasets[0].backgroundColor = 'rgba(255, 51, 102, 0.1)';
            tradeoffChart.data.datasets[2].backgroundColor = '#ff3366'; 
        } else {
            tradeoffChart.data.datasets[0].borderColor = '#00e5ff'; // Cyan
            tradeoffChart.data.datasets[0].backgroundColor = 'rgba(0, 229, 255, 0.1)';
            tradeoffChart.data.datasets[2].backgroundColor = '#00e5ff'; 
        }

        // 2. Generate Graph Data (L vs Fsw)
        const curveData = [];

        // Sweep L from 10 µH to 330 µH
        for (let L = 10; L <= 330; L += 5) {
            const fsw_kHz = ((vin - vout) * duty) / (targetRippleAmps * L * 1e-3);
            const cappedFsw = fsw_kHz > 1000 ? null : Math.round(fsw_kHz);
            if (cappedFsw !== null) curveData.push({x: L, y: cappedFsw});
        }

        // Update Chart
        tradeoffChart.data.datasets[0].data = curveData;
        tradeoffChart.data.datasets[1].data = [];
        tradeoffChart.data.datasets[2].data = [{x: L_selected, y: Math.round(opFsw)}];
        tradeoffChart.update();
    }

    // Attach event listeners
    pairs.forEach(pair => {
        pair.slider.addEventListener('input', (e) => {
            pair.num.value = e.target.value;
            calculate();
        });
        pair.num.addEventListener('input', (e) => {
            pair.slider.value = e.target.value;
            calculate();
        });
    });

    // Initial calculation
    calculate();
});
