# Déploiement du worker `drome-commu`

Backend de l'onglet Amis : **PIN de groupe** (code à 6 chiffres = une salle) +
**présence live** (WebSocket via Durable Object) + **points partagés**.

## Prérequis
- Un compte Cloudflare (le même que Limbes).
- Node installé.

## Étapes (dans le dossier `worker/`)

```bash
cd worker
npm install -g wrangler        # si pas déjà fait
wrangler login                 # ouvre le navigateur, autorise

# 1) crée le namespace KV (réservation des codes PIN)
wrangler kv namespace create PINS
#   → copie l'"id" affiché et colle-le dans wrangler.toml à la place de
#     REMPLIR_APRES_wrangler_kv_namespace_create

# 2) déploie
wrangler deploy
```

À la fin, wrangler affiche l'URL publique, du genre :

```
https://drome-commu.<ton-sous-domaine>.workers.dev
```

## Ce que tu me donnes
Colle-moi cette **URL** (`https://drome-commu.xxx.workers.dev`).
Je câble alors le client dans l'app (créer/rejoindre une salle, position live
opt-in, membres live sur la carte, points partagés) **et je le teste** contre ce
worker réel.

## Test rapide du worker (facultatif)
```bash
# crée un code
curl -X POST https://drome-commu.xxx.workers.dev/room/new
#   → {"code":"482913"}

# vérifie qu'il existe
curl https://drome-commu.xxx.workers.dev/room/482913/exists
#   → {"exists":true}
```

## API (pour info)
- `POST /room/new` → `{code}` : code à 6 chiffres, réservé 48h.
- `GET  /room/:code/exists` → `{exists}`.
- `WS   /room/:code` : messages client → serveur
  - `{type:'hello', uid, profile:{name,icon,color}, pos:{lng,lat}}`
  - `{type:'pos', lng, lat}` (position live)
  - `{type:'point', point:{id,title,comment,lng,lat,author,aicon,acolor,ts}}`
  - `{type:'delpoint', id}`
  - serveur → client : `{type:'members', members:[…]}` et `{type:'points', points:[…]}`

## Confidentialité
La position live n'est diffusée **que** dans la salle (le code), **que** si
l'utilisateur active le partage. Rien n'est stocké hors des points partagés
(persistés dans le Durable Object de la salle).
