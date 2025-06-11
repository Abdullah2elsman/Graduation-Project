// ===================== DOM References =====================
const urlParams = new URLSearchParams(window.location.search);
const elements = {
    // Form elements
    quizName: document.getElementById("quiz-name"),
    instructions: document.getElementById("instructions"),
    quizDate: document.getElementById("quiz-date"),
    quizTime: document.getElementById("quiz-time"),
    totalScore: document.getElementById("total-score"),
    attempts: document.getElementById("attempts"),
    
    // Mode elements
    creationWithAiButton: document.querySelector(".creationWithAiButton"),
    manualCreationButton: document.querySelector(".manualCreationButton"),
    aiGeneratorContainer: document.querySelector(".aiGeneratorContainer"),
    generatedQuestionManually: document.querySelector(".generatedQuestionManually"),
    generatedQuestionsByAi: document.querySelector(".generatedQuestionsByAiContainer"),

    // Question containers
    aiQuestionsContainer: document.getElementById("aiQuestionsContainer"),
    manualQuestionsContainer: document.getElementById("manualQuestionsContainer"),

    // Buttons
    backBtn: document.querySelector(".backBtn"),
    publishBtnAI: document.querySelector('.publishBtn.AI'),
    publishBtnManual: document.querySelector('.publishBtn.Manual'),
    generateButton: document.getElementById("generateButton"),
    aiAddAnotherQuestion: document.getElementById("aiAddAnotherQuestion"),
    manualAddAnotherQuestion: document.getElementById("manualAddAnotherQuestion"),
    
    // Dropdowns
    dropdown: document.getElementById("numberDropdown"),

    // Query parameters
    courseId: atob(urlParams.get('course_id')) // Decode course_id
};

// ===================== Global State =====================
let currentMode = 'manual';
// let questionCounter = {ai: 1,manual: 1};

// ===================== Initial Setup =====================
function initializeApp() {
    elements.dropdown.value = "1";
    setupEventListeners();
    initializeInputValidation();
}

// ===================== Event Listeners Setup =====================
function setupEventListeners() {

    // Back button
    elements.backBtn.addEventListener("click", () => {
        elements.courseId = btoa(elements.courseId); // encode courseId
        window.location.href = `QuizzesManagement.html?course_id=${elements.courseId}`;
    });
    // Mode switching
    elements.creationWithAiButton.addEventListener("click", switchToAiMode);
    elements.manualCreationButton.addEventListener("click", switchToManualMode);

    // Question management
    elements.generateButton.addEventListener("click", handleGenerateQuestions);
    elements.aiAddAnotherQuestion.addEventListener("click", () => addQuestion('ai'));
    elements.manualAddAnotherQuestion.addEventListener("click", () => addQuestion('manual'));

    // Dynamic element handling
    document.addEventListener('click', handleDynamicActions);
    
    // Form submission
    elements.publishBtnAI.addEventListener("click", handleFormSubmission);
    elements.publishBtnManual.addEventListener("click", handleFormSubmission);

}

// ===================== Core Functions =====================
function switchToAiMode() {
    currentMode = 'ai';
    toggleElement(elements.generatedQuestionManually, true);
    toggleElement(elements.aiGeneratorContainer, false);
    updateModeButtons(true);

    // Change AI button image to active
    elements.creationWithAiButton.querySelector('img').src = "../imgs/active ai.svg";
    
    // Change Manual button image to inactive
    elements.manualCreationButton.querySelector('img').src = "../imgs/Manual Creation logo.svg";
}

function switchToManualMode() {
    currentMode = 'manual';
    toggleElement(elements.generatedQuestionManually, false);
    toggleElement(elements.aiGeneratorContainer, true);
    updateModeButtons(false);

    // Change AI button image to active
    elements.creationWithAiButton.querySelector('img').src = "../imgs/not active ai.svg";
    
    // Change Manual button image to inactive
    elements.manualCreationButton.querySelector('img').src = "../imgs/active book.svg";
}

function handleGenerateQuestions() {
    const count = parseInt(elements.dropdown.value);
    elements.aiQuestionsContainer.innerHTML = '';
    
    // Start numbering from 1 for new batches
    for(let i = 1; i <= count; i++) {
        const questionHTML = `
            <div class="questionWrapper ai-question">
                ${createQuestionHeader(i, 'ai')}
                <!-- rest of question HTML -->
            </div>
        `;
        elements.aiQuestionsContainer.insertAdjacentHTML('beforeend', questionHTML);
    }
    toggleElement(elements.generatedQuestionsByAi, false);
}

