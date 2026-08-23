extends SceneTree

const WebClient = preload("res://scripts/web_game_core_client.gd")


func _init() -> void:
	var client = WebClient.new()
	var success := {
		"format": "deathstalker-core-session",
		"protocolVersion": 1.0,
		"ok": true,
		"sequence": 1.0,
		"view": {
			"sequence": 1.0,
			"transition": {},
			"legalActions": [],
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
		"error": {"code": "stale_sequence", "message": "Expected sequence 1"},
	}
	if not client._valid_envelope(error_response):
		_fail("Valid error envelope was rejected.")
		return
	if client.last_error != "stale_sequence: Expected sequence 1":
		_fail("Error details were not preserved.")
		return
	print("[Godot Web Core Client Validator] PASS protocol=1 success=1 error=1 invalid=1")
	quit(0)


func _fail(message: String) -> void:
	push_error("[Godot Web Core Client Validator] FAIL %s" % message)
	quit(1)

