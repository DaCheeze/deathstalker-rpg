extends RefCounted

## Strict runtime validator for presentation-bridge-v1.schema.json. This loader
## validates renderer inputs and pre-resolved audio routing only; it never resolves
## combat, chooses audio cues, or runs AI.

const FORMAT := "deathstalker-godot-presentation-bridge"
const SCHEMA_VERSION := 1
const GENERATOR := "scripts/export-godot-presentation.ts"

const VALID_TIERS := ["skirmish", "standard", "elite", "boss"]
const VALID_MODES := ["legacy", "range_band_prototype"]
const VALID_STATUSES := ["in_progress", "victory", "defeat"]
const VALID_SIDES := ["party", "enemy"]
const VALID_FACTIONS := ["party", "empire", "shub", "hadenman"]
const VALID_BANDS := ["ranged", "closing", "engaged"]
const VALID_ACTIONS := [
	"attack",
	"disruptor",
	"advance",
	"raise_shield",
	"toggle_boost",
	"esper_ability",
	"use_medkit",
	"use_revive",
	"pass_turn"
]
const VALID_ABILITY_CATEGORIES := ["melee", "projectile", "disruptor", "esper", "defense", "stance"]
const VALID_EVENTS := [
	"damage",
	"shield_raised",
	"boost_changed",
	"boost_crashed",
	"burnout_damage",
	"burnout_stunned",
	"item_used",
	"revived",
	"turn_displaced",
	"status_applied",
	"disruptor_cooldown",
	"range_changed",
	"disruptor_interrupt",
	"turn_started",
	"turn_ended",
	"battle_ended"
]
const VALID_AUDIO_CUES := [
	"blade",
	"blunt",
	"vibro_blade",
	"twin_vibro_daggers",
	"heavy_smash",
	"concussive_shove",
	"ballistic",
	"ballistic_scatter",
	"particle",
	"plasma",
	"laser",
	"psionic",
	"disruptor",
	"shield_raise",
	"boost_enter",
	"boost_exit",
	"shield_shatter",
	"critical_hit",
	"death",
	"burnout_damage",
	"boost_crash",
	"victory",
	"defeat"
]

var _errors := PackedStringArray()


func load_and_validate(path: String) -> Dictionary:
	_errors = PackedStringArray()
	if not FileAccess.file_exists(path):
		_fail(path, "file does not exist")
		_report_errors()
		return {}

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_fail(path, "could not be opened")
		_report_errors()
		return {}

	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		_fail("$", "root must be a JSON object")
		_report_errors()
		return {}

	var document := parsed as Dictionary
	if not validate_document(document):
		_report_errors()
		return {}

	return document


func validate_document(document: Dictionary) -> bool:
	_errors = PackedStringArray()
	_validate_document(document)
	return _errors.is_empty()


func get_errors() -> PackedStringArray:
	return _errors.duplicate()


func validate_live_transition(encounter: Dictionary, transition: Dictionary) -> bool:
	_errors = PackedStringArray()
	_validate_keys(transition, ["action", "state"], ["action", "state"], "$.transition")
	_validate_encounter(encounter)
	var encounter_id := _string(encounter.get("id"), "$.encounter.id")
	var state := _dictionary(transition.get("state"), "$.transition.state")
	var ids := _validate_state(state, "$.transition.state", encounter_id)
	var action_value: Variant = transition.get("action")
	if action_value != null:
		if typeof(action_value) != TYPE_DICTIONARY:
			_fail("$.transition.action", "must be null or an object")
		else:
			var action := action_value as Dictionary
			var timing := action.get("timing", {}) as Dictionary
			var duration := maxf(0.001, float(timing.get("durationSeconds", 0.0)))
			_validate_action(action, "$.transition.action", ids, duration)
	return _errors.is_empty()


