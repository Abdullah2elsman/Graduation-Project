// ===================== URL Parameters =====================
const urlParams = new URLSearchParams(window.location.search);
const encodedExamId = urlParams.get('exam_id'); 
const encodedCourseId = urlParams.get('course_id'); 
const examId = atob(encodedExamId); 
const courseId = atob(encodedCourseId); 
const instructorId = JSON.parse(localStorage.getItem('userData')).user.id;
console.log(courseId)

// ===================== Global Variables =====================
let totalScore = 0; // this to check the total score of the quiz == sum of all questions scores after edit
let deletedQuestionIds = []; // Store deleted question IDs here to send it to back end
let deletedOptionIds = [];

// ===================== DOM References =====================
const elements = {
    // Buttons
    backBtn: document.querySelector(".back-btn"),
    editBtn: document.querySelector('.edit-btn'),
    viewBtn: document.querySelector('.view-btn'),
    addQuestionBtn: document.querySelector('.add-question-btn'),
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
        `${API_BASE_URL}/instructor/course/${courseId}/exams/get-exam-questions?exam_id=${examId}`,
        `${API_BASE_URL}/instructor/exam/exam-grades-distribution?exam_id=${examId}`,
    ];

    try {
        const [getQuiz, gradesDistribution] = await Promise.all(
            endpoints.map(url =>
                fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(handleResponse)
            )
        );
        updateQuizName(getQuiz.data.name);
        renderQuestions(getQuiz.data.questions);
        totalScore = getQuiz.data.total_score;
        setupChart(gradesDistribution.distribution, gradesDistribution.available);
    } catch (error) {
        handleError(error);
    }
}

