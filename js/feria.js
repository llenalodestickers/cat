// Datos de las proximas ferias
// Edita este array para agregar o modificar las fechas de las ferias
const ferias = [
  {
    id: 1,
    titulo: "Feria Euca",
    fecha: "Sabado 21 de Febrero",
    horario: "17:00 a 21:00 hs",
    ubicacion: "Bosques de Eucaliptos, Villa Bosch",
    descripcion: "Feria artesanal de 3F"
  },
  {
    id: 2,
     titulo: "Feria Euca",
    fecha: "Sabado 28 de Febrero",
    horario: "17:00 a 21:00 hs",
    ubicacion: "Bosques de Eucaliptos, Villa Bosch",
    descripcion: "Feria artesanal de 3F"
  },
  {
    id: 3,
     titulo: "Feria Euca",
    fecha: "Sabado 07 de Marzo",
    horario: "17:00 a 21:00 hs",
    ubicacion: "Bosques de Eucaliptos, Villa Bosch",
    descripcion: "Feria artesanal de 3F"
  }
];

// Funcion para renderizar las tarjetas de feria
function renderizarFerias() {
  const grid = document.getElementById('feriaGrid');
  if (!grid) return;

  if (ferias.length === 0) {
    grid.innerHTML = `
      <div class="feria-empty">
        <p>Próximamente nuevas fechas de ferias</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = ferias.map(feria => `
    <div class="feria-card">
      <span class="feria-fecha">${feria.fecha}</span>
      <h3 class="feria-titulo">${feria.titulo}</h3>
      <p>${feria.descripcion}</p>
      
      <div class="feria-info">
        <div class="feria-info-item">
          <svg class="feria-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <span>${feria.horario}</span>
        </div>
      </div>
      
      <div class="feria-ubicacion">
        <div class="feria-ubicacion-label">Ubicacion</div>
        <div class="feria-ubicacion-texto">${feria.ubicacion}</div>
      </div>
    </div>
  `).join('');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', renderizarFerias);
