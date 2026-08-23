extends SceneTree

const LicensedBank = preload("res://scripts/audio/licensed_cue_bank.gd")

const MANIFEST_PATH := "res://data/licensed-combat-audio-manifest-v1.json"
const AUDIO_ROOT := "res://assets/audio/licensed"
const REQUIRE_ASSETS_ARGUMENT := "--require-assets"
const ALIGNMENT_TOLERANCE_SECONDS := 0.0001


func _initialize() -> void:
	var require_assets := OS.get_cmdline_user_args().has(REQUIRE_ASSETS_ARGUMENT)
	var bank := LicensedBank.new()
	bank.set_output_suppressed(true)
	var configured: bool = bank.configure(MANIFEST_PATH, AUDIO_ROOT)

	if not configured or not bank.is_valid():
		var reported_errors: Array[String] = bank.errors()
		push_error(
			"Licensed combat audio validation failed with %d error(s)."
			% reported_errors.size()
		)
		bank.free()
		quit(1)
		return

	var absent_probe := LicensedBank.new()
	absent_probe.set_output_suppressed(true)
	var absent_root := ProjectSettings.globalize_path(
		"user://licensed-audio-absent-probe-%d/assets/audio/licensed"
		% Time.get_ticks_usec()
	)
	if (
		not absent_probe.configure(MANIFEST_PATH, absent_root)
		or not absent_probe.is_valid()
		or not absent_probe.is_absent()
	):
		push_error("Licensed combat audio public-checkout absent-state probe failed.")
		absent_probe.free()
		bank.free()
		quit(1)
		return
	absent_probe.free()

	if bank.is_absent():
		if require_assets:
			push_error(
				"Licensed combat audio assets are required, but the staging root is empty: %s"
				% AUDIO_ROOT
			)
			bank.free()
			quit(1)
			return
		print(
			"[Licensed Combat Audio Validator] PASS state=absent declared_assets=%d loaded_assets=0; public-source procedural fallback remains valid."
			% bank.declared_asset_count()
		)
		bank.free()
		quit(0)
		return

	if not bank.is_ready():
		push_error("Licensed combat audio reached an unexpected valid state: %s" % bank.state())
		bank.free()
		quit(1)
		return

	var cue_ids: Array[StringName] = bank.manifest_cue_ids()
	if cue_ids.is_empty():
		push_error("Ready licensed combat audio bank exposes no cue IDs.")
		bank.free()
		quit(1)
		return

	var passed := true
	var rendered_layer_count := 0
	for cue_index in cue_ids.size():
		var cue_id := cue_ids[cue_index]
		if not bank.supports_cue(cue_id):
			push_error("Ready licensed bank does not support manifest cue '%s'." % cue_id)
			passed = false
			continue

		var sequence := cue_index * 7 + 3
		var first: Dictionary = bank.play_cue(cue_id, sequence, 1.0)
		bank.stop()
		var repeated: Dictionary = bank.play_cue(cue_id, sequence, 1.0)
		bank.stop()
		if first.is_empty() or repeated.is_empty():
			push_error("Licensed cue '%s' did not produce a playback plan." % cue_id)
			passed = false
			continue
		if not bool(first.get("playback_ready", false)) or not bool(first.get("licensed", false)):
			push_error("Licensed cue '%s' did not report licensed playback readiness." % cue_id)
			passed = false
		if not _plans_match(first, repeated):
			push_error("Licensed cue '%s' did not select a deterministic playback plan." % cue_id)
			passed = false

		var layers_value: Variant = first.get("layers", [])
		if typeof(layers_value) != TYPE_ARRAY or (layers_value as Array).is_empty():
			push_error("Licensed cue '%s' produced no scheduled layers." % cue_id)
			passed = false
			continue
		for layer_value in layers_value as Array:
			if typeof(layer_value) != TYPE_DICTIONARY:
				push_error("Licensed cue '%s' produced a non-object layer plan." % cue_id)
				passed = false
				continue
			var layer := layer_value as Dictionary
			rendered_layer_count += 1
			if float(layer.get("gain_db", 1.0)) > 0.0:
				push_error("Licensed cue '%s' scheduled a layer above 0 dB." % cue_id)
				passed = false
			var aligned := float(layer.get("aligned_strongest_window_seconds", -1.0))
			var not_before := float(layer.get("not_before_seconds", 0.0))
			var scheduled_start := float(layer.get("scheduled_start_seconds", -1.0))
			var scheduled_stop := float(layer.get("scheduled_stop_seconds", -1.0))
			if scheduled_start + ALIGNMENT_TOLERANCE_SECONDS < not_before:
				push_error("Licensed cue '%s' violated a layer notBefore boundary." % cue_id)
				passed = false
			if aligned + ALIGNMENT_TOLERANCE_SECONDS < scheduled_start:
				push_error("Licensed cue '%s' aligned its strongest window before playback." % cue_id)
				passed = false
			if scheduled_stop <= scheduled_start:
				push_error("Licensed cue '%s' scheduled a non-positive layer interval." % cue_id)
				passed = false

	if bank.loaded_asset_count() != bank.declared_asset_count():
		push_error(
			"Ready licensed bank loaded %d/%d declared assets."
			% [bank.loaded_asset_count(), bank.declared_asset_count()]
		)
		passed = false
	if rendered_layer_count <= 0:
		push_error("Ready licensed bank validation exercised no layers.")
		passed = false
	if bank.has_active_playback():
		push_error("Suppressed licensed validation retained active playback after stop().")
		passed = false

	if passed:
		print(
			"[Licensed Combat Audio Validator] PASS state=ready cues=%d assets=%d deterministic_layers=%d hashes=match wavs=manifested fallback_probe=absent output_suppressed=true."
			% [cue_ids.size(), bank.loaded_asset_count(), rendered_layer_count]
		)

	bank.free()
	quit(0 if passed else 1)


func _plans_match(left: Dictionary, right: Dictionary) -> bool:
	if left.get("cue_id") != right.get("cue_id"):
		return false
	if left.get("variation_index") != right.get("variation_index"):
		return false
	if left.get("layer_count") != right.get("layer_count"):
		return false
	if not is_equal_approx(
		float(left.get("duration_seconds", -1.0)),
		float(right.get("duration_seconds", -2.0))
	):
		return false
	var left_layers_value: Variant = left.get("layers", [])
	var right_layers_value: Variant = right.get("layers", [])
	if typeof(left_layers_value) != TYPE_ARRAY or typeof(right_layers_value) != TYPE_ARRAY:
		return false
	var left_layers := left_layers_value as Array
	var right_layers := right_layers_value as Array
	if left_layers.size() != right_layers.size():
		return false
	for index in left_layers.size():
		if not _layer_plans_match(left_layers[index] as Dictionary, right_layers[index] as Dictionary):
			return false
	return true


func _layer_plans_match(left: Dictionary, right: Dictionary) -> bool:
	for key in [
		"asset_id",
		"gain_db",
		"source_start_seconds",
		"source_stop_seconds",
		"scheduled_start_seconds",
		"scheduled_stop_seconds",
		"aligned_strongest_window_seconds",
		"not_before_seconds",
	]:
		if not left.has(key) or not right.has(key):
			return false
		if key == "asset_id":
			if str(left[key]) != str(right[key]):
				return false
		elif not is_equal_approx(float(left[key]), float(right[key])):
			return false
	return true