func _validate_document(document: Dictionary) -> void:
	_validate_keys(
		document,
		["format", "schemaVersion", "source", "encounter", "timing", "frames"],
		["format", "schemaVersion", "source", "encounter", "timing", "frames"],
		"$"
	)
	if _string(document.get("format"), "$.format") != FORMAT:
		_fail("$.format", "unsupported bridge format")
	if _integer(document.get("schemaVersion"), "$.schemaVersion") != SCHEMA_VERSION:
		_fail("$.schemaVersion", "unsupported schema version; expected %d" % SCHEMA_VERSION)

	_validate_source(_dictionary(document.get("source"), "$.source"))
	var encounter := _dictionary(document.get("encounter"), "$.encounter")
	_validate_encounter(encounter)
	var encounter_id := _string(encounter.get("id"), "$.encounter.id")
	var timing := _dictionary(document.get("timing"), "$.timing")
	_validate_timing(timing)
	var frame_step := _number(timing.get("frameStepSeconds"), "$.timing.frameStepSeconds")

	var frames := _array(document.get("frames"), "$.frames")
	if frames.is_empty():
		_fail("$.frames", "must contain at least one frame")
		return

	var expected_ids: Array[String] = []
	var previous_at := -1.0
	var previous_turn := 0
	for frame_index in frames.size():
		var path := "$.frames[%d]" % frame_index
		var frame := _dictionary(frames[frame_index], path)
		_validate_keys(frame, ["index", "atSeconds", "action", "state"], ["index", "atSeconds", "action", "state"], path)
		if _integer(frame.get("index"), path + ".index") != frame_index:
			_fail(path + ".index", "must be contiguous and equal to its array index")
		var at_seconds := _number(frame.get("atSeconds"), path + ".atSeconds")
		if frame_index == 0 and not is_equal_approx(at_seconds, 0.0):
			_fail(path + ".atSeconds", "first frame must begin at 0")
		if frame_index > 0 and at_seconds <= previous_at:
			_fail(path + ".atSeconds", "must increase strictly")
		if not is_equal_approx(at_seconds, float(frame_index) * frame_step):
			_fail(path + ".atSeconds", "must equal index * frameStepSeconds")
		previous_at = at_seconds

		var state := _dictionary(frame.get("state"), path + ".state")
		var ids := _validate_state(state, path + ".state", encounter_id)
		if frame_index == 0:
			expected_ids = ids
		elif ids != expected_ids:
			_fail(path + ".state.combatants", "combatant IDs/order must remain stable across frames")
		var turn_number := _integer(state.get("turnNumber"), path + ".state.turnNumber")
		if frame_index > 0 and turn_number < previous_turn:
			_fail(path + ".state.turnNumber", "cannot move backwards")
		previous_turn = turn_number

		var action_value: Variant = frame.get("action")
		if frame_index == 0:
			if action_value != null:
				_fail(path + ".action", "initial frame action must be null")
		elif typeof(action_value) != TYPE_DICTIONARY:
			_fail(path + ".action", "transition frames require an action object")
		else:
			_validate_action(action_value as Dictionary, path + ".action", ids, frame_step)

	var end_hold := _number(timing.get("endHoldSeconds"), "$.timing.endHoldSeconds")
	var duration := _number(timing.get("durationSeconds"), "$.timing.durationSeconds")
	if not is_equal_approx(duration, previous_at + end_hold):
		_fail("$.timing.durationSeconds", "must equal the last frame time plus endHoldSeconds")
	var last_frame := frames[frames.size() - 1] as Dictionary
	var last_action_value: Variant = last_frame.get("action")
	if typeof(last_action_value) == TYPE_DICTIONARY:
		var last_action := last_action_value as Dictionary
		var last_timing := last_action.get("timing", {}) as Dictionary
		if float(last_timing.get("durationSeconds", 0.0)) > end_hold:
			_fail("$.frames[%d].action.timing.durationSeconds" % (frames.size() - 1), "cannot exceed document endHoldSeconds")


func _validate_source(source: Dictionary) -> void:
	_validate_keys(
		source,
		["authoritativeRuntime", "generator", "fixtureId", "seed"],
		["authoritativeRuntime", "generator", "fixtureId", "seed"],
		"$.source"
	)
	if _string(source.get("authoritativeRuntime"), "$.source.authoritativeRuntime") != "typescript-core":
		_fail("$.source.authoritativeRuntime", "must be 'typescript-core'")
	if _string(source.get("generator"), "$.source.generator") != GENERATOR:
		_fail("$.source.generator", "must identify the canonical exporter")
	_nonempty_string(source.get("fixtureId"), "$.source.fixtureId")
	_safe_integer(source.get("seed"), "$.source.seed")


