extends Node2D

const DESIGN_SIZE: Vector2 = Vector2(1920.0, 1080.0)
const MANIFEST_PATH: String = "res://study/motion_manifest.json"
const VIEW_DARK: int = 0
const VIEW_LIGHT: int = 1
const VIEW_CHECKER: int = 2
const VIEW_EMPIRE_A: int = 3
const VIEW_EMPIRE_B: int = 4
const DISPLAY_BOTH: int = 0
const DISPLAY_A: int = 1
const DISPLAY_B: int = 2
const PIPELINE_A: int = 0
const PIPELINE_B: int = 1
const HYBRID_TINT: Color = Color("#5ce9ff")

var manifest: Dictionary = {}
var asset_records: Array = []
var background_records: Array = []
var pipeline_records: Array = []
var timeline_states: Array = []
var asset_images: Array[Image] = []
var asset_textures: Array[Texture2D] = []
var alpha_scans: Array = []
var scan_durations: Array[float] = []
var background_textures: Array[Texture2D] = []
var validation_errors: Array[String] = []
var readiness_blockers: Array[String] = []
var timeline_metrics: Dictionary = {}
var active_asset_index: int = 0
var view_mode: int = VIEW_DARK
var display_mode: int = DISPLAY_BOTH
var timeline_ms: float = 0.0
var loop_duration_ms: int = 3400
var manual_step_ms: int = 25
var playing: bool = true
var playback_speed: float = 1.0
var show_overlays: bool = true
var freeze_time: bool = false
var freeze_time_ms: float = -1.0
var validate_only: bool = false
var strict_mode: bool = false
var initialized: bool = false

@onready var pipeline_a: Node2D = $PipelineAWholeRaster
@onready var whole_sprite: Sprite2D = $PipelineAWholeRaster/WholeRasterSprite
@onready var pipeline_b: Node2D = $PipelineBHybrid
@onready var trail_layer: Node2D = $PipelineBHybrid/ProceduralTrailLayer
@onready var hybrid_sprite: Sprite2D = $PipelineBHybrid/HybridDeformedSprite
@onready var emissive_layer: Node2D = $PipelineBHybrid/ProceduralEmissiveContactLayer
@onready var study_overlay: Node2D = $StudyOverlay
var hybrid_material: ShaderMaterial


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	set_process(false)
	_apply_command_line_overrides()
	_load_manifest()
	if validation_errors.is_empty():
		_validate_manifest_semantics()
		_load_and_validate_assets()
		_load_and_validate_backgrounds()
		_validate_timeline_and_anchor_contract()
	_report_validation()
	if not validation_errors.is_empty() or validate_only or strict_mode:
		call_deferred("_finish_validation_run")
		return
	hybrid_material = hybrid_sprite.material as ShaderMaterial
	if hybrid_material == null:
		_add_error("Hybrid sprite is missing its ShaderMaterial.")
		call_deferred("_finish_validation_run")
		return
	_activate_asset(active_asset_index)
	if freeze_time_ms >= 0.0:
		timeline_ms = fposmod(freeze_time_ms, float(loop_duration_ms))
		freeze_time = true
		playing = false
	initialized = true
	_update_presentation()
	set_process(true)


func _process(delta: float) -> void:
	if not initialized:
		return
	if playing and not freeze_time:
		timeline_ms = fposmod(timeline_ms + delta * 1000.0 * playback_speed, float(loop_duration_ms))
		_update_presentation()


func _unhandled_input(event: InputEvent) -> void:
	if not initialized or not (event is InputEventKey):
		return
	var key_event: InputEventKey = event as InputEventKey
	if not key_event.pressed or key_event.echo:
		return
	var handled: bool = true
	match key_event.keycode:
		KEY_SPACE:
			freeze_time = false
			playing = not playing
		KEY_LEFT:
			playing = false
			freeze_time = false
			timeline_ms = fposmod(timeline_ms - float(manual_step_ms), float(loop_duration_ms))
		KEY_RIGHT:
			playing = false
			freeze_time = false
			timeline_ms = fposmod(timeline_ms + float(manual_step_ms), float(loop_duration_ms))
		KEY_PAGEUP:
			playing = false
			freeze_time = false
			_jump_state(-1)
		KEY_PAGEDOWN:
			playing = false
			freeze_time = false
			_jump_state(1)
		KEY_S:
			playback_speed = 0.25 if playback_speed > 0.25 else 1.0
		KEY_R:
			timeline_ms = 0.0
			playing = false
			freeze_time = false
			playback_speed = 1.0
		KEY_C:
			_activate_asset((active_asset_index + 1) % 2)
		KEY_V:
			view_mode = (view_mode + 1) % 5
		KEY_P:
			display_mode = (display_mode + 1) % 3
		KEY_O:
			show_overlays = not show_overlays
		KEY_ESCAPE:
			get_tree().quit()
		_:
			handled = false
	if handled:
		_update_presentation()
		get_viewport().set_input_as_handled()


func _apply_command_line_overrides() -> void:
	for argument: String in OS.get_cmdline_user_args():
		if argument == "--validate-only":
			validate_only = true
		elif argument == "--strict":
			strict_mode = true
		elif argument == "--paused":
			playing = false
		elif argument == "--slow":
			playback_speed = 0.25
		elif argument == "--overlays=off":
			show_overlays = false
		elif argument.begins_with("--freeze-ms="):
			freeze_time_ms = float(argument.trim_prefix("--freeze-ms="))
			if freeze_time_ms < 0.0:
				_add_error("--freeze-ms must be nonnegative.")
		elif argument.begins_with("--combatant="):
			var combatant_value: String = argument.trim_prefix("--combatant=").to_lower()
			if combatant_value == "choice-a" or combatant_value == "a":
				active_asset_index = 0
			elif combatant_value == "choice-b" or combatant_value == "b":
				active_asset_index = 1
			else:
				_add_error("--combatant must be choice-a/a or choice-b/b.")
		elif argument.begins_with("--view="):
			var view_value: String = argument.trim_prefix("--view=").to_lower()
			var view_values: Array[String] = ["dark", "light", "checker", "empire-a", "empire-b"]
			view_mode = view_values.find(view_value)
			if view_mode < 0:
				_add_error("--view must be dark, light, checker, empire-a, or empire-b.")
		elif argument.begins_with("--display="):
			var display_value: String = argument.trim_prefix("--display=").to_lower()
			if display_value == "both":
				display_mode = DISPLAY_BOTH
			elif display_value == "a":
				display_mode = DISPLAY_A
			elif display_value == "b":
				display_mode = DISPLAY_B
			else:
				_add_error("--display must be both, a, or b.")


