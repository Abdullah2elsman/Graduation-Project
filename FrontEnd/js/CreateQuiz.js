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
                    <input type="text" placeholder="Option ${i+1}" class="option-input">
                `).join('')}
            </div>
            <button type="button" class="addOption">Add Option</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function createQuestionHeader(number, type) {
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
                    <button class="editBtn">
                        <img src="../imgs/edit logo.svg" alt="">Edit
                    </button>
                    <button class="deleteBtn">
                        <img src="../imgs/delete logo.svg" alt="">Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}
// ===================== Dynamic Element Handling =====================
function handleDynamicActions(e) {
    // Delete question
    if(e.target.closest('.deleteBtn')) {
        const question = e.target.closest('.questionWrapper');
        question.remove();
        renumberQuestions(); // This now properly renumbers remaining questions
    }
    
    // Add option 
    if (e.target.closest('.addOption')) {
        const addButton = e.target.closest('.addOption');
        const optionsWrapper = addButton.previousElementSibling;
        
        if (!optionsWrapper || !optionsWrapper.classList.contains('optionsWrapper')) {
            console.error('Could not find options wrapper');
            return;
        }
        
        if (optionsWrapper.children.length >= 7) {
            alert('Maximum 7 options allowed');
            return;
        }
        
        const newOption = document.createElement('input');
        newOption.type = 'text';
        newOption.placeholder = `Option ${optionsWrapper.children.length + 1}`;
        optionsWrapper.appendChild(newOption);
    }
}

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
    // Send data to backend
    fetch('http://localhost:8005/api/exam/store', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit quiz');
        }
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);
        alert('Quiz submitted successfully!');
        // Optionally clear the form or redirect
    })
    .catch(error => {
        console.error('Submission error:', error);
        alert('There was an error submitting the quiz.');
    });
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
        
        console.log(questionInput);
        console.log(questionInput.value);
        console.log(scoreSelect);
        console.log(scoreSelect.value);
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
        console.log('Form submission triggered');
        
        // Validate options
        const options = wrapper.querySelectorAll('.optionsWrapper input');
        const validOptions = Array.from(options)
            .map(input => input.value.trim())
            .filter(option => option);

        if (validOptions.length < 2) {
            alert('Each question needs at least 2 valid options');
            wrapper.querySelector('.optionsWrapper input').focus();
            return null;
        }

        questions.push({
            text: questionInput.value.trim(),
            score: score,
            options: validOptions
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

// ===================== Keep everything else unchanged below =====================
// ...
// Keep all your existing functions below
// ...

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeApp);