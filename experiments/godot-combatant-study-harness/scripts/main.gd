extends Node2D

const DESIGN_SIZE: Vector2 = Vector2(1920.0, 1080.0)
const MANIFEST_PATH: String = "res://study/study_manifest.json"
const VIEW_MATTES: int = 0
const VIEW_BACKGROUND_A: int = 1
const VIEW_BACKGROUND_B: int = 2
const VIEW_SOURCE_DIAGNOSTIC: int = 3
const UI_WHITE: Color = Color("#f8fafc")
const UI_MUTED: Color = Color("#a7b3c4")
const UI_CYAN: Color = Color("#63e6ff")
const UI_GOLD: Color = Color("#ffcf67")
const UI_RED: Color = Color("#fb7185")
const UI_GREEN: Color = Color("#6ee7b7")

var manifest: Dictionary = {}
var asset_records: Array = []
var asset_record: Dictionary = {}
var background_records: Array = []
var motion_records: Array = []
var asset_images: Array[Image] = []
var asset_textures: Array[Texture2D] = []
var alpha_scans: Array = []
var scan_durations: Array[float] = []
var asset_image: Image
var asset_texture: Texture2D
var background_textures: Array[Texture2D] = []
var alpha_scan: Dictionary = {}
var validation_errors: Array[String] = []
var review_blockers: Array[String] = []
var view_mode: int = VIEW_MATTES
var active_asset_index: int = 0
var active_pipeline_index: int = 0
var scale_candidate_index: int = 1
var show_overlays: bool = true
var validate_only: bool = false
var strict_mode: bool = false
var scan_milliseconds: float = 0.0


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_apply_command_line_overrides()
	_load_manifest()
	if validation_errors.is_empty():
		_validate_manifest_semantics()
		_load_and_validate_assets()
		_load_and_validate_backgrounds()
		_validate_review_layouts()
	_report_validation()
	queue_redraw()
	if not validation_errors.is_empty() or validate_only or strict_mode:
		call_deferred("_finish_validation_run")


func _unhandled_input(event: InputEvent) -> void:
	if not (event is InputEventKey):
		return
	var key_event: InputEventKey = event as InputEventKey
	if not key_event.pressed or key_event.echo:
		return
	var handled: bool = true
	match key_event.keycode:
		KEY_1:
			view_mode = VIEW_MATTES
		KEY_2:
			view_mode = VIEW_BACKGROUND_A
		KEY_3:
			view_mode = VIEW_BACKGROUND_B
		KEY_4:
			view_mode = VIEW_SOURCE_DIAGNOSTIC
		KEY_C:
			_activate_asset((active_asset_index + 1) % 2)
		KEY_P:
			active_pipeline_index = (active_pipeline_index + 1) % 2
		KEY_O:
			show_overlays = not show_overlays
		KEY_Z:
			scale_candidate_index = (scale_candidate_index + 1) % 3
		KEY_R:
			view_mode = VIEW_MATTES
			_activate_asset(0)
			active_pipeline_index = 0
			scale_candidate_index = 1
			show_overlays = true
		KEY_ESCAPE:
			get_tree().quit()
		_:
			handled = false
	if handled:
		queue_redraw()
		get_viewport().set_input_as_handled()


func _draw() -> void:
	if asset_texture == null:
		_draw_load_failure()
		return
	match view_mode:
		VIEW_MATTES:
			_draw_matte_triptych()
		VIEW_BACKGROUND_A:
			_draw_background_study(0)
		VIEW_BACKGROUND_B:
			_draw_background_study(1)
		VIEW_SOURCE_DIAGNOSTIC:
			_draw_source_diagnostic()
	_draw_header()
	_draw_footer()
	if not validation_errors.is_empty():
		_draw_load_failure()


func _apply_command_line_overrides() -> void:
	for argument: String in OS.get_cmdline_user_args():
		if argument == "--validate-only":
			validate_only = true
		elif argument == "--strict":
			strict_mode = true
		elif argument == "--overlays=off":
			show_overlays = false
		elif argument.begins_with("--view="):
			var view_value: String = argument.trim_prefix("--view=").to_lower()
			if view_value == "mattes":
				view_mode = VIEW_MATTES
			elif view_value == "background-a":
				view_mode = VIEW_BACKGROUND_A
			elif view_value == "background-b":
				view_mode = VIEW_BACKGROUND_B
			elif view_value == "source":
				view_mode = VIEW_SOURCE_DIAGNOSTIC
			else:
				_add_error("Unknown --view value: %s" % view_value)
		elif argument.begins_with("--pipeline="):
			var pipeline_value: String = argument.trim_prefix("--pipeline=").to_lower()
			if pipeline_value == "full-frame-raster" or pipeline_value == "a":
				active_pipeline_index = 0
			elif pipeline_value == "deliberate-hybrid" or pipeline_value == "b":
				active_pipeline_index = 1
			else:
				_add_error("Unknown --pipeline value: %s" % pipeline_value)
		elif argument.begins_with("--combatant="):
			var combatant_value: String = argument.trim_prefix("--combatant=").to_lower()
			if combatant_value == "choice-a" or combatant_value == "a":
				active_asset_index = 0
			elif combatant_value == "choice-b" or combatant_value == "b":
				active_asset_index = 1
			else:
				_add_error("--combatant must be choice-a/a or choice-b/b.")
		elif argument.begins_with("--height="):
			var height_value: int = argument.trim_prefix("--height=").to_int()
			if height_value == 320:
				scale_candidate_index = 0
			elif height_value == 360:
				scale_candidate_index = 1
			elif height_value == 400:
				scale_candidate_index = 2
			else:
				_add_error("--height must be one of 320, 360, or 400.")