func _load_manifest() -> void:
	var file: FileAccess = FileAccess.open(MANIFEST_PATH, FileAccess.READ)
	if file == null:
		_add_error("Missing motion-study manifest: %s" % MANIFEST_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not (parsed is Dictionary):
		_add_error("Motion-study manifest must be a JSON object.")
		return
	manifest = parsed as Dictionary
	var assets_value: Variant = manifest.get("assets", [])
	var backgrounds_value: Variant = manifest.get("backgrounds", [])
	var pipelines_value: Variant = manifest.get("pipelines", [])
	var timeline_value: Variant = manifest.get("timeline", {})
	if not (assets_value is Array) or not (backgrounds_value is Array) or not (pipelines_value is Array) or not (timeline_value is Dictionary):
		_add_error("Manifest assets/backgrounds/pipelines must be arrays and timeline must be an object.")
		return
	asset_records = assets_value as Array
	background_records = backgrounds_value as Array
	pipeline_records = pipelines_value as Array
	var timeline: Dictionary = timeline_value as Dictionary
	var states_value: Variant = timeline.get("states", [])
	if not (states_value is Array):
		_add_error("timeline.states must be an array.")
		return
	timeline_states = states_value as Array
	loop_duration_ms = int(timeline.get("loopDurationMs", 0))
	manual_step_ms = int(timeline.get("manualStepMs", 0))


func _validate_manifest_semantics() -> void:
	if str(manifest.get("format", "")) != "godot-combatant-motion-engineering-study" or int(manifest.get("version", 0)) != 1:
		_add_error("Unsupported motion-study manifest format/version.")
	if str(manifest.get("approvalState", "")) != "unapproved" or str(manifest.get("runtimeRegistration", "")) != "none":
		_add_error("Motion study must remain unapproved and unregistered.")
	if str(manifest.get("scope", "")) != "single-idle-keyframe-derived-motion-pipeline-comparison-only":
		_add_error("Motion-study scope changed unexpectedly.")
	if asset_records.size() != 2 or background_records.size() != 2 or pipeline_records.size() != 2:
		_add_error("Motion study requires exactly two combatants, two backgrounds, and two pipelines.")
	var expected_asset_ids: Array[String] = ["choice-a", "choice-b"]
	for asset_index: int in range(asset_records.size()):
		if not (asset_records[asset_index] is Dictionary):
			_add_error("Asset record %d must be an object." % asset_index)
			continue
		var asset: Dictionary = asset_records[asset_index] as Dictionary
		if asset_index >= expected_asset_ids.size() or str(asset.get("studyId", "")) != expected_asset_ids[asset_index]:
			_add_error("Combatant study order/ID mismatch at index %d." % asset_index)
		if int(asset.get("frameCount", 0)) != 1 or str(asset.get("frameMeaning", "")) != "idle-like-keyframe-only":
			_add_error("Each motion study must remain derived from one idle-like keyframe.")
	var expected_pipeline_ids: Array[String] = ["whole-raster-transform", "deliberate-hybrid"]
	for pipeline_index: int in range(pipeline_records.size()):
		if not (pipeline_records[pipeline_index] is Dictionary):
			_add_error("Pipeline record %d must be an object." % pipeline_index)
			continue
		var pipeline: Dictionary = pipeline_records[pipeline_index] as Dictionary
		if pipeline_index >= expected_pipeline_ids.size() or str(pipeline.get("id", "")) != expected_pipeline_ids[pipeline_index]:
			_add_error("Pipeline order/ID mismatch at index %d." % pipeline_index)
	var blockers_value: Variant = manifest.get("knownReadinessBlockers", [])
	if blockers_value is Array:
		for blocker_value: Variant in blockers_value as Array:
			_add_blocker(str(blocker_value))
	else:
		_add_error("knownReadinessBlockers must be an array.")


func _load_and_validate_assets() -> void:
	asset_images.clear()
	asset_textures.clear()
	alpha_scans.clear()
	scan_durations.clear()
	for asset_index: int in range(asset_records.size()):
		if not (asset_records[asset_index] is Dictionary):
			continue
		var record: Dictionary = asset_records[asset_index] as Dictionary
		var study_id: String = str(record.get("studyId", "unknown"))
		var path: String = str(record.get("portableCopy", ""))
		if not _validate_portable_path(path, "%s portableCopy" % study_id):
			continue
		if not FileAccess.file_exists(path):
			_add_error("Missing portable combatant: %s" % path)
			continue
		_validate_file_identity(path, record, "combatant %s" % study_id)
		var raw_bytes: PackedByteArray = FileAccess.get_file_as_bytes(path)
		_validate_rgba_png_header(raw_bytes, record, "combatant %s" % study_id)
		var image: Image = Image.new()
		var load_result: Error = image.load(ProjectSettings.globalize_path(path))
		if load_result != OK:
			_add_error("Could not decode %s: error %d" % [study_id, load_result])
			continue
		var expected_dimensions: Vector2i = _array_to_vector2i(record.get("expectedDimensions", []))
		if Vector2i(image.get_width(), image.get_height()) != expected_dimensions:
			_add_error("%s decoded dimensions differ from manifest." % study_id)
		if image.get_format() != Image.FORMAT_RGBA8:
			_add_error("%s must decode as RGBA8." % study_id)
		var scan_started: int = Time.get_ticks_usec()
		var scan: Dictionary = _scan_alpha(image, int(record.get("substantiveAlphaThreshold", 2)))
		var scan_ms: float = float(Time.get_ticks_usec() - scan_started) / 1000.0
		_validate_alpha_scan(record, scan, expected_dimensions)
		asset_images.append(image)
		asset_textures.append(ImageTexture.create_from_image(image))
		alpha_scans.append(scan)
		scan_durations.append(scan_ms)
	if asset_images.size() != asset_records.size():
		_add_error("Not every combatant study produced a validated texture.")


func _load_and_validate_backgrounds() -> void:
	background_textures.clear()
	for background_index: int in range(background_records.size()):
		if not (background_records[background_index] is Dictionary):
			continue
		var record: Dictionary = background_records[background_index] as Dictionary
		var path: String = str(record.get("portableCopy", ""))
		if not _validate_portable_path(path, "background %d portableCopy" % background_index):
			continue
		if not FileAccess.file_exists(path):
			_add_error("Missing portable background: %s" % path)
			continue
		_validate_file_identity(path, record, "background %d" % background_index)
		var image: Image = Image.new()
		var load_result: Error = image.load(ProjectSettings.globalize_path(path))
		if load_result != OK:
			_add_error("Could not decode background %d: error %d" % [background_index, load_result])
			continue
		if Vector2i(image.get_width(), image.get_height()) != _array_to_vector2i(record.get("expectedDimensions", [])):
			_add_error("Background %d decoded dimensions differ from manifest." % background_index)
		background_textures.append(ImageTexture.create_from_image(image))
	if background_textures.size() != background_records.size():
		_add_error("Not every neutral background produced a validated texture.")


func _validate_file_identity(path: String, record: Dictionary, label: String) -> void:
	var actual_hash: String = _sha256_file(path)
	var expected_hash: String = str(record.get("expectedSha256", "")).to_upper()
	if actual_hash != expected_hash:
		_add_error("%s SHA-256 mismatch: expected %s, got %s." % [label, expected_hash, actual_hash])
	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if file == null:
		_add_error("Could not open %s for byte-length validation." % label)
		return
	var actual_bytes: int = file.get_length()
	var expected_bytes: int = int(record.get("expectedBytes", -1))
	if actual_bytes != expected_bytes:
		_add_error("%s byte length mismatch: expected %d, got %d." % [label, expected_bytes, actual_bytes])


func _validate_rgba_png_header(bytes: PackedByteArray, record: Dictionary, label: String) -> void:
	var signature: Array[int] = [137, 80, 78, 71, 13, 10, 26, 10]
	if bytes.size() < 29:
		_add_error("%s is too short to contain a PNG IHDR." % label)
		return
	for byte_index: int in range(signature.size()):
		if int(bytes[byte_index]) != signature[byte_index]:
			_add_error("%s does not have a valid PNG signature." % label)
			return
	if String.chr(bytes[12]) + String.chr(bytes[13]) + String.chr(bytes[14]) + String.chr(bytes[15]) != "IHDR":
		_add_error("%s does not begin with IHDR." % label)
		return
	var raw_dimensions: Vector2i = Vector2i(_read_u32_be(bytes, 16), _read_u32_be(bytes, 20))
	if raw_dimensions != _array_to_vector2i(record.get("expectedDimensions", [])):
		_add_error("%s raw PNG dimensions differ from manifest." % label)
	if int(bytes[24]) != 8 or int(bytes[25]) != 6 or int(bytes[28]) != 0:
		_add_error("%s must remain 8-bit, true-RGBA color type 6, non-interlaced PNG." % label)


func _scan_alpha(image: Image, substantive_threshold: int) -> Dictionary:
	var width: int = image.get_width()
	var height: int = image.get_height()
	var transparent_count: int = 0
	var partial_count: int = 0
	var opaque_count: int = 0
	var strict_min: Vector2i = Vector2i(width, height)
	var strict_max: Vector2i = Vector2i(-1, -1)
	var substantive_min: Vector2i = Vector2i(width, height)
	var substantive_max: Vector2i = Vector2i(-1, -1)
	var edge_nonzero_count: int = 0
	var first_edge_pixel: Vector3i = Vector3i(-1, -1, -1)
	for y: int in range(height):
		for x: int in range(width):
			var alpha: int = roundi(image.get_pixel(x, y).a * 255.0)
			if alpha == 0:
				transparent_count += 1
			elif alpha == 255:
				opaque_count += 1
			else:
				partial_count += 1
			if alpha > 0:
				strict_min.x = mini(strict_min.x, x)
				strict_min.y = mini(strict_min.y, y)
				strict_max.x = maxi(strict_max.x, x)
				strict_max.y = maxi(strict_max.y, y)
				if x == 0 or y == 0 or x == width - 1 or y == height - 1:
					edge_nonzero_count += 1
					if first_edge_pixel.x < 0:
						first_edge_pixel = Vector3i(x, y, alpha)
			if alpha >= substantive_threshold:
				substantive_min.x = mini(substantive_min.x, x)
				substantive_min.y = mini(substantive_min.y, y)
				substantive_max.x = maxi(substantive_max.x, x)
				substantive_max.y = maxi(substantive_max.y, y)
	return {
		"transparent": transparent_count,
		"partial": partial_count,
		"opaque": opaque_count,
		"strict_bounds": Rect2i(strict_min, strict_max - strict_min + Vector2i.ONE),
		"substantive_bounds": Rect2i(substantive_min, substantive_max - substantive_min + Vector2i.ONE),
		"edge_nonzero_count": edge_nonzero_count,
		"first_edge_pixel": first_edge_pixel,
	}


func _validate_alpha_scan(record: Dictionary, scan: Dictionary, dimensions: Vector2i) -> void:
	var label: String = str(record.get("label", "UNKNOWN CHOICE"))
	var expected_counts_value: Variant = record.get("expectedAlphaCounts", {})
	if not (expected_counts_value is Dictionary):
		_add_error("%s expectedAlphaCounts must be an object." % label)
		return
	var expected_counts: Dictionary = expected_counts_value as Dictionary
	for count_key: String in ["transparent", "partial", "opaque"]:
		if int(scan.get(count_key, -1)) != int(expected_counts.get(count_key, -2)):
			_add_error("%s alpha %s count changed." % [label, count_key])
	if int(scan.get("transparent", 0)) <= 0 or int(scan.get("partial", 0)) <= 0:
		_add_error("%s must contain transparent and partially transparent pixels." % label)
	var strict_bounds: Rect2i = scan.get("strict_bounds", Rect2i()) as Rect2i
	var substantive_bounds: Rect2i = scan.get("substantive_bounds", Rect2i()) as Rect2i
	if strict_bounds != _array_to_rect2i(record.get("strictNonzeroBounds", [])):
		_add_error("%s strict nonzero-alpha bounds changed." % label)
	if substantive_bounds != _array_to_rect2i(record.get("substantiveBounds", [])):
		_add_error("%s substantive alpha bounds changed." % label)
	if substantive_bounds.position.x <= 0 or substantive_bounds.position.y <= 0 or substantive_bounds.end.x >= dimensions.x or substantive_bounds.end.y >= dimensions.y:
		_add_error("%s substantive silhouette touches a source edge." % label)
	var expected_edge_count: int = int(record.get("expectedEdgeNonzeroCount", -1))
	var actual_edge_count: int = int(scan.get("edge_nonzero_count", -2))
	if actual_edge_count != expected_edge_count:
		_add_error("%s source-edge nonzero count changed: expected %d, got %d." % [label, expected_edge_count, actual_edge_count])
	if expected_edge_count == 1:
		var residue_value: Variant = record.get("knownEdgeResidue", {})
		if not (residue_value is Dictionary):
			_add_error("%s must pin its known edge residue." % label)
		else:
			var residue: Dictionary = residue_value as Dictionary
			var expected_residue: Vector3i = Vector3i(int(residue.get("x", -1)), int(residue.get("y", -1)), int(residue.get("alpha", -1)))
			if scan.get("first_edge_pixel", Vector3i(-1, -1, -1)) as Vector3i != expected_residue:
				_add_error("%s known alpha-edge residue changed." % label)


func _validate_timeline_and_anchor_contract() -> void:
	var expected_ids: Array[String] = ["idle", "advance", "anticipation", "contact", "recovery", "hit", "defeat"]
	var expected_durations: Array[int] = [600, 600, 400, 100, 500, 400, 800]
	if timeline_states.size() != expected_ids.size():
		_add_error("Timeline must contain exactly seven engineering presentation states.")
		return
	var expected_start: int = 0
	for state_index: int in range(timeline_states.size()):
		if not (timeline_states[state_index] is Dictionary):
			_add_error("Timeline state %d must be an object." % state_index)
			continue
		var state: Dictionary = timeline_states[state_index] as Dictionary
		if str(state.get("id", "")) != expected_ids[state_index]:
			_add_error("Timeline state order/ID mismatch at index %d." % state_index)
		if int(state.get("startMs", -1)) != expected_start:
			_add_error("Timeline state %s is not contiguous at %d ms." % [expected_ids[state_index], expected_start])
		if int(state.get("durationMs", -1)) != expected_durations[state_index]:
			_add_error("Timeline state %s duration changed from %d ms." % [expected_ids[state_index], expected_durations[state_index]])
		if not bool(state.get("presentationOnly", false)):
			_add_error("Timeline state %s must remain presentation-only." % expected_ids[state_index])
		expected_start += expected_durations[state_index]
	if expected_start != loop_duration_ms or loop_duration_ms != 3400:
		_add_error("Timeline must remain a contiguous 3400 ms engineering loop.")
	if manual_step_ms != 25:
		_add_error("Manual timeline step must remain 25 ms.")
	if validation_errors.is_empty():
		_validate_motion_samples()


func _validate_motion_samples() -> void:
	var review_value: Variant = manifest.get("review", {})
	if not (review_value is Dictionary):
		_add_error("Manifest review must be an object.")
		return
	var review: Dictionary = review_value as Dictionary
	var limits_value: Variant = review.get("shaderLimits", {})
	if not (limits_value is Dictionary):
		_add_error("review.shaderLimits must be an object.")
		return
	var limits: Dictionary = limits_value as Dictionary
	var max_bend_limit: float = float(limits.get("maximumAbsoluteBendUv", 0.0))
	var max_squash_limit: float = float(limits.get("maximumAbsoluteSquash", 0.0))
	var max_ripple_limit: float = float(limits.get("maximumAbsoluteRippleUv", 0.0))
	var max_emissive_limit: float = float(limits.get("maximumEmissiveGain", 0.0))
	var max_trail_limit: float = float(limits.get("maximumTrailIntensity", 0.0))
	var maximum_anchor_error: float = 0.0
	var maximum_shader_anchor_error: float = 0.0
	var observed_max_bend: float = 0.0
	var observed_max_squash: float = 0.0
	var observed_max_ripple: float = 0.0
	var observed_max_emissive: float = 0.0
	var observed_max_trail: float = 0.0
	var sample_count: int = 0
	var panel_a: Rect2 = Rect2(0.0, 0.0, 960.0, 1080.0)
	var panel_b: Rect2 = Rect2(960.0, 0.0, 960.0, 1080.0)
	for asset_index: int in range(asset_records.size()):
		var record: Dictionary = asset_records[asset_index] as Dictionary
		for sample_time: int in range(0, loop_duration_ms, 10):
			var pose_a: Dictionary = _sample_motion(PIPELINE_A, float(sample_time))
			var pose_b: Dictionary = _sample_motion(PIPELINE_B, float(sample_time))
			for pose_value: Variant in [pose_a, pose_b]:
				var pose: Dictionary = pose_value as Dictionary
				if not _pose_is_finite(pose):
					_add_error("Timeline produced a non-finite pose at %d ms." % sample_time)
			var scale: float = float(record.get("proposedDisplayScale", 0.0))
			var source_anchor: Vector2 = Vector2(_array_to_vector2i(record.get("proposedGroundAnchor", [])))
			var local_origin: Vector2 = -source_anchor * scale
			var reconstructed_anchor: Vector2 = local_origin + source_anchor * scale
			maximum_anchor_error = maxf(maximum_anchor_error, reconstructed_anchor.length())
			var source_dimensions: Vector2 = Vector2(_array_to_vector2i(record.get("expectedDimensions", [])))
			var anchor_uv: Vector2 = Vector2(source_anchor.x / source_dimensions.x, source_anchor.y / source_dimensions.y)
			var shader_anchor: Vector2 = _hybrid_sample_uv(anchor_uv, pose_b)
			maximum_shader_anchor_error = maxf(maximum_shader_anchor_error, shader_anchor.distance_to(anchor_uv))
			var bounds_a: PackedVector2Array = _transformed_substantive_bounds(record, pose_a, _base_ground(PIPELINE_A))
			var bounds_b: PackedVector2Array = _transformed_substantive_bounds(record, pose_b, _base_ground(PIPELINE_B))
			if not _points_inside_rect(bounds_a, panel_a):
				_add_error("Pipeline A substantive bounds leave the review panel at %d ms for %s." % [sample_time, str(record.get("studyId", "choice"))])
			if not _points_inside_rect(bounds_b, panel_b):
				_add_error("Pipeline B substantive bounds leave the review panel at %d ms for %s." % [sample_time, str(record.get("studyId", "choice"))])
			observed_max_bend = maxf(observed_max_bend, absf(float(pose_b.get("bend_uv", 0.0))))
			observed_max_squash = maxf(observed_max_squash, absf(float(pose_b.get("squash", 0.0))))
			observed_max_ripple = maxf(observed_max_ripple, absf(float(pose_b.get("ripple_uv", 0.0))))
			observed_max_emissive = maxf(observed_max_emissive, absf(float(pose_b.get("shader_emissive", 0.0))))
			observed_max_trail = maxf(observed_max_trail, absf(float(pose_b.get("trail", 0.0))))
			sample_count += 2
	if maximum_anchor_error > 0.00001 or maximum_shader_anchor_error > 0.00001:
		_add_error("Ground-anchor reconstruction drifted: raster %.8f px, hybrid UV %.8f." % [maximum_anchor_error, maximum_shader_anchor_error])
	if observed_max_bend > max_bend_limit + 0.000001 or observed_max_squash > max_squash_limit + 0.000001 or observed_max_ripple > max_ripple_limit + 0.000001 or observed_max_emissive > max_emissive_limit + 0.000001 or observed_max_trail > max_trail_limit + 0.000001:
		_add_error("Hybrid motion exceeded a pinned deformation/effect limit.")
	_validate_pipeline_distinction()
	timeline_metrics = {
		"sample_count": sample_count,
		"maximum_anchor_error_px": maximum_anchor_error,
		"maximum_shader_anchor_error_uv": maximum_shader_anchor_error,
		"maximum_bend_uv": observed_max_bend,
		"maximum_squash": observed_max_squash,
		"maximum_ripple_uv": observed_max_ripple,
		"maximum_emissive_gain": observed_max_emissive,
		"maximum_trail_intensity": observed_max_trail,
	}


func _validate_pipeline_distinction() -> void:
	for state_index: int in range(timeline_states.size()):
		var state: Dictionary = timeline_states[state_index] as Dictionary
		var midpoint: float = float(state.get("startMs", 0)) + float(state.get("durationMs", 0)) * 0.5
		var pose_a: Dictionary = _sample_motion(PIPELINE_A, midpoint)
		var pose_b: Dictionary = _sample_motion(PIPELINE_B, midpoint)
		if absf(float(pose_a.get("bend_uv", 0.0))) > 0.000001 or absf(float(pose_a.get("trail", 0.0))) > 0.000001 or absf(float(pose_a.get("shader_emissive", 0.0))) > 0.000001:
			_add_error("Whole-raster Pipeline A acquired hybrid-only fields in state %s." % str(state.get("id", "state")))
		var hybrid_signature: float = absf(float(pose_b.get("bend_uv", 0.0))) + absf(float(pose_b.get("squash", 0.0))) + absf(float(pose_b.get("ripple_uv", 0.0))) + absf(float(pose_b.get("emissive", 0.0))) + absf(float(pose_b.get("trail", 0.0))) + absf(float(pose_b.get("contact", 0.0)))
		if hybrid_signature <= 0.0001:
			_add_error("Deliberate-hybrid Pipeline B is not materially distinct at the midpoint of state %s." % str(state.get("id", "state")))
	var contact_mid: Dictionary = _sample_motion(PIPELINE_B, 1650.0)
	if float(contact_mid.get("contact", 0.0)) < 0.99 or float(contact_mid.get("trail", 0.0)) < 0.99:
		_add_error("The exact 100 ms contact state does not drive both procedural contact and trail layers at midpoint.")


func _sample_motion(pipeline_id: int, requested_time_ms: float) -> Dictionary:
	var state_snapshot: Dictionary = _state_snapshot(requested_time_ms)
	var state_id: String = str(state_snapshot.get("state_id", "idle"))
	var progress: float = float(state_snapshot.get("state_progress", 0.0))
	var pose: Dictionary = {
		"state_index": int(state_snapshot.get("state_index", 0)),
		"state_id": state_id,
		"state_progress": progress,
		"state_elapsed_ms": int(state_snapshot.get("state_elapsed_ms", 0)),
		"state_duration_ms": int(state_snapshot.get("state_duration_ms", 1)),
		"offset": Vector2.ZERO,
		"rotation": 0.0,
		"scale": Vector2.ONE,
		"alpha": 1.0,
		"modulate": Color.WHITE,
		"bend_uv": 0.0,
		"squash": 0.0,
		"ripple_uv": 0.0,
		"shader_emissive": 0.0,
		"emissive": 0.0,
		"trail": 0.0,
		"contact": 0.0,
	}
	if pipeline_id == PIPELINE_A:
		_apply_whole_raster_motion(pose, state_id, progress)
	else:
		_apply_hybrid_motion(pose, state_id, progress)
	return pose


func _apply_whole_raster_motion(pose: Dictionary, state_id: String, progress: float) -> void:
	var eased: float = _ease(progress)
	var burst: float = sin(progress * PI)
	match state_id:
		"idle":
			var breath: float = sin(progress * TAU)
			pose["scale"] = Vector2(1.0 - breath * 0.0035, 1.0 + breath * 0.007)
			pose["rotation"] = deg_to_rad(0.7 * breath)
			pose["alpha"] = _ease(clampf(progress / 0.20, 0.0, 1.0))
		"advance":
			pose["offset"] = Vector2(-60.0 * eased, -absf(sin(progress * TAU)) * 5.0)
			pose["rotation"] = deg_to_rad(-1.1 * sin(progress * TAU))
			pose["scale"] = Vector2(1.0 + 0.012 * absf(sin(progress * TAU)), 1.0 - 0.010 * absf(sin(progress * TAU)))
		"anticipation":
			pose["offset"] = Vector2(-60.0 - 12.0 * eased, 0.0)
			pose["rotation"] = deg_to_rad(-3.0 * eased)
			pose["scale"] = Vector2(1.0 + 0.025 * eased, 1.0 - 0.020 * eased)
		"contact":
			pose["offset"] = Vector2(-72.0 - 18.0 * burst, 0.0)
			pose["rotation"] = deg_to_rad(-3.0 - 2.0 * burst)
			pose["scale"] = Vector2(1.025 + 0.035 * burst, 0.980 - 0.015 * burst)
			pose["modulate"] = Color.WHITE.lerp(Color("#fff0c2"), burst * 0.42)
		"recovery":
			pose["offset"] = Vector2(-72.0 + 12.0 * eased, 0.0)
			pose["rotation"] = deg_to_rad(-3.0 * (1.0 - eased) + 0.7 * burst)
			pose["scale"] = Vector2(1.0 + 0.025 * (1.0 - eased), 1.0 - 0.020 * (1.0 - eased))
		"hit":
			pose["offset"] = Vector2(-60.0 + 10.0 * burst, 0.0)
			pose["rotation"] = deg_to_rad(4.5 * sin(progress * TAU) * (1.0 - progress))
			pose["scale"] = Vector2(1.0 - 0.025 * burst, 1.0 + 0.020 * burst)
			pose["modulate"] = Color.WHITE.lerp(Color("#ff9f8d"), burst * 0.38)
		"defeat":
			pose["offset"] = Vector2(-60.0, 5.0 * eased)
			pose["rotation"] = deg_to_rad(-68.0 * eased)
			pose["scale"] = Vector2(1.0 - 0.05 * eased, 1.0 - 0.10 * eased)
			pose["alpha"] = 1.0 - _ease(clampf((progress - 0.68) / 0.22, 0.0, 1.0))


func _apply_hybrid_motion(pose: Dictionary, state_id: String, progress: float) -> void:
	var eased: float = _ease(progress)
	var burst: float = sin(progress * PI)
	match state_id:
		"idle":
			var breath: float = sin(progress * TAU)
			pose["squash"] = 0.006 * breath
			pose["bend_uv"] = 0.0012 * breath
			pose["shader_emissive"] = 0.025 + 0.012 * (0.5 + 0.5 * breath)
			pose["emissive"] = 0.15 + 0.05 * (0.5 + 0.5 * breath)
			pose["alpha"] = _ease(clampf(progress / 0.20, 0.0, 1.0))
		"advance":
			var gait: float = sin(progress * TAU)
			pose["offset"] = Vector2(-60.0 * eased, -absf(gait) * 2.0)
			pose["bend_uv"] = 0.0025 * gait
			pose["squash"] = 0.006 * gait
			pose["shader_emissive"] = 0.025
			pose["emissive"] = 0.16
			pose["trail"] = 0.22 + 0.34 * absf(gait)
		"anticipation":
			pose["offset"] = Vector2(-60.0 - 10.0 * eased, 0.0)
			pose["rotation"] = deg_to_rad(-0.7 * eased)
			pose["bend_uv"] = -0.0035 * eased
			pose["squash"] = -0.012 * eased
			pose["shader_emissive"] = 0.025 + 0.080 * eased
			pose["emissive"] = 0.20 + 0.38 * eased
			pose["trail"] = 0.20 * eased
		"contact":
			pose["offset"] = Vector2(-70.0 - 12.0 * burst, 0.0)
			pose["rotation"] = deg_to_rad(-0.7 - 1.0 * burst)
			pose["bend_uv"] = -0.0035 - 0.0005 * burst
			pose["squash"] = -0.012 + 0.032 * burst
			pose["ripple_uv"] = 0.003 * burst
			pose["shader_emissive"] = 0.105 + 0.075 * burst
			pose["emissive"] = 0.62 + 0.38 * burst
			pose["trail"] = 1.0
			pose["contact"] = burst
		"recovery":
			pose["offset"] = Vector2(-70.0 + 10.0 * eased, 0.0)
			pose["rotation"] = deg_to_rad(-0.7 * (1.0 - eased))
			pose["bend_uv"] = -0.0035 * (1.0 - eased)
			pose["squash"] = -0.012 * (1.0 - eased)
			pose["shader_emissive"] = 0.105 * (1.0 - eased)
			pose["emissive"] = 0.50 * (1.0 - eased)
			pose["trail"] = 0.25 * (1.0 - eased)
		"hit":
			pose["offset"] = Vector2(-60.0 + 4.0 * burst, 0.0)
			pose["rotation"] = deg_to_rad(1.2 * sin(progress * TAU))
			pose["bend_uv"] = 0.004 * sin(progress * TAU)
			pose["squash"] = 0.016 * burst
			pose["ripple_uv"] = 0.003 * burst
			pose["shader_emissive"] = 0.120 * burst
			pose["emissive"] = 0.72 * burst
			pose["trail"] = 0.18 * burst
			pose["modulate"] = Color.WHITE.lerp(Color("#ffb39f"), burst * 0.18)
		"defeat":
			pose["offset"] = Vector2(-60.0, 5.0 * eased)
			pose["rotation"] = deg_to_rad(-58.0 * eased)
			pose["bend_uv"] = 0.002 * eased
			pose["squash"] = -0.008 * eased
			pose["shader_emissive"] = 0.030 * (1.0 - eased)
			pose["emissive"] = 0.20 * (1.0 - eased)
			pose["trail"] = 0.20 * eased * (1.0 - eased)
			pose["alpha"] = 1.0 - _ease(clampf((progress - 0.68) / 0.22, 0.0, 1.0))


func _state_snapshot(requested_time_ms: float) -> Dictionary:
	var wrapped_time: float = fposmod(requested_time_ms, float(loop_duration_ms))
	for state_index: int in range(timeline_states.size()):
		var state: Dictionary = timeline_states[state_index] as Dictionary
		var start_ms: int = int(state.get("startMs", 0))
		var duration_ms: int = int(state.get("durationMs", 1))
		if wrapped_time >= float(start_ms) and wrapped_time < float(start_ms + duration_ms):
			var elapsed: float = wrapped_time - float(start_ms)
			return {
				"state_index": state_index,
				"state_id": str(state.get("id", "state")),
				"state_progress": clampf(elapsed / float(duration_ms), 0.0, 1.0),
				"state_elapsed_ms": floori(elapsed),
				"state_duration_ms": duration_ms,
			}
	return {"state_index": 0, "state_id": "idle", "state_progress": 0.0, "state_elapsed_ms": 0, "state_duration_ms": 600}


func _activate_asset(asset_index: int) -> void:
	if asset_index < 0 or asset_index >= asset_records.size() or asset_index >= asset_textures.size():
		_add_error("Combatant choice index %d is unavailable." % asset_index)
		return
	active_asset_index = asset_index
	var record: Dictionary = asset_records[asset_index] as Dictionary
	var anchor: Vector2 = Vector2(_array_to_vector2i(record.get("proposedGroundAnchor", [])))
	var display_scale: float = float(record.get("proposedDisplayScale", 0.0))
	whole_sprite.texture = asset_textures[asset_index]
	whole_sprite.position = -anchor * display_scale
	whole_sprite.scale = Vector2.ONE * display_scale
	hybrid_sprite.texture = asset_textures[asset_index]
	hybrid_sprite.position = -anchor * display_scale
	hybrid_sprite.scale = Vector2.ONE * display_scale
	if hybrid_material != null:
		var dimensions: Vector2 = Vector2(_array_to_vector2i(record.get("expectedDimensions", [])))
		hybrid_material.set_shader_parameter("anchor_uv", Vector2(anchor.x / dimensions.x, anchor.y / dimensions.y))
	if initialized:
		_update_presentation()


func _update_presentation() -> void:
	if asset_records.is_empty() or active_asset_index >= asset_records.size():
		return
	var record: Dictionary = asset_records[active_asset_index] as Dictionary
	var pose_a: Dictionary = _sample_motion(PIPELINE_A, timeline_ms)
	var pose_b: Dictionary = _sample_motion(PIPELINE_B, timeline_ms)
	_apply_pose_to_node(pipeline_a, pose_a, _base_ground(PIPELINE_A))
	_apply_pose_to_node(pipeline_b, pose_b, _base_ground(PIPELINE_B))
	pipeline_a.visible = display_mode != DISPLAY_B
	pipeline_b.visible = display_mode != DISPLAY_A
	if hybrid_material != null:
		hybrid_material.set_shader_parameter("bend_uv", float(pose_b.get("bend_uv", 0.0)))
		hybrid_material.set_shader_parameter("squash", float(pose_b.get("squash", 0.0)))
		hybrid_material.set_shader_parameter("ripple_uv", float(pose_b.get("ripple_uv", 0.0)))
		hybrid_material.set_shader_parameter("emissive_gain", float(pose_b.get("shader_emissive", 0.0)))
		hybrid_material.set_shader_parameter("emissive_tint", HYBRID_TINT)
	var derived_proxies: Dictionary = _derived_effect_proxies(record)
	trail_layer.call("configure", pose_b, derived_proxies.get("core", Vector2.ZERO), derived_proxies.get("contact", Vector2.ZERO), HYBRID_TINT)
	emissive_layer.call("configure", pose_b, derived_proxies.get("core", Vector2.ZERO), derived_proxies.get("contact", Vector2.ZERO), HYBRID_TINT)
	var state: Dictionary = _state_snapshot(timeline_ms)
	study_overlay.call("configure", {
		"asset_label": str(record.get("label", "UNKNOWN CHOICE")),
		"view_label": _view_label(),
		"state_id": str(state.get("state_id", "idle")),
		"state_index": int(state.get("state_index", 0)),
		"state_elapsed_ms": int(state.get("state_elapsed_ms", 0)),
		"state_duration_ms": int(state.get("state_duration_ms", 1)),
		"state_progress": float(state.get("state_progress", 0.0)),
		"timeline_ms": floori(timeline_ms),
		"loop_duration_ms": loop_duration_ms,
		"playing": playing and not freeze_time,
		"speed": playback_speed,
		"show_a": pipeline_a.visible,
		"show_b": pipeline_b.visible,
		"show_overlays": show_overlays,
		"base_ground_a": _base_ground(PIPELINE_A),
		"base_ground_b": _base_ground(PIPELINE_B),
		"anchor_a": pipeline_a.position,
		"anchor_b": pipeline_b.position,
		"bounds_a": _transformed_substantive_bounds(record, pose_a, _base_ground(PIPELINE_A)),
		"bounds_b": _transformed_substantive_bounds(record, pose_b, _base_ground(PIPELINE_B)),
		"states": timeline_states,
	})
	queue_redraw()


func _apply_pose_to_node(node: Node2D, pose: Dictionary, base_ground: Vector2) -> void:
	var offset: Vector2 = pose.get("offset", Vector2.ZERO)
	var pose_scale: Vector2 = pose.get("scale", Vector2.ONE)
	var pose_modulate: Color = pose.get("modulate", Color.WHITE)
	pose_modulate.a *= clampf(float(pose.get("alpha", 1.0)), 0.0, 1.0)
	node.position = base_ground + offset
	node.rotation = float(pose.get("rotation", 0.0))
	node.scale = pose_scale
	node.modulate = pose_modulate


func _derived_effect_proxies(record: Dictionary) -> Dictionary:
	var bounds: Rect2i = _array_to_rect2i(record.get("substantiveBounds", []))
	var anchor: Vector2 = Vector2(_array_to_vector2i(record.get("proposedGroundAnchor", [])))
	var display_scale: float = float(record.get("proposedDisplayScale", 0.0))
	var core_source: Vector2 = Vector2(bounds.position) + Vector2(bounds.size) * 0.5
	var contact_source: Vector2 = Vector2(float(bounds.position.x), float(bounds.position.y) + float(bounds.size.y) * 0.65)
	return {
		"core": (core_source - anchor) * display_scale,
		"contact": (contact_source - anchor) * display_scale,
	}


func _draw() -> void:
	if not validation_errors.is_empty():
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#16040a"))
		return
	if view_mode == VIEW_DARK:
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#07101a"))
	elif view_mode == VIEW_LIGHT:
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#e7e2d7"))
	elif view_mode == VIEW_CHECKER:
		_draw_checker(Rect2(Vector2.ZERO, DESIGN_SIZE), 48.0)
	else:
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#050914"))
		var background_index: int = 0 if view_mode == VIEW_EMPIRE_A else 1
		if background_index < background_textures.size():
			draw_texture_rect(background_textures[background_index], Rect2(Vector2.ZERO, DESIGN_SIZE), false)
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color(0.01, 0.025, 0.055, 0.12))
	draw_rect(Rect2(30.0, 104.0, 900.0, 806.0), Color(0.01, 0.02, 0.04, 0.08))
	draw_rect(Rect2(990.0, 104.0, 900.0, 806.0), Color(0.01, 0.02, 0.04, 0.08))
	draw_rect(Rect2(30.0, 104.0, 900.0, 806.0), Color("#ffcf67", 0.22), false, 2.0)
	draw_rect(Rect2(990.0, 104.0, 900.0, 806.0), Color("#63e6ff", 0.22), false, 2.0)
	_draw_ground(_base_ground(PIPELINE_A))
	_draw_ground(_base_ground(PIPELINE_B))


