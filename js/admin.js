function moneyAR(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function fechaAR(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR");
}

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch];
  });
}

function toDateTimeLocalValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

async function actualizarEstadoPedido(idPedido, estado) {
  await window.backendPedidos.actualizarEstadoPedido(idPedido, estado);
}

function renderPedidos(pedidos) {
  const body = document.getElementById("pedidosBody");
  const kpiPedidos = document.getElementById("kpiPedidos");
  const kpiTotal = document.getElementById("kpiTotal");

  if (!body || !kpiPedidos || !kpiTotal) return;

  kpiPedidos.textContent = pedidos.length;
  const total = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  kpiTotal.textContent = moneyAR(total);

  if (!pedidos.length) {
    body.innerHTML = '<tr><td colspan="8" class="muted">No hay pedidos.</td></tr>';
    return;
  }

  body.innerHTML = pedidos
    .map((pedido) => {
      const cliente = pedido.cliente || {};
      const itemsCount = Array.isArray(pedido.items) ? pedido.items.length : 0;
      const estado = safeText(pedido.estado || "nuevo");

      return `
        <tr>
          <td>${safeText(fechaAR(pedido.created_at))}</td>
          <td>${safeText(pedido.numero || "-")}</td>
          <td>${safeText(cliente.nombre || "-")}</td>
          <td>${safeText(cliente.whatsapp || "-")}</td>
          <td>${itemsCount}</td>
          <td>${safeText(moneyAR(pedido.total))}</td>
          <td>
            <select class="estado-select" data-id="${safeText(pedido.id)}">
              <option value="nuevo" ${estado === "nuevo" ? "selected" : ""}>nuevo</option>
              <option value="en_proceso" ${estado === "en_proceso" ? "selected" : ""}>en_proceso</option>
              <option value="entregado" ${estado === "entregado" ? "selected" : ""}>entregado</option>
              <option value="cancelado" ${estado === "cancelado" ? "selected" : ""}>cancelado</option>
            </select>
          </td>
          <td>
            <button type="button" class="btn-editar" data-id="${safeText(pedido.id)}" data-nombre="${safeText(cliente.nombre || "")}" data-whatsapp="${safeText(cliente.whatsapp || "")}">Editar</button>
          </td>
        </tr>
      `;
    })
    .join("");

  body.querySelectorAll(".estado-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const idPedido = select.dataset.id;
      try {
        await actualizarEstadoPedido(idPedido, select.value);
      } catch (error) {
        console.error(error);
        alert("No se pudo actualizar el estado.");
      }
    });
  });

  body.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const nombre = btn.dataset.nombre;
      const whatsapp = btn.dataset.whatsapp;
      abrirModalEditarPedido(id, nombre, whatsapp);
    });
  });
}

function construirMovimientosCatalogo(pedidos) {
  return pedidos
    .filter(p => p.estado !== "cancelado")
    .map((pedido) => {
      const cliente = pedido?.cliente?.nombre ? ` - ${pedido.cliente.nombre}` : "";
      return {
        id: `catalogo-${pedido.id}`,
        pedidoId: pedido.id,
        fecha: pedido.created_at,
        tipo: "ingreso",
        origen: "catalogo",
        descripcion: `Venta ${pedido.numero || ""}${cliente}`.trim(),
        monto: Number(pedido.total || 0),
        fuente: "catalogo",
        editable: true
      };
    });
}

function normalizarMovimientosManuales(movimientos) {
  return movimientos.map((mov) => ({
    id: mov.id,
    fecha: mov.fecha || mov.created_at,
    tipo: mov.tipo === "egreso" ? "egreso" : "ingreso",
    origen: mov.origen || "otro",
    descripcion: mov.descripcion || "Movimiento manual",
    monto: Number(mov.monto || 0),
    fuente: "manual",
    editable: true
  }));
}

