import type {
  EnemyPlacement,
  ItemPlacement,
  PlatformRunPlacement,
  StageDecorationPlacement,
  StageDefinition,
  StreetLampPlacement,
} from "./assets";

export const ORIGINAL_DOWNTOWN_STAGE: StageDefinition = {
  "name": {
    "jp": "シブヤシティ",
    "en": "Shibu-ya city",
    "zh": "涩谷城",
    "ko": "시부야 시티"
  },
  "backgrounds": {
    "rearKey": "rear-starry-sky",
    "midgroundKey": "midground-city-loop-strip"
  },
  "storyDialogue": {
    "triggerX": 600,
    "lines": [
      {
        "characterName": {
          "ja": "残念院さん",
          "en": "Zannenin",
          "zh": "残念院小姐",
          "ko": "잔넨인 씨"
        },
        "message": {
          "ja": "人が多いですね……ここが渋谷。",
          "en": "So many people... this must be Shibuya.",
          "zh": "人好多...这里一定是涩谷。",
          "ko": "사람이 많네요... 여기가 시부야인가 봐요."
        },
        "portraitPath": "assets/ui/message_faces/message_face_head_icon_05_shy.webp"
      },
      {
        "characterName": {
          "ja": "残念院さん",
          "en": "Zannenin",
          "zh": "残念院小姐",
          "ko": "잔넨인 씨"
        },
        "message": {
          "ja": "先へ進みましょう。何か手がかりが見つかるはずです。",
          "en": "Let's keep moving. We should be able to find a clue ahead.",
          "zh": "继续往前走吧。前面应该能找到线索。",
          "ko": "계속 앞으로 가요. 앞쪽에서 단서를 찾을 수 있을 거예요."
        },
        "portraitPath": "assets/ui/message_faces/message_face_head_icon_02_smile.webp"
      }
    ]
  },
  "worldWidth": 12800,
  "worldTop": -720,
  "worldBottom": 720,
  "groundTopY": 672,
  "playerStart": {
    "x": 120,
    "y": 552
  },
  "goal": {
    "x": 12576,
    "y": 576
  },
  "platforms": [
    {
      "x": 1920,
      "y": 672,
      "units": 8
    },
    {
      "x": 2688,
      "y": 672,
      "units": 12
    },
    {
      "x": 3648,
      "y": 672,
      "units": 9
    },
    {
      "x": 4480,
      "y": 672,
      "units": 17
    },
    {
      "x": 5888,
      "y": 672,
      "units": 10
    },
    {
      "x": 6656,
      "y": 672,
      "units": 8
    },
    {
      "x": 7488,
      "y": 672,
      "units": 9
    },
    {
      "x": 8320,
      "y": 672,
      "units": 11
    },
    {
      "x": 9280,
      "y": 672,
      "units": 13
    },
    {
      "x": 10432,
      "y": 672,
      "units": 10
    },
    {
      "x": 11584,
      "y": 672,
      "units": 19
    },
    {
      "x": 1100,
      "y": 452,
      "units": 3
    },
    {
      "x": 1430,
      "y": 388,
      "units": 4
    },
    {
      "x": 1880,
      "y": 548,
      "units": 6
    },
    {
      "x": 2320,
      "y": 472,
      "units": 3
    },
    {
      "x": 2620,
      "y": 392,
      "units": 5
    },
    {
      "x": 3120,
      "y": 304,
      "units": 4
    },
    {
      "x": 3580,
      "y": 548,
      "units": 8
    },
    {
      "x": 4300,
      "y": 480,
      "units": 4
    },
    {
      "x": 4700,
      "y": 404,
      "units": 3
    },
    {
      "x": 5020,
      "y": 328,
      "units": 3
    },
    {
      "x": 5380,
      "y": 252,
      "units": 4
    },
    {
      "x": 5900,
      "y": 548,
      "units": 7
    },
    {
      "x": 6480,
      "y": 456,
      "units": 5
    },
    {
      "x": 7040,
      "y": 356,
      "units": 4
    },
    {
      "x": 7480,
      "y": 548,
      "units": 5
    },
    {
      "x": 7960,
      "y": 484,
      "units": 3
    },
    {
      "x": 8320,
      "y": 420,
      "units": 3
    },
    {
      "x": 8700,
      "y": 356,
      "units": 4
    },
    {
      "x": 9240,
      "y": 548,
      "units": 8
    },
    {
      "x": 10080,
      "y": 448,
      "units": 4
    },
    {
      "x": 10480,
      "y": 388,
      "units": 3
    },
    {
      "x": 10880,
      "y": 292,
      "units": 5
    },
    {
      "x": 11580,
      "y": 548,
      "units": 10
    },
    {
      "x": 448,
      "y": 544,
      "units": 2
    },
    {
      "x": 11264,
      "y": 480,
      "units": 3
    },
    {
      "x": 0,
      "y": 672,
      "units": 6
    },
    {
      "x": 608,
      "y": 672,
      "units": 12
    },
    {
      "x": 1504,
      "y": 672,
      "units": 4
    }
  ],
  "streetLamps": [
    {
      "x": 260,
      "key": "street-lamp-single",
      "scale": 0.68
    },
    {
      "x": 980,
      "key": "street-lamp-double",
      "scale": 0.66
    },
    {
      "x": 1760,
      "key": "street-lamp-single",
      "scale": 0.66
    },
    {
      "x": 3232,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 3740,
      "key": "street-lamp-single",
      "scale": 0.68
    },
    {
      "x": 5408,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 6060,
      "key": "street-lamp-single",
      "scale": 0.66
    },
    {
      "x": 7136,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 8672,
      "key": "street-lamp-single",
      "scale": 0.68
    },
    {
      "x": 9440,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 10880,
      "key": "street-lamp-single",
      "scale": 0.66
    },
    {
      "x": 12100,
      "key": "street-lamp-double",
      "scale": 0.66
    }
  ],
  "decorations": [
    {
      "x": 900,
      "y": 672,
      "key": "stage-structures-bus-shelter",
      "scale": 0.72
    },
    {
      "x": 1280,
      "y": 672,
      "key": "stage-props-planter-box",
      "scale": 0.62
    },
    {
      "x": 1632,
      "y": 672,
      "key": "stage-props-sidewalk-sign",
      "scale": 0.58
    },
    {
      "x": 2912,
      "y": 672,
      "key": "stage-props-vending-machine",
      "scale": 0.78
    },
    {
      "x": 4768,
      "y": 672,
      "key": "stage-structures-phone-booth",
      "scale": 0.76
    },
    {
      "x": 5312,
      "y": 672,
      "key": "stage-structures-vending-kiosk",
      "scale": 0.76
    },
    {
      "x": 5152,
      "y": 672,
      "key": "stage-props-utility-box",
      "scale": 0.56
    },
    {
      "x": 6816,
      "y": 672,
      "key": "stage-structures-chainlink-fence",
      "scale": 0.64
    },
    {
      "x": 7936,
      "y": 672,
      "key": "stage-props-park-bench",
      "scale": 0.68
    },
    {
      "x": 8512,
      "y": 672,
      "key": "stage-props-bus-stop-sign",
      "scale": 0.62
    },
    {
      "x": 8832,
      "y": 672,
      "key": "stage-structures-station-entrance",
      "scale": 0.62
    },
    {
      "x": 8480,
      "y": 420,
      "key": "stage-props-planter-box",
      "scale": 0.58
    },
    {
      "x": 9000,
      "y": 672,
      "key": "stage-props-traffic-cone",
      "scale": 0.56
    },
    {
      "x": 9888,
      "y": 672,
      "key": "stage-structures-street-kiosk",
      "scale": 0.64
    },
    {
      "x": 10560,
      "y": 672,
      "key": "stage-props-guard-rail",
      "scale": 0.72
    },
    {
      "x": 11712,
      "y": 672,
      "key": "stage-props-roadwork-sign",
      "scale": 0.52
    },
    {
      "x": 11008,
      "y": 672,
      "key": "stage-structures-concrete-pillar",
      "scale": 0.58
    },
    {
      "x": 11840,
      "y": 576,
      "key": "stage-structures-station-wall-railing",
      "scale": 0.68
    },
    {
      "x": 12320,
      "y": 672,
      "key": "stage-structures-shutter-storefront",
      "scale": 0.64
    }
  ],
  "items": [
    {
      "type": "energyDrink",
      "x": 480,
      "y": 480
    },
    {
      "type": "bubbleTea",
      "x": 864,
      "y": 352
    },
    {
      "type": "shoppingBag",
      "x": 1230,
      "y": 396
    },
    {
      "type": "energyDrink",
      "x": 1580,
      "y": 332
    },
    {
      "type": "bubbleTea",
      "x": 2140,
      "y": 492
    },
    {
      "type": "shoppingBag",
      "x": 2460,
      "y": 416
    },
    {
      "type": "energyDrink",
      "x": 2860,
      "y": 336
    },
    {
      "type": "bubbleTea",
      "x": 3260,
      "y": 248
    },
    {
      "type": "shoppingBag",
      "x": 3860,
      "y": 492
    },
    {
      "type": "energyDrink",
      "x": 4480,
      "y": 424
    },
    {
      "type": "bubbleTea",
      "x": 4840,
      "y": 348
    },
    {
      "type": "shoppingBag",
      "x": 5160,
      "y": 272
    },
    {
      "type": "energyDrink",
      "x": 5580,
      "y": 196
    },
    {
      "type": "bubbleTea",
      "x": 6120,
      "y": 492
    },
    {
      "type": "shoppingBag",
      "x": 6680,
      "y": 400
    },
    {
      "type": "energyDrink",
      "x": 7180,
      "y": 300
    },
    {
      "type": "bubbleTea",
      "x": 7640,
      "y": 492
    },
    {
      "type": "shoppingBag",
      "x": 8080,
      "y": 428
    },
    {
      "type": "energyDrink",
      "x": 8420,
      "y": 364
    },
    {
      "type": "bubbleTea",
      "x": 8860,
      "y": 300
    },
    {
      "type": "shoppingBag",
      "x": 9460,
      "y": 492
    },
    {
      "type": "energyDrink",
      "x": 10180,
      "y": 412
    },
    {
      "type": "bubbleTea",
      "x": 10600,
      "y": 332
    },
    {
      "type": "shoppingBag",
      "x": 11020,
      "y": 236
    },
    {
      "type": "energyDrink",
      "x": 11720,
      "y": 492
    },
    {
      "type": "bubbleTea",
      "x": 12240,
      "y": 492
    }
  ],
  "bonusBlocks": [],
  "checkpoints": [],
  "oneWayGates": [],
  "enemies": [
    {
      "type": "knifePunk",
      "x": 544,
      "y": 512,
      "patrolLeft": 384,
      "patrolRight": 684,
      "speed": 72
    },
    {
      "type": "aquaMascot",
      "x": 2080,
      "y": 456,
      "patrolLeft": 1920,
      "patrolRight": 2240,
      "speed": 84
    },
    {
      "type": "aquaMascot",
      "x": 6160,
      "y": 420,
      "patrolLeft": 5960,
      "patrolRight": 6400,
      "speed": 96
    },
    {
      "type": "aquaMascot",
      "x": 9500,
      "y": 392,
      "patrolLeft": 9280,
      "patrolRight": 9840,
      "speed": 108
    },
    {
      "x": 11880,
      "y": 360,
      "patrolLeft": 11620,
      "patrolRight": 12260,
      "speed": 116
    }
  ]
};

