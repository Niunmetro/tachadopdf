// Publica el sitio en GitHub Pages (rama gh-pages), con dotfiles (.nojekyll y CNAME).
// Desde el 21-07-2026 el dominio www.tachadopdf.com está ACTIVO (DNS ok + CNAME vinculado):
// el modo dominio es el DEFAULT. Publicar sin CNAME desvincularía el dominio de GitHub Pages
// y tumbaría la web entera (404 en todo) — solo usar DOMINIO=0 si el DNS deja de resolver.
// Uso: npm run deploy-pages           -> base '/' + CNAME www.tachadopdf.com (normal)
//      DOMINIO=0 npm run deploy-pages -> emergencia sin dominio: base '/tachadopdf/', sin CNAME.
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { publish } from 'gh-pages';

const conDominio = process.env.DOMINIO !== '0';
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
