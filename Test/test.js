// Interaction Chart
const ctx1 = document.getElementById('interactionChart').getContext('2d');
new Chart(ctx1, {
    type: 'line',
    data: {
        labels: Array.from({ length: 30 }, (_, i) => i + 1),
        datasets: [{
            label: 'Interaction',
            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100)),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 2,
            fill: true
        }]
    },
    options: { responsive: true }
});

// Grades Chart
const ctx2 = document.getElementById('gradesChart').getContext('2d');
new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: ['Math0', 'Math1', 'Math2', 'Math3'],
        datasets: [{
            label: 'Grades',
            data: [8, 7, 9, 6],
            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4caf50']
        }]
    },
    options: { responsive: true }
});
function createProgressChart(canvasId, percentage) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: ['rgba(44, 109, 164, 1)', '#e5e7eb'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: { display: false }
            }
        }
    });
}

createProgressChart('chart0', 25);
createProgressChart('chart1', 50);
createProgressChart('chart2', 75);
createProgressChart('chart3', 100);