func _load_manifest() -> void:
	var file: FileAccess = FileAccess.open(MANIFEST_PATH, FileAccess.READ)
	if file == null:
		_add_error("Missing study manifest: %s" % MANIFEST_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not (parsed is Dictionary):
		_add_error("Study manifest must be a JSON object.")
		return
	manifest = parsed as Dictionary
	var assets_value: Variant = manifest.get("assets", [])
	var backgrounds_value: Variant = manifest.get("backgrounds", [])
	var motion_value: Variant = manifest.get("motionPipelinePlaceholders", [])
	if not (assets_value is Array):
		_add_error("Study manifest assets must be an array.")
		return
	if not (backgrounds_value is Array) or not (motion_value is Array):
		_add_error("Study manifest backgrounds and motionPipelinePlaceholders must be arrays.")
		return
	asset_records = assets_value as Array
	if not asset_records.is_empty() and asset_records[0] is Dictionary:
		asset_record = asset_records[0] as Dictionary
	background_records = backgrounds_value as Array
	motion_records = motion_value as Array


func _validate_manifest_semantics() -> void:
	if str(manifest.get("format", "")) != "godot-combatant-idle-review-study" or int(manifest.get("version", 0)) != 2:
		_add_error("Unsupported study manifest format/version.")
	if str(manifest.get("approvalState", "")) != "unapproved":
		_add_error("The isolated study must remain explicitly unapproved.")
	if str(manifest.get("runtimeRegistration", "")) != "none":
		_add_error("The isolated study must not claim runtime registration.")
	if str(manifest.get("scope", "")) != "two-idle-keyframe-choice-comparison-visual-qa-only":
		_add_error("Study scope must remain a two-choice idle-keyframe visual QA comparison only.")
	if asset_records.size() != 2:
		_add_error("Study requires exactly two unapproved idle-study choices.")
	else:
		var expected_study_ids: Array[String] = ["choice-a", "choice-b"]
		for asset_index: int in range(2):
			var raw_asset: Variant = asset_records[asset_index]
			if not (raw_asset is Dictionary):
				_add_error("Combatant study %d must be an object." % asset_index)
				continue
			var record: Dictionary = raw_asset as Dictionary
			if str(record.get("studyId", "")) != expected_study_ids[asset_index]:
				_add_error("Combatant study order/ID mismatch at index %d." % asset_index)
			if str(record.get("roleId", "")) != "power-melee":
				_add_error("Study role must remain the anonymous power-melee functional ID.")
			if str(record.get("deploymentSide", "")) != "party" or str(record.get("authoredFacing", "")) != "left":
				_add_error("Party studies must retain authored screen-left facing.")
			if int(record.get("frameCount", 0)) != 1 or str(record.get("frameMeaning", "")) != "idle-like-keyframe-only":
				_add_error("Each choice must declare exactly one idle-like keyframe.")
	if background_records.size() != 2:
		_add_error("Study requires exactly two neutral Empire background records.")
	if motion_records.size() != 2:
		_add_error("Study requires exactly two motion-pipeline placeholders.")
	else:
		var expected_pipeline_ids: Array[String] = ["full-frame-raster", "deliberate-hybrid"]
		for pipeline_index: int in range(2):
			var raw_pipeline: Variant = motion_records[pipeline_index]
			if not (raw_pipeline is Dictionary):
				_add_error("Motion placeholder %d must be an object." % pipeline_index)
				continue
			var pipeline: Dictionary = raw_pipeline as Dictionary
			if str(pipeline.get("id", "")) != expected_pipeline_ids[pipeline_index]:
				_add_error("Motion placeholder order/ID mismatch at index %d." % pipeline_index)
			if not str(pipeline.get("status", "")).begins_with("placeholder-"):
				_add_error("Motion pipeline entries must remain explicit placeholders.")
	_add_blocker("Each choice is one idle-like keyframe only: no animation clips, timing, events, sockets, masks, or stationary-foot-drift evidence.")
	_add_blocker("Neither source is a 512x512 production cell or complete raster package.")
	_add_blocker("Both motion-pipeline controls are placeholders; the displayed pixels never change between them.")


func _load_and_validate_assets() -> void:
	asset_images.clear()
	asset_textures.clear()
	alpha_scans.clear()
	scan_durations.clear()
	for asset_index: int in range(asset_records.size()):
		var raw_asset: Variant = asset_records[asset_index]
		if not (raw_asset is Dictionary):
			continue
		asset_record = raw_asset as Dictionary
		asset_image = null
		asset_texture = null
		alpha_scan = {}
		scan_milliseconds = 0.0
		_load_and_validate_asset()
		if asset_image == null or asset_texture == null or alpha_scan.is_empty():
			_add_error("Could not prepare combatant study %d for review." % asset_index)
			continue
		asset_images.append(asset_image)
		asset_textures.append(asset_texture)
		alpha_scans.append(alpha_scan.duplicate(true))
		scan_durations.append(scan_milliseconds)
	if asset_images.size() == asset_records.size():
		_activate_asset(active_asset_index)


func _load_and_validate_asset() -> void:
	var study_id: String = str(asset_record.get("studyId", "unknown"))
	var path: String = str(asset_record.get("portableCopy", ""))
	if not _validate_portable_path(path, "combatant %s portableCopy" % study_id):
		return
	if not FileAccess.file_exists(path):
		_add_error("Missing portable combatant copy: %s" % path)
		return
	_validate_file_identity(path, asset_record, "combatant %s" % study_id)
	var raw_bytes: PackedByteArray = FileAccess.get_file_as_bytes(path)
	var expected_png_value: Variant = asset_record.get("expectedPng", {})
	if expected_png_value is Dictionary:
		_validate_png_header(raw_bytes, expected_png_value as Dictionary)
	else:
		_add_error("asset.expectedPng must be an object.")
	asset_image = Image.new()
	var load_result: Error = asset_image.load(ProjectSettings.globalize_path(path))
	if load_result != OK:
		_add_error("Could not decode portable combatant PNG: error %d" % load_result)
		return
	var expected_dimensions: Vector2i = _array_to_vector2i(asset_record.get("expectedDimensions", []))
	if Vector2i(asset_image.get_width(), asset_image.get_height()) != expected_dimensions:
		_add_error("Combatant decoded dimensions differ from manifest.")
	if asset_image.get_format() != Image.FORMAT_RGBA8:
		_add_error("Combatant must decode as RGBA8.")
	var scan_started: int = Time.get_ticks_usec()
	alpha_scan = _scan_alpha(asset_image, int(asset_record.get("reviewAlphaThreshold", 2)))
	scan_milliseconds = float(Time.get_ticks_usec() - scan_started) / 1000.0
	_validate_alpha_scan(expected_dimensions)
	asset_texture = ImageTexture.create_from_image(asset_image)


func _activate_asset(asset_index: int) -> void:
	if asset_index < 0 or asset_index >= asset_records.size():
		_add_error("Combatant choice index %d is outside the manifest." % asset_index)
		return
	active_asset_index = asset_index
	asset_record = asset_records[asset_index] as Dictionary
	if asset_index < asset_images.size():
		asset_image = asset_images[asset_index]
		asset_texture = asset_textures[asset_index]
		alpha_scan = alpha_scans[asset_index] as Dictionary
		scan_milliseconds = scan_durations[asset_index]


func _load_and_validate_backgrounds() -> void:
	background_textures.clear()
	for background_index: int in range(background_records.size()):
		var raw_background: Variant = background_records[background_index]
		if not (raw_background is Dictionary):
			_add_error("Background %d record must be an object." % background_index)
			continue
		var background: Dictionary = raw_background as Dictionary
		var path: String = str(background.get("portableCopy", ""))
		if not _validate_portable_path(path, "background %d portableCopy" % background_index):
			continue
		if not FileAccess.file_exists(path):
			_add_error("Missing portable background %d: %s" % [background_index, path])
			continue
		_validate_file_identity(path, background, "background %d" % background_index)
		var image: Image = Image.new()
		var load_result: Error = image.load(ProjectSettings.globalize_path(path))
		if load_result != OK:
			_add_error("Could not decode background %d: error %d" % [background_index, load_result])
			continue
		var expected_dimensions: Vector2i = _array_to_vector2i(background.get("expectedDimensions", []))
		if Vector2i(image.get_width(), image.get_height()) != expected_dimensions:
			_add_error("Background %d decoded dimensions differ from manifest." % background_index)
		background_textures.append(ImageTexture.create_from_image(image))


func _validate_file_identity(path: String, record: Dictionary, label: String) -> void:
	var expected_hash: String = str(record.get("expectedSha256", "")).to_upper()
	var actual_hash: String = _sha256_file(path)
	if actual_hash != expected_hash:
		_add_error("%s SHA-256 mismatch: expected %s, got %s" % [label, expected_hash, actual_hash])
	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if file == null:
		_add_error("Could not open %s for byte-length validation." % label)
		return
	var actual_bytes: int = file.get_length()
	var expected_bytes: int = int(record.get("expectedBytes", -1))
	if actual_bytes != expected_bytes:
		_add_error("%s byte length mismatch: expected %d, got %d" % [label, expected_bytes, actual_bytes])


func _validate_png_header(bytes: PackedByteArray, expected: Dictionary) -> void:
	var signature: Array[int] = [137, 80, 78, 71, 13, 10, 26, 10]
	if bytes.size() < 29:
		_add_error("Combatant PNG is too short to contain IHDR.")
		return
	for byte_index: int in range(signature.size()):
		if int(bytes[byte_index]) != signature[byte_index]:
			_add_error("Combatant file does not have a valid PNG signature.")
			return
	if String.chr(bytes[12]) + String.chr(bytes[13]) + String.chr(bytes[14]) + String.chr(bytes[15]) != "IHDR":
		_add_error("Combatant PNG does not begin with IHDR.")
		return
	var raw_dimensions: Vector2i = Vector2i(_read_u32_be(bytes, 16), _read_u32_be(bytes, 20))
	if raw_dimensions != _array_to_vector2i(asset_record.get("expectedDimensions", [])):
		_add_error("Combatant raw PNG dimensions differ from manifest.")
	if int(bytes[24]) != int(expected.get("bitDepth", -1)):
		_add_error("Combatant PNG bit depth must remain 8.")
	if int(bytes[25]) != int(expected.get("colorType", -1)):
		_add_error("Combatant PNG color type must remain 6 (true RGBA).")
	if int(bytes[28]) != int(expected.get("interlace", -1)):
		_add_error("Combatant PNG must remain non-interlaced.")


func _scan_alpha(image: Image, review_threshold: int) -> Dictionary:
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
			if alpha >= review_threshold:
				substantive_min.x = mini(substantive_min.x, x)
				substantive_min.y = mini(substantive_min.y, y)
				substantive_max.x = maxi(substantive_max.x, x)
				substantive_max.y = maxi(substantive_max.y, y)
	var strict_bounds: Rect2i = Rect2i(strict_min, strict_max - strict_min + Vector2i.ONE)
	var substantive_bounds: Rect2i = Rect2i(substantive_min, substantive_max - substantive_min + Vector2i.ONE)
	return {
		"transparent": transparent_count,
		"partial": partial_count,
		"opaque": opaque_count,
		"strict_bounds": strict_bounds,
		"substantive_bounds": substantive_bounds,
		"edge_nonzero_count": edge_nonzero_count,
		"first_edge_pixel": first_edge_pixel,
	}


func _validate_alpha_scan(image_dimensions: Vector2i) -> void:
	var label: String = str(asset_record.get("label", "UNKNOWN CHOICE"))
	var study_id: String = str(asset_record.get("studyId", "unknown"))
	var expected_counts_value: Variant = asset_record.get("expectedAlphaCounts", {})
	if not (expected_counts_value is Dictionary):
		_add_error("%s expectedAlphaCounts must be an object." % label)
		return
	var expected_counts: Dictionary = expected_counts_value as Dictionary
	for count_key: String in ["transparent", "partial", "opaque"]:
		if int(alpha_scan.get(count_key, -1)) != int(expected_counts.get(count_key, -2)):
			_add_error("%s alpha %s count differs from the measured manifest value." % [label, count_key])
	if int(alpha_scan.get("transparent", 0)) <= 0 or int(alpha_scan.get("partial", 0)) <= 0:
		_add_error("%s must contain both fully transparent and partially transparent pixels." % label)
	var strict_bounds: Rect2i = alpha_scan.get("strict_bounds", Rect2i()) as Rect2i
	var substantive_bounds: Rect2i = alpha_scan.get("substantive_bounds", Rect2i()) as Rect2i
	var expected_strict: Rect2i = _array_to_rect2i(asset_record.get("strictNonzeroBounds", []))
	var expected_substantive: Rect2i = _array_to_rect2i(asset_record.get("substantiveBounds", []))
	if strict_bounds != expected_strict:
		_add_error("%s strict nonzero-alpha bounds changed: expected %s, got %s." % [label, expected_strict, strict_bounds])
	if substantive_bounds != expected_substantive:
		_add_error("%s substantive alpha bounds changed: expected %s, got %s." % [label, expected_substantive, substantive_bounds])
	if substantive_bounds.position.x <= 0 or substantive_bounds.position.y <= 0 or substantive_bounds.end.x >= image_dimensions.x or substantive_bounds.end.y >= image_dimensions.y:
		_add_error("%s substantive silhouette touches a source edge and is cropped at alpha >= %d." % [label, int(asset_record.get("reviewAlphaThreshold", 2))])
	var expected_edge_count: int = int(asset_record.get("expectedEdgeNonzeroCount", -1))
	var actual_edge_count: int = int(alpha_scan.get("edge_nonzero_count", -2))
	if actual_edge_count != expected_edge_count:
		_add_error("%s nonzero edge-pixel count changed: expected %d, got %d." % [label, expected_edge_count, actual_edge_count])
	elif expected_edge_count > 0:
		var residue_value: Variant = asset_record.get("knownEdgeResidue", {})
		if not (residue_value is Dictionary):
			_add_error("%s knownEdgeResidue must be an object when edge pixels are expected." % label)
			return
		var residue: Dictionary = residue_value as Dictionary
		var expected_edge: Vector3i = Vector3i(int(residue.get("x", -1)), int(residue.get("y", -1)), int(residue.get("alpha", -1)))
		var actual_edge: Vector3i = alpha_scan.get("first_edge_pixel", Vector3i(-1, -1, -1)) as Vector3i
		if expected_edge_count != 1 or actual_edge != expected_edge:
			_add_error("%s exact edge-alpha residue changed: expected one pixel %s, got count=%d first=%s." % [label, expected_edge, actual_edge_count, actual_edge])
		else:
			_add_blocker("Choice A strict nonzero-alpha gate fails exactly: one alpha=1 residue pixel at (0,1268) touches the left and bottom source edges.")
	var margins_value: Variant = asset_record.get("contractShapedReviewMargins", {})
	if margins_value is Dictionary:
		var margins: Dictionary = margins_value as Dictionary
		var actual_left: int = substantive_bounds.position.x
		var actual_top: int = substantive_bounds.position.y
		var actual_right: int = image_dimensions.x - substantive_bounds.end.x
		var actual_bottom: int = image_dimensions.y - substantive_bounds.end.y
		var failed_sides: Array[String] = []
		if actual_left < int(margins.get("left", 32)):
			failed_sides.append("left")
		if actual_top < int(margins.get("top", 32)):
			failed_sides.append("top")
		if actual_right < int(margins.get("right", 32)):
			failed_sides.append("right")
		if actual_bottom < int(margins.get("bottom", 40)):
			failed_sides.append("bottom")
		if not failed_sides.is_empty():
			_add_blocker("%s provisional source-margin review fails at alpha>=2: measured L%d T%d R%d B%d versus L32 T32 R32 B40; insufficient %s padding." % [label, actual_left, actual_top, actual_right, actual_bottom, ", ".join(failed_sides)])
			if study_id == "choice-b":
				var strict_bottom: int = image_dimensions.y - strict_bounds.end.y
				_add_blocker("Choice B bottom safety is %d px at alpha>=2 and %d px at strict alpha>0, below the provisional 40 px bottom margin; its silhouette is not edge-cropped." % [actual_bottom, strict_bottom])
	else:
		_add_error("%s contractShapedReviewMargins must be an object." % label)
	var proposed_anchor: Vector2i = _array_to_vector2i(asset_record.get("proposedGroundAnchor", []))
	if proposed_anchor.y != substantive_bounds.end.y:
		_add_error("Proposed review anchor y must equal substantive-bounds exclusive bottom.")
	if proposed_anchor.x < substantive_bounds.position.x or proposed_anchor.x >= substantive_bounds.end.x:
		_add_error("Proposed review anchor x must remain inside substantive bounds.")
	var proposed_scale: float = float(asset_record.get("proposedDisplayScale", 0.0))
	var proposed_height: float = float(asset_record.get("proposedVisibleHeight1080", 0.0))
	if absf(float(substantive_bounds.size.y) * proposed_scale - proposed_height) > 0.01:
		_add_error("Proposed review scale does not reproduce the declared 1080p visible height.")


func _validate_review_layouts() -> void:
	if asset_images.size() != asset_records.size():
		return
	var restore_index: int = active_asset_index
	for asset_index: int in range(asset_records.size()):
		_activate_asset(asset_index)
		var label: String = str(asset_record.get("label", "UNKNOWN CHOICE"))
		var proposed_anchor: Vector2 = Vector2(_array_to_vector2i(asset_record.get("proposedGroundAnchor", [])))
		var substantive_bounds: Rect2i = alpha_scan.get("substantive_bounds", Rect2i()) as Rect2i
		var scale_candidates_value: Variant = asset_record.get("scaleReviewCandidates1080", [])
		if not (scale_candidates_value is Array) or (scale_candidates_value as Array).size() != 3:
			_add_error("%s requires exactly three reversible scale-review candidates." % label)
			continue
		for candidate_value: Variant in scale_candidates_value as Array:
			var candidate_scale: float = float(candidate_value) / float(substantive_bounds.size.y)
			for panel_index: int in range(3):
				var panel: Rect2 = Rect2(float(panel_index) * 640.0, 100.0, 640.0, 908.0)
				var sprite_rect: Rect2 = _full_texture_rect(Vector2(float(panel_index) * 640.0 + 320.0, 900.0), proposed_anchor, candidate_scale)
				if not _rect_contains(panel, sprite_rect):
					_add_error("%s matte panel %d crops the %d px review candidate." % [label, panel_index, int(candidate_value)])
		var background_x: float = 1210.0 if asset_index == 0 else 1580.0
		var background_rect: Rect2 = _full_texture_rect(Vector2(background_x, 850.0), proposed_anchor, _proposed_display_scale())
		if not _rect_contains(Rect2(Vector2.ZERO, DESIGN_SIZE), background_rect):
			_add_error("%s background review layout crops the proposed-scale source texture." % label)
		var source_rect: Rect2 = _full_texture_rect(Vector2(960.0, 930.0), proposed_anchor, _source_diagnostic_scale())
		if not _rect_contains(Rect2(0.0, 100.0, DESIGN_SIZE.x, 908.0), source_rect):
			_add_error("%s source diagnostic layout crops the copied texture." % label)
	_activate_asset(restore_index)


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
	if value is Array:
		var components: Array = value as Array
		if components.size() == 2:
			return Vector2i(int(components[0]), int(components[1]))
	return Vector2i(-1, -1)


func _array_to_rect2i(value: Variant) -> Rect2i:
	if value is Array:
		var components: Array = value as Array
		if components.size() == 4:
			return Rect2i(int(components[0]), int(components[1]), int(components[2]), int(components[3]))
	return Rect2i()


func _full_texture_rect(ground_point: Vector2, proposed_anchor: Vector2, display_scale: float) -> Rect2:
	var origin: Vector2 = ground_point - proposed_anchor * display_scale
	return Rect2(origin, Vector2(float(asset_image.get_width()), float(asset_image.get_height())) * display_scale)


func _rect_contains(outer: Rect2, inner: Rect2) -> bool:
	return inner.position.x >= outer.position.x and inner.position.y >= outer.position.y and inner.end.x <= outer.end.x and inner.end.y <= outer.end.y


func _proposed_display_scale() -> float:
	return float(asset_record.get("proposedDisplayScale", 0.0))


func _source_diagnostic_scale() -> float:
	var proposed_anchor: Vector2i = _array_to_vector2i(asset_record.get("proposedGroundAnchor", []))
	return minf(0.68, 830.0 / maxf(1.0, float(proposed_anchor.y)))


func _current_visible_height() -> float:
	var candidates_value: Variant = asset_record.get("scaleReviewCandidates1080", [320.0, 360.0, 400.0])
	if candidates_value is Array:
		var candidates: Array = candidates_value as Array
		if scale_candidate_index >= 0 and scale_candidate_index < candidates.size():
			return float(candidates[scale_candidate_index])
	return 360.0


func _current_display_scale() -> float:
	var substantive_bounds: Rect2i = alpha_scan.get("substantive_bounds", Rect2i(0, 0, 1, 1)) as Rect2i
	return _current_visible_height() / maxf(1.0, float(substantive_bounds.size.y))


func _add_error(message: String) -> void:
	if not validation_errors.has(message):
		validation_errors.append(message)


func _add_blocker(message: String) -> void:
	if not review_blockers.has(message):
		review_blockers.append(message)


func _report_validation() -> void:
	if validation_errors.is_empty():
		print("[Combatant Study] Structural validation PASS: portable copies, hashes, dimensions, PNG encoding, alpha measurements, and review layouts match.")
	else:
		for message: String in validation_errors:
			push_error("[Combatant Study] VALIDATION ERROR: %s" % message)
	var restore_index: int = active_asset_index
	for asset_index: int in range(asset_scans_size()):
		_activate_asset(asset_index)
		print("[Combatant Study] %s alpha scan %.2f ms: transparent=%d partial=%d opaque=%d strict=%s substantive=%s edge_nonzero=%d." % [
			str(asset_record.get("label", "UNKNOWN CHOICE")),
			scan_milliseconds,
			int(alpha_scan.get("transparent", 0)),
			int(alpha_scan.get("partial", 0)),
			int(alpha_scan.get("opaque", 0)),
			alpha_scan.get("strict_bounds", Rect2i()),
			alpha_scan.get("substantive_bounds", Rect2i()),
			int(alpha_scan.get("edge_nonzero_count", 0)),
		])
	if asset_scans_size() > 0:
		_activate_asset(restore_index)
	for blocker: String in review_blockers:
		push_warning("[Combatant Study] REVIEW BLOCKER: %s" % blocker)
	print("[Combatant Study] Status=UNAPPROVED, choices=2, frameCount=1 per choice, runtimeRegistration=none, motion pixels=unchanged placeholders.")


func asset_scans_size() -> int:
	return mini(asset_records.size(), alpha_scans.size())


func _finish_validation_run() -> void:
	if not validation_errors.is_empty():
		get_tree().quit(2)
	elif strict_mode and not review_blockers.is_empty():
		printerr("[Combatant Study] STRICT PACKAGE-READINESS GATE FAILED with %d documented blocker(s)." % review_blockers.size())
		get_tree().quit(3)
	else:
		get_tree().quit(0)


func _draw_matte_triptych() -> void:
	draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#070b12"))
	var panel_labels: Array[String] = ["DARK MATTE", "LIGHT MATTE", "CHECKER MATTE"]
	var display_scale: float = _current_display_scale()
	for panel_index: int in range(3):
		var panel: Rect2 = Rect2(float(panel_index) * 640.0, 100.0, 640.0, 908.0)
		if panel_index == 0:
			draw_rect(panel, Color("#07101a"))
		elif panel_index == 1:
			draw_rect(panel, Color("#e7e2d7"))
		else:
			_draw_checker(panel, 40.0)
		draw_rect(panel, Color(UI_CYAN, 0.34), false, 2.0)
		var ground_point: Vector2 = Vector2(float(panel_index) * 640.0 + 320.0, 900.0)
		_draw_review_ground(ground_point, 220.0)
		_draw_combatant_at(ground_point, display_scale)
		draw_rect(Rect2(panel.position + Vector2(16.0, 16.0), Vector2(608.0, 38.0)), Color(0.003, 0.008, 0.020, 0.82))
		draw_string(ThemeDB.fallback_font, panel.position + Vector2(30.0, 42.0), panel_labels[panel_index], HORIZONTAL_ALIGNMENT_LEFT, 300.0, 15, UI_WHITE)
		draw_string(ThemeDB.fallback_font, panel.position + Vector2(330.0, 42.0), "%s • SAME SCALE" % str(asset_record.get("studyId", "choice")).to_upper(), HORIZONTAL_ALIGNMENT_RIGHT, 278.0, 12, UI_GOLD)


func _draw_background_study(background_index: int) -> void:
	draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#050914"))
	if background_index >= 0 and background_index < background_textures.size():
		draw_texture_rect(background_textures[background_index], Rect2(Vector2.ZERO, DESIGN_SIZE), false)
	# Identical neutral treatment for A and B. No candidate-specific correction.
	draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color(0.01, 0.025, 0.055, 0.10))
	var restore_index: int = active_asset_index
	for asset_index: int in range(asset_records.size()):
		_activate_asset(asset_index)
		var ground_point: Vector2 = Vector2(1210.0 if asset_index == 0 else 1580.0, 850.0)
		_draw_review_ground(ground_point, 160.0)
		_draw_combatant_at(ground_point, _current_display_scale())
		draw_rect(Rect2(ground_point + Vector2(-108.0, 28.0), Vector2(216.0, 34.0)), Color(0.003, 0.008, 0.020, 0.86))
		draw_string(ThemeDB.fallback_font, ground_point + Vector2(-94.0, 51.0), str(asset_record.get("label", "UNKNOWN CHOICE")), HORIZONTAL_ALIGNMENT_CENTER, 188.0, 12, UI_GOLD)
	_activate_asset(restore_index)
	var label: String = "UNKNOWN BACKGROUND"
	if background_index >= 0 and background_index < background_records.size() and background_records[background_index] is Dictionary:
		label = str((background_records[background_index] as Dictionary).get("label", label))
	_draw_panel(Rect2(28.0, 128.0, 760.0, 192.0), UI_CYAN)
	var font: Font = ThemeDB.fallback_font
	draw_string(font, Vector2(52.0, 164.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, UI_GOLD)
	draw_string(font, Vector2(52.0, 194.0), "TWO SINGLE IDLE KEYFRAMES • PARTY FACING SCREEN-LEFT", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(52.0, 224.0), "EQUAL PROPOSED VISIBLE HEIGHT %.0f px @1080p / %.0f px @720p" % [_current_visible_height(), _current_visible_height() * (2.0 / 3.0)], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_CYAN)
	draw_string(font, Vector2(52.0, 254.0), "CHOICE-SPECIFIC PROPOSED ANCHORS/SCALES • NEITHER APPROVED", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(52.0, 284.0), "Background and combatant decisions remain independent.", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_MUTED)


func _draw_source_diagnostic() -> void:
	draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#0a1019"))
	_draw_checker(Rect2(0.0, 100.0, DESIGN_SIZE.x, 908.0), 48.0)
	var ground_point: Vector2 = Vector2(960.0, 930.0)
	_draw_review_ground(ground_point, 360.0)
	_draw_combatant_at(ground_point, _source_diagnostic_scale())
	var strict_bounds: Rect2i = alpha_scan.get("strict_bounds", Rect2i()) as Rect2i
	var substantive_bounds: Rect2i = alpha_scan.get("substantive_bounds", Rect2i()) as Rect2i
	var expected_dimensions: Vector2i = _array_to_vector2i(asset_record.get("expectedDimensions", []))
	var proposed_anchor: Vector2i = _array_to_vector2i(asset_record.get("proposedGroundAnchor", []))
	var strict_margins: Vector4i = Vector4i(strict_bounds.position.x, strict_bounds.position.y, expected_dimensions.x - strict_bounds.end.x, expected_dimensions.y - strict_bounds.end.y)
	var substantive_margins: Vector4i = Vector4i(substantive_bounds.position.x, substantive_bounds.position.y, expected_dimensions.x - substantive_bounds.end.x, expected_dimensions.y - substantive_bounds.end.y)
	var study_id: String = str(asset_record.get("studyId", "unknown"))
	var font: Font = ThemeDB.fallback_font
	_draw_panel(Rect2(24.0, 126.0, 470.0, 284.0), UI_RED)
	draw_string(font, Vector2(48.0, 162.0), "%s • EXACT ALPHA DIAGNOSTIC" % str(asset_record.get("label", "UNKNOWN CHOICE")), HORIZONTAL_ALIGNMENT_LEFT, 420.0, 17, UI_RED)
	draw_string(font, Vector2(48.0, 194.0), "RGBA8 • transparent + partial alpha • portable copy", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(48.0, 226.0), "transparent %d  partial %d  opaque %d" % [int(alpha_scan.get("transparent", 0)), int(alpha_scan.get("partial", 0)), int(alpha_scan.get("opaque", 0))], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_MUTED)
	draw_string(font, Vector2(48.0, 258.0), "strict >0  x%d y%d w%d h%d" % [strict_bounds.position.x, strict_bounds.position.y, strict_bounds.size.x, strict_bounds.size.y], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_RED)
	draw_string(font, Vector2(48.0, 290.0), "alpha >=2  x%d y%d w%d h%d" % [substantive_bounds.position.x, substantive_bounds.position.y, substantive_bounds.size.x, substantive_bounds.size.y], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_CYAN)
	draw_string(font, Vector2(48.0, 322.0), "CROP: substantive silhouette PASS", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_GREEN)
	var edge_line: String = "EDGE: alpha=1 pixel (0,1268) BLOCKS strict gate" if study_id == "choice-a" else "EDGE: no alpha>0 pixels touch source edges • PASS"
	draw_string(font, Vector2(48.0, 354.0), edge_line, HORIZONTAL_ALIGNMENT_LEFT, 420.0, 13, UI_RED if study_id == "choice-a" else UI_GREEN)
	draw_string(font, Vector2(48.0, 386.0), "Exact values manifest-checked • startup scan cost is log-only", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 12, UI_MUTED)
	_draw_panel(Rect2(1426.0, 126.0, 470.0, 284.0), UI_GOLD)
	draw_string(font, Vector2(1450.0, 162.0), "REVIEW-ONLY GEOMETRY", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 17, UI_GOLD)
	draw_string(font, Vector2(1450.0, 194.0), "proposed anchor (%d,%d) • not approved" % [proposed_anchor.x, proposed_anchor.y], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(1450.0, 226.0), "proposed scale %.6f • 360 px @1080p" % _proposed_display_scale(), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_WHITE)
	draw_string(font, Vector2(1450.0, 258.0), "alpha>=2 margins L%d T%d R%d B%d" % [substantive_margins.x, substantive_margins.y, substantive_margins.z, substantive_margins.w], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_MUTED)
	draw_string(font, Vector2(1450.0, 290.0), "provisional target L32 T32 R32 B40", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_MUTED)
	var margin_line: String = "SAFE TOP: %d < 32 • BLOCKER" % substantive_margins.y if study_id == "choice-a" else "SAFE BOTTOM: %d < 40 (strict %d) • BLOCKER" % [substantive_margins.w, strict_margins.w]
	draw_string(font, Vector2(1450.0, 322.0), margin_line, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_RED)
	draw_string(font, Vector2(1450.0, 354.0), "%dx%d source • not a 512x512 cell" % [expected_dimensions.x, expected_dimensions.y], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_RED)
	draw_string(font, Vector2(1450.0, 386.0), "No clips, sockets, masks, timing, or package.", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 12, UI_GOLD)


func _draw_combatant_at(ground_point: Vector2, display_scale: float) -> void:
	var proposed_anchor: Vector2 = Vector2(_array_to_vector2i(asset_record.get("proposedGroundAnchor", [])))
	var texture_rect: Rect2 = _full_texture_rect(ground_point, proposed_anchor, display_scale)
	draw_texture_rect(asset_texture, texture_rect, false)
	if not show_overlays:
		return
	var source_extent: Rect2 = texture_rect
	var strict_bounds: Rect2i = alpha_scan.get("strict_bounds", Rect2i()) as Rect2i
	var substantive_bounds: Rect2i = alpha_scan.get("substantive_bounds", Rect2i()) as Rect2i
	var safe_inset: Rect2i = Rect2i(32, 32, asset_image.get_width() - 64, asset_image.get_height() - 72)
	draw_rect(source_extent, Color(UI_MUTED, 0.68), false, 1.5)
	draw_rect(_source_rect_to_screen(safe_inset, texture_rect, display_scale), Color(UI_GOLD, 0.82), false, 2.0)
	draw_rect(_source_rect_to_screen(strict_bounds, texture_rect, display_scale), Color(UI_RED, 0.92), false, 2.2)
	draw_rect(_source_rect_to_screen(substantive_bounds, texture_rect, display_scale), Color(UI_CYAN, 0.92), false, 2.2)
	draw_line(ground_point + Vector2(-22.0, 0.0), ground_point + Vector2(22.0, 0.0), UI_GREEN, 3.0, true)
	draw_line(ground_point + Vector2(0.0, -22.0), ground_point + Vector2(0.0, 22.0), UI_GREEN, 3.0, true)
	var residue_value: Variant = asset_record.get("knownEdgeResidue", null)
	if residue_value is Dictionary:
		var residue: Dictionary = residue_value as Dictionary
		var edge_pixel: Vector2 = texture_rect.position + Vector2(float(residue.get("x", 0)) + 0.5, float(residue.get("y", 0)) + 0.5) * display_scale
		draw_circle(edge_pixel, 8.0, Color(UI_RED, 0.20))
		draw_arc(edge_pixel, 10.0, 0.0, TAU, 24, UI_RED, 2.0, true)


func _source_rect_to_screen(source_rect: Rect2i, texture_rect: Rect2, display_scale: float) -> Rect2:
	return Rect2(texture_rect.position + Vector2(source_rect.position) * display_scale, Vector2(source_rect.size) * display_scale)


func _draw_review_ground(ground_point: Vector2, half_width: float) -> void:
	_draw_ellipse_shape(ground_point + Vector2(0.0, 7.0), Vector2(half_width * 0.42, 14.0), Color(0.0, 0.0, 0.0, 0.54))
	draw_line(ground_point + Vector2(-half_width, 0.0), ground_point + Vector2(half_width, 0.0), Color(UI_GREEN, 0.52), 2.0)


func _draw_checker(rect: Rect2, cell_size: float) -> void:
	var rows: int = ceili(rect.size.y / cell_size)
	var columns: int = ceili(rect.size.x / cell_size)
	for row: int in range(rows):
		for column: int in range(columns):
			var tone: Color = Color("#d8dde4") if (row + column) % 2 == 0 else Color("#85909e")
			var cell_position: Vector2 = rect.position + Vector2(float(column) * cell_size, float(row) * cell_size)
			var cell_dimensions: Vector2 = Vector2(minf(cell_size, rect.end.x - cell_position.x), minf(cell_size, rect.end.y - cell_position.y))
			draw_rect(Rect2(cell_position, cell_dimensions), tone)


func _draw_header() -> void:
	var font: Font = ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 0.0, DESIGN_SIZE.x, 100.0), Color(0.003, 0.008, 0.020, 0.96))
	draw_line(Vector2(0.0, 100.0), Vector2(DESIGN_SIZE.x, 100.0), Color(UI_CYAN, 0.48), 2.0)
	draw_string(font, Vector2(24.0, 34.0), "POWER MELEE IDLE-KEYFRAME A/B STUDY", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 22, UI_WHITE)
	draw_string(font, Vector2(24.0, 63.0), "UNAPPROVED • ONE FRAME PER CHOICE • NOT RASTER PACKAGES • NOT REGISTERED", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_RED)
	draw_string(font, Vector2(24.0, 86.0), _view_label(), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 12, UI_CYAN)
	draw_string(font, Vector2(830.0, 34.0), str(asset_record.get("label", "UNKNOWN CHOICE")), HORIZONTAL_ALIGNMENT_CENTER, 350.0, 15, UI_GOLD)
	draw_string(font, Vector2(830.0, 61.0), "C toggles active matte/diagnostic study", HORIZONTAL_ALIGNMENT_CENTER, 350.0, 11, UI_MUTED)
	for pipeline_index: int in range(2):
		var x: float = 1218.0 + float(pipeline_index) * 346.0
		var selected: bool = pipeline_index == active_pipeline_index
		var border_color: Color = UI_GOLD if selected else Color(UI_MUTED, 0.52)
		draw_rect(Rect2(x, 14.0, 330.0, 72.0), Color(0.02, 0.03, 0.05, 0.88))
		draw_rect(Rect2(x, 14.0, 330.0, 72.0), border_color, false, 2.0)
		var pipeline: Dictionary = motion_records[pipeline_index] as Dictionary if pipeline_index < motion_records.size() and motion_records[pipeline_index] is Dictionary else {}
		draw_string(font, Vector2(x + 14.0, 41.0), str(pipeline.get("label", "MOTION PLACEHOLDER")), HORIZONTAL_ALIGNMENT_LEFT, 302.0, 13, UI_WHITE)
		draw_string(font, Vector2(x + 14.0, 66.0), "PLACEHOLDER ONLY • SAME IDLE PIXELS", HORIZONTAL_ALIGNMENT_LEFT, 302.0, 11, UI_GOLD if selected else UI_MUTED)


