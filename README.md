# BLINDER (game-in-development)

- `BLINDER.rbxl` — versão nova do jogo (abra no Roblox Studio).
- `original/BLINDER.rbxl` — arquivo original enviado.
- `src/` — código de todos os scripts extraído do .rbxl (edite aqui).
- `tools/` — `dump.py` extrai os scripts de um .rbxl; `pack.py` grava o `src/` de volta:

```bash
python3 tools/pack.py original/BLINDER.rbxl src BLINDER.rbxl
```
