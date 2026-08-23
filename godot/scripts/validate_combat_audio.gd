extends SceneTree

const CombatAudio = preload("res://scripts/procedural_combat_audio.gd")

const SUPPORTED_CUES: Array[StringName] = [
	&"vibro_blade",
	&"twin_vibro_daggers",
	&"heavy_smash",
	&"concussive_shove",
	&"disruptor",
	&"shield_raise",
	&"psionic",
	&"particle",
	&"ballistic_scatter",
	&"plasma",
]

const UNSUPPORTED_CUES: Array[StringName] = [
	&"blade",
	&"blunt",
	&"ballistic",
	&"laser",
	&"boost_enter",
	&"boost_exit",
	&"shield_shatter",
	&"critical_hit",
	&"death",
	&"burnout_damage",
	&"boost_crash",
	&"victory",
	&"defeat",
]


func _initialize() -> void:
	var synth := CombatAudio.new()
	for cue_id in SUPPORTED_CUES:
		if not synth.supports_cue(cue_id):
			push_error("Expected supported combat audio cue: %s" % cue_id)
			synth.free()
			quit(1)
			return
	for cue_id in UNSUPPORTED_CUES:
		if synth.supports_cue(cue_id):
			push_error("Unsupported combat audio cue acquired an implicit fallback: %s" % cue_id)
			synth.free()
			quit(1)
			return
	var disruptor_metadata: Dictionary = synth.cue_metadata(&"disruptor")
	if not is_equal_approx(float(disruptor_metadata.get("duration_seconds", -1.0)), 0.540):
		push_error("Disruptor duration must preserve the serialized 540 ms action timing.")
		synth.free()
		quit(1)
		return
	if not is_equal_approx(float(disruptor_metadata.get("beam_seconds", -1.0)), 0.220):
		push_error("Disruptor beam must preserve the serialized 220 ms action timing.")
		synth.free()
		quit(1)
		return
	var disruptor_contacts := disruptor_metadata.get("contacts", PackedFloat32Array()) as PackedFloat32Array
	if disruptor_contacts.size() != 1 or not is_equal_approx(disruptor_contacts[0], 0.460):
		push_error("Disruptor must expose exactly one serialized contact at 460 ms.")
		synth.free()
		quit(1)
		return
	var shield_metadata: Dictionary = synth.cue_metadata(&"shield_raise")
	if not is_equal_approx(float(shield_metadata.get("duration_seconds", -1.0)), 0.370):
		push_error("Shield Raise must expose the authored 370 ms review duration.")
		synth.free()
		quit(1)
		return
	if not is_equal_approx(float(shield_metadata.get("lock_seconds", -1.0)), 0.240):
		push_error("Shield Raise must expose one containment lock at 240 ms.")
		synth.free()
		quit(1)
		return
	var shield_contacts := shield_metadata.get("contacts", PackedFloat32Array()) as PackedFloat32Array
	if shield_contacts.size() != 1 or not is_equal_approx(shield_contacts[0], 0.240):
		push_error("Shield Raise contact metadata must be the 240 ms containment lock.")
		synth.free()
		quit(1)
		return
	var psionic_metadata: Dictionary = synth.cue_metadata(&"psionic")
	if not is_equal_approx(float(psionic_metadata.get("duration_seconds", -1.0)), 0.455):
		push_error("Psionics must expose the authored 455 ms review duration.")
		synth.free()
		quit(1)
		return
	var psionic_contacts := psionic_metadata.get("contacts", PackedFloat32Array()) as PackedFloat32Array
	if psionic_contacts.size() != 1 or not is_equal_approx(psionic_contacts[0], 0.320):
		push_error("Psionics must preserve exactly one semantic contact at 320 ms.")
		synth.free()
		quit(1)
		return
	var expected_ranged_timing := {
		&"particle": [0.320, 0.250],
		&"ballistic_scatter": [0.300, 0.210],
		&"plasma": [0.345, 0.250],
	}
	for cue_id in expected_ranged_timing:
		var timing: Array = expected_ranged_timing[cue_id]
		var metadata: Dictionary = synth.cue_metadata(cue_id)
		var contacts := metadata.get("contacts", PackedFloat32Array()) as PackedFloat32Array
		if (
			not is_equal_approx(float(metadata.get("duration_seconds", -1.0)), float(timing[0]))
			or contacts.size() != 1
			or not is_equal_approx(contacts[0], float(timing[1]))
		):
			push_error("Ranged cue timing metadata diverged: %s" % cue_id)
			synth.free()
			quit(1)
			return
	if not synth.run_render_smoke_test():
		synth.free()
		quit(1)
		return
	print(
		"[Godot Combat Audio Validator] PASS ten distinct named cues: four melee, three ranged, disruptor, shield containment, and psionic pressure; unsupported semantics remain explicit silence."
	)
	synth.free()
	quit(0)
