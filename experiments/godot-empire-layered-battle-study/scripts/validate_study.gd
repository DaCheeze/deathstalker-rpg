extends SceneTree

const MAIN_SCENE := "res://main.tscn"

var failures: Array[String] = []


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var scene_resource: Resource = load(MAIN_SCENE)
	if not (scene_resource is PackedScene):
		_fail("Could not load %s as a PackedScene." % MAIN_SCENE)
		_finish()
		return
	var instance := (scene_resource as PackedScene).instantiate()
	root.add_child(instance)
	await process_frame
	await process_frame
	var initial_report := _report(instance)
	_validate_common_contract(initial_report)
	if str(initial_report.get("choice", "")) != "A":
		_fail("Deterministic smoke must begin on choice A.")
	if not bool(initial_report.get("post_enabled", false)) or not bool(initial_report.get("post_material_active", false)):
		_fail("Deterministic smoke must begin with full-world post active.")
	var source_signature_a := _source_signature(initial_report, "A")
	if not bool(instance.call("set_choice", "B")):
		_fail("Runtime rejected valid choice B toggle.")
	await process_frame
	var choice_b_report := _report(instance)
	_validate_common_contract(choice_b_report)
	if str(choice_b_report.get("choice", "")) != "B":
		_fail("Choice B toggle did not update the active layer set.")
	var source_signature_b := _source_signature(choice_b_report, "B")
	if source_signature_a.is_empty() or source_signature_b.is_empty() or source_signature_a == source_signature_b:
		_fail("A and B source signatures must be deterministic and distinct.")
	instance.call("set_post_enabled", false)
	await process_frame
	var raw_report := _report(instance)
	if bool(raw_report.get("post_enabled", true)) or bool(raw_report.get("post_material_active", true)):
		_fail("Raw bypass must remove the post material without changing the world feed.")
	if not bool(raw_report.get("post_world_feed", false)):
		_fail("Raw bypass must continue sampling the exact composed-world viewport.")
	instance.call("set_post_enabled", true)
	instance.call("set_choice", "A")
	await process_frame
	var repeat_report := _report(instance)
	_validate_common_contract(repeat_report)
	if _source_signature(repeat_report, "A") != source_signature_a:
		_fail("A→B→A changed the deterministic source signature.")
	instance.queue_free()
	await process_frame
	_finish()


func _report(instance: Node) -> Dictionary:
	if not instance.has_method("contract_report"):
		_fail("Main study controller does not expose contract_report().")
		return {}
	var value: Variant = instance.call("contract_report")
	if value is Dictionary:
		return value as Dictionary
	_fail("contract_report() must return a Dictionary.")
	return {}


func _validate_common_contract(report: Dictionary) -> void:
	var errors_value: Variant = report.get("errors", [])
	if not (errors_value is Array):
		_fail("Controller errors must be an Array.")
	elif not (errors_value as Array).is_empty():
		for error_value: Variant in errors_value as Array:
			_fail("Controller validation error: %s" % str(error_value))
	if report.get("world_viewport_size") != Vector2i(960, 540):
		_fail("World composition must remain exactly 960x540.")
	if not bool(report.get("post_world_feed", false)):
		_fail("PostComposite is not fed by the exact composed-world viewport.")
	if int(report.get("ui_layer", 0)) != 100 or not bool(report.get("ui_outside_post", false)):
		_fail("UI must remain a CanvasLayer 100 sibling outside post-processing.")


func _source_signature(report: Dictionary, choice: String) -> String:
	var metrics_value: Variant = report.get("source_metrics", {})
	if not (metrics_value is Dictionary):
		return ""
	var choice_value: Variant = (metrics_value as Dictionary).get(choice, {})
	if not (choice_value is Dictionary):
		return ""
	var hashes: Array[String] = []
	for layer_id: String in ["far_backdrop", "stage_floor", "foreground_occluder"]:
		var layer_value: Variant = (choice_value as Dictionary).get(layer_id, {})
		if not (layer_value is Dictionary):
			return ""
		var hash_value := str((layer_value as Dictionary).get("sha256", ""))
		if hash_value.length() != 64:
			return ""
		hashes.append(hash_value)
	return "|".join(hashes)


func _fail(message: String) -> void:
	if not failures.has(message):
		failures.append(message)
	push_error("[Empire Layer Study Smoke] %s" % message)


func _finish() -> void:
	if not failures.is_empty():
		push_error("[Empire Layer Study Smoke] FAILED with %d violation(s)." % failures.size())
		quit(1)
		return
	print("[Empire Layer Study Smoke] PASS exact A/B sources, dimensions/alpha/hashes, layer order, true post feed, raw bypass, and UI separation.")
	quit(0)