func _validate_encounter(encounter: Dictionary) -> void:
	_validate_keys(encounter, ["id", "name", "tier", "environment"], ["id", "name", "tier", "environment"], "$.encounter")
	_nonempty_string(encounter.get("id"), "$.encounter.id")
	_nonempty_string(encounter.get("name"), "$.encounter.name")
	_enum_string(encounter.get("tier"), VALID_TIERS, "$.encounter.tier")

	var environment := _dictionary(encounter.get("environment"), "$.encounter.environment")
	var environment_keys := [
		"type",
		"lightSourceX",
		"lightSourceY",
		"lightColor",
		"floorTint",
		"hazeColor",
		"stoneColor",
		"metalColor",
		"shadowColor",
		"accentColor"
	]
	_validate_keys(environment, environment_keys, environment_keys, "$.encounter.environment")
	_nonempty_string(environment.get("type"), "$.encounter.environment.type")
	_unit_number(environment.get("lightSourceX"), "$.encounter.environment.lightSourceX")
	_unit_number(environment.get("lightSourceY"), "$.encounter.environment.lightSourceY")
	for key in ["lightColor", "floorTint", "hazeColor", "stoneColor", "metalColor", "shadowColor", "accentColor"]:
		_nonempty_string(environment.get(key), "$.encounter.environment.%s" % key)


func _validate_timing(timing: Dictionary) -> void:
	var keys := ["frameStepSeconds", "endHoldSeconds", "durationSeconds"]
	_validate_keys(timing, keys, keys, "$.timing")
	_positive_number(timing.get("frameStepSeconds"), "$.timing.frameStepSeconds")
	_nonnegative_number(timing.get("endHoldSeconds"), "$.timing.endHoldSeconds")
	_positive_number(timing.get("durationSeconds"), "$.timing.durationSeconds")


func _validate_state(state: Dictionary, path: String, encounter_id: String) -> Array[String]:
	var keys := [
		"encounterId",
		"battleMode",
		"turnNumber",
		"activeActorId",
		"status",
		"inventory",
		"combatants",
		"turnQueue",
		"events"
	]
	_validate_keys(state, keys, keys, path)
	if _string(state.get("encounterId"), path + ".encounterId") != encounter_id:
		_fail(path + ".encounterId", "must match the document encounter")
	_enum_string(state.get("battleMode"), VALID_MODES, path + ".battleMode")
	if _integer(state.get("turnNumber"), path + ".turnNumber") < 1:
		_fail(path + ".turnNumber", "must be at least 1")
	_enum_string(state.get("status"), VALID_STATUSES, path + ".status")

	var inventory := _dictionary(state.get("inventory"), path + ".inventory")
	_validate_keys(inventory, ["medkits", "revives"], ["medkits", "revives"], path + ".inventory")
	_nonnegative_integer(inventory.get("medkits"), path + ".inventory.medkits")
	_nonnegative_integer(inventory.get("revives"), path + ".inventory.revives")

	var combatants := _array(state.get("combatants"), path + ".combatants")
	if combatants.is_empty():
		_fail(path + ".combatants", "must contain at least one combatant")
	var ids: Array[String] = []
	var id_lookup := {}
	var slot_lookup := {}
	for index in combatants.size():
		var combatant_path := path + ".combatants[%d]" % index
		var combatant := _dictionary(combatants[index], combatant_path)
		var id := _validate_combatant(combatant, combatant_path)
		if id_lookup.has(id):
			_fail(combatant_path + ".id", "duplicate combatant ID")
		id_lookup[id] = true
		ids.append(id)
		var slot_key := "%s:%d" % [str(combatant.get("side", "")), int(combatant.get("slot", -1))]
		if slot_lookup.has(slot_key):
			_fail(combatant_path + ".slot", "duplicate slot on the same side")
		slot_lookup[slot_key] = true

	for index in combatants.size():
		var combatant := combatants[index] as Dictionary
		var target: Variant = (combatant.get("range", {}) as Dictionary).get("targetId")
		_validate_nullable_reference(target, ids, path + ".combatants[%d].range.targetId" % index)

	var active_actor := _nonempty_string(state.get("activeActorId"), path + ".activeActorId")
	if not id_lookup.has(active_actor):
		_fail(path + ".activeActorId", "must reference a combatant")

	var queue := _array(state.get("turnQueue"), path + ".turnQueue")
	for index in queue.size():
		_validate_queue_entry(_dictionary(queue[index], path + ".turnQueue[%d]" % index), path + ".turnQueue[%d]" % index, index, ids)

	var events := _array(state.get("events"), path + ".events")
	for index in events.size():
		_validate_event(_dictionary(events[index], path + ".events[%d]" % index), path + ".events[%d]" % index, ids)

	return ids