export const NEO_SHIBUYA_STAGE: StageDefinition = {
  "name": {
    "jp": "作成中ネオシブヤシティ",
    "en": "WIP Neo Shibuya City",
    "zh": "开发中 新涩谷城",
    "ko": "제작 중 네오 시부야 시티"
  },
  "backgrounds": {
    "rearKey": "rear-starry-sky",
    "midgroundKey": "midground-city-loop-strip"
  },
  "storyDialogue": {
    "triggerX": 600,
    "lines": [
      {
        "characterName": {
          "ja": "残念院さん",
          "en": "Zannenin",
          "zh": "残念院小姐",
          "ko": "잔넨인 씨"
        },
        "message": {
          "ja": "見覚えのある街なのに、少し様子が違いますね。",
          "en": "This city feels familiar, but something is different.",
          "zh": "这座城市很熟悉，但样子有点不一样。",
          "ko": "익숙한 거리인데, 분위기가 조금 다르네요."
        },
        "portraitPath": "assets/ui/message_faces/message_face_head_icon_05_shy.webp"
      },
      {
        "characterName": {
          "ja": "残念院さん",
          "en": "Zannenin",
          "zh": "残念院小姐",
          "ko": "잔넨인 씨"
        },
        "message": {
          "ja": "新しい仕掛けに注意しながら、奥まで進みましょう。",
          "en": "Watch the new tricks and keep pressing deeper in.",
          "zh": "小心新的机关，继续往深处前进吧。",
          "ko": "새로운 장치를 조심하면서 안쪽까지 나아가요."
        },
        "portraitPath": "assets/ui/message_faces/message_face_head_icon_02_smile.webp"
      }
    ]
  },
  "worldWidth": 12800,
  "worldTop": -720,
  "worldBottom": 720,
  "groundTopY": 672,
  "playerStart": {
    "x": 120,
    "y": 552
  },
  "goal": {
    "x": 12580,
    "y": 568
  },
  "platforms": [
    {
      "x": 0,
      "y": 672,
      "units": 11
    },
    {
      "x": 896,
      "y": 672,
      "units": 12
    },
    {
      "x": 1920,
      "y": 672,
      "units": 8
    },
    {
      "x": 2688,
      "y": 672,
      "units": 12
    },
    {
      "x": 3648,
      "y": 672,
      "units": 9
    },
    {
      "x": 4480,
      "y": 672,
      "units": 17
    },
    {
      "x": 5888,
      "y": 672,
      "units": 10
    },
    {
      "x": 6656,
      "y": 672,
      "units": 8
    },
    {
      "x": 7488,
      "y": 672,
      "units": 9
    },
    {
      "x": 8320,
      "y": 672,
      "units": 11
    },
    {
      "x": 9280,
      "y": 672,
      "units": 13
    },
    {
      "x": 10432,
      "y": 672,
      "units": 10
    },
    {
      "x": 11584,
      "y": 672,
      "units": 19
    },
    {
      "x": 1100,
      "y": 452,
      "units": 3
    },
    {
      "x": 1430,
      "y": 388,
      "units": 4,
      "spring": {
        "velocity": -860
      }
    },
    {
      "x": 1880,
      "y": 548,
      "units": 6
    },
    {
      "x": 2320,
      "y": 472,
      "units": 3
    },
    {
      "x": 2620,
      "y": 392,
      "units": 5
    },
    {
      "x": 3120,
      "y": 304,
      "units": 4
    },
    {
      "x": 3580,
      "y": 548,
      "units": 8
    },
    {
      "x": 4300,
      "y": 480,
      "units": 4
    },
    {
      "x": 4700,
      "y": 404,
      "units": 3,
      "fragile": {
        "delayMs": 420,
        "respawnMs": 3000
      }
    },
    {
      "x": 5020,
      "y": 328,
      "units": 3
    },
    {
      "x": 5380,
      "y": 252,
      "units": 4
    },
    {
      "x": 5900,
      "y": 548,
      "units": 7
    },
    {
      "x": 6480,
      "y": 456,
      "units": 5
    },
    {
      "x": 7040,
      "y": 356,
      "units": 4
    },
    {
      "x": 7480,
      "y": 548,
      "units": 5
    },
    {
      "x": 7960,
      "y": 484,
      "units": 3
    },
    {
      "x": 8320,
      "y": 420,
      "units": 3
    },
    {
      "x": 8700,
      "y": 356,
      "units": 4
    },
    {
      "x": 9240,
      "y": 548,
      "units": 8
    },
    {
      "x": 10080,
      "y": 448,
      "units": 4
    },
    {
      "x": 10480,
      "y": 388,
      "units": 3
    },
    {
      "x": 10880,
      "y": 292,
      "units": 5
    },
    {
      "x": 11580,
      "y": 548,
      "units": 10
    },
    {
      "x": 448,
      "y": 544,
      "units": 2
    }
  ],
  "streetLamps": [
    {
      "x": 260,
      "key": "street-lamp-single",
      "scale": 0.68
    },
    {
      "x": 980,
      "key": "street-lamp-double",
      "scale": 0.66
    },
    {
      "x": 1760,
      "key": "street-lamp-single",
      "scale": 0.66
    },
    {
      "x": 3232,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 3740,
      "key": "street-lamp-single",
      "scale": 0.68
    },
    {
      "x": 5152,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 6060,
      "key": "street-lamp-single",
      "scale": 0.66
    },
    {
      "x": 7180,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 8200,
      "key": "street-lamp-single",
      "scale": 0.68
    },
    {
      "x": 9440,
      "key": "street-lamp-double",
      "scale": 0.64
    },
    {
      "x": 10880,
      "key": "street-lamp-single",
      "scale": 0.66
    },
    {
      "x": 12100,
      "key": "street-lamp-double",
      "scale": 0.66
    }
  ],
  "decorations": [
    {
      "x": 900,
      "y": 672,
      "key": "stage-structures-bus-shelter",
      "scale": 0.72
    },
    {
      "x": 1440,
      "y": 672,
      "key": "stage-props-planter-box",
      "scale": 0.62
    },
    {
      "x": 1632,
      "y": 672,
      "key": "stage-props-sidewalk-sign",
      "scale": 0.58
    },
    {
      "x": 2912,
      "y": 672,
      "key": "stage-props-vending-machine",
      "scale": 0.78
    },
    {
      "x": 4224,
      "y": 672,
      "key": "stage-structures-phone-booth",
      "scale": 0.76
    },
    {
      "x": 5536,
      "y": 672,
      "key": "stage-structures-vending-kiosk",
      "scale": 0.76
    },
    {
      "x": 5760,
      "y": 672,
      "key": "stage-props-utility-box",
      "scale": 0.56
    },
    {
      "x": 6624,
      "y": 672,
      "key": "stage-structures-chainlink-fence",
      "scale": 0.64
    },
    {
      "x": 7328,
      "y": 672,
      "key": "stage-props-park-bench",
      "scale": 0.68
    },
    {
      "x": 8320,
      "y": 672,
      "key": "stage-props-bus-stop-sign",
      "scale": 0.62
    },
    {
      "x": 8832,
      "y": 672,
      "key": "stage-structures-station-entrance",
      "scale": 0.62
    },
    {
      "x": 8480,
      "y": 420,
      "key": "stage-props-planter-box",
      "scale": 0.58
    },
    {
      "x": 9000,
      "y": 672,
      "key": "stage-props-traffic-cone",
      "scale": 0.56
    },
    {
      "x": 9888,
      "y": 672,
      "key": "stage-structures-street-kiosk",
      "scale": 0.64
    },
    {
      "x": 10560,
      "y": 672,
      "key": "stage-props-guard-rail",
      "scale": 0.72
    },
    {
      "x": 11168,
      "y": 672,
      "key": "stage-props-roadwork-sign",
      "scale": 0.52
    },
    {
      "x": 11392,
      "y": 672,
      "key": "stage-structures-concrete-pillar",
      "scale": 0.58
    },
    {
      "x": 11840,
      "y": 576,
      "key": "stage-structures-station-wall-railing",
      "scale": 0.68
    },
    {
      "x": 12320,
      "y": 672,
      "key": "stage-structures-shutter-storefront",
      "scale": 0.64
    }
  ],
  "items": [
    {
      "type": "energyDrink",
      "x": 480,
      "y": 480
    },
    {
      "type": "coin",
      "x": 1180,
      "y": 396
    },
    {
      "type": "coin",
      "x": 1240,
      "y": 372
    },
    {
      "type": "coin",
      "x": 1300,
      "y": 396
    },
    {
      "type": "coin",
      "x": 4760,
      "y": 340
    },
    {
      "type": "coin",
      "x": 4820,
      "y": 320
    },
    {
      "type": "coin",
      "x": 5700,
      "y": 108
    },
    {
      "type": "coin",
      "x": 5980,
      "y": 52
    },
    {
      "type": "dashRing",
      "x": 6380,
      "y": 124
    },
    {
      "type": "bubbleTea",
      "x": 864,
      "y": 352
    },
    {
      "type": "shoppingBag",
      "x": 1230,
      "y": 396
    },
    {
      "type": "energyDrink",
      "x": 1580,
      "y": 332
    },
    {
      "type": "bubbleTea",
      "x": 2140,
      "y": 492
    },
    {
      "type": "shoppingBag",
      "x": 2460,
      "y": 416
    },
    {
      "type": "energyDrink",
      "x": 2860,
      "y": 336
    },
    {
      "type": "bubbleTea",
      "x": 3260,
      "y": 248
    },
    {
      "type": "shoppingBag",
      "x": 3860,
      "y": 492
    },
    {
      "type": "energyDrink",
      "x": 4480,
      "y": 424
    },
    {
      "type": "bubbleTea",
      "x": 4840,
      "y": 348
    },
    {
      "type": "shoppingBag",
      "x": 5160,
      "y": 272
    },
    {
      "type": "energyDrink",
      "x": 5580,
      "y": 196
    },
    {
      "type": "bubbleTea",
      "x": 6120,
      "y": 492
    },
    {
      "type": "shoppingBag",
      "x": 6680,
      "y": 400
    },
    {
      "type": "energyDrink",
      "x": 7180,
      "y": 300
    },
    {
      "type": "bubbleTea",
      "x": 7640,
      "y": 492
    },
    {
      "type": "shoppingBag",
      "x": 8080,
      "y": 428
    },
    {
      "type": "energyDrink",
      "x": 8420,
      "y": 364
    },
    {
      "type": "bubbleTea",
      "x": 8860,
      "y": 300
    },
    {
      "type": "shoppingBag",
      "x": 9460,
      "y": 492
    },
    {
      "type": "energyDrink",
      "x": 10180,
      "y": 412
    },
    {
      "type": "bubbleTea",
      "x": 10600,
      "y": 332
    },
    {
      "type": "shoppingBag",
      "x": 11020,
      "y": 236
    },
    {
      "type": "energyDrink",
      "x": 11720,
      "y": 492
    },
    {
      "type": "bubbleTea",
      "x": 12240,
      "y": 492
    }
  ],
  "bonusBlocks": [
    {
      "type": "question",
      "x": 1740,
      "y": 484,
      "reward": "powerJump"
    },
    {
      "type": "hidden",
      "x": 5280,
      "y": 448,
      "reward": "star"
    },
    {
      "type": "hidden",
      "x": 5740,
      "y": 428,
      "reward": "dashRing"
    },
    {
      "type": "question",
      "x": 8200,
      "y": 496,
      "reward": "powerSpeed"
    },
    {
      "type": "breakable",
      "x": 8580,
      "y": 472
    },
    {
      "type": "breakable",
      "x": 8644,
      "y": 472
    }
  ],
  "checkpoints": [
    {
      "x": 4620,
      "y": 606
    },
    {
      "x": 9140,
      "y": 606
    }
  ],
  "oneWayGates": [
    {
      "x": 9040,
      "y": 592,
      "height": 168
    }
  ],
  "enemies": [
    {
      "type": "knifePunk",
      "x": 544,
      "y": 512,
      "patrolLeft": 384,
      "patrolRight": 684,
      "speed": 72
    },
    {
      "type": "aquaMascot",
      "x": 2080,
      "y": 456,
      "patrolLeft": 1920,
      "patrolRight": 2240,
      "speed": 84
    },
    {
      "type": "aquaMascot",
      "x": 6160,
      "y": 420,
      "patrolLeft": 5960,
      "patrolRight": 6400,
      "speed": 96
    },
    {
      "type": "heartCannonTurret",
      "x": 5480,
      "y": 190,
      "patrolLeft": 5480,
      "patrolRight": 5480,
      "speed": 0
    },
    {
      "type": "neonIdolShooter",
      "x": 7040,
      "y": 292,
      "patrolLeft": 7040,
      "patrolRight": 7040,
      "speed": 0
    },
    {
      "type": "aquaMascot",
      "x": 9500,
      "y": 392,
      "patrolLeft": 9280,
      "patrolRight": 9840,
      "speed": 108
    },
    {
      "type": "heartCannonTurret",
      "x": 10180,
      "y": 386,
      "patrolLeft": 10180,
      "patrolRight": 10180,
      "speed": 0
    },
    {
      "x": 11880,
      "y": 360,
      "patrolLeft": 11620,
      "patrolRight": 12260,
      "speed": 116
    }
  ]
};

