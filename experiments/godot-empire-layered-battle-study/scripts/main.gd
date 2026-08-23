extends Node2D

const StudyAssetLoader = preload("res://scripts/study_asset_loader.gd")
const DESIGN_SIZE := Vector2i(1920, 1080)
const WORLD_SIZE := Vector2i(960, 540)
const EXPECTED_WORLD_LAYER_NAMES: Array[String] = [
	"FarBackdropLayer",
	"StageFloorLayer",
	"UnitStandInLayer",
	"EmissiveLayer",
	"ForegroundOccluderLayer",
]
const EXPECTED_WORLD_LAYER_GROUPS: Array[String] = [
	"study_far_backdrop",
	"study_stage_floor",
	"study_unit_stand_ins",
	"study_emissive_pass",
	"study_foreground_occluder",
]

@onready var world_viewport: SubViewport = $WorldViewport
@onready var world_root: Node2D = $WorldViewport/WorldRoot
@onready var world_layers: Array[Node2D] = [
	$WorldViewport/WorldRoot/FarBackdropLayer,
	$WorldViewport/WorldRoot/StageFloorLayer,
	$WorldViewport/WorldRoot/UnitStandInLayer,
	$WorldViewport/WorldRoot/EmissiveLayer,
	$WorldViewport/WorldRoot/ForegroundOccluderLayer,
]
@onready var post_composite: TextureRect = $PostComposite
@onready var ui_layer: CanvasLayer = $Layer09UI
@onready var ui_renderer: Node2D = $Layer09UI/UIRenderer

var asset_loader = StudyAssetLoader.new()
var active_choice := "A"
var post_enabled := true
var load_errors: Array[String] = []
var argument_errors: Array[String] = []
var post_material: ShaderMaterial
var capture_relative_path := ""
var capture_frame_target := 8
var elapsed_frames := 0
var capture_in_progress := false


func _ready() -> void:
	_parse_arguments()
	asset_loader.load_and_validate()
	load_errors.assign(asset_loader.errors_copy())
	for message: String in argument_errors:
		_fail(message)
	post_material = post_composite.material as ShaderMaterial
	post_composite.texture = world_viewport.get_texture()
	for layer: Node2D in world_layers:
		layer.call("bind_controller", self)
	ui_renderer.call("bind_controller", self)
	_apply_post_state()
	_validate_compositor_contract()
	_refresh_all()
	_print_source_evidence()
	if load_errors.is_empty():
		print("[Empire Layer Study] READY choice=%s post=%s; no gameplay or asset selection is performed." % [active_choice, "ON" if post_enabled else "RAW"])
	else:
		call_deferred("_quit_with_error")


func _process(_delta: float) -> void:
	elapsed_frames += 1
	if not capture_relative_path.is_empty() and not capture_in_progress and elapsed_frames >= capture_frame_target and load_errors.is_empty():
		capture_in_progress = true
		_capture_frame()


func _unhandled_input(event: InputEvent) -> void:
	if not (event is InputEventKey):
		return
	var key_event := event as InputEventKey
	if not key_event.pressed or key_event.echo:
		return
	var handled := true
	match key_event.keycode:
		KEY_TAB:
			set_choice("B" if active_choice == "A" else "A")
		KEY_1:
			set_choice("A")
		KEY_2:
			set_choice("B")
		KEY_P:
			set_post_enabled(not post_enabled)
		KEY_ESCAPE:
			get_tree().quit()
		_:
			handled = false
	if handled:
		get_viewport().set_input_as_handled()


func render_snapshot() -> Dictionary:
	return {
		"choice": active_choice,
		"label": asset_loader.label_for(active_choice),
		"post_enabled": post_enabled,
		"far_backdrop": asset_loader.texture_for(active_choice, "far_backdrop"),
		"stage_floor": asset_loader.texture_for(active_choice, "stage_floor"),
		"foreground_occluder": asset_loader.texture_for(active_choice, "foreground_occluder"),
	}


func set_choice(choice: String) -> bool:
	var normalized := choice.to_upper()
	if normalized != "A" and normalized != "B":
		return false
	active_choice = normalized
	_refresh_all()
	print("[Empire Layer Study] Active matched-letter comparison set=%s (no selection implied)." % active_choice)
	return true


func set_post_enabled(value: bool) -> void:
	post_enabled = value
	_apply_post_state()
	ui_renderer.call("refresh")
	print("[Empire Layer Study] Full-world post=%s." % ("ON" if post_enabled else "RAW BYPASS"))


func contract_report() -> Dictionary:
	return {
		"errors": load_errors.duplicate(),
		"choice": active_choice,
		"post_enabled": post_enabled,
		"world_viewport_size": world_viewport.size,
		"post_world_feed": post_composite.texture == world_viewport.get_texture(),
		"post_material_active": post_composite.material != null,
		"ui_layer": ui_layer.layer,
		"ui_outside_post": ui_layer.get_parent() == self and not post_composite.is_ancestor_of(ui_layer),
		"source_metrics": asset_loader.metrics_copy(),
	}


func _apply_post_state() -> void:
	post_composite.material = post_material if post_enabled else null


func _refresh_all() -> void:
	for layer: Node2D in world_layers:
		layer.call("refresh")
	if is_instance_valid(ui_renderer):
		ui_renderer.call("refresh")


