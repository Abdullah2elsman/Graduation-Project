// ===================== URL Parameters =====================
const urlParams = new URLSearchParams(window.location.search);
const encodedExamId = urlParams.get('exam_id'); 
const encodedCourseId = urlParams.get('course_id'); 
const examId = atob(encodedExamId); 
const courseId = atob(encodedCourseId); 
const instructorId = 201;

// ===================== Global Variables =====================
const API_BASE_URL = 'http://localhost:8005/api';
let totalScore = 0; // this to check the total score of the quiz == sum of all questions scores after edit
let deletedQuestionIds = []; // Store deleted question IDs here to send it to back end



// ===================== DOM References =====================
const elements = {
    // Buttons
    backBtn: document.querySelector(".back-btn"),
    editBtn: document.querySelector('.edit-btn'),
    viewBtn: document.querySelector('.view-btn'),
    submitBtn: document.querySelector('.submit-all-edit-btn'),

    // Sections
    quizName: document.querySelector(".quiz-header h1"),
    questionsSection: document.querySelector('.questions-section'),

    // Chart
    chartSection: document.getElementById('gradesChart'),
};


function initializeApp() {
    fetchReports();
    setupEventListeners();
}

// ===================== Core Functions =====================
async function fetchReports() {
    const endpoints = [
    `${API_BASE_URL}/instructor/course/${courseId}/exams/getExamQuestions?exam_id=${examId}`,
    `${API_BASE_URL}/exam/examGradesDistribution?exam_id=${examId}`,
    ];

    try {
        const [getQuiz, gradesDistribution] = await Promise.all(
            endpoints.map(url => fetch(url).then(handleResponse))
        );

        updateQuizName(getQuiz.data.name);
        renderQuestions(getQuiz.data.questions);
        totalScore = getQuiz.data.total_score;
        setupChart(gradesDistribution.distribution, gradesDistribution.available);

    } catch (error) {
        handleError(error);
    }

}

