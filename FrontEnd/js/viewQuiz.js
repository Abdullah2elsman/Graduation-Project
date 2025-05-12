const ctx = document.getElementById('gradesChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [{
      label: 'Grades',
      data: [1, 1, 1, 2, 3, 6, 6, 5, 9, 7],
      backgroundColor: '#3b82f6'
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  }
});