func _validate_compositor_contract() -> void:
	if world_viewport.size != WORLD_SIZE:
		_fail("WorldViewport must remain exactly 960x540.")
	if world_root.scale != Vector2(0.5, 0.5):
		_fail("WorldRoot must map 1920x1080 design coordinates into the half-resolution viewport with scale 0.5.")
	if world_root.get_child_count() != EXPECTED_WORLD_LAYER_NAMES.size():
		_fail("WorldRoot must contain exactly five physically separate study layers.")
	for layer_index: int in range(mini(world_root.get_child_count(), EXPECTED_WORLD_LAYER_NAMES.size())):
		var layer_node := world_root.get_child(layer_index)
		if layer_node.name != EXPECTED_WORLD_LAYER_NAMES[layer_index]:
			_fail("World layer %d is %s; expected %s." % [layer_index, layer_node.name, EXPECTED_WORLD_LAYER_NAMES[layer_index]])
		if not layer_node.is_in_group("empire_layered_study_world") or not layer_node.is_in_group(EXPECTED_WORLD_LAYER_GROUPS[layer_index]):
			_fail("World layer %s is missing its semantic study groups." % layer_node.name)
		if layer_node is Node2D and (layer_node as Node2D).z_index != layer_index:
			_fail("World layer %s z_index must be %d." % [layer_node.name, layer_index])
	if post_composite.get_parent() != self:
		_fail("PostComposite must be a root sibling fed by the WorldViewport.")
	if post_composite.texture != world_viewport.get_texture():
		_fail("PostComposite must sample the exact composed-world viewport texture.")
	if post_material == null or post_material.shader == null or post_material.shader.resource_path != "res://shaders/world_post.gdshader":
		_fail("PostComposite must preserve the dedicated full-world post shader.")
	if ui_layer.get_parent() != self or post_composite.is_ancestor_of(ui_layer):
		_fail("Layer09UI must remain a root sibling outside post-processing.")
	if ui_layer.layer != 100:
		_fail("Layer09UI must remain CanvasLayer 100.")


func _parse_arguments() -> void:
	for argument: String in OS.get_cmdline_user_args():
		if argument.begins_with("--choice="):
			var requested_choice := argument.trim_prefix("--choice=").to_upper()
			if requested_choice == "A" or requested_choice == "B":
				active_choice = requested_choice
			else:
				argument_errors.append("--choice must be A or B.")
		elif argument == "--raw":
			post_enabled = false
		elif argument == "--post":
			post_enabled = true
		elif argument.begins_with("--capture="):
			capture_relative_path = argument.trim_prefix("--capture=").replace("\\", "/")
			if not _valid_capture_relative_path(capture_relative_path):
				argument_errors.append("Capture path must be a repository-relative docs/screenshots/*.png path.")
		elif argument.begins_with("--capture-frame="):
			capture_frame_target = maxi(3, argument.trim_prefix("--capture-frame=").to_int())


func _valid_capture_relative_path(path: String) -> bool:
	return path.begins_with("docs/screenshots/") and path.ends_with(".png") and not path.contains("../") and not path.is_absolute_path()


func _capture_frame() -> void:
	if DisplayServer.get_name() == "headless":
		_fail("Capture requires an active rendering driver; the headless dummy renderer cannot supply framebuffer pixels.")
		get_tree().quit(2)
		return
	# Capture is already deferred by a fixed frame count; force the current
	# deterministic draw instead of waiting on a driver-specific post-draw signal.
	RenderingServer.force_draw(false)
	var image: Image = get_viewport().get_texture().get_image()
	if image == null:
		_fail("Capture requires an active rendering driver; the headless dummy renderer cannot supply framebuffer pixels.")
		get_tree().quit(2)
		return
	if Vector2i(image.get_width(), image.get_height()) != DESIGN_SIZE:
		_fail("Capture framebuffer must be exactly 1920x1080; received %dx%d." % [image.get_width(), image.get_height()])
		get_tree().quit(2)
		return
	var absolute_path := _repo_root().path_join(capture_relative_path).simplify_path()
	var save_result := image.save_png(absolute_path)
	if save_result != OK:
		_fail("Could not save deterministic study capture %s (error %d)." % [absolute_path, save_result])
		get_tree().quit(2)
		return
	print("[Empire Layer Study Capture] SAVED choice=%s post=%s path=%s" % [active_choice, "ON" if post_enabled else "RAW", absolute_path])
	get_tree().quit(0)


func _print_source_evidence() -> void:
	var metrics: Dictionary = asset_loader.metrics_copy()
	for choice: String in ["A", "B"]:
		var choice_value: Variant = metrics.get(choice, {})
		if not (choice_value is Dictionary):
			continue
		for layer_id: String in ["far_backdrop", "stage_floor", "foreground_occluder"]:
			var layer_value: Variant = (choice_value as Dictionary).get(layer_id, {})
			if not (layer_value is Dictionary):
				continue
			var layer_metrics := layer_value as Dictionary
			print("[Empire Layer Source] %s/%s %dx%d alpha=%d-%d sha256=%s" % [choice, layer_id, int(layer_metrics.get("width", 0)), int(layer_metrics.get("height", 0)), int(layer_metrics.get("alpha_min", -1)), int(layer_metrics.get("alpha_max", -1)), str(layer_metrics.get("sha256", ""))])


func _repo_root() -> String:
	return ProjectSettings.globalize_path("res://").path_join("../..").simplify_path()


func _fail(message: String) -> void:
	if not load_errors.has(message):
		load_errors.append(message)
	push_error("[Empire Layer Study] %s" % message)


func _quit_with_error() -> void:
	get_tree().quit(2)
