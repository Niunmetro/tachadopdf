// Publica en GitHub Pages: build con base=/tachadopdf/ (Pages sirve bajo /<repo>/) y sube dist/
// a la rama gh-pages, incluyendo dotfiles (.nojekyll para que Pages no lo procese con Jekyll).
// Uso: npm run deploy-pages  (requiere un remoto 'origin' ya configurado — ver MONETIZACION.md).
import { execFileSync } from 'node:child_process';
import { publish } from 'gh-pages';

const env = { ...process.env, VITE_BASE: '/tachadopdf/' };
console.log('Build con base=/tachadopdf/ ...');
execFileSync('npm', ['run', 'build'], { stdio: 'inherit', env, shell: true });

console.log('Publicando dist/ en la rama gh-pages ...');
publish('dist', { dotfiles: true }, (err) => {
  if (err) {
    console.error('Fallo al publicar en gh-pages:', err.message);
    process.exit(1);
  }
  console.log('Publicado. Activa Pages en Settings -> Pages -> rama gh-pages.');
});
