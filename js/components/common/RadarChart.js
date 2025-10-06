// Composant graphique radar pour Qualiopi
function RadarChart({ themes }) {
    const { useRef, useEffect } = React;
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !themes) return;

        // Préparer les données
        const themeKeys = Object.keys(themes);
        const labels = themeKeys.map(key => {
            // Extraire le numéro du point (theme_1 -> 1, theme_12 -> 12)
            const pointNumber = key.replace('theme_', '');
            const titre = themes[key].titre || key;
            const labelWithNumber = `${pointNumber} - ${titre}`;
            // Raccourcir les labels trop longs
            return labelWithNumber.length > 35 ? labelWithNumber.substring(0, 35) + '...' : labelWithNumber;
        });
        const dataAvant = themeKeys.map(key => themes[key].avant || 0);
        const dataApres = themeKeys.map(key => themes[key].apres || 0);

        // Détruire le graphique existant s'il existe
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        // Créer le nouveau graphique
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'À l\'entrée en formation',
                        data: dataAvant,
                        borderColor: 'rgb(236, 72, 153)', // Rose
                        backgroundColor: 'rgba(236, 72, 153, 0.2)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgb(236, 72, 153)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(236, 72, 153)'
                    },
                    {
                        label: 'À la sortie de formation',
                        data: dataApres,
                        borderColor: 'rgb(59, 130, 246)', // Bleu
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(59, 130, 246)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value;
                            }
                        },
                        pointLabels: {
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.r + '/5';
                            }
                        }
                    }
                }
            }
        });

        // Cleanup lors du démontage
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [themes]);

    return React.createElement('div', {
        className: "bg-white rounded-lg border border-gray-200 p-6 mb-4"
    }, React.createElement('canvas', {
        ref: canvasRef,
        style: { maxHeight: '400px' }
    }));
}

// Export global
window.RadarChart = RadarChart;
