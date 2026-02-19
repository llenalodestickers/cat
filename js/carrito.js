let carrito = [];
const WHATSAPP_NEGOCIO = "541173633880";
let toastAgregar = null;
let toastTimer = null;
let toastProductoActivo = null;

function agregarAlCarrito(idProducto) {
  const producto = productos.find((p) => p.id === idProducto);
  if (!producto) return;

  const itemExistente = carrito.find((item) => item.id === idProducto);

  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen,
      precio: producto.precio,
      cantidad: 1
    });
  }

  actualizarCarritoUI();
  mostrarToastAgregar(producto.id);
}

function actualizarCarritoUI() {
  const cartCount = document.getElementById("cartCount");
  const cartCountBadge = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrecio = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
    if (totalItems > 0) {
      cartCount.classList.remove("hidden");
    } else {
      cartCount.classList.add("hidden");
    }
  }

  cartItems.innerHTML = carrito
    .map(
      (item) => `
      <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <img class="w-16 h-16 object-cover rounded" src="${item.imagen}" alt="${item.nombre}">
        <div class="flex-1">
          <span class="block font-semibold text-sm">${item.nombre}</span>
          <span class="text-sm text-gray-500">${item.cantidad} x ${item.precio}</span>
        </div>
        <button class="text-red-500 hover:text-red-700 font-semibold text-sm" onclick="quitarDelCarrito('${item.id}')">Quitar</button>
      </div>
    `
    )
    .join("");

  cartTotal.textContent = totalPrecio;

  if (toastProductoActivo) {
    actualizarCantidadToast(toastProductoActivo);
  }
}

function quitarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id !== idProducto);
  actualizarCarritoUI();
}

function vaciarCarrito() {
  carrito = [];
  actualizarCarritoUI();
  ocultarToastAgregar();
}

function cerrarCarrito() {
  document.getElementById("cart").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
}

function obtenerItemCarrito(idProducto) {
  return carrito.find((item) => item.id === idProducto);
}

function cambiarCantidadItem(idProducto, delta) {
  const item = obtenerItemCarrito(idProducto);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter((carritoItem) => carritoItem.id !== idProducto);
  }

  actualizarCarritoUI();
}

function construirToastAgregar() {
  if (toastAgregar) return toastAgregar;

  const toast = document.createElement("div");
  toast.id = "toastAgregar";
  toast.className = "toast-agregar";
  toast.innerHTML = `
    <img class="toast-agregar-thumb" src="" alt="">
    <div class="toast-agregar-info">
      <span class="toast-agregar-label">Agregado al pedido</span>
      <span class="toast-agregar-nombre"></span>
      <span class="toast-agregar-precio"></span>
    </div>
    <div class="toast-agregar-cantidad">
      <button type="button" class="toast-agregar-btn" data-action="restar" aria-label="Quitar uno">-</button>
      <span class="toast-agregar-numero">1</span>
      <button type="button" class="toast-agregar-btn" data-action="sumar" aria-label="Agregar uno">+</button>
    </div>
  `;

  toast.addEventListener("click", (event) => {
    const boton = event.target.closest(".toast-agregar-btn");
    if (!boton || !toastProductoActivo) return;

    if (boton.dataset.action === "sumar") {
      cambiarCantidadItem(toastProductoActivo, 1);
      programarCierreToast();
      return;
    }

    cambiarCantidadItem(toastProductoActivo, -1);
    const itemActual = obtenerItemCarrito(toastProductoActivo);
    if (!itemActual) {
      ocultarToastAgregar();
      return;
    }
    programarCierreToast();
  });

  document.body.appendChild(toast);
  toastAgregar = toast;
  return toastAgregar;
}

function actualizarCantidadToast(idProducto) {
  if (!toastAgregar || toastProductoActivo !== idProducto) return;
  const item = obtenerItemCarrito(idProducto);
  if (!item) {
    ocultarToastAgregar();
    return;
  }
  const cantidadEl = toastAgregar.querySelector(".toast-agregar-numero");
  if (cantidadEl) {
    cantidadEl.textContent = item.cantidad;
  }
}

function programarCierreToast() {
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    ocultarToastAgregar();
  }, 4500);
}

