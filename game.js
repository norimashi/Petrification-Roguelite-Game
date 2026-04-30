const qs = (id) => document.getElementById(id);
const i18n = window.StoneGameI18n;
const t = (source, vars) => i18n?.t(source, vars) ?? String(source ?? "");
const localizeKind = (card) => t(card?.kind);
const localizeLabel = (entity) => t(entity?.label);
const localizeTitle = (entity) => t(entity?.title);
const localizeDetail = (entity) => t(entity?.detail);
const localizeEffect = (entity) => t(entity?.effect);
const localizePreview = (entity) => t(entity?.preview);

function localizeName(entity) {
  const name = entity?.name ?? entity;
  if (!name) return "";
  const original = entity?.temporaryStonePowder?.name || entity?.ritualManacleMutation?.name;
  if (original) return t("石化した{card}", { card: t(original) });
  if (String(name).startsWith("石化した")) return t("石化した{card}", { card: t(String(name).slice("石化した".length)) });
  return t(name);
}

function localizeText(entity) {
  const text = entity?.text ?? entity;
  if (!text) return "";
  const suffixes = [
    " 石化の影響でコスト+1。",
    " 石粉の影響でこの戦闘中コスト+1。",
    " 典礼の石枷の影響で、手札にある間コスト+1。"
  ];
  const suffix = suffixes.find((item) => String(text).endsWith(item));
  if (!suffix) return t(text);
  const base = String(text).slice(0, -suffix.length);
  return `${t(base)} ${t(suffix.trim())}`;
}

function statDeltaText(label, value) {
  return `${t(label)}${value >= 0 ? "+" : ""}${value}`;
}
const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function localizeStaticDom() {
  document.title = t("石像の剣士");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });
}

function setupLanguageSelect() {
  if (!i18n) return;
  const options = Object.entries(i18n.locales)
    .map(([key, locale]) => `<option value="${key}">${locale.label}</option>`)
    .join("");
  document.querySelectorAll("[data-language-select]").forEach((select) => {
    select.innerHTML = options;
    select.value = i18n.current;
    select.addEventListener("change", () => {
      setGameLocale(select.value);
    });
  });
}

function syncLanguageSelects() {
  if (!i18n) return;
  document.querySelectorAll("[data-language-select]").forEach((select) => {
    select.value = i18n.current;
  });
}

function setGameLocale(locale) {
  if (i18n) {
    i18n.setLocale(locale);
    syncLanguageSelects();
  }
  localizeStaticDom();
  refreshLocalizedView();
}

function refreshLocalizedView() {
  if (!state) return;
  if (state.phase === "openingEvent") return showOpeningEvent({ preserveChoices: true, silent: true });
  if (state.phase === "event" && state.currentEvent) return renderEventSite(state.currentEvent, { silent: true });
  if (state.phase === "map") return showMapPhase();
  render();
}

function confirmNewGame() {
  return window.confirm(t("ゲームを最初からやり直しますか？"));
}

function requestNewGame() {
  if (!confirmNewGame()) return;
  newGame();
}

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, debugDelay(ms)));

const statusIcons = {
  str: "assets/status_strength.png",
  dex: "assets/status_dexterity.png",
  plate: "assets/status_plate.png",
  block: "assets/status_block.png",
  stun: "assets/status_full_block_stun.png",
  echo: "assets/status_echo_stone_sigil.png",
  attack: "assets/intent_attack.png",
  petrify: "assets/intent_petrify.png"
};

const art = {
  normal: [
    "assets/cards/normal_1.png",
    "assets/cards/normal_2.png",
    "assets/cards/normal_3.png",
    "assets/cards/normal_4.png",
    "assets/cards/attack_normal_step_slash.png",
    "assets/cards/normal_defense.png",
    "assets/cards/card_selecting_slash.png",
    "assets/cards/card_breathing_guard.png",
    "assets/cards/card_retained_stance.png",
    "assets/cards/card_discard_tactics.png",
    "assets/cards/card_retained_focus.png",
    "assets/cards/card_next_energy.png",
    "assets/cards/card_shard_counterattack.png",
    "assets/cards/card_cut_away.png",
    "assets/cards/card_shard_bulwark.png",
    "assets/cards/card_crushing_defense.png",
    "assets/cards/card_rubble_flash.png"
  ],
  resist: [
    "assets/cards/resist_1.png",
    "assets/cards/resist_2.png",
    "assets/cards/resist_3.png",
    "assets/cards/resist_4.png",
    "assets/cards/attack_resist_stone_counter.png",
    "assets/cards/card_stone_dust_purge.png",
    "assets/cards/card_crack_riposte.png",
    "assets/cards/card_statue_reservoir.png",
    "assets/cards/card_crack_energy_conversion.png",
    "assets/cards/card_petri_repeat.png",
    "assets/cards/card_desperate_purification.png",
    "assets/cards/card_wreckage_breath.png"
  ],
  petri: [
    "assets/cards/petri_new_1.png",
    "assets/cards/petri_new_2.png",
    "assets/cards/petri_new_3.png",
    "assets/cards/petri_new_4.png",
    "assets/cards/attack_petri_heavy_cleave.png",
    "assets/cards/attack_petri_weak_jab.png",
    "assets/cards/elite_ritual_manacle.png",
    "assets/cards/card_crumbling_gambit.png",
    "assets/cards/card_stone_meditation.png",
    "assets/cards/card_petri_energy_surge.png",
    "assets/cards/card_petri_exhaust.png",
    "assets/cards/card_petri_deck_draw.png",
    "assets/cards/card_collapse_chain.png"
  ],
  special: [
    "assets/cards/curse_forced_petrify.png",
    "assets/cards/petri_fear_1.png",
    "assets/cards/petri_fear_2.png",
    "assets/cards/petri_fear_3.png",
    "assets/cards/elite_wax_tear_gaze.png",
    "assets/cards/card_priest_seal.png"
  ]
};

const heroAnimations = {
  idle: {
    frames: 4,
    fps: 2,
    loop: true,
    sequence: [0, 2, 3],
    sheet: "assets/animations/hero_idle_right_game_ready_sheet.png",
    stoneSheet: "assets/animations/hero_idle_right_stone_game_ready_sheet.png"
  },
  attack: {
    frames: 6,
    fps: 16,
    loop: false,
    scale: 1.15,
    durations: [1, 1, 1, 4.8, 1, 1],
    sheet: "assets/animations/hero_attack_right_game_ready_sheet.png",
    stoneSheet: "assets/animations/hero_attack_right_stone_game_ready_sheet.png"
  },
  action: {
    frames: 4,
    fps: 8,
    loop: false,
    scale: 0.97,
    durations: [1, 1, 1.8, 1],
    sheet: "assets/animations/hero_action_right_game_ready_sheet.png",
    stoneSheet: "assets/animations/hero_action_right_stone_game_ready_sheet.png"
  },
  damage: {
    frames: 3,
    fps: 10,
    loop: false,
    scale: 0.94,
    durations: [1, 1.8, 1],
    sheet: "assets/animations/hero_damage_right_game_ready_sheet.png",
    stoneSheet: "assets/animations/hero_damage_right_stone_game_ready_sheet.png"
  }
};

const slashEffect = {
  frames: 4,
  fps: 28,
  frame: 0,
  elapsed: 0,
  active: false,
  delay: 130,
  sheet: "assets/animations/slash_right_game_ready_sheet.png"
};

let heroAnimation = {
  name: "idle",
  frame: 0,
  elapsed: 0,
  lastTime: 0
};

const preloadedImages = new Map();

function preloadImage(src) {
  if (!src) return Promise.resolve();
  const cached = preloadedImages.get(src);
  if (cached) return cached.promise;
  const image = new Image();
  image.decoding = "async";
  const promise = new Promise((resolve) => {
    image.onload = resolve;
    image.onerror = resolve;
  });
  preloadedImages.set(src, { image, promise });
  image.src = src;
  return promise;
}

function heroAnimationAssets(name) {
  const anim = heroAnimations[name] || heroAnimations.idle;
  const assets = [anim.sheet, anim.stoneSheet];
  if (name === "attack") assets.push(slashEffect.sheet);
  return assets;
}

function allHeroAnimationAssets() {
  return Object.keys(heroAnimations).flatMap(heroAnimationAssets);
}

function collectGameImageSources() {
  return [
    "assets/battle_bg.png",
    "assets/cards/stone_overlay.png",
    "assets/gameover_1.png",
    "assets/gameover_2.png",
    "assets/rest_camp_still.png",
    slashEffect.sheet,
    ...Object.values(statusIcons),
    ...Object.values(art).flat(),
    ...allHeroAnimationAssets(),
    ...thresholds.flatMap((threshold) => [threshold.icon, threshold.still]),
    ...enemies.map((enemy) => enemy.image),
    ...mapEvents.map((event) => event.still),
    openingEvent.still
  ].filter(Boolean);
}

function uniqueImageSources(sources) {
  return [...new Set(sources.filter(Boolean))];
}

function scheduleBackgroundImagePreload(sources, concurrent = 3) {
  const queue = uniqueImageSources(sources).filter((src) => !preloadedImages.has(src));
  let active = 0;
  const schedule = window.requestIdleCallback
    ? (callback) => window.requestIdleCallback(callback, { timeout: 1400 })
    : (callback) => window.setTimeout(callback, 60);

  const pump = () => {
    while (active < concurrent && queue.length) {
      active++;
      preloadImage(queue.shift()).finally(() => {
        active--;
        if (queue.length) schedule(pump);
      });
    }
  };

  schedule(pump);
}

function preloadCriticalImages() {
  const immediate = uniqueImageSources([
    "assets/battle_bg.png",
    openingEvent.still,
    ...heroAnimationAssets("idle"),
    slashEffect.sheet
  ]);
  const critical = uniqueImageSources([
    ...immediate,
    ...allHeroAnimationAssets()
  ]);
  critical.forEach(preloadImage);
  scheduleBackgroundImagePreload(collectGameImageSources());
  return Promise.all(immediate.map(preloadImage));
}

function waitForHeroAnimationAssets(name) {
  return Promise.all(heroAnimationAssets(name).map(preloadImage));
}

function finishBootLoading() {
  document.body.classList.remove("boot-loading");
  qs("bootLoading")?.classList.add("hidden");
}

const thresholds = [
  {
    value: 32,
    key: "burden",
    name: "石の重圧",
    icon: "assets/debuff_petri_rank1.png",
    still: "assets/petri_stills/petri_stage_1.png",
    text: "石化が32に達した。奇数ターン開始時に「石の重み」が手札に混ざる。",
    description: "石化32以上で発生。奇数ターン開始時に「石の重み」を1枚手札に加える。石化が32未満になると消える。"
  },
  {
    value: 58,
    key: "mutate",
    name: "石化変質",
    icon: "assets/debuff_petri_rank2.png",
    still: "assets/petri_stills/petri_stage_2.png",
    text: "石化が58に達した。偶数ターン開始時に通常カードが石化して重くなる。",
    description: "石化58以上で発生。偶数ターン開始時に通常カード1枚を石化させ、コストを1増やす。石化が58未満になると消える。"
  },
  {
    value: 78,
    key: "dream",
    name: "沈む体温",
    icon: "assets/debuff_petri_rank3.png",
    still: "assets/petri_stills/petri_stage_3.png",
    text: "石化が78に達した。ときどき「沈む体温」が手札に現れる。",
    description: "石化78以上で発生。ターン開始時に55%の確率で「沈む体温」が手札に現れる。石化が78未満になると消える。"
  },
  {
    value: 100,
    key: "full",
    name: "完全石化",
    icon: "assets/debuff_petri_rank4.png",
    still: "assets/petri_stills/petri_stage_4.png",
    text: "石化が100に達した。完全石化し、戦闘を続けられない。",
    description: "石化100で完全に石化し、戦闘不能になる。"
  }
];

const statueTexts = [
  "足を踏み出そうとした意思だけが、冷たい石の内側で空回りした。膝は一寸も動かない。",
  "指先に力を込める。剣の柄を握り直すはずの手は、彫り込まれた形のまま沈黙している。",
  "息を吸おうとする。胸は膨らまず、肺の感覚だけが遠い記憶のように残っている。",
  "まばたきを命じても瞼は降りない。視界は固定され、敵の影だけが石の瞳に焼き付いていく。",
  "叫ぼうとした言葉は喉で砕け、声にならない振動だけが石像の内側に閉じ込められた。",
  "肩をひねって構え直そうとする。鎧も肌も同じ硬さになり、姿勢は呪いに保存されている。",
  "床の冷たさが足裏から伝わる気がした。だが足裏はもう床と区別できないほど重い。",
  "魔力を巡らせようとするたび、ひびの奥で鈍い痛みが光り、すぐに灰色の静けさへ戻る。",
  "誰かが近づけば助けを求められるかもしれない。そう思う間にも、口元は彫像の表情を保ち続ける。",
  "心だけがまだ戦闘を続けている。身体は勝敗から切り離され、遺跡の一部として立ち尽くす。",
  "剣を振る未来を思い描く。けれど石の腕は、その想像を嘲るように同じ角度で止まっている。",
  "時間の流れだけがわかる。埃が肩に積もり、動けない事実だけが少しずつ確かなものになる。"
];

const library = {
  strike: {
    name: "斬撃", cost: 1, type: "normal", kind: "攻撃", art: ["normal", 0],
    text: "6ダメージ。", play: () => damage(6)
  },
  guard: {
    name: "受け流し", cost: 1, type: "normal", kind: "スキル", art: ["normal", 1],
    text: "8ブロック。カードを1枚引く。", play: () => { block(8); draw(1); }
  },
  defend: {
    name: "防御", cost: 1, type: "normal", kind: "スキル", art: ["normal", 5],
    text: "5ブロック。", play: () => block(5)
  },
  lunge: {
    name: "踏み込み", cost: 1, type: "normal", kind: "攻撃", art: ["normal", 2],
    text: "4ダメージを2回。石化40以上なら1回だけ。", play: () => damage(state.player.petri >= 40 ? 4 : 8)
  },
  focus: {
    name: "呼吸を整える", cost: 0, type: "normal", kind: "スキル", art: ["normal", 3],
    text: "カードを1枚引く。石化-4。", play: () => { draw(1); petri(-4); }
  },
  stepSlash: {
    name: "踏破斬り", cost: 1, type: "normal", kind: "攻撃", art: ["normal", 4],
    text: "8ダメージ。", play: () => damage(8)
  },
  selectingSlash: {
    name: "選別斬り", cost: 1, type: "normal", kind: "攻撃", art: ["normal", 6],
    text: "8ダメージ。手札を1枚捨てる。カードを1枚引く。",
    play: () => { damage(8); discardOneFromHand(); draw(1, "added"); }
  },
  breathingGuard: {
    name: "息を合わせる", cost: 1, type: "normal", kind: "スキル", art: ["normal", 7],
    text: "6ブロック。カードを2枚引く。",
    play: () => { block(6); draw(2, "added"); }
  },
  heldStance: {
    name: "守りの構え", cost: 0, type: "normal", kind: "スキル", art: ["normal", 8],
    text: "ターン終了まで筋力-1、敏捷+3。",
    retain: true,
    play: () => addTemporaryStats(-1, 3)
  },
  tacticalDiscard: {
    name: "戦術整理", cost: 1, type: "normal", kind: "スキル", art: ["normal", 9],
    text: "手札の任意のカードを1枚捨てる。カードを2枚引く。",
    play: async () => { await discardAnyCardFromHand({ required: true, source: "戦術整理" }); draw(2, "added"); }
  },
  sealedResolve: {
    name: "封じた決意", cost: 1, type: "normal", kind: "スキル", art: ["normal", 10],
    text: "7ブロック。手札のスキルカード1枚につき、さらに2ブロック。",
    retain: true,
    play: () => block(7 + state.hand.filter((card) => card.kind === "スキル").length * 2)
  },
  nextTurnSigil: {
    name: "次刻の印", cost: 0, type: "normal", kind: "スキル", art: ["normal", 11],
    text: "2ターンの間、ターン開始時にエナジー+1。廃棄。",
    exhaust: true,
    play: () => addEnergySigil(1, 2)
  },
  shardCounterattack: {
    name: "破片の反撃", cost: 1, type: "normal", kind: "攻撃", art: ["normal", 12],
    text: "5ダメージ。このターンにカードを廃棄していたなら、追加で10ダメージ。",
    play: () => { damage(5); if ((state.exhaustedThisTurn || 0) > 0) damage(10); }
  },
  cutAway: {
    name: "切り捨て", cost: 0, type: "normal", kind: "スキル", art: ["normal", 13],
    text: "手札の中から1枚を選び廃棄。カードを1枚引く。",
    play: async () => { await exhaustAnyCardFromHand({ required: true, source: "切り捨て" }); draw(1, "added"); }
  },
  shardBulwark: {
    name: "破片の防壁", cost: 1, type: "normal", kind: "スキル", art: ["normal", 14],
    text: "6ブロック。このターンにカードを廃棄していたなら、追加で6ブロック。",
    play: () => { block(6); if ((state.exhaustedThisTurn || 0) > 0) block(6); }
  },
  crushingDefense: {
    name: "破砕防御", cost: 1, type: "normal", kind: "スキル", art: ["normal", 15],
    text: "7ブロック。手札のランダムなカードを1枚廃棄。",
    play: () => { block(7); exhaustRandomCardFromHand("破砕防御"); }
  },
  rubbleFlash: {
    name: "瓦礫一閃", cost: 2, type: "normal", kind: "攻撃", art: ["normal", 16],
    text: "10ダメージ。この戦闘中に廃棄したカード1枚につき追加で3ダメージ。",
    play: () => damage(10 + (state.exhaustedThisCombat || 0) * 3)
  },
  stoneFoot: {
    name: "石脚の鈍り", cost: 0, type: "petrify", kind: "呪い", art: ["petri", 0],
    text: "敏捷性-1。3ブロック。廃棄。", exhaust: true, play: () => { state.player.dex--; block(3); }
  },
  crackedFinger: {
    name: "ひび割れた指", cost: 0, type: "petrify", kind: "呪い", art: ["petri", 1],
    text: "カードを1枚引く。次に得るブロック-2。廃棄。", exhaust: true,
    play: () => { draw(1); state.player.blockPenalty += 2; }
  },
  stoneSeed: {
    name: "石化の芽", cost: 1, type: "petrify", kind: "スキル", art: ["petri", 2],
    text: "石化+6。プレート+3。", play: () => { petri(6); plate(3); }
  },
  heavyKnee: {
    name: "重い膝", cost: 1, type: "petrify", kind: "スキル", art: ["petri", 3],
    text: "4ブロック。ターン終了時に手札に残っていると、次ターン開始時に石脚の鈍りを加える。", play: () => block(4)
  },
  stoneCleave: {
    name: "石腕の大断ち", cost: 2, type: "petrify", kind: "攻撃", art: ["petri", 4],
    text: "25ダメージ。石化+8。廃棄。", exhaust: true, play: () => { damage(25); petri(8); }
  },
  stiffJab: {
    name: "ぎこちない突き", cost: 0, type: "petrify", kind: "攻撃", art: ["petri", 5],
    text: "5ダメージ。石化+4。", play: () => { damage(5); petri(4); }
  },
  crumblingGambit: {
    name: "崩れ身の賭け", cost: 1, type: "petrify", kind: "スキル", art: ["petri", 7],
    text: "手札のプレイ可能なカードをランダムに1枚、コストなしで自動的にプレイする。廃棄。",
    exhaust: true,
    play: async () => playRandomCardForFree()
  },
  stoneMeditation: {
    name: "沈石の瞑想", cost: 0, type: "petrify", kind: "スキル", art: ["petri", 8],
    text: "石化+5。カードを2枚引く。",
    play: () => { petri(5); draw(2, "added"); }
  },
  petriEnergySurge: {
    name: "石化の急燃", cost: 0, type: "petrify", kind: "スキル", art: ["petri", 9],
    text: "石化+6。エナジー+2。廃棄。",
    exhaust: true,
    play: () => { petri(6); state.energy += 2; }
  },
  fossilOffering: {
    name: "化石の供物", cost: 1, type: "petrify", kind: "スキル", art: ["petri", 10],
    text: "石化+7。手札の任意のカードを1枚廃棄。カードを2枚引く。",
    exhaust: true,
    play: async () => { petri(7); await exhaustAnyCardFromHand({ required: true, source: "化石の供物" }); draw(2, "added"); }
  },
  stoneDeckCall: {
    name: "石脈の呼び声", cost: 1, type: "petrify", kind: "スキル", art: ["petri", 11],
    text: "石化+6。山札からカードを2枚引く。廃棄。",
    exhaust: true,
    play: () => { petri(6); draw(2, "added"); }
  },
  collapseChain: {
    name: "崩落連鎖", cost: 2, type: "petrify", kind: "攻撃", art: ["petri", 12],
    text: "16ダメージ。この戦闘中に廃棄したカードが3枚以上なら、コスト-1。",
    play: () => damage(16)
  },
  freezingPanic: {
    name: "固まる悲鳴", cost: 0, type: "petrify", kind: "呪い", art: ["special", 1],
    text: "石化+15。カードを2枚引く。エナジー+2。廃棄。", exhaust: true, play: () => { petri(15); draw(2); state.energy += 2; }
  },
  marbleTears: {
    name: "石涙", cost: 1, type: "petrify", kind: "スキル", art: ["special", 2],
    text: "石化+8。20ブロック。", play: () => { petri(8); block(20); }
  },
  frozenPose: {
    name: "固着する姿勢", cost: 1, type: "petrify", kind: "スキル", art: ["special", 3],
    text: "石化+12。プレート+6。このターン攻撃できない。", play: () => { petri(12); plate(6); state.attackLocked = true; }
  },
  stoneBrand: {
    name: "石化の刻印", cost: 1, type: "curse", kind: "状態", art: ["special", 0],
    text: "石化+2。カードを1枚引く。廃棄。ターン終了時、手札に残っていると石化+7。", exhaust: true, ethereal: true,
    play: () => { petri(2); draw(1, "added"); }
  },
  priestSeal: {
    name: "司祭の石印", cost: 0, type: "petrify", kind: "スキル", art: ["special", 5],
    text: "石化-5。敵がこのターン筋力+10を得る。保留。廃棄。ターン終了時に手札に残ると石化+9。",
    retain: true,
    exhaust: true,
    play: () => { petri(-5); addTemporaryEnemyStrength(10); }
  },
  resist: {
    name: "抗石の祈り", cost: 1, type: "resist", kind: "スキル", art: ["resist", 0],
    text: "石化-13。2ブロック。", play: () => { petri(-13); block(2); }
  },
  chisel: {
    name: "亀裂を力に", cost: 2, type: "resist", kind: "攻撃", art: ["resist", 1],
    text: "5ダメージ。石化の1/4だけ追加ダメージ。石化-5。", play: () => { damage(5 + Math.floor(state.player.petri / 4)); petri(-5); }
  },
  stoneCounter: {
    name: "石刃返し", cost: 1, type: "resist", kind: "攻撃", art: ["resist", 4],
    text: "7ダメージ。石化30以上なら追加で7ダメージ。石化-3。", play: () => { damage(7); if (state.player.petri >= 30) damage(7); petri(-3); }
  },
  stoneDustPurge: {
    name: "石粉払い", cost: 1, type: "resist", kind: "スキル", art: ["resist", 5],
    text: "石化-5。手札の任意のカードを1枚捨てる。カードを1枚引く。",
    play: async () => { petri(-5); await discardAnyCardFromHand(); draw(1, "added"); }
  },
  crackRiposte: {
    name: "亀裂の返し", cost: 4, type: "resist", kind: "パワー", art: ["resist", 6],
    text: "この戦闘中、石化値が蓄積するたびにHP-1、敵に6ダメージ。廃棄。",
    exhaust: true,
    play: () => {
      state.player.crackRiposte = (state.player.crackRiposte || 0) + 1;
      state.player.crackRiposteDamage = (state.player.crackRiposteDamage || 0) + 6;
    }
  },
  statueReservoir: {
    name: "石肌の反応", cost: 1, type: "resist", kind: "パワー", art: ["resist", 7],
    text: "この戦闘中、石化値が蓄積するたびに3ブロックを得る。廃棄。",
    exhaust: true,
    play: () => {
      state.player.stoneSkinReaction = (state.player.stoneSkinReaction || 0) + 1;
      state.player.stoneSkinReactionBlock = (state.player.stoneSkinReactionBlock || 0) + 3;
    }
  },
  crackEnergy: {
    name: "亀裂の炉心", cost: 0, type: "resist", kind: "スキル", art: ["resist", 8],
    text: "石化-3。エナジー+1。石化30以上なら、さらにエナジー+1。廃棄。",
    exhaust: true,
    play: () => { const bonus = state.player.petri >= 30 ? 2 : 1; petri(-3); state.energy += bonus; }
  },
  echoingCrack: {
    name: "残響の石紋", cost: 2, type: "resist", kind: "スキル", art: ["resist", 9],
    text: "この戦闘中、石化のしきい値を超えた時、山札のランダムなカードをコスト0・エセリアルで手札にコピーする。廃棄。",
    exhaust: true,
    play: () => { state.player.echoStoneSigil = (state.player.echoStoneSigil || 0) + 1; }
  },
  desperatePurification: {
    name: "捨て身の浄化", cost: 0, type: "resist", kind: "スキル", art: ["resist", 10],
    text: "エナジー+1。カードを1枚引く。手札の中から1枚を選び廃棄。",
    play: async () => { state.energy += 1; draw(1, "added"); await exhaustAnyCardFromHand({ required: true, source: "捨て身の浄化" }); }
  },
  wreckageBreath: {
    name: "残骸の呼吸", cost: 1, type: "resist", kind: "パワー", art: ["resist", 11],
    text: "この戦闘中、カードを廃棄するたび石化-2。廃棄。",
    exhaust: true,
    play: () => {
      state.player.exhaustBreath = (state.player.exhaustBreath || 0) + 1;
      state.player.exhaustBreathAmount = (state.player.exhaustBreathAmount || 0) + 2;
    }
  },
  marbleGuard: {
    name: "大理石の構え", cost: 2, type: "resist", kind: "スキル", art: ["resist", 2],
    text: "12ブロック。石化50以上なら筋力+1。", play: () => { block(12); if (state.player.petri >= 50) state.player.str++; }
  },
  shatter: {
    name: "石殻砕き", cost: 2, type: "resist", kind: "攻撃", art: ["resist", 3],
    text: "14ダメージ。石化-8。手札の呪い1枚を廃棄。", play: () => { damage(14); petri(-8); exhaustCurseFromHand(); }
  },
  burden: {
    name: "石の重み", cost: 9, type: "curse", kind: "状態", art: ["petri", 0],
    text: "プレイ不可。ターン終了時、石化+4。", unplayable: true
  },
  statueDream: {
    name: "沈む体温", cost: 1, type: "curse", kind: "状態", art: ["petri", 2],
    text: "ブロックを全て失う。石化-10。廃棄。", exhaust: true,
    play: () => { state.player.block = 0; petri(-10); }
  },
  ritualManacle: {
    name: "典礼の石枷", cost: 2, type: "petrify", kind: "スキル", art: ["petri", 6],
    text: "手札にある間、他の手札を一時的に石化したカードへ変化させ、コスト+1。使用時、他の手札の石化を解除し、プレート+2。廃棄。",
    retain: true,
    exhaust: true,
    play: () => plate(2)
  },
  waxTearGaze: {
    name: "蝋涙の凝視", cost: 9, type: "curse", kind: "状態", art: ["special", 4],
    text: "プレイ不可。ターン終了時、石化+6。次ターン、手札1枚が石化する。", unplayable: true, ethereal: true
  }
};

