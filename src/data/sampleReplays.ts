/**
 * Auto-generated sample replay bundle from simulator (`--record-samples`).
 * Allows instant replay viewing in browser without local HTTP file server configuration.
 */

import { BattleReplay } from '../sim/simulator';

export const SAMPLE_REPLAYS: Record<string, BattleReplay> = {
  "enc_empire_skirmish_shortest": {
    "seed": 12345,
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
        "id": "emp_legionnaire_0",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "targetId": "emp_legionnaire_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
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
        "targetId": "emp_legionnaire_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_valen",
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
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "physical_shove"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 14,
      "totalRounds": 2.7
    }
  },
  "enc_empire_skirmish_median": {
    "seed": 12345,
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
        "id": "emp_legionnaire_0",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "targetId": "emp_legionnaire_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
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
        "targetId": "emp_legionnaire_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_valen",
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
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "physical_shove"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 16,
      "totalRounds": 2.5
    }
  },
  "enc_empire_skirmish_longest": {
    "seed": 12345,
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
        "id": "emp_legionnaire_0",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "targetId": "emp_legionnaire_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
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
        "targetId": "emp_legionnaire_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "emp_legionnaire_0"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
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
        "targetId": "emp_legionnaire_0",
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
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "emp_legionnaire_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_0",
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
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_lyra",
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
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_lyra"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 22,
      "totalRounds": 4
    }
  },
  "enc_shub_skirmish_shortest": {
    "seed": 12345,
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
        "id": "shub_drone_a_0",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_b_1",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_b_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_b_1",
        "abilityId": "kinetic_blast"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 8,
      "totalRounds": 1.5
    }
  },
  "enc_shub_skirmish_median": {
    "seed": 12345,
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
        "id": "shub_drone_a_0",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_b_1",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_0",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_a_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_b_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_1",
        "abilityId": "twin_daggers"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 12,
      "totalRounds": 2
    }
  },
  "enc_shub_skirmish_longest": {
    "seed": 12345,
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
        "id": "shub_drone_a_0",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_b_1",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
      }
    ],
    "actions": [
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_0",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_a_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_b_1",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_b_1",
        "abilityId": "particle_carbine"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 13,
      "totalRounds": 2
    }
  },
  "enc_empire_patrol_shortest": {
    "seed": 12345,
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
        "id": "emp_legionnaire_0",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "psi_blocker_2",
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
        "targetId": "psi_blocker_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_lyra",
        "targetId": "psi_blocker_2",
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
        "targetId": "psi_blocker_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_valen",
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
        "actorId": "crew_tarek",
        "targetId": "psi_blocker_2",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "psi_blocker_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_kaelen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_1"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 17,
      "totalRounds": 2.7
    }
  },
  "enc_empire_patrol_median": {
    "seed": 12345,
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
        "id": "emp_legionnaire_0",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "psi_blocker_2",
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
        "targetId": "psi_blocker_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_lyra",
        "targetId": "psi_blocker_2",
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
        "targetId": "psi_blocker_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_valen",
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
        "actorId": "crew_tarek",
        "targetId": "psi_blocker_2",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "psi_blocker_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "physical_shove"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_kaelen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "emp_legionnaire_0"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_valen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_1",
        "abilityId": "physical_shove"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_1"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 23,
      "totalRounds": 4
    }
  },
  "enc_empire_patrol_longest": {
    "seed": 12345,
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
        "id": "emp_legionnaire_0",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "emp_legionnaire_1",
        "name": "Imperial Legionnaire",
        "faction": "empire",
        "role": "Standard Line Infantry",
        "stats": {
          "maxHp": 182,
          "hp": 182,
          "maxEsp": 0,
          "esp": 0,
          "attack": 49,
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
        "id": "psi_blocker_2",
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
        "targetId": "psi_blocker_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_lyra",
        "targetId": "psi_blocker_2",
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
        "targetId": "psi_blocker_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_valen",
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
        "actorId": "crew_tarek",
        "targetId": "psi_blocker_2",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "psi_blocker_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "emp_legionnaire_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_lyra",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "emp_legionnaire_0",
        "abilityId": "physical_shove"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_kaelen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_kaelen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_0",
        "targetId": "crew_kaelen",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_0"
      },
      {
        "type": "Disruptor",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_kaelen"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek",
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
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek",
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
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "emp_legionnaire_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "RaiseShield",
        "actorId": "emp_legionnaire_1"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek",
        "abilityId": "vibro_blade"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "emp_legionnaire_1",
        "targetId": "crew_tarek"
      }
    ],
    "summary": {
      "winner": "enemies",
      "totalActions": 39,
      "totalRounds": 12
    }
  },
  "enc_shub_swarm_shortest": {
    "seed": 12345,
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
        "id": "shub_drone_a_0",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_b_1",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_c_2",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_stalker_3",
        "name": "Shub Swarm Stalker",
        "faction": "shub",
        "role": "Rogue AI Hunter-Killer",
        "stats": {
          "maxHp": 158,
          "hp": 158,
          "maxEsp": 0,
          "esp": 0,
          "attack": 29,
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
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_0",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_a_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_0",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_b_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_c_2",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_c_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_c_2",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_stalker_3"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 18,
      "totalRounds": 2.7
    }
  },
  "enc_shub_swarm_median": {
    "seed": 12345,
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
        "id": "shub_drone_a_0",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_b_1",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_c_2",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_stalker_3",
        "name": "Shub Swarm Stalker",
        "faction": "shub",
        "role": "Rogue AI Hunter-Killer",
        "stats": {
          "maxHp": 158,
          "hp": 158,
          "maxEsp": 0,
          "esp": 0,
          "attack": 29,
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
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_0",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_a_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_0",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
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
        "targetId": "shub_drone_b_1",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_drone_c_2"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_stalker_3",
        "abilityId": "particle_carbine"
      },
      {
        "type": "PassTurn",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "shub_stalker_3"
      }
    ],
    "summary": {
      "winner": "party",
      "totalActions": 25,
      "totalRounds": 4
    }
  },
  "enc_shub_swarm_longest": {
    "seed": 12345,
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
        "id": "shub_drone_a_0",
        "name": "Shub Drone Alpha",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_b_1",
        "name": "Shub Drone Beta",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_drone_c_2",
        "name": "Shub Drone Gamma",
        "faction": "shub",
        "role": "Rogue AI Swarm Unit",
        "stats": {
          "maxHp": 126,
          "hp": 126,
          "maxEsp": 0,
          "esp": 0,
          "attack": 25,
          "defense": 9,
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
        "id": "shub_stalker_3",
        "name": "Shub Swarm Stalker",
        "faction": "shub",
        "role": "Rogue AI Hunter-Killer",
        "stats": {
          "maxHp": 158,
          "hp": 158,
          "maxEsp": 0,
          "esp": 0,
          "attack": 29,
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
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "shub_drone_a_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_a_0",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_lyra",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "ToggleBoost",
        "actorId": "crew_valen",
        "enable": true
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_a_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_a_0",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "shub_drone_a_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
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
        "targetId": "shub_drone_b_1",
        "abilityId": "scatter_shot"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_b_1",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_kaelen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "shub_drone_b_1"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_c_2",
        "abilityId": "particle_carbine"
      },
      {
        "type": "PassTurn",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "shub_drone_c_2",
        "targetId": "crew_valen",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "shub_drone_c_2"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "shub_stalker_3",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "shub_stalker_3",
        "targetId": "crew_tarek"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "shub_stalker_3",
        "targetId": "crew_tarek",
        "abilityId": "plasma_burst"
      }
    ],
    "summary": {
      "winner": "enemies",
      "totalActions": 39,
      "totalRounds": 9
    }
  },
  "enc_hadenman_vanguard_shortest": {
    "seed": 12345,
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
        "id": "haden_decimator_0",
        "name": "Hadenman Decimator",
        "faction": "hadenman",
        "role": "Augmented Dreadnought",
        "stats": {
          "maxHp": 250,
          "hp": 250,
          "maxEsp": 0,
          "esp": 0,
          "attack": 45,
          "defense": 20,
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
        "id": "haden_enforcer_1",
        "name": "Hadenman Enforcer",
        "faction": "hadenman",
        "role": "Augmented Vanguard",
        "stats": {
          "maxHp": 230,
          "hp": 230,
          "maxEsp": 0,
          "esp": 0,
          "attack": 41,
          "defense": 18,
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
        "targetId": "haden_decimator_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_0",
        "abilityId": "mind_flay"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
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
        "targetId": "haden_decimator_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_0",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_lyra",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_0",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_kaelen",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_0",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek"
      }
    ],
    "summary": {
      "winner": "enemies",
      "totalActions": 17,
      "totalRounds": 3
    }
  },
  "enc_hadenman_vanguard_median": {
    "seed": 12345,
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
        "id": "haden_decimator_0",
        "name": "Hadenman Decimator",
        "faction": "hadenman",
        "role": "Augmented Dreadnought",
        "stats": {
          "maxHp": 250,
          "hp": 250,
          "maxEsp": 0,
          "esp": 0,
          "attack": 45,
          "defense": 20,
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
        "id": "haden_enforcer_1",
        "name": "Hadenman Enforcer",
        "faction": "hadenman",
        "role": "Augmented Vanguard",
        "stats": {
          "maxHp": 230,
          "hp": 230,
          "maxEsp": 0,
          "esp": 0,
          "attack": 41,
          "defense": 18,
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
        "targetId": "haden_decimator_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_0",
        "abilityId": "mind_flay"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
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
        "targetId": "haden_decimator_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_0",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_lyra",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_0",
        "targetId": "crew_lyra",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_0",
        "abilityId": "physical_shove"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_kaelen",
        "abilityId": "heavy_smash"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_kaelen"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "RaiseShield",
        "actorId": "haden_decimator_0"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_decimator_0",
        "targetId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      }
    ],
    "summary": {
      "winner": "enemies",
      "totalActions": 23,
      "totalRounds": 4.5
    }
  },
  "enc_hadenman_vanguard_longest": {
    "seed": 12345,
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
        "id": "haden_decimator_0",
        "name": "Hadenman Decimator",
        "faction": "hadenman",
        "role": "Augmented Dreadnought",
        "stats": {
          "maxHp": 250,
          "hp": 250,
          "maxEsp": 0,
          "esp": 0,
          "attack": 45,
          "defense": 20,
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
        "id": "haden_enforcer_1",
        "name": "Hadenman Enforcer",
        "faction": "hadenman",
        "role": "Augmented Vanguard",
        "stats": {
          "maxHp": 230,
          "hp": 230,
          "maxEsp": 0,
          "esp": 0,
          "attack": 41,
          "defense": 18,
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
        "targetId": "haden_decimator_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_0",
        "abilityId": "mind_flay"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
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
        "targetId": "haden_decimator_0",
        "abilityId": "vibro_blade"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_0",
        "targetId": "crew_valen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_0",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_decimator_0",
        "abilityId": "twin_daggers"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_0",
        "abilityId": "kinetic_blast"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_valen"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_lyra",
        "abilityId": "heavy_smash"
      },
      {
        "type": "RaiseShield",
        "actorId": "haden_decimator_0"
      },
      {
        "type": "Attack",
        "actorId": "crew_kaelen",
        "targetId": "haden_enforcer_1",
        "abilityId": "twin_daggers"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_enforcer_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "crew_valen",
        "targetId": "haden_enforcer_1",
        "abilityId": "vibro_blade"
      },
      {
        "type": "EsperAbility",
        "actorId": "crew_lyra",
        "targetId": "haden_decimator_0",
        "abilityId": "mind_flay"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_lyra",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "haden_decimator_0",
        "targetId": "crew_kaelen",
        "abilityId": "plasma_burst"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_valen",
        "targetId": "haden_decimator_0"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_kaelen"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_valen"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_decimator_0",
        "targetId": "crew_kaelen"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Disruptor",
        "actorId": "crew_tarek",
        "targetId": "haden_decimator_0"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "crew_tarek",
        "targetId": "haden_enforcer_1",
        "abilityId": "particle_carbine"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Attack",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek",
        "abilityId": "heavy_smash"
      },
      {
        "type": "RaiseShield",
        "actorId": "crew_tarek"
      },
      {
        "type": "Disruptor",
        "actorId": "haden_enforcer_1",
        "targetId": "crew_tarek"
      }
    ],
    "summary": {
      "winner": "enemies",
      "totalActions": 35,
      "totalRounds": 9
    }
  }
};
