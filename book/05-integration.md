---
title: Integráció és hibakezelés
type: chapter
requires: [értékek beolvasása]
teaches: [readonly konfiguráció, hibakezelés]
---
# Integráció és hibakezelés

## Egyetlen konfigurációs modul

Az alkalmazás többi része egy előre összeállított konfigurációt használjon, ne ismételje meg a környezeti változók beolvasását.

```tree
src/
  config.ts       # Környezeti értékek beolvasása és ellenőrzése
  server.ts       # A konfiguráció felhasználása
```

```typescript
// config.ts
import { EnvReader, asReadonly } from "@atom-forge/env-reader";

const env = new EnvReader(process.cwd());
const port = env.int("PORT", 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

export const config = asReadonly({
    app: {
        mode: env.oneOf("APP_ENV", ["dev", "prod", "test"], "prod"),
        port,
        debug: env.boolean("DEBUG", false),
    },
    database: {
        url: env.url("DATABASE_URL"),
        poolSize: env.int("DB_POOL_MAX", 20),
    },
    auth: {
        secret: env.string("JWT_SECRET"),
    },
});

if (!config.auth.secret) {
    throw new Error("JWT_SECRET must not be empty");
}
```

> [!tip] A domain szabályait te határozod meg
> A poolméret minimuma, a titok minimális hossza, a megengedett URL-protokoll és a mezők közötti összefüggések külön alkalmazásszintű ellenőrzést igényelnek. A könyvtár nem konfigurációs séma vagy üzleti validátor.

## Mit jelent az asReadonly?

```typescript
const config = asReadonly({ db: { host: "localhost" } });
// config.db.host = "other"; // TypeScript fordítási hiba
```

Az `asReadonly<T>(value: T): DeepReadonly<T>` ugyanazt az objektumot adja vissza, típusassertionnel. Nem készít másolatot és nem hív `Object.freeze`-t.

> [!warning] Csak típusoldali védelem
> JavaScriptből vagy más, módosítható referencián keresztül az objektum továbbra is módosítható. A readonly típus nem futásidejű immutabilitás vagy biztonsági határ.

## Hibakezelés és naplózás

A metódusok szinkron `Error` hibákat dobnak. Nincs teljes konfigurációt összegyűjtő hibajelentés: az első dobott hiba megszakítja a konfiguráció összeállítását.

| Helyzet | Példa üzenet |
|---|---|
| Hiányzó érték | `Missing Env variable (string): DATABASE_URL` |
| Hibás érték | `Env variable type failed: PORT (int)` |
| Hibás listaelem | `Env variable type failed: ALLOWED_PORTS[0] - invalid` |
| URL-leképezési hiba | `Env variable URL map failed: SERVICE_URL - ...` |
| Nem fájl | `Env variable path is not a file: TLS_CERT - ...` |

> [!danger] Titkok a hibaüzenetekben
> Egyes üzenetek listaelemet, default URL-t vagy abszolút fájlrendszerutat tartalmaznak. Naplózás előtt gondold át a redakciót; ne naplózd a teljes konfigurációs objektumot vagy a `process.env` tartalmát.

## Ellenőrzési lista integrációhoz

- [ ] A környezet betöltése megelőzi a konfiguráció összeállítását.
- [ ] A projektgyökér abszolút és a futtatási helytől függetlenül helyes.
- [ ] A kötelező titkokhoz nincs kényelmi default.
- [ ] Az üres stringeket külön ellenőrzöd, ahol szükséges.
- [ ] A számok tartományát és a URL-ek domain szabályait validálod.
- [ ] A szolgáltatások csak sikeres konfiguráció-ellenőrzés után indulnak.
- [ ] Tesztekben visszaállítod a módosított környezeti változókat és eltakarítod az ideiglenes fájlokat.

> [!note] Ismételt olvasás
> Az `EnvReader` nem készít környezeti snapshotot. Minden metódushívás az aktuális `process.env`-et olvassa. A fenti egyszer összeállított konfiguráció viszont nem frissül automatikusan későbbi környezetváltozáskor.
