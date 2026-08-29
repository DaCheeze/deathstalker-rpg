class_name WorldLoopController
extends RefCounted

const SESSION_FORMAT := "deathstalker-world-loop-session"
const PROTOCOL_VERSION := 3
const SCENARIO_ID := "world_loop_proving_fixture"

var last_error := ""
var sequence := 0
var retry_count := 0

var _client: Variant = null
var _session_id := ""
var _seed := 0
var _request_index := 0
var _scenario_id := SCENARIO_ID


func configure(
	client: Variant,
	session_id: String,
	seed: int,
	scenario_id: String = SCENARIO_ID
) -> bool:
	last_error = ""
	if client == null or not client.has_method("request_world_loop"):
		last_error = "World-loop client must expose request_world_loop(payload)."
		return false
	if session_id.strip_edges().is_empty():
		last_error = "World-loop session ID must not be empty."
		return false
	if scenario_id.strip_edges().is_empty():
		last_error = "World-loop scenario ID must not be empty."
		return false
	_client = client
	_session_id = session_id
	_seed = seed
	_scenario_id = scenario_id
	sequence = 0
	retry_count = 0
	_request_index = 0
	return true


func create_world_loop() -> Dictionary:
	return _dispatch({
		"type": "create_world_loop",
		"scenarioId": _scenario_id,
		"seed": _seed,
	}, true)


func resume_world_loop() -> Dictionary:
	last_error = ""
	if _client == null or not _client.has_method("resume_world_loop"):
		last_error = "World-loop client does not expose resume_world_loop(session_id)."
		return {}
	var response_value: Variant = _client.call("resume_world_loop", _session_id)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		last_error = _client_error("World-loop resume request failed.")
		return {}
	var response := response_value as Dictionary
	if not bool(response.get("ok", false)):
		last_error = _response_error(response)
		return response
	if str(response.get("sessionId", "")) != _session_id:
		last_error = "World-loop resume response sessionId does not match the active session."
		return {}
	if str(response.get("resultType", "")) != "world_loop_resumed":
		last_error = "World-loop resume response has an unexpected result type."
		return {}
	if not _response_matches_scenario(response):
		return {}
	var response_sequence := int(response.get("sequence", -1))
	if response_sequence < 0:
		last_error = "World-loop resume response has an invalid sequence."
		return {}
	sequence = response_sequence
	_request_index = response_sequence + 1
	return response


func travel(destination_id: String) -> Dictionary:
	return _dispatch({"type": "travel", "destinationId": destination_id}, false)


func open_chest(chest_id: String) -> Dictionary:
	return _dispatch({"type": "open_chest", "chestId": chest_id}, false)


func rest() -> Dictionary:
	return _dispatch({"type": "rest"}, false)


func buy_consumable(item: String) -> Dictionary:
	return _dispatch({"type": "buy_consumable", "item": item}, false)


func start_encounter(node_id: String, trigger: String, player_position: Vector2) -> Dictionary:
	return _dispatch({
		"type": "start_encounter",
		"nodeId": node_id,
		"trigger": trigger,
		"playerPosition": {"x": player_position.x, "y": player_position.y},
	}, false)


func apply_action(action: Dictionary) -> Dictionary:
	return _dispatch({"type": "apply_action", "action": action}, false)


func advance_ai() -> Dictionary:
	return _dispatch({"type": "advance_ai"}, false)


func return_to_map() -> Dictionary:
	return _dispatch({"type": "return_to_map"}, false)


func restart_world_loop() -> Dictionary:
	return _dispatch({"type": "restart_world_loop"}, false)


func _dispatch(command: Dictionary, creating: bool) -> Dictionary:
	last_error = ""
	if _client == null:
		last_error = "World-loop session client is not configured."
		return {}
	var request_id := "%s-%06d" % [_session_id, _request_index]
	_request_index += 1
	var expected_sequence := 0 if creating else sequence
	var payload := {
		"format": SESSION_FORMAT,
		"protocolVersion": PROTOCOL_VERSION,
		"requestId": request_id,
		"sessionId": _session_id,
		"expectedSequence": expected_sequence,
		"command": command,
	}
	var response_value: Variant = _client.call("request_world_loop", payload)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		retry_count += 1
		response_value = _client.call("request_world_loop", payload)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		last_error = _client_error("World-loop request failed after one exact-ID retry.")
		return {}
	var response := response_value as Dictionary
	if not bool(response.get("ok", false)):
		last_error = _response_error(response)
		return response
	if str(response.get("requestId", "")) != request_id:
		last_error = "World-loop response requestId does not match the request."
		return {}
	if str(response.get("sessionId", "")) != _session_id:
		last_error = "World-loop response sessionId does not match the active session."
		return {}
	if not _response_matches_scenario(response):
		return {}
	var response_sequence := int(response.get("sequence", -1))
	var required_sequence := 0 if creating else expected_sequence + 1
	if response_sequence != required_sequence:
		last_error = "World-loop success sequence %d did not match expected %d." % [
			response_sequence,
			required_sequence,
		]
		return {}
	sequence = response_sequence
	return response


func _response_matches_scenario(response: Dictionary) -> bool:
	var view_value: Variant = response.get("view")
	if typeof(view_value) != TYPE_DICTIONARY:
		last_error = "World-loop response omitted its scenario view."
		return false
	if str((view_value as Dictionary).get("scenarioId", "")) != _scenario_id:
		last_error = "World-loop response scenarioId does not match the configured scenario."
		return false
	return true


func _client_error(fallback: String) -> String:
	var candidate: Variant = _client.get("last_error")
	return str(candidate) if candidate != null and not str(candidate).is_empty() else fallback


func _response_error(response: Dictionary) -> String:
	var error_value: Variant = response.get("error")
	if typeof(error_value) != TYPE_DICTIONARY:
		return _client_error("World-loop host returned an unspecified error.")
	var error_dictionary := error_value as Dictionary
	return "%s: %s" % [
		str(error_dictionary.get("code", "unknown_error")),
		str(error_dictionary.get("message", "No error message supplied.")),
	]
