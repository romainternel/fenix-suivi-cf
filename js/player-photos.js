        // Mapping nom joueur -> fichiers photo (assets/photos/, ajoutés manuellement par Romain).
        // Séparé de JOUEURS_TERRAIN à dessein : ce tableau est reconstruit à chaque réimport Excel
        // (voir loadFromSupabase / processFile), donc toute donnée stockée dessus serait perdue.
        const PLAYER_PHOTOS = {
            'Antonin.V': { portrait: 'assets/photos/antonin-v-portrait.webp', corps: 'assets/photos/antonin-v-corps.webp' },
            'Enzo.D':    { portrait: 'assets/photos/enzo-d-portrait.webp',    corps: 'assets/photos/enzo-d-corps.webp' },
            'Gabin.S':   { portrait: 'assets/photos/gabin-s-portrait.webp',   corps: 'assets/photos/gabin-s-corps.webp' },
            'Hailé':     { portrait: 'assets/photos/haile-portrait.webp',     corps: 'assets/photos/haile-corps.webp' },
            'Idris.F':   { portrait: 'assets/photos/idris-f-portrait.webp',   corps: 'assets/photos/idris-f-corps.webp' },
            'Isaac.M':   { portrait: 'assets/photos/isaac-m-portrait.webp',   corps: 'assets/photos/isaac-m-corps.webp' },
            'Issa.S':    { portrait: 'assets/photos/issa-s-portrait.webp',    corps: 'assets/photos/issa-s-corps.webp' },
            'Jules.G':   { portrait: 'assets/photos/jules-g-portrait.webp',   corps: 'assets/photos/jules-g-corps.webp' },
            'Julien.L':  { portrait: 'assets/photos/julien-l-portrait.webp',  corps: 'assets/photos/julien-l-corps.webp' },
            'Leni.A':    { portrait: 'assets/photos/leni-a-portrait.webp',    corps: 'assets/photos/leni-a-corps.webp' },
            'Loévan.R':  { portrait: 'assets/photos/loevan-r-portrait.webp',  corps: 'assets/photos/loevan-r-corps.webp' },
            'Louis.M':   { portrait: 'assets/photos/louis-m-portrait.webp',   corps: 'assets/photos/louis-m-corps.webp' },
            'Lucas.G':   { portrait: 'assets/photos/lucas-g-portrait.webp',   corps: 'assets/photos/lucas-g-corps.webp' },
            'Lukas.J':   { portrait: 'assets/photos/lukas-j-portrait.webp',   corps: 'assets/photos/lukas-j-corps.webp' },
            'Marius.C':  { portrait: 'assets/photos/marius-c-portrait.webp',  corps: 'assets/photos/marius-c-corps.webp' },
            'Mattéo.A':  { portrait: 'assets/photos/matteo-a-portrait.webp',  corps: 'assets/photos/matteo-a-corps.webp' },
            'Noah.O':    { portrait: 'assets/photos/noah-o-portrait.webp',    corps: 'assets/photos/noah-o-corps.webp' },
            'Siméo.R':   { portrait: 'assets/photos/simeo-r-portrait.webp',   corps: 'assets/photos/simeo-r-corps.webp' },
        };

        const _playerPhotoKeys = Object.keys(PLAYER_PHOTOS);

        // type: 'portrait' | 'corps' — retourne l'URL ou null si aucune photo pour ce joueur
        function getPlayerPhoto(nomJoueur, type) {
            if (!nomJoueur) return null;
            const key = _playerPhotoKeys.find(k => matchPlayerName(k, nomJoueur));
            if (!key) return null;
            return PLAYER_PHOTOS[key][type] || null;
        }

        // Préchargement en tâche de fond dès le chargement du script (avant même la connexion) :
        // sans ça, le premier clic sur une photo terrain déclenche un vrai fetch réseau et l'image
        // met un instant à apparaître (photo corps entier ~150-200 Ko), perceptible comme un flash/retard.
        (function _preloadPlayerPhotos() {
            _playerPhotoKeys.forEach(key => {
                const { portrait, corps } = PLAYER_PHOTOS[key];
                if (portrait) { const i = new Image(); i.src = portrait; }
                if (corps)    { const i = new Image(); i.src = corps; }
            });
        })();
