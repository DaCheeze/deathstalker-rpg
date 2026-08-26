extends SceneTree

const LiveController = preload("res://scripts/live_session_controller.gd")


class FakeClient:
	extends RefCounted

	var last_error := ""
	var fail_next_transport := false
	var force_error := false
	var requests: Array[Dictionary] = []

	func request(payload: Dictionary) -> Dictionary:
		requests.append(payload.duplicate(true))
		if fail_next_transport:
			fail_next_transport = false
			last_error = "simulated transport interruption"
			return {}
		if force_error:
			return {
				"format": "deathstalker-core-session",
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
		var creating := str(command.get("type", "")) == "create_session"
		var response_sequence := 0 if creating else int(payload.get("expectedSequence", 0)) + 1
		return {
			"format": "deathstalker-core-session",
			"protocolVersion": 1.0,
			"ok": true,
			"requestId": payload.get("requestId"),
			"sessionId": payload.get("sessionId"),
			"sequence": response_sequence,
			"resultType": "session_created" if creating else "action_applied",
			"view": {},
		}


func _init() -> void:
	var client := FakeClient.new()
	client.fail_next_transport = true
	var controller := LiveController.new()
	if not controller.configure(client, "validator-session", 230823):
		_fail(controller.last_error)
		return
	var created := controller.create_session()
	if created.is_empty() or controller.sequence != 0 or controller.retry_count != 1:
		_fail("Create-session retry did not recover with sequence 0.")
		return
	if client.requests.size() != 2:
		_fail("Exact-ID retry did not issue exactly two transport calls.")
		return
	if client.requests[0] != client.requests[1]:
		_fail("Transport retry changed the request payload or requestId.")
		return

	var applied := controller.apply_action({"type": "PassTurn", "actorId": "party"})
	if applied.is_empty() or controller.sequence != 1:
		_fail("Successful action did not advance the authoritative sequence once.")
		return

	client.force_error = true
	var rejected := controller.advance_ai()
	if bool(rejected.get("ok", true)) or controller.sequence != 1:
		_fail("Error response changed the authoritative sequence.")
		return
	if not controller.last_error.begins_with("stale_sequence:"):
		_fail("Error response did not preserve its recovery reason.")
		return

	client.force_error = false
	var restarted := controller.restart_session()
	if restarted.is_empty() or controller.sequence != 2:
		_fail("Restart did not recover after a rejected request.")
		return

	print(
		"[Godot Live Session Controller] PASS retry=exact-id sequence=0>1>2 error=preserved restart=recovered"
	)
	quit(0)


func _fail(message: String) -> void:
	push_error("[Godot Live Session Controller] FAIL %s" % message)
	quit(1)