const enemies = [
  {
    id: "acolyte",
    name: "石蛇の侍祭",
    hp: 42,
    image: "assets/enemy_acolyte.png",
    actions: [
      { type: "attack", label: "裂爪", attack: 10, petri: 5 },
      { type: "curse", label: "石粉", attack: 4, petri: 9, mutateCard: 1 },
      { type: "brittle", label: "硬化の呪い", attack: 3, petri: 4, brittle: 2 }
    ],
    routine: [
      { type: "attack", label: "裂爪", attack: 10, petri: 5 },
      { type: "curse", label: "石粉", attack: 4, petri: 9, mutateCard: 1 },
      { type: "brittle", label: "硬化の呪い", attack: 3, petri: 4, brittle: 2 }
    ]
  },
  {
    name: "刻印の彫像師",
    hp: 50,
    image: "assets/enemy_sculptor.png",
    id: "sculptor",
    injectCardEvery: 3,
    actions: [
      { type: "attack", label: "鑿打ち", attack: 9, petri: 4 },
      { type: "brand", label: "刻印追加", attack: 4, petri: 5, brands: 1 },
      { type: "brittle", label: "脆石化", attack: 5, petri: 6, brittle: 2 }
    ],
    routine: [
      { type: "brand", label: "刻印追加", attack: 4, petri: 5, brands: 1 },
      { type: "attack", label: "鑿打ち", attack: 9, petri: 4 },
      { type: "brittle", label: "脆石化", attack: 5, petri: 6, brittle: 2 },
      { type: "attack", label: "鑿打ち", attack: 9, petri: 4 }
    ]
  },
  {
    name: "灰色の彫像鍛冶",
    hp: 62,
    image: "assets/enemy_smith.png",
    id: "smith",
    actions: [
      { type: "attack", label: "石槌", attack: 15, petri: 4 },
      { type: "guard", label: "石鎧", block: 12, petri: 5 },
      { type: "curse", label: "重化", attack: 8, addCard: "heavyKnee" }
    ],
    routine: [
      { type: "guard", label: "石鎧", block: 12, petri: 5 },
      { type: "attack", label: "石槌", attack: 15, petri: 4 },
      { type: "curse", label: "重化", attack: 8, addCard: "heavyKnee" },
      { type: "attack", label: "石槌", attack: 15, petri: 4 }
    ]
  },
  {
    name: "石粉を撒く修道士",
    hp: 56,
    image: "assets/enemy_stone_powder_acolyte.png",
    id: "stonePowderAcolyte",
    actions: [
      { type: "curse", label: "石粉散布", attack: 5, petri: 4, brands: 1 },
      { type: "guard", label: "粉塵の祈り", block: 10, petri: 4, mutateCard: 1 },
      { type: "curse", label: "石灰の目潰し", attack: 10, blockPenalty: 5 },
      { type: "brittle", label: "沈殿の呪い", petri: 8, brittle: 1 }
    ],
    routine: [
      { type: "curse", label: "石粉散布", attack: 5, petri: 4, brands: 1 },
      { type: "guard", label: "粉塵の祈り", block: 10, petri: 4, mutateCard: 1 },
      { type: "curse", label: "石灰の目潰し", attack: 10, blockPenalty: 5 },
      { type: "brittle", label: "沈殿の呪い", petri: 8, brittle: 1 }
    ]
  },
  {
    name: "石喰いの猟犬",
    hp: 58,
    image: "assets/enemy_stone_eater_hound.png",
    id: "stoneEaterHound",
    actions: [
      { type: "attack", label: "噛み裂き", attack: 12 },
      { type: "brittle", label: "石牙の唸り", attack: 6, brittle: 2 },
      { type: "curse", label: "かじり取る", attack: 9, addCard: "crackedFinger" },
      { type: "attack", label: "飛びかかり", attack: 14, petri: 3 }
    ],
    routine: [
      { type: "attack", label: "噛み裂き", attack: 12 },
      { type: "brittle", label: "石牙の唸り", attack: 6, brittle: 2 },
      { type: "curse", label: "かじり取る", attack: 9, addCard: "crackedFinger" },
      { type: "attack", label: "飛びかかり", attack: 14, petri: 3 }
    ]
  },
  {
    name: "沈黙の石化司祭",
    hp: 150,
    image: "assets/enemy_priest.png",
    id: "stonePriest",
    opening: "祈りは終わった。ここからは石だけが答える。",
    actions: [
      { type: "curse", label: "沈黙の開帳", block: 1, str: 5, dex: 5, petri: 6 },
      { type: "curse", label: "石印の連祷", attack: 9, petri: 8, addCard: "priestSeal" },
      { type: "curse", label: "沈む体温", attack: 3, addCard: "statueDream", drawPenalty: 1 },
      { type: "brittle", label: "神殿の圧", attack: 7, blockPenalty: 6, addCard: "priestSeal", brittle: 2 },
      { type: "attack", label: "石蛇の大牙", attack: 11, petri: 8 },
      { type: "guard", label: "無音の再誓", block: 5, addDiscardCard: "burden", addDiscardCardCount: 3 }
    ],
    routine: [
      { type: "curse", label: "沈黙の開帳", block: 1, str: 5, dex: 5, petri: 6 },
      { type: "curse", label: "石印の連祷", attack: 9, petri: 8, addCard: "priestSeal" },
      { type: "curse", label: "沈む体温", attack: 3, addCard: "statueDream", drawPenalty: 1 },
      { type: "brittle", label: "神殿の圧", attack: 7, blockPenalty: 6, addCard: "priestSeal", brittle: 2 },
      { type: "attack", label: "石蛇の大牙", attack: 11, petri: 8 },
      { type: "guard", label: "無音の再誓", block: 5, addDiscardCard: "burden", addDiscardCardCount: 3 }
    ]
  },
  {
    name: "鐘を背負う巡礼",
    hp: 60,
    image: "assets/enemy_bell_pilgrim.png",
    id: "bellPilgrim",
    actions: [
      { type: "guard", label: "鐘楼の祈り", block: 14, addCard: "burden" },
      { type: "attack", label: "鈍い鐘音", attack: 9, petri: 5, drawPenalty: 1 },
      { type: "attack", label: "巡礼杖", attack: 6, petri: 3 },
      { type: "curse", label: "余韻の石粉", attack: 5, brands: 1, drawPenalty: 1 }
    ],
    routine: [
      { type: "guard", label: "鐘楼の祈り", block: 14, addCard: "burden" },
      { type: "attack", label: "鈍い鐘音", attack: 9, petri: 5, drawPenalty: 1 },
      { type: "attack", label: "巡礼杖", attack: 6, petri: 3 },
      { type: "curse", label: "余韻の石粉", attack: 5, brands: 1, drawPenalty: 1 }
    ]
  },
  {
    name: "砕けた石像兵",
    hp: 74,
    image: "assets/enemy_broken_statue_soldier.png",
    id: "brokenStatueSoldier",
    actions: [
      { type: "guard", label: "石核の鼓動", block: 12, str: 3 },
      { type: "attack", label: "破城突き", attack: 14, selfStunOnFullBlock: true },
      { type: "attack", label: "崩落斬り", attack: 10, petri: 6, selfStunOnFullBlock: true },
      { type: "guard", label: "再武装", block: 10, str: 4 }
    ],
    routine: [
      { type: "guard", label: "石核の鼓動", block: 12, str: 3 },
      { type: "attack", label: "破城突き", attack: 14, selfStunOnFullBlock: true },
      { type: "attack", label: "崩落斬り", attack: 10, petri: 6, selfStunOnFullBlock: true },
      { type: "guard", label: "再武装", block: 10, str: 4 },
      { type: "attack", label: "粉砕連撃", attack: 8, petri: 4, selfStunOnFullBlock: true }
    ]
  }
];

const enemyById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy]));
const finalBossEnemy = enemyById.stonePriest;
const roamingEnemies = enemies.filter((enemy) => enemy.id !== finalBossEnemy.id);
const floorEnemyPools = [
  { maxFloor: 1, ids: ["acolyte", "sculptor"] },
  { maxFloor: 3, ids: ["acolyte", "sculptor", "smith", "stonePowderAcolyte"] },
  { maxFloor: 5, ids: ["smith", "stonePowderAcolyte", "stoneEaterHound", "bellPilgrim"] },
  { maxFloor: Infinity, ids: ["stonePowderAcolyte", "stoneEaterHound", "bellPilgrim"] }
];

const eliteEnemies = [
  {
    name: "石喰いの典礼騎士",
    hp: 86,
    image: "assets/enemy_elite_knight_cutout.png",
    opening: "跪け。石枷は祈りよりも確かだ。",
    actions: [
      { type: "attack", label: "典礼粉砕", attack: 15, petri: 6 },
      { type: "curse", label: "石枷の授与", attack: 7, petri: 5, addCard: "ritualManacle", ritualFollowup: true },
      { type: "guard", label: "供物の盾", attack: 8, block: 18, mutateCard: 1 },
      { type: "attack", label: "重圧の誓句", attack: 9, addCard: "ritualManacle", drawPenalty: 1 }
    ],
    routine: [
      { type: "curse", label: "石枷の授与", attack: 7, petri: 5, addCard: "ritualManacle", ritualFollowup: true },
      { type: "attack", label: "抑えつける石剣", attack: 9, fixedAttack: true },
      { type: "guard", label: "供物の盾", attack: 8, block: 18, mutateCard: 1 },
      { type: "attack", label: "典礼粉砕", attack: 15, petri: 6 },
      { type: "attack", label: "重圧の誓句", attack: 9, addCard: "ritualManacle", drawPenalty: 1 },
      { type: "brittle", label: "硬化の呪い", petri: 4, brittle: 2 }
    ]
  },
  {
    name: "蝋涙の石眼姫",
    hp: 80,
    image: "assets/enemy_elite_princess_cutout.png",
    opening: "泣かないで。まばたきも、すぐ石になるわ。",
    injectCard: true,
    actions: [
      { type: "curse", label: "石眼の命令", petri: 12, addCard: "waxTearGaze" },
      { type: "attack", label: "蝋涙の雨", attack: 14, petri: 4, brands: 1 },
      { type: "curse", label: "静止の祝福", drawPenalty: 1, addCard: "waxTearGaze" },
      { type: "attack", label: "灯芯の蛇", attack: 17, brittle: 2 }
    ],
    routine: [
      { type: "curse", label: "静止の祝福", drawPenalty: 1, addCard: "waxTearGaze" },
      { type: "attack", label: "蝋涙の雨", attack: 14, petri: 4, brands: 1 },
      { type: "curse", label: "石眼の命令", petri: 12, addCard: "waxTearGaze" },
      { type: "attack", label: "灯芯の蛇", attack: 17, brittle: 2 }
    ]
  }
];

const relics = [
  { id: "warmCoal", name: "残り火の小片", text: "戦闘開始時、HPを2回復する。", onCombatStart: () => heal(2) },
  { id: "serpentScale", name: "石蛇の鱗", text: "戦闘開始時、プレート+1。", onCombatStart: () => plate(1) },
  { id: "quietBell", name: "静寂の鈴", text: "戦闘開始時、石化-3。", onCombatStart: () => petri(-3) },
  { id: "chippedLens", name: "欠けた水晶眼", text: "3ターンごとにカードを1枚引く。", onTurnStart: () => { if (state.turn % 3 === 0) draw(1); } },
  { id: "bronzeGear", name: "青銅の歯車", text: "3ターンごとにエナジー+1。", onTurnStart: () => { if (state.turn % 3 === 0) state.energy += 1; } },
  { id: "guardianChip", name: "守像の欠片", text: "3ターンごとに5ブロックを得る。", onTurnStart: () => { if (state.turn % 3 === 0) block(5); } },
  { id: "prayerNeedle", name: "祈り針", text: "戦闘開始時、筋力+1。", onCombatStart: () => { state.player.str += 1; } },
  { id: "softSandal", name: "柔らかな石履", text: "戦闘開始時、敏捷+1。", onCombatStart: () => { state.player.dex += 1; } }
];

const mapRoutes = {
  2: [
    { title: "白い泉", type: "rest", detail: "冷たい湧き水が石化の熱を少しだけ奪う脇道。", effect: "休憩か鍛冶" },
    { title: "瓦礫の近道", type: "event", detail: "鋭い破片を踏み越える短い道。奥で何かが待っている。", effect: "イベント" },
    { title: "砕石の小部屋", type: "treasure", detail: "古い破片を避けて進む安全寄りの道。少し息を整えられる。", effect: "HP+4 / レリック", hp: 4 },
    { title: "浅い石庭", type: "event", detail: "石の庭を横切る。奥の気配が、静かにこちらを招いている。", effect: "イベント" },
    { title: "崩れた寝所", type: "rest", detail: "石寝台の残る小部屋。安全とは言えないが、短い休息は取れそうだ。", effect: "休憩か鍛冶" }
  ],
  3: [
    { title: "崩れた回廊", type: "combat", detail: "正面の道。石像の気配は濃いが、足場はまだ安定している。", effect: "戦闘へ" },
    { title: "彫像の橋", type: "elite", detail: "無数の視線を浴びる橋。恐怖で石化がわずかに進む。", effect: "強敵へ" },
    { title: "沈黙の螺旋階段", type: "combat", detail: "遠回りだが、次の敵へ向かう気配がはっきり見える。", effect: "戦闘へ" },
    { title: "石面の門", type: "combat", detail: "顔のない石門が開く。中から硬い足音が響く。", effect: "戦闘へ" },
    { title: "見張りの廊下", type: "elite", detail: "通路の奥で大きな像がこちらを見下ろしている。", effect: "強敵へ" }
  ],
  4: [
    { title: "苔むした祭具室", type: "rest", detail: "割れた香炉と冷たい床。戦いの前に短く息を整えられる。", effect: "休憩か鍛冶" },
    { title: "石蛇の残響", type: "event", detail: "壁の彫刻が低く鳴る。残響の先に、奇妙な出来事の気配がある。", effect: "イベント" },
    { title: "沈んだ供物箱", type: "treasure", detail: "水底に沈んだ古い箱。拾い上げれば、わずかな活力が戻る。", effect: "HP+6 / レリック", hp: 6 },
    { title: "ひび割れた抜け道", type: "event", detail: "崩落しかけた細道。割れ目の奥に、見過ごせないものがある。", effect: "イベント" },
    { title: "灯の消えた祠", type: "rest", detail: "火の消えた祠。短く身を隠し、装備を見直せる。", effect: "休憩か鍛冶" },
    { title: "黒い水盤", type: "event", detail: "黒い水面に自分の石像が映る。水底から選択を迫る気配が漂う。", effect: "イベント" }
  ],
  5: [
    { title: "石兵の広間", type: "combat", detail: "並んだ石兵の一体が音もなく動き出す。", effect: "戦闘へ" },
    { title: "蛇紋の衛所", type: "elite", detail: "門番の像が武器を構える。避けるなら遠回りになる。", effect: "強敵へ" },
    { title: "灰色の巡礼路", type: "combat", detail: "祈りの列が途切れた道。敵影だけがまだ歩いている。", effect: "戦闘へ" },
    { title: "閉ざされた中庭", type: "combat", detail: "出口を探す間に、石の足音が近づいてくる。", effect: "戦闘へ" },
    { title: "司祭の前室", type: "elite", detail: "祭壇を守る強い気配が前室を満たしている。", effect: "強敵へ" },
    { title: "白粉の小径", type: "event", detail: "白い粉がうっすら残る小径。誰かが通った跡だけが石畳に続いている。", effect: "イベント" }
  ],
  6: [
    { title: "最後の泉", type: "rest", detail: "深部に残った最後の静けさ。ここを過ぎれば祭壇は近い。", effect: "休憩か鍛冶" },
    { title: "黄金の破片", type: "treasure", detail: "砕けた像の胸元に光る破片。触れると熱が戻る。", effect: "HP+8 / レリック", hp: 8 },
    { title: "呪文の壁画", type: "event", detail: "読めない文字が壁一面に刻まれている。触れれば何かが起きそうだ。", effect: "イベント" },
    { title: "封じられた薬棚", type: "treasure", detail: "古い薬棚が半分だけ開いている。使えるものが少し残っている。", effect: "HP+5 / 石化-2 / レリック", hp: 5, petri: -2 },
    { title: "冷えた控え間", type: "rest", detail: "祭壇前の控え間。最後の準備をするには十分な静けさがある。", effect: "休憩か鍛冶" },
    { title: "閉じた小部屋", type: "event", detail: "扉の隙間から、冷たい蝋の匂いに似た空気が漏れている。", effect: "イベント" },
    { title: "崩れた詰所", type: "combat", detail: "古い武具と石片が散らばる詰所。奥で何かが軋む音がする。", effect: "戦闘へ" }
  ],
  7: [
    { title: "最終祭壇", type: "elite", detail: "分かれていた道はここで一つになる。石蛇司祭が待っている。", effect: "最終戦へ", final: true }
  ]
};

const mapNodeTypes = {
  combat: { label: "戦闘", icon: "⚔" },
  elite: { label: "強敵", icon: "♜" },
  rest: { label: "休憩", icon: "✚" },
  treasure: { label: "宝箱", icon: "◆" },
  event: { label: "イベント", icon: "?" }
};

const mapEvents = [
  {
    id: "fountain",
    title: "ひび割れた聖泉",
    still: "assets/event_fountain.png",
    detail: "月光を含んだ水が、石の器の底でかすかに揺れている。澄んで見える水面の下には、石化の呪いが沈殿している。",
    choices: [
      {
        label: "水を飲む",
        preview: "呪いを取り込む: 防御をすべて重い膝に変化 / 毎ターン引くカード+1",
        apply: () => {
          const targets = state.deck.filter((card) => card.id === "defend");
          for (const card of targets) transformCard(card, "heavyKnee");
          state.drawBonus += 1;
          return t("呪われた水を飲み干し、意識は妙に冴えた。毎ターン引くカードが1枚増えた。取り込んだ石化の呪いにより、所持していた防御{count}枚は重い膝に変化した。", { count: targets.length });
        }
      },
      {
        label: "傷口だけを洗う",
        preview: "HP-6 / 石化-10",
        apply: () => {
          state.player.hp = Math.max(1, state.player.hp - 6);
          petri(-10);
          return "傷口を洗うと、冷たい水が石化の熱を少し奪った。呪いを飲まずに済んだが、傷は少し開いてしまった。";
        }
      }
    ]
  },
  {
    id: "mirror",
    title: "沈黙の石鏡",
    still: "assets/event_mirror.png",
    detail: "曇った鏡面の奥に、石化した自分が立っている。こちらの息遣いに合わせて、鏡の像もわずかに動いた。",
    choices: [
      {
        label: "映る姿を受け入れる",
        preview: "カード獲得: 沈む体温 2枚",
        apply: () => {
          state.deck.push(freshCard("statueDream"), freshCard("statueDream"));
          return "鏡像の冷たさを受け入れた。沈む体温を2枚獲得した。";
        }
      },
      {
        label: "鏡を砕く",
        preview: "呪い/石化カードを1枚除去。なければ最大HP+4 / HP-5",
        apply: () => {
          const index = state.deck.findIndex((card) => card.type === "curse" || card.type === "petrify");
          state.player.hp = Math.max(1, state.player.hp - 5);
          if (index >= 0) {
            const [removed] = state.deck.splice(index, 1);
            return t("{card}を砕けた鏡の奥へ捨てた。破片で少し傷を負った。", { card: localizeName(removed) });
          }
          state.player.maxHp += 4;
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 4);
          return "砕けた鏡から逃げ切ったことで、精神が少し強くなった。";
        }
      }
    ]
  },
  {
    id: "reliquary",
    title: "埋もれた聖遺箱",
    still: "assets/event_reliquary.png",
    detail: "床から伸びた石の手が、古い箱を抱え込んでいる。蓋の隙間からは、金色の光が細く漏れていた。",
    choices: [
      {
        label: "箱をこじ開ける",
        preview: "カード獲得: 石腕の大断ち / HP-35",
        disabled: () => state.player.hp <= 35,
        disabledText: "HPが36以上ないため選べない",
        apply: () => {
          state.deck.push(freshCard("stoneCleave"));
          state.player.hp = Math.max(1, state.player.hp - 35);
          return "大きく傷つきながら箱をこじ開けた。石腕の大断ちを獲得した。";
        }
      },
      {
        label: "手をほどいて封じる",
        preview: "カード獲得: ひび割れた指 / カード獲得: 石の重み",
        apply: () => {
          state.deck.push(freshCard("crackedFinger"));
          state.deck.push(freshCard("burden"));
          return "石の手は静かに崩れた。封じる途中で指先に石化の力が染み込み、ひび割れた指を獲得した。封じた重みもデッキに残った。";
        }
      }
    ]
  },
  {
    id: "altar",
    title: "蝋涙の祭壇",
    still: "assets/event_altar.png",
    detail: "赤い蝋燭が燃え尽きかけた祭壇に、剣の形をした淡い祝福が浮いている。だが床の裂け目からは、石化の瘴気が細く漂っている。",
    choices: [
      {
        label: "祈りを捧げる",
        preview: "ランダムな未強化カードを強化 / 瘴気により所持カード1枚を固着する姿勢に変化",
        requiresTransformSelection: true,
        transformTo: "frozenPose",
        apply: () => {
          const candidates = state.deck.filter((card) => !card.upgraded && !card.unplayable);
          const upgraded = shuffle(candidates)[0];
          if (upgraded) upgradeCard(upgraded);
          return candidates.length
            ? t("祭壇の祝福が{card}を鍛えた。しかし祈りに反応して周囲の石化の瘴気が濃くなる。所持カードを1枚選び、固着する姿勢に変化させる。", { card: localizeName(upgraded) })
            : "祝福は鍛えるカードを見つけられなかった。しかし祈りに反応して周囲の石化の瘴気が濃くなる。所持カードを1枚選び、固着する姿勢に変化させる。";
        }
      },
      {
        label: "血を一滴捧げる",
        preview: "最大HP-5 / 最大エナジー+1",
        apply: () => {
          state.player.maxHp = Math.max(1, state.player.maxHp - 5);
          state.player.hp = Math.min(state.player.hp, state.player.maxHp);
          state.maxEnergy += 1;
          return "痛みと引き換えに、次の戦いで動ける余地が増えた。";
        }
      }
    ]
  },
  {
    id: "crackedGoddess",
    title: "割れた女神像",
    still: "assets/event_cracked_goddess.png",
    detail: "顔の半分を失った女神像が、剣を掲げる者を待っている。足元には古い祈りと砕けた護符が積もっている。",
    choices: [
      {
        label: "祈りを捧げる",
        preview: "石化+10 / ランダムなカード1枚を強化 / レリック獲得",
        apply: () => {
          petri(10);
          const candidates = state.deck.filter((card) => !card.upgraded && !card.unplayable);
          const upgraded = shuffle(candidates)[0];
          if (upgraded) upgradeCard(upgraded);
          const relic = gainRandomRelic();
          const upgradeText = upgraded ? t("{card}が強化された。", { card: localizeName(upgraded) }) : t("強化できるカードはなかった。");
          const relicText = relic ? t("レリック「{relic}」を得た。", { relic: localizeName(relic) }) : t("新しいレリックは残っていなかった。");
          return t("女神像の割れ目から灰色の光がこぼれた。{upgrade} {relic} 代償として石化が進んだ。", { upgrade: upgradeText, relic: relicText });
        }
      },
      {
        label: "剣を預ける",
        preview: "HP-8 / ランダムな攻撃カード1枚を強化 / 石化-6",
        disabled: () => state.player.hp <= 8,
        disabledText: "HPが足りない",
        apply: () => {
          state.player.hp = Math.max(1, state.player.hp - 8);
          const candidates = state.deck.filter((card) => !card.upgraded && card.kind === "攻撃");
          const upgraded = shuffle(candidates)[0];
          if (upgraded) upgradeCard(upgraded);
          petri(-6);
          return upgraded
            ? t("剣を像の手に預けると、{card}の刃筋が澄んだ。代わりに体から熱が少し失われた。", { card: localizeName(upgraded) })
            : "剣を預けたが、強化できる攻撃カードはなかった。冷たい祈りだけが石化を少し削った。";
        }
      }
    ]
  },
  {
    id: "stonePowderMerchant",
    title: "石粉商人",
    still: "assets/event_stone_powder_merchant.png",
    detail: "覆面の商人が白い粉袋と黒い小瓶を並べている。商品は便利そうだが、どれも指先を冷やす。",
    choices: [
      {
        label: "急燃粉を買う",
        preview: "カード獲得: 石化の急燃 / HP+8 / 石化+8",
        cards: ["petriEnergySurge"],
        apply: () => {
          state.deck.push(freshCard("petriEnergySurge"));
          heal(8);
          petri(8);
          return "急燃粉を受け取ると、傷は塞がったが肌の下で石化が熱を帯びた。石化の急燃を獲得した。";
        }
      },
      {
        label: "供物袋を盗む",
        preview: "カード獲得: 化石の供物 / 石化の刻印を1枚獲得",
        cards: ["fossilOffering", "stoneBrand"],
        apply: () => {
          state.deck.push(freshCard("fossilOffering"));
          state.deck.push(freshCard("stoneBrand"));
          return "商人の視線をかいくぐって供物袋を奪った。化石の供物を得たが、袋には石化の刻印も混ざっていた。";
        }
      },
      {
        label: "粉払いの薬を選ぶ",
        preview: "カード獲得: 石粉払い / 石化-8",
        cards: ["stoneDustPurge"],
        apply: () => {
          state.deck.push(freshCard("stoneDustPurge"));
          petri(-8);
          return "薬を振りかけると関節の石粉がほどけた。石粉払いを獲得し、石化が少し後退した。";
        }
      }
    ]
  },
  {
    id: "waxPrayerRoom",
    title: "封蝋の祈祷室",
    still: "assets/event_wax_prayer_room.png",
    detail: "蝋で閉じられた祈祷書が、棚の中で淡く脈打っている。願いを封じるほど、手元には残りやすくなる。",
    choices: [
      {
        label: "封蝋で留める",
        preview: "ランダムなカード1枚に保留を付与 / 石化+6",
        apply: () => {
          const candidates = state.deck.filter((card) => !card.unplayable && !card.retain);
          const sealed = shuffle(candidates)[0];
          if (sealed) {
            sealed.retain = true;
            if (!sealed.text.includes("保留")) sealed.text += " 保留。";
          }
          petri(6);
          return sealed
            ? t("{card}に封蝋の祈りが刻まれ、手札に残せるようになった。指先には冷たい蝋が貼りついた。", { card: localizeName(sealed) })
            : "封じられるカードはなかった。蝋の冷たさだけが石化を進めた。";
        }
      },
      {
        label: "祈祷を写す",
        preview: "カード獲得: 封じた決意 / 次刻の印",
        cards: ["sealedResolve", "nextTurnSigil"],
        apply: () => {
          state.deck.push(freshCard("sealedResolve"));
          state.deck.push(freshCard("nextTurnSigil"));
          return "祈祷書の余白を写し取った。封じた決意と次刻の印を獲得した。";
        }
      },
      {
        label: "蝋を剥がす",
        preview: "保留カード1枚を強化 / HP-6",
        disabled: () => !state.deck.some((card) => card.retain && !card.upgraded) || state.player.hp <= 6,
        disabledText: "強化できる保留カードかHPが足りない",
        apply: () => {
          state.player.hp = Math.max(1, state.player.hp - 6);
          const candidates = state.deck.filter((card) => card.retain && !card.upgraded);
          const upgraded = shuffle(candidates)[0];
          if (upgraded) upgradeCard(upgraded);
          return upgraded
            ? `爪先で封蝋を剥がすと、${upgraded.name}に閉じ込められた祈りが強くなった。`
            : "剥がせる封蝋は見つからなかった。";
        }
      }
    ]
  }
];

