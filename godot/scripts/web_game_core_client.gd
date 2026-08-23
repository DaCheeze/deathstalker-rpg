class_name WebGameCoreClient
extends RefCounted

const LIVE_SESSION_FORMAT := "deathstalker-core-session"
const LIVE_SESSION_PROTOCOL_VERSION := 1

var _api: Variant = null
var last_error := ""


func connect_host() -> bool:
	last_error = ""
	if not OS.has_feature("web"):
		last_error = "The JavaScript core host is available only in a Godot Web export."
		return false
	if not Engine.has_singleton("JavaScriptBridge"):
		last_error = "Godot Web export does not expose JavaScriptBridge."
		return false
	var javascript_bridge: Object = Engine.get_singleton("JavaScriptBridge")
	_api = javascript_bridge.call("get_interface", "DeathstalkerCore")
	if _api == null:
		last_error = "DeathstalkerCore JavaScript host was not loaded before Godot startup."
		return false
	return true


func request(payload: Dictionary) -> Dictionary:
	last_error = ""
	if _api == null and not connect_host():
		return {}
	var response_json: Variant = _api.call("handle", JSON.stringify(payload))
	if typeof(response_json) != TYPE_STRING:
		last_error = "DeathstalkerCore returned a non-string response."
		return {}
	var response: Variant = JSON.parse_string(str(response_json))
	if typeof(response) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore returned malformed JSON."
		return {}
	var envelope := response as Dictionary
	if not _valid_envelope(envelope):
		return {}
	return envelope


func _valid_envelope(envelope: Dictionary) -> bool:
	if typeof(envelope.get("format")) != TYPE_STRING or str(envelope.get("format")) != LIVE_SESSION_FORMAT:
		last_error = "DeathstalkerCore response format is unsupported."
		return false
	if (
		typeof(envelope.get("protocolVersion")) != TYPE_FLOAT
		or int(envelope.get("protocolVersion")) != LIVE_SESSION_PROTOCOL_VERSION
	):
		last_error = "DeathstalkerCore response protocol version is unsupported."
		return false
	if typeof(envelope.get("ok")) != TYPE_BOOL:
		last_error = "DeathstalkerCore response is missing a Boolean ok field."
		return false
	if not bool(envelope.get("ok")):
		var error_value: Variant = envelope.get("error")
		if typeof(error_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore error response is malformed."
			return false
		var error_dictionary := error_value as Dictionary
		last_error = "%s: %s" % [
			str(error_dictionary.get("code", "unknown_error")),
			str(error_dictionary.get("message", "No error message supplied.")),
		]
		return true
	if typeof(envelope.get("sequence")) != TYPE_FLOAT:
		last_error = "DeathstalkerCore success response is missing a numeric sequence."
		return false
	var sequence := float(envelope.get("sequence"))
	if not is_finite(sequence) or sequence < 0.0 or floorf(sequence) != sequence:
		last_error = "DeathstalkerCore success response sequence is invalid."
		return false
	var view_value: Variant = envelope.get("view")
	if typeof(view_value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore success response is missing its view."
		return false
	var view := view_value as Dictionary
	if typeof(view.get("sequence")) != TYPE_FLOAT or float(view.get("sequence")) != sequence:
		last_error = "DeathstalkerCore view sequence does not match its envelope."
		return false
	if typeof(view.get("transition")) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore success response is missing its transition."
		return false
	if typeof(view.get("legalActions")) != TYPE_ARRAY:
		last_error = "DeathstalkerCore success response is missing legal actions."
		return false
	return true