function renderCaja(movimientosCombinados) {
  const body = document.getElementById("cajaBody");
  const kpiIngresos = document.getElementById("kpiIngresos");
  const kpiEgresos = document.getElementById("kpiEgresos");
  const kpiBalance = document.getElementById("kpiBalance");
  if (!body || !kpiIngresos || !kpiEgresos || !kpiBalance) return;

  const ingresos = movimientosCombinados
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const egresos = movimientosCombinados
    .filter((m) => m.tipo === "egreso")
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const balance = ingresos - egresos;

  kpiIngresos.textContent = moneyAR(ingresos);
  kpiEgresos.textContent = moneyAR(egresos);
  kpiBalance.textContent = moneyAR(balance);

  if (!movimientosCombinados.length) {
    body.innerHTML = '<tr><td colspan="7" class="muted">No hay movimientos.</td></tr>';
    return;
  }

  const ordenados = [...movimientosCombinados].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  body.innerHTML = ordenados
    .map((mov) => {
      const claseMonto = mov.tipo === "egreso" ? "monto-egreso" : "monto-ingreso";
      const signo = mov.tipo === "egreso" ? "-" : "+";
      const esCatalogo = mov.fuente === "catalogo";
      let acciones = "";
      if (mov.editable) {
        if (esCatalogo) {
          // Catalog movements - edit opens pedido modal, delete cancels pedido
          acciones = `
            <button type="button" class="btn-editar-mov-catalogo" 
              data-id="${safeText(mov.id)}"
              data-pedido-id="${safeText(mov.pedidoId)}"
              data-tipo="${safeText(mov.tipo)}"
              data-origen="${safeText(mov.origen)}"
              data-monto="${mov.monto}"
              data-descripcion="${safeText(mov.descripcion)}"
              data-fecha="${toDateTimeLocalValue(mov.fecha)}">Editar</button>
            <button type="button" class="btn-eliminar-mov-catalogo" data-id="${safeText(mov.id)}" data-pedido-id="${safeText(mov.pedidoId)}">Eliminar</button>
          `;
        } else {
          // Manual movements - use regular edit modal
          acciones = `
            <button type="button" class="btn-editar-mov" 
              data-id="${safeText(mov.id)}"
              data-tipo="${safeText(mov.tipo)}"
              data-origen="${safeText(mov.origen)}"
              data-monto="${mov.monto}"
              data-descripcion="${safeText(mov.descripcion)}"
              data-fecha="${toDateTimeLocalValue(mov.fecha)}">Editar</button>
            <button type="button" class="btn-eliminar-mov" data-id="${safeText(mov.id)}">Eliminar</button>
          `;
        }
      } else {
        acciones = '<span class="muted">Auto</span>';
      }

      return `
        <tr>
          <td>${safeText(fechaAR(mov.fecha))}</td>
          <td>${safeText(mov.tipo)}</td>
          <td>${safeText(mov.origen)}</td>
          <td>${safeText(mov.descripcion)}</td>
          <td class="${claseMonto}">${signo}${safeText(moneyAR(mov.monto))}</td>
          <td>${safeText(mov.fuente)}</td>
          <td>${acciones}</td>
        </tr>
      `;
    })
    .join("");

  body.querySelectorAll(".btn-eliminar-mov").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Eliminar este movimiento manual?")) return;
      try {
        await window.backendPedidos.eliminarMovimientoFinanciero(btn.dataset.id);
        await cargarAdmin();
      } catch (error) {
        console.error(error);
        alert("No se pudo eliminar el movimiento.");
      }
    });
  });

  // Handle catalog movement deletion (cancel the pedido)
  body.querySelectorAll(".btn-eliminar-mov-catalogo").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Esta accion cancelara el pedido asociado. Continuar?")) return;
      try {
        await window.backendPedidos.actualizarEstadoPedido(btn.dataset.pedidoId, "cancelado");
        await cargarAdmin();
      } catch (error) {
        console.error(error);
        alert("No se pudo cancelar el pedido.");
      }
    });
  });

  body.querySelectorAll(".btn-editar-mov").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const tipo = btn.dataset.tipo;
      const origen = btn.dataset.origen;
      const monto = btn.dataset.monto;
      const descripcion = btn.dataset.descripcion;
      const fecha = btn.dataset.fecha;
      abrirModalEditarMovimiento(id, tipo, origen, monto, descripcion, fecha);
    });
  });

  // Handle catalog movement edit (opens pedido edit modal)
  body.querySelectorAll(".btn-editar-mov-catalogo").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const pedidos = await window.backendPedidos.listarPedidos();
        const pedido = pedidos.find(p => p.id === btn.dataset.pedidoId);
        if (pedido && pedido.cliente) {
          abrirModalEditarPedido(pedido.id, pedido.cliente.nombre || "", pedido.cliente.whatsapp || "");
        }
      } catch (error) {
        console.error(error);
        alert("No se pudo cargar los datos del pedido.");
      }
    });
  });
}

function inicializarFormularioMovimientos() {
  const form = document.getElementById("movimientoForm");
  const fechaInput = document.getElementById("movFecha");
  if (!form || !fechaInput) return;

  fechaInput.value = toDateTimeLocalValue(new Date());

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const tipo = document.getElementById("movTipo")?.value || "ingreso";
    const origen = document.getElementById("movOrigen")?.value || "otro";
    const monto = Number(document.getElementById("movMonto")?.value || 0);
    const descripcion = (document.getElementById("movDescripcion")?.value || "").trim();
    const fecha = document.getElementById("movFecha")?.value;

    if (!(monto > 0)) {
      alert("El monto debe ser mayor a 0.");
      return;
    }
    if (!descripcion) {
      alert("Completa una descripcion.");
      return;
    }

    try {
      await window.backendPedidos.guardarMovimientoFinanciero({
        tipo,
        origen,
        monto,
        descripcion,
        fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString()
      });
      form.reset();
      fechaInput.value = toDateTimeLocalValue(new Date());
      await cargarAdmin();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el movimiento.");
    }
  });
}