func _draw_ground(point: Vector2) -> void:
	_draw_ellipse(point + Vector2(0.0, 8.0), Vector2(125.0, 14.0), Color(0.0, 0.0, 0.0, 0.50))
	draw_line(point + Vector2(-170.0, 0.0), point + Vector2(170.0, 0.0), Color("#6ee7b7", 0.40), 2.0)


func _draw_checker(rect: Rect2, cell_size: float) -> void:
	for row: int in range(ceili(rect.size.y / cell_size)):
		for column: int in range(ceili(rect.size.x / cell_size)):
			var tone: Color = Color("#d8dde4") if (row + column) % 2 == 0 else Color("#85909e")
			var position: Vector2 = rect.position + Vector2(float(column) * cell_size, float(row) * cell_size)
			draw_rect(Rect2(position, Vector2(minf(cell_size, rect.end.x - position.x), minf(cell_size, rect.end.y - position.y))), tone)


func _draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points: PackedVector2Array = PackedVector2Array()
	for point_index: int in range(32):
		var angle: float = TAU * float(point_index) / 32.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)


func _transformed_substantive_bounds(record: Dictionary, pose: Dictionary, base_ground: Vector2) -> PackedVector2Array:
	var bounds: Rect2i = _array_to_rect2i(record.get("substantiveBounds", []))
	var anchor: Vector2 = Vector2(_array_to_vector2i(record.get("proposedGroundAnchor", [])))
	var display_scale: float = float(record.get("proposedDisplayScale", 0.0))
	var pose_scale: Vector2 = pose.get("scale", Vector2.ONE)
	var rotation: float = float(pose.get("rotation", 0.0))
	var offset: Vector2 = pose.get("offset", Vector2.ZERO)
	var corners: Array[Vector2] = [Vector2(bounds.position), Vector2(bounds.end.x, bounds.position.y), Vector2(bounds.end), Vector2(bounds.position.x, bounds.end.y)]
	var transformed: PackedVector2Array = PackedVector2Array()
	for corner: Vector2 in corners:
		var local: Vector2 = (corner - anchor) * display_scale
		local *= pose_scale
		transformed.append(base_ground + offset + local.rotated(rotation))
	return transformed