export const NEON_CANAL_STAGE: StageDefinition = ORIGINAL_DOWNTOWN_STAGE;

export const SKYBRIDGE_SPRINT_STAGE: StageDefinition = {
  name: {
    jp: "作成中 スカイブリッジ・スプリント",
    en: "WIP Skybridge Sprint",
    zh: "开发中 空桥冲刺",
    ko: "제작 중 스카이브리지 스프린트",
  },
  backgrounds: {
    rearKey: "rear-620c2900-ce9f-46e9-974e-b40916d5aa0c",
    midgroundKey: "midground-photoroom-20260504-035157",
    midgroundAlpha: 0.72,
  },
  storyDialogue: {
    triggerX: 520,
    lines: [
      {
        characterName: {
          ja: "残念院さん",
          en: "Zannenin",
          zh: "残念院小姐",
          ko: "잔넨인 씨",
        },
        message: {
          ja: "足場の間が広いですね。勢いを落とさずに渡りましょう。",
          en: "These gaps are wide. Keep your speed and cross cleanly.",
          zh: "这些落差很宽。保持速度，一口气越过去吧。",
          ko: "발판 사이가 넓네요. 속도를 유지해서 깔끔하게 건너요.",
        },
        portraitPath: "assets/ui/message_faces/message_face_head_icon_02_smile.webp",
      },
      {
        characterName: {
          ja: "残念院さん",
          en: "Zannenin",
          zh: "残念院小姐",
          ko: "잔넨인 씨",
        },
        message: {
          ja: "高い場所ほど焦りは禁物です。着地点を見て進みます。",
          en: "The higher we go, the calmer we move. Watch the landing first.",
          zh: "越到高处越不能慌。先看好落点再前进。",
          ko: "높은 곳일수록 침착해야 해요. 착지 지점을 보고 나아가요.",
        },
        portraitPath: "assets/ui/message_faces/message_face_head_icon_05_shy.webp",
      },
    ],
  },
  worldWidth: 9200,
  worldTop: -760,
  worldBottom: 720,
  groundTopY: 672,
  playerStart: {
    x: 128,
    y: 552,
  },
  goal: {
    x: 8970,
    y: 568,
  },
  platforms: [
    { x: 0, y: 672, units: 8 },
    { x: 760, y: 672, units: 7 },
    { x: 1500, y: 672, units: 5 },
    { x: 2140, y: 672, units: 8 },
    { x: 3200, y: 672, units: 6 },
    { x: 4000, y: 672, units: 5 },
    { x: 4700, y: 672, units: 9 },
    { x: 6020, y: 672, units: 7 },
    { x: 6960, y: 672, units: 6 },
    { x: 7800, y: 672, units: 22 },
    { x: 420, y: 524, units: 3 },
    { x: 900, y: 430, units: 3 },
    { x: 1080, y: 560, units: 1, spring: { velocity: -860 } },
    { x: 1260, y: 348, units: 4, moving: { axis: "y", distance: 128, speed: 64 } },
    { x: 1840, y: 520, units: 4 },
    { x: 2360, y: 430, units: 3 },
    { x: 2740, y: 336, units: 4 },
    { x: 3420, y: 520, units: 4 },
    { x: 3730, y: 486, units: 2, fragile: { delayMs: 380, respawnMs: 2800 } },
    { x: 3880, y: 424, units: 3 },
    { x: 4300, y: 328, units: 4 },
    { x: 5180, y: 516, units: 5 },
    { x: 5200, y: 272, units: 3 },
    { x: 5620, y: 210, units: 3 },
    { x: 6060, y: 252, units: 4 },
    { x: 6520, y: 300, units: 3 },
    { x: 5750, y: 420, units: 4, moving: { axis: "x", distance: 288, speed: 88 } },
    { x: 6320, y: 332, units: 4 },
    { x: 7040, y: 520, units: 4 },
    { x: 7480, y: 428, units: 3 },
    { x: 7920, y: 340, units: 5 },
    { x: 8520, y: 548, units: 7 },
  ],
  streetLamps: [
    { x: 260, key: "street-lamp-single", scale: 0.66 },
    { x: 1120, key: "street-lamp-double", scale: 0.62 },
    { x: 2480, key: "street-lamp-single", scale: 0.64 },
    { x: 4760, key: "street-lamp-double", scale: 0.62 },
    { x: 6320, key: "street-lamp-single", scale: 0.64 },
    { x: 8120, key: "street-lamp-double", scale: 0.64 },
  ],
  decorations: [
    { x: 780, y: 672, key: "stage-structures-chainlink-fence", scale: 0.62 },
    { x: 1120, y: 430, key: "stage-props-planter-box", scale: 0.56 },
    { x: 1640, y: 672, key: "stage-props-traffic-cone", scale: 0.54 },
    { x: 2480, y: 672, key: "stage-props-bike-rack", scale: 0.62 },
    { x: 2860, y: 336, key: "stage-props-utility-box", scale: 0.52 },
    { x: 3700, y: 672, key: "stage-structures-construction-fence", scale: 0.62 },
    { x: 4480, y: 672, key: "stage-props-roadwork-sign", scale: 0.5 },
    { x: 5480, y: 516, key: "stage-props-guard-rail", scale: 0.66 },
    { x: 6140, y: 672, key: "stage-structures-concrete-pillar", scale: 0.58 },
    { x: 7240, y: 520, key: "stage-props-sidewalk-sign", scale: 0.54 },
    { x: 8080, y: 672, key: "stage-structures-station-wall-railing", scale: 0.64 },
    { x: 8720, y: 672, key: "stage-structures-station-entrance", scale: 0.58 },
  ],
  items: [
    { type: "energyDrink", x: 500, y: 468 },
    { type: "coin", x: 760, y: 470 },
    { type: "coin", x: 830, y: 438 },
    { type: "coin", x: 900, y: 410 },
    { type: "bubbleTea", x: 1020, y: 374 },
    { type: "shoppingBag", x: 1400, y: 292 },
    { type: "energyDrink", x: 1980, y: 464 },
    { type: "bubbleTea", x: 2480, y: 374 },
    { type: "shoppingBag", x: 2860, y: 280 },
    { type: "energyDrink", x: 3560, y: 464 },
    { type: "bubbleTea", x: 4060, y: 368 },
    { type: "shoppingBag", x: 4440, y: 272 },
    { type: "coin", x: 3720, y: 420 },
    { type: "coin", x: 3780, y: 398 },
    { type: "coin", x: 3840, y: 420 },
    { type: "energyDrink", x: 5340, y: 460 },
    { type: "coin", x: 5260, y: 220 },
    { type: "coin", x: 5320, y: 196 },
    { type: "coin", x: 5680, y: 158 },
    { type: "coin", x: 5740, y: 146 },
    { type: "shoppingBag", x: 6160, y: 200 },
    { type: "coin", x: 6420, y: 214 },
    { type: "bubbleTea", x: 5900, y: 364 },
    { type: "shoppingBag", x: 6460, y: 276 },
    { type: "energyDrink", x: 7180, y: 464 },
    { type: "dashRing", x: 7360, y: 382 },
    { type: "bubbleTea", x: 7600, y: 372 },
    { type: "shoppingBag", x: 8120, y: 284 },
    { type: "energyDrink", x: 8680, y: 492 },
  ],
  bonusBlocks: [
    { type: "question", x: 1180, y: 464, reward: "powerJump" },
    { type: "question", x: 3660, y: 440, reward: "powerSpeed" },
    { type: "hidden", x: 5000, y: 392, reward: "powerJump" },
    { type: "hidden", x: 6160, y: 424, reward: "star" },
    { type: "hidden", x: 6280, y: 184, reward: "dashRing" },
    { type: "breakable", x: 6640, y: 452 },
    { type: "breakable", x: 6704, y: 452 },
  ],
  checkpoints: [
    { x: 4020, y: 606 },
    { x: 7180, y: 606 },
  ],
  oneWayGates: [
    { x: 7000, y: 592, height: 168 },
  ],
  miniChallenges: [
    {
      id: "fragileCoinRun",
      title: {
        ja: "中間チャレンジ",
        en: "Mid-stage Challenge",
        zh: "中段挑战",
        ko: "중간 챌린지",
      },
      startX: 3500,
      endX: 3920,
      targetCoins: 3,
      bonusScore: 350,
    },
  ],
  missions: [
    {
      id: "noDamage",
      label: {
        ja: "ノーダメージ",
        en: "No damage",
        zh: "无伤",
        ko: "노 데미지",
      },
      type: "noDamage",
    },
    {
      id: "coinRunner",
      label: {
        ja: "コイン12枚以上",
        en: "Collect 12+ coins",
        zh: "收集12枚以上金币",
        ko: "코인 12개 이상",
      },
      type: "minCoins",
      target: 12,
    },
    {
      id: "fragileCoinRun",
      label: {
        ja: "中間チャレンジ成功",
        en: "Clear the mid-stage challenge",
        zh: "完成中段挑战",
        ko: "중간 챌린지 성공",
      },
      type: "miniChallenge",
      challengeId: "fragileCoinRun",
    },
  ],
  enemies: [
    { type: "knifePunk", x: 980, y: 590, patrolLeft: 780, patrolRight: 1160, speed: 78 },
    { type: "coneGolem", x: 1660, y: 590, patrolLeft: 1500, patrolRight: 1800, speed: 72 },
    { type: "heartCannonTurret", x: 2240, y: 631, patrolLeft: 2240, patrolRight: 2240, speed: 0 },
    { type: "aquaMascot", x: 2360, y: 590, patrolLeft: 2160, patrolRight: 2740, speed: 92 },
    { type: "rabbitTraveler", x: 3640, y: 444, patrolLeft: 3420, patrolRight: 3680, speed: 86 },
    { type: "knifePunk", x: 5320, y: 444, patrolLeft: 5180, patrolRight: 5480, speed: 82 },
    { type: "hornedCyborg", x: 5850, y: 344, patrolLeft: 5750, patrolRight: 6260, speed: 68 },
    { type: "neonIdolShooter", x: 6320, y: 260, patrolLeft: 6320, patrolRight: 6320, speed: 0 },
    { type: "aquaMascot", x: 7160, y: 448, patrolLeft: 7040, patrolRight: 7400, speed: 94 },
    { type: "heartCannonTurret", x: 7920, y: 276, patrolLeft: 7920, patrolRight: 7920, speed: 0 },
    { type: "aquaMascot", x: 8460, y: 476, patrolLeft: 8240, patrolRight: 8840, speed: 108 },
  ],
};