const debugParams = typeof location !== "undefined"
  ? new URLSearchParams(location.search)
  : null;
const debugMapValue = debugParams?.get("debugMap") || "";
const debugMapSelect = typeof location !== "undefined"
  && (debugParams.has("debugMap") || location.hash.includes("debugMap"));
const debugFreeMapSelect = debugMapSelect
  && (debugMapValue === "free" || location.hash.includes("debugMap=free"));
const debugFastMode = Boolean(debugParams?.has("testFast") || location.hash.includes("testFast"));
const debugAutoChoices = Boolean(debugParams?.has("autoChoices") || location.hash.includes("autoChoices"));
const debugNoGameOver = Boolean(debugParams?.has("noGameOver") || location.hash.includes("noGameOver"));

function debugDelay(ms) {
  return debugFastMode ? Math.min(ms, 1) : ms;
}

function debugTimeout(callback, ms) {
  return window.setTimeout(callback, debugDelay(ms));
}

function clampPlayerHp(value) {
  return debugNoGameOver ? Math.max(1, value) : Math.max(0, value);
}

function clampPlayerPetri(value) {
  const maxPetri = debugNoGameOver ? 99 : 100;
  return Math.max(0, Math.min(maxPetri, value));
}

function setPhase(phase) {
  if (state) state.phase = phase;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedPick(weightedItems) {
  const total = weightedItems.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of weightedItems) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return weightedItems[weightedItems.length - 1].value;
}

function weightedBranchCount(max) {
  const options = [
    { value: 1, weight: 30 },
    { value: 2, weight: 55 },
    { value: 3, weight: 15 }
  ].filter((item) => item.value <= max);
  return weightedPick(options);
}

function createMapSpreads(floorPlans) {
  let spread = 34;
  return floorPlans.map((plan, index) => {
    if (index === 0) return spread;
    const delta = weightedPick([
      { value: -18, weight: 18 },
      { value: -10, weight: 22 },
      { value: 0, weight: 18 },
      { value: 12, weight: 28 },
      { value: 20, weight: 14 }
    ]);
    const minimum = index < 2 ? 34 : 42;
    const maximum = index < 3 ? 72 : 88;
    spread = Math.max(minimum, Math.min(maximum, spread + delta));
    return spread;
  });
}

function nodeX(index, count, spread) {
  if (count === 1) return 50;
  const left = 50 - spread / 2;
  const base = left + index * (spread / (count - 1));
  return Math.max(7, Math.min(93, base + randomInt(-2, 2)));
}

function connectMapLayers(fromNodes, toNodes) {
  const edges = [];
  const targetsBySource = fromNodes.map(() => new Set());
  const fromCount = fromNodes.length;
  const toCount = toNodes.length;

  for (let target = 0; target < toCount; target++) {
    const owner = Math.min(fromCount - 1, Math.floor(target * fromCount / toCount));
    targetsBySource[owner].add(target);
  }

  for (let i = 0; i < fromCount; i++) {
    if (targetsBySource[i].size) continue;
    const nearest = fromCount === 1 ? 0 : Math.round(i * (toCount - 1) / (fromCount - 1));
    targetsBySource[i].add(nearest);
  }

  for (let i = 0; i < fromCount; i++) {
    if (targetsBySource[i].size >= 3 || Math.random() >= 0.9) continue;
    const targets = [...targetsBySource[i]].sort((a, b) => a - b);
    const extra = targets[targets.length - 1] + 1;
    if (extra >= toCount) continue;
    const nextTargets = i + 1 < fromCount ? [...targetsBySource[i + 1]].sort((a, b) => a - b) : [];
    if (nextTargets.length && extra > nextTargets[0]) continue;
    targetsBySource[i].add(extra);
  }

  for (let i = 0; i < fromCount; i++) {
    if (targetsBySource[i].size >= 3 || Math.random() >= 0.08) continue;
    const direction = Math.random() < 0.5 ? 1 : -1;
    const targets = [...targetsBySource[i]].sort((a, b) => a - b);
    const extra = direction > 0 ? targets[targets.length - 1] + 1 : targets[0] - 1;
    if (extra < 0 || extra >= toCount) continue;
    const prevTargets = i > 0 ? [...targetsBySource[i - 1]].sort((a, b) => a - b) : [];
    const nextTargets = i + 1 < fromCount ? [...targetsBySource[i + 1]].sort((a, b) => a - b) : [];
    if (prevTargets.length && extra < prevTargets[prevTargets.length - 1]) continue;
    if (nextTargets.length && extra > nextTargets[0]) continue;
    targetsBySource[i].add(extra);
  }

  for (let i = 1; i < fromCount; i++) {
    if (targetsBySource[i].size >= 2 || Math.random() >= 0.52) continue;
    const targets = [...targetsBySource[i]].sort((a, b) => a - b);
    const extra = targets[0] - 1;
    if (extra < 0) continue;
    const prevTargets = [...targetsBySource[i - 1]].sort((a, b) => a - b);
    if (prevTargets.length && extra < prevTargets[prevTargets.length - 1]) continue;
    targetsBySource[i].add(extra);
  }

  for (let i = 0; i < fromCount; i++) {
    if (targetsBySource[i].size !== 1 || Math.random() >= 0.9) continue;
    const targets = [...targetsBySource[i]].sort((a, b) => a - b);
    const candidates = Math.random() < 0.5
      ? [targets[targets.length - 1] + 1, targets[0] - 1]
      : [targets[0] - 1, targets[targets.length - 1] + 1];
    for (const extra of candidates) {
      if (extra < 0 || extra >= toCount) continue;
      const prevTargets = i > 0 ? [...targetsBySource[i - 1]].sort((a, b) => a - b) : [];
      const nextTargets = i + 1 < fromCount ? [...targetsBySource[i + 1]].sort((a, b) => a - b) : [];
      if (prevTargets.length && extra < prevTargets[prevTargets.length - 1]) continue;
      if (nextTargets.length && extra > nextTargets[0]) continue;
      targetsBySource[i].add(extra);
      break;
    }
  }

  for (let i = 0; i < targetsBySource.length; i++) {
    if (targetsBySource[i].size > 3) {
      const kept = [...targetsBySource[i]].sort((a, b) => a - b).slice(0, 3);
      targetsBySource[i] = new Set(kept);
    }
    const targets = [...targetsBySource[i]].sort((a, b) => a - b);
    for (const target of targets) edges.push({ from: fromNodes[i].id, to: toNodes[target].id });
  }

  return edges;
}

function createRunMap() {
  const firstFloorRoutes = [
    { title: "石柱の入口", type: "combat", detail: "崩れた石柱の間を抜け、最初の敵と相対する。", effect: "初戦へ" },
    { title: "暗い参道", type: "combat", detail: "遺跡の中央へ続くまっすぐな道。石蛇の気配が近い。", effect: "初戦へ" },
    { title: "割れた回廊", type: "combat", detail: "ひび割れた床を越えて、戦闘の音がする方へ進む。", effect: "初戦へ" },
    { title: "沈んだ列柱", type: "combat", detail: "沈みかけた列柱の間から、石を引きずる音が聞こえる。", effect: "初戦へ" }
  ];
  const lateFloorRoutes = [
    { title: "石粉の礼拝堂", type: "combat", detail: "床一面に白い石粉が積もっている。奥から祈りの声が近づく。", effect: "戦闘へ" },
    { title: "獣爪の回廊", type: "combat", detail: "噛み砕かれた石像が散らばる道。低い唸り声が響く。", effect: "戦闘へ" },
    { title: "折れ槍の詰所", type: "combat", detail: "折れた槍と砕けた鎧が積まれた詰所。静かすぎるほど静かだ。", effect: "戦闘へ" },
    { title: "封じられた抜け道", type: "event", detail: "石扉の隙間から、冷えた風と古い魔力が漏れている。", effect: "イベント" },
    { title: "欠けた礼拝床", type: "event", detail: "床の中央に礼拝の跡がある。何が祀られていたのかは、もう分からない。", effect: "イベント" },
    { title: "白砂の野営地", type: "rest", detail: "砕けた大理石の砂地。長居は危険だが、身を休める余地はある。", effect: "休憩と鍛冶" },
    { title: "沈殿した供物台", type: "treasure", detail: "灰色の供物台に、小さな箱と温かい護符が残されている。", effect: "HP+5 / レリック", hp: 5 }
  ];
  const safeCombatRoute = firstFloorRoutes[0];
  const safeEventRoute = lateFloorRoutes.find((route) => route.type === "event") || safeCombatRoute;
  const safeTreasureRoute = lateFloorRoutes.find((route) => route.type === "treasure") || safeEventRoute;
  const safeRestRoute = lateFloorRoutes.find((route) => route.type === "rest") || safeCombatRoute;
  const lateEliteRoutes = mapRoutes[5].filter((route) => route.type === "elite");
  const earlyRoutes = (routes) => routes.filter((route) => route.type !== "elite");
  const forceSafeRoute = (routes, safeRoute) => [
    safeRoute,
    ...shuffle(routes.filter((route) => route !== safeRoute))
  ];

  const floorPlans = [
    { floor: 1, y: 146, min: 2, max: 2, routes: firstFloorRoutes },
    { floor: 2, y: 136, min: 3, max: 4, routes: earlyRoutes(mapRoutes[2]), safeRoute: safeEventRoute },
    { floor: 3, y: 126, min: 3, max: 4, routes: earlyRoutes(mapRoutes[3]), safeRoute: safeCombatRoute },
    { floor: 4, y: 116, min: 3, max: 6, routes: earlyRoutes(mapRoutes[4]), safeRoute: safeRestRoute },
    { floor: 5, y: 106, min: 3, max: 5, routes: earlyRoutes(mapRoutes[5]), safeRoute: safeCombatRoute },
    { floor: 6, y: 96, min: 3, max: 5, routes: earlyRoutes(mapRoutes[6]), safeRoute: safeRestRoute },
    { floor: 7, y: 86, min: 3, max: 5, routes: lateFloorRoutes, safeRoute: safeCombatRoute },
    { floor: 8, y: 76, min: 3, max: 5, routes: [...lateEliteRoutes, ...lateFloorRoutes], safeRoute: safeEventRoute },
    { floor: 9, y: 66, min: 3, max: 5, routes: [...lateEliteRoutes, ...lateFloorRoutes], safeRoute: safeTreasureRoute },
    { floor: 10, y: 56, min: 3, max: 5, routes: earlyRoutes(mapRoutes[6]), safeRoute: safeCombatRoute },
    { floor: 11, y: 46, min: 3, max: 5, routes: [...lateEliteRoutes, ...lateFloorRoutes], safeRoute: safeRestRoute },
    { floor: 12, y: 36, min: 3, max: 5, routes: lateFloorRoutes, safeRoute: safeCombatRoute },
    { floor: 13, y: 26, min: 3, max: 5, routes: [...lateEliteRoutes, ...lateFloorRoutes], safeRoute: safeEventRoute },
    { floor: 14, y: 16, min: 3, max: 3, routes: [safeRestRoute], safeRoute: safeRestRoute }
  ];
  const start = { id: "start", x: 50, y: 154, type: "start", title: "出発点", floor: 0 };
  const boss = { id: "boss", x: 50, y: 5, floor: 15, ...mapRoutes[7][0] };
  const spreads = createMapSpreads(floorPlans);
  const layers = [[start]];

  for (const [planIndex, plan] of floorPlans.entries()) {
    const previousCount = layers[layers.length - 1].length;
    const max = Math.min(plan.max, plan.routes.length, previousCount * 3);
    const min = Math.min(plan.min, max);
    const count = randomInt(min, max);
    const routes = forceSafeRoute(plan.routes, plan.safeRoute || plan.routes[0]).slice(0, count);
    const nodes = routes.map((route, index) => ({
      id: `f${plan.floor}${String.fromCharCode(97 + index)}`,
      x: nodeX(index, count, spreads[planIndex]),
      y: plan.y,
      floor: plan.floor,
      ...route
    }));
    layers.push(nodes);
  }

  layers.push([boss]);
  const edges = layers.slice(0, -1).flatMap((layer, index) => connectMapLayers(layer, layers[index + 1]));
  for (let i = 0; i < layers.length - 1; i++) {
    const from = layers[i][0];
    const to = layers[i + 1][0];
    if (from && to && !edges.some((edge) => edge.from === from.id && edge.to === to.id)) {
      edges.push({ from: from.id, to: to.id });
    }
  }
  return {
    current: "start",
    visited: ["start"],
    nodes: layers.flat(),
    edges
  };
}

let state;
let audioContext;
let masterGain;

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.22;
  masterGain.connect(audioContext.destination);
}

function sound(type) {
  initAudio();
  if (audioContext.state === "suspended") audioContext.resume();
  const now = audioContext.currentTime;

  if (type === "slash") return playSweep(now, 620, 150, 0.14, 0.22, "sawtooth");
  if (type === "block") return playChord([260, 390, 520], now, 0.12, 0.13, "triangle");
  if (type === "petri") {
    playChord([110, 146, 196], now, 0.34, 0.16, "sine", true);
    return playNoise(now, 0.24, 0.08);
  }
  if (type === "enemy") return playSweep(now, 95, 70, 0.22, 0.18, "square");
  if (type === "notice") return playChord([392, 523, 784], now, 0.18, 0.12, "sine");
  if (type === "win") return playChord([330, 494, 659, 880], now, 0.34, 0.12, "triangle");
  if (type === "gameover") return playChord([220, 165, 110], now, 0.75, 0.16, "sine", true);
}

function playSweep(start, from, to, duration, volume, wave) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration * 0.8);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playChord(freqs, start, duration, volume, wave, descending = false) {
  freqs.forEach((freq, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const t = start + index * 0.035;
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (descending) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  });
}

function playNoise(start, duration, volume) {
  const bufferSize = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(start);
}

function freshCard(id) {
  return { ...library[id], art: [...library[id].art], id, uid: crypto.randomUUID() };
}

const upgradeRules = {
  strike: {
    text: "8ダメージ。",
    preview: "ダメージ 6 -> 8",
    play: () => damage(8)
  },
  guard: {
    text: "11ブロック。カードを1枚引く。",
    preview: "ブロック 8 -> 11",
    play: () => { block(11); draw(1); }
  },
  defend: {
    text: "8ブロック。",
    preview: "ブロック 5 -> 8",
    play: () => block(8)
  },
  lunge: {
    text: "6ダメージ。石化40未満なら10ダメージ。",
    preview: "基本ダメージ 4 -> 6 / 条件達成時 8 -> 10",
    play: () => damage(state.player.petri >= 40 ? 6 : 10)
  },
  focus: {
    text: "カードを2枚引く。石化-5。",
    preview: "ドロー 1 -> 2 / 石化軽減 -4 -> -5",
    play: () => { draw(2); petri(-5); }
  },
  stepSlash: {
    text: "11ダメージ。",
    preview: "ダメージ 8 -> 11",
    play: () => damage(11)
  },
  selectingSlash: {
    text: "10ダメージ。手札を1枚捨てる。カードを2枚引く。",
    preview: "ダメージ 8 -> 10 / ドロー 1 -> 2",
    play: () => { damage(10); discardOneFromHand(); draw(2, "added"); }
  },
  breathingGuard: {
    text: "9ブロック。カードを2枚引く。",
    preview: "ブロック 6 -> 9",
    play: () => { block(9); draw(2, "added"); }
  },
  heldStance: {
    cost: 0,
    text: "ターン終了まで筋力-1、敏捷+4。",
    preview: "敏捷 +3 -> +4",
    play: () => addTemporaryStats(-1, 4)
  },
  tacticalDiscard: {
    text: "手札の任意のカードを1枚捨てる。カードを3枚引く。",
    preview: "ドロー 2 -> 3",
    play: async () => { await discardAnyCardFromHand({ required: true, source: "戦術整理" }); draw(3, "added"); }
  },
  sealedResolve: {
    text: "10ブロック。手札のスキルカード1枚につき、さらに2ブロック。",
    preview: "基本ブロック 7 -> 10",
    play: () => block(10 + state.hand.filter((card) => card.kind === "スキル").length * 2)
  },
  nextTurnSigil: {
    text: "2ターンの間、ターン開始時にエナジー+2。廃棄。",
    preview: "ターン開始時エナジー +1 -> +2",
    play: () => addEnergySigil(2, 2)
  },
  shardCounterattack: {
    text: "7ダメージ。このターンにカードを廃棄していたなら、追加で13ダメージ。",
    preview: "ダメージ 5 -> 7 / 追加ダメージ 10 -> 13",
    play: () => { damage(7); if ((state.exhaustedThisTurn || 0) > 0) damage(13); }
  },
  cutAway: {
    text: "手札の中から1枚を選び廃棄。カードを2枚引く。",
    preview: "ドロー 1 -> 2",
    play: async () => { await exhaustAnyCardFromHand({ required: true, source: "切り捨て" }); draw(2, "added"); }
  },
  shardBulwark: {
    text: "8ブロック。このターンにカードを廃棄していたなら、追加で8ブロック。",
    preview: "ブロック 6 -> 8 / 追加ブロック 6 -> 8",
    play: () => { block(8); if ((state.exhaustedThisTurn || 0) > 0) block(8); }
  },
  crushingDefense: {
    text: "10ブロック。手札のランダムなカードを1枚廃棄。",
    preview: "ブロック 7 -> 10",
    play: () => { block(10); exhaustRandomCardFromHand("破砕防御"); }
  },
  rubbleFlash: {
    text: "12ダメージ。この戦闘中に廃棄したカード1枚につき追加で4ダメージ。",
    preview: "基本ダメージ 10 -> 12 / 追加ダメージ 3 -> 4",
    play: () => damage(12 + (state.exhaustedThisCombat || 0) * 4)
  },
  stoneFoot: {
    text: "敏捷性-1。8ブロック。廃棄。",
    preview: "ブロック 3 -> 8",
    play: () => { state.player.dex--; block(8); }
  },
  stoneBrand: {
    text: "石化+1。カードを1枚引く。廃棄。ターン終了時、手札に残っていると石化+7。",
    preview: "使用時の石化 +2 -> +1",
    play: () => { petri(1); draw(1, "added"); }
  },
  crackedFinger: {
    text: "カードを2枚引く。次に得るブロック-1。廃棄。",
    preview: "ドロー 1 -> 2 / ブロック低下 -2 -> -1",
    play: () => { draw(2); state.player.blockPenalty += 1; }
  },
  stoneSeed: {
    text: "石化+6。プレート+5。",
    preview: "プレート +3 -> +5",
    play: () => { petri(6); plate(5); }
  },
  heavyKnee: {
    text: "7ブロック。ターン終了時に手札に残っていると、次のターン開始時に石足の躓きを加える。",
    preview: "ブロック 4 -> 7",
    play: () => block(7)
  },
  stoneCleave: {
    text: "31ダメージ。石化+8。廃棄。",
    preview: "ダメージ 25 -> 31",
    play: () => { damage(31); petri(8); }
  },
  stiffJab: {
    text: "7ダメージ。石化+4。カードを1枚引く。",
    preview: "ダメージ 5 -> 7 / カードを1枚引く",
    play: () => { damage(7); petri(4); draw(1, "added"); }
  },
  crumblingGambit: {
    text: "手札のプレイ可能なカードをランダムに1枚、コストなしで自動的にプレイする。カードを1枚引く。廃棄。",
    preview: "コスト 1 -> 0 / カードを1枚引く効果を追加",
    cost: 0,
    play: async () => { await playRandomCardForFree(); draw(1, "added"); }
  },
  stoneMeditation: {
    text: "石化+5。カードを3枚引く。",
    preview: "ドロー 2 -> 3",
    play: () => { petri(5); draw(3, "added"); }
  },
  petriEnergySurge: {
    text: "石化+6。エナジー+3。廃棄。",
    preview: "エナジー +2 -> +3",
    play: () => { petri(6); state.energy += 3; }
  },
  fossilOffering: {
    text: "石化+7。手札の任意のカードを1枚廃棄。カードを3枚引く。",
    preview: "ドロー 2 -> 3",
    play: async () => { petri(7); await exhaustAnyCardFromHand({ required: true, source: "化石の供物" }); draw(3, "added"); }
  },
  stoneDeckCall: {
    text: "石化+6。山札からカードを3枚引く。廃棄。",
    preview: "ドロー 2 -> 3",
    play: () => { petri(6); draw(3, "added"); }
  },
  collapseChain: {
    text: "21ダメージ。この戦闘中に廃棄したカードが3枚以上なら、コスト-1。",
    preview: "ダメージ 16 -> 21",
    play: () => damage(21)
  },
  freezingPanic: {
    text: "石化+15。カードを2枚引く。エナジー+2。廃棄。保留。",
    preview: "保留を追加",
    retain: true,
    play: () => { petri(15); draw(2); state.energy += 2; }
  },
  marbleTears: {
    text: "石化+8。26ブロック。",
    preview: "ブロック 20 -> 26",
    play: () => { petri(8); block(26); }
  },
  frozenPose: {
    text: "石化+12。プレート+7。このターン攻撃できない。",
    preview: "プレート +6 -> +7",
    play: () => { petri(12); plate(7); state.attackLocked = true; }
  },
  resist: {
    text: "石化-16。3ブロック。",
    preview: "石化軽減 -13 -> -16 / ブロック 2 -> 3",
    play: () => { petri(-16); block(3); }
  },
  chisel: {
    text: "7ダメージ。石化の1/4に等しい追加ダメージ。石化-8。",
    preview: "基本ダメージ 5 -> 7 / 追加ダメージ 石化1/2 -> 石化1/4 / 石化軽減 -5 -> -8",
    play: () => { damage(7 + Math.floor(state.player.petri / 4)); petri(-8); }
  },
  stoneCounter: {
    text: "9ダメージ。石化30以上なら追加で9ダメージ。石化-5。",
    preview: "ダメージ 7 -> 9 / 追加ダメージ 7 -> 9 / 石化軽減 -3 -> -5",
    play: () => { damage(9); if (state.player.petri >= 30) damage(9); petri(-5); }
  },
  stoneDustPurge: {
    text: "石化-7。手札の任意のカードを1枚捨てる。カードを2枚引く。",
    preview: "石化軽減 -5 -> -7 / ドロー 1 -> 2",
    play: async () => { petri(-7); await discardAnyCardFromHand(); draw(2, "added"); }
  },
  crackRiposte: {
    text: "この戦闘中、石化値が蓄積するたびにHP-1、敵に8ダメージ。廃棄。",
    preview: "反撃ダメージ 6 -> 8",
    play: () => {
      state.player.crackRiposte = (state.player.crackRiposte || 0) + 1;
      state.player.crackRiposteDamage = (state.player.crackRiposteDamage || 0) + 8;
    }
  },
  statueReservoir: {
    text: "この戦闘中、石化値が蓄積するたびに4ブロックを得る。廃棄。",
    preview: "ブロック 3 -> 4",
    play: () => {
      state.player.stoneSkinReaction = (state.player.stoneSkinReaction || 0) + 1;
      state.player.stoneSkinReactionBlock = (state.player.stoneSkinReactionBlock || 0) + 4;
    }
  },
  crackEnergy: {
    text: "石化-5。エナジー+1。石化30以上なら、さらにエナジー+1。廃棄。",
    preview: "石化軽減 -3 -> -5",
    play: () => { const bonus = state.player.petri >= 30 ? 2 : 1; petri(-5); state.energy += bonus; }
  },
  echoingCrack: {
    text: "この戦闘中、石化のしきい値を超えた時、山札のランダムなカードをコスト0・エセリアルで手札にコピーする。カードを1枚引く。廃棄。",
    preview: "カードを1枚引く効果を追加",
    play: () => {
      state.player.echoStoneSigil = (state.player.echoStoneSigil || 0) + 1;
      draw(1, "added");
    }
  },
  desperatePurification: {
    text: "天賦。エナジー+1。カードを1枚引く。手札の中から1枚を選び廃棄。",
    preview: "天賦を追加",
    innate: true,
    play: async () => { state.energy += 1; draw(1, "added"); await exhaustAnyCardFromHand({ required: true, source: "捨て身の浄化" }); }
  },
  wreckageBreath: {
    text: "この戦闘中、カードを廃棄するたび石化-3。廃棄。",
    preview: "石化軽減 -2 -> -3",
    play: () => {
      state.player.exhaustBreath = (state.player.exhaustBreath || 0) + 1;
      state.player.exhaustBreathAmount = (state.player.exhaustBreathAmount || 0) + 3;
    }
  },
  marbleGuard: {
    text: "16ブロック。石化50以上なら筋力+1。",
    preview: "ブロック 12 -> 16",
    play: () => { block(16); if (state.player.petri >= 50) state.player.str++; }
  },
  shatter: {
    text: "18ダメージ。石化-10。手札の呪いか石化カードを1枚廃棄。",
    preview: "ダメージ 14 -> 18 / 石化軽減 -8 -> -10",
    play: () => { damage(18); petri(-10); exhaustCurseFromHand(); }
  }
};

function upgradePreview(card) {
  return upgradeRules[card.id]?.preview || "効果を強化する。";
}