func _points_inside_rect(points: PackedVector2Array, rect: Rect2) -> bool:
	for point: Vector2 in points:
		if not rect.has_point(point):
			return false
	return true


func _hybrid_sample_uv(anchor_uv: Vector2, pose: Dictionary) -> Vector2:
	var above_anchor: float = clampf((anchor_uv.y - anchor_uv.y) / maxf(anchor_uv.y, 0.0001), 0.0, 1.0)
	var sample_uv: Vector2 = anchor_uv
	sample_uv.x -= float(pose.get("bend_uv", 0.0)) * above_anchor * above_anchor
	sample_uv.y = anchor_uv.y + (anchor_uv.y - anchor_uv.y) / (1.0 + float(pose.get("squash", 0.0)))
	sample_uv.y += sin(above_anchor * 9.42477796) * float(pose.get("ripple_uv", 0.0)) * above_anchor
	return sample_uv


func _pose_is_finite(pose: Dictionary) -> bool:
	var offset: Vector2 = pose.get("offset", Vector2.ZERO)
	var pose_scale: Vector2 = pose.get("scale", Vector2.ONE)
	for value: float in [offset.x, offset.y, pose_scale.x, pose_scale.y, float(pose.get("rotation", 0.0)), float(pose.get("bend_uv", 0.0)), float(pose.get("squash", 0.0)), float(pose.get("ripple_uv", 0.0))]:
		if value != value or absf(value) > 100000.0:
			return false
	return true


