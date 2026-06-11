'use strict';

/* =====================================================================
   Tomato Growth Simulator — stage data
   PP: plant drawing parameters per stage (all animatable fields numeric)
   STAGES: educational content per stage
   ===================================================================== */

/*
  PP fields:
  h      stem height (px above soil)        nW    stem stroke width
  nc     node count                         lc    leaf count
  cots   cotyledons (0/1)                   fls   flower count on truss
  seed   seed visible (0/1)                 sk    stake 1 growth (0..1)
  fork   Y-fork into two leaders (0..1)     st2   second stake (0/1)
  lateral  axillary sucker at node 2 (0/1)
  stress   duller foliage (0/1)             severe  yellowing lower leaves (0/1)
  fruits   up to 3 of {r: radius, cs: colour stage tg|mg|or|rd, b: BER fraction}
*/
const PP = {
  seed:        {h:0,   nW:1.5, nc:0, lc:0, cots:0, fls:0, seed:1, fruits:[], sk:0, fork:0, st2:0, lateral:0},
  germination: {h:22,  nW:2.0, nc:1, lc:0, cots:1, fls:0, seed:0, fruits:[], sk:0, fork:0, st2:0, lateral:0},
  seedling:    {h:64,  nW:2.7, nc:2, lc:1, cots:1, fls:0, seed:0, fruits:[], sk:0, fork:0, st2:0, lateral:0},
  earlyVeg:    {h:122, nW:4.5, nc:4, lc:3, cots:0, fls:0, seed:0, fruits:[], sk:0, fork:0, st2:0, lateral:0},
  lateVeg:     {h:190, nW:6.0, nc:6, lc:5, cots:0, fls:0, seed:0, fruits:[], sk:0.65, fork:0.55, st2:0, lateral:1},
  flowering:   {h:246, nW:7.2, nc:8, lc:6, cots:0, fls:3, seed:0, fruits:[], sk:1, fork:1, st2:1, lateral:1},
  fruitSet:    {h:256, nW:7.3, nc:8, lc:6, cots:0, fls:0, seed:0, sk:1, fork:1, st2:1, lateral:1,
                fruits:[{r:7,cs:'tg',b:0},{r:6.5,cs:'tg',b:0},{r:7,cs:'tg',b:0}]},
  fruitDev:    {h:256, nW:7.3, nc:8, lc:6, cots:0, fls:0, seed:0, sk:1, fork:1, st2:1, lateral:1,
                fruits:[{r:14,cs:'mg',b:0},{r:13,cs:'mg',b:0},{r:14,cs:'mg',b:0}]},
  ripening:    {h:256, nW:7.3, nc:8, lc:6, cots:0, fls:0, seed:0, sk:1, fork:1, st2:1, lateral:1,
                fruits:[{r:16,cs:'or',b:0},{r:15,cs:'or',b:0},{r:16,cs:'or',b:0}]},
  harvest:     {h:256, nW:7.3, nc:8, lc:6, cots:0, fls:0, seed:0, sk:1, fork:1, st2:1, lateral:1,
                fruits:[{r:17,cs:'rd',b:0},{r:16,cs:'rd',b:0},{r:17,cs:'rd',b:0}]},
  berOnset:    {h:256, nW:7.3, nc:8, lc:6, cots:0, fls:0, seed:0, sk:1, fork:1, st2:1, lateral:1,
                fruits:[{r:14,cs:'mg',b:0.14},{r:13,cs:'mg',b:0.11},{r:14,cs:'mg',b:0.18}]},
  berAdvanced: {h:253, nW:6.8, nc:8, lc:5, cots:0, fls:0, seed:0, sk:1, fork:1, st2:1, lateral:1, stress:1,
                fruits:[{r:15,cs:'mg',b:0.47},{r:14,cs:'mg',b:0.52},{r:15,cs:'mg',b:0.55}]},
  berLoss:     {h:250, nW:6.4, nc:8, lc:4, cots:0, fls:0, seed:0, sk:1, fork:1, st2:1, lateral:1, stress:1, severe:1,
                fruits:[{r:15,cs:'mg',b:0.70},{r:14,cs:'mg',b:0.75},{r:14,cs:'mg',b:0.72}]},
};

