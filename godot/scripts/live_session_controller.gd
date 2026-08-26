class_name LiveSessionController
extends RefCounted

const LIVE_SESSION_FORMAT := "deathstalker-core-session"
const LIVE_SESSION_PROTOCOL_VERSION := 1
const RANGE_BAND_SCENARIO_ID := "range-band-prototype"

var last_error := ""
var sequence := 0
var retry_count := 0

var _client: Variant = null
var _session_id := ""
var _seed := 0
var _request_index := 0


func configure(client: Variant, session_id: String, seed: int) -> bool:
	last_error = ""
	if client == null or not client.has_method("request"):
		last_error = "Live-session client must expose request(payload)."
		return false
	if session_id.strip_edges().is_empty():
		last_error = "Live-session ID must not be empty."
		return false
	_client = client
	_session_id = session_id
	_seed = seed
	sequence = 0
	retry_count = 0
	_request_index = 0
	return true


func create_session() -> Dictionary:
	return _dispatch({
		"type": "create_session",
		"scenarioId": RANGE_BAND_SCENARIO_ID,
		"seed": _seed,
	}, true)


func apply_action(action: Dictionary) -> Dictionary:
	return _dispatch({"type": "apply_action", "action": action}, false)


func advance_ai() -> Dictionary:
	return _dispatch({"type": "advance_ai"}, false)


func restart_session() -> Dictionary:
	return _dispatch({"type": "restart_session"}, false)


func _dispatch(command: Dictionary, creating: bool) -> Dictionary:
	last_error = ""
	if _client == null:
		last_error = "Live-session client is not configured."
		return {}
	var request_id := "%s-%06d" % [_session_id, _request_index]
	_request_index += 1
	var expected_sequence := 0 if creating else sequence
	var payload := {
		"format": LIVE_SESSION_FORMAT,
		"protocolVersion": LIVE_SESSION_PROTOCOL_VERSION,
		"requestId": request_id,
		"sessionId": _session_id,
		"expectedSequence": expected_sequence,
		"command": command,
	}
	var response_value: Variant = _client.call("request", payload)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		retry_count += 1
		response_value = _client.call("request", payload)
	if typeof(response_value) != TYPE_DICTIONARY or (response_value as Dictionary).is_empty():
		last_error = _client_error("Live-session request failed after one exact-ID retry.")
		return {}
	var response := response_value as Dictionary
	if not bool(response.get("ok", false)):
		last_error = _response_error(response)
		return response
	if str(response.get("requestId", "")) != request_id:
		last_error = "Live-session response requestId does not match the request."
		return {}
	if str(response.get("sessionId", "")) != _session_id:
		last_error = "Live-session response sessionId does not match the active session."
		return {}
	var response_sequence := int(response.get("sequence", -1))
	var required_sequence := 0 if creating else expected_sequence + 1
	if response_sequence != required_sequence:
		last_error = "Live-session success sequence %d did not match expected %d." % [
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
		return _client_error("Live-session host returned an unspecified error.")
	var error_dictionary := error_value as Dictionary
	return "%s: %s" % [
		str(error_dictionary.get("code", "unknown_error")),
		str(error_dictionary.get("message", "No error message supplied.")),
	]
