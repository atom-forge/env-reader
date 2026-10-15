---
title: URL-ek és leképezések
type: chapter
teaches: [URL-validálás, URL-leképezés]
---
# URL-ek és leképezések

## URL-objektum

```typescript
const api = env.url("API_URL", "https://api.example.com/v1/");
console.log(api.hostname); // A konfigurált URL hostname értéke
```

A visszatérési érték szabványos `URL` objektum. A környezeti szöveg trim után kerül a konstruktorba. A default URL is feldolgozásra és ellenőrzésre kerül.

> [!warning] Érvényes URL nem feltétlenül megengedett URL
> A metódus nem korlátozza a protokollt HTTPS-re és nem alkalmaz host-engedélylistát. Ha a felhasználási hely ezt igényli, külön ellenőrizd a `protocol` és `hostname` mezőket.

## Típusos komponens-leképezés

```typescript
// S3_URL=s3://accessKey:secretKey@storage.example.com/assets/files/
const storage = env.url("S3_URL", {
    map: {
        accessKey: "username",
        secretKey: "password",
        host: "hostname",
        bucket: "path(0)",
        prefix: ["path(1,end)", ""],
    },
});
// bucket: "assets", prefix: "files/"; minden mező string
```

A második argumentum az opciós objektum: `map` és opcionális `defaultValue`. A kimenet kulcsai a map kulcsaival egyeznek; minden érték string.

| Selector | Jelentés |
|---|---|
| `protocol` | Protokoll kettősponttal, például `https:`. |
| `username`, `password` | Percent-decoded hitelesítési komponensek. |
| `hostname` | Hostnév port nélkül. |
| `host` | Hostnév a URL-objektumban megmaradt porttal. |
| `port` | Port stringként; lehet üres. |
| `origin` | `${protocol}//${host}` formában összeállított string. |
| `path` | Dekódolt pathname a kezdő `/` nélkül. |
| `hash` | Fragment a `#` jellel együtt, ha jelen van. |
| `path(index)` | Egy dekódolt útvonalszegmens. |
| `path(start,end)` | Inkluzív szegmenstartomány; a végindex lehet `end`. |
| `query("name")` | Az első ilyen query-paraméter értéke; egyszeres idézőjel is használható. |

A URL-konstruktor normalizálhatja az értékeket, például az alapértelmezett portot eltávolíthatja. Az `origin` itt a csomag saját összeállítása, nem közvetlenül a `URL.origin` tulajdonság.

## Útvonalszegmensek

Az indexelés nullától indul; a negatív index hátulról számol. Az indexelt selectorok a split során az üres szegmenseket elhagyják.

A `/assets/images/logo.svg` útvonalon:

- `path(0)` → `assets`
- `path(-1)` → `logo.svg`
- `path(1,end)` → `images/logo.svg`

A tartomány, ha eléri az utolsó szegmenst, megőrzi a URL záró `/` jelét, amennyiben volt ilyen. Egyetlen szegmens kiválasztása nem teszi hozzá ezt a jelet.

## Fallbackok pontosan

```typescript
const endpoint = env.url("SERVICE_URL", {
    defaultValue: "https://api.example.com/v1/",
    map: {
        host: "hostname",
        token: ['query("token")', ""],
        extraPath: ["path(2,end)", ""],
    },
});
```

> [!warning] Nem minden üres komponens vált ki fallbackot
> A fallback csak hiányzó query-paraméternél és a tartományon kívüli útvonalszegmensnél működik. Egy hiányzó `username`, `password`, `port` vagy `hash` üres stringként tér vissza, fallback nélkül is. A `?token=` szintén üres stringet ad, nem defaultot.

Érvénytelen selector vagy hibás percent-encoding esetén a fallback nem nyeli el a hibát. A leképezési hibák üzenete `Env variable URL map failed: KEY - ...` előtagot kap.

Tovább: [[04-paths|Fájlok és könyvtárak]].
