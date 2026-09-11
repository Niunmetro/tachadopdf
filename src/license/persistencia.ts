// Recuerda la clave de licencia Pro en el navegador para que un cliente que pagó no tenga que
// reintroducirla en cada visita (fricción real en la ruta del dinero). Es una COMODIDAD, no una
// función crítica: si `localStorage` no está disponible (modo privado, almacenamiento deshabilitado)
// se degrada en silencio y la app sigue funcionando igual, solo que sin recordar la clave.
//
// PRIVACIDAD: la clave es del PROPIO usuario, en SU dispositivo, y NUNCA se transmite salvo a Gumroad
// para verificarla — el único egress permitido, ya declarado. Guardarla en local no hace que «salga»
// del navegador ningún dato nuevo; el documento sigue sin salir jamás.
const CLAVE_ALMACEN = 'tachadopdf.licencia';

/** Lee la clave de licencia recordada. Cadena vacía si no hay ninguna o si el almacén falla. */
export function leerClaveLicencia(almacen: Pick<Storage, 'getItem'> = localStorage): string {
  try {
    return almacen.getItem(CLAVE_ALMACEN) ?? '';
  } catch {
    return '';
  }
}

/** Recuerda la clave de licencia. No lanza nunca: si el almacén falla, no se guarda y ya está. */
export function guardarClaveLicencia(
  clave: string,
  almacen: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    almacen.setItem(CLAVE_ALMACEN, clave);
  } catch {
    // localStorage puede lanzar (modo privado / almacenamiento deshabilitado). La persistencia es
    // opcional: se ignora el fallo y la app continúa sin recordar la clave.
  }
}