function upgradeCard(card) {
  if (!card || card.upgraded) return false;
  const rule = upgradeRules[card.id];
  card.name = card.name.endsWith("+") ? card.name : `${card.name}+`;
  card.upgraded = true;
  if (rule) {
    if (Object.prototype.hasOwnProperty.call(rule, "cost")) card.cost = rule.cost;
    if (Object.prototype.hasOwnProperty.call(rule, "retain")) card.retain = rule.retain;
    if (Object.prototype.hasOwnProperty.call(rule, "exhaust")) card.exhaust = rule.exhaust;
    if (Object.prototype.hasOwnProperty.call(rule, "innate")) card.innate = rule.innate;
    card.text = rule.text;
    card.play = rule.play;
  } else {
    card.text = `${card.text} 強化済み。`;
  }
  return true;
}

  function transformCard(card, nextId) {
    if (!card || !library[nextId]) return null;
    const uid = card.uid;
    Object.assign(card, freshCard(nextId));
    card.uid = uid;
    return card;
  }

  const strongOpeningCardIds = [
    "rubbleFlash", "stoneCleave", "crumblingGambit", "marbleTears",
    "lunge", "fossilOffering", "crackEnergy", "stiffJab"
  ];

  const randomTransformCardIds = [
    "guard", "lunge", "stepSlash", "selectingSlash", "shardCounterattack", "rubbleFlash", "breathingGuard",
    "tacticalDiscard", "cutAway", "shardBulwark", "crushingDefense", "sealedResolve", "nextTurnSigil",
    "desperatePurification", "stoneSeed", "stoneMeditation", "petriEnergySurge", "stoneCleave", "stiffJab",
    "collapseChain", "crumblingGambit", "fossilOffering", "stoneDeckCall", "marbleTears", "frozenPose",
    "resist", "chisel", "stoneCounter", "stoneDustPurge", "crackRiposte", "wreckageBreath", "statueReservoir",
    "crackEnergy", "echoingCrack", "marbleGuard", "shatter", "focus"
  ];

  const openingEvent = {
    id: "openingChoice",
    title: "分かたれた石碑",
    still: "assets/event_opening_choice.png",
    detail: "出発点の手前で、二つの石碑が静かに光を放っている。片方を選べば、もう片方の光は道の奥へ沈んでいく。",
    choices: [
      {
        label: "古い戦技を受け取る",
        preview: "石碑に刻まれた強力なカードをランダムに1枚獲得 / 最大HP-10",
        apply: () => {
          const id = shuffle(strongOpeningCardIds)[0];
          const card = freshCard(id);
          state.deck.push(card);
          state.player.maxHp = Math.max(1, state.player.maxHp - 10);
          state.player.hp = Math.min(state.player.hp, state.player.maxHp);
          return t("{card}を獲得した。代償として最大HPが10下がった。", { card: localizeName(card) });
        }
      },
      {
        label: "基礎を研ぎ直す",
        preview: "斬撃と防御を1枚ずつ強化",
        apply: () => {
          const strike = state.deck.find((card) => card.id === "strike" && !card.upgraded);
          const defend = state.deck.find((card) => card.id === "defend" && !card.upgraded);
          if (strike) upgradeCard(strike);
          if (defend) upgradeCard(defend);
          return t("{card1}と{card2}を強化した。", {
            card1: strike ? localizeName(strike) : t("斬撃"),
            card2: defend ? localizeName(defend) : t("防御")
          });
        }
      },
      {
        label: "一枚を鍛える",
        preview: "任意のカード1枚を強化",
        requiresOpeningUpgradeSelection: true,
        apply: () => "石碑の光が、選ばれる一枚を待っている。"
      },
      {
        label: "一枚を組み替える",
        preview: "任意のカード1枚をランダムなカードに変化",
        requiresOpeningTransformSelection: true,
        apply: () => "石碑の影が、変わる一枚を待っている。"
      },
      {
        label: "遺された護符を拾う",
        preview: "ランダムなレリックを1つ獲得",
        apply: () => {
          const relic = gainRandomRelic();
          return relic ? t("レリック「{relic}」を獲得した。", { relic: localizeName(relic) }) : "新しいレリックは残されていなかった。";
        }
      },
      {
        label: "身体に道を刻む",
        preview: "最大HP+11",
        apply: () => {
          state.player.maxHp += 11;
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 11);
          return "最大HPが11上がった。";
        }
      }
    ]
  };

function isAttackCard(card) {
  return card?.kind === library.strike.kind;
}

function cardBaseValue(card, normalValue, upgradedValue) {
  return card?.upgraded ? upgradedValue : normalValue;
}

function estimateCardOutcome(card) {
  if (!card) return { lines: ["効果なし"], valid: false };
  if (card.unplayable) return { lines: ["プレイ不可"], valid: false };
  if (card.cost > state.energy) return { lines: [`エナジー不足 ${state.energy}/${card.cost}`], valid: false };
  if (state.attackLocked && isAttackCard(card)) return { lines: ["攻撃できない"], valid: false };

  const start = {
    enemyHp: state.enemy?.hp || 0,
    enemyBlock: state.enemy?.block || 0,
    playerBlock: state.player.block,
    playerPetri: state.player.petri,
    playerPlate: state.player.plate,
    energy: state.energy
  };
  const sim = { ...start };
  const lines = [];

  const applyDamage = (base) => {
    const raw = Math.max(0, base + state.player.str);
    const blocked = Math.min(sim.enemyBlock, raw);
    sim.enemyBlock = Math.max(0, sim.enemyBlock - raw);
    const dealt = Math.max(0, raw - blocked);
    sim.enemyHp = Math.max(0, sim.enemyHp - dealt);
    return dealt;
  };
  const applyBlock = (base) => {
    const gained = Math.max(0, base + state.player.dex - state.player.blockPenalty);
    sim.playerBlock += gained;
    return gained;
  };
  const applyPetri = (amount) => {
    sim.playerPetri = Math.max(0, Math.min(100, sim.playerPetri + amount));
  };
  const applyPlate = (amount) => {
    sim.playerPlate += amount;
  };
  const addDamageLine = (amount) => {
    if (amount > 0) lines.push(`敵HP ${start.enemyHp} -> ${sim.enemyHp}（${amount}ダメージ）`);
    else lines.push("ダメージはブロックされる");
  };
  const addBlockLine = (amount) => {
    if (amount > 0) lines.push(`ブロック ${start.playerBlock} -> ${sim.playerBlock}（+${amount}）`);
  };
  const addPetriLine = () => {
    if (sim.playerPetri !== start.playerPetri) lines.push(`石化 ${start.playerPetri} -> ${sim.playerPetri}`);
  };
  const addPlateLine = () => {
    if (sim.playerPlate !== start.playerPlate) lines.push(`プレート ${start.playerPlate} -> ${sim.playerPlate}`);
  };

  switch (card.id) {
    case "strike":
      addDamageLine(applyDamage(cardBaseValue(card, 6, 8)));
      break;
    case "stepSlash":
      addDamageLine(applyDamage(cardBaseValue(card, 8, 11)));
      break;
    case "lunge":
      addDamageLine(applyDamage(state.player.petri >= 40 ? cardBaseValue(card, 4, 6) : cardBaseValue(card, 8, 10)));
      break;
    case "stoneCleave":
      addDamageLine(applyDamage(cardBaseValue(card, 25, 31)));
      applyPetri(8);
      addPetriLine();
      lines.push("廃棄");
      break;
    case "stiffJab":
      addDamageLine(applyDamage(cardBaseValue(card, 5, 7)));
      applyPetri(4);
      addPetriLine();
      if (card.upgraded) lines.push("カードを1枚引く");
      break;
    case "chisel":
      addDamageLine(applyDamage(cardBaseValue(card, 5, 7) + Math.floor(state.player.petri / 4)));
      applyPetri(cardBaseValue(card, -5, -8));
      addPetriLine();
      break;
    case "stoneCounter": {
      const first = applyDamage(cardBaseValue(card, 7, 9));
      let total = first;
      if (state.player.petri >= 30) total += applyDamage(cardBaseValue(card, 7, 9));
      addDamageLine(total);
      applyPetri(cardBaseValue(card, -3, -5));
      addPetriLine();
      break;
    }
    case "selectingSlash":
      addDamageLine(applyDamage(cardBaseValue(card, 8, 10)));
      lines.push(`手札を1枚捨てる / カードを${card.upgraded ? 2 : 1}枚引く`);
      break;
    case "shardCounterattack": {
      const base = cardBaseValue(card, 5, 7);
      const bonus = cardBaseValue(card, 10, 13);
      let total = applyDamage(base);
      if ((state.exhaustedThisTurn || 0) > 0) total += applyDamage(bonus);
      addDamageLine(total);
      if ((state.exhaustedThisTurn || 0) <= 0) lines.push("このターン廃棄していないため追加なし");
      break;
    }
    case "rubbleFlash":
      addDamageLine(applyDamage(cardBaseValue(card, 10, 12) + (state.exhaustedThisCombat || 0) * cardBaseValue(card, 3, 4)));
      lines.push(`この戦闘中の廃棄 ${state.exhaustedThisCombat || 0}枚分を加算`);
      break;
    case "shatter":
      addDamageLine(applyDamage(cardBaseValue(card, 14, 18)));
      applyPetri(cardBaseValue(card, -8, -10));
      addPetriLine();
      lines.push("手札の呪い/石化カードを1枚廃棄");
      break;
    case "guard":
      addBlockLine(applyBlock(cardBaseValue(card, 8, 11)));
      lines.push("カードを1枚引く");
      break;
    case "breathingGuard":
      addBlockLine(applyBlock(cardBaseValue(card, 6, 9)));
      lines.push("カードを2枚引く");
      break;
    case "heldStance":
      lines.push(`ターン終了まで 筋力-1 / 敏捷+${card.upgraded ? 4 : 3}`);
      break;
    case "tacticalDiscard":
      lines.push("手札の任意のカードを1枚捨てる");
      lines.push(`カードを${card.upgraded ? 3 : 2}枚引く`);
      break;
    case "sealedResolve": {
      const skillCount = state.hand.filter((handCard) => handCard.kind === "スキル").length;
      addBlockLine(applyBlock(cardBaseValue(card, 7, 10) + skillCount * 2));
      lines.push(`スキルカード ${skillCount}枚分を加算`);
      break;
    }
    case "nextTurnSigil":
      lines.push(`2ターンの間、ターン開始時 エナジー+${card.upgraded ? 2 : 1}`);
      lines.push("廃棄");
      break;
    case "desperatePurification":
      lines.push("エナジー +1 / カードを1枚引く");
      lines.push("手札の任意のカードを1枚廃棄");
      if (card.innate) lines.push("天賦: 戦闘開始時の初手に入る");
      break;
    case "cutAway":
      lines.push("手札の任意のカードを1枚廃棄");
      lines.push(`カードを${card.upgraded ? 2 : 1}枚引く`);
      break;
    case "shardBulwark": {
      const base = cardBaseValue(card, 6, 8);
      let total = applyBlock(base);
      if ((state.exhaustedThisTurn || 0) > 0) total += applyBlock(base);
      addBlockLine(total);
      if ((state.exhaustedThisTurn || 0) <= 0) lines.push("このターン廃棄していないため追加なし");
      break;
    }
    case "crushingDefense":
      addBlockLine(applyBlock(cardBaseValue(card, 7, 10)));
      lines.push("ランダムな手札を1枚廃棄");
      break;
    case "defend":
      addBlockLine(applyBlock(cardBaseValue(card, 5, 8)));
      break;
    case "focus":
      lines.push(`カードを${card.upgraded ? 2 : 1}枚引く`);
      applyPetri(cardBaseValue(card, -2, -3));
      addPetriLine();
      break;
    case "stoneFoot":
      addBlockLine(applyBlock(cardBaseValue(card, 3, 8)));
      lines.push("敏捷性 -1 / 廃棄");
      break;
    case "stoneBrand":
      applyPetri(cardBaseValue(card, 2, 1));
      addPetriLine();
      lines.push("カードを1枚引く");
      lines.push("廃棄 / 未使用ならターン終了時に石化+7");
      break;
    case "crackedFinger":
      lines.push(`カードを${card.upgraded ? 2 : 1}枚引く`);
      lines.push(`次に得るブロック -${card.upgraded ? 1 : 2}`);
      lines.push("廃棄");
      break;
    case "stoneSeed":
      applyPetri(6);
      applyPlate(cardBaseValue(card, 3, 5));
      addPetriLine();
      addPlateLine();
      break;
    case "stoneMeditation":
      applyPetri(5);
      addPetriLine();
      lines.push(`カードを${card.upgraded ? 3 : 2}枚引く`);
      break;
    case "petriEnergySurge":
      applyPetri(6);
      addPetriLine();
      lines.push(`エナジー +${card.upgraded ? 3 : 2} / 廃棄`);
      break;
    case "fossilOffering":
      applyPetri(7);
      addPetriLine();
      lines.push("手札の任意のカードを1枚廃棄");
      lines.push(`カードを${card.upgraded ? 3 : 2}枚引く / 廃棄`);
      break;
    case "stoneDeckCall":
      applyPetri(6);
      addPetriLine();
      lines.push(`山札からカードを${card.upgraded ? 3 : 2}枚引く / 廃棄`);
      break;
    case "collapseChain":
      addDamageLine(applyDamage(cardBaseValue(card, 16, 21)));
      lines.push(`この戦闘中の廃棄 ${state.exhaustedThisCombat || 0}/3`);
      break;
    case "crumblingGambit":
      lines.push(`手札のプレイ可能なカードをランダムに1枚コストなしで使用${card.upgraded ? " / カードを1枚引く" : ""}`);
      lines.push("廃棄");
      break;
    case "heavyKnee":
      addBlockLine(applyBlock(cardBaseValue(card, 4, 7)));
      lines.push("手札に残すと次ターン石化カード追加");
      break;
    case "freezingPanic":
      applyPetri(15);
      addPetriLine();
      lines.push(`カードを2枚引く / エナジー +2 / 廃棄${card.upgraded ? " / 保留" : ""}`);
      break;
    case "marbleTears":
      applyPetri(8);
      addBlockLine(applyBlock(cardBaseValue(card, 20, 26)));
      addPetriLine();
      lines.push("筋力 -1");
      break;
    case "frozenPose":
      applyPetri(12);
      applyPlate(cardBaseValue(card, 6, 7));
      addPetriLine();
      addPlateLine();
      lines.push("このターン攻撃不可");
      break;
    case "priestSeal":
      applyPetri(-5);
      addPetriLine();
      lines.push("敵がこのターン筋力+10");
      lines.push("保留 / 廃棄");
      break;
    case "resist":
      applyPetri(cardBaseValue(card, -12, -16));
      addBlockLine(applyBlock(cardBaseValue(card, 2, 3)));
      addPetriLine();
      break;
    case "stoneDustPurge":
      applyPetri(cardBaseValue(card, -5, -7));
      addPetriLine();
      lines.push(`任意の手札を1枚捨てる / カードを${card.upgraded ? 2 : 1}枚引く`);
      break;
    case "crackRiposte":
      lines.push(`パワー: 石化蓄積時 HP-1 / 敵に${card.upgraded ? 8 : 6}ダメージ`);
      lines.push("廃棄");
      break;
    case "wreckageBreath":
      lines.push(`パワー: カードを廃棄するたび石化-${card.upgraded ? 3 : 2}`);
      lines.push("廃棄");
      break;
    case "statueReservoir":
      lines.push(`パワー: 石化蓄積時 ${card.upgraded ? 4 : 3}ブロック`);
      lines.push("廃棄");
      break;
    case "crackEnergy":
      applyPetri(cardBaseValue(card, -3, -5));
      addPetriLine();
      lines.push(`エナジー +${state.player.petri >= 30 ? 2 : 1} / 廃棄`);
      break;
    case "echoingCrack":
      lines.push("パワー: 石化のしきい値突破時、山札のランダムなカードをコスト0・エセリアルでコピー");
      if (card.upgraded) lines.push("カードを1枚引く");
      lines.push("廃棄");
      break;
    case "marbleGuard":
      addBlockLine(applyBlock(cardBaseValue(card, 12, 16)));
      if (state.player.petri >= 50) lines.push("筋力 +1");
      break;
    case "statueDream":
      sim.playerBlock = 0;
      applyPetri(-10);
      lines.push(`ブロック ${start.playerBlock} -> 0`);
      addPetriLine();
      lines.push("廃棄");
      break;
    case "ritualManacle":
      applyPlate(2);
      addPlateLine();
      lines.push("手札の石化を解除 / 廃棄");
      break;
    default:
      lines.push(card.text.replace(/<[^>]*>/g, ""));
      break;
  }

  return {
    lines: [`エナジー ${start.energy} -> ${Math.max(0, start.energy - card.cost)}`, ...lines],
    valid: true
  };
}

function petriAnimationSpeed() {
  const petri = state?.player?.petri || 0;
  if (petri >= 100 || state?.petrified) return 0;
  if (petri >= 78) return 0.62;
  if (petri >= 58) return 0.74;
  if (petri >= 32) return 0.86;
  return 1;
}

function startHeroAnimation(name) {
  if (!heroAnimations[name]) name = "idle";
  heroAnimation = {
    name,
    frame: 0,
    elapsed: 0,
    lastTime: performance.now()
  };
  applyHeroFrame();
}

function currentHeroAnimation() {
  return heroAnimations[heroAnimation.name] || heroAnimations.idle;
}

function heroAnimationSequence(anim = currentHeroAnimation()) {
  return anim.sequence || Array.from({ length: anim.frames }, (_, index) => index);
}

function currentHeroSheetFrame(anim = currentHeroAnimation()) {
  const sequence = heroAnimationSequence(anim);
  return sequence[heroAnimation.frame] ?? 0;
}

function currentHeroFrameMs(anim = currentHeroAnimation()) {
  const duration = anim.durations?.[heroAnimation.frame] ?? 1;
  return (1000 / anim.fps) * duration;
}

function startSlashEffect() {
  slashEffect.frame = 0;
  slashEffect.elapsed = -slashEffect.delay;
  slashEffect.active = true;
  applySlashFrame();
}

function stopSlashEffect() {
  slashEffect.frame = 0;
  slashEffect.elapsed = 0;
  slashEffect.active = false;
  applySlashFrame();
}

function applySlashFrame() {
  const slash = qs("heroSlash");
  if (!slash) return;
  const x = slashEffect.frames <= 1 ? 0 : (slashEffect.frame / (slashEffect.frames - 1)) * 100;
  slash.style.backgroundImage = `url("${slashEffect.sheet}")`;
  slash.style.backgroundSize = `${slashEffect.frames * 100}% 100%`;
  slash.style.backgroundPosition = `${x}% 50%`;
  slash.style.opacity = slashEffect.active && slashEffect.elapsed >= 0 ? "1" : "0";
}

function tickSlashEffect(delta, speed) {
  if (!slashEffect.active) return;
  slashEffect.elapsed += delta * speed;
  if (slashEffect.elapsed < 0) {
    applySlashFrame();
    return;
  }
  const frameMs = 1000 / slashEffect.fps;
  while (slashEffect.elapsed >= frameMs) {
    slashEffect.elapsed -= frameMs;
    if (slashEffect.frame < slashEffect.frames - 1) {
      slashEffect.frame++;
    } else {
      slashEffect.active = false;
      break;
    }
  }
  applySlashFrame();
}

function applyHeroFrame() {
  const anim = currentHeroAnimation();
  const human = qs("heroHuman");
  const stone = qs("heroStone");
  if (!human || !stone) return;
  const spriteFrame = human.closest(".sprite-frame");
  if (spriteFrame) {
    spriteFrame.style.setProperty("--hero-scale", anim.scale || 1);
  }
  const sheetFrame = currentHeroSheetFrame(anim);
  const x = anim.frames <= 1 ? 0 : (sheetFrame / (anim.frames - 1)) * 100;
  human.style.backgroundImage = `url("${anim.sheet}")`;
  stone.style.backgroundImage = `url("${anim.stoneSheet}")`;
  human.style.backgroundSize = `${anim.frames * 100}% 100%`;
  stone.style.backgroundSize = `${anim.frames * 100}% 100%`;
  human.style.backgroundPosition = `${x}% 50%`;
  stone.style.backgroundPosition = `${x}% 50%`;
}

function tickHeroAnimation(time = performance.now()) {
  const anim = currentHeroAnimation();
  const speed = petriAnimationSpeed();
  if (!heroAnimation.lastTime) heroAnimation.lastTime = time;
  const delta = Math.min(120, time - heroAnimation.lastTime);
  heroAnimation.lastTime = time;

  if (speed > 0) {
    tickSlashEffect(delta, speed);
    heroAnimation.elapsed += delta * speed;
    while (heroAnimation.elapsed >= currentHeroFrameMs(anim)) {
      heroAnimation.elapsed -= currentHeroFrameMs(anim);
      const sequence = heroAnimationSequence(anim);
      if (heroAnimation.frame < sequence.length - 1) {
        heroAnimation.frame++;
      } else if (anim.loop) {
        heroAnimation.frame = 0;
      } else {
        startHeroAnimation("idle");
        break;
      }
      applyHeroFrame();
    }
  } else {
    tickSlashEffect(delta, 0);
  }

  requestAnimationFrame(tickHeroAnimation);
}

function newGame() {
  state = {
    floor: 1,
    player: { hp: 80, maxHp: 80, block: 0, plate: 0, petri: 0, str: 0, dex: 0, tempStr: 0, tempDex: 0, blockPenalty: 0, brittle: 0, crackRiposte: 0, crackRiposteDamage: 0, stoneSkinReaction: 0, stoneSkinReactionBlock: 0, echoStoneSigil: 0, exhaustBreath: 0, exhaustBreathAmount: 0 },
    enemy: null,
    deck: ["strike", "strike", "strike", "strike", "defend", "defend", "guard", "focus", "stoneSeed", "resist", "tacticalDiscard"].map(freshCard),
    relics: [],
    drawPile: [],
    discard: [],
    exhaust: [],
    hand: [],
    energy: 3,
    maxEnergy: 3,
    drawBonus: 0,
    pendingCurses: 0,
    pendingEnemyCards: [],
    pendingBrands: 0,
    pendingHandMutations: 0,
    pendingEnergyLoss: 0,
    pendingEnergyGain: 0,
    energySigils: [],
    pendingDrawPenalty: 0,
    handEvents: [],
    thresholdSeen: new Set(),
    notices: [],
    noticeOpen: false,
      rewardPicks: [],
      currentEvent: null,
      openingEventChoices: [],
      usedEvents: new Set(),
    statueIndex: 0,
    path: ["start"],
    runMap: createRunMap(),
    currentRoute: null,
    combatCount: 0,
    petrified: false,
    runOver: false,
    phase: "map",
    enemyDefeated: false,
    gameoverStill: null,
    gameoverReason: null,
    turnResolving: false,
    cardResolving: false,
    intentDetailsOpen: false,
    attackLocked: false,
    exhaustedThisCombat: 0,
    exhaustedThisTurn: 0,
    turn: 1,
    logs: []
  };
  qs("rewardModal").classList.add("hidden");
  qs("noticeModal").classList.add("hidden");
  qs("pileModal").classList.add("hidden");
  document.querySelector("#rewardModal .modal-actions").classList.remove("hidden");
  stopSlashEffect();
  startHeroAnimation("idle");
    showOpeningEvent();
  }

function pickEnemyFromIds(ids) {
  return shuffle(ids.map((id) => enemyById[id]).filter(Boolean))[0] || roamingEnemies[0];
}

function pickCombatEnemy(route = null) {
  if (route?.final) return finalBossEnemy;
  if (route?.type === "elite") return shuffle(eliteEnemies)[0];
  if (route?.enemyId) return enemyById[route.enemyId] || roamingEnemies[0];
  if (route?.enemyPool?.length) return pickEnemyFromIds(route.enemyPool);
  if (route?.randomEnemy) return shuffle(roamingEnemies)[0];
  const floor = route?.floor ?? state.floor;
  const pool = floorEnemyPools.find((entry) => floor <= entry.maxFloor) || floorEnemyPools[floorEnemyPools.length - 1];
  return pickEnemyFromIds(pool.ids);
}

function startFight(route = null) {
  if (state.runOver) return;
  if (state.player.petri >= 100) return enterPetrifiedLoop();
  setPhase("combat");
  state.enemyDefeated = false;
  const base = pickCombatEnemy(route);
  state.enemy = { ...base, hp: base.hp, maxHp: base.hp, block: 0, str: 0, dex: 0, plate: 0, stunned: 0, intent: null };
  state.enemy.routineIndex = 0;
  state.drawPile = shuffle([...state.deck]);
  ensureInnateOpeningHand();
  state.discard = [];
  state.exhaust = [];
  state.hand = [];
  state.turn = 1;
  state.exhaustedThisCombat = 0;
  state.exhaustedThisTurn = 0;
  state.player.str = 0;
  state.player.dex = 0;
  state.player.tempStr = 0;
  state.player.tempDex = 0;
  if (state.enemy) state.enemy.tempStr = 0;
  state.pendingCurses = 0;
  state.pendingEnemyCards = [];
  state.pendingBrands = 0;
  state.pendingHandMutations = 0;
  state.pendingEnergyLoss = 0;
  state.pendingEnergyGain = 0;
  state.energySigils = [];
  state.pendingDrawPenalty = 0;
  if (route?.type === "elite" && !route.final) addLog("強敵が行く手を塞いでいる。");
  addLog("{enemy}が現れた。", { enemy: localizeName(base) });
  if (base.opening) {
    addLog("{enemy}: 「{line}」", { enemy: localizeName(base), line: t(base.opening) });
    debugTimeout(() => floatText("enemy", t("「{line}」", { line: t(base.opening) }), "curse"), 180);
  }
  applyRelics("onCombatStart");
  nextEnemyIntent();
  showTurnStep("戦闘開始", t("{enemy}が現れた。", { enemy: localizeName(base) }), "enemy", 1900);
  addStepLog("戦闘開始", localizeName(base));
  state.suppressTurnBannerOnce = true;
  startTurn();
  queuePlayerTurnStep(2050, true);
}

function shouldEnemyInjectCard() {
  if (!state.enemy) return false;
  if (state.enemy.injectCard) return true;
  const every = state.enemy.injectCardEvery || 0;
  return every > 0 && state.turn % every === 0;
}

