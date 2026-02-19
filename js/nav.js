function initNav() {
  const cartBtn = document.getElementById("openCart");
  const categoriasBtn = document.getElementById("openCategorias");
  const nav = document.querySelector(".nav");

  if (cartBtn) {
    cartBtn.onclick = () => {
      document.getElementById("cart").classList.add("open");
      document.getElementById("overlay").classList.add("show");
    };
  }

  if (categoriasBtn && nav) {
    categoriasBtn.onclick = () => {
      nav.classList.toggle("categorias-open");
    };
  }
}
