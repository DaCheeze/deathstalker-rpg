/**
 * Auto-generated sample replay bundle from simulator (`--record-samples`).
 * Allows instant replay viewing in browser without local HTTP file server configuration.
 */

import { BattleReplay } from '../sim/simulator';

export const SAMPLE_REPLAYS: Record<string, BattleReplay> = {
  "enc_empire_skirmish_shortest": {
    "seed": 7873199,
    "encounterId": "enc_empire_skirmish",
    "encounterName": "Imperial Perimeter Patrol",
    "encounterTier": "skirmish",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 120,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 80,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ]
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ]
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ]
      }
    ],
    "initialEnemies": [
      {
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "emp_legionnaire_2",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_2",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_2",
        "abilityId": "particle_carbine"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 13,
      "totalRounds": 3.3
    }
  },
  "enc_empire_skirmish_median": {
    "seed": 5972538,
    "encounterId": "enc_empire_skirmish",
    "encounterName": "Imperial Perimeter Patrol",
    "encounterTier": "skirmish",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 120,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 80,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ]
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ]
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ]
      }
    ],
    "initialEnemies": [
      {
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "emp_legionnaire_2",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_2",
        "abilityId": "kinetic_blast"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 15,
      "totalRounds": 3.8
    }
  },
  "enc_empire_skirmish_longest": {
    "seed": 17581,
    "encounterId": "enc_empire_skirmish",
    "encounterName": "Imperial Perimeter Patrol",
    "encounterTier": "skirmish",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 120,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 80,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ]
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ]
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ]
      }
    ],
    "initialEnemies": [
      {
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "emp_legionnaire_2",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "emp_legionnaire_1"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "emp_legionnaire_1"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "physical_shove"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_2",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_valen",
        "targetId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 25,
      "totalRounds": 6.3
    }
  },
  "enc_shub_skirmish_shortest": {
    "seed": 9020041,
    "encounterId": "enc_shub_skirmish",
    "encounterName": "Shub Recon Probe",
    "encounterTier": "skirmish",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 92,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 2,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 70,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 1,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "shub_drone_a_1",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 2,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_b_2",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_c_3",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      }
    ],
    "actions": [
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_b_2"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_2"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_c_3",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_c_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_c_3",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_c_3",
        "abilityId": "vibro_blade"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 10,
      "totalRounds": 2.8
    }
  },
  "enc_shub_skirmish_median": {
    "seed": 6464686,
    "encounterId": "enc_shub_skirmish",
    "encounterName": "Shub Recon Probe",
    "encounterTier": "skirmish",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 2,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 70,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 1,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "shub_drone_a_1",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 2,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_b_2",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_c_3",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      }
    ],
    "actions": [
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_1"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_2"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_b_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_c_3",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_c_3",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_c_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_c_3",
        "abilityId": "particle_carbine"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 12,
      "totalRounds": 3.3
    }
  },
  "enc_shub_skirmish_longest": {
    "seed": 5094283,
    "encounterId": "enc_shub_skirmish",
    "encounterName": "Shub Recon Probe",
    "encounterTier": "skirmish",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 74,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 2,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 76,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 1,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 1,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "shub_drone_a_1",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 2,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_b_2",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_c_3",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      }
    ],
    "actions": [
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_1",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_drone_a_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_b_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_b_2"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_valen",
        "targetId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_c_3"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_c_3",
        "abilityId": "kinetic_blast"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 15,
      "totalRounds": 4
    }
  },
  "enc_empire_patrol_shortest": {
    "seed": 7873199,
    "encounterId": "enc_empire_patrol",
    "encounterName": "Imperial House Patrol",
    "encounterTier": "standard",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 74,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 80,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "emp_legionnaire_2",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "psi_blocker_3",
        "name": "Psi-Blocker Pylon",
        "faction": "empire",
        "role": "Psi-Blocker",
        "stats": {
          "maxHp": 115,
          "hp": 115,
          "maxEsp": 0,
          "esp": 0,
          "attack": 0,
          "defense": 14,
          "speed": 0
        },
        "canBoost": false,
        "disruptorCooldown": 99,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": []
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "psi_blocker_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_lyra",
        "targetId": "psi_blocker_3",
        "abilityId": "vibro_blade"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "psi_blocker_3"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "psi_blocker_3",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_kaelen",
        "targetId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_2",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "emp_legionnaire_2"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_2"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 23,
      "totalRounds": 5.8
    }
  },
  "enc_empire_patrol_median": {
    "seed": 7801495,
    "encounterId": "enc_empire_patrol",
    "encounterName": "Imperial House Patrol",
    "encounterTier": "standard",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 97,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 5,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 80,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 5,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "emp_legionnaire_2",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "psi_blocker_3",
        "name": "Psi-Blocker Pylon",
        "faction": "empire",
        "role": "Psi-Blocker",
        "stats": {
          "maxHp": 115,
          "hp": 115,
          "maxEsp": 0,
          "esp": 0,
          "attack": 0,
          "defense": 14,
          "speed": 0
        },
        "canBoost": false,
        "disruptorCooldown": 99,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": []
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "psi_blocker_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_lyra",
        "targetId": "psi_blocker_3",
        "abilityId": "vibro_blade"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "psi_blocker_3",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "psi_blocker_3",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "psi_blocker_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_2",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen"
      },
      {
        "type": "UseRevive",
        "actorId": "crew_kaelen",
        "targetId": "crew_valen"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_2",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "twin_daggers"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 26,
      "totalRounds": 6.5
    }
  },
  "enc_empire_patrol_longest": {
    "seed": 9968264,
    "encounterId": "enc_empire_patrol",
    "encounterName": "Imperial House Patrol",
    "encounterTier": "standard",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 5,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 80,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 5,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "emp_legionnaire_2",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 175,
          "hp": 175,
          "maxEsp": 0,
          "esp": 0,
          "attack": 22,
          "defense": 13,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ]
      },
      {
        "id": "psi_blocker_3",
        "name": "Psi-Blocker Pylon",
        "faction": "empire",
        "role": "Psi-Blocker",
        "stats": {
          "maxHp": 115,
          "hp": 115,
          "maxEsp": 0,
          "esp": 0,
          "attack": 0,
          "defense": 14,
          "speed": 0
        },
        "canBoost": false,
        "disruptorCooldown": 99,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": []
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "psi_blocker_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_lyra",
        "targetId": "psi_blocker_3",
        "abilityId": "vibro_blade"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "psi_blocker_3",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "psi_blocker_3"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "emp_legionnaire_1"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_valen",
        "targetId": "crew_valen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "UseRevive",
        "actorId": "crew_kaelen",
        "targetId": "crew_valen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Disruptor",
        "actorId": "emp_legionnaire_2",
        "targetId": "crew_valen"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_2",
        "abilityId": "kinetic_blast"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 31,
      "totalRounds": 10.3
    }
  },
  "enc_shub_swarm_shortest": {
    "seed": 4842054,
    "encounterId": "enc_shub_swarm",
    "encounterName": "Shub Outpost Incursion",
    "encounterTier": "standard",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 68,
          "maxEsp": 80,
          "esp": 74,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "shub_drone_a_1",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 2,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_b_2",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_c_3",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_stalker_4",
        "name": "Shub Swarm Stalker",
        "faction": "shub",
        "role": "Rogue AI Hunter-Killer",
        "stats": {
          "maxHp": 145,
          "hp": 145,
          "maxEsp": 0,
          "esp": 0,
          "attack": 23,
          "defense": 11,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 8,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine",
          "plasma_burst"
        ]
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_1"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_valen",
        "targetId": "crew_lyra"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_1",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_c_3",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_drone_c_3"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_b_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_stalker_4",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_stalker_4",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_stalker_4",
        "abilityId": "particle_carbine"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 23,
      "totalRounds": 7.7
    }
  },
  "enc_shub_swarm_median": {
    "seed": 4733428,
    "encounterId": "enc_shub_swarm",
    "encounterName": "Shub Outpost Incursion",
    "encounterTier": "standard",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 76,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 3,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 55,
          "maxEsp": 80,
          "esp": 80,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 1,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "shub_drone_a_1",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 2,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_b_2",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_c_3",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_stalker_4",
        "name": "Shub Swarm Stalker",
        "faction": "shub",
        "role": "Rogue AI Hunter-Killer",
        "stats": {
          "maxHp": 145,
          "hp": 145,
          "maxEsp": 0,
          "esp": 0,
          "attack": 23,
          "defense": 11,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 8,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine",
          "plasma_burst"
        ]
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "UseRevive",
        "actorId": "crew_valen",
        "targetId": "crew_lyra"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_1",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_2"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_b_2",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_c_3",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_c_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_tarek",
        "targetId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_c_3",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_stalker_4",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_kaelen",
        "targetId": "crew_valen"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "shub_stalker_4"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 30,
      "totalRounds": 10
    }
  },
  "enc_shub_swarm_longest": {
    "seed": 369488,
    "encounterId": "enc_shub_swarm",
    "encounterName": "Shub Outpost Incursion",
    "encounterTier": "standard",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 74,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 3,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 74,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "shub_drone_a_1",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 2,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_b_2",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_drone_c_3",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 135,
          "hp": 135,
          "maxEsp": 0,
          "esp": 0,
          "attack": 20,
          "defense": 10,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine"
        ]
      },
      {
        "id": "shub_stalker_4",
        "name": "Shub Swarm Stalker",
        "faction": "shub",
        "role": "Rogue AI Hunter-Killer",
        "stats": {
          "maxHp": 145,
          "hp": 145,
          "maxEsp": 0,
          "esp": 0,
          "attack": 23,
          "defense": 11,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 8,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "particle_carbine",
          "plasma_burst"
        ]
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_1"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_1",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "UseMedkit",
        "actorId": "crew_valen",
        "targetId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_1",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_c_3",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_c_3",
        "abilityId": "scatter_shot"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_c_3",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_3",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "UseRevive",
        "actorId": "crew_kaelen",
        "targetId": "crew_valen"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_c_3",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Disruptor",
        "actorId": "shub_drone_b_2",
        "targetId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_b_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_stalker_4",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_4",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "shub_stalker_4"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 36,
      "totalRounds": 12.3
    }
  },
  "enc_hadenman_vanguard_shortest": {
    "seed": 9693436,
    "encounterId": "enc_hadenman_vanguard",
    "encounterName": "Hadenman Incursion",
    "encounterTier": "elite",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 5,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 85,
          "maxEsp": 80,
          "esp": 64,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 2,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 1,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "haden_decimator_1",
        "name": "Hadenman Decimator",
        "faction": "hadenman",
        "role": "Augmented Dreadnought",
        "stats": {
          "maxHp": 165,
          "hp": 165,
          "maxEsp": 0,
          "esp": 0,
          "attack": 45,
          "defense": 18,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "heavy_smash",
          "plasma_burst"
        ]
      },
      {
        "id": "haden_enforcer_2",
        "name": "Hadenman Enforcer",
        "faction": "hadenman",
        "role": "Augmented Vanguard",
        "stats": {
          "maxHp": 145,
          "hp": 145,
          "maxEsp": 0,
          "esp": 0,
          "attack": 41,
          "defense": 16,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "heavy_smash"
        ]
      }
    ],
    "actions": [
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "haden_enforcer_2"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_enforcer_2",
        "abilityId": "mind_flay"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_lyra"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "haden_decimator_1"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 8,
      "totalRounds": 2.3
    }
  },
  "enc_hadenman_vanguard_median": {
    "seed": 369488,
    "encounterId": "enc_hadenman_vanguard",
    "encounterName": "Hadenman Incursion",
    "encounterTier": "elite",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 0,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 30,
          "maxEsp": 80,
          "esp": 68,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 1,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 90,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 6,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "haden_decimator_1",
        "name": "Hadenman Decimator",
        "faction": "hadenman",
        "role": "Augmented Dreadnought",
        "stats": {
          "maxHp": 165,
          "hp": 165,
          "maxEsp": 0,
          "esp": 0,
          "attack": 45,
          "defense": 18,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "heavy_smash",
          "plasma_burst"
        ]
      },
      {
        "id": "haden_enforcer_2",
        "name": "Hadenman Enforcer",
        "faction": "hadenman",
        "role": "Augmented Vanguard",
        "stats": {
          "maxHp": 145,
          "hp": 145,
          "maxEsp": 0,
          "esp": 0,
          "attack": 41,
          "defense": 16,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "heavy_smash"
        ]
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_1",
        "abilityId": "mind_flay"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_2",
        "targetId": "crew_lyra",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_enforcer_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_2",
        "targetId": "crew_kaelen",
        "abilityId": "heavy_smash"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_enforcer_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_2",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_enforcer_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_enforcer_2",
        "targetId": "crew_kaelen"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_enforcer_2",
        "abilityId": "particle_carbine"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 13,
      "totalRounds": 14
    }
  },
  "enc_hadenman_vanguard_longest": {
    "seed": 2791905,
    "encounterId": "enc_hadenman_vanguard",
    "encounterName": "Hadenman Incursion",
    "encounterTier": "elite",
    "initialParty": [
      {
        "id": "crew_valen",
        "name": "Valen Vance",
        "faction": "party",
        "role": "Captain / Striker",
        "stats": {
          "maxHp": 120,
          "hp": 99,
          "maxEsp": 0,
          "esp": 0,
          "attack": 30,
          "defense": 14,
          "speed": 15
        },
        "canBoost": true,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 2,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "particle_carbine"
        ],
        "displayName": "Valen Vance",
        "accentColor": "#38bdf8",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_lyra",
        "name": "Lyra Chen",
        "faction": "party",
        "role": "Sole Esper",
        "stats": {
          "maxHp": 85,
          "hp": 0,
          "maxEsp": 80,
          "esp": 74,
          "attack": 18,
          "defense": 10,
          "speed": 17
        },
        "canBoost": false,
        "disruptorCooldown": 4,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "mind_flay",
          "kinetic_blast",
          "neural_static"
        ],
        "displayName": "Lyra Chen",
        "accentColor": "#c084fc",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_kaelen",
        "name": "Kaelen Voss",
        "faction": "party",
        "role": "Mercenary Striker",
        "stats": {
          "maxHp": 90,
          "hp": 59,
          "maxEsp": 0,
          "esp": 0,
          "attack": 32,
          "defense": 11,
          "speed": 18
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "twin_daggers",
          "physical_shove",
          "particle_carbine"
        ],
        "displayName": "Kaelen Voss",
        "accentColor": "#fb923c",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      },
      {
        "id": "crew_tarek",
        "name": "Tarek 'Sprocket'",
        "faction": "party",
        "role": "Heavy Tech Marine",
        "stats": {
          "maxHp": 140,
          "hp": 140,
          "maxEsp": 0,
          "esp": 0,
          "attack": 44,
          "defense": 18,
          "speed": 12
        },
        "canBoost": false,
        "disruptorCooldown": 0,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "scatter_shot",
          "particle_carbine"
        ],
        "displayName": "Tarek 'Sprocket'",
        "accentColor": "#4ade80",
        "statModifiers": [],
        "enteredBoostThisTurn": false
      }
    ],
    "initialEnemies": [
      {
        "id": "haden_decimator_1",
        "name": "Hadenman Decimator",
        "faction": "hadenman",
        "role": "Augmented Dreadnought",
        "stats": {
          "maxHp": 165,
          "hp": 165,
          "maxEsp": 0,
          "esp": 0,
          "attack": 45,
          "defense": 18,
          "speed": 15
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "heavy_smash",
          "plasma_burst"
        ]
      },
      {
        "id": "haden_enforcer_2",
        "name": "Hadenman Enforcer",
        "faction": "hadenman",
        "role": "Augmented Vanguard",
        "stats": {
          "maxHp": 145,
          "hp": 145,
          "maxEsp": 0,
          "esp": 0,
          "attack": 41,
          "defense": 16,
          "speed": 16
        },
        "canBoost": false,
        "disruptorCooldown": 3,
        "isBoosting": false,
        "burnout": 0,
        "crashTurns": 0,
        "turnsSpentBoosting": 0,
        "hasForceShield": false,
        "stunnedTurns": 0,
        "abilityIds": [
          "vibro_blade",
          "heavy_smash"
        ]
      }
    ],
    "actions": [
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "haden_enforcer_2"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_2",
        "targetId": "crew_valen",
        "abilityId": "heavy_smash"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "haden_decimator_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "haden_enforcer_2"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_decimator_1",
        "targetId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "haden_decimator_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "RaiseShield",
        "actorId": "haden_decimator_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "RaiseShield",
        "actorId": "haden_decimator_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "RaiseShield",
        "actorId": "haden_decimator_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "RaiseShield",
        "actorId": "haden_decimator_1"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_decimator_1",
        "targetId": "crew_tarek"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_1",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      }
    ],
    "summary": {
      "winner": "enemies",
      "totalActions": 33,
      "totalRounds": 33
    }
  }
};