const STAGES = {
  seed: {
    id: 'seed', branch: null, name: 'Seed', days: 'Day 0',
    happening: 'A dormant embryo rests inside the seed coat, buried in the growing substrate. The seed contains everything needed to begin life: an embryonic root (radicle), an embryonic shoot (plumule), and a food store (endosperm). Nothing is visible above the soil yet.',
    actions: [
      'Sow seeds 5–10 mm deep in a clean, sterile growing mix.',
      'Water gently so the substrate is damp — never waterlogged.',
      'Label the container with the variety and the sowing date.'
    ],
    observe: [
      'Expect emergence in 5–10 days under Caribbean conditions.',
      'Check daily that the substrate stays damp — a single dry spell can kill a germinating seed.',
      'There is nothing to feed or treat — moisture is the only job right now.'
    ],
    nutrition: 'None required. The endosperm food store fuels the embryo completely until the seedling emerges.',
    weather: 'Optimal soil temperature is 24–29 °C. Below 18 °C germination slows or fails entirely. In the dry season, start seeds in a shaded nursery area rather than open beds.'
  },
  germination: {
    id: 'germination', branch: null, name: 'Germination', days: 'Day 5–10',
    happening: 'The radicle (embryonic root) pushes downward to anchor the plant while the hypocotyl arches upward through the soil in a hook shape. This is epigeal germination — the cotyledons (seed leaves) are pulled up above the surface, rather than staying buried.',
    actions: [
      'Keep the substrate consistently moist with a fine spray.',
      'Provide good light as soon as the hooked tip breaks the surface.',
      'Do not disturb or "help" the seedling while it is still hooked — it straightens on its own.'
    ],
    observe: [
      'The hooked tip breaks the surface first, then straightens upright.',
      'Cotyledons should open within 2–3 days of emergence.',
      'Rotting or pinching at the stem base is damping-off disease — improve airflow and ease off watering.'
    ],
    nutrition: 'Still none. The cotyledons and the remaining endosperm supply all the energy the seedling needs.',
    weather: '24–28 °C with 70–80 % relative humidity is ideal. In the wet season, protect seed trays from heavy rain, which can wash out or rebury emerging seedlings.'
  },
  seedling: {
    id: 'seedling', branch: null, name: 'Seedling', days: 'Day 10–21',
    happening: 'The smooth oval cotyledons photosynthesise while the first true leaves emerge above them. True tomato leaves are compound — a central stalk carrying several leaflets — completely different from the simple cotyledons. Below ground, the root system branches rapidly.',
    actions: [
      'Thin to one strong seedling per cell or container.',
      'Ensure good airflow around seedlings to prevent fungal disease.',
      'Apply a very dilute balanced feed only if leaves turn pale.'
    ],
    observe: [
      'Compare the true compound leaves with the smooth oval cotyledons — students should spot the difference instantly.',
      'Spindly, stretched stems mean insufficient light — move trays to a brighter spot.',
      'A healthy seedling is short, stocky and deep green.'
    ],
    nutrition: 'NPK 20-20-20 at ¼ of the label rate, and only if leaves look pale after day 14. Over-feeding burns young roots.',
    weather: '22–28 °C by day; never below 18 °C at night. From week 3, begin hardening off — gradually expose seedlings to outdoor sun and wind before transplanting.'
  },
  earlyVeg: {
    id: 'earlyVeg', branch: null, name: 'Early Vegetative', days: 'Day 21–35',
    happening: 'Rapid expansion of the true compound leaves. The stem thickens and is covered in sticky hairs (trichomes) that deter small pests and give tomato plants their distinctive smell. Below ground, the root system grows aggressively, exploring the whole container.',
    actions: [
      'Transplant to the final grow box if roots are circling the cell (root-bound).',
      'Feed with a balanced fertiliser at ½ rate.',
      'Begin staking now with a loose figure-8 tie — the stem will keep thickening.'
    ],
    observe: [
      'Leaves should be dark green and slightly sticky to the touch.',
      'Check leaf undersides every few days for aphids and whitefly.',
      'New leaves should appear every few days — slow growth signals cold roots or poor nutrition.'
    ],
    nutrition: 'Balanced 14-14-14 at ½ rate every 10 days. Equal N-P-K supports leaves, roots and stem together at this stage.',
    weather: '24–28 °C is optimal. Above 33 °C, provide afternoon shade — young transplants wilt fast in full Caribbean sun.'
  },
  lateVeg: {
    id: 'lateVeg', branch: null, name: 'Late Vegetative', days: 'Day 35–50',
    happening: 'The plant grows fast and tall, and the zigzag (sympodial) pattern of the main stem becomes visible. Suckers — axillary shoots — appear in every leaf axil, the angle between leaf and stem. Most are pinched out, but one strong sucker near mid-height is deliberately kept: it will become a second leader, splitting the plant into a two-stem "Y" that doubles the fruiting wood.',
    actions: [
      'Insert the stake NOW, before roots fill the box — staking late slices through roots.',
      'Pinch out suckers below the first flower truss, but keep ONE strong mid-height sucker as a second leader.',
      'Tie the stem to the stake every 20–25 cm as it grows.',
      'Increase watering as the leaf canopy expands.'
    ],
    observe: [
      'Check every leaf axil every 2–3 days — suckers grow surprisingly fast.',
      'Watch the kept sucker begin to fork away from the main stem at mid-height.',
      'Dark spots with concentric rings on the lower leaves are early blight — remove affected leaves immediately.',
      'Find the small sucker at the second node — that one gets pinched.'
    ],
    nutrition: 'Increase nitrogen for leafy growth, and start calcium NOW — lime, gypsum or calcium nitrate worked into the soil. Calcium applied today is what prevents blossom end rot in 2–3 weeks.',
    weather: '25–30 °C. In the dry season, mulch heavily to hold soil moisture. Use windbreak cloth — tall staked plants snap in strong coastal winds.'
  },
  flowering: {
    id: 'flowering', branch: null, name: 'Flowering', days: 'Day 50–65',
    happening: 'The plant is now a clear two-leader "Y" — each leader gets its own stake. Flower trusses emerge from the leaders. Each yellow flower has 5 reflexed (curled-back) petals around a fused cone of stamens. Tomato flowers self-pollinate, but the pollen must be physically shaken loose — in nature by wind and the buzzing of bees.',
    actions: [
      'Gently shake the trusses each morning to release pollen.',
      'Stake and tie the second leader — it now carries half the future crop.',
      'Switch to a low-nitrogen, high-P/K fertiliser such as 10-30-20.',
      'Begin foliar calcium chloride (CaCl₂) sprays at 0.4 % every 5–7 days.'
    ],
    observe: [
      'Flowers should open bright yellow with petals curling backward.',
      'Blossom drop (flowers falling without setting fruit) means heat stress, excess nitrogen, or irregular watering.',
      'Notice the knuckle joint where the truss branches — fruit will hang from it later.'
    ],
    nutrition: '10-30-20 to favour flowers over leaves. If leaves yellow between green veins, spray Epsom salt (1 % magnesium sulphate).',
    weather: 'Pollination works best at 18–29 °C. Days above 32 °C or nights above 24 °C make pollen sterile and flowers drop. Avoid wetting open flowers when watering.'
  },
  fruitSet: {
    id: 'fruitSet', branch: null, name: 'Fruit Set', days: 'Day 65–75', isBranch: true,
    happening: 'Pollinated flowers transform: the petals wither and the ovary swells into a tiny green fruit. The next two weeks of rapid cell division decide each fruit\'s fate — every new cell wall needs calcium, and calcium only moves through the plant in a steady water stream. This is the moment where management decides between a healthy harvest and blossom end rot.',
    actions: [
      'Keep watering absolutely consistent — same amount, same time, every day.',
      'Apply calcium nitrate Ca(NO₃)₂ to the soil.',
      'Spray CaCl₂ foliar directly onto the young fruitlets.'
    ],
    observe: [
      'Marble-sized fruitlets should be firm, glossy and uniformly green.',
      'Inspect the blossom end — the very bottom of each fruitlet — for pale, water-soaked patches: the first warning sign.',
      'Petal remnants dropping cleanly from the fruitlets indicates good fruit set.'
    ],
    nutrition: 'Calcium is now the single most critical nutrient — but it only travels in the water stream, so consistent watering is what actually delivers it to the fruit.',
    weather: '20–27 °C is ideal. Irrigate in the morning, mulch heavily, and use 30–40 % shade cloth to buffer soil-moisture swings during hot dry spells.'
  },
  fruitDev: {
    id: 'fruitDev', branch: 'healthy', name: 'Fruit Development', days: 'Day 75–90',
    happening: 'With steady water and calcium, fruit cells expand uniformly. The fruits grow from marble-size to full size, still green, building cell walls, gel and seeds. Sugar comes later — right now it is all structure, and the structure is sound.',
    actions: [
      'Maintain exactly the same consistent watering schedule.',
      'Continue calcium foliar sprays on the developing trusses.',
      'Prune the lowest leaves to improve airflow near the soil.'
    ],
    observe: [
      'Fruits are uniformly round, firm, and a deep glossy green.',
      'No discolouration at the blossom end — the calcium programme did its job.',
      'The truss knuckle thickens to carry the increasing weight.'
    ],
    nutrition: 'Shift to high potassium, for example 5-10-20 — potassium drives fruit filling and later flavour. Continue calcium until the fruits reach full size.',
    weather: '22–28 °C; cooler nights improve fruit quality. High rainfall raises fungal disease risk — make sure the grow box drains freely.'
  },
  ripening: {
    id: 'ripening', branch: 'healthy', name: 'Ripening', days: 'Day 90–105',
    happening: 'The plant releases ethylene gas, the ripening hormone. Chlorophyll (green) breaks down while lycopene and carotenoids (red and orange pigments) are synthesised. Colour is the tomato maturity index — the official scale runs through six stages: mature green, breaker (first colour at the blossom end), turning, pink, light red, and full red. The change starts at the blossom end and sweeps up the fruit.',
    actions: [
      'Reduce watering — a slight water deficit now concentrates sugars.',
      'Stop all nitrogen feeding.',
      'Remove a few leaves shading the trusses so sunlight reaches the fruit.'
    ],
    observe: [
      'Use the maturity index to judge ripeness — note which of the six colour stages each fruit has reached.',
      'Watch the blossom end of each fruit for the first blush of colour (the breaker stage).',
      'Fruit splitting means heavy water arrived after a dry spell — keep moisture even right to the end.',
      'Fruits soften slightly as pectins in the cell walls break down.'
    ],
    nutrition: 'One final foliar spray of 0.5 % potassium sulphate (K₂SO₄) improves sweetness. Nothing else.',
    weather: 'Above 35 °C lycopene synthesis is inhibited — fruit stalls at orange and never turns red. The ideal is warm days with cool nights.'
  },
  harvest: {
    id: 'harvest', branch: 'healthy', name: 'Harvest', days: 'Day 100–115',
    happening: 'Full maturity. The fruits are uniformly red, aromatic, and yield slightly to gentle pressure at the blossom end. Pick to the maturity index that matches the market: fruit for distant markets is harvested at the breaker or turning stage so it ripens in transit, while fruit for local sale is left to the light-red or full-red stage for best flavour. The truss has done its work — and the plant, with its two healthy leaders, can push a second flush of flowers higher up.',
    actions: [
      'Decide the harvest maturity index first — breaker/turning for shipping, light-red/red for local sale.',
      'Harvest in the cool of the morning.',
      'Twist-and-lift each fruit, or cut the pedicel with scissors at the knuckle joint.',
      'Assess the plant — if vigorous, feed it and keep it for a second flush of fruit.'
    ],
    observe: [
      'Grade fruit by the maturity index as you pick — sort breaker, turning, pink and red into separate lots.',
      'Ripe fruit separates cleanly at the knuckle joint with a gentle twist.',
      'Look for uniform deep red with no green shoulders.',
      'Compare this outcome with the BER path — same plant, same weather, different management.'
    ],
    nutrition: 'No feeding at harvest. If keeping the plant for a second crop, resume 20-10-10 once all ripe fruit is picked.',
    weather: 'Never refrigerate tomatoes — below 12 °C the flavour compounds are destroyed. Store at 16–21 °C and use within 2–4 days.'
  },
  berOnset: {
    id: 'berOnset', branch: 'ber', name: 'BER Onset', days: 'Day 75–85',
    happening: 'Irregular watering during cell division interrupted the calcium supply. The cells at the blossom end — the last stop on the water stream — were built without enough calcium, and they have collapsed and died. Pale, water-soaked patches now show at the fruit tips. This is a physiological disorder, NOT an infection.',
    actions: [
      'Resume absolutely consistent watering immediately — fruit that sets from now on can still be saved.',
      'Spray CaCl₂ foliar every 3–4 days.',
      'Remove the worst-affected fruitlets so the plant invests in healthy ones.'
    ],
    observe: [
      'Look at the very bottom of each fruit — the blossom end. The patch starts pale, slightly sunken, and is easy to miss.',
      'Affected fruit will NOT recover — the damaged cells are already dead.',
      'BER is not infectious — it cannot spread between fruits or between plants.'
    ],
    nutrition: 'Calcium nitrate to the soil plus CaCl₂ foliar sprays. Check the soil pH — calcium is only available to roots between pH 6.2 and 6.8.',
    weather: 'The classic Caribbean trigger: a hot dry spell followed by irregular watering. Irrigate in the morning, mulch heavily, and use shade cloth to even out the plant\'s water demand.'
  },
  berAdvanced: {
    id: 'berAdvanced', branch: 'ber', name: 'BER Advanced', days: 'Day 85–100',
    happening: 'The dead tissue at the blossom end has dried into a dark brown-black, leathery, sunken patch covering a third to half of each fruit. Secondary fungi and bacteria are now colonising the dead tissue — they did not cause the problem; they moved in afterwards.',
    actions: [
      'Remove all badly affected fruit — it is unsaleable and hosts pathogens.',
      'Continue the calcium spray programme for the younger trusses.',
      'Keep watering rigorously consistent.',
      'Reassess your irrigation method — this happened because of moisture swings.'
    ],
    observe: [
      'The patch is unmistakeable now: dark, sunken, leathery and dry.',
      'Note the stress showing in the plant — duller leaves and reduced vigour.',
      'Confirm again: there is no spread between fruits — each fruit\'s damage was set weeks ago, during cell division.'
    ],
    nutrition: 'Switch entirely to calcium nitrate Ca(NO₃)₂ as the nitrogen source. Avoid ammonium fertilisers — ammonium competes directly with calcium at the root uptake sites.',
    weather: '30–40 % shade cloth cuts afternoon transpiration, leaving more water flow for the fruit. In the wet season the opposite problem applies: waterlogged roots also cannot take up calcium — drainage is critical.'
  },
  berLoss: {
    id: 'berLoss', branch: 'ber', name: 'Crop Loss', days: 'Day 100+',
    happening: 'Total crop loss on this truss. The rot covers more than half of every fruit; all are unmarketable and some have dropped. The plant itself survives — and the entire outcome was preventable. Blossom end rot is a management problem, not a disease the plant "catches".',
    actions: [
      'Strip and dispose of all affected fruit.',
      'Soil-test for calcium and pH before the next crop.',
      'Amend the soil with lime or gypsum based on the test result.',
      'Plan drip irrigation — the permanent cure for irregular watering.'
    ],
    observe: [
      'Black leathery patches cover more than 50 % of each fruit\'s surface.',
      'Lower leaves are yellowing as the plant reabsorbs their nutrients.',
      'Compare with the healthy path: identical plant, identical weather — only the management differed.'
    ],
    nutrition: 'Write the correction programme for the next crop: lime or gypsum to restore calcium, pH held at 6.2–6.8, consistent irrigation from fruit set onward, and CaCl₂ foliar every 5–7 days.',
    weather: 'Reflect: how did the irrigation respond to dry spells? Time the next sowing away from the driest months, invest in a drip system, and mulch from transplanting day.'
  }
};

const COMMON = ['seed', 'germination', 'seedling', 'earlyVeg', 'lateVeg', 'flowering', 'fruitSet'];
const BRANCHES = { healthy: ['fruitDev', 'ripening', 'harvest'], ber: ['berOnset', 'berAdvanced', 'berLoss'] };
