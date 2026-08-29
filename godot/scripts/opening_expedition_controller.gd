class_name OpeningExpeditionController
extends RefCounted

const SESSION_FORMAT := "deathstalker-opening-expedition-session"
const PROTOCOL_VERSION := 3
const SCENARIO_ID := "opening_virimonde_forced_departure"

var last_error := ""
var sequence := 0
var retry_count := 0

var _client: Variant = null
var _session_id := ""
var _seed := 0
var _request_index := 0


func configure(client: Variant, session_id: String, seed: int) -> bool:
	last_error = ""
	if client == null or not client.has_method("request_opening"):
		last_error = "Opening client must expose request_opening(payload)."
		return false
	if session_id.strip_edges().is_empty():
		last_error = "Opening session ID must not be empty."
		return false
	_client = client
	_session_id = session_id
	_seed = seed
	sequence = 0
	retry_count = 0
	_request_index = 0
	return true


func create_expedition() -> Dictionary:
	return _dispatch({
		"type": "create_expedition",
		"scenarioId": SCENARIO_ID,
		"seed": _seed,
	}, true)


func resume_expedition() -> Dictionary:
	last_error = ""
	if _client == null or not _client.has_method("resume_opening"):
		last_error = "Opening client does not expose resume_opening(session_id)."
		return {}
	var response_value: Variant = _client.call("resume_opening", _session_id)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		last_error = _client_error("Opening resume request failed.")
		return {}
	var response := response_value as Dictionary
	if not bool(response.get("ok", false)):
		last_error = _response_error(response)
		return response
	if str(response.get("sessionId", "")) != _session_id:
		last_error = "Opening resume response sessionId does not match the active session."
		return {}
	if str(response.get("resultType", "")) != "expedition_resumed":
		last_error = "Opening resume response has an unexpected result type."
		return {}
	var response_sequence := int(response.get("sequence", -1))
	if response_sequence < 0:
		last_error = "Opening resume response has an invalid sequence."
		return {}
	sequence = response_sequence
	_request_index = response_sequence + 1
	return response


func continue_expedition() -> Dictionary:
	return _dispatch({"type": "continue"}, false)


func complete_exploration(
	map_id: String,
	objective_landmark_id: String,
	player_position: Vector2
) -> Dictionary:
	return _dispatch({
		"type": "complete_exploration",
		"mapId": map_id,
		"objectiveLandmarkId": objective_landmark_id,
		"playerPosition": {"x": player_position.x, "y": player_position.y},
	}, false)


func start_field_contact(
	contact_id: String,
	trigger: String,
	player_position: Vector2
) -> Dictionary:
	return _dispatch({
		"type": "start_field_contact",
		"contactId": contact_id,
		"trigger": trigger,
		"playerPosition": {"x": player_position.x, "y": player_position.y},
	}, false)


func return_to_exploration() -> Dictionary:
	return _dispatch({"type": "return_to_exploration"}, false)


func apply_action(action: Dictionary) -> Dictionary:
	return _dispatch({"type": "apply_action", "action": action}, false)


func advance_ai() -> Dictionary:
	return _dispatch({"type": "advance_ai"}, false)


func choose_recovery(choice: String) -> Dictionary:
	return _dispatch({"type": "choose_recovery", "choice": choice}, false)


func restart_expedition() -> Dictionary:
	return _dispatch({"type": "restart_expedition"}, false)


func _dispatch(command: Dictionary, creating: bool) -> Dictionary:
	last_error = ""
	if _client == null:
		last_error = "Opening session client is not configured."
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
	var response_value: Variant = _client.call("request_opening", payload)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		retry_count += 1
		response_value = _client.call("request_opening", payload)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		last_error = _client_error("Opening request failed after one exact-ID retry.")
		return {}
	var response := response_value as Dictionary
	if not bool(response.get("ok", false)):
		last_error = _response_error(response)
		return response
	if str(response.get("requestId", "")) != request_id:
		last_error = "Opening response requestId does not match the request."
		return {}
	if str(response.get("sessionId", "")) != _session_id:
		last_error = "Opening response sessionId does not match the active session."
		return {}
	var response_sequence := int(response.get("sequence", -1))
	var required_sequence := 0 if creating else expected_sequence + 1
	if response_sequence != required_sequence:
		last_error = "Opening success sequence %d did not match expected %d." % [
			response_sequence,
			required_sequence,
		]
		return {}
	sequence = response_sequence
	return response


func _client_error(fallback: String) -> String:
	var candidate: Variant = _client.get("last_error")
	return str(candidate) if candidate != null and not str(candidate).is_empty() else fallback


func _response_error(response: Dictionary) -> String:
	var error_value: Variant = response.get("error")
	if typeof(error_value) != TYPE_DICTIONARY:
		return _client_error("Opening host returned an unspecified error.")
	var error_dictionary := error_value as Dictionary
	return "%s: %s" % [
		str(error_dictionary.get("code", "unknown_error")),
		str(error_dictionary.get("message", "No error message supplied.")),
	]
