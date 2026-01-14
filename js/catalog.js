import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // VARIABLES GLOBALES
  // ============================================================

  let peliculas = [];          // Películas reales desde Firestore
  let peliculasFiltradas = []; // Resultado tras filtros/búsqueda/ordenación
 


  const catalogo = document.getElementById("catalogo");
  const inputBusqueda = document.getElementById("input-busqueda");

  const filtroGenero = document.getElementById("filtro-genero");
  const filtroFormato = document.getElementById("filtro-formato");
  const filtroDirector = document.getElementById("filtro-director");
  const filtroAño = document.getElementById("filtro-año");
  const ordenarPor = document.getElementById("ordenar-por");

  const contadorPeliculas = document.getElementById("contador-peliculas");
  const btnCambiarVista = document.getElementById("btn-cambiar-vista");

  let vistaActual = "lista"; // "lista" o "cuadricula"


  // ============================================================
  // MODO OSCURO (persistente)
  // ============================================================

  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado === "oscuro") {
    document.body.classList.add("oscuro");
  }


  // ============================================================
  // CARGA REAL DESDE FIRESTORE
  // ============================================================

  async function cargarPeliculas() {
    try {
      const querySnapshot = await getDocs(collection(db, "peliculas"));

      peliculas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      peliculasFiltradas = [...peliculas];

      rellenarFiltros();
      renderizarCatalogo();

    } catch (error) {
      console.error("Error al cargar películas:", error);
      alert("Error al cargar el catálogo.");
    }
  }


  // ============================================================
  // RELLENAR FILTROS DINÁMICAMENTE
  // ============================================================

  function rellenarFiltros() {
    const generos = new Set();
    const formatos = new Set();
    const directores = new Set();
    const años = new Set();

    peliculas.forEach(p => {
      p.generos.forEach(g => generos.add(g));
      p.director.forEach(d => directores.add(d));
      formatos.add(p.formato);
      años.add(p.año);
    });

    rellenarSelect(filtroGenero, generos);
    rellenarSelect(filtroFormato, formatos);
    rellenarSelect(filtroDirector, directores);
    rellenarSelect(filtroAño, años);
  }

  function rellenarSelect(select, valores) {
    valores = Array.from(valores).sort();
    valores.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }


  // ============================================================
  // BÚSQUEDA
  // ============================================================

  inputBusqueda.addEventListener("input", aplicarFiltros);

  function coincideBusqueda(pelicula, texto) {
    texto = texto.toLowerCase();

    return (
      pelicula.titulo.toLowerCase().includes(texto) ||
      pelicula.año.toString().includes(texto) ||
      pelicula.director.some(d => d.toLowerCase().includes(texto)) ||
      pelicula.generos.some(g => g.toLowerCase().includes(texto))
    );
  }


  // ============================================================
  // FILTROS
  // ============================================================

  filtroGenero.addEventListener("change", aplicarFiltros);
  filtroFormato.addEventListener("change", aplicarFiltros);
  filtroDirector.addEventListener("change", aplicarFiltros);
  filtroAño.addEventListener("change", aplicarFiltros);
  ordenarPor.addEventListener("change", aplicarFiltros);

  function aplicarFiltros() {
    const texto = inputBusqueda.value.trim().toLowerCase();

    peliculasFiltradas = peliculas.filter(p => {

      if (texto && !coincideBusqueda(p, texto)) return false;

      if (filtroGenero.value && !p.generos.includes(filtroGenero.value)) return false;

      if (filtroFormato.value && p.formato !== filtroFormato.value) return false;

      if (filtroDirector.value && !p.director.includes(filtroDirector.value)) return false;

      if (filtroAño.value && p.año.toString() !== filtroAño.value) return false;

      return true;
    });

    ordenarPeliculas();
    renderizarCatalogo();
  }


  // ============================================================
  // ORDENACIÓN
  // ============================================================

  function ordenarPeliculas() {
    const criterio = ordenarPor.value;

    peliculasFiltradas.sort((a, b) => {
      if (criterio === "titulo") return a.titulo.localeCompare(b.titulo);
      if (criterio === "año") return a.año - b.año;
      if (criterio === "formato") return a.formato.localeCompare(b.formato);
    });
  }


  // ============================================================
  // RENDERIZADO DEL CATÁLOGO
  // ============================================================

  function renderizarCatalogo() {
    catalogo.innerHTML = "";

    peliculasFiltradas.forEach(p => {
      const card = vistaActual === "lista" ?
         crearCardLista(p)
        : crearCardCuadricula(p);

      catalogo.appendChild(card);
    });

    contadorPeliculas.textContent = `Total: ${peliculasFiltradas.length} películas`;
  }


  // --- Vista lista ---
  function crearCardLista(p) {
    const div = document.createElement("div");
    div.className = "pelicula-lista";
    div.addEventListener("click", () => abrirDetalle(p.id));

    div.innerHTML = `
      <img src="${p.portada}" alt="${p.titulo}">
      <div class="info">
        <span class="titulo">${p.titulo}</span>
        <span class="detalle">${p.año} • ${p.formato}</span>
      </div>
    `;

    return div;
  }

  // --- Vista cuadrícula ---
  function crearCardCuadricula(p) {
    const div = document.createElement("div");
    div.className = "pelicula-cuadricula";
    div.addEventListener("click", () => abrirDetalle(p.id));

    div.innerHTML = `
      <img src="${p.portada}" alt="${p.titulo}">
      <span class="titulo">${p.titulo}</span>
      <span class="detalle">${p.año}</span>
    `;

    return div;
  }


  // ============================================================
  // ABRIR DETALLE
  // ============================================================

  function abrirDetalle(id) {
    window.location.href = `movie.html?id=${id}`;
  }


  // ============================================================
  // CAMBIO DE VISTA (lista/cuadrícula)
  // ============================================================
btnCambiarVista.style.position = "fixed";
btnCambiarVista.style.left = "calc(100% - 80px)";
btnCambiarVista.style.top = "calc(100% - 80px)";
  
btnCambiarVista.addEventListener("click", () => {
  if (movido) return; // si se arrastró, NO cambiar vista

  vistaActual = vistaActual === "lista" ? "cuadricula" : "lista";

  catalogo.classList.toggle("vista-lista");
  catalogo.classList.toggle("vista-cuadricula");

  renderizarCatalogo();
});


  // ============================================================
  // BOTÓN FLOTANTE ARRASTRABLE
  // ============================================================
   let movido = false;
  let arrastrando = false;
  let offsetX = 0;
  let offsetY = 0;

 btnCambiarVista.addEventListener("mousedown", e => {
  arrastrando = true;
  movido = false;
  offsetX = e.clientX - btnCambiarVista.offsetLeft;
  offsetY = e.clientY - btnCambiarVista.offsetTop;
});

document.addEventListener("mousemove", e => {
  if (!arrastrando) return;

  movido = true;

  btnCambiarVista.style.left = `${e.clientX - offsetX}px`;
  btnCambiarVista.style.top = `${e.clientY - offsetY}px`;
  btnCambiarVista.style.position = "fixed";
});

document.addEventListener("mouseup", () => {
  arrastrando = false;
});


  // ============================================================
  // INICIO
  // ============================================================

  cargarPeliculas();


});

