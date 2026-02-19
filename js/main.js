function generarCodigoPorCategoria(productos) {
  const contadores = new Map();

  productos.forEach((producto) => {
    const categoria = String(producto.categoriaPrincipal || producto.categoria || "GEN");
    const prefijo = categoria
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, "X");

    const siguiente = (contadores.get(categoria) || 0) + 1;
    contadores.set(categoria, siguiente);

    producto.nombre = `${prefijo}${String(siguiente).padStart(5, "0")}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  generarCodigoPorCategoria(productos);
  initNav();
  renderCatalogo(productos);
});
