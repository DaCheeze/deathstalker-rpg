class_name ExactVariationPlayer
extends RefCounted

const Catalog = preload("res://scripts/review_catalog.gd")


## Selects one production variation deterministically without changing synthesis.
## Earlier sequence steps render while output is suppressed, then are discarded
## synchronously before the requested step is queued.
static func play(synth: Variant, cue_id: StringName, variation_index: int) -> Dictionary:
	if variation_index < 0 or variation_index >= Catalog.VARIATION_COUNT:
		push_error("Listening harness variation is outside 0..5: %d" % variation_index)
		return {}
	if not bool(synth.supports_cue(cue_id)):
		push_error("Listening harness requested unsupported production cue: %s" % cue_id)
		return {}

	var preserve_suppression: bool = bool(synth.is_output_suppressed())
	synth.set_output_suppressed(true)
	synth.reset_variation_sequence()
	for _prior_step in variation_index:
		synth.play_cue(cue_id)
	synth.stop()
	synth.set_output_suppressed(preserve_suppression)
	return synth.play_cue(cue_id) as Dictionary