export const SKY_SHAFT_CLIMB_STAGE: StageDefinition = {
  name: {
    jp: "スカイシャフト・クライム",
    en: "Sky Shaft Climb",
    zh: "天空竖井攀登",
    ko: "스카이 샤프트 클라임",
  },
  backgrounds: {
    rearKey: "rear-620c2900-ce9f-46e9-974e-b40916d5aa0c",
    midgroundKey: "midground-city-loop-strip",
  },
  storyDialogue: {
    triggerX: 360,
    stepDelayMs: 7000,
    lines: [
      {
        characterName: {
          ja: "残念院さん",
          en: "Zannenin",
          zh: "残念院小姐",
          ko: "잔넨인 씨",
        },
        message: {
          ja: "上へ続く道です。落ち着いて、一段ずつ登りましょう。",
          en: "The route climbs upward. One platform at a time.",
          zh: "路线往上延伸。冷静地一层一层爬上去吧。",
          ko: "위로 이어지는 길이에요. 침착하게 한 칸씩 올라가요.",
        },
        portraitPath: "assets/ui/message_faces/message_face_head_icon_02_smile.webp",
      },
      {
        characterName: {
          ja: "残念院さん",
          en: "Zannenin",
          zh: "残念院小姐",
          ko: "잔넨인 씨",
        },
        message: {
          ja: "動く足場は待つ勇気も大事です。無理に飛び込まないで。",
          en: "Moving platforms reward patience. Don't jump before the timing is yours.",
          zh: "移动平台需要耐心。时机没到之前不要勉强跳。",
          ko: "움직이는 발판은 기다리는 용기가 중요해요. 타이밍이 오기 전에 무리해서 뛰지 마세요.",
        },
        portraitPath: "assets/ui/message_faces/message_face_head_icon_05_shy.webp",
      },
    ],
  },
  worldWidth: 1920,
  worldTop: -3720,
  worldBottom: 720,
  groundTopY: 672,
  streetLampGroundY: 672,
  playerStart: {
    x: 180,
    y: 552,
  },
  goal: {
    x: 1580,
    y: -3488,
  },
  platforms: [
    { x: 0, y: 672, units: 8 },
    { x: 620, y: 672, units: 5 },
    { x: 1180, y: 672, units: 7 },
    { x: 260, y: 548, units: 3 },
    { x: 680, y: 436, units: 3, moving: { axis: "xy", distance: 360, distanceY: -96, speed: 76 } },
    { x: 1230, y: 320, units: 3 },
    { x: 940, y: 188, units: 2, moving: { axis: "y", distance: -120, speed: 54 } },
    { x: 520, y: 44, units: 3 },
    { x: 170, y: -104, units: 2, moving: { axis: "x", distance: 420, speed: 78 } },
    { x: 820, y: -256, units: 3 },
    { x: 1260, y: -420, units: 2, moving: { axis: "y", distance: -150, speed: 58 } },
    { x: 1320, y: -510, units: 2 },
    { x: 1460, y: -600, units: 3 },
    { x: 1180, y: -760, units: 2 },
    { x: 720, y: -880, units: 2 },
    { x: 930, y: -1010, units: 2, moving: { axis: "xy", distance: -430, distanceY: -104, speed: 84 } },
    { x: 660, y: -1100, units: 2 },
    { x: 380, y: -1190, units: 3 },
    { x: 460, y: -1280, units: 2 },
    { x: 650, y: -1370, units: 2, moving: { axis: "y", distance: -180, speed: 66 } },
    { x: 880, y: -1490, units: 2 },
    { x: 1060, y: -1590, units: 3 },
    { x: 1300, y: -1680, units: 2 },
    { x: 1450, y: -1780, units: 2, moving: { axis: "x", distance: -500, speed: 92 } },
    { x: 1120, y: -1890, units: 2 },
    { x: 780, y: -1990, units: 3 },
    { x: 520, y: -2090, units: 2 },
    { x: 250, y: -2190, units: 2, moving: { axis: "y", distance: -160, speed: 58 } },
    { x: 360, y: -2310, units: 2 },
    { x: 540, y: -2390, units: 3 },
    { x: 800, y: -2490, units: 2 },
    { x: 1020, y: -2590, units: 2, moving: { axis: "xy", distance: 470, distanceY: -120, speed: 88 } },
    { x: 1280, y: -2690, units: 2 },
    { x: 1460, y: -2780, units: 3 },
    { x: 1180, y: -2890, units: 2 },
    { x: 900, y: -2990, units: 2, moving: { axis: "y", distance: -180, speed: 64 } },
    { x: 660, y: -3110, units: 2 },
    { x: 420, y: -3200, units: 3 },
    { x: 640, y: -3290, units: 2 },
    { x: 900, y: -3370, units: 3, moving: { axis: "x", distance: 460, speed: 72 } },
    { x: 1460, y: -3520, units: 5 },
  ],
  streetLamps: [
    { x: 220, key: "street-lamp-single", scale: 0.64 },
    { x: 1510, key: "street-lamp-double", scale: 0.58 },
  ],
  decorations: [
    { x: 760, y: 672, key: "stage-structures-chainlink-fence", scale: 0.56 },
    { x: 1320, y: 672, key: "stage-props-utility-box", scale: 0.48 },
    { x: 500, y: -1190, key: "stage-props-planter-box", scale: 0.5 },
    { x: 1530, y: -2780, key: "stage-props-guard-rail", scale: 0.56 },
    { x: 1640, y: -3520, key: "stage-structures-station-wall-railing", scale: 0.5 },
  ],
  items: [
    { type: "energyDrink", x: 320, y: 464 },
    { type: "bubbleTea", x: 1360, y: 196 },
    { type: "shoppingBag", x: 600, y: -148 },
    { type: "energyDrink", x: 1510, y: -876 },
    { type: "bubbleTea", x: 460, y: -1246 },
    { type: "shoppingBag", x: 1140, y: -1646 },
    { type: "energyDrink", x: 850, y: -2046 },
    { type: "bubbleTea", x: 590, y: -2446 },
    { type: "shoppingBag", x: 1540, y: -2836 },
    { type: "energyDrink", x: 500, y: -3256 },
  ],
  enemies: [
    { type: "coneGolem", x: 1340, y: 590, patrolLeft: 1180, patrolRight: 1560, speed: 64 },
    { type: "rabbitTraveler", x: 880, y: -502, patrolLeft: 820, patrolRight: 1060, speed: 72 },
    { type: "hornedCyborg", x: 1360, y: -1000, patrolLeft: 1060, patrolRight: 1620, speed: 60 },
    { type: "aquaMascot", x: 1110, y: -1662, patrolLeft: 1060, patrolRight: 1240, speed: 58 },
    { type: "hornedCyborg", x: 500, y: -2380, patrolLeft: 260, patrolRight: 860, speed: 66 },
  ],
};

