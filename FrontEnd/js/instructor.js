// Course Progress Chart
function createProgressChart(canvasId, percentage) {
          const canvas = document.getElementById(canvasId);
          const ctx = canvas.getContext('2d');

          // Scale canvas for high-resolution screens
          const dpr = window.devicePixelRatio || 1;
          canvas.width = canvas.clientWidth * dpr;
          canvas.height = canvas.clientHeight * dpr;
          ctx.scale(dpr, dpr);

          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Completed', 'Remaining'],
              datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: ['#0077b6', '#e8eff5'],
                borderWidth: 0,
                borderRadius: percentage === 100 ? 0 : 3
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false, // Ensures scaling maintains the correct aspect ratio
              cutout: '74%',
              plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
              }
            }
          });

          document.getElementById(`text${canvasId.replace('chart', '')}`).innerHTML = `${percentage}%<span>Completed</span>`;
        }

        
// Example Calls
createProgressChart('chart0', 20);
createProgressChart('chart1', 30);
createProgressChart('chart2', 45);
createProgressChart('chart3', 50);
createProgressChart('chart4', 80);
createProgressChart('chart5', 100);


// Line Chart
  const labelsLine = Array.from({ length: 30 }, (_, i) => i + 1);
  const dataValues = [20, 25, 40, 55, 45, 50, 35, 42, 38, 64, 42, 47, 43, 46, 50, 55, 20, 60, 35, 55, 40, 52, 49, 48, 50, 45, 47, 49, 52, 55];

function createMonthlyProgressChart(labels, dataValues) {
  const ctxLine = document.getElementById('MonthlyProgressChart').getContext('2d');

  new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        borderColor: '#2c6da4',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        borderWidth: 1,
        pointRadius: 3,
        pointBackgroundColor: '#2c6da4', // **Fill the circles**
        pointBorderWidth: 1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false }, // **Removes Vertical Grid Lines**
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: function (value) { return value + '%'; }
          },
          drawBorder: false, // **Removes the border of the x-axis**
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Average Student Interaction',
          align: 'start',
          font: {
            size: 24,
            weight: '700'
          },
          color: '#333'
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.raw + "%";
            }
          }
        }
      }
    }
  });
}

createMonthlyProgressChart(labelsLine, dataValues);

// Bar Chart
const data = [
  { label: "quiz1.Math0", achieved: 8, remaining: 2 },
  { label: "quiz1.Math1", achieved: 7, remaining: 3 },
  { label: "quiz1.Math2", achieved: 9, remaining: 1 },
  { label: "quiz1.Math3", achieved: 6, remaining: 4 }
];

function createAverageGradesChart(data) {
const ctxBar = document.getElementById('averageGrades').getContext('2d');
  const labelsBar = data.map(item => item.label);
  const achievedData = data.map(item => item.achieved);
  const remainingData = data.map(item => item.remaining);

  new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: labelsBar,
      datasets: [
        {
          label: "Achieved",
          data: achievedData,
          backgroundColor: "#2c6da4",
          borderRadius: { topLeft: 4, topRight: 4 }, // إضافة الحواف العلوية
          stack: "Stack 0",
          barThickness: 25

        },
        {
          label: "Remaining",
          data: remainingData,
          backgroundColor: "#e8eff5",
          borderRadius: 4,
          stack: "Stack 0",
          barThickness: 25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false }
        },
        y: {
          stacked: true,
          grid: { display: false },
          beginAtZero: true, max: 10
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Average Students Grades',
          align: 'start',
          font: {
            size: 24,
            weight: '700'
          },
          color: '#333'
        },
        legend: { display: false }
      }
    }
  });
}

createAverageGradesChart(data);

  // Calendar
  const monthText = document.getElementById("month");
        const yearText = document.getElementById("year");
        const daysContainer = document.querySelector(".calendar-days");
        let date = new Date();
        let currentMonth = date.getMonth();
        let currentYear = date.getFullYear();
        let selectedDay = null;
        let today = date.getDate();

        function renderCalendar(month, year) {
          daysContainer.innerHTML = "";
          monthText.innerHTML = new Date(year, month).toLocaleString('en-US', { month: 'long' });
          yearText.innerHTML = year;
          let firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
          let daysInMonth = new Date(year, month + 1, 0).getDate();
          let prevMonthDays = new Date(year, month, 0).getDate();

          for (let i = firstDay - 1; i >= 0; i--) {
            let prevDayDiv = document.createElement("div");
            prevDayDiv.textContent = prevMonthDays - i;
            prevDayDiv.classList.add("prev-month");
            daysContainer.appendChild(prevDayDiv);
          }

          for (let day = 1; day <= daysInMonth; day++) {
            let dayDiv = document.createElement("div");
            dayDiv.textContent = day;
            if (day === today && month === date.getMonth() && year === date.getFullYear()) {
              dayDiv.classList.add("selected");
              selectedDay = dayDiv;
            }
            dayDiv.addEventListener("click", function () {
              if (selectedDay) {
                selectedDay.classList.remove("selected");
              }
              dayDiv.classList.add("selected");
              selectedDay = dayDiv;
            });
            daysContainer.appendChild(dayDiv);
          }
        }

        function prevMonth() {
          currentMonth--;
          if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
          }
          renderCalendar(currentMonth, currentYear);
        }

        function nextMonth() {
          currentMonth++;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
          }
          renderCalendar(currentMonth, currentYear);
        }

        renderCalendar(currentMonth, currentYear);