function startTurn() {
  if (state.petrified) return;
  const suppressPlayerTurnBanner = state.suppressTurnBannerOnce;
  if (state.suppressTurnBannerOnce) {
    state.suppressTurnBannerOnce = false;
  } else if (!state.turnResolving && state.enemy && !state.runOver) {
    addStepLog("プレイヤーのターン", t("ターン {turn}", { turn: state.turn }));
  }
  const energyLoss = state.pendingEnergyLoss;
  const energyGain = (state.pendingEnergyGain || 0) + consumeEnergySigils();
  const drawPenalty = state.pendingDrawPenalty;
  state.exhaustedThisTurn = 0;
  state.pendingEnergyLoss = 0;
  state.pendingEnergyGain = 0;
  state.pendingDrawPenalty = 0;
  state.energy = Math.max(0, state.maxEnergy - energyLoss + energyGain);
  if (energyGain) {
    addLog("印の力でエナジー+{amount}。", { amount: energyGain });
    floatText("player", statDeltaText("エナジー", energyGain), "good");
  }
  state.attackLocked = false;
  state.player.block = 0;
  state.player.blockPenalty = 0;
  for (let i = 0; i < state.pendingCurses; i++) {
    addCardToHand(freshCard("stoneFoot"), "added", "石足の躓きが手札に混入");
  }
  state.pendingCurses = 0;
  for (const cardId of state.pendingEnemyCards) {
    const card = freshCard(cardId);
    addCardToHand(card, "added", t("{card}が敵の効果で手札に追加", { card: localizeName(card) }));
  }
  state.pendingEnemyCards = [];
  for (let i = 0; i < state.pendingBrands; i++) {
    addCardToHand(freshCard("stoneBrand"), "added", "石化の刻印が手札に追加");
  }
  state.pendingBrands = 0;
  const nonRetainedCards = state.hand.filter((card) => !card.retain).length;
  draw(Math.max(0, 5 + state.drawBonus - drawPenalty - nonRetainedCards));
  if (shouldEnemyInjectCard()) {
    addCardToHand(freshCard("stoneBrand"), "added", "敵が石化の刻印を刻んだ");
    addLog("{enemy}が石化の刻印を手札に刻んだ。", { enemy: localizeName(state.enemy) });
    floatText("enemy", t("刻印付与"), "petri");
    floatText("player", t("石化の刻印"), "curse");
  }
  if (hasPetriDebuff("burden") && state.turn % 2 === 1) addCardToHand(freshCard("burden"), "added", "石化デバフ: 石の重みが手札に混入");
  if (hasPetriDebuff("mutate") && state.turn % 2 === 0) mutateHand();
  if (hasPetriDebuff("dream") && Math.random() < .55) {
    addCardToHand(freshCard("statueDream"), "added", "沈む体温が手札に現れた");
  }
  applyPendingHandMutations();
  applyRelics("onTurnStart");
  syncRitualManacleAura();
  render();
  if (!suppressPlayerTurnBanner && !state.turnResolving && state.enemy && !state.runOver) {
    queuePlayerTurnStep(120, false);
  }
}

function addCardToHand(card, effect, message) {
  card.fx = effect;
  state.hand.push(card);
  addHandEvent(message, effect);
}

function addHandEvent(text, type = "added") {
  state.handEvents.push({ text: t(text), type });
}

function hasPetriDebuff(key) {
  const threshold = thresholds.find((item) => item.key === key);
  return Boolean(threshold && state.player.petri >= threshold.value);
}

function mutateHand() {
  const target = state.hand.find((card) => card.type === "normal" && !card.mutated);
  if (!target) return;
  const before = target.name;
  target.name = `石化した${target.name}`;
  target.cost += 1;
  target.type = "petrify";
  target.text += " 石化の影響でコスト+1。";
  target.mutated = true;
  target.stoneOverlay = true;
  target.fx = "mutated";
  addHandEvent(t("{card}が石化して変質", { card: t(before) }), "mutated");
  addLog("手札の{card}が重くなった。", { card: localizeName(target) });
  floatText("player", t("カード変質"), "petri");
}

function applyPendingHandMutations() {
  while (state.pendingHandMutations > 0) {
    const candidates = state.hand.filter((card) => !card.unplayable && !card.mutated && !card.temporaryStonePowder);
    if (!candidates.length) {
      state.pendingHandMutations = 0;
      break;
    }
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    mutateCardTemporarily(target);
    state.pendingHandMutations--;
  }
}

function mutateCardTemporarily(card) {
  const before = card.name;
  card.temporaryStonePowder = {
    name: card.name,
    cost: card.cost,
    type: card.type,
    text: card.text,
    fx: card.fx,
    stoneOverlay: card.stoneOverlay
  };
  card.name = `石化した${card.name}`;
  card.cost += 1;
  card.type = "petrify";
  card.text += " 石粉の影響でこの戦闘中コスト+1。";
  card.stoneOverlay = true;
  card.fx = "mutated";
  addHandEvent(t("{card}が石粉で石化", { card: t(before) }), "mutated");
  addLog("石粉で{card}に変質した。", { card: localizeName(card) });
  floatText("player", t("石粉変質"), "petri");
}

function restoreTemporaryMutations() {
  for (const pile of [state.deck, state.drawPile, state.discard, state.exhaust, state.hand]) {
    for (const card of pile) restoreTemporaryMutation(card);
  }
  state.pendingHandMutations = 0;
}

function clearCombatStatuses() {
  state.player.block = 0;
  state.player.plate = 0;
  state.player.str = 0;
  state.player.dex = 0;
  state.player.blockPenalty = 0;
  state.player.brittle = 0;
  state.player.crackRiposte = 0;
  state.player.crackRiposteDamage = 0;
  state.player.stoneSkinReaction = 0;
  state.player.stoneSkinReactionBlock = 0;
  state.player.echoStoneSigil = 0;
  state.player.exhaustBreath = 0;
  state.player.exhaustBreathAmount = 0;
  state.enemyStrengthStacks = 0;
  state.pendingEnemyCards = [];
  state.pendingBrands = 0;
  state.pendingHandMutations = 0;
  state.pendingEnergyLoss = 0;
  state.pendingEnergyGain = 0;
  state.energySigils = [];
  state.pendingDrawPenalty = 0;
  if (state.enemy) state.enemy.ritualFollowup = false;
}

function restoreTemporaryMutation(card) {
  if (!card?.temporaryStonePowder) return;
  const original = card.temporaryStonePowder;
  card.name = original.name;
  card.cost = original.cost;
  card.type = original.type;
  card.text = original.text;
  card.fx = original.fx;
  card.stoneOverlay = original.stoneOverlay;
  if (!card.stoneOverlay) delete card.stoneOverlay;
  delete card.temporaryStonePowder;
}

function syncRitualManacleAura() {
  const active = state.hand.some((card) => card.id === "ritualManacle" && !card.playing);
  for (const card of state.hand) {
    if (active && canRitualManacleMutate(card)) applyRitualManacleMutation(card);
    else if ((!active || card.id === "ritualManacle") && card.ritualManacleMutation) restoreRitualManacleMutation(card);
  }
}

function canRitualManacleMutate(card) {
  return card.id !== "ritualManacle" && !card.playing && !card.unplayable && !card.temporaryStonePowder && !card.ritualManacleMutation;
}

function applyRitualManacleMutation(card) {
  card.ritualManacleMutation = {
    name: card.name,
    cost: card.cost,
    type: card.type,
    text: card.text,
    fx: card.fx,
    stoneOverlay: card.stoneOverlay
  };
  card.name = `石化した${card.name}`;
  card.cost += 1;
  card.type = "petrify";
  card.text += " 典礼の石枷の影響で、手札にある間コスト+1。";
  card.stoneOverlay = true;
  card.fx = "mutated";
}

function restoreRitualManacleMutation(card) {
  if (!card?.ritualManacleMutation) return;
  const original = card.ritualManacleMutation;
  card.name = original.name;
  card.cost = original.cost;
  card.type = original.type;
  card.text = original.text;
  card.fx = original.fx;
  card.stoneOverlay = original.stoneOverlay;
  delete card.ritualManacleMutation;
  if (!card.stoneOverlay) delete card.stoneOverlay;
}

function clearRitualManacleAura() {
  for (const card of state.hand) restoreRitualManacleMutation(card);
}

function ensureInnateOpeningHand() {
  const innateCards = state.drawPile.filter((card) => card.innate);
  if (!innateCards.length) return;
  state.drawPile = state.drawPile.filter((card) => !card.innate);
  state.drawPile.push(...shuffle(innateCards));
}

function registerExhaust(card) {
  if (!card) return card;
  state.exhaustedThisCombat = (state.exhaustedThisCombat || 0) + 1;
  state.exhaustedThisTurn = (state.exhaustedThisTurn || 0) + 1;
  if ((state.player.exhaustBreathAmount || 0) > 0) {
    petri(-state.player.exhaustBreathAmount);
    floatText("player", `${t("呼吸")}-${state.player.exhaustBreathAmount}`, "good");
  }
  return card;
}

function exhaustRandomCardFromHand(source = "効果") {
  const candidates = state.hand.filter((card) => !card.playing);
  if (!candidates.length) {
    addLog("{source}: 廃棄できる手札がなかった。", { source: t(source) });
    return false;
  }
  const card = candidates[Math.floor(Math.random() * candidates.length)];
  const index = state.hand.findIndex((item) => item.uid === card.uid);
  if (index < 0) return false;
  const [exhausted] = state.hand.splice(index, 1);
  restoreRitualManacleMutation(exhausted);
  exhausted.fx = "vanishing";
  state.exhaust.push(registerExhaust(exhausted));
  addHandEvent(t("{card}を廃棄した", { card: localizeName(exhausted) }), "vanishing");
  addLog("{source}で{card}をランダムに廃棄した。", { source: t(source), card: localizeName(exhausted) });
  return true;
}

function collapseChainCost(card) {
  return (state.enemy && (state.exhaustedThisCombat || 0) >= 3) ? 1 : 2;
}

function refreshCombatCardCosts() {
  for (const card of state.hand || []) {
    if (card.id === "collapseChain" && !card.ritualManacleMutation) card.cost = collapseChainCost(card);
  }
}

function draw(n, effect = "dealt") {
  for (let i = 0; i < n; i++) {
    if (!state.drawPile.length) {
      state.drawPile = shuffle(state.discard);
      state.discard = [];
    }
    const card = state.drawPile.pop();
    if (card) {
      if (card.id === "collapseChain") card.cost = collapseChainCost(card);
      card.fx = effect;
      state.hand.push(card);
    }
  }
}

async function playCard(uid) {
  if (state.petrified || state.runOver || state.turnResolving || state.cardResolving) return;
  refreshCombatCardCosts();
  const index = state.hand.findIndex((card) => card.uid === uid);
  const card = state.hand[index];
  if (!card || card.unplayable || card.cost > state.energy || state.enemy.hp <= 0) return;
  state.cardResolving = true;
  await resolveCardPlay(card, { payCost: true });
  state.cardResolving = false;
  if (state.player.hp <= 0) return endRun(false);
  if (state.player.petri >= 100) return enterPetrifiedLoop();
  if (state.enemy.hp <= 0) return winFight();
  render();
}

async function resolveCardPlay(card, options = {}) {
  if (!card || state.petrified || state.runOver || state.enemy.hp <= 0) return false;
  if (state.attackLocked && card.kind === "攻撃") {
    floatText("player", t("動けない"), "petri");
    return false;
  }
  card.playing = true;

  const before = snapshotStats();
  if (options.payCost) state.energy -= card.cost;
  if (card.id === "ritualManacle") clearRitualManacleAura();
  else restoreRitualManacleMutation(card);
  const attackCard = isAttackCard(card);
  await waitForHeroAnimationAssets(attackCard ? "attack" : "action");
  startHeroAnimation(attackCard ? "attack" : "action");
  if (attackCard) startSlashEffect();
  await card.play();
  syncRitualManacleAura();
  if (attackCard && state.enemy && before.enemyHp > state.enemy.hp) shakeEnemy();
  if (["strike", "lunge", "chisel", "shatter", "selectingSlash", "shardCounterattack", "rubbleFlash", "collapseChain"].includes(card.id)) sound("slash");
  else if (card.type === "petrify" || card.type === "curse") sound("petri");
  else sound("block");
  addLog(options.free ? "{card}をコストなしで使用。" : "{card}を使用。", { card: localizeName(card) });
  showStatDiff(before, "player");

  const currentIndex = state.hand.findIndex((item) => item.uid === card.uid);
  if (currentIndex >= 0) state.hand.splice(currentIndex, 1);
  delete card.playing;
  if (card.exhaust) state.exhaust.push(registerExhaust(card));
  else state.discard.push(card);
  return true;
}

async function endTurn() {
  if (state.runOver || state.turnResolving || state.cardResolving) return;
  if (state.petrified) return enterPetrifiedLoop();
  state.turnResolving = true;
  showTurnStep("敵のターン", "", "enemy", 1900);
  addStepLog("敵のターン");
  render();
  const before = snapshotStats();
  clearRitualManacleAura();
  let burdenCount = 0;
  let brandCount = 0;
  let priestSealCount = 0;
  let heavyKneeCount = 0;
  let waxTearCount = 0;
  let hasOutgoingCards = false;
  for (const card of state.hand) {
    if (card.id === "burden") burdenCount++;
    if (card.id === "stoneBrand") brandCount++;
    if (card.id === "priestSeal") priestSealCount++;
    if (card.id === "heavyKnee") heavyKneeCount++;
    if (card.id === "waxTearGaze") waxTearCount++;
    if (card.retain) continue;
    card.fx = card.ethereal ? "vanishing" : "discarding";
    hasOutgoingCards = true;
  }
  if (hasOutgoingCards) {
    render();
    await delay(560);
  }
  for (const card of state.hand) {
    if (card.retain) continue;
    if (card.ethereal) state.exhaust.push(registerExhaust(card));
    else state.discard.push(card);
  }
  state.hand = state.hand.filter((card) => card.retain);
  if (burdenCount) {
    petri(4 * burdenCount);
    sound("petri");
    addLog("石の重みで石化+{amount}。", { amount: 4 * burdenCount });
  }
  if (brandCount) {
    petri(7 * brandCount);
    sound("petri");
    addLog("石化の刻印で石化+{amount}。", { amount: 7 * brandCount });
  }
  if (priestSealCount) {
    petri(9 * priestSealCount);
    sound("petri");
    addLog("司祭の石印を残したため、石化+{amount}。", { amount: 9 * priestSealCount });
  }
  if (heavyKneeCount) {
    state.pendingCurses += heavyKneeCount;
    sound("petri");
    addLog("重い膝を残したため、次ターン石脚の鈍りが{count}枚加わる。", { count: heavyKneeCount });
  }
  if (waxTearCount) {
    petri(6 * waxTearCount);
    state.pendingHandMutations += waxTearCount;
    sound("petri");
    addLog("蝋涙の凝視で石化+{amount}。次ターン、手札が石化する。", { amount: 6 * waxTearCount });
  }
  if (burdenCount || brandCount || priestSealCount || heavyKneeCount || waxTearCount) {
    showStatDiff(before, "player");
    render();
    await delay(620);
  }
  clearTemporaryStats();
  if (state.player.petri >= 100) {
    state.turnResolving = false;
    return enterPetrifiedLoop();
  }
  if (state.enemy.hp <= 0) {
    state.turnResolving = false;
    return winFight();
  }
  const plateApplied = applyPlateBeforeEnemy();
  if (plateApplied) {
    render();
    await delay(620);
  }
  await delay(2000);
  await enemyTurn();
  render();
  await delay(1200);
  if (state.player.hp <= 0) {
    state.turnResolving = false;
    return endRun(false);
  }
  if (state.player.petri >= 100) {
    state.turnResolving = false;
    return enterPetrifiedLoop();
  }
  if (state.enemy.hp <= 0) {
    state.turnResolving = false;
    return winFight();
  }
  state.turn++;
  nextEnemyIntent();
  state.turnResolving = false;
  startTurn();
}

async function enemyTurn() {
  const before = snapshotStats();
  state.enemy.block = 0;
  const action = state.enemy.intent;
  await playEnemyActionAnimation(action);
  if (action.stunned) {
    sound("block");
    addLog("{enemy}は体勢を崩して動けない。", { enemy: localizeName(state.enemy) });
    floatText("enemy", t("スタン"), "curse");
    return;
  }
  const attack = action.attack || 0;
  const incoming = Math.max(0, attack - state.player.block);
  const fullBlocked = action.selfStunOnFullBlock && attack > 0 && incoming === 0;
  if (incoming > 0) {
    await waitForHeroAnimationAssets("damage");
    startHeroAnimation("damage");
  }
  if (incoming > 0) state.player.hp = clampPlayerHp(state.player.hp - incoming);
  if (incoming > 0 && (state.player.brittle || 0) > 0) {
    petri(incoming);
    addLog("硬化の呪いで未ブロックダメージ分、石化+{amount}。", { amount: incoming });
  }
  if (action.petri && !fullBlocked) petri(action.petri);
  if (action.block) state.enemy.block = (state.enemy.block || 0) + action.block;
  if (action.str) state.enemy.str = (state.enemy.str || 0) + action.str;
  if (action.dex) state.enemy.dex = (state.enemy.dex || 0) + action.dex;
  if (action.brands) state.pendingBrands += action.brands;
  if (action.addCard) {
    const count = Math.max(1, action.addCardCount || 1);
    for (let i = 0; i < count; i++) state.pendingEnemyCards.push(action.addCard);
  }
  if (action.addDiscardCard) {
    const count = Math.max(1, action.addDiscardCardCount || 1);
    for (let i = 0; i < count; i++) state.discard.push(freshCard(action.addDiscardCard));
    addLog("{enemy}が捨て札に{card}を{count}枚沈めた。", {
      enemy: localizeName(state.enemy),
      card: localizeName(library[action.addDiscardCard]) || t("カード"),
      count
    });
  }
  if (action.mutateCard) state.pendingHandMutations += action.mutateCard;
  if (action.energyLoss) state.pendingEnergyLoss += action.energyLoss;
  if (action.drawPenalty) state.pendingDrawPenalty += action.drawPenalty;
  if (action.blockPenalty) state.player.blockPenalty += action.blockPenalty;
  if (action.ritualFollowup) state.enemy.ritualFollowup = true;
  if (fullBlocked) {
    state.enemy.stunned = Math.max(state.enemy.stunned || 0, 1);
    addLog("{enemy}の大振りを受け切った。次のターン、敵は体勢を崩す。", { enemy: localizeName(state.enemy) });
    floatText("enemy", t("体勢崩れ"), "curse");
  }
  tickPlayerDebuffsAfterEnemyAction();
  if (action.brittle) state.player.brittle = Math.max(state.player.brittle || 0, action.brittle);
  sound("enemy");
  addLog("{enemy}: {action}", { enemy: localizeName(state.enemy), action: localizeLabel(action) });
  showEnemyActionDiff(before, action);
}

function enemyActionVisualType(action) {
  if (!action) return "attack";
  if (action.stunned) return "guard";
  if ((action.block || action.str || action.dex) && !action.attack && !action.petri && !action.brittle && !action.addCard && !action.addDiscardCard && !action.brands && !action.mutateCard) return "guard";
  if (action.addCard || action.addDiscardCard || action.brands || action.mutateCard || action.energyLoss || action.drawPenalty || action.blockPenalty) return "curse";
  if (action.petri || action.brittle) return "petrify";
  if (action.attack) return "attack";
  return "curse";
}

async function playEnemyActionAnimation(action) {
  const enemyActor = qs("enemyActor");
  const playerActor = qs("playerActor");
  const battlefield = document.querySelector(".battlefield");
  if (!enemyActor || !playerActor || !battlefield || !action) return;

  const type = enemyActionVisualType(action);
  const motionType = action.attack ? "attack" : type;
  enemyActor.classList.remove("enemy-action-attack", "enemy-action-petrify", "enemy-action-curse", "enemy-action-guard");
  void enemyActor.offsetWidth;
  enemyActor.classList.add(`enemy-action-${motionType}`);

  const effect = document.createElement("div");
  effect.className = `enemy-action-effect ${type}`;
  effect.setAttribute("aria-hidden", "true");
  battlefield.appendChild(effect);

  if (type !== "guard") {
    window.setTimeout(() => impactPlayer(type), 430);
  }

  await delay(type === "guard" ? 620 : 760);
  enemyActor.classList.remove(`enemy-action-${motionType}`);
  effect.remove();
}

function impactPlayer(type = "attack") {
  const actor = qs("playerActor");
  if (!actor) return;
  actor.classList.remove("player-impact-attack", "player-impact-petrify", "player-impact-curse");
  void actor.offsetWidth;
  const impactType = type === "attack" ? "attack" : type === "petrify" ? "petrify" : "curse";
  actor.classList.add(`player-impact-${impactType}`);
  window.setTimeout(() => actor.classList.remove(`player-impact-${impactType}`), 420);
}

function tickPlayerDebuffsAfterEnemyAction() {
  if ((state.player.brittle || 0) > 0) state.player.brittle--;
}

function nextEnemyIntent() {
  const e = state.enemy;
  if ((e.stunned || 0) > 0) {
    e.stunned = Math.max(0, e.stunned - 1);
    e.intent = { type: "stun", label: "体勢崩れ", stunned: true };
    return;
  }
  const action = e.ritualFollowup
    ? shuffle([
      { type: "attack", label: "抑えつける石剣", attack: 10 },
      { type: "brittle", label: "硬化の呪い", petri: 4, brittle: 2 }
    ])[0]
    : e.routine?.length
    ? e.routine[e.routineIndex++ % e.routine.length]
    : e.actions[Math.floor(Math.random() * e.actions.length)];
  e.ritualFollowup = false;
  const floorBonus = action.fixedAttack ? 0 : Math.floor(state.floor / 2);
  e.intent = {
    ...action,
    attack: action.attack ? action.attack + floorBonus + (e.str || 0) : 0,
    block: action.block ? Math.max(0, action.block + (e.dex || 0)) : 0
  };
}

function damage(amount) {
  const raw = Math.max(0, amount + state.player.str);
  const blocked = Math.min(state.enemy.block || 0, raw);
  state.enemy.block = Math.max(0, (state.enemy.block || 0) - raw);
  const dealt = Math.max(0, raw - blocked);
  state.enemy.hp = Math.max(0, state.enemy.hp - dealt);
}

function fixedDamage(amount) {
  const raw = Math.max(0, amount);
  const blocked = Math.min(state.enemy.block || 0, raw);
  state.enemy.block = Math.max(0, (state.enemy.block || 0) - raw);
  const dealt = Math.max(0, raw - blocked);
  state.enemy.hp = Math.max(0, state.enemy.hp - dealt);
  return dealt;
}

function addEchoStoneSigilCopy(threshold) {
  const count = state.player.echoStoneSigil || 0;
  if (count <= 0) return;
  const pool = state.drawPile.filter((card) => !card.unplayable);
  if (!pool.length) {
    addLog("残響の石紋が震えたが、山札に写せるカードはなかった。");
    return;
  }
  for (let i = 0; i < count; i++) {
    const source = shuffle(pool)[0];
    const copy = freshCard(source.id);
    if (source.upgraded) upgradeCard(copy);
    copy.cost = 0;
    copy.ethereal = true;
    copy.fx = "added";
    state.hand.push(copy);
    addHandEvent(t("残響の石紋: {card}を手札に写した", { card: localizeName(copy) }), "added");
    addLog("残響の石紋が{threshold}に反応し、{card}をコスト0・エセリアルで手札に写した。", {
      threshold: t(threshold.name),
      card: localizeName(copy)
    });
  }
  sound("notice");
  floatText("player", t("石紋の残響"), "good");
}

function block(amount) {
  const gained = Math.max(0, amount + state.player.dex - state.player.blockPenalty);
  state.player.block += gained;
  state.player.blockPenalty = 0;
}

function plate(amount) {
  state.player.plate += amount;
}

function addTemporaryStats(str = 0, dex = 0) {
  state.player.str += str;
  state.player.dex += dex;
  state.player.tempStr = (state.player.tempStr || 0) + str;
  state.player.tempDex = (state.player.tempDex || 0) + dex;
}

function addTemporaryEnemyStrength(amount) {
  if (!state.enemy || amount <= 0) return;
  state.enemy.str = (state.enemy.str || 0) + amount;
  state.enemy.tempStr = (state.enemy.tempStr || 0) + amount;
  addLog("敵がこのターン筋力+{amount}。", { amount });
  floatText("enemy", statDeltaText("筋力", amount), "curse");
}

function clearTemporaryStats() {
  if (state.player.tempStr) {
    state.player.str -= state.player.tempStr;
    state.player.tempStr = 0;
  }
  if (state.player.tempDex) {
    state.player.dex -= state.player.tempDex;
    state.player.tempDex = 0;
  }
  if (state.enemy?.tempStr) {
    state.enemy.str = Math.max(0, (state.enemy.str || 0) - state.enemy.tempStr);
    state.enemy.tempStr = 0;
  }
}

function addEnergySigil(amount, turns) {
  state.energySigils.push({ amount, turns });
  addLog("次刻の印: {turns}ターンの間、ターン開始時にエナジー+{amount}。", { turns, amount });
  floatText("player", statDeltaText("次刻", amount), "good");
}

function consumeEnergySigils() {
  let total = 0;
  for (const sigil of state.energySigils || []) {
    total += sigil.amount;
    sigil.turns -= 1;
  }
  state.energySigils = (state.energySigils || []).filter((sigil) => sigil.turns > 0);
  return total;
}

function applyPlateBeforeEnemy() {
  if (state.player.plate <= 0) return;
  const value = state.player.plate;
  state.player.block += value;
  state.player.plate = Math.max(0, state.player.plate - 1);
  addLog("敵の行動前にプレートでブロック+{amount}。プレートが1減少。", { amount: value });
  floatText("player", `${t("プレート")}${t("ブロック")}+${value}`, "block");
  return true;
}

function heal(amount) {
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
}

function applyRelics(hook) {
  for (const relicId of state.relics) {
    const relic = relics.find((item) => item.id === relicId);
    if (relic?.[hook]) relic[hook]();
  }
}

function gainRandomRelic() {
  const owned = new Set(state.relics);
  const pool = relics.filter((relic) => !owned.has(relic.id));
  if (!pool.length) return null;
  const relic = shuffle(pool)[0];
  state.relics.push(relic.id);
  addLog("レリック「{relic}」を得た。", { relic: localizeName(relic) });
  sound("notice");
  return relic;
}

function relicNode(relic) {
  const node = document.createElement("div");
  node.className = "relic-card";
  node.innerHTML = `<span>${t("レリック")}</span><strong>${localizeName(relic)}</strong><p>${localizeText(relic)}</p>`;
  return node;
}

function petri(amount) {
  const before = state.player.petri;
  state.player.petri = clampPlayerPetri(state.player.petri + amount);
  const gained = state.player.petri - before;
  if (amount > 0 && gained > 0) {
    document.body.classList.remove("petrify-pulse");
    void document.body.offsetWidth;
    document.body.classList.add("petrify-pulse");
    triggerPetriGainPowers(gained);
  }
  checkThresholds(before, state.player.petri);
}

