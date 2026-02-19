// Landing page functionality

// Category definitions with images and labels
const categoriasInfo = {
  "anime": { label: "Anime", folder: "anime", color: "#ff6b9d" },
  "futbol": { label: "Futbol", folder: "Futbol", color: "#2ecc71" },
  "infantiles": { label: "Infantiles", folder: "infantiles", color: "#f39c12" },
  "juegos": { label: "Juegos", folder: "Juegos", color: "#9b59b6" },
  "marcas": { label: "Marcas", folder: "Marcas", color: "#3498db" },
  "marvel": { label: "Marvel", folder: "Marvel", color: "#e74c3c" },
  "musica": { label: "Musica", folder: "musica", color: "#1abc9c" },
  "peliculas": { label: "Peliculas", folder: "peliculas", color: "#e67e22" },
  "series": { label: "Series", folder: "series", color: "#34495e" },
  "argentina": { label: "Argentina", folder: "Argentina", color: "#6dd5fa" },
  "animales": { label: "Animales", folder: "animales", color: "#27ae60" },
  "varios": { label: "Varios", folder: "varios", color: "#95a5a6" },
  "youtubers": { label: "Youtubers", folder: "Youtubers", color: "#c0392b" }
};

// Get first image from a category folder
async function getFirstImageFromCategory(categoria) {
  try {
    const response = await fetch(`images/Stickers/${categoria}/`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const links = doc.querySelectorAll('a[href$=".png"], a[href$=".jpg"], a[href$=".jpeg"]');
    
    if (links.length > 0) {
      const firstLink = links[0].getAttribute("href");
      return `images/Stickers/${categoria}/${firstLink}`;
    }
  } catch (error) {
    console.warn(`Could not load images for category: ${categoria}`);
  }
  return null;
}

// Render categories masonry grid
async function renderCategoriasGrid() {
  const grid = document.getElementById("categoriasGrid");
  if (!grid) return;

  const categorias = Object.keys(categoriasInfo);
  let html = "";

  for (const cat of categorias) {
    const info = categoriasInfo[cat];
    const imageUrl = await getFirstImageFromCategory(cat);
    
    if (imageUrl) {
      html += `
        <div class="masonry-item rounded-xl overflow-hidden shadow-lg cursor-pointer group" onclick="filtrarPorCategoria('${cat}')">
          <div class="relative">
            <img src="${imageUrl}" alt="${info.label}" loading="lazy" class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div class="absolute bottom-4 left-4 text-white">
              <h3 class="text-xl font-bold">${info.label}</h3>
            </div>
          </div>
        </div>
      `;
    }
  }

  if (html) {
    grid.innerHTML = html;
  } else {
    grid.innerHTML = '<p class="text-gray-500 col-span-3 text-center">Cargando categorias...</p>';
  }
}

// Filter catalog by category (called from masonry items)
function filtrarPorCategoria(categoria) {
  // Dispatch event to nav.js to change category
  const event = new CustomEvent("cambiarCategoria", { detail: { categoria } });
  window.dispatchEvent(event);
  
  // Hide categorias panel
  const panel = document.getElementById("categoriasNavPanel");
  if (panel) panel.classList.add("hidden");
  
  // Scroll to catalog
  document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render "Lo mas pedido" section - show random products from catalog
function renderMasVendido() {
  const grid = document.getElementById("grid-mas-vendido");
  if (!grid) return;

  // Get productos from data.js
  let productos = [];
  if (typeof window.productos !== 'undefined') {
    productos = window.productos;
  } else if (typeof productos !== 'undefined') {
    productos = productos;
  }
  
  // Shuffle and get 12 random products
  const shuffled = [...productos].sort(() => Math.random() - 0.5);
  const populares = shuffled.slice(0, 12);

  if (!populares.length) {
    grid.innerHTML = '<p class="text-gray-500 col-span-4 text-center">No hay productos disponibles.</p>';
    return;
  }

  grid.innerHTML = populares
    .map((producto) => {
      const imagen = producto.imagen || "images/logo.png";
      const precio = Number(producto.precio || 0);
      const nombre = producto.nombre || "Sticker";

      return `
        <article class="card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden" data-id="${producto.id}">
          <img src="${imagen}" alt="${nombre}" loading="lazy" class="w-full h-40 object-cover">
          <div class="p-4">
            <h3 class="font-semibold mb-2 line-clamp-2">${nombre}</h3>
            <div class="flex items-center justify-between">
              <p class="text-primary font-bold text-lg">$${precio}</p>
              <button class="btn-agregar px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors" data-id="${producto.id}">
                Agregar
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // Add event listeners for the add buttons
  grid.querySelectorAll(".btn-agregar").forEach((btn) => {
    btn.addEventListener("click", () => agregarAlCarrito(btn.dataset.id));
  });
}

// Initialize categorias panel toggle
function inicializarCategoriasPanel() {
  const btn = document.getElementById("openCategorias");
  const panel = document.getElementById("categoriasNavPanel");
  
  if (btn && panel) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.classList.toggle("hidden");
    });
  }
}

// Initialize landing page
document.addEventListener("DOMContentLoaded", () => {
  renderCategoriasGrid();
  renderMasVendido();
  inicializarCategoriasPanel();
});