// Modal functions for editing pedidos
function abrirModalEditarPedido(id, nombre, whatsapp) {
  const modal = document.getElementById("editarPedidoModal");
  if (!modal) return;
  document.getElementById("editPedidoId").value = id;
  document.getElementById("editClienteNombre").value = nombre;
  document.getElementById("editClienteWhatsapp").value = whatsapp;
  modal.style.display = "flex";
}

function cerrarModalEditarPedido() {
  const modal = document.getElementById("editarPedidoModal");
  if (modal) modal.style.display = "none";
}

function inicializarFormularioEditarPedido() {
  const form = document.getElementById("editarPedidoForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("editPedidoId").value;
    const nombre = (document.getElementById("editClienteNombre").value || "").trim();
    const whatsapp = (document.getElementById("editClienteWhatsapp").value || "").trim();

    if (!nombre) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    try {
      await window.backendPedidos.actualizarDatosCliente(id, { nombre, whatsapp });
      cerrarModalEditarPedido();
      await cargarAdmin();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar los cambios.");
    }
  });
}

// Modal functions for editing movimientos
function abrirModalEditarMovimiento(id, tipo, origen, monto, descripcion, fecha) {
  const modal = document.getElementById("editarMovimientoModal");
  if (!modal) return;
  document.getElementById("editMovimientoId").value = id;
  document.getElementById("editMovTipo").value = tipo;
  document.getElementById("editMovOrigen").value = origen;
  document.getElementById("editMovMonto").value = monto;
  document.getElementById("editMovDescripcion").value = descripcion;
  document.getElementById("editMovFecha").value = fecha;
  modal.style.display = "flex";
}

function cerrarModalEditarMovimiento() {
  const modal = document.getElementById("editarMovimientoModal");
  if (modal) modal.style.display = "none";
}

function inicializarFormularioEditarMovimiento() {
  const form = document.getElementById("editarMovimientoForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("editMovimientoId").value;
    const tipo = document.getElementById("editMovTipo").value;
    const origen = document.getElementById("editMovOrigen").value;
    const monto = Number(document.getElementById("editMovMonto").value || 0);
    const descripcion = (document.getElementById("editMovDescripcion").value || "").trim();
    const fecha = document.getElementById("editMovFecha").value;

    if (!(monto > 0)) {
      alert("El monto debe ser mayor a 0.");
      return;
    }
    if (!descripcion) {
      alert("Completa una descripcion.");
      return;
    }

    try {
      await window.backendPedidos.actualizarMovimientoFinanciero(id, {
        tipo,
        origen,
        monto,
        descripcion,
        fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString()
      });
      cerrarModalEditarMovimiento();
      await cargarAdmin();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar los cambios.");
    }
  });
}

// Close modals when clicking outside
window.addEventListener("click", (event) => {
  const modalPedido = document.getElementById("editarPedidoModal");
  const modalMovimiento = document.getElementById("editarMovimientoModal");
  if (event.target === modalPedido) {
    cerrarModalEditarPedido();
  }
  if (event.target === modalMovimiento) {
    cerrarModalEditarMovimiento();
  }
});

async function cargarAdmin() {
  const pedidosBody = document.getElementById("pedidosBody");
  const cajaBody = document.getElementById("cajaBody");

  if (pedidosBody) pedidosBody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';
  if (cajaBody) cajaBody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

  try {
    const [pedidos, movimientosManuales] = await Promise.all([
      window.backendPedidos.listarPedidos(),
      window.backendPedidos.listarMovimientosFinancieros()
    ]);

    const pedidosLista = Array.isArray(pedidos) ? pedidos : [];
    const manualLista = Array.isArray(movimientosManuales) ? movimientosManuales : [];

    renderPedidos(pedidosLista);

    const autoCatalogo = construirMovimientosCatalogo(pedidosLista);
    const manualNormalizados = normalizarMovimientosManuales(manualLista);
    renderCaja([...autoCatalogo, ...manualNormalizados]);
  } catch (error) {
    console.error(error);
    if (pedidosBody) pedidosBody.innerHTML = '<tr><td colspan="8">Error al cargar pedidos.</td></tr>';
    if (cajaBody) cajaBody.innerHTML = '<tr><td colspan="7">Error al cargar movimientos.</td></tr>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn?.addEventListener("click", cargarAdmin);
  inicializarFormularioMovimientos();
  inicializarFormularioEditarPedido();
  inicializarFormularioEditarMovimiento();
  cargarAdmin();
});