func _draw_footer() -> void:
	var font: Font = ThemeDB.fallback_font
	draw_rect(Rect2(0.0, 1008.0, DESIGN_SIZE.x, 72.0), Color(0.003, 0.008, 0.020, 0.96))
	draw_line(Vector2(0.0, 1008.0), Vector2(DESIGN_SIZE.x, 1008.0), Color(UI_CYAN, 0.42), 1.0)
	var validation_label: String = "RGBA/CROP PASS • A STRICT alpha=1 EDGE FAIL • A TOP FAIL • B BOTTOM FAIL • PACKAGES INCOMPLETE"
	var validation_color: Color = UI_RED if validation_errors.is_empty() else Color("#fda4af")
	draw_string(font, Vector2(24.0, 1038.0), validation_label, HORIZONTAL_ALIGNMENT_LEFT, 1260.0, 13, validation_color)
	draw_string(font, Vector2(24.0, 1065.0), "1 mattes • 2/3 neutral backgrounds (both choices) • 4 source • C choice • P motion placeholder • O overlays • Z scale • R reset", HORIZONTAL_ALIGNMENT_LEFT, 1500.0, 12, UI_MUTED)
	draw_string(font, Vector2(1540.0, 1038.0), "HEIGHT %.0f @1080 / %.0f @720" % [_current_visible_height(), _current_visible_height() * (2.0 / 3.0)], HORIZONTAL_ALIGNMENT_RIGHT, 350.0, 12, UI_CYAN)
	draw_string(font, Vector2(1540.0, 1065.0), "PROPOSED • NOT APPROVED", HORIZONTAL_ALIGNMENT_RIGHT, 350.0, 12, UI_GOLD)


