extends Node2D

const DESIGN_SIZE: Vector2 = Vector2(1920.0, 1080.0)
const HALF_POST_SIZE: Vector2i = Vector2i(960, 540)
const FIXTURE_PATH: String = "res://data/presentation_state.json"
const BACKGROUND_RELATIVE_PATHS: Array[String] = [
	"art/choices/backgrounds/enc_empire_skirmish-choice-a.png",
	"art/choices/backgrounds/enc_empire_skirmish-choice-b.png",
]
const MODE_A: int = 0
const MODE_B: int = 1
const MODE_SPLIT: int = 2
const EXPECTED_LAYER_NAMES: Array[String] = [
	"Layer01Starfield",
	"Layer02FarBackdrop",
	"Layer03StageFloor",
	"Layer04EnemyUnits",
	"Layer05PartyUnits",
	"Layer06EmissivePass",
	"Layer07ForegroundOccluders",
	"Layer08BloomGradeVignetteComposite",
	"Layer09UI",
]
const EXPECTED_LAYER_GROUPS: Array[String] = [
	"compositor_layer_01_starfield",
	"compositor_layer_02_far_backdrop",
	"compositor_layer_03_stage_floor",
	"compositor_layer_04_enemy_units",
	"compositor_layer_05_party_units",
	"compositor_layer_06_emissive_pass",
	"compositor_layer_07_foreground_occluders",
	"compositor_layer_08_half_resolution_post",
	"compositor_layer_09_ui",
]

@onready var world_composition: Node2D = $WorldComposition
@onready var world_layers: Array[Node2D] = [
	$WorldComposition/Layer01Starfield,
	$WorldComposition/Layer02FarBackdrop,
	$WorldComposition/Layer03StageFloor,
	$WorldComposition/Layer04EnemyUnits,
	$WorldComposition/Layer05PartyUnits,
	$WorldComposition/Layer06EmissivePass,
	$WorldComposition/Layer07ForegroundOccluders,
	$WorldComposition/Layer08BloomGradeVignetteComposite,
]
@onready var post_composite: Node2D = $WorldComposition/Layer08BloomGradeVignetteComposite
@onready var ui_layer: CanvasLayer = $Layer09UI
@onready var ui_renderer: Node2D = $Layer09UI/UIRenderer
@onready var diagnostic_overlay: Node2D = $Layer09UI/DiagnosticOverlay

var fixture: Dictionary = {}
var units: Array = []
var events: Array = []
var backgrounds: Array[Texture2D] = []
var starfield_texture: Texture2D
var unit_positions: Dictionary = {}
var background_mode: int = MODE_A
var playback_seconds: float = 0.0
var loop_duration: float = 12.0
var paused: bool = false
var show_review_overlay: bool = true
var show_telemetry: bool = true
var diagnostic_mosaic: bool = false
var load_error: String = ""
var frame_samples: Array[float] = []
var layer_visibility: Array[bool] = [true, true, true, true, true, true, true, true, true]


func _ready() -> void:
	_load_fixture()
	_build_cached_starfield()
	_load_backgrounds()
	_apply_command_line_overrides()
	_update_unit_positions()
	_bind_layer_renderers()
	_validate_compositor_contract()
	_apply_diagnostic_layout()
	_refresh_all_layers()
	print("[Visual A/B] Loaded %d units and %d authored presentation events; no combat logic is executed." % [units.size(), events.size()])
	print("[Visual A/B] Mode=%s, source assets remain read-only outside res://." % mode_label())
	if load_error.is_empty():
		print("[Visual A/B] Compositor order OK: %s" % " > ".join(EXPECTED_LAYER_NAMES))
		print("[Visual A/B] Post composite=%dx%d (25%% of 1920x1080 pixels); UI CanvasLayer=%d and outside post." % [HALF_POST_SIZE.x, HALF_POST_SIZE.y, ui_layer.layer])
	if not load_error.is_empty():
		call_deferred("_quit_with_error")


