extends SceneTree

const RuntimeVisualAssets = preload("res://scripts/runtime_visual_assets.gd")


func _initialize() -> void:
	var assets := RuntimeVisualAssets.new()
	if not assets.load_and_validate(true):
		for message: String in assets.errors_copy():
			push_error(message)
		quit(1)
		return
	if assets.selection_id() != "imperial-skirmish-choice-a":
		push_error("Runtime visual validator loaded the wrong selection.")
		quit(1)
		return
	for layer_id: String in ["far_backdrop", "stage_floor", "foreground_occluder"]:
		if assets.texture_for(layer_id) == null:
			push_error("Runtime visual validator is missing texture %s." % layer_id)
			quit(1)
			return
	var metrics := assets.metrics_copy()
	print(
		"[Runtime Visual Assets] PASS selection=%s layers=%d source_hashes=verified dimensions=1920x1080"
		% [assets.selection_id(), metrics.size()]
	)
	quit(0)
