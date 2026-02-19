const cartPanel = document.getElementById("cart");
const overlay = document.getElementById("overlay");

function toggleCart() {
  cartPanel.classList.toggle("open");
  overlay.classList.toggle("show");
}