func _validate_combatant(combatant: Dictionary, path: String) -> String:
	var keys := [
		"id",
		"displayName",
		"side",
		"faction",
		"role",
		"slot",
		"hp",
		"maxHp",
		"esp",
		"maxEsp",
		"alive",
		"accentColor",
		"isBoosting",
		"burnout",
		"crashTurns",
		"hasForceShield",
		"stunnedTurns",
		"disruptor",
		"range"
	]
	_validate_keys(combatant, keys, keys, path)
	var id := _nonempty_string(combatant.get("id"), path + ".id")
	_nonempty_string(combatant.get("displayName"), path + ".displayName")
	_enum_string(combatant.get("side"), VALID_SIDES, path + ".side")
	_enum_string(combatant.get("faction"), VALID_FACTIONS, path + ".faction")
	_nonempty_string(combatant.get("role"), path + ".role")
	_nonnegative_integer(combatant.get("slot"), path + ".slot")
	var hp := _nonnegative_number(combatant.get("hp"), path + ".hp")
	var max_hp := _positive_number(combatant.get("maxHp"), path + ".maxHp")
	var esp := _nonnegative_number(combatant.get("esp"), path + ".esp")
	var max_esp := _nonnegative_number(combatant.get("maxEsp"), path + ".maxEsp")
	if hp > max_hp:
		_fail(path + ".hp", "cannot exceed maxHp")
	if esp > max_esp:
		_fail(path + ".esp", "cannot exceed maxEsp")
	var alive := _boolean(combatant.get("alive"), path + ".alive")
	if alive != (hp > 0.0):
		_fail(path + ".alive", "must agree with serialized HP")
	_nonempty_string(combatant.get("accentColor"), path + ".accentColor")
	_boolean(combatant.get("isBoosting"), path + ".isBoosting")
	_nonnegative_number(combatant.get("burnout"), path + ".burnout")
	_nonnegative_number(combatant.get("crashTurns"), path + ".crashTurns")
	_boolean(combatant.get("hasForceShield"), path + ".hasForceShield")
	_nonnegative_number(combatant.get("stunnedTurns"), path + ".stunnedTurns")

	var disruptor := _dictionary(combatant.get("disruptor"), path + ".disruptor")
	_validate_keys(disruptor, ["ready", "cooldownTurns"], ["ready", "cooldownTurns"], path + ".disruptor")
	_boolean(disruptor.get("ready"), path + ".disruptor.ready")
	_nonnegative_number(disruptor.get("cooldownTurns"), path + ".disruptor.cooldownTurns")

	var range_state := _dictionary(combatant.get("range"), path + ".range")
	_validate_keys(range_state, ["band", "targetId"], ["band", "targetId"], path + ".range")
	_nullable_enum_string(range_state.get("band"), VALID_BANDS, path + ".range.band")
	_nullable_string(range_state.get("targetId"), path + ".range.targetId")
	return id


func _validate_queue_entry(entry: Dictionary, path: String, index: int, ids: Array[String]) -> void:
	_validate_keys(entry, ["order", "actorId", "predictedTick"], ["order", "actorId", "predictedTick"], path)
	if _integer(entry.get("order"), path + ".order") != index:
		_fail(path + ".order", "must match queue array index")
	var actor_id := _nonempty_string(entry.get("actorId"), path + ".actorId")
	if not ids.has(actor_id):
		_fail(path + ".actorId", "must reference a combatant")
	_nonnegative_number(entry.get("predictedTick"), path + ".predictedTick")


