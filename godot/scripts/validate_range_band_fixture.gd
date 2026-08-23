extends SceneTree

const BridgeLoader = preload("res://scripts/presentation_bridge_loader.gd")
const FIXTURE_PATH := "res://data/presentation-range-band-replay-v1.json"


func _initialize() -> void:
	var loader := BridgeLoader.new()
	var bridge: Dictionary = loader.load_and_validate(FIXTURE_PATH)
	if bridge.is_empty():
		quit(1)
		return
	var source := bridge.get("source", {}) as Dictionary
	var encounter := bridge.get("encounter", {}) as Dictionary
	if (
		str(source.get("fixtureId", "")) != "phase-1-range-band-held-interrupt"
		or int(source.get("seed", 0)) != 230823
		or str(encounter.get("id", "")) != "enc_range_band_prototype"
	):
		_fail("Fixture identity, seed, or encounter does not match the canonical range-band export.")
		return

	var frames := bridge.get("frames", []) as Array
	if frames.size() != 34:
		_fail("Expected 34 deterministic snapshots, received %d." % frames.size())
		return
	var initial := (frames[0] as Dictionary).get("state", {}) as Dictionary
	if str(initial.get("battleMode", "")) != "range_band_prototype":
		_fail("Initial state is not the range-band prototype.")
		return

	var ready_party: Array[String] = []
	var ready_enemy: Array[String] = []
	for item in initial.get("combatants", []) as Array:
		var combatant := item as Dictionary
		if not bool((combatant.get("disruptor", {}) as Dictionary).get("ready", false)):
			continue
		if str(combatant.get("side", "")) == "party":
			ready_party.append(str(combatant.get("id", "")))
		else:
			ready_enemy.append(str(combatant.get("id", "")))
	if ready_party != ["prototype_duelist"] or ready_enemy != ["prototype_opponent_b"]:
		_fail("Fixture must begin with exactly one authored ready charge per side.")
		return

	var interrupt_count := 0
	for frame_value in frames:
		var frame := frame_value as Dictionary
		var state := frame.get("state", {}) as Dictionary
		var interrupt: Dictionary = {}
		for event_value in state.get("events", []) as Array:
			var event := event_value as Dictionary
			if str(event.get("type", "")) == "disruptor_interrupt":
				interrupt = event
				break
		if interrupt.is_empty():
			continue

		interrupt_count += 1
		var action := frame.get("action", {}) as Dictionary
		var timing := action.get("timing", {}) as Dictionary
		if (
			str(action.get("type", "")) != "disruptor"
			or str(action.get("actorId", "")) != str(interrupt.get("actorId", ""))
			or str(action.get("targetId", "")) != str(interrupt.get("targetId", ""))
			or str(action.get("audioCue", "")) != "disruptor"
			or not is_equal_approx(float(timing.get("beamStartSeconds", -1.0)), 0.22)
			or not is_equal_approx(float(timing.get("visualContactSeconds", -1.0)), 0.46)
			or not is_equal_approx(float(timing.get("durationSeconds", -1.0)), 0.54)
			or not (interrupt.get("audioCues", []) as Array).is_empty()
		):
			_fail("Held interrupt transition does not match the authoritative presentation beat.")
			return

	if interrupt_count != 2:
		_fail("Expected exactly two held interrupt transitions, received %d." % interrupt_count)
		return
	var first_interrupt_action := (frames[1] as Dictionary).get("action", {}) as Dictionary
	var second_interrupt_action := (frames[2] as Dictionary).get("action", {}) as Dictionary
	if (
		str(first_interrupt_action.get("actorId", "")) != "prototype_opponent_b"
		or str(first_interrupt_action.get("targetId", "")) != "prototype_duelist"
		or str(second_interrupt_action.get("actorId", "")) != "prototype_duelist"
		or str(second_interrupt_action.get("targetId", "")) != "prototype_opponent_b"
	):
		_fail("Opening interrupt reactors/targets do not match the authoritative fixture.")
		return

	var final_state := (frames[frames.size() - 1] as Dictionary).get("state", {}) as Dictionary
	if str(final_state.get("status", "")) != "victory":
		_fail("Range-band fixture did not reach its authoritative victory outcome.")
		return

	print(
		"[Godot Range-Band Bridge] PASS frames=%d interrupts=%d outcome=%s"
		% [frames.size(), interrupt_count, str(final_state.get("status", ""))]
	)
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
