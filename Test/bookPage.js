// Book Page => This script to control the actions in book page

// display and hide the left sidebar
const menuButton = document.querySelector('.menu-btn');
const searchButton = document.querySelector('.search-input');
const chaptersContainer = document.querySelector('.chapter-container');
let leftSidebarFlag = false;
menuButton.addEventListener('click', () => {

  if (leftSidebarFlag){
    searchButton.style.display = "none";
    chaptersContainer.style.display = "none";
  } else {
    searchButton.style.display = "flex";
    chaptersContainer.style.display = "block";
  }
  leftSidebarFlag = !leftSidebarFlag
});
console.log(searchButton);

// display and hide the right sidebar
const rightMenuButton = document.querySelector(".right-menu-btn");
console.log(rightMenuButton);
const closeButton = document.querySelector(".close-right-sidebar");
console.log(closeButton);
const rightSidebar = document.querySelector('.right-sidebar');
let rightSidebarFlag = false;

[rightMenuButton, closeButton].forEach(button => {
  button.addEventListener('click', () => {
    if (rightSidebarFlag) {
      rightSidebar.style.display = "none";
    } else {
      rightSidebar.style.display = "block";
    }
    rightSidebarFlag = !rightSidebarFlag;
  });
});

console.log(searchButton);


 // Draw the color wheel canvas
 const canvas = document.getElementById("colorWheel");
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

 // Choose the Color
 canvas.addEventListener("click", function (e) {
     const rect = canvas.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;

     const dx = x - centerX;
     const dy = y - centerY;
     const distance = Math.sqrt(dx * dx + dy * dy);

     if (distance > radius) return; // out of circle

     // Read color from the position clicked in
     const pixel = ctx.getImageData(x, y, 1, 1).data;
     const r = pixel[0];
     const g = pixel[1];
     const b = pixel[2];

     // Convert the color to HEX
     const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;

     console.log(hex);
   });

// Workbook tabs
const tabs = document.querySelectorAll('.tab');
const indicator = document.querySelector('.tab-indicator');

function updateIndicator(el) {
  const rect = el.getBoundingClientRect();
  const containerRect = el.parentElement.getBoundingClientRect();
  indicator.style.width = `${rect.width}px`;
  indicator.style.left = `${rect.left - containerRect.left}px`;
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab.active').classList.remove('active');
    tab.classList.add('active');
    updateIndicator(tab);
  });
});

// Initialize on page load => This to put the underline in tap when open or refresh the page
window.addEventListener('load', () => {
  const activeTab = document.querySelector('.tab.active');
  updateIndicator(activeTab);
});

// Activation of tool button
const toolButtons = document.querySelectorAll('.tools button');

  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

// Control of the slider
const sliders = document.getElementsByClassName('thickness');
const values = document.getElementsByClassName('thicknessValue');

function updateSliderBackground(slider) {
  const val = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, black ${val}%, #BDBDBD ${val}%)`;
}

for (let i = 0; i < sliders.length; i++) {
  sliders[i].addEventListener('input', () => {
    values[i].textContent = sliders[i].value;
    updateSliderBackground(sliders[i]);
  });

  // Initial set on page load
  values[i].textContent = sliders[i].value;
  updateSliderBackground(sliders[i]);
}



//تعديلات آيه 

function openTab(event, tabName) {
    let i, tabContent, tabLinks;
    
    tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    tabLinks = document.getElementsByClassName("tab");
    for (i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.classList.add("active");
}

// // عرض أول قسم عند التحميل
// document.getElementById("annotations").style.display = "block";

// switch sections inside Recommendation
function showRecommendationSection(sectionId) {
    var sections = document.getElementsByClassName("recommendation-section");
    for (var i = 0; i < sections.length; i++) {
        sections[i].style.display = "none";
    }

    document.getElementById(sectionId).style.display = "block";
}
// switch sections inside annotation
function showAnnotationSection(sectionId) {
  var sections = document.getElementsByClassName("annotation-section");
  for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = "none";
  }

  document.getElementById(sectionId).style.display = "block";
}