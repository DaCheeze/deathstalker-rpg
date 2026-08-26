class_name OpeningTranscriptClient
extends RefCounted

const WebClient = preload("res://scripts/web_game_core_client.gd")
const TRANSCRIPT_FORMAT := "deathstalker-opening-expedition-transcript"
const TRANSCRIPT_SCHEMA_VERSION := 1
const SESSION_FORMAT := "deathstalker-opening-expedition-session"
const SESSION_PROTOCOL_VERSION := 1

var last_error := ""
var last_request_ms := 0.0
var request_count := 0
var opening_persistence_available := false
var opening_checkpoint_sequence := -1

var _exchanges: Array = []
var _index := 0


func configure(transcript_path: String) -> bool:
	last_error = ""
	last_request_ms = 0.0
	request_count = 0
	opening_persistence_available = false
	opening_checkpoint_sequence = -1
	_index = 0
	_exchanges.clear()
	if not FileAccess.file_exists(transcript_path):
		last_error = "Opening transcript is missing at %s." % transcript_path
		return false
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(transcript_path))
	if typeof(parsed) != TYPE_DICTIONARY:
		last_error = "Opening transcript is not a JSON object."
		return false
	var document := parsed as Dictionary
	if str(document.get("format", "")) != TRANSCRIPT_FORMAT:
		last_error = "Opening transcript format is unsupported."
		return false
	if int(document.get("schemaVersion", -1)) != TRANSCRIPT_SCHEMA_VERSION:
		last_error = "Opening transcript schema version is unsupported."
		return false
	var exchanges_value: Variant = document.get("exchanges")
	if typeof(exchanges_value) != TYPE_ARRAY:
		last_error = "Opening transcript exchanges are missing."
		return false
	var exchanges := exchanges_value as Array
	if exchanges.is_empty() or int(document.get("commandCount", -1)) != exchanges.size():
		last_error = "Opening transcript exchange count is invalid."
		return false
	var validator: RefCounted = WebClient.new()
	for exchange_index in exchanges.size():
		var exchange_value: Variant = exchanges[exchange_index]
		if typeof(exchange_value) != TYPE_DICTIONARY:
			last_error = "Opening transcript exchange %d is not an object." % exchange_index
			return false
		var exchange := exchange_value as Dictionary
		if typeof(exchange.get("request")) != TYPE_DICTIONARY or typeof(exchange.get("response")) != TYPE_DICTIONARY:
			last_error = "Opening transcript exchange %d is incomplete." % exchange_index
			return false
		if not bool(validator.call("_valid_opening_envelope", exchange.get("response", {}) as Dictionary)):
			last_error = "Opening transcript response %d is invalid: %s" % [exchange_index, validator.last_error]
			return false
	_exchanges = exchanges.duplicate(true)
	return true


func request_opening(payload: Dictionary) -> Dictionary:
	var started_usec := Time.get_ticks_usec()
	last_error = ""
	request_count += 1
	if _index >= _exchanges.size():
		last_error = "Opening transcript is exhausted."
		last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
		return {}
	if not _valid_request_envelope(payload):
		last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
		return {}
	var exchange := _exchanges[_index] as Dictionary
	var expected := exchange.get("request", {}) as Dictionary
	if not _semantic_equal(payload.get("expectedSequence"), expected.get("expectedSequence")):
		last_error = "Opening transcript request %d has the wrong expected sequence." % _index
		last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
		return {}
	if not _semantic_equal(payload.get("command"), expected.get("command")):
		last_error = "Opening transcript request %d diverged: actual=%s expected=%s" % [
			_index,
			JSON.stringify(payload.get("command")),
			JSON.stringify(expected.get("command")),
		]
		last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
		return {}
	var response := (exchange.get("response", {}) as Dictionary).duplicate(true)
	response["requestId"] = str(payload.get("requestId", ""))
	response["sessionId"] = str(payload.get("sessionId", ""))
	_index += 1
	last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
	return response


func resume_opening(session_id: String) -> Dictionary:
	last_error = "checkpoint_not_found: Native transcript review does not persist sessions."
	return {
		"format": SESSION_FORMAT,
		"protocolVersion": SESSION_PROTOCOL_VERSION,
		"ok": false,
		"requestId": "%s-resume" % session_id,
		"sessionId": session_id,
		"sequence": null,
		"error": {
			"code": "checkpoint_not_found",
			"message": "Native transcript review does not persist sessions.",
		},
	}


func consumed_exchange_count() -> int:
	return _index


func exchange_count() -> int:
	return _exchanges.size()


func next_expected_command() -> Dictionary:
	last_error = ""
	if _index >= _exchanges.size():
		last_error = "Opening transcript is exhausted."
		return {}
	var exchange := _exchanges[_index] as Dictionary
	return (exchange.get("request", {}) as Dictionary).get("command", {}).duplicate(true)


func _valid_request_envelope(payload: Dictionary) -> bool:
	var required: Array[String] = [
		"format",
		"protocolVersion",
		"requestId",
		"sessionId",
		"expectedSequence",
		"command",
	]
	if payload.size() != required.size():
		last_error = "Opening transcript request has unexpected fields."
		return false
	for key in required:
		if not payload.has(key):
			last_error = "Opening transcript request is missing %s." % key
			return false
	if str(payload.get("format", "")) != SESSION_FORMAT:
		last_error = "Opening transcript request format is unsupported."
		return false
	if int(payload.get("protocolVersion", -1)) != SESSION_PROTOCOL_VERSION:
		last_error = "Opening transcript request protocol is unsupported."
		return false
	if str(payload.get("requestId", "")).is_empty() or str(payload.get("sessionId", "")).is_empty():
		last_error = "Opening transcript request IDs must not be empty."
		return false
	if typeof(payload.get("command")) != TYPE_DICTIONARY:
		last_error = "Opening transcript request command is malformed."
		return false
	return true


func _semantic_equal(left: Variant, right: Variant) -> bool:
	if (
		(typeof(left) == TYPE_INT or typeof(left) == TYPE_FLOAT)
		and (typeof(right) == TYPE_INT or typeof(right) == TYPE_FLOAT)
	):
		return float(left) == float(right)
	if typeof(left) != typeof(right):
		return false
	if typeof(left) == TYPE_DICTIONARY:
		var left_dictionary := left as Dictionary
		var right_dictionary := right as Dictionary
		if left_dictionary.size() != right_dictionary.size():
			return false
		for key_value: Variant in left_dictionary.keys():
			if (
				not right_dictionary.has(key_value)
				or not _semantic_equal(left_dictionary[key_value], right_dictionary[key_value])
			):
				return false
		return true
	if typeof(left) == TYPE_ARRAY:
		var left_array := left as Array
		var right_array := right as Array
		if left_array.size() != right_array.size():
			return false
		for item_index in left_array.size():
			if not _semantic_equal(left_array[item_index], right_array[item_index]):
				return false
		return true
	return left == right
