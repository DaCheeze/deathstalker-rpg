extends SceneTree

const WorldLoopController = preload("res://scripts/world_loop_controller.gd")
const WebClient = preload("res://scripts/web_game_core_client.gd")
const FIXTURE_PATH := "res://data/world-loop-transcript-v1.json"


class RetryClient:
	extends RefCounted

	var last_error := ""
	var fail_next_transport := false
	var force_error := false
	var requests: Array[Dictionary] = []

	func request_world_loop(payload: Dictionary) -> Dictionary:
		requests.append(payload.duplicate(true))
		if fail_next_transport:
			fail_next_transport = false
			last_error = "simulated transport interruption"
			return {}
		if force_error:
			return {
				"format": "deathstalker-world-loop-session",
				"protocolVersion": 1.0,
				"ok": false,
				"requestId": payload.get("requestId"),
				"sessionId": payload.get("sessionId"),
				"sequence": payload.get("expectedSequence"),
				"error": {
					"code": "stale_sequence",
					"message": "simulated stale request",
				},
			}
		var command := payload.get("command", {}) as Dictionary
		var creating := str(command.get("type", "")) == "create_world_loop"
		var response_sequence := 0 if creating else int(payload.get("expectedSequence", 0)) + 1
		return {
			"format": "deathstalker-world-loop-session",
			"protocolVersion": 1.0,
			"ok": true,
			"requestId": payload.get("requestId"),
			"sessionId": payload.get("sessionId"),
			"sequence": response_sequence,
			"resultType": "world_loop_created" if creating else "location_changed",
			"view": {},
		}


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var fixture_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(FIXTURE_PATH))
	if typeof(fixture_value) != TYPE_DICTIONARY:
		_fail("Transcript is not a JSON object.")
		return
	var fixture := fixture_value as Dictionary
	if str(fixture.get("format", "")) != "deathstalker-world-loop-transcript":
		_fail("Transcript format is unsupported.")
		return
	var exchanges := fixture.get("exchanges", []) as Array
	if exchanges.is_empty() or int(fixture.get("commandCount", -1)) != exchanges.size():
		_fail("Transcript exchange count is invalid.")
		return
	var result_types: Array[String] = []
	var validator: RefCounted = WebClient.new()
	for exchange_index in exchanges.size():
		var exchange := exchanges[exchange_index] as Dictionary
		var response := exchange.get("response", {}) as Dictionary
		if not bool(validator.call("_valid_world_loop_envelope", response)):
			_fail("Response %d failed strict Godot validation: %s" % [exchange_index, validator.last_error])
			return
		var result_type := str(response.get("resultType", ""))
		if not result_types.has(result_type):
			result_types.append(result_type)
	var required_results: Array[String] = [
		"world_loop_created",
		"location_changed",
		"chest_opened",
		"party_rested",
		"shop_purchase_completed",
		"encounter_started",
		"action_applied",
		"ai_action_applied",
		"battle_returned_to_map",
	]
	for result_type in required_results:
		if not result_types.has(result_type):
			_fail("Transcript does not cover result type '%s'." % result_type)
			return
	var malformed := ((exchanges[0] as Dictionary).get("response", {}) as Dictionary).duplicate(true)
	var malformed_view := malformed.get("view", {}) as Dictionary
	var malformed_location := malformed_view.get("location", {}) as Dictionary
	malformed_location["kind"] = "scaled_boss"
	if bool(validator.call("_valid_world_loop_envelope", malformed)):
		_fail("Strict Godot validation accepted an unsupported world-loop location kind.")
		return

	var retry_client := RetryClient.new()
	retry_client.fail_next_transport = true
	var controller := WorldLoopController.new()
	if not controller.configure(retry_client, "world-loop-validator", 230825):
		_fail(controller.last_error)
		return
	var created := controller.create_world_loop()
	if created.is_empty() or controller.sequence != 0 or controller.retry_count != 1:
		_fail("World-loop create retry did not recover at sequence 0.")
		return
	if retry_client.requests.size() != 2 or retry_client.requests[0] != retry_client.requests[1]:
		_fail("World-loop retry did not preserve the exact request payload and ID.")
		return
	var travelled := controller.travel("field_route")
	if travelled.is_empty() or controller.sequence != 1:
		_fail("World-loop travel did not advance the authoritative sequence once.")
		return
	retry_client.force_error = true
	var rejected := controller.rest()
	if bool(rejected.get("ok", true)) or controller.sequence != 1:
		_fail("World-loop error response changed the authoritative sequence.")
		return
	if not controller.last_error.begins_with("stale_sequence:"):
		_fail("World-loop error response did not preserve its recovery reason.")
		return
	retry_client.force_error = false
	var restarted := controller.restart_world_loop()
	if restarted.is_empty() or controller.sequence != 2:
		_fail("World-loop restart did not recover after a rejected request.")
		return

	var final := fixture.get("final", {}) as Dictionary
	if (
		str(final.get("awaiting", "")) != "complete"
		or not bool(final.get("bossDefeated", false))
		or int(final.get("partyLevel", 0)) <= 1
		or (final.get("openedChestIds", []) as Array).size() != 2
		or int((final.get("encounterVictoryCounts", {}) as Dictionary).get("field_patrol", 0)) != 3
	):
		_fail("Transcript final state did not prove chests, grinding, leveling, and fixed-boss completion.")
		return
	print(
		"[Godot World Loop] PASS exchanges=%d strict_responses=true chests=2 patrols=3 overlevel=true fixed_boss=true discrete_returns=true retry=exact-id"
		% exchanges.size()
	)
	quit(0)


func _fail(message: String) -> void:
	push_error("[Godot World Loop] FAIL %s" % message)
	quit(1)
