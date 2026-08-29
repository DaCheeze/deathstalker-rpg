extends SceneTree

const OpeningController = preload("res://scripts/opening_expedition_controller.gd")
const TranscriptClient = preload("res://scripts/opening_transcript_client.gd")
const WebClient = preload("res://scripts/web_game_core_client.gd")
const FIXTURE_PATH := "res://data/opening-expedition-transcript-v1.json"


class ResumeClient:
	extends RefCounted

	var last_error := ""
	var response: Dictionary = {}

	func request_opening(_payload: Dictionary) -> Dictionary:
		last_error = "Resume client does not accept ordinary requests."
		return {}

	func resume_opening(_session_id: String) -> Dictionary:
		return response.duplicate(true)


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var fixture_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(FIXTURE_PATH))
	if typeof(fixture_value) != TYPE_DICTIONARY:
		_fail("Transcript is not a JSON object.")
		return
	var fixture: Dictionary = fixture_value as Dictionary
	if str(fixture.get("format", "")) != "deathstalker-opening-expedition-transcript":
		_fail("Transcript format is unsupported.")
		return
	var exchanges: Array = fixture.get("exchanges", []) as Array
	if exchanges.is_empty() or int(fixture.get("commandCount", -1)) != exchanges.size():
		_fail("Transcript exchange count is invalid.")
		return

	var validator: RefCounted = WebClient.new()
	for exchange_index in exchanges.size():
		var exchange: Dictionary = exchanges[exchange_index] as Dictionary
		var response: Dictionary = exchange.get("response", {}) as Dictionary
		if not bool(validator.call("_valid_opening_envelope", response)):
			_fail("Response %d failed strict Godot validation: %s" % [exchange_index, validator.last_error])
			return
	var malformed_role_response := (exchanges[0] as Dictionary).get("response", {}).duplicate(true) as Dictionary
	var malformed_view := malformed_role_response.get("view", {}) as Dictionary
	var malformed_party := malformed_view.get("party", []) as Array
	(malformed_party[0] as Dictionary).erase("role")
	if bool(validator.call("_valid_opening_envelope", malformed_role_response)):
		_fail("Strict Godot validation accepted an opening party member without a role.")
		return
	var resume_response := (exchanges[1] as Dictionary).get("response", {}).duplicate(true) as Dictionary
	resume_response["requestId"] = "godot-opening-resume"
	resume_response["sessionId"] = "godot-opening-resume"
	resume_response["resultType"] = "expedition_resumed"
	if not bool(validator.call("_valid_opening_envelope", resume_response)):
		_fail("Synthetic resume response failed strict Godot validation: %s" % validator.last_error)
		return
	var resume_client := ResumeClient.new()
	resume_client.response = resume_response
	var resume_controller: RefCounted = OpeningController.new()
	if not resume_controller.configure(resume_client, "godot-opening-resume", 230825):
		_fail(resume_controller.last_error)
		return
	var resumed: Dictionary = resume_controller.call("resume_expedition") as Dictionary
	if resumed.is_empty() or int(resume_controller.sequence) != int(resume_response.get("sequence", -1)):
		_fail("Opening controller did not adopt the resumed authoritative sequence.")
		return

	var client: RefCounted = TranscriptClient.new()
	if not bool(client.call("configure", FIXTURE_PATH)):
		_fail(str(client.get("last_error")))
		return
	var controller: RefCounted = OpeningController.new()
	if not controller.configure(client, "godot-opening-native-review", 230825):
		_fail(controller.last_error)
		return
	var saw_exploration_completion := false
	var saw_field_contact_start := false
	var saw_field_return := false
	for exchange_index in exchanges.size():
		var exchange: Dictionary = exchanges[exchange_index] as Dictionary
		var request: Dictionary = exchange.get("request", {}) as Dictionary
		var command: Dictionary = request.get("command", {}) as Dictionary
		var command_type := str(command.get("type", ""))
		var response: Dictionary
		match command_type:
			"create_expedition":
				response = controller.create_expedition()
			"continue":
				response = controller.continue_expedition()
			"complete_exploration":
				saw_exploration_completion = true
				var point := command.get("playerPosition", {}) as Dictionary
				response = controller.complete_exploration(
					str(command.get("mapId", "")),
					str(command.get("objectiveLandmarkId", "")),
					Vector2(float(point.get("x", 0.0)), float(point.get("y", 0.0)))
				)
			"start_field_contact":
				saw_field_contact_start = true
				var point := command.get("playerPosition", {}) as Dictionary
				response = controller.start_field_contact(
					str(command.get("contactId", "")),
					str(command.get("trigger", "")),
					Vector2(float(point.get("x", 0.0)), float(point.get("y", 0.0)))
				)
			"return_to_exploration":
				saw_field_return = true
				response = controller.return_to_exploration()
			"apply_action":
				response = controller.apply_action(command.get("action", {}) as Dictionary)
			"advance_ai":
				response = controller.advance_ai()
			"choose_recovery":
				response = controller.choose_recovery(str(command.get("choice", "")))
			_:
				_fail("Transcript command %d has unsupported type '%s'." % [exchange_index, command_type])
				return
		if response.is_empty():
			_fail("Controller rejected transcript command %d: %s" % [exchange_index, controller.last_error])
			return

	var final: Dictionary = fixture.get("final", {}) as Dictionary
	if (
		int(client.call("consumed_exchange_count")) != exchanges.size()
		or int(controller.sequence) != int(final.get("sequence", -1))
		or str(final.get("beatId", "")) != "yacht_safety"
		or str(final.get("awaiting", "")) != "complete"
		or not saw_exploration_completion
		or not saw_field_contact_start
		or not saw_field_return
	):
		_fail("Transcript did not finish at authoritative yacht safety.")
		return
	print(
		"[Godot Opening Expedition] PASS exchanges=%d sequence=%d beat=yacht_safety awaiting=complete strict_responses=true exploration_completion=true field_contact=true field_return=true reusable_transcript_client=true controller_replay=true resume=true"
		% [exchanges.size(), int(controller.sequence)]
	)
	quit(0)


func _fail(message: String) -> void:
	push_error("[Godot Opening Expedition] FAIL %s" % message)
	quit(1)
