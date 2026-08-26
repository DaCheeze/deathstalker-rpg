extends SceneTree

const WebClient = preload("res://scripts/web_game_core_client.gd")


func _init() -> void:
	var client = WebClient.new()
	var fixture_file := FileAccess.open(
		"res://data/presentation-range-band-replay-v1.json",
		FileAccess.READ
	)
	if fixture_file == null:
		_fail("Range-band fixture could not be opened.")
		return
	var fixture_value: Variant = JSON.parse_string(fixture_file.get_as_text())
	if typeof(fixture_value) != TYPE_DICTIONARY:
		_fail("Range-band fixture JSON is malformed.")
		return
	var fixture := fixture_value as Dictionary
	var fixture_frames := fixture.get("frames", []) as Array
	var initial_frame := fixture_frames[0] as Dictionary
	var initial_state := initial_frame.get("state", {}) as Dictionary
	var active_actor_id := str(initial_state.get("activeActorId", ""))
	var success := {
		"format": "deathstalker-core-session",
		"protocolVersion": 1.0,
		"ok": true,
		"requestId": "validator-request",
		"sessionId": "validator-session",
		"sequence": 1.0,
		"resultType": "action_applied",
		"view": {
			"scenarioId": "range-band-prototype",
			"seed": 230823.0,
			"sequence": 1.0,
			"awaiting": "player",
			"encounter": fixture.get("encounter"),
			"transition": {
				"action": initial_frame.get("action"),
				"state": initial_frame.get("state"),
			},
			"legalActions": [{"type": "PassTurn", "actorId": active_actor_id}],
		},
	}
	if not client._valid_envelope(success):
		_fail("Valid success envelope was rejected: %s" % client.last_error)
		return
	var invalid := success.duplicate(true)
	invalid["protocolVersion"] = 2.0
	if client._valid_envelope(invalid):
		_fail("Unsupported protocol version was accepted.")
		return
	var error_response := {
		"format": "deathstalker-core-session",
		"protocolVersion": 1.0,
		"ok": false,
		"requestId": "validator-error",
		"sessionId": "validator-session",
		"sequence": 1.0,
		"error": {"code": "stale_sequence", "message": "Expected sequence 1"},
	}
	if not client._valid_envelope(error_response):
		_fail("Valid error envelope was rejected.")
		return
	if client.last_error != "stale_sequence: Expected sequence 1":
		_fail("Error details were not preserved.")
		return
	var malformed_action := success.duplicate(true)
	(malformed_action["view"] as Dictionary)["legalActions"] = [
		{"type": "Attack", "actorId": "party", "targetId": "enemy"}
	]
	if client._valid_envelope(malformed_action):
		_fail("Malformed legal action was accepted.")
		return
	print(
		"[Godot Web Core Client Validator] PASS protocol=1 success=1 error=1 invalid=2 transition=strict legal_actions=strict"
	)
	quit(0)


func _fail(message: String) -> void:
	push_error("[Godot Web Core Client Validator] FAIL %s" % message)
	quit(1)
