export function enmascarar(valor: string): string {
  // Extraer posiciones y valores de caracteres alfanuméricos
  const alphanumericPositions: number[] = [];

  for (let i = 0; i < valor.length; i++) {
    if (/[a-zA-Z0-9]/.test(valor.charAt(i))) {
      alphanumericPositions.push(i);
    }
  }

  // Si no hay caracteres alfanuméricos, devolver el valor original
  if (alphanumericPositions.length === 0) {
    return valor;
  }

  // Determinar qué posiciones enmascarar
  const countAlphanumeric = alphanumericPositions.length;
  const toMask = new Set<number>();

  if (countAlphanumeric <= 3) {
    // Si 3 o menos: enmascarar todos salvo el primero
    for (let i = 1; i < countAlphanumeric; i++) {
      const pos = alphanumericPositions[i];
      if (pos !== undefined) toMask.add(pos);
    }
  } else {
    // Si más de 3: conservar 1er, 2do y último; enmascarar el resto
    for (let i = 2; i < countAlphanumeric - 1; i++) {
      const pos = alphanumericPositions[i];
      if (pos !== undefined) toMask.add(pos);
    }
  }

  // Reconstruir la cadena
  let result = '';
  for (let i = 0; i < valor.length; i++) {
    if (toMask.has(i)) {
      result += '*';
    } else {
      result += valor.charAt(i);
    }
  }

  return result;
}
