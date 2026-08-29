class_name OpeningTranscriptClient
extends RefCounted

const WebClient = preload("res://scripts/web_game_core_client.gd")
const TRANSCRIPT_FORMAT := "deathstalker-opening-expedition-transcript"
const TRANSCRIPT_SCHEMA_VERSION := 1
const SESSION_FORMAT := "deathstalker-opening-expedition-session"
const SESSION_PROTOCOL_VERSION := 3
const WORLD_LOOP_TRANSCRIPT_FORMAT := "deathstalker-world-loop-transcript"
const WORLD_LOOP_TRANSCRIPT_SCHEMA_VERSION := 3
const WORLD_LOOP_SESSION_FORMAT := "deathstalker-world-loop-session"
const WORLD_LOOP_PROTOCOL_VERSION := 3

var last_error := ""
var last_request_ms := 0.0
var request_count := 0
var opening_persistence_available := false
var opening_checkpoint_sequence := -1

var _exchanges: Array = []
var _index := 0
var _session_format := SESSION_FORMAT
var _session_protocol_version := SESSION_PROTOCOL_VERSION
var _transcript_kind := "opening"


func configure(transcript_path: String) -> bool:
	return _configure_transcript(
		transcript_path,
		TRANSCRIPT_FORMAT,
		TRANSCRIPT_SCHEMA_VERSION,
		SESSION_FORMAT,
		SESSION_PROTOCOL_VERSION,
		"opening"
	)


func configure_world_loop(transcript_path: String) -> bool:
	return _configure_transcript(
		transcript_path,
		WORLD_LOOP_TRANSCRIPT_FORMAT,
		WORLD_LOOP_TRANSCRIPT_SCHEMA_VERSION,
		WORLD_LOOP_SESSION_FORMAT,
		WORLD_LOOP_PROTOCOL_VERSION,
		"world_loop"
	)


func _configure_transcript(
	transcript_path: String,
	transcript_format: String,
	transcript_schema_version: int,
	session_format: String,
	session_protocol_version: int,
	transcript_kind: String
) -> bool:
	last_error = ""
	last_request_ms = 0.0
	request_count = 0
	opening_persistence_available = false
	opening_checkpoint_sequence = -1
	_index = 0
	_exchanges.clear()
	_session_format = session_format
	_session_protocol_version = session_protocol_version
	_transcript_kind = transcript_kind
	if not FileAccess.file_exists(transcript_path):
		last_error = "%s transcript is missing at %s." % [_transcript_kind.capitalize(), transcript_path]
		return false
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(transcript_path))
	if typeof(parsed) != TYPE_DICTIONARY:
		last_error = "%s transcript is not a JSON object." % _transcript_kind.capitalize()
		return false
	var document := parsed as Dictionary
	if str(document.get("format", "")) != transcript_format:
		last_error = "%s transcript format is unsupported." % _transcript_kind.capitalize()
		return false
	if int(document.get("schemaVersion", -1)) != transcript_schema_version:
		last_error = "%s transcript schema version is unsupported." % _transcript_kind.capitalize()
		return false
	var exchanges_value: Variant = document.get("exchanges")
	if typeof(exchanges_value) != TYPE_ARRAY:
		last_error = "%s transcript exchanges are missing." % _transcript_kind.capitalize()
		return false
	var exchanges := exchanges_value as Array
	if exchanges.is_empty() or int(document.get("commandCount", -1)) != exchanges.size():
		last_error = "%s transcript exchange count is invalid." % _transcript_kind.capitalize()
		return false
	var validator: RefCounted = WebClient.new()
	for exchange_index in exchanges.size():
		var exchange_value: Variant = exchanges[exchange_index]
		if typeof(exchange_value) != TYPE_DICTIONARY:
			last_error = "%s transcript exchange %d is not an object." % [_transcript_kind.capitalize(), exchange_index]
			return false
		var exchange := exchange_value as Dictionary
		if typeof(exchange.get("request")) != TYPE_DICTIONARY or typeof(exchange.get("response")) != TYPE_DICTIONARY:
			last_error = "%s transcript exchange %d is incomplete." % [_transcript_kind.capitalize(), exchange_index]
			return false
		var validator_method := (
			"_valid_world_loop_envelope"
			if _transcript_kind == "world_loop"
			else "_valid_opening_envelope"
		)
		if not bool(validator.call(validator_method, exchange.get("response", {}) as Dictionary)):
			last_error = "%s transcript response %d is invalid: %s" % [
				_transcript_kind.capitalize(), exchange_index, validator.last_error,
			]
			return false
	_exchanges = exchanges.duplicate(true)
	return true


func request_opening(payload: Dictionary) -> Dictionary:
	if _transcript_kind != "opening":
		last_error = "Transcript client is configured for %s, not opening." % _transcript_kind
		return {}
	return _request(payload)


func request_world_loop(payload: Dictionary) -> Dictionary:
	if _transcript_kind != "world_loop":
		last_error = "Transcript client is configured for %s, not world loop." % _transcript_kind
		return {}
	return _request(payload)


func _request(payload: Dictionary) -> Dictionary:
	var started_usec := Time.get_ticks_usec()
	last_error = ""
	request_count += 1
	if _index >= _exchanges.size():
		last_error = "%s transcript is exhausted." % _transcript_kind.capitalize()
		last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
		return {}
	if not _valid_request_envelope(payload):
		last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
		return {}
	var exchange := _exchanges[_index] as Dictionary
	var expected := exchange.get("request", {}) as Dictionary
	if not _semantic_equal(payload.get("expectedSequence"), expected.get("expectedSequence")):
		last_error = "%s transcript request %d has the wrong expected sequence." % [
			_transcript_kind.capitalize(), _index,
		]
		last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
		return {}
	if not _semantic_equal(payload.get("command"), expected.get("command")):
		last_error = "%s transcript request %d diverged: actual=%s expected=%s" % [
			_transcript_kind.capitalize(), _index,
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


func resume_world_loop(session_id: String) -> Dictionary:
	last_error = "checkpoint_not_found: Native transcript review does not persist sessions."
	return {
		"format": WORLD_LOOP_SESSION_FORMAT,
		"protocolVersion": WORLD_LOOP_PROTOCOL_VERSION,
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
		last_error = "%s transcript is exhausted." % _transcript_kind.capitalize()
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
		last_error = "%s transcript request has unexpected fields." % _transcript_kind.capitalize()
		return false
	for key in required:
		if not payload.has(key):
			last_error = "%s transcript request is missing %s." % [_transcript_kind.capitalize(), key]
			return false
	if str(payload.get("format", "")) != _session_format:
		last_error = "%s transcript request format is unsupported." % _transcript_kind.capitalize()
		return false
	if int(payload.get("protocolVersion", -1)) != _session_protocol_version:
		last_error = "%s transcript request protocol is unsupported." % _transcript_kind.capitalize()
		return false
	if str(payload.get("requestId", "")).is_empty() or str(payload.get("sessionId", "")).is_empty():
		last_error = "%s transcript request IDs must not be empty." % _transcript_kind.capitalize()
		return false
	if typeof(payload.get("command")) != TYPE_DICTIONARY:
		last_error = "%s transcript request command is malformed." % _transcript_kind.capitalize()
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
