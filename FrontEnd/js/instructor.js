// const instructorId = userData.user.id;
function createCourseCard(course){
  // Create main course card div
    let card = document.createElement("div");
    card.classList.add("course-card");

    // Progress container
    let progressContainer = document.createElement("div");
    progressContainer.classList.add("progress-container");

    let canvas = document.createElement("canvas");
    canvas.classList.add("progress-chart");
    canvas.id = "chart" + course.id;

    let progressText = document.createElement("div");
    progressText.classList.add("progress-text");
    progressText.id = "text" + course.id;

    progressContainer.appendChild(canvas);
    progressContainer.appendChild(progressText);

    // Course title
    let title = document.createElement("div");
    title.classList.add("course-title");
    title.textContent = course.title;

    // Quiz info
    let completedQuizzes = document.createElement("div");
    completedQuizzes.classList.add("quiz-info");
    completedQuizzes.textContent = "Completed Quizzes: " + course.completed_exams;

    let remainingQuizzes = document.createElement("div");
    remainingQuizzes.classList.add("quiz-info");
    remainingQuizzes.textContent = "Remaining Quizzes: " + (course.number_of_exams - course.completed_exams);

    // Create quiz button
    let button = document.createElement("button");
    button.classList.add("quiz-button");
    button.textContent = "+ Create New Quiz";
    
    // Append elements to the card
    card.appendChild(progressContainer);
    card.appendChild(title);
    card.appendChild(completedQuizzes);
    card.appendChild(remainingQuizzes);
    card.appendChild(button);

    // Append the card to a container in the HTML
    document.querySelector(".cards-wrapper").appendChild(card);
}

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

document.addEventListener('DOMContentLoaded',async function() {
  await checkUserLogin();
  await loadCourses();
});

// Load course
async function loadCourses(){
  const storedUserData = localStorage.getItem('userData');
  const userData = JSON.parse(storedUserData);
    try {
        // Fetch data from API
        const userId = userData.user.id;
        let response = await fetch(`${url}/instructor/${userId}/courses`);
        let courses = await response.json();
        console.log(courses);
        courses.forEach(course => createCourseCard(course));
        courses.forEach(course => createProgressChart('chart' + course.id, Math.floor((course.completed_exams/course.number_of_exams)*100)));


    } catch (error) {
        console.error("Error fetching courses:", error);
    }
}

// Move Course cards right and left
const moveRight = document.querySelector('.move-right');
const moveLeft = document.querySelector('.move-left');
const courses = document.querySelector('.cards-wrapper');
moveRight.addEventListener('click', () => {
  courses.scrollBy(300, 0);
});

moveLeft.addEventListener('click', () => {
  courses.scrollBy(-300, 0);
});

const labelsLine = Array.from({ length: 30 }, (_, i) => i + 1);
const dataValues = [20, 25, 40, 55, 45, 50, 35, 42, 38, 64, 42, 47, 43, 46, 50, 55, 20, 60, 35, 55, 40, 52, 49, 48, 50, 45, 47, 49, 52, 55];

// Line Chart
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
          borderRadius: { topLeft: 4, topRight: 4 },
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