export const MOBILE_TOUCH_TUTORIAL_STAGE: StageDefinition = {
  name: {
    jp: "作成中 タッチ操作チュートリアル",
    en: "WIP Touch Controls Tutorial",
    zh: "开发中 触控教学",
    ko: "제작 중 터치 조작 튜토리얼",
  },
  backgrounds: {
    rearKey: "rear-starry-sky",
    midgroundKey: "midground-city-loop-strip",
  },
  storyDialogues: [
    {
      triggerX: 130,
      closeAtX: 400,
      stepDelayMs: 4200,
      durationMs: 9500,
      lines: [
        {
          characterName: {
            ja: "残念院さん",
            en: "Zannenin",
            zh: "残念院小姐",
            ko: "잔넨인 씨",
          },
          message: {
            ja: "まずは左右移動です。少し右へ進んでから、左にも戻って足元の感覚をつかみましょう。",
            en: "First, practice left and right movement. Move right, then step back left to feel the controls.",
            zh: "首先练习左右移动。先稍微向右走，再往左回来，熟悉脚下的感觉吧。",
            ko: "먼저 좌우 이동 연습이에요. 조금 오른쪽으로 간 뒤 왼쪽으로도 돌아와서 발밑 감각을 익혀 봐요.",
          },
          portraitPath: "assets/ui/message_faces/message_face_head_icon_02_smile.webp",
        },
      ],
    },
    {
      triggerX: 400,
      closeAtX: 704,
      stepDelayMs: 4400,
      durationMs: 9500,
      lines: [
        {
          characterName: {
            ja: "残念院さん",
            en: "Zannenin",
            zh: "残念院小姐",
            ko: "잔넨인 씨",
          },
          message: {
            ja: "次は移動ジャンプです。走りながらジャンプして、穴の向こうへ渡ります。",
            en: "Next is a moving jump. Keep moving as you jump across the gap.",
            zh: "接下来是移动跳跃。一边跑一边跳，越过前面的缺口吧。",
            ko: "다음은 이동 점프예요. 달리면서 점프해서 구멍 너머로 건너가요.",
          },
          portraitPath: "assets/ui/message_faces/message_face_head_icon_03_happy_open.png",
        },
      ],
    },
    {
      triggerX: 1110,
      closeAtX: 1740,
      stepDelayMs: 4600,
      durationMs: 13000,
      lines: [
        {
          characterName: {
            ja: "残念院さん",
            en: "Zannenin",
            zh: "残念院小姐",
            ko: "잔넨인 씨",
          },
          message: {
            ja: "ここはスーパーダッシュの練習です。DASHを押しながら進むとスタミナを消費して加速します。スタミナはダッシュ中と空中以外なら少しずつ回復します。",
            en: "This is super dash practice. Hold DASH while moving to spend stamina and accelerate. Stamina gradually recovers when you are not dashing or airborne.",
            zh: "这里是超级冲刺练习。移动时按住DASH会消耗体力并加速。不在冲刺或空中时，体力会逐渐恢复。",
            ko: "여기는 슈퍼 대시 연습이에요. 이동하면서 DASH를 누르면 스태미나를 쓰고 가속해요. 대시 중이거나 공중에 있을 때가 아니면 스태미나는 조금씩 회복돼요.",
          },
          portraitPath: "assets/ui/message_faces/message_face_head_icon_04_wink.webp",
        },
      ],
    },
    {
      triggerX: 2200,
      stepDelayMs: 5200,
      durationMs: 10500,
      lines: [
        {
          characterName: {
            ja: "残念院さん",
            en: "Zannenin",
            zh: "残念院小姐",
            ko: "잔넨인 씨",
          },
          message: {
            ja: "多段ジャンプです。空中でJUMPを押すと、スタミナを消費して空中ジャンプできます。落ちる前にもう一度ジャンプして進みましょう。",
            en: "Time for multi-jumps. Press JUMP while airborne to spend stamina and jump again in the air. Jump again before you fall.",
            zh: "这是多段跳。在空中按JUMP会消耗体力，再次进行空中跳跃。掉下去之前再跳一次前进吧。",
            ko: "다단 점프예요. 공중에서 JUMP를 누르면 스태미나를 써서 공중 점프를 할 수 있어요. 떨어지기 전에 한 번 더 점프해서 나아가요.",
          },
          portraitPath: "assets/ui/message_faces/message_face_head_icon_05_shy.webp",
        },
      ],
    },
    {
      triggerX: 2920,
      stepDelayMs: 5200,
      durationMs: 10500,
      lines: [
        {
          characterName: {
            ja: "残念院さん",
            en: "Zannenin",
            zh: "残念院小姐",
            ko: "잔넨인 씨",
          },
          message: {
            ja: "しゃがむとスタミナ回復が早くなります。次の練習前に、少ししゃがんでゲージを戻しましょう。",
            en: "Crouching recovers stamina faster. Crouch for a moment before the next practice.",
            zh: "蹲下时体力恢复会更快。下一项练习前，先蹲一会儿把能量条回满吧。",
            ko: "웅크리면 스태미나 회복이 빨라져요. 다음 연습 전에 잠깐 웅크려서 게이지를 채워 봐요.",
          },
          portraitPath: "assets/ui/message_faces/message_face_head_icon_02_smile.webp",
        },
      ],
    },
    {
      triggerX: 3300,
      stepDelayMs: 5600,
      durationMs: 11000,
      lines: [
        {
          characterName: {
            ja: "残念院さん",
            en: "Zannenin",
            zh: "残念院小姐",
            ko: "잔넨인 씨",
          },
          message: {
            ja: "屋根の上に乗ったら、しゃがみ続けてください。半透明の足場は下へすり抜けられます。",
            en: "Stand on the roof, then keep crouching. Thin top platforms can be dropped through.",
            zh: "站到屋顶上后，请继续蹲下。半透明的平台可以向下穿过去。",
            ko: "지붕 위에 올라가면 계속 웅크리고 있어 주세요. 반투명 발판은 아래로 통과할 수 있어요.",
          },
          portraitPath: "assets/ui/message_faces/message_face_head_icon_03_happy_open.png",
        },
      ],
    },
    {
      triggerX: 4070,
      stepDelayMs: 4200,
      durationMs: 9000,
      lines: [
        {
          characterName: {
            ja: "残念院さん",
            en: "Zannenin",
            zh: "残念院小姐",
            ko: "잔넨인 씨",
          },
          message: {
            ja: "最後はゴールです。旗まで進めばチュートリアル完了です。",
            en: "Last step: reach the goal flag to finish the tutorial.",
            zh: "最后就是终点。前进到旗帜那里，教学就完成了。",
            ko: "마지막은 골이에요. 깃발까지 가면 튜토리얼 완료예요.",
          },
          portraitPath: "assets/ui/message_faces/message_face_head_icon_04_wink.webp",
        },
      ],
    },
  ],
  worldWidth: 4700,
  worldTop: -360,
  worldBottom: 720,
  groundTopY: 672,
  playerStart: {
    x: 120,
    y: 552,
  },
  goal: {
    x: 4480,
    y: 568,
  },
  platforms: [
    { x: 0, y: 672, units: 9 },
    { x: 704, y: 672, units: 6 },
    { x: 1184, y: 672, units: 17 },
    { x: 2304, y: 560, units: 2 },
    { x: 2536, y: 472, units: 2 },
    { x: 2784, y: 384, units: 2 },
    { x: 3056, y: 528, units: 3 },
    { x: 3296, y: 672, units: 7 },
    { x: 3936, y: 672, units: 10 },
  ],
  streetLamps: [
    { x: 260, key: "street-lamp-single", scale: 0.62 },
    { x: 1470, key: "street-lamp-double", scale: 0.58 },
    { x: 4020, key: "street-lamp-single", scale: 0.62 },
  ],
  decorations: [
    { x: 360, y: 672, key: "stage-props-traffic-cone", scale: 0.48 },
    { x: 620, y: 672, key: "stage-props-roadwork-sign", scale: 0.42 },
    { x: 1130, y: 672, key: "stage-props-sidewalk-sign", scale: 0.42 },
    { x: 1660, y: 672, key: "stage-props-planter-box", scale: 0.48 },
    { x: 3040, y: 672, key: "stage-props-vending-machine", scale: 0.48 },
    { x: 3600, y: 672, key: "stage-structures-bus-shelter", scale: 0.62 },
    { x: 4320, y: 672, key: "stage-structures-chainlink-fence", scale: 0.54 },
  ],
  items: [
    { type: "coin", x: 220, y: 610 },
    { type: "coin", x: 420, y: 610 },
    { type: "coin", x: 760, y: 610 },
    { type: "energyDrink", x: 980, y: 610 },
    { type: "dashRing", x: 1320, y: 610 },
    { type: "coin", x: 1520, y: 610 },
    { type: "coin", x: 1700, y: 610 },
    { type: "bubbleTea", x: 2368, y: 504 },
    { type: "coin", x: 2600, y: 416 },
    { type: "energyDrink", x: 2848, y: 328 },
    { type: "coin", x: 3140, y: 472 },
    { type: "shoppingBag", x: 3600, y: 430 },
    { type: "coin", x: 4140, y: 610 },
  ],
  bonusBlocks: [],
  checkpoints: [
    { x: 2060, y: 568 },
    { x: 3260, y: 568 },
  ],
  oneWayGates: [],
  dashWalls: [
    { x: 1700, y: -864, width: 40, height: 3072 },
  ],
  enemies: [],
};