function ocultarToastAgregar() {
  clearTimeout(toastTimer);
  toastTimer = null;
  toastProductoActivo = null;
  if (toastAgregar) {
    toastAgregar.classList.remove("show");
  }
}

function mostrarToastAgregar(idProducto) {
  const item = obtenerItemCarrito(idProducto);
  if (!item) return;

  const toast = construirToastAgregar();
  toastProductoActivo = idProducto;

  const thumb = toast.querySelector(".toast-agregar-thumb");
  const nombre = toast.querySelector(".toast-agregar-nombre");
  const precio = toast.querySelector(".toast-agregar-precio");
  const cantidad = toast.querySelector(".toast-agregar-numero");

  if (thumb) {
    thumb.src = item.imagen;
    thumb.alt = item.nombre;
  }
  if (nombre) {
    nombre.textContent = item.nombre;
  }
  if (precio) {
    precio.textContent = `$${item.precio} c/u`;
  }
  if (cantidad) {
    cantidad.textContent = item.cantidad;
  }

  toast.classList.add("show");
  programarCierreToast();
}

function normalizarTelefono(valor) {
  return valor.replace(/\D/g, "");
}

function obtenerUrlImagenCompartible(pathImagen) {
  try {
    return new URL(pathImagen, window.location.href).href;
  } catch (error) {
    return pathImagen;
  }
}

function construirMensajePedido(nombre, whatsappCliente, numeroPedido) {
  const lineas = [
    "Hola, quiero hacer este pedido:",
    ""
  ];

  carrito.forEach((item) => {
    lineas.push(`- ${item.nombre} x${item.cantidad} ($${item.precio} c/u)`);
    lineas.push(`  Imagen: ${obtenerUrlImagenCompartible(item.imagen)}`);
  });

  const totalPrecio = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  lineas.push("");
  if (numeroPedido) {
    lineas.push(`Pedido: ${numeroPedido}`);
  }
  lineas.push(`Total: $${totalPrecio}`);
  lineas.push(`Nombre: ${nombre}`);
  lineas.push(`WhatsApp: ${whatsappCliente}`);
  lineas.push("");
  lineas.push("Pago por transferencia:");
  lineas.push("Alias: llenalodestickers");

  return lineas.join("\n");
}

function generarNumeroPedido() {
  const ahora = new Date();
  const yy = String(ahora.getFullYear()).slice(-2);
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  const hh = String(ahora.getHours()).padStart(2, "0");
  const mi = String(ahora.getMinutes()).padStart(2, "0");
  const ss = String(ahora.getSeconds()).padStart(2, "0");
  return `LLD-${yy}${mm}${dd}-${hh}${mi}${ss}`;
}

function obtenerDatosCliente() {
  const nombreInput = document.getElementById("clienteNombre");
  const whatsappInput = document.getElementById("clienteWhatsapp");
  const nombre = (nombreInput?.value || "").trim();
  const whatsappCliente = normalizarTelefono((whatsappInput?.value || "").trim());
  return { nombre, whatsappCliente };
}

function cargarImagenComoDataURL(src) {
  return fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo cargar la imagen");
      }
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

function cargarScriptExterno(src) {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${src}"]`);
    if (existente) {
      if (window.jspdf?.jsPDF) {
        resolve();
        return;
      }
      existente.addEventListener("load", () => resolve(), { once: true });
      existente.addEventListener("error", () => reject(new Error("Error cargando script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Error cargando script"));
    document.head.appendChild(script);
  });
}

async function asegurarJsPdfCargado() {
  if (window.jspdf?.jsPDF) return true;

  const cdnOpciones = [
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
  ];

  for (const url of cdnOpciones) {
    try {
      await cargarScriptExterno(url);
      if (window.jspdf?.jsPDF) return true;
    } catch (error) {
      // Intenta el siguiente CDN.
    }
  }

  return false;
}

