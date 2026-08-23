class_name CombatAudioReviewCatalog
extends RefCounted

## Presentation-only catalog and deterministic review order. Cue identities and
## synthesis remain owned by the live production procedural audio script.

const VARIATION_COUNT := 6
const DRY_GAP_SECONDS := 0.40
const FAMILY_GAP_SECONDS := 0.85
const DEFAULT_OUTPUT_DB := -9.0

const CUES: Array[Dictionary] = [
	{
		"id": &"vibro_blade",
		"name": "VIBRO-BLADE",
		"key": "1",
		"summary": "One broad accelerating cut and steel/body contact",
		"prompt": "Listen for a physical military-steel strike first, with a short unstable edge residue second.",
		"avoid": "Avoid: sawtooth motor dominance, melodic ring, or lightsaber-like sustain.",
	},
	{
		"id": &"twin_vibro_daggers",
		"name": "TWIN VIBRO-DAGGERS",
		"key": "2",
		"summary": "Two unequal opposed contacts with a measured notch",
		"prompt": "Listen for two lighter edges 60 ms apart; the second contact should provide the punctuation.",
		"avoid": "Avoid: one generic slash, metronomic equality, or two identical pings.",
	},
	{
		"id": &"heavy_smash",
		"name": "HEAVY SMASH",
		"key": "3",
		"summary": "Cybernetic mass through armor and deck plating",
		"prompt": "Listen for weight carried by low-mid crushing body so the move remains legible on ordinary speakers.",
		"avoid": "Avoid: sub-bass as the entire sound, sword ring, or a bright laser crack.",
	},
	{
		"id": &"concussive_shove",
		"name": "CONCUSSIVE SHOVE",
		"key": "4",
		"summary": "Compact body contact followed by outward pressure",
		"prompt": "Listen for momentum transfer and a short expanding consequence, distinct from penetration or crushing mass.",
		"avoid": "Avoid: explosion, firearm crack, or a pitch-shifted Heavy Smash.",
	},
	{
		"id": &"disruptor",
		"name": "DISRUPTOR",
		"key": "5",
		"summary": "Restrained charge, narrow beam, compact field failure",
		"prompt": "Listen for structural contrast: restraint, a narrow event, then the catastrophic contact at 460 ms.",
		"avoid": "Avoid: wall-of-noise beam, full-length giant sub, or a repeated laser note.",
	},
	{
		"id": &"shield_raise",
		"name": "FORCE SHIELD",
		"key": "6",
		"summary": "Stressed electrical rise resolves into containment",
		"prompt": "Listen for a continuous rising field texture that settles into one stable lock at 240 ms.",
		"avoid": "Avoid: attack impact, alarm pulse, long musical chord, or weapon-like crack.",
	},
	{
		"id": &"psionic",
		"name": "PSIONICS",
		"key": "7",
		"summary": "Internal pressure and phase-air movement",
		"prompt": "Listen for nonmechanical pressure gathering inside the stereo field, then releasing at 320 ms.",
		"avoid": "Avoid: laser, projectile whoosh, electric gun, or generic magic sparkle.",
	},
	{
		"id": &"particle",
		"name": "PARTICLE CARBINE",
		"key": "8",
		"summary": "Three dry contained packets and compact ion contact",
		"prompt": "Listen for separated hard launches with tiny unstable residues, then one compact contact at 250 ms.",
		"avoid": "Avoid: one smooth energy sweep, plasma-like containment pressure, or a generic laser chirp.",
	},
	{
		"id": &"ballistic_scatter",
		"name": "SCATTER SHOT",
		"key": "9",
		"summary": "Immediate kinetic crack and uneven surface strikes",
		"prompt": "Listen for the routine ranged peak apex: a dry crack/body followed by four unequal contacts at 210 ms.",
		"avoid": "Avoid: energy zap, long boom, or evenly repeated pellets.",
	},
	{
		"id": &"plasma",
		"name": "PLASMA BURST",
		"key": "0",
		"summary": "Containment stress, dense hot release, short sputter",
		"prompt": "Listen for audible pre-contact instability, a viscous release at 250 ms, and a brief cooling tail.",
		"avoid": "Avoid: clean pitch sweep, ballistic crack, or Particle Carbine packets with a lower pitch.",
	},
]


static func cue_ids() -> Array[StringName]:
	var ids: Array[StringName] = []
	for definition in CUES:
		ids.append(definition["id"] as StringName)
	return ids


static func definition(cue_index: int) -> Dictionary:
	if cue_index < 0 or cue_index >= CUES.size():
		return {}
	return CUES[cue_index]


static func cue_index(cue_id: StringName) -> int:
	for index in CUES.size():
		if CUES[index]["id"] as StringName == cue_id:
			return index
	return -1


static func single_cue_plan(cue_index_value: int) -> Array[Dictionary]:
	var plan: Array[Dictionary] = []
	if cue_index_value < 0 or cue_index_value >= CUES.size():
		return plan
	for variation_index in VARIATION_COUNT:
		plan.append({
			"cue_index": cue_index_value,
			"variation_index": variation_index,
			"gap_seconds": 0.0 if variation_index == VARIATION_COUNT - 1 else DRY_GAP_SECONDS,
		})
	return plan


static func full_matrix_plan() -> Array[Dictionary]:
	var plan: Array[Dictionary] = []
	for cue_index_value in CUES.size():
		for variation_index in VARIATION_COUNT:
			var is_last_variation := variation_index == VARIATION_COUNT - 1
			var is_last_cue := cue_index_value == CUES.size() - 1
			var gap_seconds := DRY_GAP_SECONDS
			if is_last_variation:
				gap_seconds = 0.0 if is_last_cue else FAMILY_GAP_SECONDS
			plan.append({
				"cue_index": cue_index_value,
				"variation_index": variation_index,
				"gap_seconds": gap_seconds,
			})
	return plan