async function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Failed to get data from server');
    }
    return await response.json();
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
                    <div class="question" id="${question.id}">
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
                                <div class="option-row">
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
                                    <button class="delete-option-btn" id=${opt.id} style="color: #D32F2F;border-color: #D32F2F; display: none"><img src="../imgs/delete logo.svg" alt=""></button>
                                </div>
                                `).join('')}
                                </div>
                                <button class="add-option-btn">Add Option</button>
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

        // const firstQuestion = document.querySelector('.question-edit .editBtn');
        // if (firstQuestion) {
        //     firstQuestion.click();
        // } else {
        //     deactivateEditMode(elements);
        //     editFlag = false;
        // }
    });
    elements.questionsSection.addEventListener('click', function(event) {
        const btn = event.target.closest('button');
        if (!btn) return;

        const questionId = btn.id; // This is the unique question ID
        
        if (btn.classList.contains('editBtn')) {
            editQuestion(questionId);
        } else if (btn.classList.contains('deleteBtn')) {
            deleteQuestion(questionId, btn);
        } else if (btn.classList.contains('delete-option-btn')) {
            deleteOption(btn);
        }else if (btn.classList.contains('add-option-btn')) {
            addOption(btn);
        }
    });

    elements.addQuestionBtn.addEventListener('click', function() {
        addQuestion();
    });

    elements.submitBtn.addEventListener('click', function(e) {
        confirm('Are you sure you want to update question?');
        submitAllQuestions(e);
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
    showElements('.add-question-btn', 'block');
    hideElements('.question-status');
    elements.submitBtn.style.display = 'block';
}

function deactivateEditMode(elements) {
    elements.editBtn.style.backgroundColor = '#fff';
    hideElements('.edit-question');
    hideElements('.submit-all-edit-btn');
    hideElements('.add-question-btn');
}


function editQuestion(questionId) {
    // Find the question-wrapper for this question

    const questionWrapper = document.querySelector(`button.editBtn[id="${questionId}"]`)?.closest('.question-wrapper');
    if (!questionWrapper) {
        console.warn(`Question wrapper for ID ${questionId} not found.`);
        return;
    }
    
        // Show all elements in this question
        const checkboxes = questionWrapper.querySelectorAll('.circle-checkbox');
        const deleteOptionButtons = questionWrapper.querySelectorAll('.delete-option-btn');
        const addOptionButton = questionWrapper.querySelector('.add-option-btn');

        checkboxes.forEach(cb => {
            cb.style.display = (cb.style.display) == 'block'? 'none' : 'block';
        });

        deleteOptionButtons.forEach(btn => {
            btn.style.display = (btn.style.display) == 'block'? 'none' : 'block';
        });

        addOptionButton.style.display = (addOptionButton.style.display) == 'block'? 'none' : 'block';
        

        // Make the main question input editable
        const questionInput = questionWrapper.querySelector('.question-content > .question > input[type="text"]');
        
        if (questionInput.hasAttribute('readonly')) {
            questionInput.removeAttribute('readonly');
            questionInput.focus();
        } else {
            questionInput.setAttribute('readonly', true);
        }
        
        // Make all option text inputs editable
        const optionInputs = questionWrapper.querySelectorAll('.options input[type="text"]');
        optionInputs.forEach(input => {
            if (input.hasAttribute('readonly')) {
            input.removeAttribute('readonly');
            input.focus();
            } else {
                input.setAttribute('readonly', true);
            }
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


function deleteQuestion(questionId ,btn) {
    // Remove the question from the DOM as before
    
    if (Number(questionId) === 0) {
        btn.closest('.question-wrapper').remove();
    }
    const questionWrapper = document.querySelector(`button.deleteBtn[id="${questionId}"]`)?.closest('.question-wrapper');
    if (questionWrapper) {
        questionWrapper.remove();
    }
    // Add the ID to the deleted IDs array
    deletedQuestionIds.push(Number(questionId));
}

function deleteOption(button) {
    const optionRow = button.closest('.option-row');
    if (!optionRow) return;
    
    const optionId = button.getAttribute('id');
    if (optionId) {
        deletedOptionIds.push(Number(optionId));
    }

    optionRow.remove();
}


function addOption(button) {
    const questionDiv = button.closest('.question');
    const optionsContainer = questionDiv.querySelector('.options');

    // Check current number of option rows
    const currentOptionCount = optionsContainer.querySelectorAll('.option-row').length;

    if (currentOptionCount >= 7) {
        alert('You can only add up to 7 options per question.');
        return;
    }

    const optionHTML = `
        <div class="option-row">
            <label class="circle-checkbox" style="margin-right: 6px; display:block;">
            <input 
                type="checkbox" 
                class="correct-checkbox" 
            >
            <span class="custom-circle"></span>
            </label>
            
            <input 
                type="text"
                placeholder="Add Option"
                style="flex: 1;"
                class="new-option"
            >
            
            <button class="delete-option-btn" style="color: #D32F2F;border-color: #D32F2F;">
                <img src="../imgs/delete logo.svg" alt="">
            </button>
        </div>
    `;

    optionsContainer.insertAdjacentHTML('beforeend', optionHTML);

    const newRow = optionsContainer.lastElementChild;
    const checkbox = newRow.querySelector('.correct-checkbox');
    const input = newRow.querySelector('input[type="text"]');

    // Attach the event listener to the newly added checkbox
    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            input.classList.remove('incorrect-option');
            input.classList.add('correct-option');
        } else {
            input.classList.remove('correct-option');
            input.classList.add('incorrect-option');
        }
    });
}

function addQuestion(){
    const questionHTML = `
    <div class="question-wrapper editing">
        <div class="question-card">
            <div class="question-row">
                <div class="question-content">
                    <div class="question new-question">
                        <div class="question-header">
                            <div class="question-number">New Question</div>
                            <div class="edit-question" style="display: flex;">
                                <p>Question Score</p>
                                <select name="score">
                                    ${[1, 2, 3, 4, 5].map(val => `<option value="${val}">${val}</option>`).join('')}
                                </select>
                                <button class="editBtn" 
                                        style="color: #28a745; border-color: #28A745; width: 70px;" 
                                        id= "">
                                        <img src="../imgs/edit logo.svg" alt="">Edit
                                </button>
                                <button class="deleteBtn manualDeleteBtn" style="color: #D32F2F; border-color: #D32F2F; width: 90px;">
                                    <img src="../imgs/delete logo.svg" alt="">Delete
                                </button>
                            </div>
                        </div>
                        <input type="text" placeholder="Add Question..............................?" value="" style="margin-bottom: 35px;">
                        <div class="options">
                        
                        </div>
                        <button class="add-option-btn" style="display: block">Add Option</button>
                        <div class="correct-answer">The Correct Answer is: <strong>Not set</strong></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    elements.questionsSection.insertAdjacentHTML('beforeend', questionHTML);
    
}

