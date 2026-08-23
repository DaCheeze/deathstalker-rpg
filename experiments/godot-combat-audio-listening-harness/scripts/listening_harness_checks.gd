class_name ListeningHarnessChecks
extends RefCounted

const ProductionSource = preload("res://scripts/production_audio_source.gd")
const Catalog = preload("res://scripts/review_catalog.gd")
const ExactVariation = preload("res://scripts/exact_variation_player.gd")


static func run(synth: Variant) -> Dictionary:
	var passed := true
	var selected_renders := 0
	var licensed_selections := 0
	var procedural_selections := 0
	var seen := {}
	var cue_ids := Catalog.cue_ids()
	var expected_steps := cue_ids.size() * Catalog.VARIATION_COUNT

	if cue_ids.size() != 10:
		push_error("Listening harness catalog must contain exactly ten review cues.")
		passed = false
	if Catalog.VARIATION_COUNT != 6:
		push_error("Listening harness must expose exactly six deterministic variations.")
		passed = false
	if not bool(synth.is_output_suppressed()):
		push_error("Headless listening-harness validation must suppress audible output.")
		passed = false
	if synth.get_node_or_null("NativeProceduralOutput") != null:
		push_error("Headless listening-harness validation created an audio output player.")
		passed = false

	for cue_id in cue_ids:
		if not bool(synth.supports_cue(cue_id)):
			push_error("Production synth does not support harness cue: %s" % cue_id)
			passed = false
		var metadata: Dictionary = synth.cue_metadata(cue_id) as Dictionary
		if metadata.is_empty():
			push_error("Production metadata is missing for harness cue: %s" % cue_id)
			passed = false
			continue
		var duration_seconds := float(metadata.get("duration_seconds", 0.0))
		var contacts: PackedFloat32Array = metadata.get("contacts", PackedFloat32Array())
		if duration_seconds <= 0.0 or contacts.is_empty():
			push_error("Production timing metadata is invalid for harness cue: %s" % cue_id)
			passed = false
		for contact in contacts:
			if contact < 0.0 or contact >= duration_seconds:
				push_error("Harness cue contact is outside its render: %s at %.3f s" % [cue_id, contact])
				passed = false

	if bool(synth.supports_cue(&"unsupported_review_probe")):
		push_error("Production synth unexpectedly accepted the harness unsupported-cue probe.")
		passed = false
	if not bool(synth.run_render_smoke_test()):
		push_error("Production deterministic render smoke failed through the listening harness.")
		passed = false

	var plan := Catalog.full_matrix_plan()
	if plan.size() != expected_steps:
		push_error("Listening harness full matrix must contain exactly %d review steps." % expected_steps)
		passed = false

	for plan_index in plan.size():
		var item: Dictionary = plan[plan_index]
		var cue_index_value := int(item["cue_index"])
		var variation_index := int(item["variation_index"])
		var expected_cue_index := floori(float(plan_index) / float(Catalog.VARIATION_COUNT))
		var expected_variation := plan_index % Catalog.VARIATION_COUNT
		if cue_index_value != expected_cue_index or variation_index != expected_variation:
			push_error("Listening harness matrix order diverged at step %d." % plan_index)
			passed = false

		var cue_id := cue_ids[cue_index_value]
		var signature := "%s:%d" % [cue_id, variation_index]
		if seen.has(signature):
			push_error("Listening harness matrix duplicated review step: %s" % signature)
			passed = false
		seen[signature] = true

		var is_last_variation := variation_index == Catalog.VARIATION_COUNT - 1
		var is_last_cue := cue_index_value == cue_ids.size() - 1
		var expected_gap := Catalog.DRY_GAP_SECONDS
		if is_last_variation:
			expected_gap = 0.0 if is_last_cue else Catalog.FAMILY_GAP_SECONDS
		if not is_equal_approx(float(item["gap_seconds"]), expected_gap):
			push_error("Listening harness matrix gap diverged at step %d." % plan_index)
			passed = false

		var metrics := ExactVariation.play(synth, cue_id, variation_index)
		selected_renders += 1
		if metrics.is_empty():
			passed = false
			continue
		var source := str(metrics.get("source", "procedural"))
		if source == "licensed":
			licensed_selections += 1
			if (
				not bool(metrics.get("playback_ready", false))
				or int(metrics.get("layer_count", 0)) <= 0
			):
				push_error("Harness licensed selection did not schedule playback: %s" % signature)
				passed = false
		else:
			procedural_selections += 1
			if not bool(metrics.get("finite", false)) or float(metrics.get("peak", 0.0)) <= 0.01:
				push_error("Harness selection rendered invalid or silent audio: %s" % signature)
				passed = false
		var metadata: Dictionary = synth.cue_metadata(cue_id) as Dictionary
		if not is_equal_approx(
			float(metrics.get("duration_seconds", 0.0)),
			float(metadata.get("duration_seconds", -1.0))
		):
			push_error("Harness selection duration diverged: %s" % signature)
			passed = false
		if int(synth.get_variation_sequence()) != variation_index + 1:
			push_error("Harness exact-variation selection diverged: %s" % signature)
			passed = false

	if seen.size() != expected_steps:
		push_error(
			"Listening harness matrix did not cover %d unique cue/variation pairs." % expected_steps
		)
		passed = false

	synth.stop()
	if int(synth.get_pending_frame_count()) != 0:
		push_error("Listening harness stop left queued procedural frames.")
		passed = false

	return {
		"passed": passed,
		"cues": cue_ids.size(),
		"variations": Catalog.VARIATION_COUNT,
		"selected_renders": selected_renders,
		"licensed_selections": licensed_selections,
		"procedural_selections": procedural_selections,
		"plan_steps": plan.size(),
		"dry_gap_seconds": Catalog.DRY_GAP_SECONDS,
		"family_gap_seconds": Catalog.FAMILY_GAP_SECONDS,
		"production_source": ProductionSource.source_path(),
	}