func _validate_action(action: Dictionary, path: String, ids: Array[String], frame_step: float) -> void:
	var keys := [
		"type",
		"actorId",
		"targetId",
		"abilityId",
		"abilityName",
		"abilityCategory",
		"boostEnabled",
		"audioCue",
		"timing"
	]
	_validate_keys(action, keys, keys, path)
	var action_type := _enum_string(action.get("type"), VALID_ACTIONS, path + ".type")
	var actor_id := _nonempty_string(action.get("actorId"), path + ".actorId")
	if not ids.has(actor_id):
		_fail(path + ".actorId", "must reference a combatant")
	_validate_nullable_reference(action.get("targetId"), ids, path + ".targetId")
	_nullable_string(action.get("abilityId"), path + ".abilityId")
	_nullable_string(action.get("abilityName"), path + ".abilityName")
	_nullable_enum_string(action.get("abilityCategory"), VALID_ABILITY_CATEGORIES, path + ".abilityCategory")
	_nullable_boolean(action.get("boostEnabled"), path + ".boostEnabled")
	_nullable_enum_string(action.get("audioCue"), VALID_AUDIO_CUES, path + ".audioCue")
	var timing := _dictionary(action.get("timing"), path + ".timing")
	var timing_keys := ["durationSeconds", "visualContactSeconds", "beamStartSeconds"]
	_validate_keys(timing, timing_keys, timing_keys, path + ".timing")
	var duration := _positive_number(timing.get("durationSeconds"), path + ".timing.durationSeconds")
	if duration > frame_step:
		_fail(path + ".timing.durationSeconds", "cannot exceed document frameStepSeconds")
	var contact_value: Variant = timing.get("visualContactSeconds")
	var beam_value: Variant = timing.get("beamStartSeconds")
	_nullable_number(contact_value, path + ".timing.visualContactSeconds")
	_nullable_number(beam_value, path + ".timing.beamStartSeconds")
	if contact_value != null:
		var contact := float(contact_value)
		if contact < 0.0 or contact > duration:
			_fail(path + ".timing.visualContactSeconds", "must fall within the action duration")
	if beam_value != null:
		var beam_start := float(beam_value)
		if beam_start < 0.0 or beam_start > duration:
			_fail(path + ".timing.beamStartSeconds", "must fall within the action duration")
		if contact_value == null or beam_start > float(contact_value):
			_fail(path + ".timing.beamStartSeconds", "requires contact at or after beam start")

	if action_type in ["attack", "esper_ability"]:
		_nonempty_string(action.get("abilityId"), path + ".abilityId")
		_nonempty_string(action.get("abilityName"), path + ".abilityName")
	if action_type in ["attack", "disruptor", "use_medkit", "use_revive"] and action.get("targetId") == null:
		_fail(path + ".targetId", "is required for this action type")
	if action_type == "toggle_boost" and typeof(action.get("boostEnabled")) != TYPE_BOOL:
		_fail(path + ".boostEnabled", "is required for toggle_boost")


func _validate_event(event: Dictionary, path: String, ids: Array[String]) -> void:
	var keys := [
		"type",
		"actorId",
		"targetId",
		"label",
		"amount",
		"critical",
		"disruptor",
		"shieldAbsorbed",
		"lethal",
		"fromBand",
		"toBand",
		"audioCues"
	]
	_validate_keys(event, keys, keys, path)
	_enum_string(event.get("type"), VALID_EVENTS, path + ".type")
	_validate_nullable_reference(event.get("actorId"), ids, path + ".actorId")
	_validate_nullable_reference(event.get("targetId"), ids, path + ".targetId")
	_string(event.get("label"), path + ".label")
	_nullable_number(event.get("amount"), path + ".amount")
	_boolean(event.get("critical"), path + ".critical")
	_boolean(event.get("disruptor"), path + ".disruptor")
	_boolean(event.get("shieldAbsorbed"), path + ".shieldAbsorbed")
	_boolean(event.get("lethal"), path + ".lethal")
	_nullable_enum_string(event.get("fromBand"), VALID_BANDS, path + ".fromBand")
	_nullable_enum_string(event.get("toBand"), VALID_BANDS, path + ".toBand")
	var audio_cues := _array(event.get("audioCues"), path + ".audioCues")
	for index in audio_cues.size():
		_enum_string(audio_cues[index], VALID_AUDIO_CUES, path + ".audioCues[%d]" % index)


