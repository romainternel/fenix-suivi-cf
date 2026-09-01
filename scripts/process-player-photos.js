// Script one-shot — traite les photos brutes de PHOTO JOUEURS/ vers assets/photos/
// (portrait = ré-encodage WebP sans redimensionnement, corps entier = redimensionné à 2000px de haut)
// Pas destiné à être commité comme partie du produit — utilitaire de préparation d'assets.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_PORTRAIT = 'PHOTO JOUEURS';
const SRC_CORPS = 'PHOTO JOUEURS/corps entier';
const OUT_DIR = 'assets/photos';

// clé canonique (JOUEURS_TERRAIN.nom, vérifiée en direct dans l'app) -> {portraitFile, corpsFile}
const PAIRS = {
    'Antonin.V': { portrait: 'Antonin.V.png', corps: 'Antonin.V.png' },
    'Enzo.D':    { portrait: 'Enzo.D.png',    corps: 'Enzo.D.png' },
    'Gabin.S':   { portrait: 'Gabin.S.png',   corps: 'Gabin.S.png' },
    'Hailé':     { portrait: 'Haïlé.G.png',   corps: 'Hailé.G.png' },
    'Idris.F':   { portrait: 'Idris.F.png',   corps: 'Idris.F.png' },
    'Isaac.M':   { portrait: 'Isaac.M.png',   corps: 'Isaac.M.png' },
    'Issa.S':    { portrait: 'Issa.s.png',    corps: 'Issa.S.png' },
    'Jules.G':   { portrait: 'Jules.G.png',   corps: 'Jules.G.png' },
    'Julien.L':  { portrait: 'Julien.L.png',  corps: 'Julien.L.png' },
    'Leni.A':    { portrait: 'Leni.A.png',    corps: 'Leni.png' },
    'Loévan.R':  { portrait: 'Loevan.R.png',  corps: 'Loevan.R.png' },
    'Louis.M':   { portrait: 'Louis.M.png',   corps: 'Louis.M.png' },
    'Lucas.G':   { portrait: 'Lucas.G.png',   corps: 'Lucas.G.png' },
    'Lukas.J':   { portrait: 'Lukas.J-A.png', corps: 'Lukas.J.png' },
    'Marius.C':  { portrait: 'Marius.C.png',  corps: 'Marius.C.png' },
    'Mattéo.A':  { portrait: 'Mattéo.A.png',  corps: 'Mattéo.A.png' },
    'Noah.O':    { portrait: 'Noah.O.png',    corps: 'Noah.O.png' },
    'Siméo.R':   { portrait: 'Siméo.R.png',   corps: 'Siméo.R.png' },
};

function slugify(key) {
    return key
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function main() {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    const results = [];

    for (const [key, files] of Object.entries(PAIRS)) {
        const slug = slugify(key);

        const portraitSrc = path.join(SRC_PORTRAIT, files.portrait);
        const portraitOut = path.join(OUT_DIR, `${slug}-portrait.webp`);
        const srcMetaP = fs.statSync(portraitSrc).size;
        await sharp(portraitSrc).webp({ quality: 92, alphaQuality: 100 }).toFile(portraitOut);
        const outSizeP = fs.statSync(portraitOut).size;

        const corpsSrc = path.join(SRC_CORPS, files.corps);
        const corpsOut = path.join(OUT_DIR, `${slug}-corps.webp`);
        const srcMetaC = fs.statSync(corpsSrc).size;
        await sharp(corpsSrc)
            .resize({ height: 2000, withoutEnlargement: true })
            .webp({ quality: 90, alphaQuality: 100 })
            .toFile(corpsOut);
        const outSizeC = fs.statSync(corpsOut).size;

        results.push({
            key, slug,
            portrait: `${(srcMetaP/1024).toFixed(0)} Ko -> ${(outSizeP/1024).toFixed(0)} Ko`,
            corps: `${(srcMetaC/1024/1024).toFixed(1)} Mo -> ${(outSizeC/1024).toFixed(0)} Ko`,
        });
    }

    console.table(results);
    const totalOut = fs.readdirSync(OUT_DIR).reduce((s, f) => s + fs.statSync(path.join(OUT_DIR, f)).size, 0);
    console.log(`\nTotal assets/photos/ : ${(totalOut/1024/1024).toFixed(2)} Mo pour ${results.length * 2} fichiers`);
}

main().catch(e => { console.error(e); process.exit(1); });
