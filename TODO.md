# TODO: Hacer el programa responsivo para celulares

## Información recopilada
- El sitio tiene un banner advirtiendo contra el uso en móviles, pero ahora queremos hacerlo responsivo.
- El CSS usa anchos fijos como `--day-cell-w: 220px`, lo que causa problemas en pantallas pequeñas.
- El layout principal usa grid y flex, pero no se adapta a móviles.
- Elementos como el header, stats, calendario y tarjetas de exámenes necesitan ajustes para pantallas pequeñas.

## Plan
- [x] Quitar o ajustar el banner de advertencia para móviles en `index.html`.
- [x] Agregar media queries en `main.css` para pantallas pequeñas (max-width: 768px):
  - Cambiar `--day-cell-w` a un valor relativo o mínimo.
  - Apilar elementos verticalmente (e.g., header, stats).
  - Reducir tamaños de fuentes, paddings y márgenes.
  - Ajustar el calendario para que las celdas se adapten mejor.
  - Hacer las tarjetas de exámenes más compactas.
- [x] Ajustar el layout principal para móviles: cambiar grid a flex o ajustar columnas.

## Pasos de seguimiento
- [x] Probar el sitio en un simulador de móvil o navegador con herramientas de desarrollo.
- [x] Verificar que el calendario, tarjetas y navegación funcionen bien en pantallas pequeñas.
- [x] Ajustar si es necesario basado en pruebas.

# TODO: Cambiar texto a h2 y agregar botón al manual

## Información recopilada
- Cambiar "Manual de uso del calendario" de p a h2.
- Agregar botón "visualizar manual" que abre el enlace en nueva pestaña.

## Plan
- [x] Editar intro.html para reemplazar el body: agregar h1 con el título, el banner, y el footer.
- [x] Mantener el head y el script.
- [x] Agregar segundo banner con texto "Manual de uso del calendario" después del primer banner.
- [x] Reestructurar body con div.app, header, main (grid de banners), footer.
- [x] Agregar onclick="window.location.href='https://forms.gle/u31wmK7mqzjU8bKB9'" al botón.
- [x] Agregar estilos responsivos en main.css para .banners-grid, .proposal-banner, .manual-banner, etc.
- [x] Cambiar p a h2 en manual-banner.
- [x] Agregar botón "visualizar manual" con onclick="window.open('https://www.canva.com/design/DAG4oSe4S7Y/2FCDLVtImaN98LY-G1POlA/view?utm_content=DAG4oSe4S7Y&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h115f2402d6', '_blank')".

## Pasos de seguimiento
- [ ] Verificar que el h2 se muestre y el botón abra el enlace en nueva pestaña.