func _base_ground(pipeline_id: int) -> Vector2:
	var review_value: Variant = manifest.get("review", {})
	if review_value is Dictionary:
		var points_value: Variant = (review_value as Dictionary).get("pipelineGroundPoints", [])
		if points_value is Array and pipeline_id < (points_value as Array).size():
			return Vector2(_array_to_vector2i((points_value as Array)[pipeline_id]))
	return Vector2(510.0, 850.0) if pipeline_id == PIPELINE_A else Vector2(1410.0, 850.0)


func _jump_state(direction: int) -> void:
	var current: Dictionary = _state_snapshot(timeline_ms)
	var target_index: int = posmod(int(current.get("state_index", 0)) + direction, timeline_states.size())
	var target: Dictionary = timeline_states[target_index] as Dictionary
	timeline_ms = float(target.get("startMs", 0))


func _view_label() -> String:
	var labels: Array[String] = ["DARK MATTE", "LIGHT MATTE", "CHECKER MATTE", "EMPIRE BACKGROUND A — UNAPPROVED", "EMPIRE BACKGROUND B — UNAPPROVED"]
	return labels[clampi(view_mode, 0, labels.size() - 1)]


func _ease(value: float) -> float:
	var clamped: float = clampf(value, 0.0, 1.0)
	return clamped * clamped * (3.0 - 2.0 * clamped)