async function descargarPedidoPDF() {
  if (carrito.length === 0) {
    alert("Tu carrito esta vacio.");
    return;
  }

  const { nombre, whatsappCliente } = obtenerDatosCliente();
  if (!nombre || !whatsappCliente) {
    alert("Completa nombre y WhatsApp para descargar el PDF.");
    return;
  }

  const libreriaOk = await asegurarJsPdfCargado();
  const jsPDF = window.jspdf?.jsPDF;
  if (!libreriaOk || !jsPDF) {
    alert("No se pudo cargar la libreria PDF. Verifica tu conexion a internet y vuelve a intentar.");
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margenX = 40;
  let y = 48;
  const numeroPedido = generarNumeroPedido();
  const fecha = new Date().toLocaleString("es-AR");

  try {
    const logoDataUrl = await cargarImagenComoDataURL("images/logo.png");
    doc.addImage(logoDataUrl, "PNG", margenX, y - 12, 46, 46);
  } catch (error) {
    // Si falla el logo, el PDF igualmente se genera.
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LlenaloD Stickers", margenX + 58, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Detalle de pedido (tipo factura)", margenX + 58, y + 26);
  doc.text(`Pedido: ${numeroPedido}`, 555, y + 10, { align: "right" });
  doc.text(`Fecha: ${fecha}`, 555, y + 26, { align: "right" });

  y += 62;
  doc.setDrawColor(220, 220, 220);
  doc.line(margenX, y, 555, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente", margenX, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${nombre}`, margenX, y);
  y += 14;
  doc.text(`WhatsApp: ${whatsappCliente}`, margenX, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text("Detalle", margenX, y);
  y += 16;

  doc.setFontSize(9);
  doc.text("Producto", margenX, y);
  doc.text("Cant.", 340, y);
  doc.text("Unit.", 410, y);
  doc.text("Subtotal", 555, y, { align: "right" });
  y += 10;
  doc.line(margenX, y, 555, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let total = 0;
  carrito.forEach((item) => {
    const subtotal = item.cantidad * item.precio;
    total += subtotal;

    const nombreProducto = doc.splitTextToSize(item.nombre, 260);
    doc.text(nombreProducto, margenX, y);
    doc.text(String(item.cantidad), 340, y);
    doc.text(`$${item.precio}`, 410, y);
    doc.text(`$${subtotal}`, 555, y, { align: "right" });

    const lineasUsadas = Array.isArray(nombreProducto) ? nombreProducto.length : 1;
    y += Math.max(16, lineasUsadas * 12 + 4);
  });

  y += 6;
  doc.line(margenX, y, 555, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`TOTAL: $${total}`, 555, y, { align: "right" });

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const notaPago = [
    "Metodo de pago:",
    "Transferencia bancaria.",
    "Alias para transferir: llenalodestickers"
  ];
  doc.text(notaPago, margenX, y);

  y += 48;
  doc.setTextColor(95, 95, 95);
  doc.setFontSize(9);
  doc.text("Gracias por tu compra. Este comprobante resume el pedido enviado.", margenX, y);

  doc.save(`pedido-${numeroPedido}.pdf`);
}

async function enviarPedidoWhatsApp(event) {
  event.preventDefault();

  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const nombreInput = document.getElementById("clienteNombre");
  const whatsappInput = document.getElementById("clienteWhatsapp");
  const nombre = nombreInput.value.trim();
  const whatsappCliente = normalizarTelefono(whatsappInput.value);

  if (!nombre || !whatsappCliente) {
    alert("Completa nombre y WhatsApp para enviar el pedido.");
    return;
  }

  const numeroPedido = generarNumeroPedido();
  if (window.backendPedidos?.guardarPedidoCompletoEnNube) {
    const guardado = await window.backendPedidos.guardarPedidoCompletoEnNube({
      nombre,
      whatsappCliente,
      carrito,
      numeroPedido
    });

    if (!guardado.ok && guardado.reason !== "not_configured") {
      console.error("No se pudo guardar el pedido en la base de datos.", guardado.error);
      const detalle = guardado?.error?.message ? `\nDetalle: ${guardado.error.message}` : "";
      alert(`No se pudo guardar el pedido en la base. Se abrira WhatsApp igual.${detalle}`);
    }
  }

  const mensaje = construirMensajePedido(nombre, whatsappCliente, numeroPedido);
  const url = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.getElementById("checkoutForm");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  construirToastAgregar();

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", enviarPedidoWhatsApp);
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", vaciarCarrito);
  }

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", descargarPedidoPDF);
  }
});
