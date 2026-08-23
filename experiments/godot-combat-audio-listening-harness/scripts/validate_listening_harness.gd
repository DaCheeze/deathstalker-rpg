extends SceneTree

const ProductionSource = preload("res://scripts/production_audio_source.gd")
const Checks = preload("res://scripts/listening_harness_checks.gd")

var _synth: Variant


func _initialize() -> void:
	var synth_script := ProductionSource.load_script()
	if synth_script == null:
		quit(1)
		return
	_synth = synth_script.new()
	if not ProductionSource.install_dependencies(_synth):
		_synth.free()
		_synth = null
		quit(1)
		return
	_synth.set_output_suppressed(true)
	root.add_child(_synth)
	call_deferred("_run_checks")


func _run_checks() -> void:
	var result := Checks.run(_synth)
	var passed := bool(result["passed"])
	if passed:
		print(
			"[Combat Audio Listening Harness] STRUCTURAL PASS cues=%d variations=%d selected_renders=%d licensed=%d procedural=%d plan_steps=%d dry_gap=%.2f family_gap=%.2f output_suppressed=true source=%s"
			% [
				int(result["cues"]),
				int(result["variations"]),
				int(result["selected_renders"]),
				int(result["licensed_selections"]),
				int(result["procedural_selections"]),
				int(result["plan_steps"]),
				float(result["dry_gap_seconds"]),
				float(result["family_gap_seconds"]),
				str(result["production_source"]),
			]
		)
	else:
		push_error("[Combat Audio Listening Harness] STRUCTURAL FAILED")
	_synth.shutdown()
	_synth.free()
	_synth = null
	quit(0 if passed else 1)