function submitAllQuestions(e) {
    const questionWrappers = document.querySelectorAll('.question-wrapper');
    const updatedQuestions = [];
    const newQuestions = [];

    // deletedQuestionIds, deletedOptionIds

    questionWrappers.forEach(wrapper => {
        // Get question main div
        const questionDiv = wrapper.querySelector('.question');
        const questionId = questionDiv.id || null;

        // Get question text
        const questionInput = questionDiv.querySelector('input[type="text"]');
        const questionText = questionInput ? questionInput.value : '';

        // Get question score
        const scoreSelect = questionDiv.querySelector('select[name="score"]');
        const scoreValue = scoreSelect ? Number(scoreSelect.value) : 1;

        // Get options
        const optionRows = questionDiv.querySelectorAll('.option-row');
        const options = Array.from(optionRows).map(row => {
            const input = row.querySelector('input[type="text"]');
            const checkbox = row.querySelector('input[type="checkbox"]');
            // لو عندك id للاختيار (قديم)، هاته
            const optionId = row.querySelector('.delete-option-btn')?.id || null;
            return {
                id: optionId, // ممكن يكون null لو جديد
                option: input.value,
                is_correct: checkbox && checkbox.checked ? 1 : 0
            };
        });

        if (questionId) {
            updatedQuestions.push({
                id: questionId,
                question: questionText,
                score: scoreValue,
                options: options
            });
        } else {
            newQuestions.push({
                question: questionText,
                score: scoreValue,
                exam_id: Number(examId),
                options: options
            });
        }
    });

    const sumScores =
        updatedQuestions.reduce((sum, q) => sum + q.score, 0) +
        newQuestions.reduce((sum, q) => sum + q.score, 0);

    if (sumScores !== totalScore) {
        alert(`Total of all question scores (${sumScores}) must equal quiz total score (${totalScore})!`);
        return;
    }

    const filteredDeletedIds = deletedQuestionIds.filter(id => id !== null && id !== undefined && id !== "" && id !== 0);
    
    const requestBody = {
        updated_questions: updatedQuestions, 
        new_questions: newQuestions,
        deleted_question_ids: filteredDeletedIds,
        deleted_option_ids: deletedOptionIds
    };

    // Debug
    console.log("Request Body:", requestBody);

    deactivateEditMode(elements);
    deactivateViewMode(elements);

    fetchSubmitCode(`${API_BASE_URL}/instructor/exam/update-questions`, requestBody)
}

async function validateSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) return false; // Not authenticated        
        const data = await response.json();
        if( data.user.role !== 'instructor') {
            return false;
        }
        return response.ok;    
    } catch (error) {
        
        return false;
    }
}

async function fetchSubmitCode(url, requestBody) {
    await getCsrfCookie();

    const isAuthenticated = await validateSession();
    if (!isAuthenticated) return redirectToLogin();

    const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));

    fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken
        },
        body: JSON.stringify(requestBody)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Refresh the page after successful submission
            window.location.reload();
        } else {
            console.error('API Error:', data);
            alert(data && data.message ? data.message : 'Something went wrong!');
        }
    })
    .catch(err => {
        console.error('Network or fetch error:', err);
        alert('Network error!');
    });
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

