extends SceneTree

const BridgeLoader = preload("res://scripts/presentation_bridge_loader.gd")
const FIXTURE_PATH := "res://data/presentation-replay-v1.json"


func _initialize() -> void:
	var loader := BridgeLoader.new()
	var bridge: Dictionary = loader.load_and_validate(FIXTURE_PATH)
	if bridge.is_empty():
		quit(1)
		return

	var invalid_documents: Array[Dictionary] = []

	var missing_key: Dictionary = bridge.duplicate(true)
	missing_key.erase("format")
	invalid_documents.append(missing_key)

	var unknown_key: Dictionary = bridge.duplicate(true)
	unknown_key["unknownContractField"] = true
	invalid_documents.append(unknown_key)

	var invalid_cue: Dictionary = bridge.duplicate(true)
	_action(invalid_cue, 1)["audioCue"] = "ability_id_rederived_in_godot"
	invalid_documents.append(invalid_cue)

	var invalid_reference: Dictionary = bridge.duplicate(true)
	_action(invalid_reference, 1)["targetId"] = "missing_combatant"
	invalid_documents.append(invalid_reference)

	var nonuniform_time: Dictionary = bridge.duplicate(true)
	_frame(nonuniform_time, 1)["atSeconds"] = 1.16
	invalid_documents.append(nonuniform_time)

	var unsupported_schema: Dictionary = bridge.duplicate(true)
	unsupported_schema["schemaVersion"] = 2
	invalid_documents.append(unsupported_schema)

	var nonfinite_seed: Dictionary = bridge.duplicate(true)
	(nonfinite_seed.get("source", {}) as Dictionary)["seed"] = INF
	invalid_documents.append(nonfinite_seed)

	var nonfinite_frame_step: Dictionary = bridge.duplicate(true)
	(nonfinite_frame_step.get("timing", {}) as Dictionary)["frameStepSeconds"] = INF
	invalid_documents.append(nonfinite_frame_step)

	var short_end_hold: Dictionary = bridge.duplicate(true)
	var short_timing := short_end_hold.get("timing", {}) as Dictionary
	short_timing["endHoldSeconds"] = 0.1
	short_timing["durationSeconds"] = float(
		_frame(short_end_hold, (short_end_hold.get("frames", []) as Array).size() - 1).get("atSeconds", 0.0)
	) + 0.1
	invalid_documents.append(short_end_hold)

	var contact_after_duration: Dictionary = bridge.duplicate(true)
	var contact_timing := _action(contact_after_duration, 1).get("timing", {}) as Dictionary
	contact_timing["visualContactSeconds"] = float(contact_timing.get("durationSeconds", 0.0)) + 0.01
	invalid_documents.append(contact_after_duration)

	var beam_after_contact: Dictionary = bridge.duplicate(true)
	var beam_timing := _action(beam_after_contact, 1).get("timing", {}) as Dictionary
	beam_timing["beamStartSeconds"] = 0.11
	beam_timing["visualContactSeconds"] = 0.1
	invalid_documents.append(beam_after_contact)

	var invalid_nested_reference: Dictionary = bridge.duplicate(true)
	var first_state := _frame(invalid_nested_reference, 0).get("state", {}) as Dictionary
	var first_combatant := (first_state.get("combatants", []) as Array)[0] as Dictionary
	(first_combatant.get("range", {}) as Dictionary)["targetId"] = "missing_combatant"
	invalid_documents.append(invalid_nested_reference)

	for index in invalid_documents.size():
		if loader.validate_document(invalid_documents[index]):
			push_error("Bridge negative contract case %d unexpectedly validated." % index)
			quit(1)
			return

	var targetless_esper: Dictionary = bridge.duplicate(true)
	var esper_action := _action(targetless_esper, 1)
	esper_action["type"] = "esper_ability"
	esper_action["targetId"] = null
	esper_action["abilityId"] = "neural_static"
	esper_action["abilityName"] = "Neural Static"
	esper_action["abilityCategory"] = "esper"
	esper_action["boostEnabled"] = null
	esper_action["audioCue"] = "psionic"
	esper_action["timing"] = {
		"durationSeconds": 0.32,
		"visualContactSeconds": 0.32,
		"beamStartSeconds": null
	}
	if not loader.validate_document(targetless_esper):
		push_error("Bridge rejected a schema-valid targetless esper action: %s" % loader.get_errors())
		quit(1)
		return

	print("[Godot Bridge Contract] PASS 12 malformed documents rejected; targetless esper accepted.")
	quit(0)


func _frame(document: Dictionary, index: int) -> Dictionary:
	return (document.get("frames", []) as Array)[index] as Dictionary


func _action(document: Dictionary, index: int) -> Dictionary:
	return _frame(document, index).get("action", {}) as Dictionary
