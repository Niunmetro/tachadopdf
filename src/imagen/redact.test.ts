import { describe, expect, it } from 'vitest';
import { escalar, recortar, regionDesdePuntos } from './redact';

describe('geometría del tachado de imágenes', () => {
  describe('regionDesdePuntos', () => {
    it('normaliza un arrastre de arriba-izquierda a abajo-derecha', () => {
      expect(regionDesdePuntos(10, 20, 40, 60)).toEqual({ x: 10, y: 20, ancho: 30, alto: 40 });
    });

    it('normaliza un arrastre invertido a dimensiones positivas', () => {
      expect(regionDesdePuntos(40, 60, 10, 20)).toEqual({ x: 10, y: 20, ancho: 30, alto: 40 });
    });
  });

  describe('recortar', () => {
    it('deja intacta una región enteramente dentro de la imagen', () => {
      expect(recortar({ x: 10, y: 10, ancho: 20, alto: 20 }, 100, 100)).toEqual({
        x: 10,
        y: 10,
        ancho: 20,
        alto: 20,
      });
    });

    it('recorta una región que se sale por la derecha y por abajo', () => {
      expect(recortar({ x: 90, y: 90, ancho: 50, alto: 50 }, 100, 100)).toEqual({
        x: 90,
        y: 90,
        ancho: 10,
        alto: 10,
      });
    });

    it('recorta una región que empieza en negativo', () => {
      expect(recortar({ x: -20, y: -10, ancho: 40, alto: 30 }, 100, 100)).toEqual({
        x: 0,
        y: 0,
        ancho: 20,
        alto: 20,
      });
    });

    // El fallo peligroso: creer tachada una zona que no cubre ni un píxel. Un clic sin arrastrar o
    // un arrastre entero fuera de la imagen NO deben añadir región.
    it('descarta un clic sin arrastrar (ni un píxel)', () => {
      expect(recortar({ x: 50, y: 50, ancho: 0, alto: 0 }, 100, 100)).toBeNull();
    });

    it('descarta un arrastre enteramente fuera de la imagen', () => {
      expect(recortar({ x: 200, y: 200, ancho: 30, alto: 30 }, 100, 100)).toBeNull();
    });
  });

  describe('escalar', () => {
    it('multiplica todos los componentes por el factor (pantalla → imagen)', () => {
      expect(escalar({ x: 5, y: 10, ancho: 20, alto: 30 }, 2)).toEqual({
        x: 10,
        y: 20,
        ancho: 40,
        alto: 60,
      });
    });
  });
});