export const RANKING_CHECK_STAGE: StageDefinition = {
  name: {
    jp: "作成中 ランキング確認",
    en: "WIP Ranking Check",
    zh: "开发中 排行榜检查",
    ko: "제작 중 랭킹 체크",
  },
  backgrounds: {
    rearKey: "rear-starry-sky",
    midgroundKey: "midground-city-loop-strip",
  },
  worldWidth: 1600,
  worldTop: -360,
  worldBottom: 720,
  groundTopY: 672,
  playerStart: {
    x: 120,
    y: 552,
  },
  goal: {
    x: 1180,
    y: 568,
  },
  platforms: [
    { x: 0, y: 672, units: 25 },
    { x: 360, y: 548, units: 4 },
    { x: 680, y: 488, units: 4 },
    { x: 980, y: 548, units: 4 },
  ],
  streetLamps: [
    { x: 260, key: "street-lamp-single", scale: 0.62 },
    { x: 1120, key: "street-lamp-double", scale: 0.6 },
  ],
  decorations: [
    { x: 520, y: 672, key: "stage-props-vending-machine", scale: 0.5 },
    { x: 880, y: 672, key: "stage-props-planter-box", scale: 0.5 },
    { x: 1320, y: 672, key: "stage-structures-chainlink-fence", scale: 0.56 },
  ],
  items: [
    { type: "coin", x: 220, y: 610 },
    { type: "coin", x: 280, y: 610 },
    { type: "energyDrink", x: 380, y: 492 },
    { type: "bubbleTea", x: 470, y: 492 },
    { type: "shoppingBag", x: 560, y: 492 },
    { type: "coin", x: 660, y: 610 },
    { type: "coin", x: 720, y: 610 },
    { type: "energyDrink", x: 700, y: 432 },
    { type: "bubbleTea", x: 790, y: 432 },
    { type: "shoppingBag", x: 880, y: 432 },
    { type: "coin", x: 960, y: 610 },
    { type: "coin", x: 1020, y: 610 },
    { type: "energyDrink", x: 1000, y: 492 },
    { type: "bubbleTea", x: 1090, y: 492 },
    { type: "shoppingBag", x: 1160, y: 610 },
  ],
  bonusBlocks: [],
  checkpoints: [],
  oneWayGates: [],
  enemies: [],
};

const coinRush = (x: number, y: number, count: number, dx = 58): ItemPlacement[] =>
  Array.from({ length: count }, (_, index) => ({ type: "coin", x: x + index * dx, y }));

const nightmareGround: PlatformRunPlacement[] = [
  { x: 0, y: 672, units: 9 },
  { x: 920, y: 672, units: 6 },
  { x: 1680, y: 672, units: 5 },
  { x: 2500, y: 672, units: 8 },
  { x: 3700, y: 672, units: 6 },
  { x: 4700, y: 672, units: 5 },
  { x: 5600, y: 672, units: 7 },
  { x: 6880, y: 672, units: 4 },
  { x: 7800, y: 672, units: 8 },
  { x: 9200, y: 672, units: 5 },
  { x: 10180, y: 672, units: 4 },
  { x: 11280, y: 672, units: 6 },
  { x: 12600, y: 672, units: 5 },
  { x: 13760, y: 672, units: 8 },
  { x: 15280, y: 672, units: 4 },
  { x: 16420, y: 672, units: 6 },
  { x: 17880, y: 672, units: 5 },
  { x: 19080, y: 672, units: 7 },
  { x: 20580, y: 672, units: 4 },
  { x: 21800, y: 672, units: 6 },
  { x: 23320, y: 672, units: 5 },
  { x: 24680, y: 672, units: 6 },
  { x: 26240, y: 672, units: 4 },
  { x: 27540, y: 672, units: 7 },
  { x: 29140, y: 672, units: 5 },
  { x: 30520, y: 672, units: 28 },
];