func _process(delta: float) -> void:
	var frame_ms: float = clampf(delta * 1000.0, 0.0, 250.0)
	frame_samples.append(frame_ms)
	if frame_samples.size() > 240:
		frame_samples.pop_front()
	if not paused and load_error.is_empty():
		playback_seconds = fmod(playback_seconds + delta, loop_duration)
	_update_unit_positions()
	_refresh_dynamic_layers()


func _exit_tree() -> void:
	var metrics: Dictionary = _frame_metrics()
	print("[Visual A/B] Process-delta window samples=%d avg=%.3fms p95=%.3fms max=%.3fms (scheduler delta, not a GPU profile)." % [
		int(metrics.get("samples", 0)),
		float(metrics.get("average_ms", 0.0)),
		float(metrics.get("p95_ms", 0.0)),
		float(metrics.get("max_ms", 0.0)),
	])


func _unhandled_input(event: InputEvent) -> void:
	if not (event is InputEventKey):
		return
	var key_event: InputEventKey = event as InputEventKey
	if not key_event.pressed or key_event.echo:
		return
	var handled: bool = true
	match key_event.keycode:
		KEY_TAB:
			background_mode = (background_mode + 1) % 2
			_refresh_static_layer(1)
			print("[Visual A/B] Background toggled to %s at %.3f seconds." % [mode_label(), playback_seconds])
		KEY_1:
			background_mode = MODE_A
			_refresh_static_layer(1)
		KEY_2:
			background_mode = MODE_B
			_refresh_static_layer(1)
		KEY_S:
			background_mode = MODE_SPLIT
			_refresh_static_layer(1)
		KEY_SPACE:
			paused = not paused
		KEY_R:
			playback_seconds = 0.0
			paused = false
		KEY_O:
			show_review_overlay = not show_review_overlay
		KEY_T:
			show_telemetry = not show_telemetry
		KEY_D:
			diagnostic_mosaic = not diagnostic_mosaic
			_apply_diagnostic_layout()
		KEY_F1:
			_toggle_layer(0)
		KEY_F2:
			_toggle_layer(1)
		KEY_F3:
			_toggle_layer(2)
		KEY_F4:
			_toggle_layer(3)
		KEY_F5:
			_toggle_layer(4)
		KEY_F6:
			_toggle_layer(5)
		KEY_F7:
			_toggle_layer(6)
		KEY_F8:
			_toggle_layer(7)
		KEY_F9:
			_toggle_layer(8)
		KEY_F10:
			_restore_all_layers()
		KEY_ESCAPE:
			get_tree().quit()
		_:
			handled = false
	if handled:
		_refresh_dynamic_layers()
		get_viewport().set_input_as_handled()


func render_snapshot() -> Dictionary:
	return {
		"design_size": DESIGN_SIZE,
		"starfield_texture": starfield_texture,
		"backgrounds": backgrounds,
		"background_mode": background_mode,
		"units": units,
		"events": events,
		"positions": unit_positions,
		"playback_seconds": playback_seconds,
		"loop_duration": loop_duration,
		"paused": paused,
		"show_review_overlay": show_review_overlay,
		"show_telemetry": show_telemetry,
		"diagnostic_mosaic": diagnostic_mosaic,
		"load_error": load_error,
		"active_label": active_label(),
		"mode_label": mode_label(),
		"frame_metrics": _frame_metrics(),
		"layer_visibility": layer_visibility.duplicate(),
		"layer_names": EXPECTED_LAYER_NAMES,
	}


func _bind_layer_renderers() -> void:
	for layer_index: int in range(7):
		world_layers[layer_index].call("bind_controller", self)
	post_composite.call("bind_controller", self)
	ui_renderer.call("bind_controller", self)
	diagnostic_overlay.call("bind_controller", self)


func _refresh_all_layers() -> void:
	for layer: Node2D in world_layers:
		layer.call("refresh")
	ui_renderer.call("refresh")
	diagnostic_overlay.call("refresh")


func _refresh_dynamic_layers() -> void:
	for layer_index: int in [3, 4, 5]:
		world_layers[layer_index].call("refresh")
	post_composite.call("refresh")
	ui_renderer.call("refresh")
	diagnostic_overlay.call("refresh")


