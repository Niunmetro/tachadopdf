import { renderResumen } from './render';

function bootstrap(): void {
  const resultado = document.getElementById('cp-resultado');
  if (!resultado) return;
  renderResumen(resultado, { totalDatos: 0, categorias: [], paginasEscaneadas: [], veredicto: '' });
}

bootstrap();
