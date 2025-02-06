const url = "http://localhost:8005";
// Logout button
document.querySelector(".logout-button").addEventListener(
    "click",
    async () => {
        try {
            const response = await fetch(`${url}/api/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
                throw new Error('Failed to fetch data');
        }
        } catch (error) {
            console.error("Error fetching data from database:", error);
        }

        // Remove token from local storage
        localStorage.removeItem("authToken");

        // Redirect to login page
        window.location.href = "Auth/login.html";
    }
);


// Sidebar script
document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const rightArrow = document.querySelector(".arrow-right");
    const leftArrow = document.querySelector('.arrow-left');
    const menuItems = document.querySelectorAll(".menu-item");
    const logo = document.getElementById('Logo');
    const content = document.querySelector('.content');
    console.log(logo.src);
    leftArrow.addEventListener("click", function () {
        sidebar.classList.add("collapsed");
        logo.src += "/../logo-collapsed.svg";
        rightArrow.style.display = 'flex';
        leftArrow.style.display = 'none';
        content.style.marginLeft = 70 + 'px';
    });
        
    rightArrow.addEventListener('click', function() {
        sidebar.classList.remove("collapsed");
        logo.src = "imgs/logo.svg";
        rightArrow.style.display = 'none';
        leftArrow.style.display = 'block';
        content.style.marginLeft = 240 + 'px';

    });
    menuItems.forEach(item => {
        item.addEventListener("click", function () {
        menuItems.forEach(i => i.classList.remove("selected"));
        this.classList.add("selected");
        });
    });
    
});