const nightmarePlatforms: PlatformRunPlacement[] = [
  ...nightmareGround,
  { x: 480, y: 520, units: 3 },
  { x: 820, y: 440, units: 2, fragile: { delayMs: 360, respawnMs: 2600 } },
  { x: 1120, y: 352, units: 3 },
  { x: 1440, y: 536, units: 1, spring: { velocity: -920 } },
  { x: 1860, y: 384, units: 3, moving: { axis: "y", distance: 150, speed: 74 } },
  { x: 2300, y: 508, units: 3, fragile: { delayMs: 320, respawnMs: 2800 } },
  { x: 2780, y: 420, units: 4 },
  { x: 3300, y: 324, units: 3, moving: { axis: "x", distance: 300, speed: 96 } },
  { x: 3920, y: 508, units: 2, fragile: { delayMs: 300, respawnMs: 3000 } },
  { x: 4300, y: 416, units: 3 },
  { x: 4940, y: 512, units: 1, spring: { velocity: -980 } },
  { x: 5320, y: 300, units: 4 },
  { x: 6040, y: 500, units: 3, moving: { axis: "xy", distance: 260, distanceY: -110, speed: 92 } },
  { x: 6500, y: 396, units: 2, fragile: { delayMs: 280, respawnMs: 3200 } },
  { x: 7060, y: 324, units: 3 },
  { x: 7580, y: 520, units: 2, moving: { axis: "x", distance: 360, speed: 112 } },
  { x: 8160, y: 408, units: 3 },
  { x: 8740, y: 308, units: 3, fragile: { delayMs: 260, respawnMs: 3400 } },
  { x: 9400, y: 520, units: 1, spring: { velocity: -1020 } },
  { x: 9720, y: 286, units: 4 },
  { x: 10480, y: 500, units: 3, moving: { axis: "y", distance: 180, speed: 82 } },
  { x: 10980, y: 396, units: 2, fragile: { delayMs: 260, respawnMs: 3400 } },
  { x: 11640, y: 320, units: 4 },
  { x: 12300, y: 520, units: 3, moving: { axis: "x", distance: 420, speed: 118 } },
  { x: 12920, y: 424, units: 2 },
  { x: 13320, y: 324, units: 2, fragile: { delayMs: 240, respawnMs: 3600 } },
  { x: 14120, y: 500, units: 1, spring: { velocity: -1040 } },
  { x: 14560, y: 260, units: 4 },
  { x: 15380, y: 480, units: 3, moving: { axis: "xy", distance: -280, distanceY: -130, speed: 98 } },
  { x: 15940, y: 352, units: 2, fragile: { delayMs: 240, respawnMs: 3700 } },
  { x: 16680, y: 292, units: 4 },
  { x: 17460, y: 510, units: 2, moving: { axis: "x", distance: 420, speed: 126 } },
  { x: 18180, y: 398, units: 3 },
  { x: 18720, y: 300, units: 2, fragile: { delayMs: 220, respawnMs: 3900 } },
  { x: 19480, y: 512, units: 1, spring: { velocity: -1080 } },
  { x: 19980, y: 250, units: 4 },
  { x: 20820, y: 500, units: 3, moving: { axis: "y", distance: 190, speed: 92 } },
  { x: 21420, y: 384, units: 2, fragile: { delayMs: 220, respawnMs: 4000 } },
  { x: 22240, y: 300, units: 4 },
  { x: 23000, y: 500, units: 3, moving: { axis: "x", distance: 470, speed: 132 } },
  { x: 23820, y: 392, units: 2 },
  { x: 24380, y: 288, units: 2, fragile: { delayMs: 210, respawnMs: 4200 } },
  { x: 25280, y: 514, units: 1, spring: { velocity: -1100 } },
  { x: 25800, y: 244, units: 4 },
  { x: 26720, y: 484, units: 3, moving: { axis: "xy", distance: 320, distanceY: -150, speed: 112 } },
  { x: 27480, y: 380, units: 2, fragile: { delayMs: 200, respawnMs: 4400 } },
  { x: 28280, y: 300, units: 4 },
  { x: 29180, y: 500, units: 3, moving: { axis: "x", distance: 500, speed: 136 } },
  { x: 29920, y: 392, units: 2, fragile: { delayMs: 200, respawnMs: 4500 } },
  { x: 30680, y: 308, units: 4 },
  { x: 31420, y: 512, units: 2, moving: { axis: "y", distance: 170, speed: 104 } },
];

const nightmareItems: ItemPlacement[] = [
  { type: "energyDrink", x: 520, y: 464 },
  ...coinRush(780, 390, 5),
  { type: "bubbleTea", x: 1140, y: 300 },
  { type: "powerJump", x: 1460, y: 480 },
  ...coinRush(1900, 336, 6),
  { type: "shoppingBag", x: 2840, y: 364 },
  ...coinRush(3340, 276, 5),
  { type: "dashRing", x: 4300, y: 360 },
  { type: "energyDrink", x: 5340, y: 244 },
  ...coinRush(6060, 444, 6),
  { type: "bubbleTea", x: 7100, y: 268 },
  ...coinRush(8140, 352, 5),
  { type: "shoppingBag", x: 9780, y: 230 },
  { type: "powerSpeed", x: 10540, y: 444 },
  ...coinRush(11680, 266, 6),
  { type: "star", x: 12420, y: 464 },
  ...coinRush(14580, 208, 6),
  { type: "energyDrink", x: 15460, y: 424 },
  ...coinRush(16680, 236, 5),
  { type: "bubbleTea", x: 18220, y: 342 },
  ...coinRush(19990, 196, 6),
  { type: "dashRing", x: 20900, y: 444 },
  ...coinRush(22260, 244, 6),
  { type: "shoppingBag", x: 23900, y: 336 },
  ...coinRush(25820, 192, 6),
  { type: "energyDrink", x: 26800, y: 428 },
  ...coinRush(28280, 244, 6),
  { type: "star", x: 29240, y: 444 },
  ...coinRush(30680, 252, 7),
  { type: "shoppingBag", x: 31840, y: 596 },
];

const nightmareEnemies: EnemyPlacement[] = [
  { type: "knifePunk", x: 980, y: 590, patrolLeft: 920, patrolRight: 1230, speed: 88 },
  { type: "coneGolem", x: 1840, y: 590, patrolLeft: 1680, patrolRight: 1940, speed: 80 },
  { type: "aquaMascot", x: 2860, y: 590, patrolLeft: 2500, patrolRight: 2960, speed: 104 },
  { type: "rabbitTraveler", x: 4100, y: 590, patrolLeft: 3700, patrolRight: 4380, speed: 108 },
  { type: "neonIdolShooter", x: 5320, y: 228, patrolLeft: 5320, patrolRight: 5320, speed: 0 },
  { type: "hornedCyborg", x: 6100, y: 432, patrolLeft: 6040, patrolRight: 6600, speed: 74 },
  { type: "knifePunk", x: 8060, y: 590, patrolLeft: 7800, patrolRight: 8280, speed: 112 },
  { type: "neonIdolShooter", x: 9720, y: 214, patrolLeft: 9720, patrolRight: 9720, speed: 0 },
  { type: "aquaMascot", x: 11460, y: 590, patrolLeft: 11280, patrolRight: 11680, speed: 116 },
  { type: "hornedCyborg", x: 12380, y: 444, patrolLeft: 12300, patrolRight: 12980, speed: 86 },
  { type: "rabbitTraveler", x: 13980, y: 590, patrolLeft: 13760, patrolRight: 14520, speed: 120 },
  { type: "neonIdolShooter", x: 16680, y: 220, patrolLeft: 16680, patrolRight: 16680, speed: 0 },
  { type: "coneGolem", x: 18140, y: 590, patrolLeft: 17880, patrolRight: 18380, speed: 92 },
  { type: "hornedCyborg", x: 20840, y: 432, patrolLeft: 20820, patrolRight: 21380, speed: 92 },
  { type: "aquaMascot", x: 22280, y: 226, patrolLeft: 22240, patrolRight: 22560, speed: 112 },
  { type: "neonIdolShooter", x: 25800, y: 172, patrolLeft: 25800, patrolRight: 25800, speed: 0 },
  { type: "rabbitTraveler", x: 27940, y: 590, patrolLeft: 27540, patrolRight: 28260, speed: 126 },
  { type: "knifePunk", x: 29260, y: 432, patrolLeft: 29180, patrolRight: 29980, speed: 118 },
  { type: "hornedCyborg", x: 30740, y: 236, patrolLeft: 30680, patrolRight: 30960, speed: 96 },
  { type: "aquaMascot", x: 31680, y: 590, patrolLeft: 30520, patrolRight: 32200, speed: 132 },
];

const nightmareDecorations: StageDecorationPlacement[] = [
  { x: 720, y: 672, key: "stage-structures-chainlink-fence", scale: 0.58 },
  { x: 1740, y: 672, key: "stage-props-traffic-cone", scale: 0.5 },
  { x: 3880, y: 672, key: "stage-structures-construction-fence", scale: 0.62 },
  { x: 5740, y: 672, key: "stage-props-roadwork-sign", scale: 0.5 },
  { x: 8120, y: 672, key: "stage-props-bike-rack", scale: 0.56 },
  { x: 11620, y: 672, key: "stage-props-vending-machine", scale: 0.48 },
  { x: 14180, y: 672, key: "stage-structures-concrete-pillar", scale: 0.56 },
  { x: 18080, y: 672, key: "stage-props-guard-rail", scale: 0.62 },
  { x: 22120, y: 672, key: "stage-structures-station-wall-railing", scale: 0.6 },
  { x: 25020, y: 672, key: "stage-props-utility-box", scale: 0.5 },
  { x: 27980, y: 672, key: "stage-structures-bus-shelter", scale: 0.58 },
  { x: 31660, y: 672, key: "stage-structures-station-entrance", scale: 0.58 },
];