func _draw_panel(rect: Rect2, accent: Color) -> void:
	draw_rect(rect, Color(0.003, 0.008, 0.020, 0.90))
	draw_rect(Rect2(rect.position, Vector2(4.0, rect.size.y)), accent)
	draw_rect(rect, Color(accent, 0.38), false, 1.0)


func _draw_load_failure() -> void:
	draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#100309"))
	var font: Font = ThemeDB.fallback_font
	draw_rect(Rect2(250.0, 330.0, 1420.0, 420.0), Color(0.25, 0.015, 0.035, 0.96))
	draw_string(font, Vector2(300.0, 392.0), "COMBATANT STUDY VALIDATION FAILED", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 30, Color("#fda4af"))
	for error_index: int in range(mini(validation_errors.size(), 8)):
		draw_string(font, Vector2(300.0, 446.0 + float(error_index) * 36.0), "• %s" % validation_errors[error_index], HORIZONTAL_ALIGNMENT_LEFT, 1320.0, 15, UI_WHITE)


func _view_label() -> String:
	if view_mode == VIEW_MATTES:
		return "VIEW 1 • %s • DARK / LIGHT / CHECKER • IDENTICAL BATTLE SCALE" % str(asset_record.get("studyId", "choice")).to_upper()
	if view_mode == VIEW_BACKGROUND_A:
		return "VIEW 2 • EMPIRE BACKGROUND A • UNAPPROVED / NEUTRAL"
	if view_mode == VIEW_BACKGROUND_B:
		return "VIEW 3 • EMPIRE BACKGROUND B • UNAPPROVED / NEUTRAL"
	return "VIEW 4 • %s • SOURCE ALPHA / BOUNDS / ANCHOR DIAGNOSTIC" % str(asset_record.get("studyId", "choice")).to_upper()


func _draw_ellipse_shape(center: Vector2, radii: Vector2, color: Color) -> void:
	var points: PackedVector2Array = PackedVector2Array()
	for point_index: int in range(36):
		var angle: float = TAU * float(point_index) / 36.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)
