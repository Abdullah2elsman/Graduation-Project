// Book Page => This script to control the actions in book page
let FILE_PATH;
const urlParams = new URLSearchParams(window.location.search);
const encodedCourseId  = urlParams.get('course_id');

const courseId = atob(encodedCourseId); // decode courseId
// ===================== DOM References =====================
const elements = {
    // Containers
    chaptersContainer: document.querySelector('.chapter-container'),

    // Buttons
    menuBtn: document.querySelector('.left-menu-btn'),
    backBtn: document.querySelector('.back-btn'),
    navBtnLeft: document.querySelector('.nav-btn-left'),
    navBtnRight: document.querySelector('.nav-btn-right'),
    searchBtn: document.querySelector('.search-btn'),
    rightMenuBtn: document.querySelector('.right-menu-btn'),

    // Other elements
    pageNumber: document.querySelector('.page-number'),
    pageCount: document.querySelector('.page-count'),
    searchInput: document.querySelector('.search-input'),

    // Right sidebar
    rightSidebar: document.querySelector('.right-sidebar'),
    closeRightSidebarBtn: document.querySelector('.close-right-sidebar'),

    // Color wheel
    colorWheelCanvas: document.getElementById('colorWheel'),

    // Tabs
    tabs: document.querySelectorAll('.tab'),
    tabIndicator: document.querySelector('.tab-indicator'),

    // Tools
    toolButtons: document.querySelectorAll('.tools button'),

    // Sliders
    sliders: document.getElementsByClassName('thickness'),
    sliderValues: document.getElementsByClassName('thicknessValue'),
};


// ===================== Global Variables =====================
let leftSidebarOpen = false;
let rightSidebarOpen = false;
let bookDataCache = null;
elements.pageNumber.value = localStorage.getItem('savedPageNumber') || 1; // Load saved page or default to 1


// ===================== Initialize Application =====================
function initializeBookPage() {
    fetchBookPageData();
    getPdfPage(localStorage.getItem('savedPageNumber') || 1); // Load saved page or default to 1
    setupEventListeners();
}

// ===================== Fetch Book Page Data =====================

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

async function fetchBookPageData() {
    const cacheKey = `bookData_${courseId}`; // مفتاح التخزين المخصص للدورة
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        console.log('Using cached book data from localStorage.');
        bookDataCache = JSON.parse(cached);

        // تحديث العناصر مباشرة من البيانات المحفوظة
        FILE_PATH = bookDataCache.file_path;
        elements.pageCount.innerHTML = bookDataCache.page_count;
        return bookDataCache;
    }

    await getCsrfCookie();

    const isValidSession = await validateSession();
    if (!isValidSession) return redirectToLogin();
    const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));

    
    const response = await fetch(`${API_BASE_URL}/instructor/course/book?course_id=${courseId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-xsrf-token': xsrfToken
        }
    });
    const data = await response.json();

    // تحديث المتغير العام والتخزين في localStorage
    bookDataCache = data;
    localStorage.setItem(cacheKey, JSON.stringify(data));

    FILE_PATH = data.file_path;
    elements.pageCount.innerHTML = data.page_count;

    console.log('Fetched and cached book data:', data);
    return data;
}

async function getPdfPage(pageNumber) {
    await getCsrfCookie();

    const isValidSession = await validateSession();
    if (!isValidSession) return redirectToLogin();

    const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));
    fetch(`${API_BASE_URL}/course/book/get-single-page?course_id=${courseId}&page_number=${pageNumber}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'X-xsrf-token': xsrfToken
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch PDF');
        return response.blob();
    })
    .then(blob => {
        const pdfUrl = URL.createObjectURL(blob);
        displayPdfPage(pdfUrl); // هتعرض الصفحة هنا
    })
    .catch(error => {
        console.error('Error fetching PDF page:', error);
        alert('Error fetching PDF page: ' + error.message);
    });
}
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js';

function displayPdfPage(pdfUrl) {
    const container = document.getElementById('viewerContainer');
    const viewer = document.getElementById('viewer');

    // تنظيف المحتوى السابق
    viewer.innerHTML = '';

    const eventBus = new pdfjsViewer.EventBus();
    const pdfLinkService = new pdfjsViewer.PDFLinkService({ eventBus });
    const pdfViewer = new pdfjsViewer.PDFViewer({
        container: container,
        viewer: viewer,
        eventBus: eventBus,
        linkService: pdfLinkService,
    });

    fetch(pdfUrl)
        .then(response => response.arrayBuffer())
        .then(data => {
            const loadingTask = pdfjsLib.getDocument({ data });
            return loadingTask.promise;
        })
        .then(pdfDocument => {
            pdfViewer.setDocument(pdfDocument);
            pdfLinkService.setDocument(pdfDocument);

            pdfViewer.currentPageNumber = 1;
        })
        .catch(error => {
            // console.error('Error loading PDF:', error);
        });
}