func _refresh_static_layer(layer_index: int) -> void:
	world_layers[layer_index].call("refresh")
	ui_renderer.call("refresh")
	diagnostic_overlay.call("refresh")


func _toggle_layer(layer_index: int) -> void:
	if layer_index < 0 or layer_index >= layer_visibility.size():
		return
	_set_layer_visible(layer_index, not layer_visibility[layer_index])
	print("[Visual A/B] Layer %02d %s -> %s" % [layer_index + 1, EXPECTED_LAYER_NAMES[layer_index], "ON" if layer_visibility[layer_index] else "OFF"])


func _restore_all_layers() -> void:
	for layer_index: int in range(layer_visibility.size()):
		_set_layer_visible(layer_index, true)
	print("[Visual A/B] Restored all nine compositor layers.")


func _set_layer_visible(layer_index: int, is_visible: bool) -> void:
	layer_visibility[layer_index] = is_visible
	if layer_index < world_layers.size():
		world_layers[layer_index].visible = is_visible
	else:
		ui_layer.visible = is_visible


func _apply_diagnostic_layout() -> void:
	var tile_size: Vector2 = DESIGN_SIZE / 3.0
	var tile_scale: Vector2 = Vector2.ONE / 3.0
	for layer_index: int in range(world_layers.size()):
		var layer: Node2D = world_layers[layer_index]
		if diagnostic_mosaic:
			layer.position = Vector2(float(layer_index % 3) * tile_size.x, float(layer_index / 3) * tile_size.y)
			layer.scale = tile_scale
		else:
			layer.position = Vector2.ZERO
			layer.scale = Vector2.ONE
	if diagnostic_mosaic:
		ui_renderer.position = Vector2(2.0 * tile_size.x, 2.0 * tile_size.y)
		ui_renderer.scale = tile_scale
	else:
		ui_renderer.position = Vector2.ZERO
		ui_renderer.scale = Vector2.ONE
	diagnostic_overlay.visible = diagnostic_mosaic
	# Diagnostic-only mattes belong to the cached floor/foreground draw commands, so
	# switching views is one of the few events that deliberately rebuilds them.
	for static_layer_index: int in [0, 1, 2, 6]:
		world_layers[static_layer_index].call("refresh")


func _validate_compositor_contract() -> void:
	var violations: Array[String] = []
	if world_composition.get_child_count() != 8:
		violations.append("WorldComposition must contain exactly eight ordered world/post layer nodes.")
	for layer_index: int in range(mini(8, world_composition.get_child_count())):
		var layer_node: Node = world_composition.get_child(layer_index)
		if layer_node.name != EXPECTED_LAYER_NAMES[layer_index]:
			violations.append("Layer %02d node name is %s, expected %s." % [layer_index + 1, layer_node.name, EXPECTED_LAYER_NAMES[layer_index]])
		if not layer_node.is_in_group("compositor_layer") or not layer_node.is_in_group(EXPECTED_LAYER_GROUPS[layer_index]):
			violations.append("Layer %02d is missing its compositor groups." % [layer_index + 1])
		if layer_node is Node2D and (layer_node as Node2D).z_index != layer_index:
			violations.append("Layer %02d z_index must equal %d." % [layer_index + 1, layer_index])
	if ui_layer.name != EXPECTED_LAYER_NAMES[8]:
		violations.append("UI node must be named %s." % EXPECTED_LAYER_NAMES[8])
	if not ui_layer.is_in_group("compositor_layer") or not ui_layer.is_in_group(EXPECTED_LAYER_GROUPS[8]):
		violations.append("Layer 09 is missing its compositor groups.")
	if ui_layer.layer <= 7:
		violations.append("UI CanvasLayer must render above every world/post layer.")
	if post_composite.is_ancestor_of(ui_layer):
		violations.append("UI must not be a descendant of the post-processing node.")
	var post_size: Variant = post_composite.call("get_half_resolution_size")
	if post_size != HALF_POST_SIZE:
		violations.append("Post viewport must remain exactly 960x540.")
	if not violations.is_empty():
		for violation: String in violations:
			push_error("Compositor contract violation: %s" % violation)
		_set_load_error("Nine-layer compositor validation failed with %d violation(s)." % violations.size())


