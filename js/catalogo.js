function renderCatalogo(productos) {
  const mainWraps = [
    document.getElementById("categoriasNav"),
    document.getElementById("categoriasMain"),
    document.getElementById("categoriasBottom")
  ].filter(Boolean);
  const subWraps = [
    document.getElementById("subcategorias"),
    document.getElementById("subcategoriasNav")
  ].filter(Boolean);
  const grid = document.getElementById("grid-catalogo");
  const titulo = document.getElementById("catalogoTitulo");
  if (mainWraps.length === 0 || subWraps.length === 0 || !grid || !titulo) return;

  const index = new Map();

  productos.forEach((p) => {
    const mainId = p.categoriaPrincipal || p.categoria || "otros";
    const mainLabel = p.categoriaPrincipalLabel || p.categoriaLabel || mainId;
    const subId = p.subcategoria || "general";
    const subLabel = p.subcategoriaLabel || "General";

    if (!index.has(mainId)) {
      index.set(mainId, { label: mainLabel, subcategorias: new Map() });
    }

    const main = index.get(mainId);
    if (!main.subcategorias.has(subId)) {
      main.subcategorias.set(subId, { label: subLabel, productos: [] });
    }
    main.subcategorias.get(subId).productos.push(p);
  });

  const mainIds = Array.from(index.keys()).sort((a, b) => index.get(a).label.localeCompare(index.get(b).label));
  let activeMain = mainIds[0];
  let activeSub = null;

  function renderGrid() {
    const mainData = index.get(activeMain);
    if (!mainData) return;
    const subData = mainData.subcategorias.get(activeSub);
    const items = subData ? subData.productos : [];

    titulo.textContent = `${mainData.label} - ${subData ? subData.label : ""}`.trim();
    grid.innerHTML = "";

    items.forEach((p) => {
      const div = document.createElement("article");
      div.className = "card";
      div.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>$${p.precio}</p>
        <button class="btn-agregar" data-id="${p.id}">Agregar</button>
      `;
      grid.appendChild(div);
    });

    grid.querySelectorAll(".btn-agregar").forEach((btn) => {
      btn.addEventListener("click", () => agregarAlCarrito(btn.dataset.id));
    });
  }

  function renderSubcategorias() {
    const mainData = index.get(activeMain);
    if (!mainData) return;

    const subIds = Array.from(mainData.subcategorias.keys()).sort((a, b) =>
      mainData.subcategorias.get(a).label.localeCompare(mainData.subcategorias.get(b).label)
    );

    if (!subIds.includes(activeSub)) {
      activeSub = subIds[0];
    }

    subWraps.forEach((subWrap) => {
      subWrap.innerHTML = "";
      subIds.forEach((subId) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `subcat ${subId === activeSub ? "active" : ""}`.trim();
        btn.textContent = mainData.subcategorias.get(subId).label;
        btn.addEventListener("click", () => {
          activeSub = subId;
          renderSubcategorias();
          renderGrid();
        });
        subWrap.appendChild(btn);
      });
    });
  }

  function renderCategoriasMain() {
    mainWraps.forEach((wrap) => {
      wrap.innerHTML = "";
      mainIds.forEach((mainId) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `cat ${mainId === activeMain ? "active" : ""}`.trim();
        btn.textContent = index.get(mainId).label;
        btn.addEventListener("click", () => {
          activeMain = mainId;
          activeSub = null;
          renderCategoriasMain();
          renderSubcategorias();
          renderGrid();
          document.querySelector(".nav")?.classList.remove("categorias-open");
          document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        wrap.appendChild(btn);
      });
    });
  }

  renderCategoriasMain();
  renderSubcategorias();
  renderGrid();
}
