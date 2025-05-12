// ===================== DOM References =====================
const elements = {
    backBtn: document.getElementById("back-btn"),
    createQuizBtn: document.getElementById("create-quiz-btn"),
    viewQuizBtns: document.querySelectorAll(".view-quiz-btn"),
    regradeQuizBtns: document.querySelectorAll(".regrade-quiz-btn"),
}

Object.values(elements).forEach(element => {
    console.log(element);
});