func _load_fixture() -> void:
	var file: FileAccess = FileAccess.open(FIXTURE_PATH, FileAccess.READ)
	if file == null:
		_set_load_error("Missing presentation fixture: %s" % FIXTURE_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		_set_load_error("Presentation fixture must be a JSON object.")
		return
	fixture = parsed as Dictionary
	if int(fixture.get("format", 0)) != 1:
		_set_load_error("Unsupported presentation fixture format.")
		return
	var raw_units: Variant = fixture.get("units", [])
	var raw_events: Variant = fixture.get("events", [])
	if not (raw_units is Array) or not (raw_events is Array):
		_set_load_error("Fixture units and events must be arrays.")
		return
	units = raw_units as Array
	events = raw_events as Array
	loop_duration = float(fixture.get("durationSeconds", 12.0))
	if units.size() != 6 or events.is_empty() or loop_duration <= 0.0:
		_set_load_error("Fixture requires exactly six stand-ins, authored events, and a positive duration.")


func _build_cached_starfield() -> void:
	var image: Image = Image.create(480, 270, false, Image.FORMAT_RGBA8)
	image.fill(Color("#050914"))
	for star_index: int in range(190):
		var x: int = (star_index * 97 + 31) % image.get_width()
		var y: int = (star_index * 53 + 17 + (star_index % 7) * 11) % image.get_height()
		var energy: float = 0.26 + float((star_index * 29) % 61) / 100.0
		var tint: Color = Color(0.46 + energy * 0.30, 0.62 + energy * 0.22, 0.82 + energy * 0.16, energy)
		image.set_pixel(x, y, tint)
		if star_index % 11 == 0 and x + 1 < image.get_width():
			image.set_pixel(x + 1, y, Color(tint, energy * 0.34))
	starfield_texture = ImageTexture.create_from_image(image)


func _load_backgrounds() -> void:
	backgrounds.clear()
	var repo_root: String = _repo_root()
	for relative_path: String in BACKGROUND_RELATIVE_PATHS:
		var absolute_path: String = repo_root.path_join(relative_path)
		if not FileAccess.file_exists(absolute_path):
			_set_load_error("Missing read-only A/B source asset: %s" % absolute_path)
			return
		var image: Image = Image.new()
		var load_result: Error = image.load(absolute_path)
		if load_result != OK:
			_set_load_error("Could not decode source asset (%s): error %d" % [absolute_path, load_result])
			return
		if image.get_width() != 1920 or image.get_height() != 1080:
			_set_load_error("A/B source asset must remain 1920x1080: %s" % absolute_path)
			return
		# Identical one-time low-pass cache for A and B. No full-resolution per-frame blur.
		image.resize(960, 540, Image.INTERPOLATE_LANCZOS)
		backgrounds.append(ImageTexture.create_from_image(image))


func _repo_root() -> String:
	var project_directory: String = ProjectSettings.globalize_path("res://")
	return project_directory.path_join("../..").simplify_path()


func _apply_command_line_overrides() -> void:
	var arguments: PackedStringArray = OS.get_cmdline_user_args()
	for argument: String in arguments:
		if argument.begins_with("--variant="):
			var variant_value: String = argument.trim_prefix("--variant=").to_upper()
			if variant_value == "A":
				background_mode = MODE_A
			elif variant_value == "B":
				background_mode = MODE_B
			elif variant_value == "SPLIT":
				background_mode = MODE_SPLIT
		elif argument.begins_with("--time="):
			var time_value: float = argument.trim_prefix("--time=").to_float()
			playback_seconds = clampf(time_value, 0.0, loop_duration)
		elif argument == "--pause":
			paused = true
		elif argument == "--diagnostic":
			diagnostic_mosaic = true
		elif argument == "--telemetry=off":
			show_telemetry = false
		elif argument == "--overlay=off":
			show_review_overlay = false
		elif argument.begins_with("--hide-layer="):
			var requested_layer: int = argument.trim_prefix("--hide-layer=").to_int()
			if requested_layer >= 1 and requested_layer <= 9:
				_set_layer_visible(requested_layer - 1, false)


func _update_unit_positions() -> void:
	unit_positions.clear()
	for raw_unit: Variant in units:
		if not (raw_unit is Dictionary):
			continue
		var unit: Dictionary = raw_unit as Dictionary
		var unit_id: String = str(unit.get("id", ""))
		unit_positions[unit_id] = _json_vector(unit.get("position", [960.0, 900.0]))
	for raw_event: Variant in events:
		if not (raw_event is Dictionary):
			continue
		var event: Dictionary = raw_event as Dictionary
		if str(event.get("type", "")) != "melee":
			continue
		var progress: float = _event_progress(event)
		if progress < 0.0 or progress > 1.0:
			continue
		var actor_id: String = str(event.get("actor", ""))
		var target_id: String = str(event.get("target", ""))
		if not unit_positions.has(actor_id) or not unit_positions.has(target_id):
			continue
		var actor_position: Vector2 = unit_positions[actor_id] as Vector2
		var target_position: Vector2 = unit_positions[target_id] as Vector2
		var travel_direction: Vector2 = (target_position - actor_position).normalized()
		unit_positions[actor_id] = actor_position + travel_direction * sin(progress * PI) * 105.0
		var contact_progress: float = _contact_progress(event)
		if contact_progress >= 0.0 and contact_progress <= 1.0:
			var flinch_direction: float = -1.0 if target_id.begins_with("party") else 1.0
			unit_positions[target_id] = target_position + Vector2(flinch_direction * sin(contact_progress * PI) * 14.0, -sin(contact_progress * PI) * 5.0)


func active_label() -> String:
	var label: String = "IDENTICAL IDLE / CAMERA / UI"
	for raw_event: Variant in events:
		if not (raw_event is Dictionary):
			continue
		var event: Dictionary = raw_event as Dictionary
		var at: float = float(event.get("at", 0.0))
		var duration: float = float(event.get("duration", 0.0))
		if playback_seconds >= at and playback_seconds <= at + duration:
			label = str(event.get("label", label))
	return label


func mode_label() -> String:
	if background_mode == MODE_A:
		return "BACKGROUND A"
	if background_mode == MODE_B:
		return "BACKGROUND B"
	return "50 / 50 SPLIT WIPE"


func _event_progress(event: Dictionary) -> float:
	var at: float = float(event.get("at", 0.0))
	var duration: float = maxf(0.001, float(event.get("duration", 1.0)))
	return (playback_seconds - at) / duration


func _contact_progress(event: Dictionary) -> float:
	var at: float = float(event.get("at", 0.0))
	var contact_after: float = float(event.get("contactAfter", 0.0))
	var duration: float = maxf(contact_after + 0.001, float(event.get("duration", 1.0)))
	return (playback_seconds - at - contact_after) / maxf(0.001, duration - contact_after)


func _frame_metrics() -> Dictionary:
	if frame_samples.is_empty():
		return {"samples": 0, "average_ms": 0.0, "p95_ms": 0.0, "max_ms": 0.0}
	var average_ms: float = 0.0
	var max_ms: float = 0.0
	var ordered: Array[float] = []
	for sample: float in frame_samples:
		average_ms += sample
		max_ms = maxf(max_ms, sample)
		ordered.append(sample)
	average_ms /= float(frame_samples.size())
	ordered.sort()
	var p95_index: int = mini(ordered.size() - 1, maxi(0, int(ceil(float(ordered.size()) * 0.95)) - 1))
	return {
		"samples": frame_samples.size(),
		"average_ms": average_ms,
		"p95_ms": ordered[p95_index],
		"max_ms": max_ms,
	}


func _json_vector(value: Variant) -> Vector2:
	if value is Array:
		var components: Array = value as Array
		if components.size() >= 2:
			return Vector2(float(components[0]), float(components[1]))
	return Vector2.ZERO


func _set_load_error(message: String) -> void:
	if load_error.is_empty():
		load_error = message
	push_error(message)


func _quit_with_error() -> void:
	get_tree().quit(2)
