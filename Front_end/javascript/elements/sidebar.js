document.addEventListener("DOMContentLoaded", function () {
  // Ẩn tất cả submenu
  document.querySelectorAll(".submenu").forEach((submenu) => {
    submenu.style.display = "none";
  });

  // Thêm sự kiện cho các menu lớn
  document.querySelectorAll(".sidebar > ul > li > a").forEach((menuLink) => {
    menuLink.addEventListener("click", function (e) {
      const submenu = this.nextElementSibling;

      if (!submenu) {
        // Menu không có submenu => vẫn ẩn tất cả submenu khác
        document.querySelectorAll(".submenu").forEach((sub) => {
          sub.style.display = "none";
          sub.parentElement.classList.remove("active");
        });
        localStorage.removeItem("activeMainMenu");
        // Không cần preventDefault, cho phép chuyển trang bình thường
        return;
      }

      e.preventDefault();

      // Toggle submenu như cũ...
      const isOpen = submenu.style.display === "block";

      document.querySelectorAll(".submenu").forEach((sub) => {
        sub.style.display = "none";
        sub.parentElement.classList.remove("active");
      });

      if (!isOpen) {
        submenu.style.display = "block";
        this.parentElement.classList.add("active");
        localStorage.setItem("activeMainMenu", this.innerText.trim());
      } else {
        localStorage.removeItem("activeMainMenu");
      }
    });
  });

  // Sự kiện click submenu
  document.querySelectorAll(".submenu > li > a").forEach((submenuLink) => {
    submenuLink.addEventListener("click", function () {
      // Lưu submenu đang chọn
      localStorage.setItem("activeSubMenu", this.getAttribute("href"));
    });
  });

  // 🔁 Phục hồi trạng thái menu
  const activeMain = localStorage.getItem("activeMainMenu");
  const activeSub = localStorage.getItem("activeSubMenu");

  // Mở lại menu lớn
  if (activeMain) {
    document.querySelectorAll(".sidebar > ul > li > a").forEach((menuLink) => {
      if (menuLink.innerText.trim() === activeMain) {
        const submenu = menuLink.nextElementSibling;
        if (submenu) {
          submenu.style.display = "block";
          menuLink.parentElement.classList.add("active");
        }
      }
    });
  }

  // Đánh dấu submenu đang chọn
  if (activeSub) {
    document.querySelectorAll(".submenu > li > a").forEach((submenuLink) => {
      if (submenuLink.getAttribute("href") === activeSub) {
        submenuLink.parentElement.classList.add("active");
      } else {
        submenuLink.parentElement.classList.remove("active");
      }
    });
  }
});
