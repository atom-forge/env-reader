---
name: Env Reader
subtitle: "@atom-forge/env-reader"
id: atom-forge-env-reader
language: hu
tags: [typescript, configuration, environment]
intro: Típusos alkalmazáskonfiguráció környezeti változókból, induláskori ellenőrzéssel.
children:
  - "[[01-start.md]]"
  - "[[02-values.md]]"
  - "[[03-urls.md]]"
  - "[[04-paths.md]]"
  - "[[05-integration.md]]"
---
# @atom-forge/env-reader

Ez a könyv a TypeScript alkalmazások környezeti konfigurációjának beolvasását mutatja be: a telepítéstől a típusos konfigurációs objektumig, a URL-leképezéstől a fájlrendszerbeli útvonalakig.

Az `EnvReader` a `process.env` aktuális értékeit olvassa, szinkron metódusokkal. A hibák akkor jelentkeznek, amikor meghívod ezeket a metódusokat: az induláskori ellenőrzéshez a konfigurációt az alkalmazás indulásakor kell összeállítanod.

> [!tip] Ajánlott olvasási sorrend
> Kezdd az [[01-start|Első lépések]] fejezettel, majd a szükséges adattípusokkal. Az [[05-integration|Integráció és hibakezelés]] egy teljes konfigurációs mintával zárja a könyvet.

## Mit kapsz?

- Kötelező és alapértelmezett konfigurációs értékeket.
- Szövegek, számok, logikai értékek, listák és reguláris kifejezések beolvasását.
- URL-objektumokat és típusos URL-komponens-leképezést.
- Fájl- és könyvtárútvonalak feloldását.
- Mélyen readonly TypeScript-típusokat az `asReadonly` segítségével.

> [!note] Futási környezet
> A csomag `process.env`-et, valamint a Node-kompatibilis `fs` és `path` modulokat használja. Nem böngészőoldali konfigurációs könyvtár és nem `.env`-betöltő.