const nightmareStreetLamps: StreetLampPlacement[] = Array.from({ length: 14 }, (_, index) => ({
  x: 360 + index * 2350,
  key: index % 2 === 0 ? "street-lamp-single" : "street-lamp-double",
  scale: index % 2 === 0 ? 0.62 : 0.58,
}));

export const NIGHTMARE_LONGRUN_STAGE: StageDefinition = {
  name: {
    jp: "絶望ロングラン EX",
    en: "Despair Longrun EX",
  },
  backgrounds: {
    rearKey: "rear-starry-sky",
    midgroundKey: "midground-city-loop-strip",
  },
  worldWidth: 32800,
  worldTop: -1040,
  worldBottom: 720,
  groundTopY: 672,
  playerStart: {
    x: 120,
    y: 552,
  },
  goal: {
    x: 32380,
    y: 568,
  },
  platforms: nightmarePlatforms,
  streetLamps: nightmareStreetLamps,
  decorations: nightmareDecorations,
  items: nightmareItems,
  bonusBlocks: [
    { type: "question", x: 1360, y: 408, reward: "powerJump" },
    { type: "hidden", x: 5160, y: 392, reward: "star" },
    { type: "question", x: 8480, y: 424, reward: "powerSpeed" },
    { type: "hidden", x: 12080, y: 432, reward: "star" },
    { type: "question", x: 16240, y: 420, reward: "dashRing" },
    { type: "breakable", x: 18560, y: 432 },
    { type: "breakable", x: 18624, y: 432 },
    { type: "hidden", x: 20380, y: 432, reward: "powerJump" },
    { type: "question", x: 25520, y: 412, reward: "star" },
    { type: "breakable", x: 30120, y: 452 },
    { type: "breakable", x: 30184, y: 452 },
  ],
  checkpoints: [
    { x: 4700, y: 606 },
    { x: 9200, y: 606 },
    { x: 13760, y: 606 },
    { x: 19080, y: 606 },
    { x: 24680, y: 606 },
    { x: 30520, y: 606 },
  ],
  oneWayGates: [
    { x: 9100, y: 592, height: 168 },
    { x: 18480, y: 592, height: 168 },
    { x: 30280, y: 592, height: 168 },
  ],
  dashWalls: [
    { x: 15280, y: -1100, width: 42, height: 3400, knockbackX: -760, knockbackY: -520 },
    { x: 26240, y: -1100, width: 42, height: 3400, knockbackX: -820, knockbackY: -560 },
  ],
  enemies: nightmareEnemies,
};

const monsterHouseEnemyTypes = [
  "aquaMascot",
  "hornedCyborg",
  "knifePunk",
  "rabbitTraveler",
  "coneGolem",
] as const;

const monsterHouseEnemies: EnemyPlacement[] = Array.from({ length: 96 }, (_, index) => {
  const lane = index % 6;
  const block = Math.floor(index / 6);
  const baseX = 760 + block * 250;
  const x = baseX + lane * 32;
  const y = 590 - (lane % 3) * 84;
  const patrolSpan = 160 + (lane % 3) * 60;
  return {
    type: monsterHouseEnemyTypes[(index + lane) % monsterHouseEnemyTypes.length],
    x,
    y,
    patrolLeft: x - patrolSpan,
    patrolRight: x + patrolSpan,
    speed: 88 + (index % 5) * 10,
  };
});

export const MONSTER_HOUSE_STAGE: StageDefinition = {
  name: {
    jp: "モンスターハウス",
    en: "Monster House",
  },
  backgrounds: {
    rearKey: "rear-starry-sky",
    midgroundKey: "midground-city-loop-strip",
  },
  worldWidth: 6400,
  worldTop: -960,
  worldBottom: 720,
  groundTopY: 672,
  playerStart: {
    x: 120,
    y: 552,
  },
  goal: {
    x: 6180,
    y: 568,
  },
  platforms: [
    { x: 0, y: 672, units: 200 },
    { x: 760, y: 520, units: 34 },
    { x: 2080, y: 420, units: 36 },
    { x: 3580, y: 312, units: 30 },
    { x: 5080, y: 220, units: 20 },
  ],
  streetLamps: [],
  decorations: [],
  items: [
    { type: "powerJump", x: 960, y: 452 },
    { type: "powerSpeed", x: 2350, y: 352 },
    { type: "star", x: 3860, y: 244 },
    { type: "dashRing", x: 5340, y: 160 },
  ],
  checkpoints: [
    { x: 2180, y: 606 },
    { x: 4180, y: 606 },
  ],
  enemies: monsterHouseEnemies,
};

export const STAGES = {
  originalDowntown: ORIGINAL_DOWNTOWN_STAGE,
  neonCanal: NEON_CANAL_STAGE,
  neoShibuyaCity: NEO_SHIBUYA_STAGE,
  skybridgeSprint: SKYBRIDGE_SPRINT_STAGE,
  skyShaftClimb: SKY_SHAFT_CLIMB_STAGE,
  mobileTouchTutorial: MOBILE_TOUCH_TUTORIAL_STAGE,
  nightmareLongrun: NIGHTMARE_LONGRUN_STAGE,
  monsterHouse: MONSTER_HOUSE_STAGE,
  rankingCheck: RANKING_CHECK_STAGE,
};
export type StageId = keyof typeof STAGES;
export const DEFAULT_STAGE_ID = "originalDowntown" satisfies StageId;
const STAGE_ID_ALIASES: Partial<Record<string, StageId>> = {
  neonCanal: "originalDowntown",
};
export const PLAYABLE_STAGE_IDS = [
  "originalDowntown",
  "neoShibuyaCity",
  "mobileTouchTutorial",
  "skybridgeSprint",
  "skyShaftClimb",
  "nightmareLongrun",
  "monsterHouse",
  "rankingCheck",
] as const satisfies readonly StageId[];
export const ACTIVE_STAGE = STAGES[DEFAULT_STAGE_ID];

export const normalizeStageId = (stageId: string): StageId => {
  const aliasedStageId = STAGE_ID_ALIASES[stageId] ?? stageId;
  return aliasedStageId in STAGES ? (aliasedStageId as StageId) : DEFAULT_STAGE_ID;
};

export const cloneStage = (stage: StageDefinition): StageDefinition => ({
  name: typeof stage.name === "string" ? stage.name : { ...stage.name },
  backgrounds: stage.backgrounds ? { ...stage.backgrounds } : undefined,
  storyDialogue: stage.storyDialogue
    ? {
        triggerX: stage.storyDialogue.triggerX,
        closeAtX: stage.storyDialogue.closeAtX,
        stepDelayMs: stage.storyDialogue.stepDelayMs,
        durationMs: stage.storyDialogue.durationMs,
        lines: stage.storyDialogue.lines.map((line) => ({
          characterName: { ...line.characterName },
          message: { ...line.message },
          portraitPath: line.portraitPath,
        })),
      }
    : undefined,
  storyDialogues: stage.storyDialogues?.map((storyDialogue) => ({
    triggerX: storyDialogue.triggerX,
    closeAtX: storyDialogue.closeAtX,
    stepDelayMs: storyDialogue.stepDelayMs,
    durationMs: storyDialogue.durationMs,
    lines: storyDialogue.lines.map((line) => ({
      characterName: { ...line.characterName },
      message: { ...line.message },
      portraitPath: line.portraitPath,
    })),
  })),
  worldWidth: stage.worldWidth,
  worldTop: stage.worldTop,
  worldBottom: stage.worldBottom,
  groundTopY: stage.groundTopY,
  groundVisualY: stage.groundVisualY,
  streetLampGroundY: stage.streetLampGroundY,
  playerStart: { ...stage.playerStart },
  goal: { ...stage.goal },
  platforms: stage.platforms.map((platform) => ({
    ...platform,
    moving: platform.moving ? { ...platform.moving } : undefined,
    spring: platform.spring ? { ...platform.spring } : undefined,
    fragile: platform.fragile ? { ...platform.fragile } : undefined,
  })),
  streetLamps: stage.streetLamps.map((lamp) => ({ ...lamp })),
  decorations: stage.decorations.map((decoration) => ({ ...decoration })),
  items: stage.items.map((item) => ({ ...item })),
  bonusBlocks: (stage.bonusBlocks ?? []).map((block) => ({ ...block })),
  checkpoints: (stage.checkpoints ?? []).map((checkpoint) => ({ ...checkpoint })),
  oneWayGates: (stage.oneWayGates ?? []).map((gate) => ({ ...gate })),
  dashWalls: (stage.dashWalls ?? []).map((wall) => ({ ...wall })),
  missions: (stage.missions ?? []).map((mission) => ({
    ...mission,
    label: { ...mission.label },
  })),
  miniChallenges: (stage.miniChallenges ?? []).map((challenge) => ({
    ...challenge,
    title: { ...challenge.title },
  })),
  enemies: (stage.enemies ?? []).map((enemy) => ({ ...enemy })),
});
