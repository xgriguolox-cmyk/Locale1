# Sito Persian Home

Pagina singola autosufficiente: le foto vengono incorporate nell'HTML, quindi il
file finale funziona anche senza connessione a un server di immagini.

## Sostituire una foto

1. Fotografa il piatto e salvalo con **lo stesso nome del file esistente** in
   `photos/` — per esempio `photos/fesenjan.jpg`. L'estensione può cambiare
   (`.jpg`, `.png`, `.webp`, `.heic`), il nome no.
2. Ricompila:

   ```bash
   python3 site/build.py
   ```

3. Il sito aggiornato esce in `site/dist/persian-home.html`.

Lo script ridimensiona, raddrizza (le foto da telefono sono spesso ruotate),
comprime e incorpora ogni immagine. Non serve ritagliare a mano: l'inquadratura
viene decisa dalla pagina.

## Come scattarle

- Di giorno, vicino a una finestra. Mai flash.
- Dall'alto o a 45°, su un piano pulito e uniforme.
- Almeno **800px** sul lato lungo — qualsiasi telefono recente ne fa 4000.
  Sotto questa soglia lo script lo segnala a fine compilazione.

## Opzioni

```bash
python3 site/build.py --lato 700 --qualita 75   # pagina più leggera
python3 site/build.py --salta-mancanti          # compila anche senza tutte le foto
```

Un Artifact si ferma a 16 MB. Se la pagina si avvicina al limite, lo script
avvisa e suggerisce i valori da usare.

## Requisiti

```bash
pip install Pillow        # obbligatorio
pip install pillow-heif   # solo per le foto .HEIC da iPhone
```

## File

| Percorso | Cosa contiene |
|---|---|
| `template.html` | La pagina, con i segnaposto `{{PHOTO:nome}}` |
| `photos/` | Una foto per piatto, più `logo.png` |
| `build.py` | Lo script di compilazione |
| `dist/` | Il risultato (non versionato) |