func _validate_portable_path(path: String, label: String) -> bool:
	if not path.begins_with("res://study/") or path.contains(".."):
		_add_error("%s must remain beneath res://study/ with no traversal." % label)
		return false
	return true


func _sha256_file(path: String) -> String:
	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if file == null:
		return ""
	var context: HashingContext = HashingContext.new()
	if context.start(HashingContext.HASH_SHA256) != OK:
		return ""
	while not file.eof_reached():
		var chunk: PackedByteArray = file.get_buffer(65536)
		if not chunk.is_empty():
			context.update(chunk)
	return context.finish().hex_encode().to_upper()


func _read_u32_be(bytes: PackedByteArray, offset: int) -> int:
	return (int(bytes[offset]) << 24) | (int(bytes[offset + 1]) << 16) | (int(bytes[offset + 2]) << 8) | int(bytes[offset + 3])


func _array_to_vector2i(value: Variant) -> Vector2i:
	if value is Array and (value as Array).size() == 2:
		return Vector2i(int((value as Array)[0]), int((value as Array)[1]))
	return Vector2i(-1, -1)


func _array_to_rect2i(value: Variant) -> Rect2i:
	if value is Array and (value as Array).size() == 4:
		return Rect2i(int((value as Array)[0]), int((value as Array)[1]), int((value as Array)[2]), int((value as Array)[3]))
	return Rect2i()