func _validate_keys(value: Dictionary, required: Array, allowed: Array, path: String) -> void:
	for key in required:
		if not value.has(key):
			_fail(path, "missing required key '%s'" % key)
	for key in value.keys():
		if not allowed.has(key):
			_fail(path, "unknown key '%s'" % key)


func _dictionary(value: Variant, path: String) -> Dictionary:
	if typeof(value) != TYPE_DICTIONARY:
		_fail(path, "must be an object")
		return {}
	return value as Dictionary


func _array(value: Variant, path: String) -> Array:
	if typeof(value) != TYPE_ARRAY:
		_fail(path, "must be an array")
		return []
	return value as Array


func _string(value: Variant, path: String) -> String:
	if typeof(value) != TYPE_STRING:
		_fail(path, "must be a string")
		return ""
	return value as String


func _nonempty_string(value: Variant, path: String) -> String:
	var parsed := _string(value, path)
	if parsed.is_empty():
		_fail(path, "must not be empty")
	return parsed


func _nullable_string(value: Variant, path: String) -> void:
	if value != null:
		_nonempty_string(value, path)


func _number(value: Variant, path: String) -> float:
	if typeof(value) != TYPE_INT and typeof(value) != TYPE_FLOAT:
		_fail(path, "must be a number")
		return 0.0
	var parsed := float(value)
	if not is_finite(parsed):
		_fail(path, "must be finite")
	return parsed


func _positive_number(value: Variant, path: String) -> float:
	var parsed := _number(value, path)
	if parsed <= 0.0:
		_fail(path, "must be greater than 0")
	return parsed


func _nonnegative_number(value: Variant, path: String) -> float:
	var parsed := _number(value, path)
	if parsed < 0.0:
		_fail(path, "must be at least 0")
	return parsed


func _unit_number(value: Variant, path: String) -> float:
	var parsed := _number(value, path)
	if parsed < 0.0 or parsed > 1.0:
		_fail(path, "must be between 0 and 1")
	return parsed


func _nullable_number(value: Variant, path: String) -> void:
	if value != null:
		_number(value, path)


func _integer(value: Variant, path: String) -> int:
	if typeof(value) != TYPE_INT and typeof(value) != TYPE_FLOAT:
		_fail(path, "must be an integer")
		return 0
	var parsed := float(value)
	if not is_finite(parsed) or not is_equal_approx(parsed, roundf(parsed)):
		_fail(path, "must be an integer")
		return 0
	return int(parsed)


func _nonnegative_integer(value: Variant, path: String) -> int:
	var parsed := _integer(value, path)
	if parsed < 0:
		_fail(path, "must be at least 0")
	return parsed


func _safe_integer(value: Variant, path: String) -> int:
	var parsed := _integer(value, path)
	if absf(float(parsed)) > 9007199254740991.0:
		_fail(path, "must be a JSON-safe integer")
	return parsed


func _boolean(value: Variant, path: String) -> bool:
	if typeof(value) != TYPE_BOOL:
		_fail(path, "must be a boolean")
		return false
	return value as bool


func _nullable_boolean(value: Variant, path: String) -> void:
	if value != null:
		_boolean(value, path)


func _enum_string(value: Variant, valid: Array, path: String) -> String:
	var parsed := _string(value, path)
	if not valid.has(parsed):
		_fail(path, "has unsupported value '%s'" % parsed)
	return parsed


func _nullable_enum_string(value: Variant, valid: Array, path: String) -> void:
	if value != null:
		_enum_string(value, valid, path)


func _validate_nullable_reference(value: Variant, ids: Array[String], path: String) -> void:
	if value == null:
		return
	var id := _nonempty_string(value, path)
	if not ids.has(id):
		_fail(path, "must reference a combatant")


func _fail(path: String, message: String) -> void:
	_errors.append("%s: %s" % [path, message])


func _report_errors() -> void:
	for error in _errors:
		push_error("Presentation bridge validation failed: %s" % error)