// ===================== Event Listeners Setup =====================
function setupEventListeners() {
    elements.backBtn.addEventListener('click', () => {
        window.location.href = `../instructor/coursesManagement.html?course_id=${btoa(courseId)}`;
    });
    // Sidebar events
    if (elements.menuBtn) {
        elements.menuBtn.addEventListener('click', toggleLeftSidebar);
    }
    [elements.rightMenuBtn, elements.closeRightSidebarBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', toggleRightSidebar);
    });

    // Color wheel events
    if (elements.colorWheelCanvas) {
        drawColorWheel();
        elements.colorWheelCanvas.addEventListener('click', handleColorWheelClick);
    }

    // Tab events
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab));
    });
    window.addEventListener('load', () => {
        if (elements.rightSidebar) elements.rightSidebar.style.display = "block";
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) updateTabIndicator(activeTab);
        if (elements.rightSidebar) elements.rightSidebar.style.display = "none";
    });

    // Tool button events
    elements.toolButtons.forEach(btn => {
        btn.addEventListener('click', () => activateToolButton(btn));
    });

    // Slider events
    for (let i = 0; i < elements.sliders.length; i++) {
        elements.sliders[i].addEventListener('input', () => {
            elements.sliderValues[i].textContent = elements.sliders[i].value;
            updateSliderBackground(elements.sliders[i]);
        });
        // Initial value
        elements.sliderValues[i].textContent = elements.sliders[i].value;
        updateSliderBackground(elements.sliders[i]);
    }

    // Navigation events

    // Left navigation button
    elements.navBtnLeft.addEventListener('click', () => {
        let current = parseInt(elements.pageNumber.value, 10);
        if (current > 1) {
            let newPage = current - 1;
            elements.pageNumber.value = newPage;
            localStorage.setItem('savedPageNumber', newPage); // حفظ الصفحة
            getPdfPage(newPage); // Fetch the previous page
        }
    });

    // Right navigation button
    elements.navBtnRight.addEventListener('click', () => {
        let current = parseInt(elements.pageNumber.value, 10);
        let maxPage = parseInt(elements.pageCount.innerHTML, 10);
        if (current < maxPage) {
            let newPage = current + 1;
            elements.pageNumber.value = newPage;
            localStorage.setItem('savedPageNumber', newPage); // حفظ الصفحة
            getPdfPage(newPage); // Fetch the next page
        }
    });

    // Page number input (on blur or change)
    elements.pageNumber.addEventListener('change', () => {
        let val = parseInt(elements.pageNumber.value, 10);
        let max = parseInt(elements.pageCount.innerHTML, 10);

        if (isNaN(val) || val < 1) val = 1;
        if (val > max) val = max;

        elements.pageNumber.value = val;
        localStorage.setItem('savedPageNumber', val); // حفظ الصفحة
        getPdfPage(val); // عرض الصفحة
    });

}

// ===================== Core Functions =====================

function toggleLeftSidebar() {
    if (leftSidebarOpen) {
        elements.searchBtn.style.display = "none";
        elements.chaptersContainer.style.display = "none";
    } else {
        elements.searchBtn.style.display = "flex";
        elements.chaptersContainer.style.display = "block";
    }
    leftSidebarOpen = !leftSidebarOpen;
}

function toggleRightSidebar() {
    if (rightSidebarOpen) {
        elements.rightSidebar.style.display = "none";
    } else {
        elements.rightSidebar.style.display = "block";
    }
    rightSidebarOpen = !rightSidebarOpen;
}

function drawColorWheel() {
    const canvas = elements.colorWheelCanvas;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;
    const angleSteps = 24;
    const ringSteps = 10;

    for (let ring = 0; ring < ringSteps; ring++) {
        const innerRadius = (radius / ringSteps) * ring;
        const outerRadius = (radius / ringSteps) * (ring + 1);
        const lightness = 50 + (ring / ringSteps) * 30;

        for (let i = 0; i < angleSteps; i++) {
            const startAngle = (i * 2 * Math.PI) / angleSteps;
            const endAngle = ((i + 1) * 2 * Math.PI) / angleSteps;
            const hue = (i * 360) / angleSteps;

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
            ctx.fill();
        }
    }
}

function handleColorWheelClick(e) {
    const canvas = elements.colorWheelCanvas;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > radius) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    console.log(hex);
}

function updateTabIndicator(tab) {
    const rect = tab.getBoundingClientRect();
    const containerRect = tab.parentElement.getBoundingClientRect();
    elements.tabIndicator.style.width = `${rect.width}px`;
    elements.tabIndicator.style.left = `${rect.left - containerRect.left}px`;
}

function switchTab(tab) {
    document.querySelector('.tab.active').classList.remove('active');
    tab.classList.add('active');
    updateTabIndicator(tab);
}

function activateToolButton(btn) {
    elements.toolButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function updateSliderBackground(slider) {
    const val = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, black ${val}%, #BDBDBD ${val}%)`;
}

// Show a section inside recommendation
function showRecommendationSection(sectionId) {
    const sections = document.getElementsByClassName("recommendation-section");
    for (let i = 0; i < sections.length; i++) {
        sections[i].style.display = "none";
    }
    document.getElementById(sectionId).style.display = "block";
}

// Show a section inside annotation
function showAnnotationSection(sectionId) {
    const sections = document.getElementsByClassName("annotation-section");
    for (let i = 0; i < sections.length; i++) {
        sections[i].style.display = "none";
    }
    document.getElementById(sectionId).style.display = "block";
}

// Open tab by name (for content sections)
function openTab(event, tabName) {
    const tabContent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    const tabLinks = document.getElementsByClassName("tab");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.classList.add("active");
}

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeBookPage);