func _add_error(message: String) -> void:
	if not validation_errors.has(message):
		validation_errors.append(message)


func _add_blocker(message: String) -> void:
	if not readiness_blockers.has(message):
		readiness_blockers.append(message)


func _report_validation() -> void:
	if validation_errors.is_empty():
		print("[Motion Study] Structural/timeline/anchor validation PASS.")
	else:
		for error: String in validation_errors:
			push_error("[Motion Study] VALIDATION ERROR: %s" % error)
	for asset_index: int in range(mini(asset_records.size(), alpha_scans.size())):
		var record: Dictionary = asset_records[asset_index] as Dictionary
		var scan: Dictionary = alpha_scans[asset_index] as Dictionary
		print("[Motion Study] %s alpha scan %.2f ms strict=%s substantive=%s edge=%d." % [str(record.get("label", "choice")), scan_durations[asset_index], scan.get("strict_bounds", Rect2i()), scan.get("substantive_bounds", Rect2i()), int(scan.get("edge_nonzero_count", 0))])
	if not timeline_metrics.is_empty():
		print("[Motion Study] samples=%d raster_anchor_error=%.8fpx hybrid_anchor_error=%.8fuv bend=%.6f squash=%.6f ripple=%.6f emissive=%.3f trail=%.3f." % [int(timeline_metrics.get("sample_count", 0)), float(timeline_metrics.get("maximum_anchor_error_px", 0.0)), float(timeline_metrics.get("maximum_shader_anchor_error_uv", 0.0)), float(timeline_metrics.get("maximum_bend_uv", 0.0)), float(timeline_metrics.get("maximum_squash", 0.0)), float(timeline_metrics.get("maximum_ripple_uv", 0.0)), float(timeline_metrics.get("maximum_emissive_gain", 0.0)), float(timeline_metrics.get("maximum_trail_intensity", 0.0))])
	for blocker: String in readiness_blockers:
		push_warning("[Motion Study] READINESS BLOCKER: %s" % blocker)
	print("[Motion Study] UNAPPROVED engineering study; one source frame per choice; no gameplay outcomes or runtime registration.")


func _finish_validation_run() -> void:
	if not validation_errors.is_empty():
		get_tree().quit(2)
	elif strict_mode and not readiness_blockers.is_empty():
		printerr("[Motion Study] STRICT PACKAGE-READINESS GATE FAILED with %d blocker(s)." % readiness_blockers.size())
		get_tree().quit(3)
	else:
		get_tree().quit(0)
