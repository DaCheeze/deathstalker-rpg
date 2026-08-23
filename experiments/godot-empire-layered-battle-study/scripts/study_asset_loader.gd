extends RefCounted

const MANIFEST_PATH := "res://study/study_manifest.json"
const EXPECTED_FORMAT := "deathstalker-godot-empire-layered-battle-study"
const EXPECTED_CHOICES: Array[String] = ["A", "B"]
const EXPECTED_LAYERS: Array[String] = ["far_backdrop", "stage_floor", "foreground_occluder"]
const EXPECTED_CANDIDATE_IDS := {
	"far_backdrop": "background-empire-skirmish",
	"stage_floor": "stage-floor-imperial",
	"foreground_occluder": "foreground-occluder-imperial",
}
const DESIGN_SIZE := Vector2i(1920, 1080)
const RENDER_SIZE := Vector2i(960, 540)

var manifest: Dictionary = {}
var validation_errors: Array[String] = []
var textures: Dictionary = {}
var source_metrics: Dictionary = {}


func load_and_validate() -> bool:
	validation_errors.clear()
	textures.clear()
	source_metrics.clear()
	manifest.clear()
	_load_manifest()
	if manifest.is_empty():
		return false
	_validate_manifest_contract()
	if not validation_errors.is_empty():
		return false
	for choice: String in EXPECTED_CHOICES:
		_load_choice(choice)
	_validate_choice_separation()
	return validation_errors.is_empty()


func texture_for(choice: String, layer_id: String) -> Texture2D:
	var choice_textures_value: Variant = textures.get(choice, {})
	if not (choice_textures_value is Dictionary):
		return null
	var texture_value: Variant = (choice_textures_value as Dictionary).get(layer_id)
	if texture_value is Texture2D:
		return texture_value as Texture2D
	return null


func label_for(choice: String) -> String:
	var variants_value: Variant = manifest.get("variants", {})
	if not (variants_value is Dictionary):
		return "UNKNOWN IMPERIAL STUDY CHOICE"
	var record_value: Variant = (variants_value as Dictionary).get(choice, {})
	if record_value is Dictionary:
		return str((record_value as Dictionary).get("label", "UNKNOWN IMPERIAL STUDY CHOICE"))
	return "UNKNOWN IMPERIAL STUDY CHOICE"


func metrics_copy() -> Dictionary:
	return source_metrics.duplicate(true)


func errors_copy() -> Array[String]:
	return validation_errors.duplicate()