function triggerPetriGainPowers(gained) {
  if (gained <= 0) return;
  const reactionBlock = state.player.stoneSkinReactionBlock || 0;
  if (reactionBlock > 0) {
    state.player.block += reactionBlock;
    floatText("player", statDeltaText("石肌", reactionBlock), "block");
  }
  const riposteDamage = state.player.crackRiposteDamage || 0;
  if (riposteDamage > 0 && state.enemy && state.enemy.hp > 0) {
    state.player.hp = clampPlayerHp(state.player.hp - (state.player.crackRiposte || 1));
    const dealt = fixedDamage(riposteDamage);
    floatText("player", `${t("反動")}-${state.player.crackRiposte || 1}`, "hit");
    if (dealt > 0) floatText("enemy", `${t("亀裂")}-${dealt}`, "hit");
  }
}

function checkThresholds(before, after) {
  for (const threshold of thresholds) {
    if (threshold.key !== "full" && after < threshold.value) state.thresholdSeen.delete(threshold.key);
    if (before < threshold.value && after >= threshold.value && !state.thresholdSeen.has(threshold.key)) {
      state.thresholdSeen.add(threshold.key);
      if (threshold.key !== "full") addEchoStoneSigilCopy(threshold);
      addLog(threshold.text);
      queueNotice("石化進行", threshold.text, threshold.still);
      sound("notice");
      floatText("player", `${t("石化")} ${threshold.value}`, "petri");
    }
  }
}

function exhaustCurseFromHand() {
  const index = state.hand.findIndex((card) => {
    const type = card.ritualManacleMutation?.type || card.type;
    return type === "curse" || type === "petrify";
  });
  if (index >= 0) {
    const [card] = state.hand.splice(index, 1);
    restoreRitualManacleMutation(card);
    state.exhaust.push(registerExhaust(card));
  }
}

function discardOneFromHand() {
  const index = state.hand.findIndex((card) => !card.playing && !card.retain);
  if (index < 0) return false;
  const [card] = state.hand.splice(index, 1);
  restoreRitualManacleMutation(card);
  card.fx = "discarding";
  state.discard.push(card);
  addHandEvent(t("{card}を捨て札に送った", { card: localizeName(card) }), "discarding");
  return true;
}

function debugChoiceScore(card) {
  if (!card) return 0;
  const type = card.ritualManacleMutation?.type || card.type;
  let score = 0;
  if (card.id === "stoneBrand") score += 1000;
  if (card.id === "burden" || card.id === "statueDream" || card.id === "priestSeal") score += 700;
  if (type === "curse" || type === "petrify") score += 450;
  if (card.cost > state.energy) score += 220;
  if (card.kind === "スキル") score += 30;
  if (card.kind === "攻撃") score -= 20;
  if (card.retain) score -= 80;
  if (card.id === "strike" || card.id === "defend") score += 15;
  return score;
}

function debugPickChoiceCard(candidates) {
  return [...candidates].sort((a, b) => debugChoiceScore(b) - debugChoiceScore(a))[0] || candidates[0];
}

function playableAutoCandidates() {
  return state.hand.filter((card) => {
    if (!card || card.playing || card.unplayable) return false;
    if (state.attackLocked && card.kind === "攻撃") return false;
    return true;
  });
}

async function playRandomCardForFree() {
  const candidates = playableAutoCandidates();
  if (!candidates.length) {
    floatText("player", t("対象なし"), "curse");
    addLog("自動使用できるカードがなかった。");
    return false;
  }
  const card = candidates[Math.floor(Math.random() * candidates.length)];
  floatText("player", localizeName(card), "good");
  await delay(180);
  return resolveCardPlay(card, { free: true, payCost: false });
}

function discardAnyCardFromHand(options = {}) {
  const candidates = state.hand.filter((card) => !card.playing);
  if (!candidates.length) return Promise.resolve(false);
  if (debugAutoChoices || (options.required && candidates.length === 1)) {
    const target = debugAutoChoices ? debugPickChoiceCard(candidates) : candidates[0];
    const [discarded] = state.hand.splice(state.hand.findIndex((item) => item.uid === target.uid), 1);
    restoreRitualManacleMutation(discarded);
    discarded.fx = "discarding";
    state.discard.push(discarded);
    addHandEvent(t("{card}を捨て札に送った", { card: localizeName(discarded) }), "discarding");
    addLog("{source}で{card}を捨て札に送った。", { source: t(options.source || "効果"), card: localizeName(discarded) });
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "choice-overlay";
    const source = t(options.source || "カード");
    overlay.innerHTML = `
      <div class="choice-modal">
        <h2>${t("捨てるカードを選択")}</h2>
        <p>${t("{source}の効果で、手札からカードを1枚捨て札に送ります。", { source })}</p>
        <div class="choice-cards"></div>
        ${options.required ? "" : `<div class="modal-actions"><button type="button" class="choice-cancel">${t("選ばない")}</button></div>`}
      </div>
    `;
    const cardsNode = overlay.querySelector(".choice-cards");
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector(".choice-cancel")?.addEventListener("click", () => close(false));
    for (const card of candidates) {
      const node = cardNode(card, () => {
        const index = state.hand.findIndex((item) => item.uid === card.uid);
        if (index >= 0) {
          const [discarded] = state.hand.splice(index, 1);
          restoreRitualManacleMutation(discarded);
          discarded.fx = "discarding";
          state.discard.push(discarded);
          addHandEvent(t("{card}を捨て札に送った", { card: localizeName(discarded) }), "discarding");
          addLog("{card}を捨て札に送った。", { card: localizeName(discarded) });
          close(true);
        } else {
          close(false);
        }
      }, { forceEnabled: true });
      cardsNode.appendChild(node);
    }
    document.body.appendChild(overlay);
  });
}

function exhaustAnyCardFromHand(options = {}) {
  const candidates = state.hand.filter((card) => !card.playing);
  if (!candidates.length) return Promise.resolve(false);
  if (debugAutoChoices || (options.required && candidates.length === 1)) {
    const target = debugAutoChoices ? debugPickChoiceCard(candidates) : candidates[0];
    const [exhausted] = state.hand.splice(state.hand.findIndex((item) => item.uid === target.uid), 1);
    restoreRitualManacleMutation(exhausted);
    exhausted.fx = "vanishing";
    state.exhaust.push(registerExhaust(exhausted));
    addHandEvent(t("{card}を廃棄した", { card: localizeName(exhausted) }), "vanishing");
    addLog("{source}で{card}を廃棄した。", { source: t(options.source || "効果"), card: localizeName(exhausted) });
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "choice-overlay";
    const source = t(options.source || "カード");
    overlay.innerHTML = `
      <div class="choice-modal">
        <h2>${t("廃棄するカードを選択")}</h2>
        <p>${t("{source}の効果で、手札からカードを1枚廃棄します。", { source })}</p>
        <div class="choice-cards"></div>
        ${options.required ? "" : `<div class="modal-actions"><button type="button" class="choice-cancel">${t("選ばない")}</button></div>`}
      </div>
    `;
    const cardsNode = overlay.querySelector(".choice-cards");
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector(".choice-cancel")?.addEventListener("click", () => close(false));
    for (const card of candidates) {
      const node = cardNode(card, () => {
        const index = state.hand.findIndex((item) => item.uid === card.uid);
        if (index >= 0) {
          const [exhausted] = state.hand.splice(index, 1);
          restoreRitualManacleMutation(exhausted);
          exhausted.fx = "vanishing";
          state.exhaust.push(registerExhaust(exhausted));
          addHandEvent(t("{card}を廃棄した", { card: localizeName(exhausted) }), "vanishing");
          addLog("{card}を廃棄した。", { card: localizeName(exhausted) });
          close(true);
        } else {
          close(false);
        }
      }, { forceEnabled: true });
      cardsNode.appendChild(node);
    }
    document.body.appendChild(overlay);
  });
}

function winFight() {
  addLog("{enemy}を砕いた。", { enemy: localizeName(state.enemy) });
  sound("win");
  floatText("enemy", t("撃破"), "hit");
  state.enemyDefeated = true;
  restoreTemporaryMutations();
  clearCombatStatuses();
  render();
  state.combatCount++;
  debugTimeout(() => {
    if (state.currentRoute?.final) return endRun(true);
    const gainedRelic = state.currentRoute?.type === "elite" ? gainRandomRelic() : null;
    state.floor++;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6);
    if (state.player.petri >= 100) return enterPetrifiedLoop();
    showRewards(gainedRelic, state.currentRoute?.type === "elite");
    render();
  }, 520);
}

function showRewards(gainedRelic = null, upgradedRewards = false) {
  setPhase("reward");
  const pool = [
    "guard", "lunge", "stepSlash", "selectingSlash", "shardCounterattack", "rubbleFlash", "breathingGuard", "heldStance",
    "tacticalDiscard", "cutAway", "shardBulwark", "crushingDefense", "sealedResolve", "nextTurnSigil", "desperatePurification",
    "heavyKnee", "crackedFinger", "stoneSeed", "stoneMeditation", "petriEnergySurge",
    "stoneCleave", "stiffJab", "collapseChain", "crumblingGambit", "fossilOffering", "stoneDeckCall",
    "freezingPanic", "marbleTears", "frozenPose",
    "resist", "chisel", "stoneCounter", "stoneDustPurge", "crackRiposte", "wreckageBreath", "statueReservoir", "crackEnergy",
    "echoingCrack", "marbleGuard", "shatter", "focus"
  ];
  const attackPool = pool.filter((id) => library[id].kind === "攻撃");
  const attackPick = shuffle(attackPool)[0];
  const picks = [attackPick, ...shuffle(pool.filter((id) => id !== attackPick)).slice(0, 2)].map((id) => {
    const card = freshCard(id);
    if (upgradedRewards) upgradeCard(card);
    return card;
  });
  state.rewardPicks = picks;
  qs("modalTitle").textContent = t("カード報酬");
  qs("rewardCards").className = "reward-cards";
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "rest-modal", "event-modal");
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions";
  actions.classList.remove("hidden");
  actions.innerHTML = `
    <button id="skipRewardBtn">${t("スキップして進む")}</button>
  `;
  qs("skipRewardBtn").addEventListener("click", () => {
    qs("rewardModal").classList.add("hidden");
    state.rewardPicks = [];
    showMapPhase();
  });
  qs("rewardCards").innerHTML = "";
  if (gainedRelic) qs("rewardCards").appendChild(relicNode(gainedRelic));
  for (const card of picks) {
    qs("rewardCards").appendChild(cardNode(card, () => {
      state.deck.push(displayCardCopy(card));
      qs("rewardModal").classList.add("hidden");
      state.rewardPicks = [];
      showMapPhase();
    }));
  }
  qs("rewardModal").classList.remove("hidden");
}

function advanceAfterMapNode() {
  state.floor++;
  if (state.player.petri >= 100) return enterPetrifiedLoop();
  showMapPhase();
  render();
}

function restAtCamp() {
  const before = snapshotStats();
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 18);
  petri(-30);
  sound("block");
  showStatDiff(before, "player");
  addLog("休憩して体勢を立て直した。");
  qs("rewardModal").classList.add("hidden");
  advanceAfterMapNode();
}

function showRestSite(route) {
  setPhase("rest");
  const hpGain = Math.min(18, state.player.maxHp - state.player.hp);
  const petriDrop = Math.min(30, state.player.petri);
  qs("modalTitle").textContent = localizeTitle(route);
  qs("rewardCards").className = "reward-cards rest-cards";
  qs("rewardCards").innerHTML = "";
  const scene = document.createElement("div");
  scene.className = "rest-scene";
  const mapLayer = document.createElement("div");
  mapLayer.className = "rest-map-layer";
  mapLayer.appendChild(mapTreeNode([]));
  const campLayer = document.createElement("div");
  campLayer.className = "rest-camp-layer";
  campLayer.innerHTML = `
    <div class="rest-panel">
      <span class="rest-kicker">${t("休憩地点")}</span>
      <strong>${localizeTitle(route)}</strong>
      <p>${localizeDetail(route)}</p>
      <div class="rest-effects">
        <span><b>HP</b> +${hpGain}</span>
        <span><b>${t("石化")}</b> -${petriDrop}</span>
      </div>
    </div>
  `;
  scene.append(mapLayer, campLayer);
  qs("rewardCards").appendChild(scene);
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "event-modal");
  document.querySelector("#rewardModal .modal").classList.add("rest-modal");
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions";
  actions.classList.remove("hidden");
  actions.innerHTML = `
    <button id="campRestBtn">${t("休憩する: HP+{hp} / 石化-{petri}", { hp: hpGain, petri: petriDrop })}</button>
    <button id="campForgeBtn">${t("鍛冶する")}</button>
  `;
  qs("campRestBtn").addEventListener("click", restAtCamp);
  qs("campForgeBtn").addEventListener("click", showForge);
  qs("rewardModal").classList.remove("hidden");
}

function showForge() {
  setPhase("forge");
  const candidates = state.deck.filter((card) => !card.upgraded && !card.unplayable);
  qs("modalTitle").textContent = t("鍛冶");
  qs("rewardCards").className = "reward-cards forge-cards";
  qs("rewardCards").innerHTML = "";
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "event-modal");
  document.querySelector("#rewardModal .modal").classList.add("rest-modal");
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions";
  actions.classList.remove("hidden");
  actions.innerHTML = `<button id="forgeBackBtn">${t("戻る")}</button>`;
  qs("forgeBackBtn").addEventListener("click", () => showRestSite(state.currentRoute));

  if (!candidates.length) {
    qs("rewardCards").innerHTML = `<div class="map-event-panel"><strong>${t("強化できるカードがない")}</strong><p>${t("すべての候補はすでに強化済みです。")}</p></div>`;
    return;
  }

  for (const card of candidates) {
    const option = document.createElement("div");
    option.className = "forge-option";
    option.appendChild(cardNode(card, () => {
      const before = displayCardCopy(card);
      upgradeCard(card);
      const after = displayCardCopy(card);
      sound("block");
      addLog("{card}を鍛えた。", { card: localizeName(card) });
      showForgeUpgrade(before, after);
    }));
    const preview = document.createElement("div");
    preview.className = "forge-preview";
    preview.innerHTML = `<strong>${t("強化後")}</strong><span>${t(upgradePreview(card))}</span>`;
    option.appendChild(preview);
    qs("rewardCards").appendChild(option);
  }
}

function displayCardCopy(card) {
  return { ...card, art: [...card.art], uid: crypto.randomUUID() };
}

function staticCardNode(card) {
  const node = cardNode(card, () => {});
  node.disabled = true;
  node.classList.remove("energy-locked");
  return node;
}

function showForgeUpgrade(before, after) {
  qs("modalTitle").textContent = t("鍛冶");
  qs("rewardCards").className = "reward-cards rest-cards";
  qs("rewardCards").innerHTML = "";
  const scene = document.createElement("div");
  scene.className = "rest-scene";
  const mapLayer = document.createElement("div");
  mapLayer.className = "rest-map-layer";
  mapLayer.appendChild(mapTreeNode([]));
  const campLayer = document.createElement("div");
  campLayer.className = "rest-camp-layer";
  const animation = document.createElement("div");
  animation.className = "forge-animation";
  const cardWrap = document.createElement("div");
  cardWrap.className = "forge-animation-card";
  cardWrap.appendChild(staticCardNode(before));
  const label = document.createElement("div");
  label.className = "forge-animation-label";
  label.textContent = t("鍛冶中...");
  animation.append(cardWrap, label);
  campLayer.appendChild(animation);
  scene.append(mapLayer, campLayer);
  qs("rewardCards").appendChild(scene);
  document.querySelector("#rewardModal .modal-actions").className = "modal-actions hidden";

  window.setTimeout(() => {
    cardWrap.classList.add("upgraded");
    cardWrap.replaceChildren(staticCardNode(after));
    label.textContent = t("{card} に強化された", { card: localizeName(after) });
  }, 720);
  window.setTimeout(() => {
    qs("rewardModal").classList.add("hidden");
    document.querySelector("#rewardModal .modal-actions").className = "modal-actions";
    advanceAfterMapNode();
  }, 1700);
}

function pickUnusedMapEvent() {
  return shuffle(mapEvents.filter((event) => !state.usedEvents.has(event.id)))[0] || null;
}

function eventChoiceCardsMarkup(choice) {
  if (!choice.cards?.length) return "";
  return `
    <span class="event-choice-cards">
      ${choice.cards.map((id) => {
        const card = library[id];
        if (!card) return "";
        return `<span class="event-choice-card" title="${escapeHtml(`${localizeName(card)}\n${localizeText(card)}`)}">
          <img src="${cardImage(card)}" alt="">
          <b>${localizeName(card)}</b>
          <em>${card.cost > 8 ? "-" : card.cost}</em>
        </span>`;
      }).join("")}
    </span>
  `;
}

function showEventSite(route) {
  setPhase("event");
  const event = pickUnusedMapEvent();
  if (!event) {
    addLog("新しい出来事は起きなかった。待ち伏せに遭遇した。");
    return startFight({ ...route, type: "combat", randomEnemy: true, title: "待ち伏せ", effect: "ランダム戦闘" });
  }

  state.usedEvents.add(event.id);
  state.currentEvent = event;
  renderEventSite(event);
}

function renderEventSite(event, options = {}) {
  qs("modalTitle").textContent = localizeTitle(event);
  qs("rewardCards").className = "reward-cards event-cards";
  qs("rewardCards").innerHTML = `
    <div class="event-scene" style="--event-still: url('${event.still}')">
      <div class="event-panel">
        <span class="rest-kicker">${t("イベント")}</span>
        <strong>${localizeTitle(event)}</strong>
        <p>${localizeDetail(event)}</p>
      </div>
    </div>
  `;
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "rest-modal", "event-modal");
  document.querySelector("#rewardModal .modal").classList.add("event-modal");
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions event-actions";
  actions.classList.remove("hidden");
  actions.innerHTML = "";

  event.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "event-choice";
    button.type = "button";
    const disabled = choice.disabled?.() || false;
    button.disabled = disabled;
    button.innerHTML = `<b>${localizeLabel(choice)}</b><span>${disabled ? t(choice.disabledText) : localizePreview(choice)}</span>${disabled ? "" : eventChoiceCardsMarkup(choice)}`;
    button.addEventListener("click", () => resolveMapEventChoice(event, choice, index));
    actions.appendChild(button);
  });

  if (!options.silent) sound("notice");
  qs("rewardModal").classList.remove("hidden");
  render();
}

  function showOpeningEvent(options = {}) {
    setPhase("openingEvent");
    state.currentEvent = openingEvent;
    if (!options.preserveChoices || !state.openingEventChoices?.length) {
      state.openingEventChoices = shuffle(openingEvent.choices).slice(0, 2);
    }
    qs("modalTitle").textContent = localizeTitle(openingEvent);
    qs("rewardCards").className = "reward-cards event-cards";
    qs("rewardCards").innerHTML = `
      <div class="event-scene" style="--event-still: url('${openingEvent.still}')">
        <div class="event-panel">
          <span class="rest-kicker">${t("出発前")}</span>
          <strong>${localizeTitle(openingEvent)}</strong>
          <p>${localizeDetail(openingEvent)}</p>
        </div>
      </div>
    `;
    document.querySelector("#rewardModal .modal").classList.remove("map-modal", "rest-modal", "event-modal");
    document.querySelector("#rewardModal .modal").classList.add("event-modal");
    const actions = document.querySelector("#rewardModal .modal-actions");
    actions.className = "modal-actions event-actions";
    actions.classList.remove("hidden");
    actions.innerHTML = "";

    state.openingEventChoices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "event-choice";
      button.type = "button";
      button.innerHTML = `<b>${localizeLabel(choice)}</b><span>${localizePreview(choice)}</span>${eventChoiceCardsMarkup(choice)}`;
      button.addEventListener("click", () => resolveOpeningEventChoice(choice, index));
      actions.appendChild(button);
    });

    if (!options.silent) sound("notice");
    qs("rewardModal").classList.remove("hidden");
    render();
  }

  function resolveOpeningEventChoice(choice) {
    const before = snapshotStats();
    const result = choice.apply();
    sound("block");
    showStatDiff(before, "player");
    addLog("{event}: {choice}", { event: localizeTitle(openingEvent), choice: localizeLabel(choice) });
    if (choice.requiresOpeningUpgradeSelection) {
      render();
      return showOpeningUpgradeSelection(result);
    }
    if (choice.requiresOpeningTransformSelection) {
      render();
      return showOpeningTransformSelection(result);
    }
    showOpeningEventResult(choice.label, result, choice.preview);
    render();
  }

  function showOpeningEventResult(title, result, effect) {
    setPhase("openingResult");
    qs("rewardCards").innerHTML = `
      <div class="event-scene" style="--event-still: url('${openingEvent.still}')">
        <div class="event-panel">
          <span class="rest-kicker">${t("結果")}</span>
          <strong>${t(title)}</strong>
          <p>${t(result)}</p>
          <em>${t(effect)}</em>
        </div>
      </div>
    `;
    const actions = document.querySelector("#rewardModal .modal-actions");
    actions.className = "modal-actions";
    actions.innerHTML = `<button id="continueOpeningBtn">${t("進む")}</button>`;
    qs("continueOpeningBtn").addEventListener("click", () => {
      state.openingEventChoices = [];
      qs("rewardModal").classList.add("hidden");
      document.querySelector("#rewardModal .modal").classList.remove("event-modal");
      showMapPhase();
    });
  }

  function showOpeningUpgradeSelection(intro) {
    qs("modalTitle").textContent = `${localizeTitle(openingEvent)}: ${t("カード選択")}`;
    qs("rewardCards").className = "reward-cards forge-cards event-transform-cards";
    qs("rewardCards").innerHTML = "";
    const introPanel = document.createElement("div");
    introPanel.className = "event-transform-note";
    introPanel.innerHTML = `<strong>${t("強化するカードを選ぶ")}</strong><p>${t(intro)}</p><em>${t("選んだカードを強化してから出発する。")}</em>`;
    qs("rewardCards").appendChild(introPanel);
    const candidates = state.deck.filter((card) => !card.upgraded && !card.unplayable);
    for (const card of candidates) {
      const option = document.createElement("div");
      option.className = "forge-option";
      option.appendChild(cardNode(card, () => {
        const beforeName = card.name;
        upgradeCard(card);
        const result = t("{card}を強化した。", { card: t(beforeName) });
        addLog(result);
        sound("block");
        showOpeningEventResult("強化完了", result, t("{card}を強化", { card: t(beforeName) }));
        render();
      }, { forceEnabled: true }));
      const preview = document.createElement("div");
      preview.className = "forge-preview";
      preview.innerHTML = `<strong>${t("強化後")}</strong><span>${t(upgradePreview(card))}</span>`;
      option.appendChild(preview);
      qs("rewardCards").appendChild(option);
    }
    const actions = document.querySelector("#rewardModal .modal-actions");
    actions.className = "modal-actions hidden";
    actions.innerHTML = "";
  }

  function showOpeningTransformSelection(intro) {
    qs("modalTitle").textContent = `${localizeTitle(openingEvent)}: ${t("カード選択")}`;
    qs("rewardCards").className = "reward-cards forge-cards event-transform-cards";
    qs("rewardCards").innerHTML = "";
    const introPanel = document.createElement("div");
    introPanel.className = "event-transform-note";
    introPanel.innerHTML = `<strong>${t("変化させるカードを選ぶ")}</strong><p>${t(intro)}</p><em>${t("選んだカードはランダムなカードに変化する。")}</em>`;
    qs("rewardCards").appendChild(introPanel);
    for (const card of state.deck) {
      qs("rewardCards").appendChild(cardNode(card, () => {
        const beforeName = card.name;
        const nextId = shuffle(randomTransformCardIds.filter((id) => id !== card.id))[0];
        transformCard(card, nextId);
        const result = t("{before}は{after}に変化した。", { before: t(beforeName), after: localizeName(card) });
        addLog(result);
        sound("petri");
        showOpeningEventResult("変化完了", result, `${t(beforeName)} -> ${localizeName(card)}`);
        render();
      }, { forceEnabled: true }));
    }
    const actions = document.querySelector("#rewardModal .modal-actions");
    actions.className = "modal-actions hidden";
    actions.innerHTML = "";
  }

  function resolveMapEventChoice(event, choice) {
    const before = snapshotStats();
    const result = choice.apply();
  sound("block");
  showStatDiff(before, "player");
  addLog("{event}: {choice}", { event: localizeTitle(event), choice: localizeLabel(choice) });
  if (choice.requiresTransformSelection) {
    render();
    return showEventTransformSelection(event, choice, result);
  }
  showEventResult(event, choice.label, result, choice.preview);
  if (state.player.petri >= 100) return enterPetrifiedLoop();
  render();
}

function showEventResult(event, title, result, effect) {
  setPhase("eventResult");
  qs("rewardCards").innerHTML = `
    <div class="event-scene" style="--event-still: url('${event.still}')">
      <div class="event-panel">
        <span class="rest-kicker">${t("結果")}</span>
        <strong>${t(title)}</strong>
        <p>${t(result)}</p>
        <em>${t(effect)}</em>
      </div>
    </div>
  `;
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions";
  actions.innerHTML = `<button id="continueMapBtn">${t("進む")}</button>`;
  qs("continueMapBtn").addEventListener("click", () => {
    qs("rewardModal").classList.add("hidden");
    document.querySelector("#rewardModal .modal").classList.remove("event-modal");
    advanceAfterMapNode();
  });
}

function showEventTransformSelection(event, choice, intro) {
  qs("modalTitle").textContent = `${localizeTitle(event)}: ${t("カード選択")}`;
  qs("rewardCards").className = "reward-cards forge-cards event-transform-cards";
  qs("rewardCards").innerHTML = "";
  const introPanel = document.createElement("div");
  introPanel.className = "event-transform-note";
  introPanel.innerHTML = `<strong>${t("瘴気に侵されるカードを選択")}</strong><p>${t(intro)}</p><em>${t("選んだカードは{card}になる。", { card: localizeName(library[choice.transformTo]) })}${t("この選択はスキップできない。")}</em>`;
  qs("rewardCards").appendChild(introPanel);
  for (const card of state.deck) {
    qs("rewardCards").appendChild(cardNode(card, () => {
      const beforeName = card.name;
      transformCard(card, choice.transformTo);
      const result = `${t(intro)} ${t("{before}は{after}に変化した。", { before: t(beforeName), after: localizeName(card) })}`;
      addLog(result);
      sound("petri");
      showEventResult(event, "変化完了", result, `${localizePreview(choice)} / ${t(beforeName)} -> ${localizeName(card)}`);
      render();
    }, { forceEnabled: true }));
  }
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions hidden";
  actions.innerHTML = "";
}

