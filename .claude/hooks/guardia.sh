#!/usr/bin/env bash
# guardia.sh — Hook PreToolUse de TachadoPDF.
# Bloquea (exit 2) comandos y ediciones peligrosas ANTES de que se ejecuten.
# Recibe JSON por stdin con tool_name y tool_input. Usa Node para parsear
# (Node siempre existe donde corre Claude Code). Probado en bash: WSL, Git Bash,
# macOS y Linux. Si en tu Windows los hooks no disparan, ejecuta Claude Code
# bajo WSL o revisa /hooks y la doc oficial (code.claude.com/docs).
# Ajusta la lista de patrones a tu repo tras la auditoría.

INPUT="$(cat)"

OBJETIVO="$(printf '%s' "$INPUT" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  try{
    const j=JSON.parse(s);
    const t=j.tool_input||{};
    console.log([t.command,t.file_path].filter(Boolean).join(" \n "));
  }catch(e){console.log("");}
});')"

[ -z "$OBJETIVO" ] && exit 0

bloquear () { echo "BLOQUEADO POR GUARDIA: $1. Esta acción está prohibida por las reglas del proyecto (ver CLAUDE.md). Busca una alternativa segura o pide a Ángel la etiqueta APROBADO-ANGEL." >&2; exit 2; }

# --- Archivos de secretos: ni leer, ni escribir, ni mover (se permite .env.example) ---
if printf '%s' "$OBJETIVO" | grep -Eq '\.env(\.local|\.production|\.development)?([^.a-zA-Z]|$)' \
   && ! printf '%s' "$OBJETIVO" | grep -q '\.env\.example'; then
  bloquear "acceso a archivos .env (secretos)"
fi

# --- Destrucción de archivos ---
printf '%s' "$OBJETIVO" | grep -Eq 'rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)' && bloquear "rm -rf (borrado recursivo forzado)"

# --- Git peligroso: nada directo a main, nada de force ni reescritura ---
printf '%s' "$OBJETIVO" | grep -Eq 'git[[:space:]]+push[[:space:]].*(--force|-f([[:space:]]|$))' && bloquear "git push --force"
printf '%s' "$OBJETIVO" | grep -Eq 'git[[:space:]]+push[[:space:]]+([^ ]+[[:space:]]+)?(main|master)([[:space:]]|$)' && bloquear "push directo a main (usa una rama y un PR)"
printf '%s' "$OBJETIVO" | grep -Eq 'git[[:space:]]+reset[[:space:]]+--hard' && bloquear "git reset --hard"

# --- Base de datos: sentencias destructivas fuera de migraciones aprobadas ---
printf '%s' "$OBJETIVO" | grep -Eiq '(drop[[:space:]]+(table|database|schema)|truncate[[:space:]]+table)' && bloquear "sentencia SQL destructiva (DROP/TRUNCATE)"
printf '%s' "$OBJETIVO" | grep -Eiq 'delete[[:space:]]+from[[:space:]]+[a-z_"]+[[:space:]]*(;|$)' && bloquear "DELETE sin WHERE"

# --- Secretos por consola ---
printf '%s' "$OBJETIVO" | grep -Eq '(sk_live|whsec_|service_role)' && bloquear "manipulación de claves sensibles en un comando"

exit 0