func _load_manifest() -> void:
	var file := FileAccess.open(MANIFEST_PATH, FileAccess.READ)
	if file == null:
		_fail("Missing study manifest: %s" % MANIFEST_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not (parsed is Dictionary):
		_fail("Study manifest must parse as a JSON object.")
		return
	manifest = parsed as Dictionary


func _validate_manifest_contract() -> void:
	if str(manifest.get("format", "")) != EXPECTED_FORMAT:
		_fail("Study manifest format is not %s." % EXPECTED_FORMAT)
	if int(manifest.get("schemaVersion", 0)) != 1:
		_fail("Study manifest schemaVersion must be 1.")
	if _array_to_vector2i(manifest.get("referenceViewport", [])) != DESIGN_SIZE:
		_fail("Study referenceViewport must remain 1920x1080.")
	if _array_to_vector2i(manifest.get("worldCompositeViewport", [])) != RENDER_SIZE:
		_fail("Study worldCompositeViewport must remain 960x540.")
	var status_value: Variant = manifest.get("studyStatus", {})
	if not (status_value is Dictionary):
		_fail("Study manifest requires an explicit unapproved status block.")
	else:
		var status: Dictionary = status_value as Dictionary
		if str(status.get("approval", "")) != "proposed" or str(status.get("selection", "")) != "unselected" or str(status.get("integration", "")) != "isolated_review_only" or str(status.get("runtimeManifest", "")) != "not_registered":
			_fail("Study status must remain proposed, unselected, isolated, and unregistered.")
	for document_key: String in ["catalogPath", "readinessPath", "provenanceRegisterPath"]:
		_validate_repository_reference(str(manifest.get(document_key, "")), document_key)
	var review_sheets_value: Variant = manifest.get("reviewSheets", [])
	if not (review_sheets_value is Array) or (review_sheets_value as Array).size() != 2:
		_fail("Study manifest must preserve both exact review-sheet references.")
	else:
		for sheet_value: Variant in review_sheets_value as Array:
			_validate_repository_reference(str(sheet_value), "review sheet")
	var variants_value: Variant = manifest.get("variants", {})
	if not (variants_value is Dictionary):
		_fail("Study manifest variants must be an object.")
		return
	var variants: Dictionary = variants_value as Dictionary
	if variants.size() != 2 or not variants.has("A") or not variants.has("B"):
		_fail("Study manifest must contain exactly A and B variants.")


func _load_choice(choice: String) -> void:
	var variants_value: Variant = manifest.get("variants", {})
	if not (variants_value is Dictionary):
		_fail("Missing variants object while loading choice %s." % choice)
		return
	var choice_value: Variant = (variants_value as Dictionary).get(choice, {})
	if not (choice_value is Dictionary):
		_fail("Missing choice %s record." % choice)
		return
	var layers_value: Variant = (choice_value as Dictionary).get("layers", {})
	if not (layers_value is Dictionary):
		_fail("Choice %s layers must be an object." % choice)
		return
	var layers: Dictionary = layers_value as Dictionary
	if layers.size() != EXPECTED_LAYERS.size():
		_fail("Choice %s must declare exactly backdrop, floor, and foreground layers." % choice)
	var choice_textures: Dictionary = {}
	var choice_metrics: Dictionary = {}
	for layer_id: String in EXPECTED_LAYERS:
		var layer_value: Variant = layers.get(layer_id, {})
		if not (layer_value is Dictionary):
			_fail("Choice %s is missing layer %s." % [choice, layer_id])
			continue
		var loaded: Dictionary = _load_layer_asset(choice, layer_id, layer_value as Dictionary)
		var texture_value: Variant = loaded.get("texture")
		if texture_value is Texture2D:
			choice_textures[layer_id] = texture_value
		choice_metrics[layer_id] = loaded.get("metrics", {})
	textures[choice] = choice_textures
	source_metrics[choice] = choice_metrics


func _load_layer_asset(choice: String, layer_id: String, record: Dictionary) -> Dictionary:
	if str(record.get("candidateId", "")) != str(EXPECTED_CANDIDATE_IDS[layer_id]):
		_fail("Choice %s layer %s has the wrong catalog candidate ID." % [choice, layer_id])
	if str(record.get("choice", "")) != choice:
		_fail("Choice %s layer %s does not preserve its catalog choice letter." % [choice, layer_id])
	var relative_path := str(record.get("path", "")).replace("\\", "/")
	if not _is_safe_repository_relative_path(relative_path) or not relative_path.begins_with("art/choices/"):
		_fail("Choice %s layer %s uses an unsafe or non-candidate path: %s" % [choice, layer_id, relative_path])
		return {}
	var absolute_path := _repo_root().path_join(relative_path).simplify_path()
	if not FileAccess.file_exists(absolute_path):
		_fail("Missing source asset: %s" % absolute_path)
		return {}
	var expected_hash := str(record.get("sha256", "")).to_upper()
	var actual_hash := _sha256_file(absolute_path)
	if expected_hash.length() != 64 or actual_hash != expected_hash:
		_fail("Source hash mismatch for %s: expected %s, received %s" % [relative_path, expected_hash, actual_hash])
	var image := Image.new()
	var load_result := image.load(absolute_path)
	if load_result != OK:
		_fail("Could not decode %s (error %d)." % [relative_path, load_result])
		return {}
	var expected_dimensions := _array_to_vector2i(record.get("expectedDimensions", []))
	if expected_dimensions != DESIGN_SIZE or Vector2i(image.get_width(), image.get_height()) != DESIGN_SIZE:
		_fail("Source dimensions must remain exactly 1920x1080: %s" % relative_path)
	var expected_alpha := str(record.get("expectedAlpha", ""))
	var alpha_min := 255
	var alpha_max := 255
	if expected_alpha == "none_opaque_rgb8":
		if image.get_format() != Image.FORMAT_RGB8:
			_fail("Opaque backdrop must decode as RGB8 with no alpha: %s (format %d)" % [relative_path, image.get_format()])
	elif expected_alpha == "straight_rgba8_with_transparency":
		if image.get_format() != Image.FORMAT_RGBA8:
			_fail("Transparent layer must decode as RGBA8: %s (format %d)" % [relative_path, image.get_format()])
		else:
			var alpha_range := _rgba8_alpha_range(image)
			alpha_min = alpha_range.x
			alpha_max = alpha_range.y
			if alpha_min != 0 or alpha_max != 255:
				_fail("Transparent layer must contain both fully transparent and fully opaque pixels: %s (alpha %d-%d)" % [relative_path, alpha_min, alpha_max])
	else:
		_fail("Unsupported expectedAlpha contract for %s." % relative_path)
	var render_image := image.duplicate()
	render_image.resize(RENDER_SIZE.x, RENDER_SIZE.y, Image.INTERPOLATE_LANCZOS)
	return {
		"texture": ImageTexture.create_from_image(render_image),
		"metrics": {
			"path": relative_path,
			"sha256": actual_hash,
			"width": image.get_width(),
			"height": image.get_height(),
			"format": image.get_format(),
			"alpha_min": alpha_min,
			"alpha_max": alpha_max,
		},
	}


func _validate_choice_separation() -> void:
	for layer_id: String in EXPECTED_LAYERS:
		var choice_a_value: Variant = source_metrics.get("A", {})
		var choice_b_value: Variant = source_metrics.get("B", {})
		if not (choice_a_value is Dictionary) or not (choice_b_value is Dictionary):
			_fail("Missing source metrics while comparing %s." % layer_id)
			continue
		var metrics_a_value: Variant = (choice_a_value as Dictionary).get(layer_id, {})
		var metrics_b_value: Variant = (choice_b_value as Dictionary).get(layer_id, {})
		if not (metrics_a_value is Dictionary) or not (metrics_b_value is Dictionary):
			_fail("Missing A/B source metrics for %s." % layer_id)
			continue
		var hash_a := str((metrics_a_value as Dictionary).get("sha256", ""))
		var hash_b := str((metrics_b_value as Dictionary).get("sha256", ""))
		if hash_a.is_empty() or hash_a == hash_b:
			_fail("Layer %s must preserve two distinct A/B source files." % layer_id)


func _validate_repository_reference(relative_path: String, label: String) -> void:
	var normalized := relative_path.replace("\\", "/")
	if not _is_safe_repository_relative_path(normalized):
		_fail("Manifest %s path is unsafe: %s" % [label, normalized])
		return
	if not FileAccess.file_exists(_repo_root().path_join(normalized).simplify_path()):
		_fail("Manifest %s is missing: %s" % [label, normalized])


func _is_safe_repository_relative_path(path: String) -> bool:
	return not path.is_empty() and not path.is_absolute_path() and not path.begins_with("/") and not path.contains("../") and not path.contains("/..")


func _repo_root() -> String:
	return ProjectSettings.globalize_path("res://").path_join("../..").simplify_path()


func _sha256_file(path: String) -> String:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return ""
	var context := HashingContext.new()
	if context.start(HashingContext.HASH_SHA256) != OK:
		return ""
	while not file.eof_reached():
		var chunk := file.get_buffer(65536)
		if not chunk.is_empty():
			context.update(chunk)
	return context.finish().hex_encode().to_upper()


func _rgba8_alpha_range(image: Image) -> Vector2i:
	var bytes := image.get_data()
	var alpha_min := 255
	var alpha_max := 0
	for byte_index: int in range(3, bytes.size(), 4):
		var alpha := int(bytes[byte_index])
		alpha_min = mini(alpha_min, alpha)
		alpha_max = maxi(alpha_max, alpha)
	return Vector2i(alpha_min, alpha_max)


func _array_to_vector2i(value: Variant) -> Vector2i:
	if value is Array:
		var components: Array = value as Array
		if components.size() == 2:
			return Vector2i(int(components[0]), int(components[1]))
	return Vector2i(-1, -1)


func _fail(message: String) -> void:
	if not validation_errors.has(message):
		validation_errors.append(message)
	push_error("[Empire Layer Study] %s" % message)