function resolveSimpleMapNode(route) {
  setPhase("mapResult");
  const before = snapshotStats();
  if (route.hp) state.player.hp = Math.max(1, Math.min(state.player.maxHp, state.player.hp + route.hp));
  if (route.petri) petri(route.petri);
  const gainedRelic = route.type === "treasure" ? gainRandomRelic() : null;
  sound(route.type === "treasure" ? "notice" : "block");
  showStatDiff(before, "player");
  qs("modalTitle").textContent = localizeTitle(route);
  qs("rewardCards").className = "reward-cards rest-cards";
  qs("rewardCards").innerHTML = `
    <div class="map-event-panel">
      <strong>${t(mapNodeTypes[route.type]?.label || route.title)}</strong>
      <p>${localizeDetail(route)}</p>
      <em>${localizeEffect(route)}</em>
      ${gainedRelic ? `<div class="relic-card inline"><span>${t("レリック")}</span><strong>${localizeName(gainedRelic)}</strong><p>${localizeText(gainedRelic)}</p></div>` : ""}
    </div>
  `;
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "rest-modal", "event-modal");
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions";
  actions.classList.remove("hidden");
  actions.innerHTML = `<button id="continueMapBtn">${t("進む")}</button>`;
  qs("continueMapBtn").addEventListener("click", () => {
    qs("rewardModal").classList.add("hidden");
    advanceAfterMapNode();
  });
  qs("rewardModal").classList.remove("hidden");
  render();
}

function showMapPhase() {
  if (state.runOver || state.petrified) return;
  if (state.player.petri >= 100) return enterPetrifiedLoop();
  setPhase("map");
  cancelCardDrag();
  state.enemy = null;
  state.enemyDefeated = false;
  state.hand = [];
  state.energy = 0;
  const routes = availableMapRoutes();
  qs("modalTitle").textContent = state.floor >= 11 ? t("最終深層への道") : t("深層 {floor} への道", { floor: state.floor });
  qs("rewardCards").className = "reward-cards map-cards";
  qs("rewardCards").innerHTML = "";
  qs("rewardCards").appendChild(mapTreeNode(routes));
  document.querySelector("#rewardModal .modal").classList.remove("rest-modal", "event-modal");
  document.querySelector("#rewardModal .modal").classList.add("map-modal");
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.className = "modal-actions hidden";
  actions.innerHTML = "";
  qs("rewardModal").classList.remove("hidden");
  render();
  window.setTimeout(scrollMapToFocus, 80);
}

function availableMapRoutes() {
  const map = state.runMap;
  const nodesById = Object.fromEntries(map.nodes.map((node) => [node.id, node]));
  if (debugFreeMapSelect) {
    return map.nodes.filter((node) => node.id !== "start" && node.id !== map.current);
  }
  if (debugMapSelect) {
    return map.nodes.filter((node) => node.floor === state.floor && node.id !== map.current && !map.visited.includes(node.id));
  }
  return map.edges
    .filter((edge) => edge.from === map.current)
    .map((edge) => nodesById[edge.to])
    .filter((node) => node && node.floor === state.floor && !map.visited.includes(node.id));
}

  function mapTreeNode(routes) {
    const mapViewHeight = 160;
    const tree = document.createElement("div");
    tree.className = "map-tree";
  const map = state.runMap;
  const availableIds = new Set(routes.map((route) => route.id));
  const naturalIds = new Set(
    map.edges
      .filter((edge) => edge.from === map.current)
      .map((edge) => edge.to)
  );
  const visited = new Set(map.visited);
  const nodes = map.nodes.map((node) => ({
    ...node,
    label: localizeTitle(node),
    route: availableIds.has(node.id) ? node : null,
    debugRoute: debugMapSelect && availableIds.has(node.id) && !naturalIds.has(node.id),
    current: node.id === map.current,
    completed: visited.has(node.id) && node.id !== map.current,
    preview: !visited.has(node.id) && !availableIds.has(node.id) && node.id !== map.current
  }));
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
    tree.innerHTML = `<svg class="map-svg" viewBox="0 0 100 ${mapViewHeight}" preserveAspectRatio="none" aria-hidden="true">
    ${map.edges.map((edge) => {
      const from = byId[edge.from];
      const to = byId[edge.to];
      const done = visited.has(edge.from) && visited.has(edge.to);
      const available = edge.from === map.current && availableIds.has(edge.to);
      return `<path class="${done ? "done" : ""}${available ? " available" : ""}" d="M ${from.x} ${from.y} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y}" />`;
    }).join("")}
  </svg>`;
  if (routes.length) {
    const callout = document.createElement("div");
    callout.className = "map-callout";
    callout.textContent = t("次のマスを選択");
    tree.appendChild(callout);
  }

  for (const node of nodes) {
    const meta = mapNodeTypes[node.type] || { label: node.label, icon: "▲" };
      const el = node.route ? document.createElement("button") : document.createElement("div");
      el.className = `map-tree-node ${node.type}${node.route ? " available" : ""}${node.debugRoute ? " debug-route" : ""}${node.preview ? " preview" : ""}${node.completed ? " completed" : ""}${node.current ? " current" : ""}`;
      el.style.left = `${node.x}%`;
      el.style.top = `${100 * node.y / mapViewHeight}%`;
    el.title = node.route ? `${node.label}\n${localizeDetail(node.route)}\n${localizeEffect(node.route)}` : node.label;
    el.innerHTML = `<span class="map-icon">${meta.icon}</span><strong>${node.label}</strong>${node.route ? `<em>${localizeEffect(node.route)}</em>` : ""}`;
    if (node.route) el.addEventListener("click", () => chooseRoute(node.route));
    tree.appendChild(el);
  }

  const legend = document.createElement("div");
  legend.className = "map-legend";
  const debugLegend = debugFreeMapSelect ? `<span class="debug-free"><i>DBG</i>FREE MAP</span>` : "";
  legend.innerHTML = `${debugLegend}${Object.entries(mapNodeTypes).map(([key, meta]) => `<span><i class="${key}">${meta.icon}</i>${t(meta.label)}</span>`).join("")}`;
  tree.appendChild(legend);
  return tree;
}

function scrollMapToFocus() {
  const scroller = qs("rewardCards");
  if (!scroller?.classList.contains("map-cards")) return;
  const target = scroller.querySelector(".map-tree-node.available") || scroller.querySelector(".map-tree-node.current");
  if (!target) return;
  const scrollerRect = scroller.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const left = targetRect.left - scrollerRect.left + scroller.scrollLeft - (scroller.clientWidth / 2) + (targetRect.width / 2);
  const top = targetRect.top - scrollerRect.top + scroller.scrollTop - (scroller.clientHeight / 2) + (targetRect.height / 2);
  scroller.scrollTo({
    left: Math.max(0, left),
    top: Math.max(0, top),
    behavior: "smooth"
  });
}

function chooseRoute(route) {
  if (debugMapSelect && route.floor !== state.floor) state.floor = route.floor;
  state.runMap.current = route.id;
  if (!state.runMap.visited.includes(route.id)) state.runMap.visited.push(route.id);
  state.path = [...state.runMap.visited];
  state.currentRoute = route;
  addLog(`${localizeTitle(route)}: ${localizeEffect(route)}`);
  qs("rewardModal").classList.add("hidden");
  qs("rewardCards").className = "reward-cards";
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "rest-modal", "event-modal");
  document.querySelector("#rewardModal .modal-actions").className = "modal-actions";
  if (route.type === "combat" || route.type === "elite") return startFight(route);
  if (route.type === "rest") return showRestSite(route);
  if (route.type === "event") return showEventSite(route);
  return resolveSimpleMapNode(route);
}

function selectGameoverStill(reason) {
  const hpRatio = state.player.maxHp > 0 ? state.player.hp / state.player.maxHp : 0;
  if (reason === "petrified" && hpRatio >= .25) return "assets/gameover_1.png";
  return "assets/gameover_2.png";
}

function gameoverStillMarkup() {
  if (!state.gameoverStill) return "";
  const petriBadge = state.runOver && state.gameoverReason === "petrified"
    ? `<div class="gameover-petri-badge">
        <img src="assets/debuff_petri_rank4.png" alt="">
        <span>${t("完全石化")}</span>
      </div>`
    : "";
  return `<div class="gameover-still-frame"><img class="gameover-still" src="${state.gameoverStill}" alt="">${petriBadge}</div>`;
}

function enterPetrifiedLoop() {
  if (debugNoGameOver) {
    state.petrified = false;
    state.player.petri = Math.min(99, state.player.petri);
    state.player.hp = Math.max(1, state.player.hp);
    addLog("デバッグ: 完全石化を99で踏みとどまった。");
    render();
    return;
  }
  setPhase("petrified");
  state.petrified = true;
  stopSlashEffect();
  sound("gameover");
  state.gameoverStill = selectGameoverStill("petrified");
  state.gameoverReason = "petrified";
  state.player.petri = 100;
  state.player.block = 0;
  state.energy = 0;
  state.hand = [];
  if (state.enemy) state.enemy.intent = { attack: 0, petriGain: 0 };
  render();
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "rest-modal", "event-modal");
  qs("modalTitle").textContent = t("完全石化");
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.classList.remove("hidden");
  actions.innerHTML = `
    <button id="struggleBtn">${t("動こうとする")}</button>
    <button id="giveUpBtn">${t("諦める")}</button>
  `;
  qs("struggleBtn").addEventListener("click", showNextStatueText);
  qs("giveUpBtn").addEventListener("click", () => endRun(false));
  qs("rewardModal").classList.remove("hidden");
  showNextStatueText();
}

function showNextStatueText() {
  const text = statueTexts[state.statueIndex % statueTexts.length];
  state.statueIndex++;
  qs("rewardCards").innerHTML = `<div class="ending gameover-ending">${gameoverStillMarkup()}<p>${t(text)}</p></div>`;
}

function endRun(victory) {
  if (!victory && debugNoGameOver) {
    state.player.hp = Math.max(1, state.player.hp);
    addLog("デバッグ: HP1で踏みとどまった。");
    render();
    return;
  }
  setPhase("runOver");
  state.runOver = true;
  state.petrified = false;
  restoreTemporaryMutations();
  clearCombatStatuses();
  document.querySelector("#rewardModal .modal").classList.remove("map-modal", "rest-modal", "event-modal");
  qs("modalTitle").textContent = victory ? t("最深部を突破した") : t("ゲームオーバー");
  if (victory) state.gameoverReason = null;
  if (!victory && !state.gameoverStill) {
    state.gameoverReason = state.gameoverReason || "hp";
    state.gameoverStill = selectGameoverStill("hp");
  }
  qs("rewardCards").innerHTML = `<div class="ending ${victory ? "" : "gameover-ending"}">${victory ? "" : gameoverStillMarkup()}<p>${victory ? t("石化を力に変え、呪いの司祭を砕いた。") : t("あなたは抵抗をやめた。動かない身体はそのまま遺跡に残り、誰かが見つける日まで沈黙する。")}</p></div>`;
  const actions = document.querySelector("#rewardModal .modal-actions");
  actions.classList.remove("hidden");
  actions.innerHTML = `<button id="retryBtn">${t("最初から")}</button>`;
  qs("retryBtn").addEventListener("click", requestNewGame);
  qs("rewardModal").classList.remove("hidden");
  render();
}

function queueNotice(title, text, still = "") {
  if (debugAutoChoices) {
    addLog(`${title}: ${text}`);
    return;
  }
  state.notices.push({ title, text, still });
  if (!state.noticeOpen) showNextNotice();
}

function showNextNotice() {
  const notice = state.notices.shift();
  if (!notice) {
    state.noticeOpen = false;
    qs("noticeModal").classList.add("hidden");
    return;
  }
  state.noticeOpen = true;
  qs("noticeTitle").textContent = t(notice.title);
  qs("noticeText").textContent = t(notice.text);
  const still = qs("noticeStill");
  if (still) {
    still.classList.toggle("hidden", !notice.still);
    if (notice.still) still.src = notice.still;
  }
  qs("noticeModal").classList.remove("hidden");
}

function cardImage(card) {
  const [group, index] = card.art;
  return art[group][index];
}

let cardDragState = null;
let focusedHandCardNode = null;
let pendingHandLayout = null;

function setFocusedHandCard(node) {
  if (focusedHandCardNode && focusedHandCardNode !== node) {
    focusedHandCardNode.classList.remove("focused-card");
    if (!focusedHandCardNode.classList.contains("drag-source")) {
      focusedHandCardNode.style.removeProperty("--card-rotate");
    }
  }
  focusedHandCardNode = node;
  if (!node) return;
  node.classList.add("focused-card");
}

function clearFocusedHandCard(node = focusedHandCardNode) {
  if (!node) return;
  node.classList.remove("focused-card");
  if (!node.classList.contains("drag-source")) node.style.removeProperty("--card-rotate");
  if (focusedHandCardNode === node) focusedHandCardNode = null;
}

function clearCardDragVisuals() {
  document.querySelectorAll(".card-drag-ghost, .card-drag-link").forEach((node) => node.remove());
  document.querySelectorAll(".card.drag-source, .card.focused-card").forEach((node) => {
    node.classList.remove("drag-source", "focused-card");
    node.style.removeProperty("--card-rotate");
  });
  focusedHandCardNode = null;
}

function handCardNearPoint(handEl, x, y) {
  const cards = [...handEl.querySelectorAll(".card")];
  if (!cards.length) return null;
  const tolerance = cards.length >= 7 ? 26 : 16;
  const edgeTolerance = cards.length >= 7 ? 48 : 28;
  const yTolerance = cards.length >= 7 ? 38 : 30;
  const handRect = handEl.getBoundingClientRect();
  let best = null;
  let bestDistance = Infinity;
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index];
    const fanX = Number.parseFloat(card.style.getPropertyValue("--fan-x")) || 0;
    const fanY = Number.parseFloat(card.style.getPropertyValue("--fan-y")) || 0;
    const rect = {
      left: handRect.left + card.offsetLeft + fanX,
      top: handRect.top + card.offsetTop + fanY,
      width: card.offsetWidth,
      height: card.offsetHeight
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    const leftTolerance = index === 0 ? edgeTolerance : tolerance;
    const rightTolerance = index === cards.length - 1 ? edgeTolerance : tolerance;
    const inVerticalRange = y >= rect.top - yTolerance && y <= rect.bottom + yTolerance;
    const inHorizontalRange = x >= rect.left - leftTolerance && x <= rect.right + rightTolerance;
    if (!inVerticalRange || !inHorizontalRange) continue;
    const cardCenter = rect.left + rect.width / 2;
    const distance = Math.abs(x - cardCenter);
    if (distance < bestDistance) {
      best = card;
      bestDistance = distance;
    }
  }
  return best;
}

function captureHandLayout(handEl) {
  const layout = new Map();
  for (const node of handEl.querySelectorAll(".card[data-uid]")) {
    if (node.classList.contains("drag-source")) continue;
    layout.set(node.dataset.uid, {
      rect: node.getBoundingClientRect()
    });
  }
  return layout;
}

function animateHandLayout(node, previousLayout) {
  if (!node.dataset.uid || !previousLayout.has(node.dataset.uid)) return;
  if (node.classList.contains("added") || node.classList.contains("dealt") || node.classList.contains("mutated")) return;
  if (node.classList.contains("discarding") || node.classList.contains("vanishing")) return;
  const previous = previousLayout.get(node.dataset.uid);
  const current = node.getBoundingClientRect();
  const dx = previous.rect.left - current.left;
  const dy = previous.rect.top - current.top;
  if (Math.abs(dx) < .5 && Math.abs(dy) < .5) return;
  const cappedDx = Math.max(-56, Math.min(56, dx));
  const cappedDy = Math.max(-28, Math.min(28, dy));
  const previousTransition = node.style.transition;
  node.style.transition = "none";
  node.style.setProperty("--layout-x", `${cappedDx}px`);
  node.style.setProperty("--layout-y", `${cappedDy}px`);
  node.getBoundingClientRect();
  requestAnimationFrame(() => {
    node.style.transition = previousTransition;
    node.style.setProperty("--layout-x", "0px");
    node.style.setProperty("--layout-y", "0px");
    window.setTimeout(() => {
      node.style.removeProperty("--layout-x");
      node.style.removeProperty("--layout-y");
    }, 320);
  });
}

function setupPlayableCardDrag(node, card, onPlay) {
  node.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  node.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (state.petrified || state.runOver || state.turnResolving || state.cardResolving) return;
    if (!card || card.unplayable || card.cost > state.energy) return;
    if (state.attackLocked && isAttackCard(card)) return;

    event.preventDefault();
    const rect = node.getBoundingClientRect();
    const ghost = node.cloneNode(true);
    ghost.classList.add("card-drag-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.setProperty("--card-rotate", "0deg");
    document.body.appendChild(ghost);
    const link = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    link.classList.add("card-drag-link");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", "0");
    line.setAttribute("y2", "0");
    link.appendChild(line);
    document.body.appendChild(link);
    node.classList.add("drag-source");
    setFocusedHandCard(node);
    node.style.setProperty("--card-rotate", "0deg");

    cardDragState = {
      card,
      onPlay,
      source: node,
      ghost,
      link,
      line,
      sourceX: rect.left + rect.width / 2,
      sourceY: rect.top + rect.height / 2,
      ghostWidth: rect.width,
      ghostHeight: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
      pointerId: event.pointerId
    };
    updateDraggedCard(event.clientX, event.clientY);
    showCardPreview(card, event.clientX, event.clientY);
    document.addEventListener("pointermove", onCardDragMove);
    document.addEventListener("pointerup", onCardDragEnd);
    document.addEventListener("pointercancel", cancelCardDrag);
  });
}

function onCardDragMove(event) {
  if (!cardDragState) return;
  cardDragState.moved = true;
  updateDraggedCard(event.clientX, event.clientY);
  showCardPreview(cardDragState.card, event.clientX, event.clientY);
}

function onCardDragEnd(event) {
  if (!cardDragState) return;
  const { card, onPlay } = cardDragState;
  const canPlay = isValidCardDrop(card, event.clientX, event.clientY);
  if (canPlay) pendingHandLayout = captureHandLayout(qs("hand"));
  cancelCardDrag();
  if (canPlay) onPlay();
}

function cancelCardDrag() {
  if (!cardDragState) return;
  cardDragState.source.classList.remove("drag-source");
  clearFocusedHandCard(cardDragState.source);
  cardDragState.source.style.removeProperty("--card-rotate");
  cardDragState.ghost?.remove();
  cardDragState.link?.remove();
  cardDragState = null;
  hideCardPreview();
  document.removeEventListener("pointermove", onCardDragMove);
  document.removeEventListener("pointerup", onCardDragEnd);
  document.removeEventListener("pointercancel", cancelCardDrag);
}

function cancelCardDragFromInterrupt(event) {
  if (event?.preventDefault) event.preventDefault();
  if (!cardDragState) {
    clearCardDragVisuals();
    return;
  }
  cancelCardDrag();
  clearCardDragVisuals();
}

function updateDraggedCard(x, y) {
  if (!cardDragState) return;
  const { ghost, line, sourceX, sourceY, ghostWidth, ghostHeight, offsetX, offsetY, card } = cardDragState;
  const ghostLeft = x - offsetX;
  const ghostTop = y - offsetY;
  ghost.style.left = `${ghostLeft}px`;
  ghost.style.top = `${ghostTop}px`;
  line.setAttribute("x1", `${sourceX}`);
  line.setAttribute("y1", `${sourceY}`);
  line.setAttribute("x2", `${ghostLeft + ghostWidth / 2}`);
  line.setAttribute("y2", `${ghostTop + ghostHeight / 2}`);
  ghost.classList.toggle("drop-valid", isValidCardDrop(card, x, y));
}

function isValidCardDrop(card, x, y) {
  if (!card || card.unplayable || card.cost > state.energy) return false;
  if (state.attackLocked && isAttackCard(card)) return false;
  if (isAttackCard(card)) {
    const enemy = qs("enemyActor");
    if (!enemy || !state.enemy || state.enemy.hp <= 0) return false;
    const rect = enemy.getBoundingClientRect();
    const pad = 90;
    return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad;
  }
  const hand = qs("hand");
  if (!hand) return false;
  const rect = hand.getBoundingClientRect();
  return y < rect.top - 18;
}

function ensureCardPreview() {
  let panel = qs("cardPreview");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "cardPreview";
    panel.className = "card-preview hidden";
    document.body.appendChild(panel);
  }
  return panel;
}

function showCardPreview(card, x, y) {
  const panel = ensureCardPreview();
  const outcome = estimateCardOutcome(card);
  const validDrop = isValidCardDrop(card, x, y);
  const attack = isAttackCard(card);
  panel.classList.toggle("hidden", false);
  panel.classList.toggle("invalid", !outcome.valid);
  panel.innerHTML = `
    <strong>${attack ? t("敵に放す") : t("上に放す")}</strong>
    ${outcome.lines.slice(0, 5).map((line) => `<span>${t(line)}</span>`).join("")}
  `;
  const left = Math.min(Math.max(x + 18, 12), window.innerWidth - 252);
  const top = Math.min(Math.max(y - 120, 12), window.innerHeight - 160);
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  qs("enemyActor").classList.toggle("card-drop-target", attack);
  qs("enemyActor").classList.toggle("card-drop-ready", attack && validDrop);
  qs("playerActor").classList.toggle("card-drop-target", !attack);
  qs("playerActor").classList.toggle("card-drop-ready", !attack && validDrop);
}

function hideCardPreview() {
  const panel = qs("cardPreview");
  if (panel) panel.classList.add("hidden");
  qs("enemyActor")?.classList.remove("card-drop-target", "card-drop-ready");
  qs("playerActor")?.classList.remove("card-drop-target", "card-drop-ready");
}

function cardNode(card, onClick, options = {}) {
  const node = document.createElement("button");
  const energyLocked = options.playContext && !card.unplayable && card.cost > state.energy;
  const resolvingLocked = options.playContext && (state.turnResolving || state.cardResolving);
  node.className = `card ${card.type}${card.unplayable ? " unplayable" : ""}${energyLocked ? " energy-locked" : ""}${resolvingLocked ? " resolving-locked" : ""}${card.stoneOverlay ? " stone-overlaid" : ""}${card.fx ? ` ${card.fx}` : ""}`;
  node.disabled = resolvingLocked || (Boolean(card.unplayable) && !options.forceEnabled);
  if (card.uid) node.dataset.uid = card.uid;
  const extraText = [
    card.innate ? t("天賦。") : "",
    card.retain ? t("保留。") : "",
    card.ethereal ? t("エセリアル。") : ""
  ].filter(Boolean).map((text) => `<br><b>${text}</b>`).join("");
  node.innerHTML = `
    <span class="cost">${card.cost > 8 ? "-" : card.cost}</span>
    <h3>${localizeName(card)}</h3>
    <span class="card-art"><img src="${cardImage(card)}" alt=""></span>
    <span class="kind">${localizeKind(card)}</span>
    <p>${localizeText(card)}${extraText}</p>
  `;
  if (options.playContext) setupPlayableCardDrag(node, card, onClick);
  else node.addEventListener("click", onClick);
  if (card.fx && ["added", "dealt", "mutated"].includes(card.fx)) {
    node.addEventListener("animationend", () => {
      node.classList.remove("added", "dealt", "mutated");
    }, { once: true });
  }
  return node;
}

function pileCardNode(card) {
  const node = cardNode(card, () => {});
  node.disabled = true;
  node.classList.remove("energy-locked");
  return node;
}

function debugCardLibraryNode(card) {
  const node = cardNode(card, () => {
    const added = freshCard(card.id);
    state.deck.push(added);
    addLog(`デバッグ: ${added.name}をデッキに追加`);
    render();
    node.classList.remove("debug-added");
    void node.offsetWidth;
    node.classList.add("debug-added");
  }, { forceEnabled: true });
  node.classList.add("debug-card-pick");
  return node;
}

function showDebugCardLibrary() {
  if (!debugMapSelect) return;
  qs("pileTitle").textContent = `${t("デバッグ")}: ${t("カード追加")}`;
  qs("pileCards").className = "pile-cards debug-card-library";
  qs("pileCards").innerHTML = "";
  for (const id of Object.keys(library)) {
    qs("pileCards").appendChild(debugCardLibraryNode(freshCard(id)));
  }
  qs("pileModal").classList.remove("hidden");
}

function showPile(kind) {
  const cards = kind === "draw"
    ? [...state.drawPile].reverse()
    : kind === "discard"
      ? [...state.discard].reverse()
      : [...state.deck];
  qs("pileCards").className = "pile-cards";
  qs("pileTitle").textContent = kind === "draw"
    ? `${t("山札")} ${cards.length}${t("枚")}`
    : kind === "discard"
      ? `${t("捨札")} ${cards.length}${t("枚")}`
      : `${t("所持カード")} ${cards.length}${t("枚")}`;
  qs("pileCards").innerHTML = "";
  if (!cards.length) {
    qs("pileCards").innerHTML = `<div class="pile-empty">${t("カードはありません")}</div>`;
  } else {
    for (const card of cards) qs("pileCards").appendChild(pileCardNode(card));
  }
  qs("pileModal").classList.remove("hidden");
}

function snapshotStats() {
  return {
    playerHp: state.player.hp,
    playerBlock: state.player.block,
    playerPlate: state.player.plate,
    playerPetri: state.player.petri,
    enemyHp: state.enemy ? state.enemy.hp : 0
  };
}

function showStatDiff(before, source) {
  const enemyDamage = state.enemy ? before.enemyHp - state.enemy.hp : 0;
  const playerDamage = before.playerHp - state.player.hp;
  const blockGain = state.player.block - before.playerBlock;
  const plateGain = state.player.plate - before.playerPlate;
  const petriDelta = state.player.petri - before.playerPetri;
  if (enemyDamage > 0) floatText("enemy", `-${enemyDamage}`, "hit");
  if (playerDamage > 0) floatText("player", `-${playerDamage}`, "hit");
  if (blockGain > 0) floatText("player", statDeltaText("ブロック", blockGain), "block");
  if (plateGain > 0) floatText("player", statDeltaText("プレート", plateGain), "block");
  if (petriDelta > 0) floatText("player", statDeltaText("石化", petriDelta), "petri");
  if (petriDelta < 0) floatText("player", statDeltaText("石化", petriDelta), "good");
  if (source === "enemy" && petriDelta > 0) floatText("enemy", t("石化の呪い"), "petri");
}

function showEnemyActionDiff(before, action) {
  const playerDamage = before.playerHp - state.player.hp;
  const petriDelta = state.player.petri - before.playerPetri;
  const enemyBlock = action.block || 0;
  if (playerDamage > 0) {
    window.setTimeout(() => floatText("player", `-${playerDamage}`, "hit"), 180);
  }
  if (petriDelta > 0) {
    window.setTimeout(() => floatText("player", statDeltaText("石化", petriDelta), "petri"), playerDamage > 0 ? 920 : 260);
  }
  if (enemyBlock > 0) {
    window.setTimeout(() => floatText("enemy", statDeltaText("ブロック", enemyBlock), "block"), 340);
  }
  if (action.addCard || action.addDiscardCard || action.brands || action.mutateCard) {
    window.setTimeout(() => floatText("player", t("次ターン妨害"), "curse"), 1180);
  }
  if (action.brittle) {
    window.setTimeout(() => floatText("player", t("被弾で石化"), "petri"), 1180);
  }
  if (action.blockPenalty) {
    window.setTimeout(() => floatText("player", t("次防御-{amount}", { amount: action.blockPenalty }), "curse"), 1180);
  }
}

