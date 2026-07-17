// Publica el sitio en GitHub Pages (rama gh-pages), con dotfiles (.nojekyll y, si procede, CNAME).
// Uso: npm run deploy-pages          -> hoy: se sirve en https://niunmetro.github.io/tachadopdf/
//      DOMINIO=1 npm run deploy-pages -> cuando el DNS de www.tachadopdf.com apunte a GitHub
//                                        (ver MONETIZACION.md): base '/' + CNAME del dominio.
// OJO: no actives DOMINIO=1 antes de que el DNS resuelva. GitHub redirige la URL de Pages al
// dominio del CNAME, así que un dominio sin DNS deja el sitio INACCESIBLE (comprobado el 17-07).
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { publish } from 'gh-pages';

const conDominio = process.env.DOMINIO === '1';
const env = { ...process.env, VITE_BASE: conDominio ? '/' : '/tachadopdf/' };

console.log(`Build (base=${env.VITE_BASE}) ...`);
execFileSync('npm', ['run', 'build'], { stdio: 'inherit', env, shell: true });

if (conDominio) {
  writeFileSync('dist/CNAME', 'www.tachadopdf.com\n');
  console.log('CNAME incluido: www.tachadopdf.com');
} else {
  rmSync('dist/CNAME', { force: true });
}

console.log('Publicando dist/ en la rama gh-pages ...');
publish('dist', { dotfiles: true }, (err) => {
  if (err) {
    console.error('Fallo al publicar en gh-pages:', err.message);
    process.exit(1);
  }
  console.log('Publicado.');
});