// ===================== Question Management =====================
function addQuestion(type) {
    const container = type === 'ai' ? 
        elements.aiQuestionsContainer : 
        elements.manualQuestionsContainer;

    // Get existing questions count
    const existingQuestions = container.querySelectorAll('.questionWrapper').length;
    const questionNumber = existingQuestions + 1;
    
    const questionHTML = `
        <div class="questionWrapper ${type}-question">
            ${createQuestionHeader(questionNumber, type)}
            <div class="addQuestionWrapper">
                <input type="text" placeholder="Add Question..." class="question-input">
            </div>
            <div class="optionsWrapper">
                ${Array.from({length: type === 'ai' ? 4 : 2}, (_, i) => `
                    <div class="option-row" style="display: flex; align-items: center; gap: 8px;">
                        <label class="circle-checkbox" style="margin-right: 6px;">
                            <input type="checkbox" class="correct-checkbox">
                            <span class="custom-circle"></span>
                        </label>
                        <input type="text" placeholder="Option ${i+1}" class="option-input" style="flex: 1;">
                        <button class="deleteBtn delete-option-btn "><img src="../imgs/delete logo.svg" alt=""></button>
                    </div>
                `).join('')}
            </div>
            <button type="button" class="addOption">Add Option</button>
        </div>
    `;


    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function createQuestionHeader(number) {
    return `
        <div class="questionHeader">
            <p>Question ${number}</p>
            <div class="actionsContainer">
                <div class="questionScoreWrapper Manual">
                    <label>Question Score</label>
                    <select>
                        ${Array.from({length: 5}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
                    </select>
                </div>
                <div class="addAndDeleteBtn">
                    
                    <button class="deleteBtn delete-question-btn">
                        <img src="../imgs/delete logo.svg" alt="">Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}
// ===================== Dynamic Element Handling =====================
function handleDynamicActions(e) {
    // Delete entire question
    if (e.target.closest('.delete-question-btn')) {
        const question = e.target.closest('.questionWrapper');
        if (question) {
            question.remove();
            renumberQuestions(); // If needed
        }
        return;
    }

    // Add new option
    if (e.target.closest('.addOption')) {
        const addButton = e.target.closest('.addOption');
        const questionWrapper = addButton.closest('.questionWrapper');
        const optionsWrapper = questionWrapper.querySelector('.optionsWrapper');

        if (!optionsWrapper) {
            console.error('Options wrapper not found');
            return;
        }

        if (optionsWrapper.querySelectorAll('.option-row').length >= 7) {
            alert('Maximum 7 options allowed');
            return;
        }

        const optionRow = document.createElement('div');
        optionRow.className = 'option-row';
        optionRow.style = 'display: flex; align-items: center; gap: 8px;';
        optionRow.innerHTML = `
            <label class="circle-checkbox" style="margin-right: 6px;">
                <input type="checkbox" class="correct-checkbox">
                <span class="custom-circle"></span>
            </label>
            <input type="text" placeholder="Option ${optionsWrapper.querySelectorAll('.option-row').length + 1}" class="option-input" style="flex: 1;">
            <button class="deleteBtn delete-option-btn"><img src="../imgs/delete logo.svg" alt=""></button>
        `;
        optionsWrapper.appendChild(optionRow);
        renumberOptions(optionsWrapper);
        return;
    }

    // Delete an option
    if (e.target.closest('.delete-option-btn')) {
        const optionRow = e.target.closest('.option-row');
        const optionsWrapper = optionRow?.parentElement;

        if (optionsWrapper?.querySelectorAll('.option-row').length <= 2) {
            alert("At least two option is required!");
            return;
        }

        optionRow.remove();
        renumberOptions(optionsWrapper);
        return;
    }
}

// Update placeholder of options
function renumberOptions(wrapper) {
    wrapper.querySelectorAll('.option-input').forEach((input, index) => {
        input.placeholder = `Option ${index + 1}`;
    });
}

// Optional: update question number (if shown)
function renumberQuestions() {
    document.querySelectorAll('.questionWrapper').forEach((qWrapper, index) => {
        const qInput = qWrapper.querySelector('.addQuestionWrapper input');
        if (qInput) qInput.placeholder = `Question ${index + 1} .............................................................................?`;
    });
}

// Checkbox toggle (mark correct answer visually)
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('correct-checkbox')) {
        const checkbox = e.target;
        const optionInput = checkbox.closest('.option-row')?.querySelector('.option-input');
        if (optionInput) {
            if (checkbox.checked) {
                optionInput.classList.add('correct-option');
            } else {
                optionInput.classList.remove('correct-option');
            }
        }
    }
});



// ===================== Helper Functions =====================
function toggleElement(element, hide) {
    element.classList.toggle('hidden', hide);
}

function updateModeButtons(isActive) {
    elements.creationWithAiButton.classList.toggle('active', isActive);
    elements.manualCreationButton.classList.toggle('active', !isActive);
}

function renumberQuestions() {
    const container = currentMode === 'ai' ? 
        elements.aiQuestionsContainer : 
        elements.manualQuestionsContainer;
        
    container.querySelectorAll('.questionWrapper').forEach((question, index) => {
        question.querySelector('.questionHeader p').textContent = `Question ${index + 1}`;
    });
}

function createOptions(count) {
    return `
        <div class="optionsWrapper">
            ${Array.from({length: count}, (_, i) => `
                <input type="text" placeholder="Option ${i+1}">
            `).join('')}
        </div>
    `;
}

// ===================== Form Validation =====================
function initializeInputValidation() {
    elements.quizDate.addEventListener('change', validateDate);
    elements.quizTime.addEventListener('change', validateTime);
}

function validateDate() {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if(!pattern.test(this.value)) {
        alert('Invalid date format. Use YYYY-MM-DD.');
        this.value = '';
    }
}

function validateTime() {
    const pattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if(!pattern.test(this.value)) {
        alert('Invalid time format. Use HH:MM (24-hour format).');
        this.value = '';
    }
}

// ===================== Form Submission =====================
function handleFormSubmission(e) {
    e.preventDefault();
    // Validate basic quiz info
    if (!validateQuizMetadata()) return;
    
    // Collect and validate questions
    const questions = collectAndValidateQuestions();
    if (!questions) return;
    
    // Prepare final data
    const quizData = {
        metadata: {
            course_id: parseInt(elements.courseId),
            name: elements.quizName.value.trim(),
            instructions: elements.instructions.value.trim(),
            date: elements.quizDate.value,
            time: elements.quizTime.value,
            totalScore: elements.totalScore.value,
            duration: elements.attempts.value,
            creationMethod: currentMode === 'ai' ? 'AI' : 'Manual'
        },
        questions: questions
    };
    
    
    // Final validation
    if (!validateFinalData(quizData)) return;
    
    console.log('Final quiz data:', quizData);
    fetchCode(`${API_BASE_URL}/instructor/exam/store`, quizData)
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

async function fetchCode(url, data) {
    await getCsrfCookie();

    const isAuthenticated = await validateSession();
    if (!isAuthenticated) return redirectToLogin();

    const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));

    try {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to submit quiz' + response.status);
        }

        const result = await response.json();
        console.log('Server response:', result);
        alert('Quiz submitted successfully!');
        window.location.reload();
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting the quiz.');
    }
}

// =====================  collect And Validate Questions =====================
function collectAndValidateQuestions() {
    const questions = [];
    const questionWrappers = document.querySelectorAll('.questionWrapper');
    
    if (questionWrappers.length === 0) {
        alert('Please add at least one question');
        return null;
    }
    
    for (const wrapper of questionWrappers) {
        const questionInput = wrapper.querySelector('.addQuestionWrapper input');
        const scoreSelect = wrapper.querySelector('.questionScoreWrapper.Manual select');

        // Validate question text
        if (!questionInput.value.trim()) {
            alert('Please fill in all question texts');
            questionInput.focus();
            return null;
        }
        
        // Validate score
        const score = parseInt(scoreSelect.value);
        console.log('Score select value:', scoreSelect.value); // Debugging line
        console.log('Score:', score);
        if (isNaN(score)) {
            alert('Please select a valid score for all questions');
            scoreSelect.focus();
            return null;
        }
        
        // Validate options
        const optionRows = wrapper.querySelectorAll('.option-row');
        const options = Array.from(optionRows).map(row => {
            return {
                option: row.querySelector('input[type="text"]').value.trim(),
                is_correct: row.querySelector('input[type="checkbox"]').checked
            };
        }).filter(opt => opt.option);

        questions.push({
            question: questionInput.value.trim(),
            score: score,
            options: options
        });
    }
    return questions;
}

// ===================== validate Final Data =====================
function validateFinalData(quizData) {
    // Convert to numbers
    const totalScore = parseInt(quizData.metadata.totalScore);
    const calculatedTotal = quizData.questions.reduce((sum, q) => sum + q.score, 0);

    // Check if total score matches sum of question scores
    if (calculatedTotal !== totalScore) {
        alert(`Total score mismatch! Questions sum to ${calculatedTotal} but total is set to ${totalScore}`);
        elements.totalScore.focus();
        return false;
    }

    // Check if any question score exceeds 5
    const invalidQuestion = quizData.questions.find(q => q.score < 1 || q.score > 5);
    if (invalidQuestion) {
        alert(`Question scores must be between 1-5. Found: ${invalidQuestion.score}`);
        return false;
    }

    return true;
}

// ===================== validate Quiz Metadata =====================

function validateQuizMetadata() {
    // Required fields check
    const requiredFields = {
        'Quiz name': elements.quizName.value.trim(),
        'Quiz date': elements.quizDate.value,
        'Quiz time': elements.quizTime.value,
        'Total score': elements.totalScore.value,
        'Quiz duration': elements.attempts.value
    };

    for (const [fieldName, value] of Object.entries(requiredFields)) {
        if (!value) {
            alert(`Please fill in the ${fieldName} field`);
            return false;
        }
    }
    return true;
}

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeApp);