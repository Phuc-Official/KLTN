// script.js
document.addEventListener('DOMContentLoaded', function () {
    // Ẩn tất cả các submenu khi trang được tải
    document.querySelectorAll('.submenu').forEach(submenu => {
        submenu.style.display = 'none';
    });

    // Thêm sự kiện click cho các menu lớn
    document.querySelectorAll('.sidebar > ul > li > a').forEach(menuLink => {
        menuLink.addEventListener('click', function (e) {
            e.preventDefault(); // Ngăn chặn hành vi mặc định của liên kết
            const submenu = this.nextElementSibling;

            // Đóng tất cả submenu khác
            document.querySelectorAll('.submenu').forEach(sub => {
                if (sub !== submenu) {
                    sub.style.display = 'none'; // Ẩn submenu khác
                    sub.parentElement.classList.remove('active'); // Bỏ lớp active
                }
            });

            // Chuyển đổi hiển thị của submenu hiện tại
            if (submenu.style.display === 'block') {
                submenu.style.display = 'none'; // Ẩn nếu đang mở
                this.parentElement.classList.remove('active'); // Bỏ lớp active
            } else {
                submenu.style.display = 'block'; // Hiển thị submenu
                this.parentElement.classList.add('active'); // Thêm lớp active

                // Mở submenu đầu tiên nếu có
                const firstSubmenuItem = submenu.querySelector('li');
                if (firstSubmenuItem) {
                    firstSubmenuItem.classList.add('active'); // Đánh dấu submenu đầu tiên là active
                }
            }
        });
    });

    // Xử lý sự kiện cho submenu
    document.querySelectorAll('.sidebar ul li ul li a').forEach(submenuLink => {
        submenuLink.addEventListener('click', function (e) {
            e.stopPropagation(); // Ngăn chặn sự kiện click từ menu cha

            // Bỏ lớp active khỏi tất cả submenu
            document.querySelectorAll('.sidebar ul li ul li').forEach(item => {
                item.classList.remove('active');
            });

            // Thêm lớp active cho submenu đang được chọn
            this.parentElement.classList.add('active');
        });
    });

    // Kiểm tra URL hiện tại và mở submenu tương ứng
    const currentUrl = window.location.pathname;
    if (currentUrl.includes('inventory.html')) {
        const warehouseMenu = document.querySelector('.sidebar ul li:nth-child(4) > a'); // Thay đổi chỉ mục nếu cần
        const submenu = warehouseMenu.nextElementSibling;
        submenu.style.display = 'block'; // Hiển thị submenu của Quản lý kho
        warehouseMenu.parentElement.classList.add('active'); // Thêm lớp active cho menu lớn
    }
});