const floatTextQueues = {
  enemy: 0,
  player: 0
};

function floatText(target, text, type = "good") {
  const actor = qs(target === "enemy" ? "enemyActor" : "playerActor");
  if (!actor) return;
  const now = performance.now();
  const queueKey = target === "enemy" ? "enemy" : "player";
  const delay = Math.max(0, floatTextQueues[queueKey] - now);
  floatTextQueues[queueKey] = now + delay + 420;
  window.setTimeout(() => {
    const node = document.createElement("div");
    const active = actor.querySelectorAll(".floating-text").length;
    const offsets = [
      [0, 0],
      [-46, 52],
      [46, -50],
      [-82, -8],
      [82, 42]
    ];
    const [x, y] = offsets[active % offsets.length];
    node.className = `floating-text ${type}`;
    node.textContent = text;
    node.style.setProperty("--float-x", `${x}px`);
    node.style.setProperty("--float-y", `${y}px`);
    actor.appendChild(node);
    window.setTimeout(() => node.remove(), 2800);
  }, delay);
}

function shakeEnemy() {
  const actor = qs("enemyActor");
  if (!actor) return;
  actor.classList.remove("hit-shake");
  void actor.offsetWidth;
  actor.classList.add("hit-shake");
  window.setTimeout(() => actor.classList.remove("hit-shake"), 320);
}

function intentText(action) {
  if (!action) return "";
  const bits = [localizeLabel(action)];
  if (action.attack) bits.push(`${action.attack}${t("攻撃")}`);
  if (action.petri) bits.push(`${t("石化")}${action.petri}`);
  if (action.block) bits.push(`${t("防御")}${action.block}`);
  if (action.addCard || action.addDiscardCard || action.brands || action.mutateCard) bits.push(t("妨害"));
  if (action.energyLoss) bits.push(`${t("次エナジー")}-${action.energyLoss}`);
  if (action.drawPenalty) bits.push(`${t("次ドロー")}-${action.drawPenalty}`);
  if (action.brittle) bits.push(t("被弾石化"));
  if (action.dex) bits.push(`${t("敏捷")}+${action.dex}`);
  if (action.selfStunOnFullBlock) bits.push(t("受け切るとスタン"));
  if (action.stunned) bits.push(t("スタン"));
  return `${t("予定")}: ${bits.join(" / ")}`;
}

function intentMarkup(action) {
  if (!action) return t("戦闘外");
  const extras = [];
  if (action.block) extras.push(`${t("ブロック")}${action.block}`);
  if (action.str) extras.push(`${t("筋力")}+${action.str}`);
  if (action.dex) extras.push(`${t("敏捷")}+${action.dex}`);
  if (action.addCard || action.addDiscardCard || action.brands || action.mutateCard) extras.push(t("妨害"));
  if (action.energyLoss) extras.push(`${t("次エナジー")}-${action.energyLoss}`);
  if (action.drawPenalty) extras.push(`${t("次ドロー")}-${action.drawPenalty}`);
  if (action.blockPenalty) extras.push(`${t("次防御")}-${action.blockPenalty}`);
  if (action.brittle) extras.push(t("被弾石化"));
  if (action.selfStunOnFullBlock) extras.push(t("完全防御でスタン"));
  if (action.stunned) extras.push(t("スタン"));
  return `
    <span class="intent-label">${t("予定")}: ${localizeLabel(action)}</span>
    <span class="intent-icons">
      ${action.attack ? `<span class="intent-chip attack"><img src="${statusIcons.attack}" alt="${t("攻撃")}"><b>${action.attack}</b></span>` : ""}
      ${action.petri ? `<span class="intent-chip petri"><img src="${statusIcons.petrify}" alt="${t("石化")}"><b>${action.petri}</b></span>` : ""}
      ${action.selfStunOnFullBlock ? `<span class="intent-chip stun"><img src="${statusIcons.stun}" alt="${t("完全防御でスタン")}"><b>!</b></span>` : ""}
      ${action.stunned ? `<span class="intent-chip stun"><img src="${statusIcons.stun}" alt="${t("スタン")}"><b>1</b></span>` : ""}
    </span>
    ${extras.length ? `<span class="intent-extra">${extras.join(" / ")}</span>` : ""}
  `;
}

function intentDescription(action) {
  if (!action) return "";
  const lines = [`${localizeLabel(action)}:`];
  if (action.attack) lines.push(t("プレイヤーに{amount}ダメージを与えます。ブロックで軽減できます。プレートはターン終了時、敵の行動前にブロックへ変換されます。", { amount: action.attack }));
  if (action.petri) lines.push(t("石化を{amount}進行させます。", { amount: action.petri }));
  if (action.block) lines.push(t("敵が{amount}ブロックを得ます。", { amount: action.block }));
  if (action.str) lines.push(t("敵の筋力が{amount}増えます。以後の攻撃ダメージが増加します。", { amount: action.str }));
  if (action.dex) lines.push(t("敵の敏捷が{amount}増えます。以後のブロック量が増加します。", { amount: action.dex }));
  if (action.mutateCard) lines.push(t("次のターン開始時、手札のカードをランダムに{count}枚「石化したカード」に変化させ、消費コストを1増やします。この変化は戦闘終了時に解除されます。", { count: action.mutateCard }));
  if (action.addCard) lines.push(t("次のターン開始時、手札に邪魔な石化カードを{count}枚追加します。", { count: action.addCardCount || 1 }));
  if (action.addDiscardCard) lines.push(t("捨て札に邪魔な石化カードを{count}枚追加します。", { count: action.addDiscardCardCount || 1 }));
  if (action.energyLoss) lines.push(t("次のターン開始時、エナジーが{amount}減ります。", { amount: action.energyLoss }));
  if (action.drawPenalty) lines.push(t("次のターン開始時、引くカードが{count}枚減ります。", { count: action.drawPenalty }));
  if (action.blockPenalty) lines.push(t("次にブロックを得る時、その値が{amount}減ります。", { amount: action.blockPenalty }));
  if (action.brands) lines.push(t("次のターン開始時、「石化の刻印」を{count}枚追加します。コスト1で廃棄できますが、手札に残るとターン終了時に石化が進みます。", { count: action.brands }));
  if (action.brittle) lines.push(t("{turns}ターンの間、ブロックしきれなかったダメージと同じ値だけ石化が進みます。", { turns: action.brittle }));
  if (action.selfStunOnFullBlock) lines.push(t("この攻撃をすべてブロックすると、敵は次のターンにスタンして行動できません。"));
  if (action.stunned) lines.push(t("敵は体勢を崩しており、このターン行動しません。"));
  return lines.join("\n");
}

function renderIntentDetails() {
  const enemyActor = qs("enemyActor");
  let panel = qs("intentDetails");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "intentDetails";
    panel.className = "intent-details hidden";
    enemyActor.appendChild(panel);
  }
  const description = state.petrified || state.runOver || !state.enemy
    ? ""
    : intentDescription(state.enemy.intent);
  const open = Boolean(state.intentDetailsOpen && description);
  panel.classList.toggle("hidden", !open);
  panel.textContent = description;
  const intent = qs("enemyIntent");
  intent.classList.toggle("open", open);
  intent.setAttribute("aria-expanded", open ? "true" : "false");
}

function getPlayerDebuffs() {
  const debuffs = [];
  const brittle = state.player.brittle || 0;
  if (brittle > 0) {
    debuffs.push({
      id: "brittle",
      name: t("被弾石化"),
      turns: brittle,
      icon: "assets/debuff_brittle_petrify.png",
      description: t("効果中にブロックしきれなかったダメージを受けるたび、同じ値だけ石化が進みます。敵の行動終了時に残りターンが1減少します。付与された直後の敵行動では減少しません。")
    });
  }
  for (const threshold of thresholds) {
    if (threshold.key === "full") continue;
    if (state.player.petri < threshold.value) continue;
    debuffs.push({
      id: `petri-${threshold.key}`,
      name: localizeName(threshold),
      turns: "",
      icon: threshold.icon,
      description: t(threshold.description)
    });
  }
  return debuffs;
}

function renderPlayerDebuffs() {
  const node = qs("playerDebuffs");
  const debuffs = getPlayerDebuffs();
  node.innerHTML = "";
  node.classList.toggle("hidden", debuffs.length === 0);
  for (const debuff of debuffs) {
    const item = document.createElement("div");
    item.className = "debuff-icon";
    item.tabIndex = 0;
    item.title = `${t(debuff.name)}\n${t(debuff.description)}`;
    item.dataset.tooltip = `${t(debuff.name)}: ${t(debuff.description)}`;
    item.innerHTML = `<img src="${debuff.icon}" alt="">${debuff.turns ? `<b>${debuff.turns}</b>` : ""}`;
    node.appendChild(item);
  }
}

function statusIconNode(status) {
  const item = document.createElement("div");
  item.className = `status-icon ${status.kind || "buff"}${status.value < 0 || status.kind === "debuff" ? " negative" : ""}`;
  item.tabIndex = 0;
  item.title = `${t(status.name)}\n${t(status.description)}`;
  item.dataset.tooltip = `${t(status.name)}: ${t(status.description)}`;
  item.innerHTML = `<img src="${status.icon}" alt=""><b>${status.value}</b>`;
  return item;
}

function actorBuffs(actor) {
  if (!actor) return [];
  const buffs = [];
  if (actor.str) {
    buffs.push({
      name: t("筋力"),
      value: actor.str,
      icon: statusIcons.str,
      description: t("攻撃カードと攻撃行動のダメージが{amount}されます。", { amount: `${actor.str >= 0 ? "+" : ""}${actor.str}` })
    });
  }
  if (actor.dex) {
    buffs.push({
      name: t("敏捷"),
      value: actor.dex,
      icon: statusIcons.dex,
      description: t("ブロックを得る効果が{amount}されます。", { amount: `${actor.dex >= 0 ? "+" : ""}${actor.dex}` })
    });
  }
  if (actor.plate > 0) {
    buffs.push({
      name: t("プレート"),
      value: actor.plate,
      icon: statusIcons.plate,
      description: t("ターン終了時、敵の行動前に{amount}ブロックを得ます。その後プレートは1減ります。", { amount: actor.plate })
    });
  }
  if (actor.crackRiposte > 0) {
    buffs.push({
      name: t("亀裂の返し"),
      value: actor.crackRiposte,
      icon: "assets/cards/card_crack_riposte.png",
      description: t("石化値が蓄積するたびにHPを{hp}失い、敵に合計{damage}ダメージを与えます。", { hp: actor.crackRiposte, damage: actor.crackRiposteDamage || 0 })
    });
  }
  if (actor.stoneSkinReaction > 0) {
    buffs.push({
      name: t("石肌の反応"),
      value: actor.stoneSkinReaction,
      icon: "assets/cards/card_statue_reservoir.png",
      description: t("石化値が蓄積するたびに合計{amount}ブロックを得ます。", { amount: actor.stoneSkinReactionBlock || 0 })
    });
  }
  if (actor.echoStoneSigil > 0) {
    buffs.push({
      name: t("残響の石紋"),
      value: actor.echoStoneSigil,
      icon: statusIcons.echo,
      description: t("石化のしきい値を超えた時、山札のランダムなカードをコスト0・エセリアルで手札にコピーします。")
    });
  }
  if (actor.exhaustBreath > 0) {
    buffs.push({
      name: t("残骸の呼吸"),
      value: actor.exhaustBreath,
      icon: "assets/cards/card_wreckage_breath.png",
      description: t("カードを廃棄するたびに石化を合計{amount}軽減します。", { amount: actor.exhaustBreathAmount || 0 })
    });
  }
  if (actor.stunned > 0) {
    buffs.push({
      name: t("体勢崩れ"),
      value: actor.stunned,
      kind: "debuff",
      icon: statusIcons.stun,
      description: t("次の行動がスタンになり、行動できません。")
    });
  }
  return buffs;
}

function renderActorBuffs(nodeId, actor) {
  const node = qs(nodeId);
  const buffs = actorBuffs(actor);
  node.innerHTML = "";
  node.classList.toggle("hidden", buffs.length === 0);
  for (const buff of buffs) node.appendChild(statusIconNode(buff));
}

function renderBlockBadge(nodeId, healthbarId, value) {
  const badge = qs(nodeId);
  const healthbar = qs(healthbarId);
  const hasBlock = value > 0;
  badge.classList.toggle("hidden", !hasBlock);
  healthbar.classList.toggle("blocked", hasBlock);
  badge.tabIndex = hasBlock ? 0 : -1;
  if (!hasBlock) {
    badge.innerHTML = "";
    return;
  }
  badge.title = `${t("ブロック")}\n${t("次に受けるダメージを{value}軽減します。", { value })}`;
  badge.dataset.tooltip = `${t("ブロック")}: ${t("次に受けるダメージを{value}軽減します。", { value })}`;
  badge.innerHTML = `<img src="${statusIcons.block}" alt=""><b>${value}</b>`;
}

function render() {
  if (!cardDragState) clearCardDragVisuals();
  refreshCombatCardCosts();
  const petriRatio = state.player.petri / 100;
  document.documentElement.style.setProperty("--stone-opacity", petriRatio);
  applyHeroFrame();
  localizeStaticDom();
  qs("floorText").textContent = t("深層 {floor}", { floor: state.floor });
  qs("hpText").textContent = `${state.player.hp}/${state.player.maxHp}`;
  qs("deckText").textContent = state.deck.length;
  qs("relicText").textContent = state.relics.length;
  qs("drawPileText").textContent = state.drawPile.length;
  qs("discardPileText").textContent = state.discard.length;
  qs("sceneHpText").textContent = `${state.player.hp}/${state.player.maxHp}`;
  qs("scenePetriText").innerHTML = `<span class="inline-petri"><img src="${statusIcons.petrify}" alt="">${state.player.petri}/100</span>`;
  qs("sceneDeckText").textContent = state.deck.length;
  qs("debugCardBtn").classList.toggle("hidden", !debugMapSelect);
  qs("energyText").textContent = `${state.energy}/${state.maxEnergy}`;
  qs("playerPetri").innerHTML = `
    <span><span class="petri-title"><img src="${statusIcons.petrify}" alt="">${t("石化")}</span><b>${state.player.petri}/100</b></span>
    <div class="petri-bar" style="--petri-width:${state.player.petri}%"><i></i></div>
  `;
  const drawBonusText = state.drawBonus > 0 ? ` / ${t("ドロー")}+${state.drawBonus}` : "";
  qs("statusLine").textContent = state.petrified
    ? t("完全に石化している。カードもターンも、もう身体には届かない。")
    : state.runOver
      ? t("ゲームオーバー。再挑戦するなら最初からを押してください。")
      : `${t("ターン {turn}", { turn: state.turn })}${drawBonusText}`;
  renderActorBuffs("playerBuffs", state.player);
  renderActorBuffs("enemyBuffs", state.enemy);
  renderPlayerDebuffs();
  qs("enemyIntent").innerHTML = state.petrified || state.runOver || !state.enemy ? t("戦闘外") : intentMarkup(state.enemy.intent);
  qs("enemyIntent").title = state.petrified || state.runOver || !state.enemy ? "" : intentDescription(state.enemy.intent);
  qs("enemyIntent").tabIndex = state.petrified || state.runOver || !state.enemy ? -1 : 0;
  qs("enemyIntent").setAttribute("role", "button");
  renderIntentDetails();
  qs("enemyActor").classList.toggle("defeated", Boolean(state.enemyDefeated || (state.enemy && state.enemy.hp <= 0)));
  qs("enemySprite").src = state.enemy?.image || "assets/enemy_petrifier_cutout.png";
  qs("enemyHpText").textContent = state.enemy ? `${state.enemy.hp}/${state.enemy.maxHp}` : "";
  qs("playerHpText").textContent = `${state.player.hp}/${state.player.maxHp}`;
  qs("playerHpBar").style.width = `${100 * state.player.hp / state.player.maxHp}%`;
  qs("enemyHpBar").style.width = state.enemy ? `${100 * state.enemy.hp / state.enemy.maxHp}%` : "0%";
  renderBlockBadge("playerBlockBadge", "playerHealthbar", state.player.block);
  renderBlockBadge("enemyBlockBadge", "enemyHealthbar", state.enemy?.block || 0);
  const handEl = qs("hand");
  if (!handEl.dataset.focusWired) {
    handEl.addEventListener("pointermove", (event) => {
      if (cardDragState) return;
      const node = handCardNearPoint(handEl, event.clientX, event.clientY);
      if (node) setFocusedHandCard(node);
      else clearFocusedHandCard();
    });
    handEl.addEventListener("pointerleave", (event) => {
      if (cardDragState) return;
      const node = handCardNearPoint(handEl, event.clientX, event.clientY);
      if (node) setFocusedHandCard(node);
      else clearFocusedHandCard();
    });
    handEl.dataset.focusWired = "1";
  }
  const previousHandLayout = pendingHandLayout || captureHandLayout(handEl);
  pendingHandLayout = null;
  clearFocusedHandCard();
  handEl.innerHTML = "";
  const handCount = state.hand.length;
  handEl.classList.toggle("has-cards", handCount > 0);
  const spreadStep = handCount > 1 ? Math.min(13, Math.max(6, 64 / (handCount - 1))) : 0;
  for (let index = 0; index < handCount; index++) {
    const card = state.hand[index];
    const node = cardNode(card, () => playCard(card.uid), { playContext: true });
    const center = index - (handCount - 1) / 2;
    const angle = center * spreadStep;
    const fanY = Math.abs(center) * 8;
    node.style.setProperty("--fan-rotate", `${angle}deg`);
    node.style.setProperty("--fan-y", `${fanY}px`);
    node.style.setProperty("--fan-x", `${center * 8}px`);
    node.style.setProperty("--fan-z", `${index + 1}`);
    node.addEventListener("focus", () => {
      setFocusedHandCard(node);
    });
    node.addEventListener("blur", () => {
      if (!node.classList.contains("drag-source")) clearFocusedHandCard(node);
    });
    handEl.appendChild(node);
    animateHandLayout(node, previousHandLayout);
    card.fx = "";
  }
  renderHandEvents();
  qs("log").innerHTML = state.logs.slice(-5).map((line) => `<div>${escapeHtml(line)}</div>`).join("");
  qs("endTurnBtn").disabled = state.petrified || state.runOver || state.turnResolving || state.cardResolving;
}

function renderHandEvents() {
  if (!state.handEvents?.length) return;
  const events = state.handEvents.splice(0);
  const toast = document.createElement("div");
  toast.className = `hand-change-toast ${events.some((event) => event.type === "mutated") ? "mutated" : "added"}`;
  toast.innerHTML = events.slice(-3).map((event) => `<span>${escapeHtml(event.text)}</span>`).join("");
  qs("hand").appendChild(toast);
}

function addLog(line, vars) {
  state.logs.push(t(line, vars));
}

function addStepLog(title, detail = "") {
  addLog("【{title}】{detail}", { title: t(title), detail: t(detail) });
}

function queuePlayerTurnStep(delayMs = 120, shouldLog = true) {
  window.clearTimeout(queuePlayerTurnStep.timer);
  queuePlayerTurnStep.timer = debugTimeout(() => {
    if (state.runOver || state.petrified || state.turnResolving || !state.enemy) return;
    showTurnStep("プレイヤーのターン", t("ターン {turn}", { turn: state.turn }), "good", 2400);
    if (shouldLog) addStepLog("プレイヤーのターン", t("ターン {turn}", { turn: state.turn }));
  }, delayMs);
}

function showTurnStep(title, detail = "", type = "neutral", duration = 1900) {
  const node = qs("turnStepBanner");
  if (!node) return;
  node.className = `turn-step-banner ${type}`;
  node.classList.toggle("compact", !detail);
  node.style.setProperty("--turn-step-duration", `${duration}ms`);
  node.innerHTML = `<strong>${escapeHtml(t(title))}</strong>${detail ? `<span>${escapeHtml(t(detail))}</span>` : ""}`;
  node.style.animation = "none";
  void node.offsetWidth;
  node.style.animation = "";
  window.clearTimeout(showTurnStep.timer);
  showTurnStep.timer = debugTimeout(() => {
    node.classList.add("hidden");
  }, duration);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function debugSnapshot() {
  return {
    floor: state.floor,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    petri: state.player.petri,
    phase: state.phase,
    noGameOver: debugNoGameOver,
    block: state.player.block,
    plate: state.player.plate,
    energy: state.energy,
    maxEnergy: state.maxEnergy,
    combatCount: state.combatCount,
    turn: state.turn,
    enemy: state.enemy ? {
      id: state.enemy.id,
      name: state.enemy.name,
      hp: state.enemy.hp,
      maxHp: state.enemy.maxHp,
      block: state.enemy.block,
      intent: state.enemy.intent?.label || null
    } : null,
    hand: state.hand.map((card) => ({
      uid: card.uid,
      id: card.id,
      name: card.name,
      cost: card.cost,
      type: card.type,
      kind: card.kind,
      text: card.text,
      playable: !card.unplayable && card.cost <= state.energy && !(state.attackLocked && card.kind === "攻撃")
    })),
    deck: state.deck.map((card) => card.id),
    rewardPicks: (state.rewardPicks || []).map((card) => ({ id: card.id, name: card.name, text: card.text })),
    routes: availableMapRoutes().map((route, index) => ({
      index,
      id: route.id,
      floor: route.floor,
      type: route.type,
      title: route.title,
      effect: route.effect,
      final: Boolean(route.final)
    })),
    runOver: state.runOver,
    petrified: state.petrified,
    noticeOpen: state.noticeOpen,
    logs: state.logs.slice(-20)
  };
}

function debugChooseRoute(index = 0) {
  const route = availableMapRoutes()[index];
  if (!route) return false;
  chooseRoute(route);
  return true;
}

function debugTakeReward(index = -1) {
  const picks = state.rewardPicks || [];
  if (index >= 0 && picks[index]) {
    state.deck.push(displayCardCopy(picks[index]));
  }
  state.rewardPicks = [];
  qs("rewardModal").classList.add("hidden");
  showMapPhase();
  return true;
}

function debugRest() {
  if (!state.currentRoute || state.currentRoute.type !== "rest") return false;
  restAtCamp();
  return true;
}

function debugForge(index = 0) {
  if (!state.currentRoute || state.currentRoute.type !== "rest") return false;
  const candidates = state.deck.filter((card) => !card.upgraded && !card.unplayable);
  if (!candidates[index]) return false;
  upgradeCard(candidates[index]);
  addLog(`デバッグ鍛冶: ${candidates[index].name}`);
  qs("rewardModal").classList.add("hidden");
  advanceAfterMapNode();
  return true;
}

  function debugChooseEvent(index = 0) {
    if (state.phase === "openingEvent") {
      const choice = state.openingEventChoices?.[index];
      if (!choice) return false;
      const before = snapshotStats();
      const result = choice.apply();
      showStatDiff(before, "player");
      addLog(`デバッグ開始イベント: ${choice.label} / ${result}`);
      if (choice.requiresOpeningUpgradeSelection) {
        const target = state.deck.find((card) => !card.upgraded && !card.unplayable);
        if (target) upgradeCard(target);
      } else if (choice.requiresOpeningTransformSelection) {
        const target = state.deck[0];
        if (target) transformCard(target, shuffle(randomTransformCardIds.filter((id) => id !== target.id))[0]);
      }
      state.openingEventChoices = [];
      qs("rewardModal").classList.add("hidden");
      showMapPhase();
      return true;
    }
    const event = state.currentEvent;
    const choices = event?.choices?.filter((choice) => !choice.disabled?.() && !choice.requiresTransformSelection) || [];
    const choice = choices[index];
  if (!event || !choice) return false;
  const before = snapshotStats();
  const result = choice.apply();
  showStatDiff(before, "player");
  addLog(`デバッグイベント: ${event.title} / ${choice.label} / ${result}`);
  qs("rewardModal").classList.add("hidden");
  advanceAfterMapNode();
  return true;
}

  function debugContinueMap() {
    if (state.phase === "openingResult") {
      state.openingEventChoices = [];
      qs("rewardModal").classList.add("hidden");
      document.querySelector("#rewardModal .modal").classList.remove("event-modal");
      showMapPhase();
      return true;
    }
    if (!["mapResult", "eventResult"].includes(state.phase)) return false;
    qs("rewardModal").classList.add("hidden");
  document.querySelector("#rewardModal .modal").classList.remove("event-modal");
  advanceAfterMapNode();
  return true;
}

function installDebugApi() {
  if (typeof window === "undefined") return;
  window.__stoneGame = {
    get state() { return state; },
    get library() { return library; },
    get fastMode() { return debugFastMode; },
    get autoChoices() { return debugAutoChoices; },
    snapshot: debugSnapshot,
    newGame,
    routes: () => debugSnapshot().routes,
    chooseRoute: debugChooseRoute,
    playCard,
    endTurn,
    takeReward: debugTakeReward,
    rest: debugRest,
    forge: debugForge,
    chooseEvent: debugChooseEvent,
    continueMap: debugContinueMap,
    dismissNotice: () => {
      state.noticeOpen = false;
      state.notices = [];
      qs("noticeModal").classList.add("hidden");
      return true;
    }
  };
}

qs("endTurnBtn").addEventListener("click", endTurn);
qs("restartBtn").addEventListener("click", requestNewGame);
qs("noticeNextBtn").addEventListener("click", showNextNotice);
qs("deckBtn").addEventListener("click", () => showPile("deck"));
qs("drawPileBtn").addEventListener("click", () => showPile("draw"));
qs("discardPileBtn").addEventListener("click", () => showPile("discard"));
qs("sceneDeckBtn").addEventListener("click", () => showPile("deck"));
qs("debugCardBtn").addEventListener("click", showDebugCardLibrary);
qs("sceneRestartBtn").addEventListener("click", requestNewGame);
qs("pileCloseBtn").addEventListener("click", () => qs("pileModal").classList.add("hidden"));
qs("enemyIntent").addEventListener("click", () => {
  if (state.petrified || state.runOver || !state.enemy) return;
  state.intentDetailsOpen = !state.intentDetailsOpen;
  render();
});
qs("enemyIntent").addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  qs("enemyIntent").click();
});
document.addEventListener("contextmenu", cancelCardDragFromInterrupt);
document.addEventListener("pointerdown", (event) => {
  if (cardDragState && event.button !== 0) cancelCardDragFromInterrupt(event);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") cancelCardDragFromInterrupt(event);
});
window.addEventListener("blur", cancelCardDragFromInterrupt);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelCardDragFromInterrupt();
});

installDebugApi();
async function bootGame() {
  setupLanguageSelect();
  localizeStaticDom();
  await preloadCriticalImages();
  requestAnimationFrame(tickHeroAnimation);
  newGame();
  finishBootLoading();
}

bootGame();