function updateQuizName(quizName) {
    elements.quizName.textContent = quizName;
}
function renderQuestions(questions) {
    elements.questionsSection.innerHTML = '';
    if (questions.length === 0) {
        elements.questionsSection.innerHTML = '<p class="no-questions" style="margin: auto; color:#666;">No questions available</p>';
        return;
    }
    questions.forEach((question, index) => {
        // Generate HTML for each question
        const questionHTML = `
        <div class="question-wrapper">
            <div class="question-card">
                <div class="question-row">
                    <div class="question-status">
                    <h3>Question ${index + 1}</h3>
                    <p style="color: #28A745;">correct</p>
                    <p>Mark ${(question.score).toFixed(2)} out of ${(question.score).toFixed(2)}</p>
                    </div>
                    <div class="question-content">
                    <div class="question">
                        <div class="question-header">
                            <div class="question-number">Question ${index + 1}</div>
                                <div class="edit-question">
                                    <p>Question Score</p>
                                    <select name="score">
                                        ${[1,2,3,4,5].map(val => `
                                            <option value="${val}"${val === question.score ? ' selected' : ''}>${val}</option>
                                            `).join('')}
                                    </select>
                                    <button class="editBtn" 
                                        style="color: #28a745; border-color: #28A745; width: 70px;" 
                                        id= "${question.id}">
                                        <img src="../imgs/edit logo.svg" alt="">Edit
                                    </button>

                                    <button class="deleteBtn manualDeleteBtn"
                                        style="color: #D32F2F; border-color: #D32F2F; width: 90px;"
                                        id = "${question.id}">
                                        <img src="../imgs/delete logo.svg" alt="">Delete
                                    </button>
                                </div>
                            </div>
                            <input type="text" placeholder="Add Question..............................?" value="${question.question}" readonly style = "margin-bottom: 35px;">
                            <div class="options">
                                ${question.options.map((opt, optIdx) => `
                                <div class="option-row" style="display: flex; align-items: center; gap: 8px;">
                                    <label class="circle-checkbox" style="margin-right: 6px;">
                                    <input 
                                        type="checkbox" 
                                        class="correct-checkbox" 
                                        ${opt.is_correct ? 'checked' : ''} 
                                        data-option-index="${optIdx}"
                                        disabled
                                    >
                                    <span class="custom-circle"></span>
                                    </label>

                                    <input 
                                        type="text" 
                                        value="${opt.option}" 
                                        class="${opt.is_correct ? "correct-option" : "incorrect-option"}" 
                                        readonly
                                        style="flex: 1;"
                                    >
                                </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="correct-answer">
                            The Correct Answer is:
                            <strong>
                            ${ (() => {
                                    const correctOptions = question.options
                                    .filter(opt => opt.is_correct == 1 || opt.is_correct === true || opt.is_correct === "1" || opt.is_correct === "true")
                                    .map(opt => opt.option);

                                    if (correctOptions.length === 0) {
                                        return "No correct answer set";
                                    } else if (correctOptions.length > 1) {
                                        return correctOptions.slice(0, -1).join(', ') + ', ' + correctOptions.slice(-1);
                                    } else {
                                        return correctOptions[0];
                                    }
                                })()
                            }
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        `;
        
        elements.questionsSection.insertAdjacentHTML('beforeend', questionHTML);
    });
}


async function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Failed to get data from server');
    }
    return await response.json();
}


// ===================== Event Listeners =====================
function setupEventListeners() {
    elements.backBtn.addEventListener('click', () => {
        window.location.href = `QuizzesManagement.html?course_id=${btoa(courseId)}`;
    });
    
    let viewFlag = false;
    let editFlag = false;

    elements.viewBtn.addEventListener('click', () => {
        if (!viewFlag) {
            activateViewMode(elements);
            deactivateEditMode(elements);
            viewFlag = true;
            editFlag = false;
        } else {
            deactivateViewMode(elements);
            viewFlag = false;
        }
    });

    elements.editBtn.addEventListener('click', () => {
        if (!editFlag) {
            activateEditMode(elements);
            deactivateViewMode(elements);
            editFlag = true;
            viewFlag = false;
        } else {
            deactivateEditMode(elements);
            editFlag = false;
        }
    });

    elements.questionsSection.addEventListener('click', function(event) {
        const btn = event.target.closest('button');
        if (!btn) return;

        const questionId = btn.id; // This is the unique question ID

        if (btn.classList.contains('editBtn')) {
            editQuestion(questionId);
        } else if (btn.classList.contains('deleteBtn')) {
            deleteQuestion(questionId);
        }
    });

    elements.submitBtn.addEventListener('click', function() {
        confirm('Are you sure you want to update question?');
        submitAllQuestions();
    });
}

// ===================== Helper Functions =====================
function showElements(selector, displayType = 'block') {
    document.querySelectorAll(selector).forEach(el => {
        el.style.display = displayType;
    });
}

function hideElements(selector) {
    document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
    });
}

function activateViewMode(elements) {
    elements.viewBtn.style.backgroundColor = '#E8EFF5';
    elements.editBtn.style.backgroundColor = '#fff';
    showElements('.question-status', 'block');
    hideElements('.edit-question');
}

function deactivateViewMode(elements) {
    elements.viewBtn.style.backgroundColor = '#fff';
    hideElements('.question-status');
}

function activateEditMode(elements) {
    elements.editBtn.style.backgroundColor = '#5BCB3A1A';
    elements.viewBtn.style.backgroundColor = '#fff';
    showElements('.edit-question', 'flex');
    hideElements('.question-status');
    elements.submitBtn.style.display = 'block';
}

function deactivateEditMode(elements) {
    elements.editBtn.style.backgroundColor = '#fff';
    hideElements('.edit-question');
}


function editQuestion(questionId) {
    // Find the question-wrapper for this question
    const questionWrapper = document.querySelector(`button.editBtn[id="${questionId}"]`)?.closest('.question-wrapper');
    if (!questionWrapper) {
        console.warn(`Question wrapper for ID ${questionId} not found.`);
        return;
    }

    // Show all circle-checkbox elements in this question
    const checkboxes = questionWrapper.querySelectorAll('.circle-checkbox');
    checkboxes.forEach(cb => {
        cb.style.display = 'inline-flex';
    });

    // Make the main question input editable
    const questionInput = questionWrapper.querySelector('.question-content > .question > input[type="text"]');
    if (questionInput) {
        questionInput.removeAttribute('readonly');
        questionInput.focus();
    }

    // Make all option text inputs editable
    const optionInputs = questionWrapper.querySelectorAll('.options input[type="text"]');
    optionInputs.forEach(input => {
        input.removeAttribute('readonly');
    });

    // Enable all checkboxes and add change event
    const optionRows = questionWrapper.querySelectorAll('.option-row');
    optionRows.forEach(row => {
        const checkbox = row.querySelector('.correct-checkbox');
        const input = row.querySelector('input[type="text"]');
        if (checkbox) {
            checkbox.disabled = false;
            // Remove any previous event to avoid duplicates
            checkbox.onchange = null;
            checkbox.addEventListener('change', function() {
                if (checkbox.checked) {
                    input.classList.remove('incorrect-option');
                    input.classList.add('correct-option');
                } else {
                    input.classList.remove('correct-option');
                    input.classList.add('incorrect-option');
                }
            });
        }
    });

    // Optionally, add an "editing" class for styling
    questionWrapper.classList.add('editing');

}


function deleteQuestion(questionId) {
    // Remove the question from the DOM as before
    const questionWrapper = document.querySelector(`button.deleteBtn[id="${questionId}"]`)?.closest('.question-wrapper');
    if (questionWrapper) {
        questionWrapper.remove();
    }
    // Add the ID to the deleted IDs array
    deletedQuestionIds.push(Number(questionId));
}

function submitAllQuestions() {
    // Collect all question wrappers
    const questionWrappers = document.querySelectorAll('.question-wrapper');
    const updatedQuestions = [];

    const requestBody = {
        questions: updatedQuestions,
        deleted_ids: deletedQuestionIds
    };

    questionWrappers.forEach(wrapper => {
        // Get question ID from the edit button
        const questionId = wrapper.querySelector('.editBtn')?.id;
        if (!questionId) return;

        // Get updated question text
        const questionInput = wrapper.querySelector('.question-content > .question > input[type="text"]');
        const questionText = questionInput ? questionInput.value : '';

        // Get updated score
        const scoreSelect = wrapper.querySelector('select[name="score"]');
        const scoreValue = scoreSelect ? Number(scoreSelect.value) : 1;

        // Get updated options with correct answers
        const optionRows = wrapper.querySelectorAll('.option-row');
        const options = Array.from(optionRows).map(row => {
            const input = row.querySelector('input[type="text"]');
            const checkbox = row.querySelector('input[type="checkbox"]');
            return {
                option: input.value,
                is_correct: checkbox && checkbox.checked ? 1 : 0
            };
        });

        updatedQuestions.push({
            id: questionId,
            question: questionText,
            score: scoreValue,
            options: options
        });
    });

    // Calculate the sum of all question scores
    const sumScores = updatedQuestions.reduce((sum, q) => sum + q.score, 0);

    // Check if the total matches the quiz total score
    if (sumScores !== totalScore) {
        alert(`Total of all question scores (${sumScores}) must equal quiz total score (${totalScore})!`);
        return; // Do not send the request
    }

    deactivateEditMode(elements);
    deactivateViewMode(elements);

    // Send to backend
    fetch(`${API_BASE_URL}/exam/updateQuestions`, {
        method: 'PUT', // or 'POST' depending on your backend
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update questions');
        return response.json();
    })
    .then( () => {
        alert('Questions updated successfully!');
        window.location.reload(); // <--- This will refresh the page
    })
    .catch(error => {
        console.error(error);
        alert('Error updating questions.');
    });

    console.log(JSON.stringify(requestBody, null, 2));

}



// ===================== Error Handling =====================
function handleError(error) {
    console.error('Application Error:', error);
    // Implement user-friendly error display
}

// ===================== Initialize App =====================
// ===================== Chart Setup =====================
function setupChart(distribution, available) {
    if (!Array.isArray(distribution) || distribution.length === 0 || available === false) {
        elements.chartSection.parentElement.innerHTML = `
            <div style="text-align:center; color:#888; font-size:1.5rem; font-weight:bold; padding:40px;">
                No grades data available for exam yet.
            </div>
        `;
        return;
    }

    const labels = distribution.map(item => item.degree);
    const dataPoints = distribution.map(item => item.count);

    if (window.gradesChartInstance) {
        window.gradesChartInstance.destroy();
    }

    window.gradesChartInstance = new Chart(elements.chartSection.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Students',
                data: dataPoints,
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#000', precision: 0 }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Grade'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Grade Distribution'
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);

