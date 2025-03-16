// tab.js
function initializeTabs(tabsData) {
    const tabsContainer = document.getElementById('tabs');
    const contentContainer = document.getElementById('tab-content');

    // Tạo tab và nội dung từ dữ liệu
    tabsData.forEach((tab, index) => {
        // Tạo tab
        const tabElement = document.createElement('div');
        tabElement.className = 'tab' + (index === 0 ? ' active' : '');
        tabElement.setAttribute('data-tab', index + 1);
        tabElement.textContent = tab.title;

        // Tạo nội dung tương ứng
        const contentElement = document.createElement('div');
        contentElement.className = 'tab-item' + (index === 0 ? ' active' : '');
        contentElement.setAttribute('data-tab', index + 1);
        contentElement.innerHTML = tab.content; // Nội dung HTML

        // Thêm tab và nội dung vào container
        tabsContainer.appendChild(tabElement);
        contentContainer.appendChild(contentElement);
    });

    // Khởi tạo sự kiện click cho các tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            // Đóng tất cả các tab và nội dung
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
            });
            document.querySelectorAll('.tab-item').forEach(item => {
                item.classList.remove('active');
            });

            // Mở tab và nội dung tương ứng
            this.classList.add('active');
            document.querySelector(`.tab-item[data-tab="${tabId}"]`).classList.add('active');
        });
    });
}