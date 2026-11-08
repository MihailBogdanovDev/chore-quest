# public/art

PixelLab-generated (hero, nav icons, bg, logo) and original hand-drawn pixel art (icons made with scripts/draw-icons.mjs).

- heroes/hero-1.png: knight kid (64px, faces right)
- heroes/hero-2.png: ranger girl
- heroes/hero-3.png: wizard
- heroes/hero-4.png: dwarf warrior
- logo.png: shield + crossed swords + crown crest with red ribbon (128x96); set title text in Press Start 2P
- bg-village.png: 320x180 day sky, hills, village and castle backdrop (opaque)
- icons/coin.png: gold coin
- icons/chest-closed.png: treasure chest
- icons/chest-open.png: open treasure chest with gold
- icons/torch.png: streak torch
- icons/keep.png: castle (nav: home)
- icons/scroll.png: quest scroll (nav: bounties)
- icons/shop.png: merchant stall (nav: shop)
- icons/bag.png: backpack (nav: inventory)
- icons/xp-star.png, check.png, cross.png: star, green check, red cross
- icons/bed.png, toys.png, dishes.png, trash.png, laundry.png, broom.png, pet.png, book.png, sparkle.png: chore icons
- icons/moon.png, gamepad.png, tv.png, pizza.png, ice-cream.png, park.png, movie.png, gift.png, crown.png, candy.png: reward icons

- icons/tree.png: same art as park.png (reward icon list uses "tree")

The chore/reward/status icons above (chest-open through candy, plus tree) are original pixel art, not derived from emoji or any third-party artwork. They are defined as 15x15 character grids with a shared warm palette in scripts/draw-icons.mjs, which upscales 2x to 32x32, adds an automatic 1px dark outline and writes the PNGs with Node built-ins only. Re-run with `node scripts/draw-icons.mjs`.

Not produced: hero attack poses (hero-N-attack.png).